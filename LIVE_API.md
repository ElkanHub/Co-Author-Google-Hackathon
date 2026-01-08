<br />

<br />

The Live API enables low-latency, real-time voice and video interactions with Gemini. It processes continuous streams of audio, video, or text to deliver immediate, human-like spoken responses, creating a natural conversational experience for your users.

![Live API Overview](https://ai.google.dev/static/gemini-api/docs/images/live-api-overview.png)

Live API offers a comprehensive set of features such as[Voice Activity Detection](https://ai.google.dev/gemini-api/docs/live-guide#interruptions),[tool use and function calling](https://ai.google.dev/gemini-api/docs/live-tools),[session management](https://ai.google.dev/gemini-api/docs/live-session)(for managing long running conversations) and[ephemeral tokens](https://ai.google.dev/gemini-api/docs/ephemeral-tokens)(for secure client-sided authentication).

This page gets you up and running with examples and basic code samples.

[Try the Live API in Google AI Studiomic](https://aistudio.google.com/live)

## Choose an implementation approach

When integrating with Live API, you'll need to choose one of the following implementation approaches:

- **Server-to-server** : Your backend connects to the Live API using[WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API). Typically, your client sends stream data (audio, video, text) to your server, which then forwards it to the Live API.
- **Client-to-server** : Your frontend code connects directly to the Live API using[WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)to stream data, bypassing your backend.

**Note:** Client-to-server generally offers better performance for streaming audio and video, since it bypasses the need to send the stream to your backend first. It's also easier to set up since you don't need to implement a proxy that sends data from your client to your server and then your server to the API. However, for production environments, in order to mitigate security risks, we recommend using[ephemeral tokens](https://ai.google.dev/gemini-api/docs/ephemeral-tokens)instead of standard API keys.  

## Partner integrations

To streamline the development of real-time audio and video apps, you can use a third-party integration that supports the Gemini Live API over WebRTC or WebSockets.  
[Pipecat by Daily
Create a real-time AI chatbot using Gemini Live and Pipecat.](https://docs.pipecat.ai/guides/features/gemini-live)[LiveKit
Use the Gemini Live API with LiveKit Agents.](https://docs.livekit.io/agents/models/realtime/plugins/gemini/)[Fishjam by Software Mansion
Create live video and audio streaming applications with Fishjam.](https://docs.fishjam.io/tutorials/gemini-live-integration)[Agent Development Kit (ADK)
Implement the Live API with Agent Development Kit (ADK).](https://google.github.io/adk-docs/streaming/)[Vision Agents by Stream
Build real-time voice and video AI applications with Vision Agents.](https://visionagents.ai/integrations/gemini)[Voximplant
Connect inbound and outbound calls to Live API with Voximplant.](https://voximplant.com/products/gemini-client)

## Get started

Microphone streamAudio file stream

This server-side example**streams audio from the microphone** and plays the returned audio. For complete end-to-end examples including a client application, see[Example applications](https://ai.google.dev/gemini-api/docs/live#example-applications).

The input audio format should be in 16-bit PCM, 16kHz, mono format, and the received audio uses a sample rate of 24kHz.  

### Python

Install helpers for audio streaming. Additional system-level dependencies (e.g.`portaudio`) might be required. Refer to the[PyAudio docs](https://pypi.org/project/PyAudio/)for detailed installation steps.  

    pip install pyaudio

**Note:** **Use headphones**. This script uses the system default audio input and output, which often won't include echo cancellation. To prevent the model from interrupting itself, use headphones.  

    import asyncio
    from google import genai
    import pyaudio

    client = genai.Client()

    # --- pyaudio config ---
    FORMAT = pyaudio.paInt16
    CHANNELS = 1
    SEND_SAMPLE_RATE = 16000
    RECEIVE_SAMPLE_RATE = 24000
    CHUNK_SIZE = 1024

    pya = pyaudio.PyAudio()

    # --- Live API config ---
    MODEL = "gemini-2.5-flash-native-audio-preview-12-2025"
    CONFIG = {
        "response_modalities": ["AUDIO"],
        "system_instruction": "You are a helpful and friendly AI assistant.",
    }

    audio_queue_output = asyncio.Queue()
    audio_queue_mic = asyncio.Queue(maxsize=5)
    audio_stream = None

    async def listen_audio():
        """Listens for audio and puts it into the mic audio queue."""
        global audio_stream
        mic_info = pya.get_default_input_device_info()
        audio_stream = await asyncio.to_thread(
            pya.open,
            format=FORMAT,
            channels=CHANNELS,
            rate=SEND_SAMPLE_RATE,
            input=True,
            input_device_index=mic_info["index"],
            frames_per_buffer=CHUNK_SIZE,
        )
        kwargs = {"exception_on_overflow": False} if __debug__ else {}
        while True:
            data = await asyncio.to_thread(audio_stream.read, CHUNK_SIZE, **kwargs)
            await audio_queue_mic.put({"data": data, "mime_type": "audio/pcm"})

    async def send_realtime(session):
        """Sends audio from the mic audio queue to the GenAI session."""
        while True:
            msg = await audio_queue_mic.get()
            await session.send_realtime_input(audio=msg)

    async def receive_audio(session):
        """Receives responses from GenAI and puts audio data into the speaker audio queue."""
        while True:
            turn = session.receive()
            async for response in turn:
                if (response.server_content and response.server_content.model_turn):
                    for part in response.server_content.model_turn.parts:
                        if part.inline_data and isinstance(part.inline_data.data, bytes):
                            audio_queue_output.put_nowait(part.inline_data.data)

            # Empty the queue on interruption to stop playback
            while not audio_queue_output.empty():
                audio_queue_output.get_nowait()

    async def play_audio():
        """Plays audio from the speaker audio queue."""
        stream = await asyncio.to_thread(
            pya.open,
            format=FORMAT,
            channels=CHANNELS,
            rate=RECEIVE_SAMPLE_RATE,
            output=True,
        )
        while True:
            bytestream = await audio_queue_output.get()
            await asyncio.to_thread(stream.write, bytestream)

    async def run():
        """Main function to run the audio loop."""
        try:
            async with client.aio.live.connect(
                model=MODEL, config=CONFIG
            ) as live_session:
                print("Connected to Gemini. Start speaking!")
                async with asyncio.TaskGroup() as tg:
                    tg.create_task(send_realtime(live_session))
                    tg.create_task(listen_audio())
                    tg.create_task(receive_audio(live_session))
                    tg.create_task(play_audio())
        except asyncio.CancelledError:
            pass
        finally:
            if audio_stream:
                audio_stream.close()
            pya.terminate()
            print("\nConnection closed.")

    if __name__ == "__main__":
        try:
            asyncio.run(run())
        except KeyboardInterrupt:
            print("Interrupted by user.")

### JavaScript

Install helpers for audio streaming. Additional system-level dependencies might be required (`sox`for Mac/Windows or`ALSA`for Linux). Refer to the[speaker](https://www.npmjs.com/package/speaker)and[mic](https://www.npmjs.com/package/mic)docs for detailed installation steps.  

    npm install mic speaker

**Note:** **Use headphones**. This script uses the system default audio input and output, which often won't include echo cancellation. To prevent the model from interrupting itself, use headphones.  

    import { GoogleGenAI, Modality } from '@google/genai';
    import mic from 'mic';
    import Speaker from 'speaker';

    const ai = new GoogleGenAI({});
    // WARNING: Do not use API keys in client-side (browser based) applications
    // Consider using Ephemeral Tokens instead
    // More information at: https://ai.google.dev/gemini-api/docs/ephemeral-tokens

    // --- Live API config ---
    const model = 'gemini-2.5-flash-native-audio-preview-12-2025';
    const config = {
      responseModalities: [Modality.AUDIO],
      systemInstruction: "You are a helpful and friendly AI assistant.",
    };

    async function live() {
      const responseQueue = [];
      const audioQueue = [];
      let speaker;

      async function waitMessage() {
        while (responseQueue.length === 0) {
          await new Promise((resolve) => setImmediate(resolve));
        }
        return responseQueue.shift();
      }

      function createSpeaker() {
        if (speaker) {
          process.stdin.unpipe(speaker);
          speaker.end();
        }
        speaker = new Speaker({
          channels: 1,
          bitDepth: 16,
          sampleRate: 24000,
        });
        speaker.on('error', (err) => console.error('Speaker error:', err));
        process.stdin.pipe(speaker);
      }

      async function messageLoop() {
        // Puts incoming messages in the audio queue.
        while (true) {
          const message = await waitMessage();
          if (message.serverContent && message.serverContent.interrupted) {
            // Empty the queue on interruption to stop playback
            audioQueue.length = 0;
            continue;
          }
          if (message.serverContent && message.serverContent.modelTurn && message.serverContent.modelTurn.parts) {
            for (const part of message.serverContent.modelTurn.parts) {
              if (part.inlineData && part.inlineData.data) {
                audioQueue.push(Buffer.from(part.inlineData.data, 'base64'));
              }
            }
          }
        }
      }

      async function playbackLoop() {
        // Plays audio from the audio queue.
        while (true) {
          if (audioQueue.length === 0) {
            if (speaker) {
              // Destroy speaker if no more audio to avoid warnings from speaker library
              process.stdin.unpipe(speaker);
              speaker.end();
              speaker = null;
            }
            await new Promise((resolve) => setImmediate(resolve));
          } else {
            if (!speaker) createSpeaker();
            const chunk = audioQueue.shift();
            await new Promise((resolve) => {
              speaker.write(chunk, () => resolve());
            });
          }
        }
      }

      // Start loops
      messageLoop();
      playbackLoop();

      // Connect to Gemini Live API
      const session = await ai.live.connect({
        model: model,
        config: config,
        callbacks: {
          onopen: () => console.log('Connected to Gemini Live API'),
          onmessage: (message) => responseQueue.push(message),
          onerror: (e) => console.error('Error:', e.message),
          onclose: (e) => console.log('Closed:', e.reason),
        },
      });

      // Setup Microphone for input
      const micInstance = mic({
        rate: '16000',
        bitwidth: '16',
        channels: '1',
      });
      const micInputStream = micInstance.getAudioStream();

      micInputStream.on('data', (data) => {
        // API expects base64 encoded PCM data
        session.sendRealtimeInput({
          audio: {
            data: data.toString('base64'),
            mimeType: "audio/pcm;rate=16000"
          }
        });
      });

      micInputStream.on('error', (err) => {
        console.error('Microphone error:', err);
      });

      micInstance.start();
      console.log('Microphone started. Speak now...');
    }

    live().catch(console.error);

## Example applications

Check out the following example applications that illustrate how to use Live API for end-to-end use cases:

- [Live audio starter app](https://aistudio.google.com/apps/bundled/live_audio?showPreview=true&showCode=true&showAssistant=false)on AI Studio, using JavaScript libraries to connect to Live API and stream bidirectional audio through your microphone and speakers.
- See the[Partner integrations](https://ai.google.dev/gemini-api/docs/live#partner-integrations)for additional examples and getting started guides.

## What's next

- Read the full Live API[Capabilities](https://ai.google.dev/gemini-api/docs/live-guide)guide for key capabilities and configurations; including Voice Activity Detection and native audio features.
- Read the[Tool use](https://ai.google.dev/gemini-api/docs/live-tools)guide to learn how to integrate Live API with tools and function calling.
- Read the[Session management](https://ai.google.dev/gemini-api/docs/live-session)guide for managing long running conversations.
- Read the[Ephemeral tokens](https://ai.google.dev/gemini-api/docs/ephemeral-tokens)guide for secure authentication in[client-to-server](https://ai.google.dev/gemini-api/docs/live#implementation-approach)applications.
- For more information about the underlying WebSockets API, see the[WebSockets API reference](https://ai.google.dev/api/live).





---

<br />

Tool use allows Live API to go beyond just conversation by enabling it to perform actions in the real-world and pull in external context while maintaining a real time connection. You can define tools such as[Function calling](https://ai.google.dev/gemini-api/docs/function-calling)and[Google Search](https://ai.google.dev/gemini-api/docs/grounding)with the Live API.

## Overview of supported tools

Here's a brief overview of the available tools for Live API models:

|         Tool         | `gemini-2.5-flash-native-audio-preview-12-2025` |
|----------------------|-------------------------------------------------|
| **Search**           | Yes                                             |
| **Function calling** | Yes                                             |
| **Google Maps**      | No                                              |
| **Code execution**   | No                                              |
| **URL context**      | No                                              |

## Function calling

Live API supports function calling, just like regular content generation requests. Function calling lets the Live API interact with external data and programs, greatly increasing what your applications can accomplish.

You can define function declarations as part of the session configuration. After receiving tool calls, the client should respond with a list of`FunctionResponse`objects using the`session.send_tool_response`method.

See the[Function calling tutorial](https://ai.google.dev/gemini-api/docs/function-calling)to learn more.
**Note:** Unlike the`generateContent`API, the Live API doesn't support automatic tool response handling. You must handle tool responses manually in your client code.  

### Python

    import asyncio
    import wave
    from google import genai
    from google.genai import types

    client = genai.Client()

    model = "gemini-2.5-flash-native-audio-preview-12-2025"

    # Simple function definitions
    turn_on_the_lights = {"name": "turn_on_the_lights"}
    turn_off_the_lights = {"name": "turn_off_the_lights"}

    tools = [{"function_declarations": [turn_on_the_lights, turn_off_the_lights]}]
    config = {"response_modalities": ["AUDIO"], "tools": tools}

    async def main():
        async with client.aio.live.connect(model=model, config=config) as session:
            prompt = "Turn on the lights please"
            await session.send_client_content(turns={"parts": [{"text": prompt}]})

            wf = wave.open("audio.wav", "wb")
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(24000)  # Output is 24kHz

            async for response in session.receive():
                if response.data is not None:
                    wf.writeframes(response.data)
                elif response.tool_call:
                    print("The tool was called")
                    function_responses = []
                    for fc in response.tool_call.function_calls:
                        function_response = types.FunctionResponse(
                            id=fc.id,
                            name=fc.name,
                            response={ "result": "ok" } # simple, hard-coded function response
                        )
                        function_responses.append(function_response)

                    await session.send_tool_response(function_responses=function_responses)

            wf.close()

    if __name__ == "__main__":
        asyncio.run(main())

### JavaScript

    import { GoogleGenAI, Modality } from '@google/genai';
    import * as fs from "node:fs";
    import pkg from 'wavefile';  // npm install wavefile
    const { WaveFile } = pkg;

    const ai = new GoogleGenAI({});
    const model = 'gemini-2.5-flash-native-audio-preview-12-2025';

    // Simple function definitions
    const turn_on_the_lights = { name: "turn_on_the_lights" } // , description: '...', parameters: { ... }
    const turn_off_the_lights = { name: "turn_off_the_lights" }

    const tools = [{ functionDeclarations: [turn_on_the_lights, turn_off_the_lights] }]

    const config = {
      responseModalities: [Modality.AUDIO],
      tools: tools
    }

    async function live() {
      const responseQueue = [];

      async function waitMessage() {
        let done = false;
        let message = undefined;
        while (!done) {
          message = responseQueue.shift();
          if (message) {
            done = true;
          } else {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
        return message;
      }

      async function handleTurn() {
        const turns = [];
        let done = false;
        while (!done) {
          const message = await waitMessage();
          turns.push(message);
          if (message.serverContent && message.serverContent.turnComplete) {
            done = true;
          } else if (message.toolCall) {
            done = true;
          }
        }
        return turns;
      }

      const session = await ai.live.connect({
        model: model,
        callbacks: {
          onopen: function () {
            console.debug('Opened');
          },
          onmessage: function (message) {
            responseQueue.push(message);
          },
          onerror: function (e) {
            console.debug('Error:', e.message);
          },
          onclose: function (e) {
            console.debug('Close:', e.reason);
          },
        },
        config: config,
      });

      const inputTurns = 'Turn on the lights please';
      session.sendClientContent({ turns: inputTurns });

      let turns = await handleTurn();

      for (const turn of turns) {
        if (turn.toolCall) {
          console.debug('A tool was called');
          const functionResponses = [];
          for (const fc of turn.toolCall.functionCalls) {
            functionResponses.push({
              id: fc.id,
              name: fc.name,
              response: { result: "ok" } // simple, hard-coded function response
            });
          }

          console.debug('Sending tool response...\n');
          session.sendToolResponse({ functionResponses: functionResponses });
        }
      }

      // Check again for new messages
      turns = await handleTurn();

      // Combine audio data strings and save as wave file
      const combinedAudio = turns.reduce((acc, turn) => {
          if (turn.data) {
              const buffer = Buffer.from(turn.data, 'base64');
              const intArray = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / Int16Array.BYTES_PER_ELEMENT);
              return acc.concat(Array.from(intArray));
          }
          return acc;
      }, []);

      const audioBuffer = new Int16Array(combinedAudio);

      const wf = new WaveFile();
      wf.fromScratch(1, 24000, '16', audioBuffer);  // output is 24kHz
      fs.writeFileSync('audio.wav', wf.toBuffer());

      session.close();
    }

    async function main() {
      await live().catch((e) => console.error('got error', e));
    }

    main();

From a single prompt, the model can generate multiple function calls and the code necessary to chain their outputs. This code executes in a sandbox environment, generating subsequent[BidiGenerateContentToolCall](https://ai.google.dev/api/live#bidigeneratecontenttoolcall)messages.

## Asynchronous function calling

Function calling executes sequentially by default, meaning execution pauses until the results of each function call are available. This ensures sequential processing, which means you won't be able to continue interacting with the model while the functions are being run.

If you don't want to block the conversation, you can tell the model to run the functions asynchronously. To do so, you first need to add a`behavior`to the function definitions:  

### Python

    # Non-blocking function definitions
    turn_on_the_lights = {"name": "turn_on_the_lights", "behavior": "NON_BLOCKING"} # turn_on_the_lights will run asynchronously
    turn_off_the_lights = {"name": "turn_off_the_lights"} # turn_off_the_lights will still pause all interactions with the model

### JavaScript

    import { GoogleGenAI, Modality, Behavior } from '@google/genai';

    // Non-blocking function definitions
    const turn_on_the_lights = {name: "turn_on_the_lights", behavior: Behavior.NON_BLOCKING}

    // Blocking function definitions
    const turn_off_the_lights = {name: "turn_off_the_lights"}

    const tools = [{ functionDeclarations: [turn_on_the_lights, turn_off_the_lights] }]

`NON-BLOCKING`ensures the function runs asynchronously while you can continue interacting with the model.

Then you need to tell the model how to behave when it receives the`FunctionResponse`using the`scheduling`parameter. It can either:

- Interrupt what it's doing and tell you about the response it got right away (`scheduling="INTERRUPT"`),
- Wait until it's finished with what it's currently doing (`scheduling="WHEN_IDLE"`),
- Or do nothing and use that knowledge later on in the discussion (`scheduling="SILENT"`)

### Python

    # for a non-blocking function definition, apply scheduling in the function response:
      function_response = types.FunctionResponse(
          id=fc.id,
          name=fc.name,
          response={
              "result": "ok",
              "scheduling": "INTERRUPT" # Can also be WHEN_IDLE or SILENT
          }
      )

### JavaScript

    import { GoogleGenAI, Modality, Behavior, FunctionResponseScheduling } from '@google/genai';

    // for a non-blocking function definition, apply scheduling in the function response:
    const functionResponse = {
      id: fc.id,
      name: fc.name,
      response: {
        result: "ok",
        scheduling: FunctionResponseScheduling.INTERRUPT  // Can also be WHEN_IDLE or SILENT
      }
    }

## Grounding with Google Search

You can enable Grounding with Google Search as part of the session configuration. This increases the Live API's accuracy and prevents hallucinations. See the[Grounding tutorial](https://ai.google.dev/gemini-api/docs/grounding)to learn more.  

### Python

    import asyncio
    import wave
    from google import genai
    from google.genai import types

    client = genai.Client()

    model = "gemini-2.5-flash-native-audio-preview-12-2025"

    tools = [{'google_search': {}}]
    config = {"response_modalities": ["AUDIO"], "tools": tools}

    async def main():
        async with client.aio.live.connect(model=model, config=config) as session:
            prompt = "When did the last Brazil vs. Argentina soccer match happen?"
            await session.send_client_content(turns={"parts": [{"text": prompt}]})

            wf = wave.open("audio.wav", "wb")
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(24000)  # Output is 24kHz

            async for chunk in session.receive():
                if chunk.server_content:
                    if chunk.data is not None:
                        wf.writeframes(chunk.data)

                    # The model might generate and execute Python code to use Search
                    model_turn = chunk.server_content.model_turn
                    if model_turn:
                        for part in model_turn.parts:
                            if part.executable_code is not None:
                                print(part.executable_code.code)

                            if part.code_execution_result is not None:
                                print(part.code_execution_result.output)

            wf.close()

    if __name__ == "__main__":
        asyncio.run(main())

### JavaScript

    import { GoogleGenAI, Modality } from '@google/genai';
    import * as fs from "node:fs";
    import pkg from 'wavefile';  // npm install wavefile
    const { WaveFile } = pkg;

    const ai = new GoogleGenAI({});
    const model = 'gemini-2.5-flash-native-audio-preview-12-2025';

    const tools = [{ googleSearch: {} }]
    const config = {
      responseModalities: [Modality.AUDIO],
      tools: tools
    }

    async function live() {
      const responseQueue = [];

      async function waitMessage() {
        let done = false;
        let message = undefined;
        while (!done) {
          message = responseQueue.shift();
          if (message) {
            done = true;
          } else {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
        return message;
      }

      async function handleTurn() {
        const turns = [];
        let done = false;
        while (!done) {
          const message = await waitMessage();
          turns.push(message);
          if (message.serverContent && message.serverContent.turnComplete) {
            done = true;
          } else if (message.toolCall) {
            done = true;
          }
        }
        return turns;
      }

      const session = await ai.live.connect({
        model: model,
        callbacks: {
          onopen: function () {
            console.debug('Opened');
          },
          onmessage: function (message) {
            responseQueue.push(message);
          },
          onerror: function (e) {
            console.debug('Error:', e.message);
          },
          onclose: function (e) {
            console.debug('Close:', e.reason);
          },
        },
        config: config,
      });

      const inputTurns = 'When did the last Brazil vs. Argentina soccer match happen?';
      session.sendClientContent({ turns: inputTurns });

      let turns = await handleTurn();

      let combinedData = '';
      for (const turn of turns) {
        if (turn.serverContent && turn.serverContent.modelTurn && turn.serverContent.modelTurn.parts) {
          for (const part of turn.serverContent.modelTurn.parts) {
            if (part.executableCode) {
              console.debug('executableCode: %s\n', part.executableCode.code);
            }
            else if (part.codeExecutionResult) {
              console.debug('codeExecutionResult: %s\n', part.codeExecutionResult.output);
            }
            else if (part.inlineData && typeof part.inlineData.data === 'string') {
              combinedData += atob(part.inlineData.data);
            }
          }
        }
      }

      // Convert the base64-encoded string of bytes into a Buffer.
      const buffer = Buffer.from(combinedData, 'binary');

      // The buffer contains raw bytes. For 16-bit audio, we need to interpret every 2 bytes as a single sample.
      const intArray = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / Int16Array.BYTES_PER_ELEMENT);

      const wf = new WaveFile();
      // The API returns 16-bit PCM audio at a 24kHz sample rate.
      wf.fromScratch(1, 24000, '16', intArray);
      fs.writeFileSync('audio.wav', wf.toBuffer());

      session.close();
    }

    async function main() {
      await live().catch((e) => console.error('got error', e));
    }

    main();

## Combining multiple tools

You can combine multiple tools within the Live API, increasing your application's capabilities even more:  

### Python

    prompt = """
    Hey, I need you to do two things for me.

    1. Use Google Search to look up information about the largest earthquake in California the week of Dec 5 2024?
    2. Then turn on the lights

    Thanks!
    """

    tools = [
        {"google_search": {}},
        {"function_declarations": [turn_on_the_lights, turn_off_the_lights]},
    ]

    config = {"response_modalities": ["AUDIO"], "tools": tools}

    # ... remaining model call

### JavaScript

    const prompt = `Hey, I need you to do two things for me.

    1. Use Google Search to look up information about the largest earthquake in California the week of Dec 5 2024?
    2. Then turn on the lights

    Thanks!
    `

    const tools = [
      { googleSearch: {} },
      { functionDeclarations: [turn_on_the_lights, turn_off_the_lights] }
    ]

    const config = {
      responseModalities: [Modality.AUDIO],
      tools: tools
    }

    // ... remaining model call

## What's next

- Check out more examples of using tools with the Live API in the[Tool use cookbook](https://colab.research.google.com/github/google-gemini/cookbook/blob/main/quickstarts/Get_started_LiveAPI_tools.ipynb).
- Get the full story on features and configurations from the[Live API Capabilities guide](https://ai.google.dev/gemini-api/docs/live-guide).