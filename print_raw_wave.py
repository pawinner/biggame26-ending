import wave
import struct

def analyze():
    wav_path = "public/sounds/lottery.wav"
    with wave.open(wav_path, 'rb') as w:
        n_channels = w.getnchannels()
        sample_rate = w.getframerate()
        n_frames = w.getnframes()
        
        raw_data = w.readframes(n_frames)
        fmt = f"<{n_frames * n_channels}h"
        samples = struct.unpack(fmt, raw_data)
        mono = [samples[i] / 32768.0 for i in range(0, len(samples), n_channels)]
        
    # Take a 20ms window at 0.5 seconds (about 882 samples)
    start = int(0.5 * sample_rate)
    window = mono[start : start + 300]
    
    print("Raw sample values for 300 samples (~7ms) at 0.5s:")
    for idx, val in enumerate(window):
        bar = ("+" if val >= 0 else "-") * int(abs(val) * 100)
        print(f"Sample {idx:3d}: {val:6.3f} {bar}")

if __name__ == "__main__":
    analyze()
