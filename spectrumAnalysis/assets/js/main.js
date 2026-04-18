        // DOM 元素擷取
        const fileInput = document.getElementById('audioFile');
        const audioPlayer = document.getElementById('audioPlayer');
        const playPauseBtn = document.getElementById('playPauseBtn');
        const currentTimeEl = document.getElementById('currentTime');
        const durationEl = document.getElementById('duration');
        const trackNameEl = document.getElementById('trackName');

        const waveformWrapper = document.getElementById('waveformWrapper');
        const waveformCanvas = document.getElementById('waveformCanvas');
        const waveformLoading = document.getElementById('waveformLoading');

        const previewBtn = document.getElementById('previewBtn');
        const resetBtn = document.getElementById('resetBtn');
        const scaleBtn = document.getElementById('scaleBtn');

        const canvas = document.getElementById('spectrumCanvas');
        const canvasCtx = canvas.getContext('2d');
        const eqContainer = document.getElementById('eqContainer');
        const presetDropdownContainer = document.getElementById('presetDropdownContainer');
        const presetDropdownSelected = document.getElementById('presetDropdownSelected');
        const presetDropdownList = document.getElementById('presetDropdownList');
        const presetDesc = document.getElementById('presetDesc');
        const canvasOverlay = document.getElementById('canvasOverlay');

        const audioDropdownContainer = document.getElementById('audioDropdownContainer');
        const audioDropdownBtn = document.getElementById('audioDropdownBtn');
        const sampleListContainer = document.getElementById('sampleListContainer');

        const iconPlay = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
        const iconPause = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;

        let audioCtx;
        let sourceNode;
        let analyser;
        let outputGainNode; 
        
        let filters = [];
        let isInitialized = false;
        let isEqBypassed = false;
        let isLogScale = true; 
        let trackBaseGain = 1.0;

        let waveformBufferCanvas = document.createElement('canvas');
        let waveformBufferCtx = waveformBufferCanvas.getContext('2d');
        let isWaveformReady = false;

        const MIN_FREQ = 20;
        const MAX_FREQ = 20000;
        const MAX_GAIN = 15;
        const LOG_MIN = Math.log10(MIN_FREQ);
        const LOG_MAX = Math.log10(MAX_FREQ);

        let draggingBandIndex = -1;
        let hoverBandIndex = -1;
        let hoverRegionIndex = -1;
        let currentMousePos = { x: -100, y: -100 };
        const knobControllers = [];

        // 頻率與座標對應
        function freqToX(freq, width) {
            const f = Math.max(MIN_FREQ, Math.min(MAX_FREQ, freq));
            if (isLogScale) return ((Math.log10(f) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * width;
            return ((f - MIN_FREQ) / (MAX_FREQ - MIN_FREQ)) * width;
        }
        function xToFreq(x, width) {
            const ratio = Math.max(0, Math.min(1, x / width));
            if (isLogScale) return Math.pow(10, LOG_MIN + ratio * (LOG_MAX - LOG_MIN));
            return MIN_FREQ + ratio * (MAX_FREQ - MIN_FREQ);
        }
        function gainToY(gain, height) {
            const g = Math.max(-MAX_GAIN, Math.min(MAX_GAIN, gain));
            return (height / 2) - (g / MAX_GAIN) * (height / 2);
        }
        function yToGain(y, height) {
            const ratio = (height / 2 - y) / (height / 2);
            return Math.max(-MAX_GAIN, Math.min(MAX_GAIN, ratio * MAX_GAIN));
        }

        function updateStaticAutoGain() {
            if (!isInitialized || filters.length === 0) return;
            const sampleCount = 100;
            const freqs = new Float32Array(sampleCount);
            for (let i = 0; i < sampleCount; i++) freqs[i] = Math.pow(10, LOG_MIN + (i / (sampleCount - 1)) * (LOG_MAX - LOG_MIN));

            const totalMag = new Float32Array(sampleCount).fill(1.0);
            filters.forEach(filter => {
                const magResponse = new Float32Array(sampleCount);
                const phaseResponse = new Float32Array(sampleCount);
                filter.getFrequencyResponse(freqs, magResponse, phaseResponse);
                for (let i = 0; i < sampleCount; i++) totalMag[i] *= magResponse[i];
            });

            let avgMag = 0;
            for (let i = 0; i < sampleCount; i++) avgMag += totalMag[i];
            avgMag /= sampleCount;

            const eqCompensation = Math.max(0.25, Math.min(4.0, 1 / (avgMag || 1)));
            const finalGain = isEqBypassed ? trackBaseGain : trackBaseGain * eqCompensation;
            outputGainNode.gain.setTargetAtTime(finalGain, audioCtx.currentTime, 0.05);
        }

        const defaultEqBands = [
            { id: 'band1', type: 'peaking', label: 'Band 1', freq: 60,   q: 1.0, gain: 0, color: '#ff4d4d', toggleType: 'highpass' },
            { id: 'band2', type: 'peaking', label: 'Band 2', freq: 230,  q: 1.0, gain: 0, color: '#ffa64d' },
            { id: 'band3', type: 'peaking', label: 'Band 3', freq: 910,  q: 1.0, gain: 0, color: '#4dff4d' },
            { id: 'band4', type: 'peaking', label: 'Band 4', freq: 3600,  q: 1.0, gain: 0, color: '#4da6ff' },
            { id: 'band5', type: 'peaking', label: 'Band 5', freq: 12000, q: 1.0, gain: 0, color: '#b366ff', toggleType: 'lowpass' }
        ];

        let eqBands = JSON.parse(JSON.stringify(defaultEqBands));

        const freqRegions = [
            { name: "Sub-bass", min: 20, max: 60, color: "236, 72, 153", desc1: "〈超低頻〉重量、震動感、氣氛", desc2: "大鼓最底部、貝斯的最低音" },
            { name: "Bass", min: 60, max: 250, color: "245, 158, 11", desc1: "〈低頻〉音樂的厚度、暖度", desc2: "貝斯吉他、男聲基音下緣" },
            { name: "Low mids", min: 250, max: 1000, color: "16, 185, 129", desc1: "〈低中頻〉身體感、厚薄感", desc2: "男女聲胸腔共鳴、吉他本體" },
            { name: "Presence", min: 1000, max: 5000, color: "59, 130, 246", desc1: "〈中高頻〉清晰度、存在感", desc2: "人聲咬字、電吉他存在感" },
            { name: "Air", min: 5000, max: 20000, color: "139, 92, 246", desc1: "〈高頻〉亮度、空氣感、細節", desc2: "鈸、齒音、弦樂泛音" }
        ];

        const eqPresets = [
            { name: '去混濁', desc: '清掉「糊糊的、悶悶的」中低頻，樂器分離度更好', bands: [ { type: 'peaking', freq: 80, q: 0.8, gain: 0 }, { type: 'peaking', freq: 180, q: 1.1, gain: -3 }, { type: 'peaking', freq: 350, q: 1.2, gain: -4 }, { type: 'peaking', freq: 1600, q: 1.0, gain: 1 }, { type: 'peaking', freq: 10000,q: 0.7, gain: 1 } ] },
            { name: '人聲增強', desc: '人聲更靠前、更清楚，字頭和咬字會更突出', bands: [ { type: 'highpass', freq: 75, q: 0.7, gain: -12 }, { type: 'peaking', freq: 200, q: 1.0, gain: -2 }, { type: 'peaking', freq: 1200, q: 1.0, gain: 1 }, { type: 'peaking', freq: 3500, q: 1.0, gain: 4 }, { type: 'peaking', freq: 10000,q: 0.7, gain: 2 } ] },
            { name: '修飾刺耳', desc: '可壓掉尖銳、刺耳、聽久會累的區域', bands: [ { type: 'peaking', freq: 80, q: 0.8, gain: 0 }, { type: 'peaking', freq: 250, q: 1.0, gain: 1 }, { type: 'peaking', freq: 2500, q: 1.2, gain: -3 }, { type: 'peaking', freq: 4500, q: 1.4, gain: -4 }, { type: 'peaking', freq: 12000,q: 0.8, gain: -1 } ] },
            { name: '空氣感', desc: '高頻更亮、更開，會有「通透、發亮」的感覺', bands: [ { type: 'highpass', freq: 150, q: 0.7, gain: -12 }, { type: 'peaking', freq: 250, q: 1.0, gain: -1 }, { type: 'peaking', freq: 2000, q: 1.0, gain: 1 }, { type: 'peaking', freq: 8000, q: 0.8, gain: 3 }, { type: 'peaking', freq: 14000,q: 0.7, gain: 4 } ] },
            { name: '老收音機', desc: '模擬早期電話筒或收音機的極窄帶通音色', bands: [ { type: 'highpass', freq: 300, q: 0.7, gain: -12 }, { type: 'peaking', freq: 500, q: 1.0, gain: -2 }, { type: 'peaking', freq: 1000, q: 1.0, gain: 3 }, { type: 'peaking', freq: 2500, q: 1.0, gain: 2 }, { type: 'lowpass', freq: 3400, q: 0.7, gain: -12 } ] }
        ];

        const fallbackSamples = [
            { "name": "SQAM - Female Speech (EN).flac", "path": "sample/SQAM - Female Speech (EN).flac" },
            { "name": "Michael Jackson - Billie Jean.flac", "path": "sample/Michael Jackson - Billie Jean.flac" },
            { "name": "Chromatic Scale (piano).mp3", "path": "sample/Chromatic Scale (piano).mp3" }
        ];

        function initAudio() {
            if (isInitialized) return;
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 16384; 
            analyser.smoothingTimeConstant = 0.85; 

            outputGainNode = audioCtx.createGain();
            sourceNode = audioCtx.createMediaElementSource(audioPlayer);
            
            let prevNode = sourceNode;
            eqBands.forEach((band) => {
                let filter = audioCtx.createBiquadFilter();
                filter.type = band.type; 
                filter.frequency.value = band.freq;
                filter.Q.value = band.q; 
                filter.gain.value = band.gain; 
                filters.push(filter);
                prevNode.connect(filter);
                prevNode = filter;
            });

            prevNode.connect(outputGainNode);
            outputGainNode.connect(analyser); 
            analyser.connect(audioCtx.destination);
            
            sourceNode.disconnect();
            if (isEqBypassed) sourceNode.connect(outputGainNode);
            else sourceNode.connect(filters[0]);

            isInitialized = true;
            canvasOverlay.style.display = 'none'; 
            resizeCanvas();
        }

        function resizeCanvas() {
            const rect = canvas.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                canvas.width = rect.width;
                canvas.height = rect.height;
            }
        }
        window.addEventListener('resize', resizeCanvas);

        audioDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            audioDropdownContainer.classList.toggle('open');
            presetDropdownContainer.classList.remove('open');
        });

        document.addEventListener('click', (e) => {
            if (!presetDropdownContainer.contains(e.target)) presetDropdownContainer.classList.remove('open');
            if (!audioDropdownContainer.contains(e.target)) audioDropdownContainer.classList.remove('open');
        });

        function renderSampleList(samples) {
            sampleListContainer.innerHTML = '';
            if (samples.length === 0) {
                sampleListContainer.innerHTML = '<div class="audio-dropdown-item" style="color:var(--text-muted); font-size: 0.8rem; pointer-events:none;">無內建音頻</div>';
                return;
            }
            samples.sort((a, b) => a.name.localeCompare(b.name));
            samples.forEach(sample => {
                const item = document.createElement('div');
                item.className = 'audio-dropdown-item';
                item.innerHTML = `🎵 ${sample.name}`;
                item.title = sample.name;
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    loadAudio(sample.path, sample.name, false);
                    audioDropdownContainer.classList.remove('open');
                });
                sampleListContainer.appendChild(item);
            });
        }

        function fetchSampleList() {
            fetch('samples.json')
                .then(res => res.ok ? res.json() : fallbackSamples)
                .catch(() => fallbackSamples)
                .then(samples => renderSampleList(samples));
        }

        function formatTime(seconds) {
            const m = Math.floor(seconds / 60);
            const s = Math.floor(seconds % 60);
            return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
        }

        function loadAudio(source, name, isFile = true) {
            trackNameEl.innerText = name;
            trackNameEl.style.color = 'var(--text-title)';
            playPauseBtn.disabled = false;
            playPauseBtn.innerHTML = iconPlay;

            if (!isInitialized) initAudio();
            if (audioCtx.state === 'suspended') audioCtx.resume();

            waveformLoading.innerText = "解析波形與計算能量中...";
            waveformLoading.classList.add('active');
            waveformWrapper.classList.remove('loaded');
            isWaveformReady = false;

            if (isFile) {
                const objectUrl = URL.createObjectURL(source);
                audioPlayer.src = objectUrl;
                source.arrayBuffer()
                    .then(buffer => audioCtx.decodeAudioData(buffer))
                    .then(audioBuffer => renderWaveformBuffer(audioBuffer))
                    .catch(err => { console.error(err); waveformLoading.innerText = "波形解析失敗"; });
            } else {
                audioPlayer.src = source;
                fetch(source)
                    .then(response => response.arrayBuffer())
                    .then(buffer => audioCtx.decodeAudioData(buffer))
                    .then(audioBuffer => renderWaveformBuffer(audioBuffer))
                    .catch(err => { console.error(err); waveformLoading.innerText = "波形解析失敗"; });
            }
        }

        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            loadAudio(file, file.name, true);
            audioDropdownContainer.classList.remove('open');
        });

        function initPresets() {
            presetDropdownList.innerHTML = '';
            eqPresets.forEach((preset, index) => {
                const item = document.createElement('div');
                item.className = 'custom-dropdown-item';
                item.innerText = preset.name;
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    applyPreset(index);
                    presetDropdownContainer.classList.remove('open');
                });
                presetDropdownList.appendChild(item);
            });
            presetDropdownSelected.addEventListener('click', (e) => {
                e.stopPropagation();
                presetDropdownContainer.classList.toggle('open');
                audioDropdownContainer.classList.remove('open');
            });
        }

        function clearPresetActive() {
            document.querySelectorAll('.custom-dropdown-item').forEach(el => el.classList.remove('active'));
            presetDropdownSelected.innerText = '手動調整中';
            presetDropdownSelected.style.color = 'var(--text-muted)';
            presetDesc.innerText = '拖曳畫布控制點，或調整 EQ 旋鈕';
        }

        function applyPreset(presetIndex) {
            document.querySelectorAll('.custom-dropdown-item').forEach((el, idx) => el.classList.toggle('active', idx === presetIndex));
            presetDropdownSelected.innerText = eqPresets[presetIndex].name;
            presetDropdownSelected.style.color = 'var(--text-title)';
            presetDesc.innerText = eqPresets[presetIndex].desc;
            
            const presetData = eqPresets[presetIndex].bands;
            eqBands.forEach((band, index) => {
                const pd = presetData[index];
                band.type = pd.type; band.freq = pd.freq; band.q = pd.q; band.gain = pd.gain;
                if (filters[index]) {
                    filters[index].type = band.type;
                    filters[index].frequency.value = band.freq;
                    filters[index].Q.value = band.q;
                    filters[index].gain.value = band.gain;
                }
                knobControllers[index].freq.updateUI(band.freq);
                knobControllers[index].gain.updateUI(band.gain);
                knobControllers[index].q.updateUI(band.q);
                if (band.toggleType) {
                    const switchOptPeaking = document.querySelector(`#type-switch-${index} .filter-switch-opt[data-type="peaking"]`);
                    const switchOptPass = document.querySelector(`#type-switch-${index} .filter-switch-opt[data-type="${band.toggleType}"]`);
                    if (switchOptPeaking && switchOptPass) {
                        const isPeaking = (band.type === 'peaking');
                        switchOptPeaking.classList.toggle('active', isPeaking);
                        switchOptPass.classList.toggle('active', !isPeaking);
                    }
                    const gainKnobWrapper = document.getElementById(`knob-gain-${index}`);
                    if (band.type === 'peaking') { gainKnobWrapper.style.opacity = '1'; gainKnobWrapper.style.pointerEvents = 'auto'; }
                    else { gainKnobWrapper.style.opacity = '0.3'; gainKnobWrapper.style.pointerEvents = 'none'; }
                }
            });
            updateStaticAutoGain(); 
        }

        function renderWaveformBuffer(audioBuffer) {
            const rawData = audioBuffer.getChannelData(0); 
            let sumSquares = 0;
            for (let i = 0; i < rawData.length; i++) sumSquares += rawData[i] * rawData[i];
            const trackRMS = Math.sqrt(sumSquares / rawData.length);
            const targetRMS = 0.15; 
            
            if (trackRMS > 0.0001) trackBaseGain = Math.max(0.1, Math.min(targetRMS / trackRMS, 5.0)); 
            else trackBaseGain = 1.0;
            updateStaticAutoGain();

            const w = waveformWrapper.clientWidth * 2; 
            const h = waveformWrapper.clientHeight * 2;
            waveformBufferCanvas.width = w; waveformBufferCanvas.height = h;
            waveformCanvas.width = w; waveformCanvas.height = h;
            const step = Math.ceil(rawData.length / w);
            const amp = h / 2;
            waveformBufferCtx.clearRect(0, 0, w, h);
            waveformBufferCtx.fillStyle = '#cbd5e1'; 
            for (let i = 0; i < w; i++) {
                let min = 1.0; let max = -1.0;
                for (let j = 0; j < step; j++) {
                    const datum = rawData[(i * step) + j];
                    if (datum < min) min = datum; if (datum > max) max = datum;
                }
                const y = (1 + min) * amp; const height = Math.max(1, (max - min) * amp); 
                waveformBufferCtx.fillRect(i, y, 1, height);
            }
            isWaveformReady = true;
            waveformWrapper.classList.add('loaded');
            waveformLoading.classList.remove('active');
            drawWaveformProgress(); 
        }

        function drawWaveformProgress() {
            if (!isWaveformReady) return;
            const ctx = waveformCanvas.getContext('2d');
            const w = waveformCanvas.width; const h = waveformCanvas.height;
            ctx.clearRect(0, 0, w, h);
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(waveformBufferCanvas, 0, 0);
            if (audioPlayer.duration) {
                const progress = audioPlayer.currentTime / audioPlayer.duration;
                ctx.globalCompositeOperation = 'source-atop';
                ctx.fillStyle = '#2196f3'; ctx.fillRect(0, 0, w * progress, h);
                ctx.globalCompositeOperation = 'source-over';
                ctx.fillStyle = '#0d47a1'; ctx.fillRect(w * progress, 0, 2, h);
            }
        }

        // --- Waveform Interaction (Mouse + Touch 整合) ---
        let isDraggingWaveform = false;
        function seekWaveform(clientX) {
            if (!audioPlayer.duration || !isWaveformReady) return;
            const rect = waveformWrapper.getBoundingClientRect();
            let x = clientX - rect.left; 
            x = Math.max(0, Math.min(x, rect.width));
            const percentage = x / rect.width;
            audioPlayer.currentTime = percentage * audioPlayer.duration;
            drawWaveformProgress();
        }

        waveformWrapper.addEventListener('mousedown', (e) => { if (!isWaveformReady) return; isDraggingWaveform = true; seekWaveform(e.clientX); });
        waveformWrapper.addEventListener('touchstart', (e) => { 
            if (!isWaveformReady) return; 
            isDraggingWaveform = true; 
            if(e.cancelable) e.preventDefault();
            seekWaveform(e.touches[0].clientX); 
        }, { passive: false });
        
        window.addEventListener('mousemove', (e) => { if (isDraggingWaveform) seekWaveform(e.clientX); });
        window.addEventListener('touchmove', (e) => { 
            if (isDraggingWaveform) { 
                if(e.cancelable) e.preventDefault(); 
                seekWaveform(e.touches[0].clientX); 
            } 
        }, { passive: false });
        
        window.addEventListener('mouseup', () => { isDraggingWaveform = false; });
        window.addEventListener('touchend', () => { isDraggingWaveform = false; });

        playPauseBtn.addEventListener('click', () => { if (audioPlayer.paused) audioPlayer.play(); else audioPlayer.pause(); });
        audioPlayer.addEventListener('play', () => { if (!isInitialized) initAudio(); if (audioCtx.state === 'suspended') audioCtx.resume(); playPauseBtn.innerHTML = iconPause; });
        audioPlayer.addEventListener('pause', () => { playPauseBtn.innerHTML = iconPlay; });
        audioPlayer.addEventListener('loadedmetadata', () => { durationEl.innerText = formatTime(audioPlayer.duration); });
        audioPlayer.addEventListener('timeupdate', () => { currentTimeEl.innerText = formatTime(audioPlayer.currentTime); });
        audioPlayer.addEventListener('ended', () => { playPauseBtn.innerHTML = iconPlay; currentTimeEl.innerText = "00:00"; });

        previewBtn.addEventListener('click', () => {
            isEqBypassed = !isEqBypassed;
            if (isEqBypassed) previewBtn.classList.add('bypassed'); else previewBtn.classList.remove('bypassed');
            if (isInitialized) {
                sourceNode.disconnect();
                if (isEqBypassed) sourceNode.connect(outputGainNode);
                else sourceNode.connect(filters[0]);
                updateStaticAutoGain(); 
            }
        });

        resetBtn.addEventListener('click', () => {
            clearPresetActive(); presetDesc.innerText = '已重設EQ參數';
            eqBands.forEach((band, index) => {
                const def = defaultEqBands[index];
                band.type = def.type; band.freq = def.freq; band.q = def.q; band.gain = def.gain;
                if (filters[index]) { filters[index].type = band.type; filters[index].frequency.value = band.freq; filters[index].Q.value = band.q; filters[index].gain.value = band.gain; }
                knobControllers[index].freq.updateUI(band.freq); knobControllers[index].gain.updateUI(band.gain); knobControllers[index].q.updateUI(band.q);
                if (band.toggleType) {
                    const switchOptPeaking = document.querySelector(`#type-switch-${index} .filter-switch-opt[data-type="peaking"]`);
                    const switchOptPass = document.querySelector(`#type-switch-${index} .filter-switch-opt[data-type="${band.toggleType}"]`);
                    if (switchOptPeaking && switchOptPass) { switchOptPeaking.classList.add('active'); switchOptPass.classList.remove('active'); }
                    const gainKnobWrapper = document.getElementById(`knob-gain-${index}`);
                    gainKnobWrapper.style.opacity = '1'; gainKnobWrapper.style.pointerEvents = 'auto';
                }
            });
            updateStaticAutoGain();
        });

        scaleBtn.addEventListener('click', () => {
            isLogScale = !isLogScale;
            scaleBtn.innerText = `Scale: ${isLogScale ? 'Log' : 'Linear'}`;
        });

        // --- Knob Interaction (Mouse + Touch 整合) ---
        let activeKnob = null; 
        function handleGlobalKnobMove(clientY) {
            if (activeKnob) {
                const deltaY = activeKnob.startY - clientY; 
                let newVal;
                if (activeKnob.isLog) {
                    const logStart = Math.log10(activeKnob.startVal);
                    const logNew = logStart + (deltaY / 150);
                    newVal = Math.pow(10, logNew);
                } else {
                    const range = activeKnob.max - activeKnob.min;
                    newVal = activeKnob.startVal + (deltaY / 200) * range;
                    newVal = Math.round(newVal / activeKnob.step) * activeKnob.step;
                }
                newVal = Math.max(activeKnob.min, Math.min(activeKnob.max, newVal));
                activeKnob.updateUI(newVal); activeKnob.onChange(newVal);
                updateStaticAutoGain(); 
            }
        }
        
        window.addEventListener('mousemove', (e) => handleGlobalKnobMove(e.clientY));
        window.addEventListener('touchmove', (e) => { 
            if(activeKnob) { 
                if(e.cancelable) e.preventDefault(); // 阻擋操作旋鈕時網頁跟著上下滾動
                handleGlobalKnobMove(e.touches[0].clientY); 
            } 
        }, { passive: false });
        
        window.addEventListener('mouseup', () => { if(activeKnob) activeKnob = null; });
        window.addEventListener('touchend', () => { if(activeKnob) activeKnob = null; });

        function setupKnob(container, min, max, step, initVal, color, isLog, onChange, formatFunc) {
            const base = container.querySelector('.knob-base'); // 精確綁定到本體避免誤觸
            const dial = container.querySelector('.knob-dial');
            const valDisplay = container.querySelector('.knob-val');
            
            let currentVal = initVal;
            function updateUI(v) {
                currentVal = Math.max(min, Math.min(max, v));
                let ratio;
                if (isLog) ratio = (Math.log10(currentVal) - Math.log10(min)) / (Math.log10(max) - Math.log10(min));
                else ratio = (currentVal - min) / (max - min);
                const angle = -135 + (ratio * 270); dial.style.transform = `rotate(${angle}deg)`;
                valDisplay.innerText = formatFunc(currentVal);
            }
            
            function onKnobDown(clientY, e) {
                if(e && e.cancelable) e.preventDefault(); 
                activeKnob = { min, max, step, updateUI, onChange, isLog, currentVal, startY: clientY, startVal: currentVal }; 
            }
            
            base.addEventListener('mousedown', (e) => onKnobDown(e.clientY, e));
            base.addEventListener('touchstart', (e) => onKnobDown(e.touches[0].clientY, e), { passive: false });
            
            updateUI(initVal); return { updateUI };
        }

        function createPEQUI() {
            eqContainer.innerHTML = '';
            eqBands.forEach((band, index) => {
                const card = document.createElement('div');
                card.className = 'band-card'; card.style.setProperty('--band-color', band.color);
                const isPeaking = band.type === 'peaking'; const passLabel = band.toggleType === 'highpass' ? 'HPF' : 'LPF';
                const typeToggleHTML = band.toggleType 
                    ? `<div class="filter-switch" id="type-switch-${index}">
                           <div class="filter-switch-opt ${isPeaking ? 'active' : ''}" data-type="peaking">Bell</div>
                           <div class="filter-switch-opt ${!isPeaking ? 'active' : ''}" data-type="${band.toggleType}">${passLabel}</div>
                       </div>`
                    : '';
                card.innerHTML = `
                    <div class="band-header"> <span class="band-title">${band.label}</span> ${typeToggleHTML} </div>
                    <div class="knobs-container">
                        <div class="knob-wrapper" id="knob-freq-${index}"> <div class="knob-label">Freq</div> <div class="knob-base"> <div class="knob-dial"> <div class="knob-indicator"></div> </div> </div> <div class="knob-val"></div> </div>
                        <div class="knob-wrapper" id="knob-gain-${index}" style="${!isPeaking ? 'opacity: 0.3; pointer-events: none;' : ''}"> <div class="knob-label">Gain</div> <div class="knob-base"> <div class="knob-dial"> <div class="knob-indicator"></div> </div> </div> <div class="knob-val" style="color: ${band.color};"></div> </div>
                        <div class="knob-wrapper" id="knob-q-${index}"> <div class="knob-label">Q</div> <div class="knob-base"> <div class="knob-dial"> <div class="knob-indicator"></div> </div> </div> <div class="knob-val"></div> </div>
                    </div>
                `;
                eqContainer.appendChild(card);
                if (band.toggleType) {
                    const switchOptPeaking = document.querySelector(`#type-switch-${index} .filter-switch-opt[data-type="peaking"]`);
                    const switchOptPass = document.querySelector(`#type-switch-${index} .filter-switch-opt[data-type="${band.toggleType}"]`);
                    const gainKnobWrapper = document.getElementById(`knob-gain-${index}`);
                    function setFilterType(newType) {
                        clearPresetActive(); 
                        if (newType === 'peaking') { band.type = 'peaking'; switchOptPeaking.classList.add('active'); switchOptPass.classList.remove('active'); gainKnobWrapper.style.opacity = '1'; gainKnobWrapper.style.pointerEvents = 'auto'; if (filters[index]) filters[index].type = band.type; }
                        else { band.type = band.toggleType; switchOptPass.classList.add('active'); switchOptPeaking.classList.remove('active'); gainKnobWrapper.style.opacity = '0.3'; gainKnobWrapper.style.pointerEvents = 'none'; band.gain = 0; knobControllers[index].gain.updateUI(0); if (filters[index]) { filters[index].type = band.type; filters[index].gain.value = 0; } }
                        updateStaticAutoGain(); 
                    }
                    switchOptPeaking.addEventListener('click', () => setFilterType('peaking')); switchOptPass.addEventListener('click', () => setFilterType(band.toggleType));
                }
                const freqKnob = setupKnob(document.getElementById(`knob-freq-${index}`), 20, 20000, 1, band.freq, band.color, true, (v) => { clearPresetActive(); band.freq = v; if (filters[index]) filters[index].frequency.value = v; }, (v) => Math.round(v));
                const gainKnob = setupKnob(document.getElementById(`knob-gain-${index}`), -15, 15, 0.1, band.gain, band.color, false, (v) => { clearPresetActive(); if(band.type === 'peaking') { band.gain = v; if (filters[index]) filters[index].gain.value = v; } }, (v) => (v > 0 ? '+' : '') + v.toFixed(1));
                const qKnob = setupKnob(document.getElementById(`knob-q-${index}`), 0.1, 20, 0.1, band.q, band.color, false, (v) => { clearPresetActive(); band.q = v; if (filters[index]) filters[index].Q.value = v; }, (v) => v.toFixed(1));
                knobControllers.push({ freq: freqKnob, gain: gainKnob, q: qKnob });
            });
        }

        // --- Canvas Interaction (Mouse + Touch 完美整合) ---
        function getEventPos(canvas, evt) { 
            const rect = canvas.getBoundingClientRect(); 
            let clientX = evt.clientX; 
            let clientY = evt.clientY;
            
            // 安全提取觸控座標，避免 undefined 錯誤
            if (evt.touches && evt.touches.length > 0) { 
                clientX = evt.touches[0].clientX; 
                clientY = evt.touches[0].clientY; 
            } else if (evt.changedTouches && evt.changedTouches.length > 0) {
                clientX = evt.changedTouches[0].clientX; 
                clientY = evt.changedTouches[0].clientY; 
            }
            return { x: clientX - rect.left, y: clientY - rect.top }; 
        }

        function onCanvasPointerDown(e) {
            const isTouch = e.type.startsWith('touch');
            const hitRadius = isTouch ? 40 : 15; // 手指觸控範圍加大至 40px
            const pos = getEventPos(canvas, e); 
            
            for (let i = 0; i < eqBands.length; i++) { 
                const px = freqToX(eqBands[i].freq, canvas.width); 
                const py = gainToY(eqBands[i].gain, canvas.height); 
                if (Math.hypot(pos.x - px, pos.y - py) <= hitRadius) { 
                    draggingBandIndex = i; 
                    if(e.cancelable) e.preventDefault(); // 確實抓到點時，才鎖住網頁防止滾動
                    break; 
                } 
            } 
        }

        function onCanvasPointerMove(e) {
            if (activeKnob) return; 
            if (draggingBandIndex !== -1 && e.cancelable) e.preventDefault(); // 拖曳點的過程中持續鎖定滾動

            const pos = getEventPos(canvas, e); 
            currentMousePos = pos;
            
            const isTouch = e.type.startsWith('touch');
            const hitRadius = isTouch ? 40 : 15;
            hoverBandIndex = -1; 
            
            for (let i = 0; i < eqBands.length; i++) { 
                const px = freqToX(eqBands[i].freq, canvas.width); 
                const py = gainToY(eqBands[i].gain, canvas.height); 
                if (Math.hypot(pos.x - px, pos.y - py) <= hitRadius) { hoverBandIndex = i; break; } 
            }
            
            hoverRegionIndex = -1; 
            // 行動裝置不顯示區域 Hover 提示以保持乾淨
            if (pos.y <= 24 && draggingBandIndex === -1 && !isTouch) { 
                const freqAtMouse = xToFreq(pos.x, canvas.width); 
                hoverRegionIndex = freqRegions.findIndex(r => freqAtMouse >= r.min && freqAtMouse <= r.max); 
            }
            
            if (hoverRegionIndex !== -1) canvas.style.cursor = 'help'; 
            else if (hoverBandIndex !== -1 || draggingBandIndex !== -1) canvas.style.cursor = (draggingBandIndex !== -1) ? 'grabbing' : 'grab'; 
            else canvas.style.cursor = 'crosshair';
            
            if (draggingBandIndex !== -1) {
                clearPresetActive(); 
                let newFreq = xToFreq(pos.x, canvas.width); let newGain = yToGain(pos.y, canvas.height);
                const isPassFilter = eqBands[draggingBandIndex].type === 'highpass' || eqBands[draggingBandIndex].type === 'lowpass';
                
                newFreq = Math.max(MIN_FREQ, Math.min(MAX_FREQ, newFreq)); newGain = Math.max(-15, Math.min(15, newGain));
                if (isPassFilter) newGain = 0;
                
                eqBands[draggingBandIndex].freq = newFreq; eqBands[draggingBandIndex].gain = newGain;
                
                if (filters[draggingBandIndex]) { 
                    filters[draggingBandIndex].frequency.value = newFreq; 
                    if(!isPassFilter) filters[draggingBandIndex].gain.value = newGain; 
                }
                
                knobControllers[draggingBandIndex].freq.updateUI(newFreq); knobControllers[draggingBandIndex].gain.updateUI(newGain);
                
                updateStaticAutoGain(); 
            }
        }

        function onCanvasPointerUp() { 
            draggingBandIndex = -1; 
            if (hoverRegionIndex !== -1) canvas.style.cursor = 'help'; 
            else if (hoverBandIndex !== -1) canvas.style.cursor = 'grab'; 
            else canvas.style.cursor = 'crosshair'; 
        }

        canvas.addEventListener('mousedown', onCanvasPointerDown);
        canvas.addEventListener('touchstart', onCanvasPointerDown, { passive: false });
        
        canvas.addEventListener('mousemove', onCanvasPointerMove);
        canvas.addEventListener('touchmove', onCanvasPointerMove, { passive: false });
        
        window.addEventListener('mouseup', onCanvasPointerUp);
        window.addEventListener('touchend', onCanvasPointerUp);
        
        canvas.addEventListener('mouseleave', () => { 
            draggingBandIndex = -1; hoverBandIndex = -1; hoverRegionIndex = -1; 
            currentMousePos = { x: -100, y: -100 }; 
            canvas.style.cursor = 'crosshair'; 
        });
        canvas.addEventListener('touchcancel', onCanvasPointerUp);

        // ==========================================
        // 核心頻譜繪製
        // ==========================================
        function drawSpectrum() {
            requestAnimationFrame(drawSpectrum);
            if (isWaveformReady && !audioPlayer.paused) drawWaveformProgress();

            const width = canvas.width; const height = canvas.height; if (width === 0 || height === 0) return; 

            canvasCtx.fillStyle = '#1e293b'; canvasCtx.fillRect(0, 0, width, height);
            canvasCtx.strokeStyle = 'rgba(255,255,255,0.08)'; canvasCtx.lineWidth = 1;
            
            const gainLines = [-12, -6, 0, 6, 12];
            gainLines.forEach(g => {
                const y = gainToY(g, height); canvasCtx.beginPath(); canvasCtx.moveTo(0, y); canvasCtx.lineTo(width, y); canvasCtx.stroke();
                canvasCtx.fillStyle = g === 0 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)';
                canvasCtx.textAlign = 'left'; canvasCtx.textBaseline = 'middle'; canvasCtx.font = '10px monospace';
                canvasCtx.fillText((g > 0 ? '+' : '') + g + 'dB', 5, y - 8);
            });

            const freqLines = isLogScale ? [50, 100, 200, 500, 1000, 2000, 5000, 10000] : [1000, 5000, 10000, 15000, 20000];
            freqLines.forEach(f => {
                const x = freqToX(f, width); canvasCtx.beginPath(); canvasCtx.moveTo(x, 0); canvasCtx.lineTo(x, height); canvasCtx.stroke();
                canvasCtx.fillStyle = 'rgba(255,255,255,0.3)'; canvasCtx.textAlign = 'center'; canvasCtx.textBaseline = 'bottom';
                let label = f >= 1000 ? (f/1000) + 'k' : f; canvasCtx.fillText(label, x, height - 5);
            });

            const regionHeight = 22;
            freqRegions.forEach((region, index) => {
                const xStart = freqToX(region.min, width); const xEnd = freqToX(region.max, width); const regW = xEnd - xStart;
                const isHovered = (hoverRegionIndex === index);
                canvasCtx.fillStyle = isHovered ? `rgba(${region.color}, 0.3)` : `rgba(${region.color}, 0.1)`; canvasCtx.fillRect(xStart, 0, regW, regionHeight);
                canvasCtx.fillStyle = isHovered ? `rgb(${region.color})` : `rgba(${region.color}, 0.4)`; canvasCtx.fillRect(xStart, regionHeight - 2, regW, 2);
                canvasCtx.fillStyle = isHovered ? '#ffffff' : 'rgba(255,255,255,0.6)'; canvasCtx.textAlign = 'center'; canvasCtx.textBaseline = 'middle'; canvasCtx.font = isHovered ? 'bold 10px sans-serif' : '10px sans-serif';
                if (regW > 40 || isHovered) canvasCtx.fillText(region.name, xStart + regW / 2, regionHeight / 2 - 1);
            });

            if (isInitialized) {
                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                analyser.getByteFrequencyData(dataArray);
                const nyquist = audioCtx.sampleRate / 2; const binSize = nyquist / bufferLength;
                const gradient = canvasCtx.createLinearGradient(0, height, 0, height * 0.2); gradient.addColorStop(0, 'rgba(33, 150, 243, 0.0)'); gradient.addColorStop(1, 'rgba(33, 150, 243, 0.3)');
                canvasCtx.beginPath(); canvasCtx.fillStyle = gradient; canvasCtx.moveTo(0, height);
                const pointsY = new Float32Array(width);
                for (let x = 0; x < width; x++) {
                    const fStart = xToFreq(x, width); const fEnd = xToFreq(x + 1, width);
                    const iStart = fStart / binSize; const iEnd = fEnd / binSize;
                    let val = 0;
                    if (iEnd - iStart < 1) {
                        const i0 = Math.floor(iStart); const i1 = Math.min(bufferLength - 1, i0 + 1); const frac = iStart - i0;
                        val = dataArray[i0] * (1 - frac) + (dataArray[i1] || 0) * frac;
                    } else {
                        let maxInPixel = 0; const startBin = Math.floor(iStart); const endBin = Math.ceil(iEnd);
                        for (let i = startBin; i < endBin && i < bufferLength; i++) { if (dataArray[i] > maxInPixel) maxInPixel = dataArray[i]; }
                        val = maxInPixel;
                    }
                    const y = height - (val / 255) * height * 0.75; pointsY[x] = y; canvasCtx.lineTo(x, y);
                }
                canvasCtx.lineTo(width, height); canvasCtx.closePath(); canvasCtx.fill();
                canvasCtx.beginPath(); canvasCtx.strokeStyle = 'rgba(100, 181, 246, 0.5)'; canvasCtx.lineWidth = 1.5;
                for (let x = 0; x < width; x++) { if (x === 0) canvasCtx.moveTo(x, pointsY[x]); else canvasCtx.lineTo(x, pointsY[x]); }
                canvasCtx.stroke();
            }

            canvasCtx.globalAlpha = isEqBypassed ? 0.3 : 1.0;
            if (isInitialized && filters.length > 0) {
                const curveResolution = width; const freqsArray = new Float32Array(curveResolution);
                for(let x = 0; x < curveResolution; x++) freqsArray[x] = xToFreq(x, width);
                const totalMag = new Float32Array(curveResolution).fill(1.0);
                filters.forEach(filter => {
                    const magResponse = new Float32Array(curveResolution); const phaseResponse = new Float32Array(curveResolution);
                    filter.getFrequencyResponse(freqsArray, magResponse, phaseResponse);
                    for(let i = 0; i < curveResolution; i++) totalMag[i] *= magResponse[i];
                });
                canvasCtx.beginPath(); canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; canvasCtx.lineWidth = 3;
                for(let x = 0; x < curveResolution; x++) { let dB = 20 * Math.log10(totalMag[x]); let y = gainToY(dB, height); if (x === 0) canvasCtx.moveTo(x, y); else canvasCtx.lineTo(x, y); }
                canvasCtx.stroke();
            }

            eqBands.forEach((band, index) => {
                const x = freqToX(band.freq, width); const y = gainToY(band.gain, height); const isHoveredOrDragged = (hoverBandIndex === index || draggingBandIndex === index); const radius = isHoveredOrDragged ? 10 : 7; 
                if (isHoveredOrDragged) { canvasCtx.beginPath(); canvasCtx.arc(x, y, radius + 4, 0, 2 * Math.PI); canvasCtx.fillStyle = band.color + '40'; canvasCtx.fill(); }
                canvasCtx.beginPath(); canvasCtx.arc(x, y, radius, 0, 2 * Math.PI); canvasCtx.fillStyle = band.color; canvasCtx.fill();
                canvasCtx.lineWidth = 2; canvasCtx.strokeStyle = '#ffffff'; canvasCtx.stroke();
            });

            canvasCtx.globalAlpha = 1.0;
            if (hoverRegionIndex !== -1) {
                const region = freqRegions[hoverRegionIndex]; canvasCtx.font = '12px sans-serif';
                const textWidth1 = canvasCtx.measureText(region.desc1).width; const textWidth2 = canvasCtx.measureText(region.desc2).width;
                const textWidth = Math.max(textWidth1, textWidth2); const tooltipW = textWidth + 30; const tooltipH = 46;
                let tipX = currentMousePos.x; if (tipX + tooltipW/2 > width - 5) tipX = width - tooltipW/2 - 5; if (tipX - tooltipW/2 < 5) tipX = tooltipW/2 + 5;
                const tipY = regionHeight + 12; 
                canvasCtx.fillStyle = 'rgba(15, 23, 42, 0.9)'; canvasCtx.shadowColor = 'rgba(0,0,0,0.5)';
                canvasCtx.shadowBlur = 8; canvasCtx.shadowOffsetY = 4;
                canvasCtx.beginPath(); if (canvasCtx.roundRect) canvasCtx.roundRect(tipX - tooltipW/2, tipY, tooltipW, tooltipH, 6); else canvasCtx.rect(tipX - tooltipW/2, tipY, tooltipW, tooltipH);
                canvasCtx.fill(); canvasCtx.shadowColor = 'transparent'; canvasCtx.shadowBlur = 0;
                canvasCtx.strokeStyle = `rgba(${region.color}, 0.8)`; canvasCtx.lineWidth = 1.5; canvasCtx.stroke();
                canvasCtx.textAlign = 'center'; canvasCtx.textBaseline = 'middle';
                canvasCtx.fillStyle = '#ffffff'; canvasCtx.fillText(region.desc1, tipX, tipY + 16); canvasCtx.fillStyle = '#94a3b8'; canvasCtx.fillText(region.desc2, tipX, tipY + 32);
            }
        }

        initPresets(); createPEQUI(); fetchSampleList(); 
        setTimeout(() => { resizeCanvas(); drawSpectrum(); }, 100);