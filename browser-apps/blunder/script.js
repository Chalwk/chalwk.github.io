/* -----------------------
   CONFIG
   ----------------------- */
const MAX_GUESSES = 6;
const WORD_LENGTH = 5; // default: 5-letter words

/* -----------------------
   DOM
   ----------------------- */
const gridEl = document.getElementById('grid');
const keyboardEl = document.getElementById('keyboard');
const newGameBtn = document.getElementById('newGameBtn');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modalContent');
const modalClose = document.getElementById('modalClose');
const statsBtn = document.getElementById('statsBtn');
const helpBtn = document.getElementById('helpBtn');

/* -----------------------
   INTERNAL STATE
   ----------------------- */
let wordlist = [];
let allowedSet = new Set();
let secret = '';
let board = Array.from({length: MAX_GUESSES}, () => Array.from({length: WORD_LENGTH}, () => ''));
let row = 0;
let col = 0;
let finished = false;
let keyboardState = {}; // letter -> status

/* -----------------------
   SOUNDS
   ----------------------- */
const sounds = {
    move: new Audio(),
    submit: new Audio(),
    win: new Audio(),
    loss: new Audio(),
    invalid: new Audio()
};

// Initialize sounds with simple beeps
function initSounds() {
    sounds.move.src = generateBeep(800, 0.1);     // letter typed
    sounds.submit.src = generateBeep(600, 0.15);  // Enter
    sounds.win.src = generateBeep(1000, 0.5);     // correct word
    sounds.loss.src = generateBeep(300, 0.5);     // out of tries
    sounds.invalid.src = generateBeep(400, 0.2);  // invalid word
}

// Generate simple WAV beep URL
function generateBeep(frequency, duration) {
    const sampleRate = 44100;
    const numSamples = Math.floor(duration * sampleRate);
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + numSamples*2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate*2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, numSamples*2, true);

    const amplitude = 0.3;
    for(let i=0;i<numSamples;i++){
        const t = i/sampleRate;
        const value = Math.sin(2*Math.PI*frequency*t)*amplitude;
        view.setInt16(44 + i*2, value*0x7FFF, true);
    }

    return URL.createObjectURL(new Blob([buffer], {type:'audio/wav'}));
}

function writeString(view, offset, string){
    for(let i=0;i<string.length;i++) view.setUint8(offset+i,string.charCodeAt(i));
}

function playSound(name){
    try{
        const s = sounds[name];
        if(s){ s.currentTime=0; s.play().catch(()=>{}); }
    }catch(e){console.log('Sound error:',e);}
}

/* -----------------------
   FALLBACK WORDS (used if words.txt not found)
   ----------------------- */
const FALLBACK = [
    "apple","brave","crane","dodge","eagle","flame","glory","hound","infer","jolly",
    "knack","lemon","mango","noble","ocean","party","quake","river","scent","tango",
    "union","vivid","woven","xenon","young","zesty"
];

/* -----------------------
   UTILS
   ----------------------- */
function el(tag, cls, text){
    const e = document.createElement(tag);
    if(cls) e.className = cls;
    if(text != null) e.textContent = text;
    return e;
}
function uid(){ return Math.random().toString(36).slice(2,9) }

/* -----------------------
   LOAD WORDS
   ----------------------- */
async function loadWords() {
    try{
        const resp = await fetch('words.txt');
        if(!resp.ok) throw new Error('words.txt not found');
        const txt = await resp.text();
        const raw = txt.split(/\r?\n/).map(s => s.trim().toLowerCase()).filter(Boolean);
        wordlist = raw.filter(w => /^[a-z]+$/.test(w) && w.length === WORD_LENGTH);
        // also create allowed set (for guess validity)
        allowedSet = new Set(raw.filter(w => /^[a-z]+$/.test(w) && w.length === WORD_LENGTH));
    }catch(e){
        console.warn('Failed to load words.txt, using fallback words. Put a words.txt file (one word per line) in the same folder.', e);
        wordlist = FALLBACK.slice();
        allowedSet = new Set(FALLBACK);
    }
    if(wordlist.length === 0){
        // still empty? fall back
        wordlist = FALLBACK.slice();
        allowedSet = new Set(FALLBACK);
    }
}

/* -----------------------
   INIT
   ----------------------- */
async function init(){
    await loadWords();
    bindUI();
    newGame();
}

/* -----------------------
   NEW GAME
   ----------------------- */
function newGame(){
    secret = pickRandom(wordlist);
    // reset state
    board = Array.from({length: MAX_GUESSES}, () => Array.from({length: WORD_LENGTH}, () => ''));
    row = 0; col = 0; finished = false; keyboardState = {};
    renderGrid();
    renderKeyboard();
    announce("New game. Start guessing.");
    // store today's secret in session so refresh keeps same game in this run - optional
}

/* -----------------------
   PICK RANDOM
   ----------------------- */
function pickRandom(list){
    return list[Math.floor(Math.random()*list.length)];
}

/* -----------------------
   RENDER GRID
   ----------------------- */
function renderGrid(){
    gridEl.innerHTML = '';
    for(let r=0;r<MAX_GUESSES;r++){
        const rowEl = el('div','row');
        rowEl.setAttribute('data-row', r);
        for(let c=0;c<WORD_LENGTH;c++){
            const tile = el('div','tile', board[r][c] || '');
            tile.setAttribute('data-row', r);
            tile.setAttribute('data-col', c);
            tile.setAttribute('tabindex', '-1');
            rowEl.appendChild(tile);
        }
        gridEl.appendChild(rowEl);
    }
}

/* -----------------------
   RENDER KEYBOARD
   ----------------------- */
const KEY_LAYOUT = [['q','w','e','r','t','y','u','i','o','p'],
    ['a','s','d','f','g','h','j','k','l'],
    ['Enter','z','x','c','v','b','n','m','Backspace']];

function renderKeyboard(){
    keyboardEl.innerHTML = '';
    for(const line of KEY_LAYOUT){
        const row = el('div','k-row');
        for(const k of line){
            const keyCls = 'key' + (k.length>1 ? ' wide' : '');
            const btn = el('button', keyCls, k === 'Backspace' ? '⌫' : (k === 'Enter' ? 'Enter' : k));
            btn.setAttribute('data-key', k);
            const lower = (k.length === 1 ? k : k).toLowerCase();
            if(keyboardState[lower]) btn.classList.add(keyboardState[lower]);
            btn.addEventListener('click', () => handleKey(k));
            row.appendChild(btn);
        }
        keyboardEl.appendChild(row);
    }
}

/* -----------------------
   KEY HANDLING
   ----------------------- */
function handleKey(key){
    if(finished) return;

    if(key === 'Backspace'){
        if(col>0){
            col--;
            board[row][col] = '';
            updateTile(row,col);
            playSound('move');
        }
        return;
    }

    if(key === 'Enter'){
        submitGuess();
        playSound('submit');
        return;
    }

    const letter = key.length===1?key.toLowerCase():'';
    if(!/^[a-z]$/.test(letter)) return;

    if(col<WORD_LENGTH){
        board[row][col]=letter;
        col++;
        updateTile(row,col-1);
        playSound('move');
    }
}

/* -----------------------
   UPDATE TILE DOM
   ----------------------- */
function updateTile(r, c){
    const rowEl = gridEl.querySelector(`.row[data-row="${r}"]`);
    if(!rowEl) return;
    const tile = rowEl.querySelector(`.tile[data-col="${c}"]`);
    if(tile) tile.textContent = board[r][c] ? board[r][c].toUpperCase() : '';
}

/* -----------------------
   SUBMIT GUESS
   ----------------------- */
function submitGuess(){
    if(col !== WORD_LENGTH){
        pulseRow(row);
        announce('Not enough letters');
        return;
    }
    const guess = board[row].join('');
    if(!allowedSet.has(guess)){
        announce('Not in word list');
        shakeRow(row);
        playSound('invalid');
        return;
    }

    const result = evaluateGuess(guess, secret);
    applyResultToRow(row,result);

    for(let i=0;i<WORD_LENGTH;i++){
        const l = guess[i];
        const status = result[i];
        upgradeKeyState(l,status);
    }
    renderKeyboard();

    if(result.every(s=>'correct'===s)){
        finished = true;
        setTimeout(()=> { showWin(); playSound('win'); }, 700);
        saveStats(true,row+1);
        return;
    }

    row++;
    col=0;
    if(row>=MAX_GUESSES){
        finished=true;
        setTimeout(()=> { showLoss(); playSound('loss'); }, 700);
        saveStats(false,null);
    }
}

/* -----------------------
   EVALUATION ALGO (handles duplicates correctly)
   Returns array of statuses for each letter
   ----------------------- */
function evaluateGuess(guess, secretWord){
    const status = Array(WORD_LENGTH).fill('absent');
    const secretArr = secretWord.split('');
    const guessArr = guess.split('');
    // first pass for corrects
    for(let i=0;i<WORD_LENGTH;i++){
        if(guessArr[i] === secretArr[i]){
            status[i] = 'correct';
            secretArr[i] = null; // consume
            guessArr[i] = null;
        }
    }
    // second pass for presents
    for(let i=0;i<WORD_LENGTH;i++){
        if(guessArr[i] === null) continue;
        const idx = secretArr.indexOf(guessArr[i]);
        if(idx !== -1){
            status[i] = 'present';
            secretArr[idx] = null; // consume
            guessArr[i] = null;
        } else {
            status[i] = 'absent';
        }
    }
    return status;
}

/* -----------------------
   UI HELPERS (animations, classes)
   ----------------------- */
function applyResultToRow(r, result){
    const rowEl = gridEl.querySelector(`.row[data-row="${r}"]`);
    if(!rowEl) return;
    const tiles = Array.from(rowEl.querySelectorAll('.tile'));
    tiles.forEach((t,i) => {
        // flip timing stagger
        setTimeout(() => {
            t.classList.add('flip');
            // set status after a small delay to match flip
            setTimeout(()=> {
                t.classList.remove('flip');
                t.classList.remove('absent','present','correct');
                t.classList.add(result[i]);
            }, 260);
        }, i*200);
    });
}

function pulseRow(r){
    const rowEl = gridEl.querySelector(`.row[data-row="${r}"]`);
    if(!rowEl) return;
    rowEl.animate([{transform:'translateY(0)'},{transform:'translateY(-8px)'},{transform:'translateY(0)'}],{
        duration: 320, easing: 'ease'
    });
}

function shakeRow(r){
    const rowEl = gridEl.querySelector(`.row[data-row="${r}"]`);
    if(!rowEl) return;
    rowEl.animate([{transform:'translateX(0)'},{transform:'translateX(-10px)'},{transform:'translateX(10px)'},{transform:'translateX(0)'}],{
        duration: 320, easing: 'ease'
    });
}

/* -----------------------
   KEYBOARD STATE UPGRADE RULE
   correct > present > absent
   ----------------------- */
function upgradeKeyState(letter, status){
    const prev = keyboardState[letter] || null;
    const ranking = { 'correct':3, 'present':2, 'absent':1, null:0 };
    if(ranking[status] > ranking[prev]){
        keyboardState[letter] = status;
    }
}

/* -----------------------
   PHYSICAL KEYBOARD SUPPORT
   ----------------------- */
window.addEventListener('keydown', (e) => {
    if(finished) return;
    if(e.key === 'Backspace' || e.key === 'Enter'){
        handleKey(e.key === 'Backspace' ? 'Backspace' : 'Enter');
        e.preventDefault();
        return;
    }
    const k = e.key.toLowerCase();
    if(/^[a-z]$/.test(k)) handleKey(k);
});

/* -----------------------
   MODALS / MESSAGES
   ----------------------- */
function showModal(html){
    modalContent.innerHTML = '';
    if(typeof html === 'string') modalContent.innerHTML = html;
    else modalContent.appendChild(html);
    modal.classList.remove('hidden');
}
modalClose.addEventListener('click', ()=> modal.classList.add('hidden'));
modal.addEventListener('click', (e)=> { if(e.target === modal) modal.classList.add('hidden') });

function announce(text){
    // simple notification in modal for now (keeps accessibility)
    // small ephemeral messages should not be annoying: use ARIA live
    const live = document.createElement('div');
    live.style.position='absolute';
    live.style.left='-9999px';
    live.setAttribute('aria-live','polite');
    live.textContent = text;
    document.body.appendChild(live);
    setTimeout(()=> live.remove(), 900);
}

/* -----------------------
   END-GAME UI
   ----------------------- */
function showWin(){
    const wrapper = document.createElement('div');
    const lines = el('div','', `<strong>Nice! You guessed it.</strong><br><small>The word was <code>${secret.toUpperCase()}</code></small>`);
    const shareBtn = el('button','', 'Share results');
    shareBtn.style.marginTop = '12px';
    shareBtn.addEventListener('click', shareResult);
    wrapper.appendChild(lines);
    wrapper.appendChild(shareBtn);
    showModal(wrapper);
}

function showLoss(){
    const content = `<strong>Out of tries</strong><p>The word was <code>${secret.toUpperCase()}</code></p>
  <button id="replay" style="margin-top:10px;padding:8px;border-radius:8px">Play again</button>`;
    showModal(content);
    document.getElementById('replay').addEventListener('click', ()=> {
        modal.classList.add('hidden');
        newGame();
    });
}

/* -----------------------
   SHARE / RESULTS (emoji grid)
   ----------------------- */
function shareResult(){
    // copy to clipboard representation
    const lines = [];
    for(let r=0;r<=row && r<MAX_GUESSES;r++){
        const rowEl = gridEl.querySelector(`.row[data-row="${r}"]`);
        const tiles = rowEl.querySelectorAll('.tile');
        const rowEmojis = Array.from(tiles).map(t => {
            if(t.classList.contains('correct')) return '🟩';
            if(t.classList.contains('present')) return '🟨';
            return '⬜';
        }).join('');
        lines.push(rowEmojis);
    }
    const text = `Blunder ${finished ? (row <= MAX_GUESSES-1 ? row+1 : 'X') : '?'} / ${MAX_GUESSES}\n` + lines.join('\n');
    navigator.clipboard?.writeText(text).then(()=> {
        announce('Results copied to clipboard');
    }).catch(()=> {
        alert(text);
    });
}

/* -----------------------
   STATS STORAGE
   ----------------------- */
const STATS_KEY = 'blunder_stats_v1';
function getStats(){
    try{
        const raw = localStorage.getItem(STATS_KEY);
        return raw ? JSON.parse(raw) : {played:0,win:0,loss:0,dist:{}};
    }catch(e){ return {played:0,win:0,loss:0,dist:{}} }
}
function saveStats(won, guesses){
    const s = getStats();
    s.played++;
    if(won) s.win++; else s.loss++;
    if(won){
        s.dist[guesses] = (s.dist[guesses] || 0) + 1;
    }
    localStorage.setItem(STATS_KEY, JSON.stringify(s));
}
function showStats(){
    const s = getStats();
    const container = document.createElement('div');
    container.innerHTML = `<strong>Statistics</strong>`;
    const grid = document.createElement('div');
    grid.className = 'stats-grid';
    grid.innerHTML = `
    <div class="stat"><div class="num">${s.played}</div><div class="label">Played</div></div>
    <div class="stat"><div class="num">${s.win}</div><div class="label">Wins</div></div>
    <div class="stat"><div class="num">${s.loss}</div><div class="label">Losses</div></div>
    <div class="stat"><div class="num">${s.played ? Math.round(100*(s.win/s.played))+"%" : "0%"}</div><div class="label">Win %</div></div>
  `;
    container.appendChild(grid);

    // distribution
    const distDiv = document.createElement('div');
    distDiv.style.marginTop = '12px';
    distDiv.innerHTML = `<strong>Guesses distribution</strong>`;
    const list = document.createElement('div');
    list.style.marginTop = '8px';
    for(let i=1;i<=MAX_GUESSES;i++){
        const count = s.dist[i] || 0;
        const line = document.createElement('div');
        line.style.display='flex';
        line.style.justifyContent='space-between';
        line.style.gap='8px';
        line.innerHTML = `<div>${i}:</div><div>${count}</div>`;
        list.appendChild(line);
    }
    distDiv.appendChild(list);
    container.appendChild(distDiv);

    showModal(container);
}

/* -----------------------
   BIND EVENTS
   ----------------------- */
function bindUI(){
    newGameBtn.addEventListener('click', () => { newGame(); });
    statsBtn.addEventListener('click', () => showStats());
    helpBtn.addEventListener('click', showHelp);

    // modal close already wired
}

/* -----------------------
   HELP
   ----------------------- */
function showHelp(){
    const help = `
  <h3>How to play</h3>
  <p>Guess the hidden 5-letter word in six tries. Each guess must be a valid word. After each guess the color of the tiles will show how close your guess was to the word.</p>
  <ul>
    <li><strong>Green</strong> means correct letter in correct spot.</li>
    <li><strong>Yellow</strong> means letter is in the word but wrong spot.</li>
    <li><strong>Gray</strong> means letter is not in the word at all.</li>
  </ul>
  <p>Use your physical keyboard or click the keys.</p>
  `;
    showModal(help);
}

/* -----------------------
   START
   ----------------------- */
init();
initSounds();
