// assets/js/main.js

const SiteIcons = {
    // Bambook 主站
    logo: `     <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 4v16h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12z" />
                    <path d="M19 16h-12a2 2 0 0 0 -2 2" />
                    <path d="M9 8h6" />
                </svg>`,
    semester: ` <svg xmlns="http://www.w3.org/2000/svg" width="1.6em" height="1.6em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6l-8 4l8 4l8 -4l-8 -4" />
                    <path d="M4 14l8 4l8 -4" />
                </svg>`,
    schedule: `<svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 16l6 -7l5 5l5 -6" />
                    <path d="M15 14m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                    <path d="M10 9m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                    <path d="M4 16m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                    <path d="M20 8m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                </svg>`,
                
    // 資源分類
    textbook: ` <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
                    <path d="M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
                    <path d="M3 6l0 13" /><path d="M12 6l0 13" />
                    <path d="M21 6l0 13" />
                </svg>`,
    handout: `  <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                    <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
                    <path d="M9 17h6" />
                    <path d="M9 13h6" />
                </svg>`,
    slide: `    <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4l18 0" />
                    <path d="M4 4v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-10" />
                    <path d="M12 16l0 4" />
                    <path d="M9 20l6 0" />
                    <path d="M8 12l3 -3l2 2l3 -3" />
                </svg>`,
    practice: ` <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">  
                    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                    <path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4" />
                    <path d="M5 18h1.5a1.5 1.5 0 0 0 0 -3h-1.5v6" />
                    <path d="M17 18h2" />
                    <path d="M20 15h-3v6" />
                    <path d="M11 15v6h1a2 2 0 0 0 2 -2v-2a2 2 0 0 0 -2 -2h-1" />
                </svg>`,
    pdf: `      <svg xmlns="http://www.w3.org/2000/svg"  width="2em"  height="2em"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.6"  stroke-linecap="round"  stroke-linejoin="round">
                    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                    <path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4" />
                    <path d="M5 18h1.5a1.5 1.5 0 0 0 0 -3h-1.5v6" />
                    <path d="M17 18h2" />
                    <path d="M20 15h-3v6" />
                    <path d="M11 15v6h1a2 2 0 0 0 2 -2v-2a2 2 0 0 0 -2 -2h-1" />
                </svg>`,
    
    // 練習題區塊
    bookmarks: `    <svg style="vertical-align: -0.25em;" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M15 10v11l-5 -3l-5 3v-11a3 3 0 0 1 3 -3h4a3 3 0 0 1 3 3z" />
                        <path d="M11 3h5a3 3 0 0 1 3 3v11" />
                    </svg>`,
    archive: `  <svg style="vertical-align: -0.25em;" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 15l6 -6" />
                    <path d="M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464" />
                    <path d="M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463" />
                </svg>`,
    key: `  <svg style="vertical-align: -0.25em;" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16.555 3.843l3.602 3.602a2.877 2.877 0 0 1 0 4.069l-2.643 2.643a2.877 2.877 0 0 1 -4.069 0l-.301 -.301l-6.558 6.558a2 2 0 0 1 -1.239 .578l-.175 .008h-1.172a1 1 0 0 1 -.993 -.883l-.007 -.117v-1.172a2 2 0 0 1 .467 -1.284l.119 -.13l.414 -.414h2v-2h2v-2l2.144 -2.144l-.301 -.301a2.877 2.877 0 0 1 0 -4.069l2.643 -2.643a2.877 2.877 0 0 1 4.069 0z" />
                <path d="M15 9h.01" />
            </svg>`,
};

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
            btn.innerHTML = `<span>${SiteIcons.semester}</span> ${sem}`; 
            btn.onclick = () => renderSemester(sem, btn);
            nav.appendChild(btn);
        });
        renderSemester(semesters[0], nav.children[0]);
    }

    function renderSemester(sem, activeBtn) {
        // 更新按鈕狀態
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        if(activeBtn) activeBtn.classList.add('active');

        // 1. 立即清空內容，給使用者即時回饋
        content.innerHTML = ''; 

        const d = data[sem];
        
        // 2. 定義渲染任務佇列 (Render Queue)
        const tasks = [
            () => getSyllabusHTML(d.syllabus),
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
            const sectionDiv = document.createElement('div');
            sectionDiv.innerHTML = html;
            sectionDiv.style.animation = 'fadeIn 0.3s ease-out';
            content.appendChild(sectionDiv);
        }

        // 預約下一幀執行下一個任務
        requestAnimationFrame(() => processRenderQueue(tasks));
    }

    // --- 以下為各區塊的 HTML 生成器 ---

    function getSyllabusHTML(syllabusPath) {
        if (!syllabusPath) return '';
        
        return `
        <div class="content-card" style="padding: 15px 25px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid var(--color-accent);">
            <div style="font-weight: 600; font-size: 1.1rem; color: var(--text-title); display: flex; align-items: center; gap: 8px;">
                ${SiteIcons.schedule} 研討期程
            </div>
            <div class="action-group">
                <a href="${syllabusPath}" class="btn btn-primary" target="_blank">${SiteIcons.pdf}</a>
            </div>
        </div>`;
    }

    function getTextbooksHTML(textbooks) {
        if (!textbooks || textbooks.length === 0) return '';
        const sorted = sortByName([...textbooks], 'title');
        
        let html = `
        <div class="content-card">
            <div class="card-label">Textbooks</div>
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
                    <a href="${tb.path}" class="btn btn-primary" target="_blank">${SiteIcons.pdf}</a>
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
            <div class="card-label">Handouts</div>
            <ul class="resource-list">`;
        
        sorted.forEach(ho => {
            html += `
            <li class="resource-item">
                <div class="item-info"><span class="item-title">${ho.title}</span></div>
                <div class="action-group">
                    ${ho.blank ? `<a href="${ho.blank}" class="btn btn-blank" target="_blank">填空${SiteIcons.pdf}</a>` : ''}
                    ${ho.sol ? `<a href="${ho.sol}" class="btn btn-sol" target="_blank">解答${SiteIcons.pdf}</a>` : ''}
                </div>
            </li>`;
        });
        html += `</ul></div>`;
        return html;
    }

    function getSlidesHTML(slides) {
        if (!slides || slides.length === 0) return '';
        const sortedCategories = slides.sort((a, b) => a.category.localeCompare(b.category));
        
        let html = `<div class="content-card"><div class="card-label">Slides</div>`;
        
        sortedCategories.forEach(cat => {
            const sortedFiles = sortByName([...cat.files], 'name');
            html += `
            <div class="slide-accordion-group">
                <div class="slide-accordion-header" onclick="toggleSlide(this)">
                    <span class="slide-header-title">${cat.category}</span>
                    <span class="slide-toggle-icon">▼</span>
                </div>
                <div class="slide-accordion-body">
                    <!-- 使用與歷屆試題相同的網格類別 -->
                    <div class="practice-grid-list">`; 
            
            sortedFiles.forEach(f => {
                html += `
                <div class="practice-item-compact">
                    <span style="font-size:0.9rem;">${f.name}</span>
                    <div class="action-group">
                        <a href="${f.path}" class="btn btn-primary" target="_blank">${SiteIcons.pdf}</a>
                    </div>
                </div>`;
            });
            html += `</div></div></div>`;
        });
        html += `</div>`;
        return html;
    }

    function getPracticeHTML(practice) {
        if (!practice) return '';
        const { exams = [], midterm_answers = [], final_answers = [], other_answers = [], answers: legacy_answers = [], links = [] } = practice;
        
        const hasAnswers = midterm_answers.length > 0 || final_answers.length > 0 || other_answers.length > 0 || legacy_answers.length > 0;

        if (exams.length === 0 && !hasAnswers && links.length === 0) return '';

        let html = `<div class="content-card"><div class="card-label">Practice & Resources</div>`;

        // 1. 常用連結
        if (links.length > 0) {
            html += `<div style="margin-bottom:25px; padding-bottom:15px; border-bottom:1px dashed #eee;">
                <h4 style="margin:0 0 10px 0; color:var(--text-title);">${SiteIcons.archive} 常用連結</h4>
                <div style="display:flex; flex-wrap:wrap; gap:10px;">`;
            links.forEach(l => {
                html += `<a href="${l.url}" class="nav-btn" style="background:#fff; border:1px solid #ddd;" target="_blank">➜ ${l.title}</a>`;
            });
            html += `</div></div>`;
        }

        if (exams.length > 0 || hasAnswers) {
            html += `<div style="display:flex; flex-direction:column; gap:20px;">`;
            
            // 試題區 (A-Z)
            if (exams.length > 0) {
                const sortedExams = sortByName([...exams], 'name');
                html += `<div>
                    <h4 style="margin:0 0 10px 0; color:var(--text-title);">${SiteIcons.bookmarks} 歷屆試題</h4>
                    <div class="practice-grid-list">`;
                sortedExams.forEach(ex => {
                    html += `
                    <div class="practice-item-compact">
                        <span style="font-size:0.9rem;">${ex.name}</span>
                        <div class="action-group">
                            <a href="${ex.path}" class="btn btn-primary" target="_blank">${SiteIcons.pdf}</a>
                        </div>
                    </div>`;
                });
                html += `</div></div>`;
            }

            // 詳解區：將各類別包裝成獨立的手風琴 (Accordion)
            if (hasAnswers) {
                html += `<div>
                    <h4 style="margin:0 0 10px 0; color:var(--text-title);">${SiteIcons.key} 參考詳解</h4>
                    <div style="display:flex; flex-direction:column; gap:10px;">`;
                
                const generateAnswerAccordion = (title, answersList, icon) => {
                    if (!answersList || answersList.length === 0) return '';
                    const sortedAnswers = sortByName([...answersList], 'name').reverse(); // Z-A 排序
                    
                    let accHtml = `
                    <div class="slide-accordion-group" style="margin-bottom:0;">
                        <div class="slide-accordion-header" onclick="toggleSlide(this)">
                            <span class="slide-header-title">${icon} ${title}</span>
                            <span class="slide-toggle-icon">▼</span>
                        </div>
                        <div class="slide-accordion-body">
                            <div class="practice-grid-list">`;
                    
                    sortedAnswers.forEach(ans => {
                        accHtml += `
                        <div class="practice-item-compact">
                            <span style="font-size:0.9rem;">${ans.name}</span>
                            <div class="action-group">
                                <a href="${ans.path}" class="btn btn-sol" target="_blank">${SiteIcons.pdf}</a>
                            </div>
                        </div>`;
                    });
                    
                    accHtml += `</div></div></div>`;
                    return accHtml;
                };

                html += generateAnswerAccordion('期中考參考詳解', midterm_answers, '');
                html += generateAnswerAccordion('期末考參考詳解', final_answers, '');
                html += generateAnswerAccordion('其他參考詳解', other_answers, '');
                html += generateAnswerAccordion('參考詳解', legacy_answers, ''); // 相容舊資料

                html += `</div></div>`;
            }
            html += `</div>`;
        }
        html += `</div>`;
        return html;
    }
});