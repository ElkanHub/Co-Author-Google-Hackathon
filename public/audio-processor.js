class AudioRecorder extends AudioWorkletProcessor {
    constructor() {
        super();
        this.buffer = new Float32Array(8192); // Internal buffer
        this.bufferIdx = 0;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (!input || !input.length) return true;

        const channelData = input[0];

        // Append to buffer
        if (this.bufferIdx + channelData.length > this.buffer.length) {
            // Buffer overflow/wrap (shouldn't happen often if we size right, but let's just flush what we have)
            this.port.postMessage(this.buffer.slice(0, this.bufferIdx));
            this.bufferIdx = 0;
        }

        this.buffer.set(channelData, this.bufferIdx);
        this.bufferIdx += channelData.length;

        // Flush if full enough
        if (this.bufferIdx >= 2048) {
            this.port.postMessage(this.buffer.slice(0, this.bufferIdx));
            this.bufferIdx = 0;
        }

        return true;
    }
}

registerProcessor("audio-recorder", AudioRecorder);
