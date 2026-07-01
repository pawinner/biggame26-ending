import wave
import struct
import math

def analyze():
    wav_path = "public/sounds/lottery.wav"
    with wave.open(wav_path, 'rb') as w:
        n_channels = w.getnchannels()
        sample_rate = w.getframerate()
        n_frames = w.getnframes()
        
        raw_data = w.readframes(n_frames)
        fmt = f"<{n_frames * n_channels}h"
        samples = struct.unpack(fmt, raw_data)
        mono = [abs(samples[i] / 32768.0) for i in range(0, len(samples), n_channels)]
        
    # Smooth the envelope using a moving average of 2ms (about 88 samples)
    win_size = int(0.002 * sample_rate)
    smoothed = []
    for i in range(len(mono)):
        start = max(0, i - win_size // 2)
        end = min(len(mono), i + win_size // 2)
        smoothed.append(sum(mono[start:end]) / (end - start))
        
    # Find peaks in the smoothed envelope
    # A peak is a point greater than its neighbors within a 10ms window (441 samples)
    peak_win = int(0.010 * sample_rate)
    peaks = []
    for i in range(peak_win, len(smoothed) - peak_win):
        val = smoothed[i]
        if val > 0.010: # threshold
            # check if it's the max in the window
            if val == max(smoothed[i - peak_win : i + peak_win + 1]):
                # to avoid duplicate adjacent points with the same value
                if not peaks or i - peaks[-1] > peak_win:
                    peaks.append(i)
                    
    print(f"Detected {len(peaks)} peaks in the envelope:")
    times = [p / sample_rate for p in peaks]
    
    # Calculate spacing
    spacings = [times[i] - times[i-1] for i in range(1, len(times))]
    
    for idx, t in enumerate(times):
        val = smoothed[peaks[idx]]
        spacing_str = f" (+{spacings[idx-1]*1000:.1f}ms)" if idx > 0 else ""
        print(f"Peak {idx:2d} at {t:5.3f}s, Amplitude = {val:.4f}{spacing_str}")
        
    if spacings:
        avg_spacing = sum(spacings) / len(spacings)
        print(f"\nAverage spacing between peaks: {avg_spacing*1000:.2f} ms (~{1.0/avg_spacing:.1f} Hz)")

if __name__ == "__main__":
    analyze()
