
export class AudioRecorder {
  stream: MediaStream | null = null;
  audioContext: AudioContext | null = null;
  source: MediaStreamAudioSourceNode | null = null;
  processor: ScriptProcessorNode | null = null;
  onDataAvailable: (data: ArrayBuffer) => void;
  targetSampleRate: number;

  constructor(onDataAvailable: (data: ArrayBuffer) => void, targetSampleRate: number = 16000) {
    this.onDataAvailable = onDataAvailable;
    this.targetSampleRate = targetSampleRate;
  }

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Use standard AudioContext without forcing sampleRate (better compatibility)
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const sourceSampleRate = this.audioContext.sampleRate;
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      // Use 4096 buffer size for balance between latency and performance
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Downsample to target rate (e.g. 48000 -> 16000)
        const downsampledData = this.downsampleBuffer(inputData, sourceSampleRate, this.targetSampleRate);
        
        // Convert Float32 to Int16 PCM
        const pcmData = this.convertFloat32ToInt16(downsampledData);
        
        this.onDataAvailable(pcmData.buffer);
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      console.error("Error starting audio recorder:", error);
      throw error;
    }
  }

  // Simple Downsampling Algorithm
  private downsampleBuffer(buffer: Float32Array, sampleRate: number, outSampleRate: number): Float32Array {
      if (outSampleRate === sampleRate) {
          return buffer;
      }
      if (outSampleRate > sampleRate) {
          // Upsampling not supported in this simple implementation
          return buffer;
      }
      
      const sampleRateRatio = sampleRate / outSampleRate;
      const newLength = Math.round(buffer.length / sampleRateRatio);
      const result = new Float32Array(newLength);
      
      let offsetResult = 0;
      let offsetBuffer = 0;
      
      while (offsetResult < result.length) {
          const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
          
          // Simple averaging (low-pass filter effect) to prevent aliasing
          let accum = 0, count = 0;
          for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
              accum += buffer[i];
              count++;
          }
          
          result[offsetResult] = count > 0 ? accum / count : 0;
          offsetResult++;
          offsetBuffer = nextOffsetBuffer;
      }
      
      return result;
  }

  private convertFloat32ToInt16(buffer: Float32Array): Int16Array {
      let l = buffer.length;
      let buf = new Int16Array(l);
      while (l--) {
          // Clamp values to -1 to 1
          let s = Math.max(-1, Math.min(1, buffer[l]));
          // Scale to 16-bit integer range
          buf[l] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      return buf;
  }

  stop() {
    if (this.processor && this.source) {
      this.source.disconnect();
      this.processor.disconnect();
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
    // Try to use 24kHz for playback if supported, else default
    try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000, 
        });
    } catch (e) {
        // Fallback to default system rate
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (this.audioContext) {
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 1.2; // Boost volume slightly
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

    // Ensure context is running
    if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
    }

    // Convert Int16 PCM -> Float32
    const float32Data = new Float32Array(data.byteLength / 2);
    const dataView = new DataView(data);
    
    for (let i = 0; i < data.byteLength / 2; i++) {
      const int16 = dataView.getInt16(i * 2, true);
      float32Data[i] = int16 / 32768.0;
    }

    const audioBuffer = this.audioContext.createBuffer(1, float32Data.length, 24000);
    audioBuffer.getChannelData(0).set(float32Data);

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.gainNode);

    const currentTime = this.audioContext.currentTime;
    
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
      this.nextStartTime = 0;
      
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
