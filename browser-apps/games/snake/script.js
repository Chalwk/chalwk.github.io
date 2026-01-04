/*
Copyright (c) 2025-2026. Jericho Crosby (Chalwk)

Snake - JavaScript
*/

const CONFIG = {
    baseTick: 10,
    cellSize: 18,
    colors: {
        bg: '#071017',
        snake: '#7ef9ff',
        snakeHead: '#b9fffe',
        food: '#ffd166',
        golden: '#ffdf6b',
        obstacle: '#3b3f46',
        powerup: '#8b5cf6',
    },
    storageKey: 'snake-v1',
    audioEnabled: true,
    powerupSpawnIntervalRange: [7000, 16000],
    foodSpawnIntervalRange: [1000, 2500],
};

const $ = id => document.getElementById(id);
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const now = () => performance.now();

function loadStats() {
    try {
        const raw = localStorage.getItem(CONFIG.storageKey);
        return raw ? JSON.parse(raw) : { best: 0, played: 0 };
    } catch {
        return { best: 0, played: 0 };
    }
}
function saveStats(stats) {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(stats));
}

class SFX {
    constructor(enabled = true) {
        this.enabled = enabled;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch {
            this.enabled = false;
        }
    }
    toggle(on) { this.enabled = !!on; }
    beep(freq = 440, time = 0.05, type = 'sine', gain = 0.07) {
        if (!this.enabled || !this.ctx) return;
        const ctx = this.ctx;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.value = freq;
        g.gain.value = gain;
        o.connect(g); g.connect(ctx.destination);
        o.start();
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + time);
        o.stop(ctx.currentTime + time + 0.02);
    }
}

class Grid {
    constructor(canvas, cellSize){
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cellSize = cellSize;
        this.cols = 0;
        this.rows = 0;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    resize(){
        const container = this.canvas.parentElement;
        const maxWidth = container.clientWidth - 20;
        const maxHeight = Math.min(600, window.innerHeight * 0.7);

        const aspectRatio = 16/9;
        let width = maxWidth;
        let height = width / aspectRatio;

        if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
        }

        this.canvas.width = width;
        this.canvas.height = height;
        this.cols = Math.floor(width / this.cellSize);
        this.rows = Math.floor(height / this.cellSize);
    }
    clear(){
        const c = this.ctx;
        c.save();
        c.fillStyle = CONFIG.colors.bg;
        c.fillRect(0,0,this.canvas.width,this.canvas.height);
        c.restore();
    }
    drawCell(x,y, styleFn){
        const px = x * this.cellSize;
        const py = y * this.cellSize;
        styleFn(this.ctx, px, py, this.cellSize);
    }
}

class Snake {
    constructor(startX, startY){
        this.segs = [{x:startX, y:startY}];
        this.dir = {x:1,y:0};
        this.buffer = [];
        this.growBy = 0;
        this.alive = true;
        this.invulnerable = false;
        this.maxLen = 1000;
    }
    setDir(dx,dy){
        if (this.buffer.length > 0) {
            const last = this.buffer[this.buffer.length-1];
            if (last.x === dx && last.y === dy) return;
        } else {
            if (this.dir.x === -dx && this.dir.y === -dy) return;
            if (this.dir.x === dx && this.dir.y === dy) return;
        }
        this.buffer.push({x:dx,y:dy});
        if (this.buffer.length > 2) this.buffer.shift();
    }
    step(){
        if (this.buffer.length) this.dir = this.buffer.shift();
        const newHead = {x: this.segs[0].x + this.dir.x, y: this.segs[0].y + this.dir.y};
        this.segs.unshift(newHead);
        if (this.growBy > 0) {
            this.growBy--;
        } else {
            this.segs.pop();
        }
        if (this.segs.length > this.maxLen) this.segs.length = this.maxLen;
    }
    grow(n=1){ this.growBy += n; }
    shrink(n=2){
        for (let i=0;i<n;i++) if (this.segs.length>1) this.segs.pop();
    }
    collidesWithSelf(){
        const [h, ...rest] = this.segs;
        return rest.some(s => s.x === h.x && s.y === h.y);
    }
    head() { return this.segs[0]; }
}

class EntityManager {
    constructor(){ this.food = []; this.powerups = []; this.obstacles = []; this.portals = []; }
    clear(){ this.food = []; this.powerups = []; this.obstacles = []; this.portals = []; }
}

class Powerup {
    constructor(x,y, type, duration=6000){
        this.x = x; this.y = y; this.type = type; this.duration = duration;
        this.spawned = now();
    }
}

class Game {
    constructor(canvas) {
        this.stats = loadStats();
        this.canvas = canvas;
        this.grid = new Grid(canvas, CONFIG.cellSize);
        this.sfx = new SFX(CONFIG.audioEnabled);
        this.entities = new EntityManager();
        this.state = 'menu';
        this.lastTick = now();
        this.accumulator = 0;
        this.tickRate = CONFIG.baseTick;
        this.tickInterval = 1000 / this.tickRate;
        this.score = 0;
        this.level = 1;
        this.life = 1;
        this.multiplier = 1;
        this.multTimer = 0;
        this.powerTimers = {};
        this.nextPowerSpawn = now() + rand(...CONFIG.powerupSpawnIntervalRange);
        this.nextFoodSpawn = now() + rand(...CONFIG.foodSpawnIntervalRange);
        this.combo = 0;
        this.setupInput();
        this.resetGame(true);
        this._animFrame = null;
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    resetGame(fromMenu=false){
        const startX = Math.floor(this.grid.cols/2);
        const startY = Math.floor(this.grid.rows/2);
        this.snake = new Snake(startX, startY);
        this.snake.grow(3);
        this.entities.clear();
        this.score = 0;
        this.level = 1;
        this.life = 1;
        this.multiplier = 1;
        this.multTimer = 0;
        this.activeMode = $('modeSelect') ? $('modeSelect').value : 'classic';
        this.difficulty = $('difficultySelect') ? $('difficultySelect').value : 'normal';
        this.controlScheme = $('controlSelect') ? $('controlSelect').value : 'arrows';
        this.tickRate = CONFIG.baseTick * (this.difficulty === 'easy' ? 0.85 : this.difficulty === 'hard' ? 1.4 : 1);
        this.tickInterval = 1000 / this.tickRate;
        this.nextPowerSpawn = now() + rand(...CONFIG.powerupSpawnIntervalRange);
        this.nextFoodSpawn = now() + 200;
        this.obstacleCount = this.activeMode === 'obstacles' ? Math.floor(this.grid.cols * this.grid.rows * 0.02) : 0;
        if (this.obstacleCount > 0) {
            for (let i=0;i<this.obstacleCount;i++) {
                const p = this.randomEmptyCell();
                if (p) this.entities.obstacles.push(p);
            }
        }
        if (!fromMenu) this.sfx.beep(520, 0.06, 'sawtooth', 0.06);
        this.updateUI();
    }

    setupInput() {
        this.keyMap = {
            ArrowUp: () => this.snake.setDir(0,-1),
            ArrowDown: () => this.snake.setDir(0,1),
            ArrowLeft: () => this.snake.setDir(-1,0),
            ArrowRight: () => this.snake.setDir(1,0),
            w: () => this.snake.setDir(0,-1),
            s: () => this.snake.setDir(0,1),
            a: () => this.snake.setDir(-1,0),
            d: () => this.snake.setDir(1,0),
            ' ': () => this.togglePause(),
            p: () => this.togglePause(),
        };
        window.addEventListener('keydown', (e) => {
            if (this.state !== 'playing' && e.key === ' ') {
                e.preventDefault();
                $('btn-start').click();
                return;
            }
            const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
            if (this.controlScheme === 'arrows') {
                if (this.keyMap[e.key]) { e.preventDefault(); this.keyMap[e.key](); }
            } else {
                if (this.keyMap[k]) { e.preventDefault(); this.keyMap[k](); }
            }
        });

        $('btn-start').addEventListener('click', () => { this.startFromMenu(); });
        $('btn-how').addEventListener('click', () => { this.showInfo(true); });
        $('btn-back').addEventListener('click', () => { this.showInfo(false); });
        $('btn-stats')?.addEventListener('click', () => { alert(JSON.stringify(this.stats, null, 2)); });
        $('btn-pause').addEventListener('click', () => this.togglePause());
        $('btn-sound').addEventListener('click', () => {
            this.sfx.toggle(!this.sfx.enabled);
            $('btn-sound').textContent = this.sfx.enabled ? '🔊' : '🔈';
        });
        $('btn-restart').addEventListener('click', () => { this.resetGame(); this.state='playing'; this.updateUI(); });
        $('btn-menu').addEventListener('click', () => { this.state='menu'; this.updateUI(); });

        document.querySelectorAll('#touch-controls [data-dir]').forEach(btn => {
            btn.addEventListener('click', () => {
                const d = btn.dataset.dir;
                if (d === 'up') this.snake.setDir(0,-1);
                if (d === 'down') this.snake.setDir(0,1);
                if (d === 'left') this.snake.setDir(-1,0);
                if (d === 'right') this.snake.setDir(1,0);
            });
        });

        this.canvas.addEventListener('click', () => this.canvas.focus());
        const checkTouch = () => {
            const small = window.innerWidth < 720 || /Mobi|Android/i.test(navigator.userAgent);
            $('touch-controls').classList.toggle('hidden', !small);
        };
        checkTouch();
        window.addEventListener('resize', checkTouch);
    }

    startFromMenu(){
        this.resetGame(false);
        this.state = 'playing';
        $('overlay-info').classList.add('hidden');
        $('overlay').classList.add('hidden');
        this.updateUI();
    }
    showInfo(show){
        if (show) {
            $('overlay-info').classList.remove('hidden');
            $('overlay').classList.add('hidden');
        } else {
            $('overlay-info').classList.add('hidden');
            $('overlay').classList.remove('hidden');
        }
    }

    togglePause(){
        if (this.state === 'playing') { this.state = 'paused'; this.updateUI(); this.sfx.beep(220, 0.05); }
        else if (this.state === 'paused') { this.state = 'playing'; this.lastTick = now(); this.updateUI(); this.sfx.beep(660, 0.05); }
    }

    showPowerupMessage(type) {
        const messages = {
            'speed': 'Speed Boost!',
            'slow': 'Slow Motion!',
            'shrink': 'Shrunk!',
            'mult': '2x Multiplier!',
            'phase': 'Phase Through!',
            'life': 'Extra Life!',
            'magnet': 'Food Magnet!'
        };

        let messageEl = document.getElementById('powerup-message');
        messageEl.textContent = messages[type] || 'Powerup!';
        messageEl.classList.add('show');

        setTimeout(() => {
            messageEl.classList.remove('show');
            messageEl.classList.add('fade-out');
            setTimeout(() => {
                messageEl.classList.remove('fade-out');
            }, 300);
        }, 2000);
    }

    updateUI(){
        $('overlay').classList.toggle('hidden', this.state !== 'menu');
        $('overlay-gameover').classList.toggle('hidden', this.state !== 'gameover');
        $('score').textContent = `Score: ${this.score}`;
        $('best').textContent = `Best: ${this.stats.best}`;
        $('btn-pause').textContent = this.state === 'playing' ? 'Pause' : 'Resume';
        if (this.state === 'gameover') {
            $('go-score').textContent = `Score: ${this.score}`;
            $('go-best').textContent = `Best: ${this.stats.best}`;
        }
    }

    randomEmptyCell() {
        let safety = 3000;
        while (safety-- > 0) {
            const x = rand(1, this.grid.cols - 2);
            const y = rand(1, this.grid.rows - 2);
            const blocked = this.entities.obstacles.some(o => o.x === x && o.y === y)
            || this.entities.food.some(f => f.x === x && f.y === y)
            || this.entities.powerups.some(p => p.x === x && p.y === y)
            || this.snake.segs.some(s => s.x === x && s.y === y)
            || this.entities.portals.some(p => p.x === x && p.y === y);
            if (!blocked) return {x,y};
        }
        return null;
    }

    spawnFood(special=false){
        const p = this.randomEmptyCell();
        if (!p) return;
        const food = {x:p.x, y:p.y, points: special ? 50 : 10, golden: special};
        this.entities.food.push(food);
    }

    spawnPowerup(){
        const p = this.randomEmptyCell();
        if (!p) return;
        const types = ['speed','slow','shrink','mult','phase','life','magnet'];
        const type = pick(types);
        this.entities.powerups.push(new Powerup(p.x,p.y,type, 5000 + (type==='mult'?8000:0)));
    }

    spawnPortalPair(){
        const a = this.randomEmptyCell();
        const b = this.randomEmptyCell();
        if (!a || !b) return;
        this.entities.portals.push({x:a.x,y:a.y,id:1});
        this.entities.portals.push({x:b.x,y:b.y,id:2});
    }

    applyPowerup(power) {
        const t = power.type;
        this.showPowerupMessage(t);
        switch(t){
            case 'speed':
                this.tickRate *= 1.6; this.tickInterval = 1000/this.tickRate; this.sfx.beep(1200,0.08);
                this.setPowerTimer('speed', 4500, () => { this.tickRate /= 1.6; this.tickInterval = 1000/this.tickRate; });
                break;
            case 'slow':
                this.tickRate /= 1.6; this.tickInterval = 1000/this.tickRate; this.sfx.beep(220,0.08);
                this.setPowerTimer('slow', 4500, () => { this.tickRate *= 1.6; this.tickInterval = 1000/this.tickRate; });
                break;
            case 'shrink':
                this.snake.shrink(3);
                this.sfx.beep(320,0.06);
                break;
            case 'mult':
                this.multiplier = 2; this.multTimer = now() + 7000; this.sfx.beep(1500,0.08,'triangle');
                break;
            case 'phase':
                this.snake.invulnerable = true; this.setPowerTimer('phase', 6000, ()=>{ this.snake.invulnerable = false; });
                this.sfx.beep(900,0.08,'sine');
                break;
            case 'life':
                this.life = Math.min(3, this.life + 1);
                this.sfx.beep(840,0.06);
                break;
            case 'magnet':
                this.setPowerTimer('magnet', 5000, ()=>{});
                this.sfx.beep(550,0.06);
                break;
        }
    }

    setPowerTimer(name, ms, onExpire){
        if (this.powerTimers[name]) clearTimeout(this.powerTimers[name]);
        this.powerTimers[name] = setTimeout(() => {
            delete this.powerTimers[name];
            if (onExpire) onExpire();
        }, ms);
    }

    killSnake(){
        if (this.snake.invulnerable && this.life > 0) {
            return;
        }
        if (this.life > 1) {
            this.life--;
            this.snake = new Snake(Math.floor(this.grid.cols/2), Math.floor(this.grid.rows/2));
            this.snake.grow(3);
            this.sfx.beep(120,0.2,'sawtooth');
            return;
        }
        this.state = 'gameover';
        this.stats.played = (this.stats.played || 0) + 1;
        if (this.score > (this.stats.best || 0)) {
            this.stats.best = this.score;
        }
        saveStats(this.stats);
        this.updateUI();
        this.sfx.beep(120,0.4,'square', 0.12);
    }

    eatFood(foodIndex){
        const f = this.entities.food.splice(foodIndex, 1)[0];
        this.snake.grow(2);
        const pts = f.points * this.multiplier;
        this.score += pts;
        this.combo++;
        if (this.combo % 4 === 0) this.sfx.beep(1200 + this.combo*6, 0.06, 'sine', 0.06);
        else this.sfx.beep(920, 0.05);
        if (Math.random() < 0.08) this.spawnFood(true);
        this.updateUI();
    }

    eatPowerup(ix){
        const p = this.entities.powerups.splice(ix,1)[0];
        this.applyPowerup(p);
        this.updateUI();
    }

    loop(t){
        this._animFrame = requestAnimationFrame(this.loop);
        const elapsed = t - (this.lastTick || t);
        this.lastTick = t;
        if (this.state !== 'playing') {
            this.render();
            return;
        }

        if (now() > this.nextFoodSpawn) {
            const special = Math.random() < 0.03;
            this.spawnFood(special);
            this.nextFoodSpawn = now() + rand(...CONFIG.foodSpawnIntervalRange);
        }

        if (now() > this.nextPowerSpawn) {
            if (Math.random() < 0.6) this.spawnPowerup();
            if (Math.random() < 0.2) this.spawnPortalPair();
            this.nextPowerSpawn = now() + rand(...CONFIG.powerupSpawnIntervalRange);
        }

        this.accumulator += elapsed;
        while (this.accumulator >= this.tickInterval) {
            this.tick();
            this.accumulator -= this.tickInterval;
        }
        this.render();
    }

    tick(){
        this.snake.step();

        const h = this.snake.head();
        if (this.activeMode === 'walls') {
            if (h.x < 0 || h.y < 0 || h.x >= this.grid.cols || h.y >= this.grid.rows) {
                this.killSnake(); return;
            }
        } else {
            if (h.x < 0) h.x = this.grid.cols - 1;
            if (h.x >= this.grid.cols) h.x = 0;
            if (h.y < 0) h.y = this.grid.rows - 1;
            if (h.y >= this.grid.rows) h.y = 0;
        }

        if (!this.snake.invulnerable && this.entities.obstacles.some(o => o.x === h.x && o.y === h.y)) {
            this.killSnake();
        }

        if (this.entities.portals.length >= 2) {
            for (const p of this.entities.portals) {
                if (h.x === p.x && h.y === p.y) {
                    const other = this.entities.portals.find(q => q !== p);
                    if (other) {
                        this.snake.segs[0].x = other.x;
                        this.snake.segs[0].y = other.y;
                        this.sfx.beep(980,0.05);
                        break;
                    }
                }
            }
        }

        for (let i = 0; i < this.entities.food.length; i++) {
            const f = this.entities.food[i];
            if (f.x === h.x && f.y === h.y) {
                this.eatFood(i);
                break;
            }
        }

        for (let i = 0; i < this.entities.powerups.length; i++) {
            const p = this.entities.powerups[i];
            if (p.x === h.x && p.y === h.y) {
                this.eatPowerup(i);
                break;
            }
        }

        if (this.powerTimers['magnet']) {
            let nearest = null; let dist = 99999;
            for (const f of this.entities.food) {
                const d = Math.abs(f.x - h.x) + Math.abs(f.y - h.y);
                if (d < dist) { dist = d; nearest = f; }
            }
            if (nearest && dist > 0) {
                nearest.x += Math.sign(h.x - nearest.x);
                nearest.y += Math.sign(h.y - nearest.y);
            }
        }

        if (!this.snake.invulnerable && this.snake.collidesWithSelf()) {
            this.killSnake();
        }

        const nowMs = now();
        this.entities.powerups = this.entities.powerups.filter(p => (nowMs - p.spawned) < 45000);

        if (this.entities.food.length > 8) {
            this.entities.food.shift();
        }

        if (this.multTimer && now() > this.multTimer) {
            this.multiplier = 1; this.multTimer = 0;
        }

        if (this.activeMode === 'obstacles' && Math.random() < 0.02) {
            const c = this.randomEmptyCell();
            if (c) this.entities.obstacles.push(c);
        }

        if (this.score > 0 && this.score % 200 === 0) {
            if (Math.random() < 0.08) {
                this.level++;
                this.sfx.beep(1200 + this.level*30, 0.06);
                this.tickRate *= 1.05;
                this.tickInterval = 1000/this.tickRate;
            }
        }

        this.updateUI();
    }

    render(){
        const c = this.grid.ctx;
        this.grid.clear();

        c.save();
        c.globalAlpha = 0.04;
        c.strokeStyle = '#ffffff';
        for (let x=0;x<=this.grid.cols;x++){
            c.beginPath(); c.moveTo(x*this.grid.cellSize,0); c.lineTo(x*this.grid.cellSize,this.grid.rows*this.grid.cellSize); c.stroke();
        }
        for (let y=0;y<=this.grid.rows;y++){
            c.beginPath(); c.moveTo(0,y*this.grid.cellSize); c.lineTo(this.grid.cols*this.grid.cellSize,y*this.grid.cellSize); c.stroke();
        }
        c.restore();

        for (const o of this.entities.obstacles) {
            this.grid.drawCell(o.x,o.y,(ctx,px,py,s)=> {
                ctx.fillStyle = CONFIG.colors.obstacle;
                ctx.fillRect(px+1,py+1,s-2,s-2);
                ctx.globalAlpha = 0.6;
                ctx.fillStyle = '#222';
                ctx.fillRect(px+3,py+3,s-6,s-6);
                ctx.globalAlpha = 1;
            });
        }

        for (const p of this.entities.portals) {
            this.grid.drawCell(p.x,p.y,(ctx,px,py,s)=>{
                ctx.save();
                ctx.translate(px+s/2,py+s/2);
                ctx.beginPath();
                ctx.arc(0,0,s*0.35,0,Math.PI*2);
                ctx.fillStyle = 'rgba(139,92,246,0.18)';
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'rgba(0,240,255,0.38)';
                ctx.stroke();
                ctx.restore();
            });
        }

        for (const f of this.entities.food) {
            this.grid.drawCell(f.x,f.y,(ctx,px,py,s)=>{
                ctx.beginPath();
                ctx.fillStyle = f.golden ? CONFIG.colors.golden : CONFIG.colors.food;
                ctx.roundRect = function(x,y,w,h,r){ this.beginPath(); this.moveTo(x+r,y); this.arcTo(x+w,y,x+w,y+h,r); this.arcTo(x+w,y+h,x,y+h,r); this.arcTo(x,y+h,x,y,r); this.arcTo(x,y,x+w,y,r); this.closePath(); }
                ctx.roundRect(px+3,py+3,s-6,s-6,3);
                ctx.fill();
                if (f.golden){
                    ctx.strokeStyle = 'rgba(255,220,120,0.6)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            });
        }

        for (const p of this.entities.powerups) {
            const t = (now() - p.spawned) / 300;
            this.grid.drawCell(p.x,p.y,(ctx,px,py,s)=>{
                ctx.save();
                ctx.translate(px+s/2, py+s/2);
                ctx.globalAlpha = 0.9;
                ctx.beginPath();
                ctx.arc(0,0, s*0.28 + Math.sin(t)*1.6, 0, Math.PI*2);
                ctx.fillStyle = CONFIG.colors.powerup;
                ctx.fill();
                ctx.restore();
            });
        }

        for (let i = this.snake.segs.length - 1; i >= 0; i--) {
            const seg = this.snake.segs[i];
            const isHead = i === 0;
            this.grid.drawCell(seg.x, seg.y, (ctx,px,py,s)=>{
                ctx.save();
                ctx.beginPath();
                ctx.fillStyle = isHead ? CONFIG.colors.snakeHead : CONFIG.colors.snake;
                const alpha = 0.65 + (1 - (i / this.snake.segs.length)) * 0.4;
                ctx.globalAlpha = alpha;
                ctx.fillRect(px+1,py+1,s-2,s-2);
                if (isHead) {
                    ctx.fillStyle = 'rgba(255,255,255,0.12)';
                    ctx.fillRect(px + s*0.15, py + s*0.15, s*0.2, s*0.2);
                }
                ctx.restore();
            });
        }

        c.save();
        c.fillStyle = 'rgba(0,0,0,0.16)';
        c.fillRect(10,10,140,60);
        c.fillStyle = '#dff7ff';
        c.font = '14px system-ui,Segoe UI,Roboto';
        c.fillText(`Level: ${this.level}`, 18, 30);
        c.fillText(`Life: ${this.life}`, 18, 46);
        c.fillText(`x${this.multiplier}`, 84, 46);
        c.restore();

        if (this.state === 'paused') {
            c.save();
            c.fillStyle = 'rgba(0,0,0,0.44)';
            c.fillRect(0,0,this.canvas.width,this.canvas.height);
            c.fillStyle = '#fff';
            c.font = 'bold 46px system-ui';
            c.textAlign = 'center';
            c.fillText('PAUSED', this.canvas.width/2, this.canvas.height/2);
            c.restore();
        }
    }
}

CanvasRenderingContext2D.prototype.roundRect = function(x,y,w,h,r){
    if (r === undefined) r = 6;
    this.beginPath();
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    this.closePath();
};

window.addEventListener('load', () => {
    const canvas = $('gameCanvas');
    canvas.tabIndex = 1000;
    const game = new Game(canvas);

    const stats = loadStats();
    $('best').textContent = `Best: ${stats.best}`;

    ['modeSelect','difficultySelect','controlSelect'].forEach(id => {
        const el = $(id);
        if (!el) return;
        el.addEventListener('change', () => {});
    });
});