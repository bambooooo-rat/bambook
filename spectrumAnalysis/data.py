import os
import json
import warnings

# 需要安裝第三方套件: pip install librosa numpy soundfile
try:
    import librosa
    import numpy as np
except ImportError:
    print("請先安裝必備套件: pip install librosa numpy soundfile")
    exit(1)

# 忽略 librosa 讀取 mp3 時的潛在警告
warnings.filterwarnings("ignore", category=UserWarning)

SAMPLE_DIR = "sample"
OUTPUT_JSON = "samples.json"
AUDIO_EXTS = {".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a"}

# 決定波形預覽要切成多少個點 (1000 個點對於網頁 Canvas 顯示已經非常平滑且足夠)
WAVEFORM_POINTS = 1000

def process_audio(filepath):
    """解析音頻，計算 RMS 與波形峰值"""
    try:
        # 使用 librosa 載入音頻 (轉為單聲道處理)
        # sr=None 保持原始取樣率以加快讀取速度
        y, sr = librosa.load(filepath, sr=None, mono=True)
        
        if len(y) == 0:
            return 0.0, []

        # 1. 計算整首歌曲的 RMS (Root Mean Square) 能量
        rms = float(np.sqrt(np.mean(y**2)))
        
        # 2. 計算波形峰值 (Waveform Peaks)
        peaks = []
        chunk_size = max(1, len(y) // WAVEFORM_POINTS)
        
        for i in range(WAVEFORM_POINTS):
            start = i * chunk_size
            end = start + chunk_size
            chunk = y[start:end]
            
            if len(chunk) > 0:
                # 取得該區段的最大與最小值，並四捨五入到小數點後 3 位以大幅減少 JSON 檔案大小
                min_val = round(float(np.min(chunk)), 3)
                max_val = round(float(np.max(chunk)), 3)
                peaks.append([min_val, max_val])
            else:
                peaks.append([0.0, 0.0])
                
        return rms, peaks
    except Exception as e:
        print(f"解析 {filepath} 失敗: {e}")
        return 0.0, []

def main():
    if not os.path.exists(SAMPLE_DIR):
        print(f"找不到 '{SAMPLE_DIR}' 資料夾")
        return
        
    samples = []
    
    files = [f for f in os.listdir(SAMPLE_DIR) if os.path.splitext(f)[1].lower() in AUDIO_EXTS]
    total_files = len(files)
    
    print(f"開始掃描與分析 {total_files} 個音頻檔案...")
    
    for index, filename in enumerate(files):
        filepath = os.path.join(SAMPLE_DIR, filename)
        web_path = f"{SAMPLE_DIR}/{filename}"
        
        print(f"[{index+1}/{total_files}] 正在處理: {filename} ...", end="", flush=True)
        
        # 執行音頻特徵擷取
        rms, peaks = process_audio(filepath)
        
        samples.append({
            "name": filename,
            "path": web_path,
            "rms": rms,
            "peaks": peaks
        })
        print(" 完成!")
            
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        # 使用 separators 去除多餘空白，讓輸出的 JSON 體積更小
        json.dump(samples, f, ensure_ascii=False, separators=(',', ':'))
        
    print(f"\n掃描與特徵提取完成！")
    print(f"結果已儲存至 {OUTPUT_JSON}")

if __name__ == "__main__":
    main()