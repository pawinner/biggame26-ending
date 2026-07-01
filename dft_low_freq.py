import wave
import struct
import math

def dft(signal, sample_rate, start_freq, end_freq, step):
    N = len(signal)
    amplitudes = []
    freqs = []
    
    # Custom DFT for specific frequency range
    f = start_freq
    while f <= end_freq:
        # Calculate real and imaginary parts for frequency f
        real = 0
        imag = 0
        for n in range(N):
            angle = 2 * math.pi * f * n / sample_rate
            real += signal[n] * math.cos(angle)
            imag -= signal[n] * math.sin(angle)
        magnitude = math.sqrt(real * real + imag * imag)
        amplitudes.append(magnitude)
        freqs.append(f)
        f += step
        
    return freqs, amplitudes

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
        
    # Analyze middle of the file (1.0 second)
    slice_start = int(1.0 * sample_rate)
    N = 2048
    signal_slice = mono[slice_start : slice_start + N]
    
    print("Analyzing frequencies from 20 Hz to 600 Hz in 5 Hz steps at 1.0 second...")
    freqs, amplitudes = dft(signal_slice, sample_rate, 20, 600, 5)
    
    # Sort and print peaks
    peaks = []
    for i in range(1, len(amplitudes) - 1):
        if amplitudes[i] > amplitudes[i-1] and amplitudes[i] > amplitudes[i+1]:
            peaks.append((freqs[i], amplitudes[i]))
    peaks.sort(key=lambda x: x[1], reverse=True)
    
    print("\nDominant Low Frequencies:")
    for freq, amp in peaks[:15]:
        print(f"Freq: {freq:5.1f} Hz, Amplitude: {amp:6.2f}")
        
    # Analyze the end of the file (2.5 seconds)
    slice_start2 = int(2.5 * sample_rate)
    signal_slice2 = mono[slice_start2 : slice_start2 + N]
    print("\nAnalyzing frequencies from 20 Hz to 600 Hz in 5 Hz steps at 2.5 seconds...")
    freqs2, amplitudes2 = dft(signal_slice2, sample_rate, 20, 600, 5)
    
    peaks2 = []
    for i in range(1, len(amplitudes2) - 1):
        if amplitudes2[i] > amplitudes2[i-1] and amplitudes2[i] > amplitudes2[i+1]:
            peaks2.append((freqs2[i], amplitudes2[i]))
    peaks2.sort(key=lambda x: x[1], reverse=True)
    
    print("\nDominant Low Frequencies at 2.5s:")
    for freq, amp in peaks2[:15]:
        print(f"Freq: {freq:5.1f} Hz, Amplitude: {amp:6.2f}")

if __name__ == "__main__":
    analyze()
