import os
import json

# 設定根目錄
ASSETS_DIR = 'assets'
OUTPUT_FILE = 'course_data.js'

EXCLUDE_DIRS = {'css', 'fonts', 'js', 'static', '.git', '.vscode'}

def format_path(path):
    """將 Windows 路徑 (\) 轉換為 Web 路徑 (/)"""
    return path.replace('\\', '/')

def parse_textbooks(semester_path):
    """解析教科書：支援標準格式與純檔名格式"""
    textbooks = []
    tb_dir = os.path.join(semester_path, 'textbook')
    
    if os.path.exists(tb_dir):
        for f in sorted(os.listdir(tb_dir)):
            if f.lower().endswith('.pdf'):
                path = format_path(os.path.join(semester_path, 'textbook', f))
                name_no_ext = os.path.splitext(f)[0]
                
                # 嘗試分割 ' - '
                parts = name_no_ext.split(' - ')
                if len(parts) >= 3:
                    item = {
                        'title': parts[0],
                        'author': parts[1],
                        'version': parts[2],
                        'path': path
                    }
                else:
                    # 處理如 "工教系工數課綱.pdf" 這種沒有分隔符號的檔案
                    item = {
                        'title': name_no_ext,
                        'author': '', 
                        'version': '',
                        'path': path
                    }
                textbooks.append(item)
    return textbooks

def parse_handouts(semester_path):
    """解析講義：自動配對 _填空版 與 _解答版"""
    handouts_map = {}
    ho_dir = os.path.join(semester_path, 'handout')
    
    if os.path.exists(ho_dir):
        for f in sorted(os.listdir(ho_dir)): # 排序確保順序
            if f.lower().endswith('.pdf'):
                name_no_ext = os.path.splitext(f)[0]
                path = format_path(os.path.join(semester_path, 'handout', f))
                
                # 識別後綴
                title = name_no_ext
                h_type = None
                
                if '_填空版' in name_no_ext:
                    title = name_no_ext.replace('_填空版', '')
                    h_type = 'blank'
                elif '_解答版' in name_no_ext:
                    title = name_no_ext.replace('_解答版', '')
                    h_type = 'sol'
                
                if title not in handouts_map:
                    handouts_map[title] = {'title': title, 'blank': None, 'sol': None}
                
                if h_type:
                    handouts_map[title][h_type] = path
                else:
                    # 如果沒有特定後綴，就當作一般講義放在 blank 位置
                    handouts_map[title]['blank'] = path

    return list(handouts_map.values())

def parse_slides(semester_path):
    """解析簡報：支援 slide/子資料夾/檔案"""
    slides_data = [] # 結構: [{'category': '師大電機..', 'files': []}]
    slide_root = os.path.join(semester_path, 'slide')
    
    if os.path.exists(slide_root):
        # 遍歷 slide 底下的子資料夾
        for folder_name in sorted(os.listdir(slide_root)):
            folder_path = os.path.join(slide_root, folder_name)
            
            if os.path.isdir(folder_path):
                files = []
                for f in sorted(os.listdir(folder_path)):
                    if f.lower().endswith('.pdf'):
                        files.append({
                            'name': os.path.splitext(f)[0],
                            'path': format_path(os.path.join(semester_path, 'slide', folder_name, f))
                        })
                
                if files:
                    slides_data.append({
                        'category': folder_name,
                        'files': files
                    })
    return slides_data

def parse_practice(semester_path):
    """解析練習題：包含 links.txt, 考卷, 與 answer 資料夾"""
    practice_data = {
        'links': [],
        'exams': [],
        'answers': []
    }
    prac_dir = os.path.join(semester_path, 'practice')
    
    if os.path.exists(prac_dir):
        # 1. 讀取根目錄檔案 (考卷 & links)
        for f in sorted(os.listdir(prac_dir)):
            full_path = os.path.join(prac_dir, f)
            
            # 解析 links.txt
            if f == 'links.txt':
                try:
                    with open(full_path, 'r', encoding='utf-8') as txt_file:
                        for line in txt_file:
                            if '|' in line:
                                parts = line.strip().split('|')
                                practice_data['links'].append({
                                    'title': parts[0].strip(),
                                    'url': parts[1].strip()
                                })
                except Exception as e:
                    print(f"讀取連結錯誤: {f}, {e}")
            
            # 解析考卷 PDF
            elif f.lower().endswith('.pdf') and os.path.isfile(full_path):
                practice_data['exams'].append({
                    'name': os.path.splitext(f)[0],
                    'path': format_path(os.path.join(semester_path, 'practice', f))
                })

        # 2. 讀取 Answer 子資料夾
        ans_dir = os.path.join(prac_dir, 'answer')
        if os.path.exists(ans_dir):
            for f in sorted(os.listdir(ans_dir)):
                if f.lower().endswith('.pdf'):
                    # 取得原始檔名
                    name = os.path.splitext(f)[0]
                    
                    # [新增] 簡化顯示名稱：將 "_微積分乙_" 替換為 "_"
                    # 例如：1051_微積分乙_期中考詳解 -> 1051_期中考詳解
                    name = name.replace('_微積分乙_', '_')

                    practice_data['answers'].append({
                        'name': name,
                        'path': format_path(os.path.join(semester_path, 'practice', 'answer', f))
                    })
                    
    return practice_data

def main():
    course_data = {}
    
    if not os.path.exists(ASSETS_DIR):
        print(f"錯誤: 找不到資料夾 '{ASSETS_DIR}'")
        return

    # 取得 assets 下的所有項目
    all_items = os.listdir(ASSETS_DIR)
    
    # 過濾掉非資料夾與排除名單
    semesters = [
        d for d in all_items 
        if os.path.isdir(os.path.join(ASSETS_DIR, d)) 
        and d not in EXCLUDE_DIRS
        and not d.startswith('.') # 忽略隱藏檔
    ]

    # 排序並處理
    for semester in sorted(semesters, reverse=True):
        semester_path = os.path.join(ASSETS_DIR, semester)
        print(f"正在處理學期: {semester}...")
        
        # 這裡呼叫定義好的函式
        course_data[semester] = {
            'textbooks': parse_textbooks(semester_path),
            'handouts': parse_handouts(semester_path),
            'slides': parse_slides(semester_path),
            'practice': parse_practice(semester_path)
        }

    js_content = f"window.COURSE_DATA = {json.dumps(course_data, ensure_ascii=False, indent=4)};"
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"成功！已忽略系統資料夾，並生成 {OUTPUT_FILE}")

if __name__ == "__main__":
    main()