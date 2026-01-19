
export class AudioRecorder {
  stream: MediaStream | null = null;
  audioContext: AudioContext | null = null;
  source: MediaStreamAudioSourceNode | null = null;
  workletNode: AudioWorkletNode | null = null;
  onDataAvailable: (data: ArrayBuffer) => void;
  targetSampleRate: number;

  constructor(onDataAvailable: (data: ArrayBuffer) => void, targetSampleRate: number = 16000) {
    this.onDataAvailable = onDataAvailable;
    this.targetSampleRate = targetSampleRate;
  }

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      this.audioContext = new AudioContextClass();

      if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
      }
      
      const sourceSampleRate = this.audioContext.sampleRate;
      
      // Define AudioWorklet inline to avoid external file dependencies in prototype
      const workletCode = `
        class RecorderProcessor extends AudioWorkletProcessor {
            process(inputs) {
                const input = inputs[0];
                if (input && input.length > 0) {
                    const channelData = input[0];
                    if (channelData && channelData.length > 0) {
                        this.port.postMessage(channelData);
                    }
                }
                return true;
            }
        }
        registerProcessor('recorder-worklet', RecorderProcessor);
      `;

      const blob = new Blob([workletCode], { type: 'application/javascript' });
      const workletUrl = URL.createObjectURL(blob);
      
      try {
        await this.audioContext.audioWorklet.addModule(workletUrl);
      } catch (e) {
         console.error("Failed to load AudioWorklet", e);
         throw e;
      }

      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.workletNode = new AudioWorkletNode(this.audioContext, 'recorder-worklet');

      this.workletNode.port.onmessage = (event) => {
          const inputData = event.data; // Float32Array from worklet
          
          // Robust Downsampling
          const downsampledData = this.downsampleBuffer(inputData, sourceSampleRate, this.targetSampleRate);
          
          // Convert to PCM Int16
          const pcmData = this.convertFloat32ToInt16(downsampledData);
          
          // Only send if we have data to prevent 1007 errors from empty frames
          if (pcmData.byteLength > 0) {
              this.onDataAvailable(pcmData.buffer);
          }
      };

      this.source.connect(this.workletNode);
      // Connect to destination to keep the graph alive (often needed in Chrome), but mute it
      this.workletNode.connect(this.audioContext.destination);

    } catch (error) {
      console.error("Error starting audio recorder:", error);
      throw error;
    }
  }

  // Improved Downsampling with NaN protection
  private downsampleBuffer(buffer: Float32Array, sampleRate: number, outSampleRate: number): Float32Array {
      if (outSampleRate === sampleRate) {
          return buffer;
      }
      if (outSampleRate > sampleRate) {
          return buffer; // Upsampling not supported, return original
      }
      
      const sampleRateRatio = sampleRate / outSampleRate;
      const newLength = Math.floor(buffer.length / sampleRateRatio);
      const result = new Float32Array(newLength);
      
      for (let i = 0; i < newLength; i++) {
          const startOffset = Math.floor(i * sampleRateRatio);
          const endOffset = Math.floor((i + 1) * sampleRateRatio);
          const count = endOffset - startOffset;
          
          if (count <= 1) {
              result[i] = buffer[startOffset];
          } else {
              let sum = 0;
              for (let j = startOffset; j < endOffset; j++) {
                  sum += buffer[j];
              }
              const avg = sum / count;
              // Guard against NaN
              result[i] = isNaN(avg) ? 0 : avg;
          }
      }
      
      return result;
  }

  private convertFloat32ToInt16(buffer: Float32Array): Int16Array {
      let l = buffer.length;
      let buf = new Int16Array(l);
      while (l--) {
          let s = buffer[l];
          // Guard against NaN/Infinity
          if (isNaN(s) || !isFinite(s)) s = 0;
          
          // Clamp values to -1 to 1
          s = Math.max(-1, Math.min(1, s));
          
          // Scale to 16-bit integer range
          buf[l] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      return buf;
  }

  stop() {
    if (this.workletNode) {
        this.workletNode.disconnect();
        this.workletNode = null;
    }
    if (this.source) {
        this.source.disconnect();
        this.source = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    if (this.audioContext) {
      this.audioContext.close().catch(e => console.warn("Error closing AudioContext:", e));
    }
    this.stream = null;
    this.audioContext = null;
  }
}

export class AudioStreamPlayer {
  audioContext: AudioContext | null = null;
  gainNode: GainNode | null = null;
  nextStartTime: number = 0;
  scheduledSources: AudioBufferSourceNode[] = [];
  
  constructor() {
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    this.audioContext = new AudioContextClass({ sampleRate: 24000 }); // Gemini Native Output is 24k
    
    if (this.audioContext) {
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 1.0; 
        this.gainNode.connect(this.audioContext.destination);
    }
  }

  async resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
    }
  }

  async addChunk(data: ArrayBuffer) {
    if (!this.audioContext || !this.gainNode) return;

    if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
    }

    // Convert Int16 PCM to Float32
    const float32Data = new Float32Array(data.byteLength / 2);
    const dataView = new DataView(data);
    
    for (let i = 0; i < data.byteLength / 2; i++) {
      const int16 = dataView.getInt16(i * 2, true); // Little Endian
      float32Data[i] = int16 / 32768.0;
    }

    const audioBuffer = this.audioContext.createBuffer(1, float32Data.length, 24000);
    audioBuffer.getChannelData(0).set(float32Data);

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.gainNode);

    const currentTime = this.audioContext.currentTime;
    
    // Ensure smooth playback sequence
    if (this.nextStartTime < currentTime) {
      this.nextStartTime = currentTime;
    }
    
    source.onended = () => {
        this.scheduledSources = this.scheduledSources.filter(s => s !== source);
    };

    this.scheduledSources.push(source);
    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
  }
  
  interrupt() {
      this.scheduledSources.forEach(source => {
          try { source.stop(); } catch(e) {}
      });
      this.scheduledSources = [];
      
      if (this.audioContext) {
          this.nextStartTime = this.audioContext.currentTime;
      }
  }

  stop() {
    this.interrupt();
    if (this.audioContext) {
        this.audioContext.close().catch(e => console.warn("AudioContext close error:", e));
    }
  }
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
