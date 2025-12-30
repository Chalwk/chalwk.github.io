// Copyright (c) 2025. Jericho Crosby (Chalwk)

// --- Configuration & helpers ---
const CONFIG = {
    similarChars: /[il1Lo0O]/g,
    symbols: `!@#$%^&*()-_=+[]{};:,<.>/?~`,
    maxHistory: 200,
    attackSpeeds: {
        singleGpu: 1e9,
        gpuFarm: 1e12,
        nationState: 1e14,
        quantumOps: 1e10
    }
};

// Word list for passphrases
const WORDS = [
    `apple`,`river`,`stone`,`ocean`,`sun`,
    `moon`,`forest`,`shadow`,`ember`,`silver`,
    `iron`,`sage`,`crane`,`wolf`,`breeze`,
    `ember`,`cinder`,`harbor`,`crest`,`lumen`
];

// DOM shortcuts
const $ = id => document.getElementById(id);

// --- Password generation ---
function buildPool(opts){
    let pool = new Set();
    if(opts.upper) 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(c=>pool.add(c));
    if(opts.lower) 'abcdefghijklmnopqrstuvwxyz'.split('').forEach(c=>pool.add(c));
    if(opts.numbers) '0123456789'.split('').forEach(c=>pool.add(c));
    if(opts.symbols) CONFIG.symbols.split('').forEach(c=>pool.add(c));
    if(opts.custom) opts.custom.split('').forEach(c=>pool.add(c));
    if(opts.excludeSimilar){
        for(const c of Array.from(pool)) if(CONFIG.similarChars.test(c)) pool.delete(c);
    }
    return Array.from(pool);
}

function pickRandom(arr){
    const idx = Math.floor(Math.random()*arr.length);
    return arr[idx];
}

function ensureAtLeastOne(charsPerClass, result){
    // Insert guaranteed characters for each class at random positions
    for(const cls of charsPerClass){
        const ch = pickRandom(cls);
        const pos = Math.floor(Math.random()*(result.length+1));
        result.splice(pos,0,ch);
    }
}

function generateFromPattern(pattern, opts){
    // tokens: C uppercase, c lowercase, d digit, s symbol, * any selected, . literal char
    const pool = buildPool(opts);
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const lower = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const digits = '0123456789'.split('');
    const symbols = CONFIG.symbols.split('');
    const out = [];
    for(let i=0;i<pattern.length;i++){
        const t = pattern[i];
        if(t==='C') out.push(pickRandom(upper));
        else if(t==='c') out.push(pickRandom(lower));
        else if(t==='d') out.push(pickRandom(digits));
        else if(t==='s') out.push(pickRandom(symbols));
        else if(t==='*') out.push(pickRandom(pool));
        else out.push(t);
    }
    return out.join('');
}

function generatePassword(opts){
    if(opts.pattern) return generateFromPattern(opts.pattern, opts);

    if(opts.passphrase){
        return generatePassphrase(opts.words, opts);
    }

    const pool = buildPool(opts);
    if(pool.length===0) return '';
    const result = [];

    // Add random characters
    for(let i=0;i<opts.length;i++) result.push(pickRandom(pool));

    // Ensure at least one of each selected class
    const classes = [];
    if(opts.upper) classes.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
    if(opts.lower) classes.push('abcdefghijklmnopqrstuvwxyz'.split(''));
    if(opts.numbers) classes.push('0123456789'.split(''));
    if(opts.symbols) classes.push(CONFIG.symbols.split(''));
    if(opts.custom) classes.push(opts.custom.split(''));

    if(classes.length>0) ensureAtLeastOne(classes, result);

    return result.join('');
}

function generatePassphrase(words=4, opts={}){
    const pick = ()=>WORDS[Math.floor(Math.random()*WORDS.length)];
    const parts = [];
    for(let i=0;i<words;i++){
        let w = pick();
        if(Math.random()<0.5) w = w.charAt(0).toUpperCase()+w.slice(1);
        parts.push(w);
    }
    const sep = (opts.passphraseSep!==undefined) ? opts.passphraseSep : '-';
    return parts.join(sep);
}

// --- Entropy & estimates ---
function calcEntropy(password, opts){
    // If pattern used, approximate per-character pool size by token or full pool
    if(opts.pattern){
        let ent = 0;
        for(const t of opts.pattern){
            if(t==='C') ent += log2(26);
            else if(t==='c') ent += log2(26);
            else if(t==='d') ent += log2(10);
            else if(t==='s') ent += log2(CONFIG.symbols.length);
            else if(t==='*') ent += log2(buildPool(opts).length);
            else ent += log2(1); // literal
        }
        return ent;
    }

    if(opts.passphrase){
        // entropy approx = words * log2(wordlist size)
        const wordEntropy = Math.log2(WORDS.length || 1);
        return opts.words * wordEntropy;
    }

    // general: entropy = length * log2(poolSize)
    const poolSize = buildPool(opts).length || 1;
    return password.length * log2(poolSize);
}

function log2(x){ return Math.log(x)/Math.LN2; }

function guessesFromEntropy(entropy){
    // guesses approximately 2^entropy
    return Math.pow(2, entropy);
}

function formatTime(seconds){
    if(!isFinite(seconds) || seconds>Number.MAX_SAFE_INTEGER) return 'practically infinite';
    const years = seconds/60/60/24/365;
    if(years>1) return `${years.toFixed(2)} years`;
    const days = seconds/60/60/24;
    if(days>1) return `${days.toFixed(2)} days`;
    const hours = seconds/60/60;
    if(hours>1) return `${hours.toFixed(2)} hours`;
    const minutes = seconds/60;
    if(minutes>1) return `${minutes.toFixed(2)} minutes`;
    return `${seconds.toFixed(2)} seconds`;
}

function estimateCrackTimes(entropy){
    const guesses = guessesFromEntropy(entropy);
    const speeds = CONFIG.attackSpeeds;
    const single = guesses / speeds.singleGpu;
    const farm = guesses / speeds.gpuFarm;
    const nation = guesses / speeds.nationState;
    // quantum (Grover) reduces complexity to sqrt(guesses) ~ 2^(entropy/2)
    const quantumGuesses = Math.pow(2, entropy/2);
    const quantum = quantumGuesses / speeds.quantumOps;
    return {
        guesses,
        single, farm, nation, quantum
    };
}

// --- Strength evaluation & warnings ---
function strengthLabel(entropy){
    if(entropy<28) return {label:'Weak', score:0};
    if(entropy<36) return {label:'Fair', score:1};
    if(entropy<60) return {label:'Strong', score:2};
    return {label:'Very strong', score:3};
}

function gatherWarnings(pw, opts, entropy){
    const w = [];
    if((!opts.passphrase) && pw.length < 12) w.push('Password shorter than recommended 12 characters.');
    if(opts.passphrase && opts.words < 4) w.push('Passphrase with fewer than 4 words may be weak.');
    // repeated patterns detect
    const repeat = detectRepeatingSequence(pw);
    if(repeat) w.push('Detected repeated sequence: '+repeat);
    // low diversity
    const classes = CountCharacterClasses(pw);
    if(!opts.passphrase && Object.values(classes).filter(Boolean).length < 2) w.push('Low character class diversity. Use multiple sets.');
    if(entropy<28) w.push('Low entropy. Consider increasing length or use more character sets.');
    return w;
}

function detectRepeatingSequence(s){
    // naive: check for any substring of length 2..Math.floor(len/2) repeated consecutively
    const n = s.length;
    for(let k=1;k<=Math.floor(n/2);k++){
        for(let i=0;i<=n-2*k;i++){
            const a = s.substr(i,k);
            const b = s.substr(i+k,k);
            if(a===b && k>=2) return a;
        }
    }
    return null;
}

function CountCharacterClasses(s){
    return {
        upper: /[A-Z]/.test(s),
        lower: /[a-z]/.test(s),
        digits: /[0-9]/.test(s),
        symbols: new RegExp('['+escapeForRegExp(CONFIG.symbols)+']').test(s)
    };
}

function escapeForRegExp(s){return s.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&');}

// --- Storage: history & favorites ---
const Storage = {
    key:'rpg_history_v1',
    load(){
        try{const raw = localStorage.getItem(this.key); return raw?JSON.parse(raw):[];}catch(e){return[]}
    },
    save(list){
        try{localStorage.setItem(this.key, JSON.stringify(list.slice(-CONFIG.maxHistory)));}catch(e){}
    }
};

// --- UI binding & updates ---
function readOptionsFromUI(){
    return {
        length: parseInt($('length').value,10),
        upper: $('upper').checked,
        lower: $('lower').checked,
        numbers: $('numbers').checked,
        symbols: $('symbols').checked,
        custom: $('custom').value || '',
        excludeSimilar: $('includeSimilar').checked,
        passphrase: $('passphraseMode').checked,
        words: parseInt($('passphraseWords').value,10) || 4,
        pattern: $('pattern').value || ''
    };
}

function updateUIFromOptions(){
    const opts = readOptionsFromUI();
    $('lengthVal').textContent = opts.length;
    // live preview stats
    const example = opts.pattern ? generateFromPattern(opts.pattern, opts) : (opts.passphrase?generatePassphrase(opts.words,opts) : generatePassword({...opts,length:Math.min(12,opts.length)}));
    const ent = calcEntropy(example,opts);
    const lbl = strengthLabel(ent);
    setStrength(ent,lbl.label);
}

function setStrength(entropy,label){
    $('entropy').textContent = entropy.toFixed(2) + ' bits';
    $('bits').textContent = entropy.toFixed(2);
    const est = estimateCrackTimes(entropy);
    const lines = [];
    lines.push(`Single GPU: ${formatTime(est.single)}`);
    lines.push(`GPU farm: ${formatTime(est.farm)}`);
    lines.push(`Nation state: ${formatTime(est.nation)}`);
    lines.push(`Quantum (Grover-style): ${formatTime(est.quantum)}`);
    $('timeToCrack').innerHTML = lines.join('<br>');
    $('guesses').textContent = formatLargeNumber(est.guesses);
    $('strengthLabel').textContent = label;
    // adjust strength bar visual
    const bar = $('strengthBar');
    const pct = Math.min(100, Math.max(6, entropy / 80 * 100));
    bar.style.background = `linear-gradient(90deg, #f87171 ${Math.max(0,20-pct)}%, #fb923c ${Math.max(0,40-pct)}%, #fcd34d ${Math.max(0,70-pct)}%, #34d399 ${pct}%)`;
}

function formatLargeNumber(n){
    if(!isFinite(n) || n>1e18) return 'Very large';
    return Math.round(n).toLocaleString();
}

// Interaction handlers
function onGenerate(){
    const opts = readOptionsFromUI();
    let pw = generatePassword(opts);
    if(!pw) pw = '';
    $('passwordOutput').value = pw;
    // favorites button
    $('fav').dataset.pw = pw;
    $('fav').textContent = '☆';
    const entropy = calcEntropy(pw,opts);
    const warnings = gatherWarnings(pw,opts,entropy);
    $('warnings').innerHTML = warnings.map(w=>`⚠ ${w}`).join('<br>') || 'Looks good.';
    setStrength(entropy, strengthLabel(entropy).label);
    // celebration for very strong
    if(entropy>=80) {
        $('passwordOutput').classList.add('celebrate');
        setTimeout(()=>$('passwordOutput').classList.remove('celebrate'),900);
    }
    // store history
    addToHistory({pw, entropy, date:Date.now()});
    renderHistory();
}

function onCopy(){
    const pw = $('passwordOutput').value;
    if(!pw) return;
    navigator.clipboard.writeText(pw).then(()=>{
        flashMessage('Copied to clipboard');
    }).catch(()=>flashMessage('Copy failed'));
}

function flashMessage(msg){
    // small accessible notification
    const el = document.createElement('div');
    el.textContent = msg; el.style.position='fixed';el.style.right='20px';el.style.bottom='20px';el.style.background='rgba(0,0,0,0.8)';el.style.color='white';el.style.padding='8px 12px';el.style.borderRadius='8px';el.style.zIndex=9999;document.body.appendChild(el);
    setTimeout(()=>el.remove(),1500);
}

function addToHistory(entry){
    const list = Storage.load();
    list.push(entry);
    Storage.save(list);
}

function renderHistory(){
    const list = Storage.load().slice().reverse();
    const container = $('historyList');
    container.innerHTML='';
    list.forEach((item,idx)=>{
        const wrap = document.createElement('div'); wrap.className='history-item';
        const left = document.createElement('div'); left.textContent = `${new Date(item.date).toLocaleString()} — ${truncate(item.pw,30)}`;
        const right = document.createElement('div');

        const btnCopy = document.createElement('button'); btnCopy.textContent='Copy'; btnCopy.addEventListener('click',()=>{navigator.clipboard.writeText(item.pw); flashMessage('Copied history password');});
        const btnFav = document.createElement('button'); btnFav.textContent='★'; btnFav.addEventListener('click',()=>toggleFavorite(item));
        const btnUse = document.createElement('button'); btnUse.textContent='Use'; btnUse.addEventListener('click',()=>{ $('passwordOutput').value=item.pw; flashMessage('Loaded password into output');});
        right.appendChild(btnUse); right.appendChild(btnCopy); right.appendChild(btnFav);
        wrap.appendChild(left); wrap.appendChild(right);
        container.appendChild(wrap);
    });
}

function toggleFavorite(item){
    // naive: mark in stored list
    const list = Storage.load();
    const idx = list.findIndex(it=>it.date===item.date && it.pw===item.pw);
    if(idx>=0){
        list[idx].fav = !list[idx].fav;
        Storage.save(list);
        renderHistory();
    }
}

function truncate(s,n){return s.length>n? s.slice(0,n-2)+'..':s}

function onExportTxt(){
    const list = Storage.load();
    if(list.length===0){flashMessage('History empty');return}
    const text = list.map(it=> `${new Date(it.date).toISOString()},${it.pw}`).join('\n');
    downloadAs('passwords.txt', text);
}

function onExportCsv(){
    const list = Storage.load();
    if(list.length===0){flashMessage('History empty');return}
    const csv = ['date,password,entropy'];
    list.forEach(it=>csv.push(`${new Date(it.date).toISOString()},"${it.pw}",${it.entropy||''}`));
    downloadAs('passwords.csv', csv.join('\n'));
}

function downloadAs(filename, text){
    const blob = new Blob([text],{type:'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

// --- small utilities ---
function formatNumber(n){return n.toLocaleString();}

// --- Event wiring ---
function wire(){
    $('length').addEventListener('input',()=>{$('lengthVal').textContent = $('length').value; updateUIFromOptions();});
    $('upper').addEventListener('change', updateUIFromOptions);
    $('lower').addEventListener('change', updateUIFromOptions);
    $('numbers').addEventListener('change', updateUIFromOptions);
    $('symbols').addEventListener('change', updateUIFromOptions);
    $('custom').addEventListener('input', updateUIFromOptions);
    $('includeSimilar').addEventListener('change', updateUIFromOptions);
    $('passphraseMode').addEventListener('change', ()=>{
        const pp = $('passphraseMode').checked;
        $('passphraseWords').disabled = !pp;
        updateUIFromOptions();
    });
    $('passphraseWords').addEventListener('input', updateUIFromOptions);
    $('pattern').addEventListener('input', updateUIFromOptions);

    $('generate').addEventListener('click', onGenerate);
    $('copy').addEventListener('click', onCopy);
    $('exportTxt').addEventListener('click', onExportTxt);
    $('exportCsv').addEventListener('click', onExportCsv);
    $('clearHistory').addEventListener('click', ()=>{localStorage.removeItem(Storage.key); renderHistory();});
    $('fav').addEventListener('click', ()=>{
        const pw = $('fav').dataset.pw; if(!pw) return; const list = Storage.load(); list.push({pw, date:Date.now(), fav:true}); Storage.save(list); renderHistory(); flashMessage('Favorited');
    });

    // keyboard: Enter on generator triggers generate
    document.addEventListener('keydown', (e)=>{if(e.key==='Enter' && (document.activeElement.id==='pattern' || document.activeElement.id==='custom' || document.activeElement.id==='length')){onGenerate();}});

    // dark mode
    $('darkMode').addEventListener('change',(e)=>{document.body.classList.toggle('dark', e.target.checked)});

    renderHistory();
    updateUIFromOptions();
}

// --- Initialization ---
window.addEventListener('DOMContentLoaded', wire);

// --- Small extras: utilities used above but declared below ---
function formatTimeFull(seconds){
    return {
        seconds: seconds,
        minutes: seconds/60,
        hours: seconds/3600,
        days: seconds/86400,
        years: seconds/31536000
    };
}

// expose a few functions for debugging/global use
window.rpg = {
    generatePassword, calcEntropy, estimateCrackTimes, generatePassphrase
};