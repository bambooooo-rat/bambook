import os
import json

# 設定資料夾名稱與輸出的 JSON 檔名
SAMPLE_DIR = "sample"
OUTPUT_JSON = "samples.json"

# 支援的音頻副檔名
AUDIO_EXTS = {".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a"}

def main():
    # 如果 sample 資料夾不存在，則自動建立一個
    if not os.path.exists(SAMPLE_DIR):
        print(f"找不到 '{SAMPLE_DIR}' 資料夾")
        
    samples = []
    
    # 掃描資料夾內的檔案
    for filename in os.listdir(SAMPLE_DIR):
        ext = os.path.splitext(filename)[1].lower()
        if ext in AUDIO_EXTS:
            # 建立相對路徑 (供網頁端載入使用)
            filepath = f"{SAMPLE_DIR}/{filename}"
            samples.append({
                "name": filename,
                "path": filepath
            })
            
    # 寫入 JSON 檔案
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(samples, f, ensure_ascii=False, indent=4)
        
    print(f"掃描完成！共找到 {len(samples)} 個音頻檔案。")
    print(f"結果已儲存至 {OUTPUT_JSON}")

if __name__ == "__main__":
    main()