// use-live-api.ts
'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

const MODEL = 'models/gemini-2.0-flash-exp';
const API_URL =
    'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';

interface UseLiveApiOptions {
    onToolCall?: (tool: string, args: any) => Promise<any>;
    muted?: boolean;
}

interface ConnectOptions {
    apiKey: string;
    context?: string;
    tools?: any[];
    systemInstruction?: string;
}

export function useLiveApi({ onToolCall, muted = false }: UseLiveApiOptions = {}) {
    /* ----------------------------- UI State ----------------------------- */
    const [isConnected, setIsConnected] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    /* --------------------------- Core Refs ------------------------------- */
    const socketRef = useRef<WebSocket | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null);
    const inputCtxRef = useRef<AudioContext | null>(null);
    const workletRef = useRef<AudioWorkletNode | null>(null);
    const outputCtxRef = useRef<AudioContext | null>(null);

    // Queues for decoupled processing
    const responseQueueRef = useRef<any[]>([]);
    const audioQueueRef = useRef<Float32Array[]>([]);

    // Control flags for loops
    const isProcessingRef = useRef(false);
    const isPlayingRef = useRef(false);

    // Audio scheduling
    // Audio scheduling
    const nextPlayTimeRef = useRef(0);
    const scheduledSourcesRef = useRef<AudioBufferSourceNode[]>([]);

    // Mute state ref for audio callback access
    const mutedRef = useRef(muted);
    useEffect(() => {
        mutedRef.current = muted;
    }, [muted]);

    /* ---------------------- Loop Logic ----------------------------- */

    // Process incoming server messages
    const processMessages = useCallback(async () => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;

        try {
            while (isConnected && socketRef.current?.readyState === WebSocket.OPEN) {
                const msg = responseQueueRef.current.shift();

                if (!msg) {
                    await new Promise(r => setTimeout(r, 20));
                    continue;
                }

                // Handle interruption
                if (msg.serverContent?.interrupted) {
                    // Clear queues and stop playback immediately
                    audioQueueRef.current = [];
                    responseQueueRef.current = []; // also clear pending responses
                    stopAllScheduledAudio();
                    setIsSpeaking(false);
                    continue;
                }

                // Handle Audio
                const parts = msg?.serverContent?.modelTurn?.parts ?? [];
                for (const part of parts) {
                    if (part.inlineData?.mimeType?.startsWith('audio/pcm')) {
                        const pcm = base64ToFloat32(part.inlineData.data);
                        audioQueueRef.current.push(pcm);
                    }
                }

                // Handle Tool Calls
                if (msg.toolCall && onToolCall) {
                    const responses = [];
                    for (const fc of msg.toolCall.functionCalls) {
                        try {
                            await onToolCall(fc.name, fc.args);
                            responses.push({ id: fc.id, name: fc.name, response: { result: 'ok' } });
                        } catch (e: any) {
                            responses.push({
                                id: fc.id,
                                name: fc.name,
                                response: { error: e.message }
                            });
                        }
                    }
                    socketRef.current?.send(JSON.stringify({ toolResponse: { functionResponses: responses } }));
                }

                // Yield to event loop occasionally
                if (responseQueueRef.current.length === 0) {
                    await new Promise(r => setTimeout(r, 0));
                }
            }
        } finally {
            isProcessingRef.current = false;
        }
    }, [onToolCall, isConnected]);


    // Playback loop
    const playbackLoop = useCallback(async () => {
        if (isPlayingRef.current) return;
        isPlayingRef.current = true;

        try {
            while (isConnected) {
                if (!outputCtxRef.current) {
                    await new Promise(r => setTimeout(r, 50));
                    continue;
                }

                if (audioQueueRef.current.length > 0) {
                    setIsSpeaking(true);
                    const pcm = audioQueueRef.current.shift()!;
                    scheduleFrame(pcm, outputCtxRef.current);
                } else {
                    // Check if we are actually still playing audio
                    if (outputCtxRef.current.currentTime >= nextPlayTimeRef.current) {
                        setIsSpeaking(false);
                    }
                    await new Promise(r => setTimeout(r, 20));
                }
            }
        } finally {
            isPlayingRef.current = false;
        }
    }, [isConnected]);

    // Schedule a single frame
    const scheduleFrame = (pcm: Float32Array, ctx: AudioContext) => {
        const buffer = ctx.createBuffer(1, pcm.length, 24000);
        buffer.copyToChannel(pcm as Float32Array<ArrayBuffer>, 0);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);

        const now = ctx.currentTime;
        // Schedule next chunk slightly ahead to prevent gaps, but not too far
        const startTime = Math.max(now, nextPlayTimeRef.current);

        source.start(startTime);
        scheduledSourcesRef.current.push(source);

        // Clean up finished sources
        source.onended = () => {
            const idx = scheduledSourcesRef.current.indexOf(source);
            if (idx > -1) scheduledSourcesRef.current.splice(idx, 1);
        };

        nextPlayTimeRef.current = startTime + buffer.duration;
    };

    const stopAllScheduledAudio = () => {
        scheduledSourcesRef.current.forEach(s => {
            try { s.stop(); } catch (e) { }
        });
        scheduledSourcesRef.current = [];
        if (outputCtxRef.current) {
            nextPlayTimeRef.current = outputCtxRef.current.currentTime;
        }
    };


    /* ---------------------- Connection Logic ----------------------------- */

    const connect = useCallback(async ({ apiKey, context, tools, systemInstruction }: ConnectOptions) => {
        if (!apiKey) throw new Error('Missing API key');

        // 1. Setup Microphone
        const micStream = await navigator.mediaDevices.getUserMedia({
            audio: { sampleRate: 16000, channelCount: 1 }
        });
        micStreamRef.current = micStream;

        const inputCtx = new AudioContext({ sampleRate: 16000 });
        inputCtxRef.current = inputCtx;

        await inputCtx.audioWorklet.addModule('/audio-processor.js');

        const micSource = inputCtx.createMediaStreamSource(micStream);
        const recorder = new AudioWorkletNode(inputCtx, 'audio-recorder');
        micSource.connect(recorder);
        workletRef.current = recorder;

        // 2. Setup Output
        const outputCtx = new AudioContext({ sampleRate: 24000 });
        outputCtxRef.current = outputCtx;
        nextPlayTimeRef.current = outputCtx.currentTime;


        // 3. Connect WebSocket
        const socket = new WebSocket(`${API_URL}?key=${apiKey}`);
        socketRef.current = socket;

        socket.onopen = () => {
            setIsConnected(true);
            socket.send(JSON.stringify({
                setup: {
                    model: MODEL,
                    systemInstruction: {
                        parts: [{ text: systemInstruction || `You are a disciplined research co-author.\n\n${context || ''}` }]
                    },
                    tools: tools ? tools : undefined,
                    generationConfig: {
                        responseModalities: ['AUDIO'],
                        speechConfig: {
                            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
                        }
                    }
                }
            }));

            // Start loops
            processMessages();
            playbackLoop();
        };

        socket.onmessage = async (event) => {
            const text = event.data instanceof Blob ? await event.data.text() : event.data;
            const msg = JSON.parse(text);
            responseQueueRef.current.push(msg);
        };

        socket.onclose = () => setIsConnected(false);
        socket.onerror = console.error;

        // 4. Send Mic Audio
        recorder.port.onmessage = (e) => {
            if (socket.readyState !== WebSocket.OPEN || mutedRef.current) return;
            const int16 = float32ToInt16(e.data);
            socket.send(JSON.stringify({
                realtimeInput: {
                    mediaChunks: [{
                        mimeType: 'audio/pcm;rate=16000',
                        data: arrayBufferToBase64(int16.buffer)
                    }]
                }
            }));
        };

    }, [processMessages, playbackLoop]);


    /* ------------------------- Disconnect -------------------------------- */

    const disconnect = useCallback(() => {
        socketRef.current?.close();
        micStreamRef.current?.getTracks().forEach(t => t.stop());
        inputCtxRef.current?.close();
        outputCtxRef.current?.close();

        // Stop any currently playing audio
        stopAllScheduledAudio();

        socketRef.current = null;
        micStreamRef.current = null;
        inputCtxRef.current = null;
        outputCtxRef.current = null;

        responseQueueRef.current = [];
        audioQueueRef.current = [];

        setIsConnected(false);
        setIsSpeaking(false);
    }, []);

    // Ensure processing loops start when connected (triggered by state change if needed, but we call them in onopen)
    useEffect(() => {
        if (isConnected) {
            processMessages();
            playbackLoop();
        }
    }, [isConnected, processMessages, playbackLoop]);



    /* ------------------------- Helper Functions -------------------------- */

    const sendText = useCallback((text: string, endTurn = true) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

        socketRef.current.send(JSON.stringify({
            clientContent: {
                turns: [{
                    role: 'user',
                    parts: [{ text }]
                }],
                turnComplete: endTurn
            }
        }));
    }, []);

    return { connect, disconnect, isConnected, isSpeaking, sendText };
}

/* ============================= Utils ================================= */

function float32ToInt16(float32: Float32Array) {
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
        int16[i] = Math.max(-1, Math.min(1, float32[i])) * 0x7fff;
    }
    return int16;
}

function base64ToFloat32(base64: string) {
    const binary = atob(base64);
    const buffer = new ArrayBuffer(binary.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);
    const int16 = new Int16Array(buffer);
    return Float32Array.from(int16, x => x / 32768);
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}
