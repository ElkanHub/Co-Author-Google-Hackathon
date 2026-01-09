'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const MODEL = 'models/gemini-2.0-flash-exp';
const API_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

interface UseLiveApiProps {
    onToolCall?: (toolName: string, args: any) => Promise<any>;
}

export function useLiveApi({ onToolCall }: UseLiveApiProps = {}) {
    const [isConnected, setIsConnected] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false); // Validating if AI is speaking
    const [volume, setVolume] = useState(0); // For viz

    const socketRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Queue for playing audio response
    const audioQueueRef = useRef<Float32Array[]>([]);
    const isPlayingRef = useRef(false);
    const nextPlayTimeRef = useRef(0);

    const connect = useCallback(async (apiKey: string, context: string) => {
        if (!apiKey) {
            console.error("No API Key provided");
            return;
        }

        try {
            // 1. Setup Audio Input
            const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
            streamRef.current = stream;

            // Input Context (16kHz)
            const inputContext = new AudioContext({ sampleRate: 16000 });
            await inputContext.audioWorklet.addModule('/audio-processor.js');
            const source = inputContext.createMediaStreamSource(stream);
            const processor = new AudioWorkletNode(inputContext, 'audio-recorder');
            source.connect(processor);
            audioWorkletNodeRef.current = processor;

            // Output Context (24kHz for Gemini)
            const outputContext = new AudioContext({ sampleRate: 24000 });
            audioContextRef.current = outputContext;

            // 2. Setup WebSocket
            // WSS URL with key param
            const wsUrl = `${API_URL}?key=${apiKey}`;
            const socket = new WebSocket(wsUrl);
            socketRef.current = socket;

            socket.onopen = () => {
                setIsConnected(true);
                console.log('Gemini Live Connected');

                const inputRate = inputContext.sampleRate;
                console.log("Audio Input Sample Rate:", inputRate);

                // Initial Setup Message
                const setupMsg = {
                    setup: {
                        model: MODEL,
                        systemInstruction: {
                            parts: [{ text: `You are a helpful research co-author. The user is writing a document. Here implies context:\n${context}` }]
                        },
                        tools: [
                            {
                                googleSearch: {}
                            },
                            {
                                functionDeclarations: [{
                                    name: "write_to_ai_space",
                                    description: "Writes a generated research note, summary, or finding to the AI Space (a side panel for content).",
                                    parameters: {
                                        type: "OBJECT",
                                        properties: {
                                            title: { type: "STRING", description: "Title of the note" },
                                            content: { type: "STRING", description: "The markdown content to write." },
                                            type: { type: "STRING", enum: ["suggestion", "analysis", "citation"], description: "Type of content" }
                                        },
                                        required: ["title", "content", "type"]
                                    }
                                }]
                            }
                        ],
                        generationConfig: {
                            responseModalities: ["AUDIO"],
                            speechConfig: {
                                voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } }
                            }
                        }
                    }
                };
                console.log("Sending Setup Config:", setupMsg);
                socket.send(JSON.stringify(setupMsg));
            };

            socket.onmessage = async (event) => {
                let text = event.data;
                if (event.data instanceof Blob) {
                    text = await event.data.text();
                }
                const msg = JSON.parse(text);

                // Handle Audio
                if (msg.serverContent?.modelTurn?.parts) {
                    // console.log("Received Audio Part");
                    for (const part of msg.serverContent.modelTurn.parts) {
                        if (part.inlineData && part.inlineData.mimeType.startsWith('audio/pcm')) { // Normalize PCM
                            const base64 = part.inlineData.data;
                            const pcmData = base64ToFloat32(base64);
                            if (audioContextRef.current) {
                                scheduleAudio(pcmData, audioContextRef.current);
                            }
                        }
                    }
                }

                // Handle Tool Calls
                if (msg.toolCall) {
                    console.log("Tool Call Received:", msg.toolCall);
                    // Cancel audio playback on tool call (usually means it's thinking effectively or switching modes?) 
                    // Actually, keep playing audio if it sent some intro.

                    const functionResponses = [];

                    for (const fc of msg.toolCall.functionCalls) {
                        let result = { result: "ok" };

                        if (fc.name === "write_to_ai_space" && onToolCall) {
                            try {
                                await onToolCall("write_to_ai_space", fc.args);
                                result = { result: "Successfully wrote to AI space." };
                            } catch (e: any) {
                                result = { result: `Error: ${e.message}` };
                            }
                        }

                        functionResponses.push({
                            id: fc.id,
                            name: fc.name,
                            response: result
                        });
                    }

                    // Send Tool Response
                    const responseMsg = {
                        toolResponse: {
                            functionResponses: functionResponses
                        }
                    };
                    socket.send(JSON.stringify(responseMsg));
                }
            };

            socket.onerror = (err) => {
                console.error('Socket Error:', err);
            };

            socket.onclose = (event) => {
                console.log('Socket Closed', event.code, event.reason);
                setIsConnected(false);
            };

            // 3. Data Flow: Worklet -> Socket
            processor.port.onmessage = (e) => {
                const float32Data = e.data as Float32Array;
                // Simple Downsampling if rate > 16000? 
                // For prototype, we blindly send.

                // Convert Float32 to Int16 PCM Base64
                const int16Data = float32ToInt16(float32Data);
                const base64Data = arrayBufferToBase64(int16Data.buffer);

                if (socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({
                        realtimeInput: {
                            mediaChunks: [{
                                mimeType: "audio/pcm;rate=16000",
                                data: base64Data
                            }]
                        }
                    }));
                }
            };

        } catch (e) {
            console.error("Connection failed", e);
        }
    }, [onToolCall]);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsConnected(false);
        setIsSpeaking(false);
    }, []);

    // Helper: Play Audio Queue
    const scheduleAudio = (pcmData: Float32Array, ctx: AudioContext) => {
        // Very simple scheduler
        const buffer = ctx.createBuffer(1, pcmData.length, 24000);
        buffer.copyToChannel(pcmData as any, 0);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);

        // Calculate start time
        const currentTime = ctx.currentTime;
        const startTime = Math.max(currentTime, nextPlayTimeRef.current);

        source.start(startTime);
        nextPlayTimeRef.current = startTime + buffer.duration;

        setIsSpeaking(true);
        source.onended = () => {
            if (ctx.currentTime >= nextPlayTimeRef.current - 0.1) {
                setIsSpeaking(false); // Rough approx
            }
        };
    };

    return { connect, disconnect, isConnected, isSpeaking };
}

// Utils
function float32ToInt16(float32: Float32Array) {
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
        let s = Math.max(-1, Math.min(1, float32[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16;
}

function base64ToFloat32(base64: string) {
    const binary = atob(base64);
    const buffer = new ArrayBuffer(binary.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) {
        view[i] = binary.charCodeAt(i);
    }
    const int16 = new Int16Array(buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
    }
    return float32;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}
