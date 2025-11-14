(() => {
    // --- helpers: conversions between color spaces ---
    function clamp(v, a = 0, b = 1) { return Math.min(b, Math.max(a, v)); }

    // RGB <-> HSV
    function rgbToHsv(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const d = max - min;
        let h = 0;
        if (d === 0) h = 0;
        else if (max === r) h = ((g - b) / d) % 6;
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h = Math.round(60 * h);
        if (h < 0) h += 360;
        const s = max === 0 ? 0 : d / max;
        const v = max;
        return { h, s: +(s*100).toFixed(2), v: +(v*100).toFixed(2) };
    }

    function hsvToRgb(h, s, v) {
        s /= 100; v /= 100;
        const c = v * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = v - c;
        let r1 = 0, g1 = 0, b1 = 0;
        if (h >= 0 && h < 60) [r1, g1, b1] = [c, x, 0];
        else if (h < 120) [r1, g1, b1] = [x, c, 0];
        else if (h < 180) [r1, g1, b1] = [0, c, x];
        else if (h < 240) [r1, g1, b1] = [0, x, c];
        else if (h < 300) [r1, g1, b1] = [x, 0, c];
        else [r1, g1, b1] = [c, 0, x];
        return {
            r: Math.round((r1 + m) * 255),
            g: Math.round((g1 + m) * 255),
            b: Math.round((b1 + m) * 255)
        };
    }

    // RGB <-> HSL
    function rgbToHsl(r,g,b) {
        r/=255; g/=255; b/=255;
        const max = Math.max(r,g,b), min = Math.min(r,g,b);
        let h = 0, s = 0;
        const l = (max + min)/2;
        if (max !== min) {
            const d = max - min;
            s = d / (1 - Math.abs(2*l - 1));
            if (max === r) h = ((g - b) / d) % 6;
            else if (max === g) h = (b - r) / d + 2;
            else h = (r - g) / d + 4;
            h = Math.round(60 * h);
            if (h < 0) h += 360;
        }
        return { h, s: +(s*100).toFixed(2), l: +(l*100).toFixed(2) };
    }

    function hslToRgb(h,s,l){
        s/=100; l/=100;
        const c = (1 - Math.abs(2*l - 1)) * s;
        const x = c * (1 - Math.abs(((h/60)%2) - 1));
        const m = l - c/2;
        let r1=0,g1=0,b1=0;
        if (h>=0 && h<60) [r1,g1,b1]=[c,x,0];
        else if (h<120) [r1,g1,b1]=[x,c,0];
        else if (h<180) [r1,g1,b1]=[0,c,x];
        else if (h<240) [r1,g1,b1]=[0,x,c];
        else if (h<300) [r1,g1,b1]=[x,0,c];
        else [r1,g1,b1]=[c,0,x];
        return { r: Math.round((r1+m)*255), g: Math.round((g1+m)*255), b: Math.round((b1+m)*255) };
    }

    // RGB <-> CMYK (0..100)
    function rgbToCmyk(r,g,b) {
        if (r === 0 && g === 0 && b === 0) return { c:0, m:0, y:0, k:100 };
        const rd = r/255, gd = g/255, bd = b/255;
        const k = 1 - Math.max(rd, gd, bd);
        const c = (1 - rd - k) / (1 - k);
        const m = (1 - gd - k) / (1 - k);
        const y = (1 - bd - k) / (1 - k);
        return {
            c: Math.round(c*100),
            m: Math.round(m*100),
            y: Math.round(y*100),
            k: Math.round(k*100)
        };
    }

    function cmykToRgb(c,m,y,k) {
        c /= 100; m /= 100; y /= 100; k /= 100;
        const r = Math.round(255 * (1 - c) * (1 - k));
        const g = Math.round(255 * (1 - m) * (1 - k));
        const b = Math.round(255 * (1 - y) * (1 - k));
        return { r, g, b };
    }

    function rgbToHex(r,g,b) {
        return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
    }

    function hexToRgb(hex) {
        hex = hex.replace('#','').trim();
        if (hex.length === 3) hex = hex.split('').map(c => c+c).join('');
        if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
        return {
            r: parseInt(hex.slice(0,2),16),
            g: parseInt(hex.slice(2,4),16),
            b: parseInt(hex.slice(4,6),16)
        };
    }

    // --- UI wiring and wheel drawing ---
    const canvas = document.getElementById('colorWheel');
    const ctx = canvas.getContext('2d', { alpha: false });
    const picker = document.getElementById('picker');
    const preview = document.getElementById('preview-swatch');
    const hexEl = document.getElementById('hex');
    const hexInput = document.getElementById('hexInput');
    const copyHex = document.getElementById('copyHex');
    const slidersContainer = document.getElementById('sliders');
    const readouts = document.getElementById('readouts');
    const presetSwatches = document.getElementById('presetSwatches');
    const userSwatches = document.getElementById('userSwatches');
    const saveSwatchBtn = document.getElementById('saveSwatch');
    const randomizeBtn = document.getElementById('randomize');
    const clearPaletteBtn = document.getElementById('clearPalette');
    const exportPaletteBtn = document.getElementById('exportPalette');

    let mode = 'rgb';
    let current = { r:255, g:0, b:0, a:1 };
    let userPalette = [];

    // preset swatches
    const presets = [
        '#ff3b30','#ff9500','#ffcc00','#34c759','#5ac8fa','#007aff',
        '#5856d6','#ff2d55','#8e8e93','#1c1c1e','#ffffff','#000000',
        '#ff6b6b','#ffd93d','#7bed9f','#70a1ff','#5352ed','#3ae374'
    ];

    function makeSwatches(container, list, isUser=false){
        container.innerHTML = '';
        list.forEach((hex, i) => {
            const el = document.createElement('div');
            el.className = 'sw';
            el.style.background = hex;
            el.title = hex;
            el.dataset.hex = hex;
            el.addEventListener('click', () => {
                const rgb = hexToRgb(hex);
                if (!rgb) return;
                setColor(rgb.r, rgb.g, rgb.b);
            });
            if (isUser){
                const rem = document.createElement('button');
                rem.textContent = '×';
                rem.style.position='absolute';
                rem.style.right='6px';
                rem.style.top='6px';
                rem.style.background='rgba(0,0,0,0.2)';
                rem.style.border='none';
                rem.style.color='white';
                rem.style.borderRadius='6px';
                rem.style.padding='2px 6px';
                rem.style.cursor='pointer';
                rem.title='Remove';
                rem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    userPalette.splice(i,1);
                    saveUserPalette();
                    makeSwatches(userSwatches, userPalette, true);
                });
                el.appendChild(rem);
            }
            container.appendChild(el);
        });
    }

    makeSwatches(presetSwatches, presets, false);
    makeSwatches(userSwatches, userPalette, true);

    function saveUserPalette(){
        try {
            localStorage.setItem('pretty_picker_palette', JSON.stringify(userPalette));
        } catch(e){}
    }
    function loadUserPalette(){
        try {
            const s = localStorage.getItem('pretty_picker_palette');
            if (s) userPalette = JSON.parse(s);
        } catch(e){}
    }
    loadUserPalette();
    makeSwatches(userSwatches, userPalette, true);

    // draw color wheel using conic gradient + radial overlay for saturation/value
    function drawWheel(){
        // make canvas resolution match display size for crispness
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.clientWidth | 0;
        const h = canvas.clientHeight | 0;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr,0,0,dpr,0,0);

        const cx = w/2, cy = h/2, r = Math.min(w,h)/2 - 1;

        // conic gradient for hue
        const hueG = ctx.createConicGradient(0, cx, cy);
        for (let i=0;i<=360;i++){
            const stop = i/360;
            hueG.addColorStop(stop, `hsl(${i} 100% 50%)`);
        }
        ctx.clearRect(0,0,w,h);
        ctx.beginPath();
        ctx.arc(cx,cy,r,0,Math.PI*2);
        ctx.closePath();
        ctx.fillStyle = hueG;
        ctx.fill();

        // overlay radial gradient: white -> transparent (towards edge) to vary saturation
        const satGrad = ctx.createRadialGradient(cx,cy,0, cx,cy, r);
        satGrad.addColorStop(0, 'rgba(255,255,255,1)');
        satGrad.addColorStop(0.35, 'rgba(255,255,255,0.0)');
        satGrad.addColorStop(1, 'rgba(0,0,0,0.0)');
        ctx.fillStyle = satGrad;
        ctx.beginPath();
        ctx.arc(cx,cy,r,0,Math.PI*2);
        ctx.closePath();
        ctx.fill();

        // overlay value (black) gradient for darker center->edge for HSV? We'll later sample and let mode interpret
        const blackGrad = ctx.createRadialGradient(cx,cy,0, cx,cy,r);
        blackGrad.addColorStop(0, 'rgba(0,0,0,0)');
        blackGrad.addColorStop(1, 'rgba(0,0,0,0.0)');
        // not used heavily; keeping wheel visually clean.

        // cut extra pixels outside circle
        ctx.globalCompositeOperation = 'destination-in';
        ctx.beginPath();
        ctx.arc(cx,cy,r,0,Math.PI*2);
        ctx.closePath();
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }

    // sample color from canvas at client coords
    function getCanvasColor(clientX, clientY){
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const cx = rect.width/2, cy = rect.height/2;
        const dx = x - cx, dy = y - cy;
        const d = Math.sqrt(dx*dx + dy*dy);
        const r = Math.min(cx, cy);
        if (d > r) return null; // outside wheel

        // read pixel
        const dpr = window.devicePixelRatio || 1;
        try {
            const px = Math.floor(x * dpr);
            const py = Math.floor(y * dpr);
            const data = ctx.getImageData(px, py, 1, 1).data;
            return { r: data[0], g: data[1], b: data[2], a: data[3]/255 };
        } catch(e) {
            // fallback: approximate by geometry (use HSV mapping)
            const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
            const sat = clamp(d / r, 0, 1);
            // interpret wheel as hue & saturation, value fixed at 1 (bright)
            const rgb = hsvToRgb(angle, sat*100, 100);
            return { r: rgb.r, g: rgb.g, b: rgb.b, a:1 };
        }
    }

    // update UI readouts & preview
    function updateUI(){
        const { r, g, b, a } = current;
        preview.style.background = `rgba(${r}, ${g}, ${b}, ${a})`;
        const hex = rgbToHex(r,g,b);
        hexEl.textContent = hex;
        hexInput.value = hex;
        document.getElementById('rgb').textContent = `rgb(${r}, ${g}, ${b})`;

        // readouts block
        const hsv = rgbToHsv(r,g,b);
        const hsl = rgbToHsl(r,g,b);
        const cmyk = rgbToCmyk(r,g,b);

        readouts.innerHTML = `
      <div class="small-info">HEX: <strong>${hex}</strong></div>
      <div class="small-info">RGB: <strong>${r}, ${g}, ${b}</strong></div>
      <div class="small-info">HSL: <strong>${hsl.h}°, ${hsl.s}%, ${hsl.l}%</strong></div>
      <div class="small-info">HSV: <strong>${hsv.h}°, ${hsv.s}%, ${hsv.v}%</strong></div>
      <div class="small-info">CMYK: <strong>${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%</strong></div>
    `;

        // update slider values to reflect current mode
        renderSliders();
    }

    // setColor central — sets current and updates UI
    function setColor(r,g,b){
        current.r = clamp(Math.round(r),0,255);
        current.g = clamp(Math.round(g),0,255);
        current.b = clamp(Math.round(b),0,255);
        updateUI();
    }

    // slider UI generation
    const sliderDefinitions = {
        rgb: [
            { id:'r', label:'R', min:0, max:255 },
            { id:'g', label:'G', min:0, max:255 },
            { id:'b', label:'B', min:0, max:255 }
        ],
        hsv: [
            { id:'h', label:'H', min:0, max:360 },
            { id:'s', label:'S', min:0, max:100 },
            { id:'v', label:'V', min:0, max:100 }
        ],
        hsl: [
            { id:'h', label:'H', min:0, max:360 },
            { id:'s', label:'S', min:0, max:100 },
            { id:'l', label:'L', min:0, max:100 }
        ],
        cmyk: [
            { id:'c', label:'C', min:0, max:100 },
            { id:'m', label:'M', min:0, max:100 },
            { id:'y', label:'Y', min:0, max:100 },
            { id:'k', label:'K', min:0, max:100 }
        ]
    };

    let sliderElements = {};

    function renderSliders(){
        // build controls for current mode
        const defs = sliderDefinitions[mode];
        slidersContainer.innerHTML = '';
        sliderElements = {};
        // compute current values depending on mode
        const rgb = { r: current.r, g: current.g, b: current.b };
        const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);

        const valuesMap = {
            r: rgb.r, g: rgb.g, b: rgb.b,
            h: mode === 'hsl' || mode === 'hsv' ? (mode === 'hsl' ? hsl.h : hsv.h) : hsv.h,
            s: mode === 'hsl' ? hsl.s : hsv.s,
            v: hsv.v,
            l: hsl.l,
            c: cmyk.c, m: cmyk.m, y: cmyk.y, k: cmyk.k
        };

        defs.forEach(def => {
            const row = document.createElement('div');
            row.className = 'slider-row';
            const label = document.createElement('label');
            label.textContent = def.label;
            const rangeWrap = document.createElement('div');
            rangeWrap.className = 'range';
            const input = document.createElement('input');
            input.type = 'range';
            input.min = def.min;
            input.max = def.max;
            input.value = valuesMap[def.id] ?? def.min;
            input.dataset.id = def.id;
            input.addEventListener('input', onSliderInput);
            rangeWrap.appendChild(input);
            const valueDisplay = document.createElement('div');
            valueDisplay.className = 'small-info';
            valueDisplay.style.minWidth = '42px';
            valueDisplay.textContent = input.value;
            row.appendChild(label);
            row.appendChild(rangeWrap);
            row.appendChild(valueDisplay);
            slidersContainer.appendChild(row);
            sliderElements[def.id] = { input, valueDisplay };
        });
    }

    function onSliderInput(e){
        const id = e.target.dataset.id;
        const val = Number(e.target.value);
        // update display
        sliderElements[id].valueDisplay.textContent = val;

        // compute new current color depending on mode
        if (mode === 'rgb') {
            const r = Number(sliderElements.r.input.value);
            const g = Number(sliderElements.g.input.value);
            const b = Number(sliderElements.b.input.value);
            setColor(r,g,b);
        } else if (mode === 'hsv') {
            const h = Number(sliderElements.h.input.value);
            const s = Number(sliderElements.s.input.value);
            const v = Number(sliderElements.v.input.value);
            const rgb = hsvToRgb(h,s,v);
            setColor(rgb.r, rgb.g, rgb.b);
        } else if (mode === 'hsl') {
            const h = Number(sliderElements.h.input.value);
            const s = Number(sliderElements.s.input.value);
            const l = Number(sliderElements.l.input.value);
            const rgb = hslToRgb(h,s,l);
            setColor(rgb.r, rgb.g, rgb.b);
        } else if (mode === 'cmyk'){
            const c = Number(sliderElements.c.input.value);
            const m = Number(sliderElements.m.input.value);
            const y = Number(sliderElements.y.input.value);
            const k = Number(sliderElements.k.input.value);
            const rgb = cmykToRgb(c,m,y,k);
            setColor(rgb.r, rgb.g, rgb.b);
        }
    }

    // handle mode switcher
    const modeRadios = document.querySelectorAll('input[name="mode"]');
    modeRadios.forEach(r => r.addEventListener('change', (e) => {
        mode = e.target.value;
        renderSliders();
    }));

    // wheel input handling
    let isPointerDown = false;
    function onPointerDown(e){
        isPointerDown = true;
        pickFromEvent(e);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp, { once:true });
    }
    function onPointerMove(e){
        if (!isPointerDown) return;
        pickFromEvent(e);
    }
    function onPointerUp(){
        isPointerDown = false;
        window.removeEventListener('pointermove', onPointerMove);
    }

    function pickFromEvent(e){
        const color = getCanvasColor(e.clientX, e.clientY);
        if (!color) return;
        setColor(color.r, color.g, color.b);
        positionPicker(e.clientX, e.clientY);
    }

    function positionPicker(clientX, clientY){
        const rect = canvas.getBoundingClientRect();
        picker.style.left = (clientX - rect.left) + 'px';
        picker.style.top = (clientY - rect.top) + 'px';
        picker.style.display = 'block';
    }

    // hex input handling
    hexInput.addEventListener('change', () => {
        const rgb = hexToRgb(hexInput.value);
        if (rgb) setColor(rgb.r, rgb.g, rgb.b);
        else hexInput.classList.add('invalid');
        setTimeout(()=>hexInput.classList.remove('invalid'), 800);
    });
    copyHex.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(hexInput.value);
            copyHex.textContent = 'Copied!';
            setTimeout(()=> copyHex.textContent = 'Copy', 900);
        } catch(e){ copyHex.textContent = 'Failed'; setTimeout(()=> copyHex.textContent = 'Copy', 900); }
    });

    // save palette
    saveSwatchBtn.addEventListener('click', () => {
        const hex = rgbToHex(current.r, current.g, current.b);
        userPalette.unshift(hex);
        if (userPalette.length > 36) userPalette.length = 36;
        saveUserPalette();
        makeSwatches(userSwatches, userPalette, true);
    });

    randomizeBtn.addEventListener('click', () => {
        const h = Math.floor(Math.random()*360);
        const s = 70 + Math.random()*30;
        const v = 60 + Math.random()*40;
        const rgb = hsvToRgb(h,s,v);
        setColor(rgb.r, rgb.g, rgb.b);
    });

    clearPaletteBtn.addEventListener('click', () => {
        userPalette = [];
        saveUserPalette();
        makeSwatches(userSwatches, userPalette, true);
    });

    exportPaletteBtn.addEventListener('click', () => {
        const data = JSON.stringify(userPalette, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'palette.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    // initial draw + wiring
    function init(){
        drawWheel();
        renderSliders();
        updateUI();
        // pointer events
        canvas.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('resize', () => {
            drawWheel();
            updateUI();
        });

        // set initial crosshair position to red (0deg)
        // compute position on canvas corresponding to current color
        placePickerForRgb(current.r, current.g, current.b);
    }

    // place picker by converting rgb -> angle + radius
    function placePickerForRgb(r,g,b){
        const rect = canvas.getBoundingClientRect();
        const cx = rect.width/2, cy = rect.height/2;
        const hsv = rgbToHsv(r,g,b);
        const angle = hsv.h * Math.PI / 180;
        const sat = hsv.s/100;
        const rdist = Math.max(8, (Math.min(rect.width,rect.height)/2 - 6) * sat);
        const x = cx + Math.cos(angle) * rdist;
        const y = cy + Math.sin(angle) * rdist;
        picker.style.left = x + 'px';
        picker.style.top = y + 'px';
    }

    // sample click from keyboard (accessibility) - optional
    canvas.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            // pick center color
            const rect = canvas.getBoundingClientRect();
            const centerX = rect.left + rect.width/2;
            const centerY = rect.top + rect.height/2;
            const color = getCanvasColor(centerX, centerY);
            if (color) setColor(color.r, color.g, color.b);
        }
    });

    // initialize on DOM ready
    document.addEventListener('DOMContentLoaded', init);

})();
