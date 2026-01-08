class AudioRecorder extends AudioWorkletProcessor {
    constructor() {
        super();
        this.buffer = new Float32Array(2048); // Internal buffer
        this.bufferIdx = 0;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (!input || !input.length) return true;

        const channelData = input[0]; // Mono

        // We just forward the raw float data to the main thread
        // The main thread will handle conversion to Int16 and base64 encoding
        // This keeps the worklet simple and non-blocking
        this.port.postMessage(channelData);

        return true;
    }
}

registerProcessor("audio-recorder", AudioRecorder);
