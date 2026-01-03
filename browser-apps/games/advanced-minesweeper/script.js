/*
	Copyright (c) 2025-2026. Jericho Crosby (Chalwk)

	Advanced Minesweeper JavaScript
*/

(() => {
    const boardEl = document.getElementById('board');
    const mineCountEl = document.getElementById('mineCount');
    const timerEl = document.getElementById('timer');
    const newBtn = document.getElementById('newBtn');
    const difficultySelect = document.getElementById('difficulty');
    const customPanel = document.getElementById('customPanel');
    const rowsInput = document.getElementById('rows');
    const colsInput = document.getElementById('cols');
    const minesInput = document.getElementById('mines');
    const applyCustom = document.getElementById('applyCustom');
    const revealAllBtn = document.getElementById('revealAllBtn');
    const hintBtn = document.getElementById('hintBtn');
    const flagToggle = document.getElementById('flagToggle');
    const themeToggle = document.getElementById('themeToggle');
    const bestTimesBtn = document.getElementById('bestTimesBtn');
    const bestTimesModal = document.getElementById('bestTimesModal');
    const bestTimesList = document.getElementById('bestTimesList');
    const closeBestTimes = document.getElementById('closeBestTimes');

    let rows = 9, cols = 9, mines = 10;
    let board = [];
    let started = false;
    let ended = false;
    let flagsMode = true;
    let mineCounter = 0;
    let timer = null;
    let seconds = 0;
    let firstClick = true;
    let revealedCount = 0;

    const presets = {
        beginner: {rows:9, cols:9, mines:10},
        intermediate: {rows:16, cols:16, mines:40},
        expert: {rows:16, cols:30, mines:99}
    };

    function clamp(v, a, b){return Math.max(a, Math.min(b, v));}
    function randInt(max){return Math.floor(Math.random()*max);}

    function resetState(r,c,m){
        rows = r; cols = c; mines = m;
        board = Array.from({length:rows}, ()=> Array.from({length:cols}, ()=> ({
            isMine:false, revealed:false, flagged:false, question:false, adjacent:0
        })));
        started = false; ended = false; firstClick=true; revealedCount=0; seconds=0;
        clearInterval(timer); timer=null; timerEl.textContent = '00:00';
        mineCounter = mines; updateMineCounter();
        boardEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        boardEl.innerHTML = '';
        for(let r=0;r<rows;r++){
            for(let c=0;c<cols;c++){
                const cell = document.createElement('button');
                cell.className = 'cell';
                cell.setAttribute('data-r', r);
                cell.setAttribute('data-c', c);
                cell.setAttribute('aria-label', `cell ${r+1},${c+1}`);
                cell.addEventListener('click', onCellClick);
                cell.addEventListener('contextmenu', onCellRightClick);
                cell.addEventListener('dblclick', onCellDblClick);
                boardEl.appendChild(cell);
            }
        }
    }

    function placeMines(firstR, firstC){
        const forbidden = new Set();
        for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
            const rr = firstR+dr, cc = firstC+dc;
            if(rr>=0 && rr<rows && cc>=0 && cc<cols) forbidden.add(rr+'_'+cc);
        }

        let placed = 0;
        while(placed < mines){
            const r = randInt(rows); const c = randInt(cols);
            const key = r+'_'+c;
            if(forbidden.has(key)) continue;
            if(board[r][c].isMine) continue;
            board[r][c].isMine = true; placed++;
        }
        for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
            let adj = 0;
            for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
                if(dr===0 && dc===0) continue;
                const rr=r+dr, cc=c+dc;
                if(rr>=0 && rr<rows && cc>=0 && cc<cols && board[rr][cc].isMine) adj++;
            }
            board[r][c].adjacent = adj;
        }
    }

    function revealCell(r,c){
        if(ended) return;
        const cellObj = board[r][c];
        if(cellObj.revealed || cellObj.flagged) return;
        const el = getCellEl(r,c);
        cellObj.revealed = true; el.classList.add('revealed');
        revealedCount++;

        if(cellObj.isMine){
            el.classList.add('mine'); el.textContent = '💣';
            endGame(false);
            return;
        }

        if(cellObj.adjacent > 0){ el.textContent = cellObj.adjacent; el.style.color = colorForNumber(cellObj.adjacent); }
        else {
            for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
                if(dr===0 && dc===0) continue;
                const rr=r+dr, cc=c+dc;
                if(rr>=0 && rr<rows && cc>=0 && cc<cols) revealCell(rr,cc);
            }
        }

        checkWin();
    }

    function checkWin(){
        if(revealedCount === rows*cols - mines){
            endGame(true);
        }
    }

    function endGame(win){
        ended = true; clearInterval(timer); timer=null;
        if(!win){
            for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
                const obj = board[r][c];
                const el = getCellEl(r,c);
                if(obj.isMine && !obj.revealed){ el.classList.add('revealed','mine'); el.textContent = '💣'; }
            }
        } else {
            saveBestTime(rows,cols,mines,seconds);
            setTimeout(()=>alert('You win! Time: '+formatTime(seconds)), 100);
        }
    }

    function getCellEl(r,c){ return boardEl.querySelector(`.cell[data-r='${r}'][data-c='${c}']`); }
    function colorForNumber(n){
        const map = {1:'#0b61f7',2:'#0b8f1a',3:'#f22f2f',4:'#1b2f6b',5:'#7b1f1f',6:'#096',7:'#333',8:'#666'}; return map[n]||'#000';
    }

    function onCellClick(e){
        if(ended) return;
        const el = e.currentTarget; const r = Number(el.dataset.r); const c = Number(el.dataset.c);

        if(firstClick){
            placeMines(r,c); startTimer(); started=true; firstClick=false;
        }

        const obj = board[r][c];
        if(obj.flagged) return;
        revealCell(r,c);
    }

    function onCellRightClick(e){
        e.preventDefault(); if(ended) return;
        const el = e.currentTarget; const r = Number(el.dataset.r); const c = Number(el.dataset.c);
        const obj = board[r][c];
        if(obj.revealed) return;
        if(!obj.flagged && !obj.question){ obj.flagged=true; el.classList.add('flag'); el.textContent = '🚩'; mineCounter--; }
        else if(obj.flagged){ obj.flagged=false; obj.question=true; el.classList.remove('flag'); el.classList.add('question'); el.textContent = '?'; mineCounter++; }
        else { obj.question=false; el.classList.remove('question'); el.textContent = ''; }
        updateMineCounter();
    }

    function onCellDblClick(e){
        if(ended) return;
        const el = e.currentTarget; const r = Number(el.dataset.r); const c = Number(el.dataset.c);
        const obj = board[r][c];
        if(!obj.revealed || obj.adjacent === 0) return;
        let flags = 0;
        for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
            const rr = r+dr, cc = c+dc;
            if(rr>=0 && rr<rows && cc>=0 && cc<cols && board[rr][cc].flagged) flags++;
        }
        if(flags === obj.adjacent){
            for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
                const rr = r+dr, cc = c+dc;
                if(rr>=0 && rr<rows && cc>=0 && cc<cols && !board[rr][cc].flagged) revealCell(rr,cc);
            }
        }
    }

    function updateMineCounter(){ mineCountEl.textContent = `Mines: ${mineCounter}`; }

    function startTimer(){
        if(timer) return;
        timer = setInterval(()=>{ seconds++; timerEl.textContent = formatTime(seconds); }, 1000);
    }

    function formatTime(s){ const mm = String(Math.floor(s/60)).padStart(2,'0'); const ss = String(s%60).padStart(2,'0'); return `${mm}:${ss}`; }

    newBtn.addEventListener('click', ()=> startNewGame());
    difficultySelect.addEventListener('change', ()=>{
        const val = difficultySelect.value;
        if(val === 'custom') customPanel.classList.remove('hidden'); else customPanel.classList.add('hidden');
        if(presets[val]){
            const p = presets[val]; rowsInput.value=p.rows; colsInput.value=p.cols; minesInput.value=p.mines;
        }
    });

    applyCustom.addEventListener('click', ()=>{
        const r = clamp(Number(rowsInput.value)||9,5,50);
        const c = clamp(Number(colsInput.value)||9,5,80);
        const m = clamp(Number(minesInput.value)||10,1, r*c-1);
        rows = r; cols = c; mines = m; resetState(rows,cols,mines);
    });

    revealAllBtn.addEventListener('click', ()=>{
        for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
            const obj = board[r][c]; if(!obj.revealed){ const el=getCellEl(r,c); obj.revealed=true; el.classList.add('revealed'); if(obj.isMine){el.classList.add('mine'); el.textContent='💣'} else if(obj.adjacent>0){el.textContent=obj.adjacent; el.style.color=colorForNumber(obj.adjacent);} }
        }
        ended=true; clearInterval(timer);
    });

    hintBtn.addEventListener('click', ()=>{
        if(ended) return;
        for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
            if(!board[r][c].isMine && !board[r][c].revealed){ revealCell(r,c); return; }
        }
    });

    flagToggle.addEventListener('click', ()=>{ flagsMode = !flagsMode; flagToggle.textContent = flagsMode ? 'Toggle Flagging' : 'Flagging Off'; });
    themeToggle.addEventListener('change', ()=>{ document.body.classList.toggle('dark', themeToggle.checked); });
    bestTimesBtn.addEventListener('click', ()=>{
        showBestTimes();
    });
    closeBestTimes.addEventListener('click', ()=>{ bestTimesModal.classList.add('hidden'); });

    function saveBestTime(r,c,m,t){
        const key = `best_${r}x${c}_${m}`;
        const prev = JSON.parse(localStorage.getItem(key) || '[]');
        prev.push(t); prev.sort((a,b)=>a-b);
        localStorage.setItem(key, JSON.stringify(prev.slice(0,10)));
    }
    function showBestTimes(){
        bestTimesList.innerHTML = '';
        const key = `best_${rows}x${cols}_${mines}`;
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        if(list.length === 0) bestTimesList.innerHTML = '<li>No best times yet</li>';
        else list.forEach((s,i)=>{ const li = document.createElement('li'); li.textContent = `${i+1}. ${formatTime(s)}`; bestTimesList.appendChild(li); });
        bestTimesModal.classList.remove('hidden');
    }

    function startNewGame(){
        const val = difficultySelect.value;
        if(presets[val]){ const p = presets[val]; rows=p.rows; cols=p.cols; mines=p.mines; }
        else { rows = clamp(Number(rowsInput.value)||9,5,50); cols = clamp(Number(colsInput.value)||9,5,80); mines = clamp(Number(minesInput.value)||10,1,rows*cols-1); }
        resetState(rows,cols,mines);
    }

    startNewGame();

})();