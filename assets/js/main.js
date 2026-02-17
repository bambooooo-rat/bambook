// assets/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    const data = window.COURSE_DATA;
    const nav = document.getElementById('semester-nav');
    const content = document.getElementById('content-area');

    // 通用排序函式：依照物件的 key (如 'title' 或 'name') 進行 A-Z 排序 (忽略大小寫)
    const sortByName = (array, key) => {
        return array.sort((a, b) => {
            const nameA = a[key].toString().toUpperCase(); 
            const nameB = b[key].toString().toUpperCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        });
    };

    // [新增] 手風琴切換功能 (掛載到 window 以便 onclick 呼叫)
    window.toggleSlide = function(headerElement) {
        // 1. 切換 Header 狀態 (旋轉箭頭)
        headerElement.classList.toggle('active');
        
        // 2. 找到對應的 Body 並切換顯示
        const body = headerElement.nextElementSibling;
        body.classList.toggle('open');
    };

    // 如果沒有資料的防呆
    if (!data || Object.keys(data).length === 0) {
        content.innerHTML = '<div class="content-card" style="text-align:center; color:#888;">尚未生成 course_data.js 或無資料</div>';
    } else {
        // [排序] 學期排序 A-Z (舊到新) -> 1141, 1142
        const semesters = Object.keys(data).sort();

        // 生成導覽按鈕
        semesters.forEach((sem, index) => {
            const btn = document.createElement('button');
            btn.className = index === 0 ? 'nav-btn active' : 'nav-btn';
            btn.innerHTML = `<span>📅</span> ${sem}`; 
            btn.onclick = () => renderSemester(sem, btn);
            nav.appendChild(btn);
        });

        // 預設渲染第一個學期
        renderSemester(semesters[0], nav.children[0]);
    }

    // 渲染函式
    function renderSemester(sem, activeBtn) {
        // 更新 Nav 按鈕狀態
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        if(activeBtn) activeBtn.classList.add('active');

        const d = data[sem];
        let html = '';

        // --- A. 教科書 (Textbooks) ---
        if (d.textbooks && d.textbooks.length > 0) {
            const sortedTextbooks = sortByName([...d.textbooks], 'title');

            html += `
            <div class="content-card">
                <div class="card-label">📖 Textbooks</div>
                <div class="textbook-grid">`;
            
            sortedTextbooks.forEach(tb => {
                html += `
                <div class="grid-item">
                    <div class="item-title" style="margin-bottom:5px;">${tb.title}</div>
                    <div class="item-meta" style="flex-grow:1;">
                        ${tb.author} <br> 
                        <span style="background:#f0f2f5; padding:2px 6px; border-radius:4px; font-size:0.75em;">${tb.version || 'Unknown Ver.'}</span>
                    </div>
                    <!-- [修改] 統一使用 action-group 與 btn-primary，移除原本巨大的 btn-download-large -->
                    <div class="action-group" style="margin-top: 15px;">
                        <a href="${tb.path}" class="btn btn-primary" target="_blank">.PDF</a>
                    </div>
                </div>`;
            });
            html += `</div></div>`;
        }

        // --- B. 講義 (Handouts) ---
        if (d.handouts && d.handouts.length > 0) {
            const sortedHandouts = sortByName([...d.handouts], 'title');

            html += `
            <div class="content-card">
                <div class="card-label">📝 Handouts</div>
                <ul class="resource-list">`;
            
            sortedHandouts.forEach(ho => {
                html += `
                <li class="resource-item">
                    <div class="item-info"><span class="item-title">${ho.title}</span></div>
                    <!-- 這是您指定的標準樣式 -->
                    <div class="action-group">
                        ${ho.blank ? `<a href="${ho.blank}" class="btn btn-blank" target="_blank">填空版</a>` : ''}
                        ${ho.sol ? `<a href="${ho.sol}" class="btn btn-sol" target="_blank">解答版</a>` : ''}
                    </div>
                </li>`;
            });
            html += `</ul></div>`;
        }

        // --- C. 簡報 (Slides) - 手風琴模式 ---
        if (d.slides && d.slides.length > 0) {
            html += `<div class="content-card"><div class="card-label">💻 Slides</div>`;
            
            // 資料夾排序 A-Z
            const sortedCategories = d.slides.sort((a, b) => a.category.localeCompare(b.category));

            sortedCategories.forEach(cat => {
                const sortedFiles = sortByName([...cat.files], 'name');

                html += `
                <div class="slide-accordion-group">
                    <div class="slide-accordion-header" onclick="toggleSlide(this)">
                        <span class="slide-header-title">${cat.category}</span>
                        <span class="slide-toggle-icon">▼</span>
                    </div>
                    <div class="slide-accordion-body grid-compact">`; 
                
                sortedFiles.forEach(f => {
                    html += `
                    <a href="${f.path}" class="grid-item-compact" target="_blank">
                        <span class="grid-icon-compact">📄</span>
                        <span class="grid-title-compact">${f.name}</span>
                    </a>`;
                });
                html += `</div></div>`;
            });
            html += `</div>`;
        }

        // --- D. 練習題 (Practice) ---
        const p = d.practice;
        if (p && (p.exams.length > 0 || p.answers.length > 0 || p.links.length > 0)) {
            html += `<div class="content-card"><div class="card-label">🧠 Practice & Resources</div>`;

            // 1. 常用連結 - [修改] 樣式與「歷屆試題」標題一致
            if (p.links.length > 0) {
                html += `<div style="margin-bottom:25px; padding-bottom:15px; border-bottom:1px dashed #eee;">
                    <h4 style="margin:0 0 10px 0; color:var(--text-title);">🔗 常用連結</h4>
                    <div style="display:flex; flex-wrap:wrap; gap:10px;">`;
                p.links.forEach(l => {
                    html += `<a href="${l.url}" class="nav-btn" style="background:#fff; border:1px solid #ddd;" target="_blank">➜ ${l.title}</a>`;
                });
                html += `</div></div>`;
            }

            // 2. 歷屆試題與詳解
            if (p.exams.length > 0 || p.answers.length > 0) {
                const sortedExams = sortByName([...p.exams], 'name');
                const sortedAnswers = sortByName([...p.answers], 'name').reverse();

                html += `<div style="display:flex; flex-direction:column; gap:20px;">`;
                
                // 試題區
                if (sortedExams.length > 0) {
                    html += `<div>
                        <h4 style="margin:0 0 10px 0; color:var(--text-title);">📄 歷屆試題</h4>
                        <div class="practice-grid-list">`;
                    sortedExams.forEach(ex => {
                        html += `
                        <div class="practice-item-compact">
                            <span style="font-size:0.9rem;">${ex.name}</span>
                            <!-- [修改] 移除 inline style，只保留 class，讓樣式繼承統一設定 -->
                            <div class="action-group">
                                <a href="${ex.path}" class="btn btn-primary" target="_blank">.PDF</a>
                            </div>
                        </div>`;
                    });
                    html += `</div></div>`;
                }

                // 詳解區 - [修改] 改為下拉展開選單 (Accordion)
                if (sortedAnswers.length > 0) {
                    html += `
                    <div class="slide-accordion-group">
                        <div class="slide-accordion-header" onclick="toggleSlide(this)">
                            <span class="slide-header-title">💡 參考詳解</span>
                            <span class="slide-toggle-icon">▼</span>
                        </div>
                        <div class="slide-accordion-body">
                            <div class="practice-grid-list">`;
                    
                    sortedAnswers.forEach(ans => {
                        html += `
                        <div class="practice-item-compact">
                            <span style="font-size:0.9rem;">${ans.name}</span>
                            <!-- [修改] 移除 inline style，只保留 class -->
                            <div class="action-group">
                                <a href="${ans.path}" class="btn btn-sol" target="_blank">.PDF</a>
                            </div>
                        </div>`;
                    });
                    html += `</div></div></div>`;
                }
                html += `</div>`;
            }
            html += `</div>`;
        }

        content.innerHTML = html;
    }
});