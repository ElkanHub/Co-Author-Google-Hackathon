// use-live-api.ts
'use client';

import { useRef, useState, useCallback } from 'react';

const MODEL = 'models/gemini-2.0-flash-exp';
const API_URL =
    'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';

/**
 * This hook manages:
 * - microphone capture
 * - streaming audio to Gemini Live
 * - receiving streamed PCM audio
 * - smooth, jitter-free playback
 */
export function useLiveApi({ onToolCall }: { onToolCall?: (tool: string, args: any) => Promise<any> } = {}) {
    /* ----------------------------- UI State ----------------------------- */
    const [isConnected, setIsConnected] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    /* --------------------------- Core Refs ------------------------------- */
    const socketRef = useRef<WebSocket | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null);

    // Input audio context (mic → Gemini)
    const inputCtxRef = useRef<AudioContext | null>(null);
    const workletRef = useRef<AudioWorkletNode | null>(null);

    // Output audio context (Gemini → speakers)
    const outputCtxRef = useRef<AudioContext | null>(null);

    /* --------------------- Playback Buffering ---------------------------- */

    /**
     * Raw PCM chunks arrive in unpredictable sizes.
     * We aggregate them into stable frames before playback.
     */
    const pcmAccumulatorRef = useRef<Float32Array[]>([]);
    const accumulatedSamplesRef = useRef(0);

    /**
     * Final playback queue (jitter buffer)
     * Always keep a few frames ahead of playback.
     */
    const playbackQueueRef = useRef<Float32Array[]>([]);
    const isDrainingRef = useRef(false);

    /**
     * Audio clock scheduling
     */
    const nextPlayTimeRef = useRef(0);

    /* ------------------------ Constants ---------------------------------- */

    const TARGET_FRAME_SIZE = 2048; // ~85ms @ 24kHz (stable speech)
    const MIN_QUEUE_FRAMES = 3;     // ~250ms jitter buffer

    /* ---------------------- Connection Logic ----------------------------- */

    const connect = useCallback(async (apiKey: string, context: string) => {
        if (!apiKey) throw new Error('Missing API key');

        /* ---------------------- Microphone Setup --------------------------- */

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

        /* ---------------------- Output Audio Setup -------------------------- */

        const outputCtx = new AudioContext({ sampleRate: 24000 });
        outputCtxRef.current = outputCtx;

        /* ------------------------ WebSocket -------------------------------- */

        const socket = new WebSocket(`${API_URL}?key=${apiKey}`);
        socketRef.current = socket;

        socket.onopen = () => {
            setIsConnected(true);

            socket.send(JSON.stringify({
                setup: {
                    model: MODEL,
                    systemInstruction: {
                        parts: [{ text: `You are a disciplined research co-author.\n\n${context}` }]
                    },
                    generationConfig: {
                        responseModalities: ['AUDIO'],
                        speechConfig: {
                            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
                        }
                    }
                }
            }));
        };

        /* ------------------ Receive Gemini Audio ---------------------------- */

        socket.onmessage = async (event) => {
            const text = event.data instanceof Blob ? await event.data.text() : event.data;
            const msg = JSON.parse(text);

            // Handle streamed audio
            const parts = msg?.serverContent?.modelTurn?.parts ?? [];
            for (const part of parts) {
                if (part.inlineData?.mimeType?.startsWith('audio/pcm')) {
                    const pcm = base64ToFloat32(part.inlineData.data);
                    handleIncomingPCM(pcm);
                }
            }

            // Handle tool calls
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

                socket.send(JSON.stringify({ toolResponse: { functionResponses: responses } }));
            }
        };

        socket.onclose = () => setIsConnected(false);
        socket.onerror = console.error;

        /* ------------------ Send Mic Audio (Throttled) ---------------------- */

        recorder.port.onmessage = (e) => {
            if (socket.readyState !== WebSocket.OPEN) return;

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

    }, [onToolCall]);

    /* ---------------------- Incoming Audio Handling ---------------------- */

    function handleIncomingPCM(pcm: Float32Array) {
        pcmAccumulatorRef.current.push(pcm);
        accumulatedSamplesRef.current += pcm.length;

        if (accumulatedSamplesRef.current >= TARGET_FRAME_SIZE) {
            const frame = mergeFloat32(pcmAccumulatorRef.current);
            pcmAccumulatorRef.current = [];
            accumulatedSamplesRef.current = 0;
            enqueueFrame(frame);
        }
    }

    function enqueueFrame(frame: Float32Array) {
        playbackQueueRef.current.push(frame);

        // Start playback only once we have enough buffered
        if (!isDrainingRef.current && playbackQueueRef.current.length >= MIN_QUEUE_FRAMES) {
            setIsSpeaking(true);
            drainPlaybackQueue();
        }
    }

    function drainPlaybackQueue() {
        if (!outputCtxRef.current) return;
        if (playbackQueueRef.current.length === 0) {
            isDrainingRef.current = false;
            setIsSpeaking(false);
            return;
        }

        isDrainingRef.current = true;
        const frame = playbackQueueRef.current.shift()!;
        scheduleFrame(frame, outputCtxRef.current);

        setTimeout(drainPlaybackQueue, 20);
    }

    function scheduleFrame(frame: Float32Array, ctx: AudioContext) {
        const buffer = ctx.createBuffer(1, frame.length, 24000);
        buffer.copyToChannel(frame as Float32Array<ArrayBuffer>, 0);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);

        const now = ctx.currentTime;
        if (nextPlayTimeRef.current < now) {
            nextPlayTimeRef.current = now + 0.05; // jitter safety
        }

        source.start(nextPlayTimeRef.current);
        nextPlayTimeRef.current += buffer.duration;
    }

    /* ------------------------- Disconnect -------------------------------- */

    const disconnect = useCallback(() => {
        socketRef.current?.close();
        micStreamRef.current?.getTracks().forEach(t => t.stop());
        inputCtxRef.current?.close();
        outputCtxRef.current?.close();

        socketRef.current = null;
        micStreamRef.current = null;
        inputCtxRef.current = null;
        outputCtxRef.current = null;

        playbackQueueRef.current = [];
        pcmAccumulatorRef.current = [];
        accumulatedSamplesRef.current = 0;
        nextPlayTimeRef.current = 0;

        setIsConnected(false);
        setIsSpeaking(false);
    }, []);

    return { connect, disconnect, isConnected, isSpeaking };
}

/* ============================= Utils ================================= */

function mergeFloat32(chunks: Float32Array[]) {
    const length = chunks.reduce((s, c) => s + c.length, 0);
    const result = new Float32Array(length);
    let offset = 0;
    for (const c of chunks) {
        result.set(c, offset);
        offset += c.length;
    }
    return result;
}

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
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}
