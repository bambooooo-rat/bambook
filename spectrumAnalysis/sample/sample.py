import numpy as np
import soundfile as sf

# --- 1. 基本設定與半音階頻率 (Hz) ---
sample_rate = 44100

# 定義 C4 到 C5 的完整半音階 (Chromatic Scale)
NOTES = {
    'c4': 261.63, 'cs4': 277.18, 'd4': 293.66, 'ds4': 311.13,
    'e4': 329.63, 'f4': 349.23, 'fs4': 369.99, 'g4': 392.00,
    'gs4': 415.30, 'a4': 440.00, 'as4': 466.16, 'b4': 493.88,
    'c5': 523.25
}

def generate_piano_note(note_name, length_val, bpm=120):
    """
    合成類似鋼琴的單音
    """
    beats = 4 / length_val  # 計算拍數
    duration_sec = beats * (60 / bpm) # 轉換為秒數
    t = np.linspace(0, duration_sec, int(sample_rate * duration_sec), endpoint=False)
    
    freq = NOTES[note_name]
    
    # 1. 豐富的泛音結構 (鋼琴的泛音很多)
    wave = 1.00 * np.sin(2 * np.pi * freq * t)          # 基頻
    wave += 0.60 * np.sin(2 * np.pi * 2 * freq * t)     # 2次泛音
    wave += 0.40 * np.sin(2 * np.pi * 3 * freq * t)     # 3次泛音
    wave += 0.30 * np.sin(2 * np.pi * 4 * freq * t)     # 4次泛音
    wave += 0.20 * np.sin(2 * np.pi * 5 * freq * t)     # 5次泛音
    wave += 0.10 * np.sin(2 * np.pi * 6 * freq * t)     # 6次泛音
    
    # 2. 敲擊樂器的包絡線 (Percussive Envelope)
    attack_time = 0.015  # 15毫秒的極快起音
    attack_samples = int(attack_time * sample_rate)
    
    # 指數衰減 (將數值調小，延長聲音衰減時間，模擬踩下延音踏板)
    decay_rate = 0.8 
    envelope = np.exp(-decay_rate * t)
    
    # 疊加 Attack 的漸入效果
    if len(t) > attack_samples:
        envelope[:attack_samples] = np.linspace(0, 1, attack_samples)
        
    # 新增：尾音 Release 的漸出效果，避免聲音突然中斷產生雜音
    release_time = 0.2
    release_samples = int(release_time * sample_rate)
    if len(t) > release_samples:
        envelope[-release_samples:] *= np.linspace(1, 0, release_samples)
        
    return wave * envelope

def generate_chord(note_names, length_val, bpm=120):
    """
    將多個單音波形疊加，形成和弦
    """
    # 將陣列中每個音符的波形相加 (Element-wise addition)
    chord_wave = sum(generate_piano_note(n, length_val, bpm) for n in note_names)
    return chord_wave

# --- 2. 建立各階段樂譜 ---

# 階段 1：單音半音階
song = [
    ('c4', 4), ('cs4', 4), ('d4', 4), ('ds4', 4),
    ('e4', 4), ('f4', 4), ('fs4', 4), ('g4', 4),
    ('gs4', 4), ('a4', 4), ('as4', 4), ('b4', 4),
    ('c5', 2)
]
scale_audio = np.concatenate([generate_piano_note(n, d) for n, d in song])

# 階段 2：十二個音一起彈奏 (12-Note Cluster)
# 取 C4 到 B4 共 12 個音，長度設定為 0.25 (相當於 16 拍，約 8 秒，方便慢慢觀察頻譜)
all_12_notes = ['c4', 'cs4', 'd4', 'ds4', 'e4', 'f4', 'fs4', 'g4', 'gs4', 'a4', 'as4', 'b4']
cluster_audio = generate_chord(all_12_notes, 0.25)

# 階段 3：三個經典大小和弦 (延長長度為 0.5，約 4 秒)
# 1. C大三和弦 (C Major: C, E, G)
chord_c_maj = generate_chord(['c4', 'e4', 'g4'], 0.5)
# 2. F大三和弦 (F Major: F, A, C)
chord_f_maj = generate_chord(['f4', 'a4', 'c5'], 0.5)
# 3. E小三和弦 (E Minor: E, G, B)
chord_e_min = generate_chord(['e4', 'g4', 'b4'], 0.5)


# --- 3. 串接所有音訊片段與輸出 FLAC ---
print("正在合成音訊 (包含半音階、12音簇、經典和弦)...")

# 產生 0.5 秒的靜音，用來區隔不同階段的聲音
silence = np.zeros(int(sample_rate * 0.5))

# 串接：半音階 -> 靜音 -> 12音一起彈 -> 靜音 -> 和弦1 -> 和弦2 -> 和弦3 -> 結束留白
final_audio = np.concatenate([
    scale_audio, silence,  
    chord_c_maj, chord_f_maj, chord_e_min, silence,
    cluster_audio, silence
])

# 正規化音量防止破音 (-1.0 到 1.0 之間)
# ※和弦將多個波疊加，振幅會變積極大，這步極為重要
final_audio = final_audio / np.max(np.abs(final_audio)) 

# 使用 soundfile 輸出為 FLAC 檔案
output_filename = "12 equal temperament (piano).flac"
sf.write(output_filename, final_audio, sample_rate)

print(f"成功！已生成音檔並儲存於目前目錄: {output_filename}")