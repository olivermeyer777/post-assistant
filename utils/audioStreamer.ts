export class AudioRecorder {
  stream: MediaStream | null = null;
  audioContext: AudioContext | null = null;
  source: MediaStreamAudioSourceNode | null = null;
  processor: ScriptProcessorNode | null = null;
  onDataAvailable: (data: ArrayBuffer) => void;

  constructor(onDataAvailable: (data: ArrayBuffer) => void) {
    this.onDataAvailable = onDataAvailable;
  }

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000, 
      });
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      const sourceRate = this.audioContext.sampleRate;
      const targetRate = 16000;
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      // Use 4096 buffer for balance between latency and stability
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Simple downsampling
        let processedData = inputData;
        if (sourceRate !== targetRate) {
             const ratio = sourceRate / targetRate;
             const newLength = Math.floor(inputData.length / ratio);
             processedData = new Float32Array(newLength);
             for (let i = 0; i < newLength; i++) {
                 processedData[i] = inputData[Math.floor(i * ratio)];
             }
        }

        // Convert Float32 to Int16 PCM
        const pcmData = new Int16Array(processedData.length);
        for (let i = 0; i < processedData.length; i++) {
          const s = Math.max(-1, Math.min(1, processedData[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        this.onDataAvailable(pcmData.buffer);
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      console.error("Error starting audio recorder:", error);
      throw error;
    }
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
  
  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000, // Native rate for Gemini Live
    });
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 1.2; // Boost volume slightly
    this.gainNode.connect(this.audioContext.destination);
  }

  async addChunk(data: ArrayBuffer) {
    if (!this.audioContext || !this.gainNode) return;

    // Ensure context is running (vital for hearing audio after user click)
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
    
    // Simple drift correction
    if (this.nextStartTime < currentTime) {
      this.nextStartTime = currentTime;
    }
    
    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
  }
  
  stop() {
    if (this.audioContext) {
        this.audioContext.close().catch(e => console.warn("AudioContext close error:", e));
    }
    this.nextStartTime = 0;
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