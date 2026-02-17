// assets/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    const data = window.COURSE_DATA;
    const nav = document.getElementById('semester-nav');
    const content = document.getElementById('content-area');

    // 通用排序函式
    const sortByName = (array, key) => {
        return array.sort((a, b) => {
            const nameA = a[key].toString().toUpperCase(); 
            const nameB = b[key].toString().toUpperCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        });
    };

    // 手風琴切換
    window.toggleSlide = function(headerElement) {
        headerElement.classList.toggle('active');
        const body = headerElement.nextElementSibling;
        body.classList.toggle('open');
    };

    if (!data || Object.keys(data).length === 0) {
        content.innerHTML = '<div class="content-card" style="text-align:center; color:#888;">尚未生成 course_data.js 或無資料</div>';
    } else {
        const semesters = Object.keys(data).sort();
        semesters.forEach((sem, index) => {
            const btn = document.createElement('button');
            btn.className = index === 0 ? 'nav-btn active' : 'nav-btn';
            btn.innerHTML = `<span>📅</span> ${sem}`; 
            btn.onclick = () => renderSemester(sem, btn);
            nav.appendChild(btn);
        });
        renderSemester(semesters[0], nav.children[0]);
    }

    // [核心優化] 分段渲染引擎
    function renderSemester(sem, activeBtn) {
        // 更新按鈕狀態
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        if(activeBtn) activeBtn.classList.add('active');

        // 1. 立即清空內容，給使用者即時回饋
        content.innerHTML = ''; 

        const d = data[sem];
        
        // 2. 定義渲染任務佇列 (Render Queue)
        // 每個函式負責生成一小塊 HTML，而不是一次生成全部
        const tasks = [
            () => getTextbooksHTML(d.textbooks),
            () => getHandoutsHTML(d.handouts),
            () => getSlidesHTML(d.slides),
            () => getPracticeHTML(d.practice)
        ];

        // 3. 開始執行分段渲染
        processRenderQueue(tasks);
    }

    // 佇列處理器：利用 requestAnimationFrame 分散主線程壓力
    function processRenderQueue(tasks) {
        if (tasks.length === 0) return;

        // 取出下一個任務
        const task = tasks.shift();
        const html = task();

        if (html) {
            // 創建一個容器並插入 DOM
            // 這裡使用 div 而不是 innerHTML +=，效能更好
            const sectionDiv = document.createElement('div');
            sectionDiv.innerHTML = html;
            // 加入淡入動畫 class
            sectionDiv.style.animation = 'fadeIn 0.3s ease-out';
            content.appendChild(sectionDiv);
        }

        // 預約下一幀執行下一個任務
        requestAnimationFrame(() => processRenderQueue(tasks));
    }

    // --- 以下為各區塊的 HTML 生成器 (Logic Split) ---

    function getTextbooksHTML(textbooks) {
        if (!textbooks || textbooks.length === 0) return '';
        const sorted = sortByName([...textbooks], 'title');
        
        let html = `
        <div class="content-card">
            <div class="card-label">📖 Textbooks</div>
            <div class="textbook-grid">`;
        
        sorted.forEach(tb => {
            html += `
            <div class="grid-item">
                <div class="item-title" style="margin-bottom:5px;">${tb.title}</div>
                <div class="item-meta" style="flex-grow:1;">
                    ${tb.author} <br> 
                    <span style="background:#f0f2f5; padding:2px 6px; border-radius:4px; font-size:0.75em;">${tb.version || 'Unknown Ver.'}</span>
                </div>
                <div class="action-group" style="margin-top: 15px;">
                    <a href="${tb.path}" class="btn btn-primary" target="_blank">.PDF</a>
                </div>
            </div>`;
        });
        html += `</div></div>`;
        return html;
    }

    function getHandoutsHTML(handouts) {
        if (!handouts || handouts.length === 0) return '';
        const sorted = sortByName([...handouts], 'title');

        let html = `
        <div class="content-card">
            <div class="card-label">📝 Handouts</div>
            <ul class="resource-list">`;
        
        sorted.forEach(ho => {
            html += `
            <li class="resource-item">
                <div class="item-info"><span class="item-title">${ho.title}</span></div>
                <div class="action-group">
                    ${ho.blank ? `<a href="${ho.blank}" class="btn btn-blank" target="_blank">填空版</a>` : ''}
                    ${ho.sol ? `<a href="${ho.sol}" class="btn btn-sol" target="_blank">解答版</a>` : ''}
                </div>
            </li>`;
        });
        html += `</ul></div>`;
        return html;
    }

    function getSlidesHTML(slides) {
        if (!slides || slides.length === 0) return '';
        // 資料夾 A-Z
        const sortedCategories = slides.sort((a, b) => a.category.localeCompare(b.category));
        
        let html = `<div class="content-card"><div class="card-label">💻 Slides</div>`;
        
        sortedCategories.forEach(cat => {
            // 檔案 A-Z
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
        return html;
    }

    function getPracticeHTML(practice) {
        if (!practice) return '';
        const { exams, answers, links } = practice;
        if (exams.length === 0 && answers.length === 0 && links.length === 0) return '';

        let html = `<div class="content-card"><div class="card-label">🧠 Practice & Resources</div>`;

        // 1. 常用連結
        if (links.length > 0) {
            html += `<div style="margin-bottom:25px; padding-bottom:15px; border-bottom:1px dashed #eee;">
                <h4 style="margin:0 0 10px 0; color:var(--text-title);">🔗 常用連結</h4>
                <div style="display:flex; flex-wrap:wrap; gap:10px;">`;
            links.forEach(l => {
                html += `<a href="${l.url}" class="nav-btn" style="background:#fff; border:1px solid #ddd;" target="_blank">➜ ${l.title}</a>`;
            });
            html += `</div></div>`;
        }

        if (exams.length > 0 || answers.length > 0) {
            html += `<div style="display:flex; flex-direction:column; gap:20px;">`;
            
            // 試題區 (A-Z)
            if (exams.length > 0) {
                const sortedExams = sortByName([...exams], 'name');
                html += `<div>
                    <h4 style="margin:0 0 10px 0; color:var(--text-title);">📄 歷屆試題</h4>
                    <div class="practice-grid-list">`;
                sortedExams.forEach(ex => {
                    html += `
                    <div class="practice-item-compact">
                        <span style="font-size:0.9rem;">${ex.name}</span>
                        <div class="action-group">
                            <a href="${ex.path}" class="btn btn-primary" target="_blank">.PDF</a>
                        </div>
                    </div>`;
                });
                html += `</div></div>`;
            }

            // 詳解區 (Z-A + Accordion)
            if (answers.length > 0) {
                const sortedAnswers = sortByName([...answers], 'name').reverse();
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
        return html;
    }
});