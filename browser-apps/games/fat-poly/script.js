(() => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d', { alpha: false });
    let W = 800, H = 600, DPR = Math.max(1, window.devicePixelRatio || 1);
    let audioEnabled = true;
    let running = false;

    // UI elements
    const healthFill = document.getElementById('healthFill');
    const progressFill = document.getElementById('progressFill');
    const scoreEl = document.getElementById('score');
    const levelEl = document.getElementById('level');
    const eatenEl = document.getElementById('eaten');
    const targetEl = document.getElementById('target');
    const overlay = document.getElementById('overlay');
    const overlayBtn = document.getElementById('overlayBtn');
    const overlayText = document.getElementById('overlayText');
    const btnStart = document.getElementById('btn-start');
    const btnPause = document.getElementById('btn-pause');
    const btnSound = document.getElementById('btn-sound');
    const btnReset = document.getElementById('btn-reset');

    // Game constants
    const MAX_LEVEL = 10;
    const BASE_TARGET = 8;
    const BASE_PARTICLES = 18;
    const SHAPE_TYPES = [
        'circle','triangle','square','rectangle','oval','pentagon','hexagon','heptagon','star','diamond','isosceles','kite','trapezoid','parallelogram','arrow','crescent','gear','spiral','cube','cylinder','cone','torus','octagon','nonagon','decagon'
    ];

    // Healthy shapes (green) vs unhealthy shapes (red). We'll select types from list:
    const healthySet = new Set(['circle','triangle','pentagon','hexagon','star','spiral','cylinder','cone','torus','cube','octagon','decagon']);
    const unhealthySet = new Set(['square','rectangle','oval','diamond','trapezoid','parallelogram','arrow','crescent','gear','nonagon','heptagon','isosceles','kite']);

    // Game state
    const state = {
        player: null,
        particles: [],
        specials: [],
        particlesEaten: 0,
        score: 0,
        level: 1,
        targetToAdvance: BASE_TARGET,
        health: 100,
        shake: 0,
        lastSpawn: 0,
        lastSpecial: 0,
        time: 0,
        effects: {},
    };

    // Resize canvas
    function resize() {
        const rect = canvas.getBoundingClientRect();
        W = Math.max(300, Math.floor(rect.width));
        H = Math.max(200, Math.floor(rect.height));
        canvas.width = Math.floor(W * DPR);
        canvas.height = Math.floor(H * DPR);
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        ctx.setTransform(DPR,0,0,DPR,0,0);
    }
    window.addEventListener('resize', resize);
    resize();

    // Utility
    function rand(min, max) { return Math.random() * (max - min) + min; }
    function irand(min, max) { return Math.floor(rand(min, max + 1)); }
    function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
    function dist(ax,ay,bx,by){return Math.hypot(ax-bx,ay-by)}

    // Player
    class Player {
        constructor() {
            this.size = 28;
            this.x = W/2;
            this.y = H/2;
            this.speed = 280; // px/s
            this.vx = 0; this.vy = 0;
            this.target = { x: this.x, y: this.y };
            this.color = '#ffffff';
            this.health = 100;
            this.moveKeys = { up:false,down:false,left:false,right:false };
        }
        update(dt){
            // keyboard movement
            let mx=0,my=0;
            if(this.moveKeys.up) my-=1;
            if(this.moveKeys.down) my+=1;
            if(this.moveKeys.left) mx-=1;
            if(this.moveKeys.right) mx+=1;
            if(mx!==0||my!==0){
                const len = Math.hypot(mx,my)||1;
                this.vx = (mx/len) * this.speed;
                this.vy = (my/len) * this.speed;
                this.target.x = this.x + this.vx * 0.12;
                this.target.y = this.y + this.vy * 0.12;
            } else {
                // smooth move toward mouse target
                const dx = this.target.x - this.x;
                const dy = this.target.y - this.y;
                this.vx = dx * 6;
                this.vy = dy * 6;
            }
            const nx = this.x + this.vx * dt;
            const ny = this.y + this.vy * dt;
            this.x = clamp(nx, this.size/2, W - this.size/2);
            this.y = clamp(ny, this.size/2, H - this.size/2);
        }
        draw(ctx){
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.shadowColor = 'rgba(0,0,0,0.6)';
            ctx.shadowBlur = 16;
            ctx.fillStyle = this.color;
            // subtle rounded square
            const s = this.size;
            const r = Math.min(8, s*0.12);
            roundRect(ctx, -s/2, -s/2, s, s, r);
            ctx.fill();
            ctx.restore();
        }
    }

    // Particle (food)
    class Particle {
        constructor(kind, x, y, radius, angle, speed) {
            this.kind = kind; // shape type string
            this.x = x; this.y = y;
            this.r = radius;
            this.angle = angle;
            this.speed = speed;
            this.rotation = Math.random()*Math.PI*2;
            this.spin = rand(-1.2,1.2);
            this.hue = kindHue(kind);
            // decide healthy vs unhealthy based on sets and randomness
            this.isHealthy = healthySet.has(kind) || (!unhealthySet.has(kind) && Math.random() < 0.55);
            // make color
            this.color = this.isHealthy ? '#39b54a' : '#e94b3c';
            // special flag for purple special or effect-changed reversed
            this.reversed = false;
            this.birth = performance.now();
        }
        update(dt, t){
            this.x += Math.cos(this.angle) * this.speed * dt * speedMultiplier();
            this.y += Math.sin(this.angle) * this.speed * dt * speedMultiplier();
            this.rotation += this.spin * dt;
            // wrap
            if(this.x < -40) this.x = W + 40;
            if(this.x > W + 40) this.x = -40;
            if(this.y < -40) this.y = H + 40;
            if(this.y > H + 40) this.y = -40;
        }
        draw(ctx){
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            // outline
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = 'rgba(0,0,0,0.25)';
            // fill based on effect reversal
            const fill = (this.reversed ? (this.isHealthy ? '#e94b3c' : '#39b54a') : this.color);
            drawShape(ctx, this.kind, this.r, fill, '#00000030');
            ctx.restore();
        }
    }

    // Specials - purple circles that trigger effects
    class Special {
        constructor(x,y,dur, effect){
            this.x=x; this.y=y; this.r=18; this.timer = dur || 8;
            this.effect = effect || chooseSpecial();
            this.birth = performance.now();
        }
        update(dt){ this.timer -= dt; }
        draw(ctx){
            ctx.save();
            ctx.translate(this.x,this.y);
            const t = (performance.now()-this.birth)/400;
            ctx.beginPath();
            ctx.fillStyle = 'rgba(170,110,220,0.12)';
            ctx.arc(0,0,this.r+6*Math.sin(t),0,Math.PI*2);
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(170,110,220,0.95)';
            ctx.beginPath();
            ctx.arc(0,0,this.r,0,Math.PI*2);
            ctx.stroke();
            ctx.restore();

            // label small text
            ctx.save();
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(this.effect, this.x, this.y+this.r+14);
            ctx.restore();
        }
    }

    function chooseSpecial(){
        const list = ['RUSH','JAM','REVERSE','CLEAN','WEIGHT+','WEIGHT-'];
        return list[irand(0,list.length-1)];
    }

    // helper draw functions
    function roundRect(ctx,x,y,w,h,r){
        ctx.beginPath();
        ctx.moveTo(x+r,y);
        ctx.arcTo(x+w,y,x+w,y+h,r);
        ctx.arcTo(x+w,y+h,x,y+h,r);
        ctx.arcTo(x,y+h,x,y,r);
        ctx.arcTo(x,y,x+w,y,r);
        ctx.closePath();
    }
    function drawShape(ctx, type, size, fill, stroke){
        ctx.fillStyle = fill || '#fff';
        ctx.strokeStyle = stroke || 'rgba(0,0,0,0.2)';
        switch(type){
            case 'circle':
                ctx.beginPath(); ctx.arc(0,0,size,0,Math.PI*2); ctx.fill(); ctx.stroke(); break;
            case 'triangle':
                ctx.beginPath(); ctx.moveTo(0,-size); ctx.lineTo(size*0.9,size*0.7); ctx.lineTo(-size*0.9,size*0.7); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
            case 'square':
            case 'rectangle':
                roundRect(ctx,-size*0.85,-size*0.85,size*1.7,size*1.2, size*0.18); ctx.fill(); ctx.stroke(); break;
            case 'oval':
                ctx.beginPath(); ctx.ellipse(0,0,size*1.15,size,0,0,Math.PI*2); ctx.fill(); ctx.stroke(); break;
            case 'pentagon': poly(ctx,5,size); break;
            case 'hexagon': poly(ctx,6,size); break;
            case 'heptagon': poly(ctx,7,size); break;
            case 'octagon': poly(ctx,8,size); break;
            case 'nonagon': poly(ctx,9,size); break;
            case 'decagon': poly(ctx,10,size); break;
            case 'star': star(ctx,5,size, size*0.45); break;
            case 'diamond':
                ctx.beginPath(); ctx.moveTo(0,-size); ctx.lineTo(size,0); ctx.lineTo(0,size); ctx.lineTo(-size,0); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
            case 'isosceles':
                ctx.beginPath(); ctx.moveTo(0,-size); ctx.lineTo(size*0.6,size); ctx.lineTo(-size*0.6,size); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
            case 'kite':
                ctx.beginPath(); ctx.moveTo(0,-size); ctx.lineTo(size*0.6,0); ctx.lineTo(0,size); ctx.lineTo(-size*0.6,0); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
            case 'trapezoid':
                ctx.beginPath(); ctx.moveTo(-size*0.9,-size*0.6); ctx.lineTo(size*0.9,-size*0.6); ctx.lineTo(size*0.6,size*0.9); ctx.lineTo(-size*0.6,size*0.9); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
            case 'parallelogram':
                ctx.beginPath(); ctx.moveTo(-size*0.8,-size*0.9); ctx.lineTo(size*0.8,-size*0.5); ctx.lineTo(size*0.8,size*0.9); ctx.lineTo(-size*0.8,size*0.5); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
            case 'arrow':
                ctx.beginPath(); ctx.moveTo(0,-size); ctx.lineTo(size*0.8,0); ctx.lineTo(size*0.15,0); ctx.lineTo(size*0.15,size); ctx.lineTo(-size*0.15,size); ctx.lineTo(-size*0.15,0); ctx.lineTo(-size*0.8,0); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
            case 'crescent':
                ctx.beginPath(); ctx.arc(-size*0.2,0,size,0,Math.PI*2); ctx.fill(); ctx.globalCompositeOperation='destination-out'; ctx.arc(size*0.45,0,size*0.66,0,Math.PI*2); ctx.fill(); ctx.globalCompositeOperation='source-over'; ctx.stroke(); break;
            case 'gear':
                gear(ctx,size,8); break;
            case 'spiral':
                spiral(ctx,size); break;
            case 'cube':
                drawCube(ctx,size); break;
            case 'cylinder':
                cylinder(ctx,size); break;
            case 'cone':
                cone(ctx,size); break;
            case 'torus':
                torus(ctx,size); break;
            default:
                // fallback circle
                ctx.beginPath(); ctx.arc(0,0,size,0,Math.PI*2); ctx.fill(); ctx.stroke();
        }
    }
    function poly(ctx,sides,size){
        const ang = Math.PI*2/sides;
        ctx.beginPath();
        for(let i=0;i<sides;i++){
            const a = -Math.PI/2 + i*ang;
            const x = Math.cos(a)*size;
            const y = Math.sin(a)*size;
            if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    function star(ctx,points,outer,inner){
        const step = Math.PI/points;
        ctx.beginPath();
        for(let i=0;i<points*2;i++){
            const r = (i%2===0)?outer:inner;
            const a = -Math.PI/2 + i*step;
            const x = Math.cos(a)*r, y = Math.sin(a)*r;
            if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    function gear(ctx,size,teeth){
        ctx.beginPath();
        for(let i=0;i<teeth*2;i++){
            const a = -Math.PI/2 + i*(Math.PI/teeth);
            const r = (i%2===0)?size*1.06:size*0.7;
            const x = Math.cos(a)*r, y = Math.sin(a)*r;
            if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(0,0,size*0.46,0,Math.PI*2); ctx.fillStyle='rgba(0,0,0,0.12)'; ctx.fill();
    }
    function spiral(ctx,size){
        ctx.beginPath();
        for(let i=0;i<24;i++){
            const a = i*0.6;
            const r = size*(i/24);
            const x = Math.cos(a)*r, y = Math.sin(a)*r;
            if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        }
        ctx.stroke();
    }
    function drawCube(ctx,size){
        const s = size*0.7;
        ctx.beginPath();
        ctx.moveTo(-s,-s); ctx.lineTo(s,-s); ctx.lineTo(s,s); ctx.lineTo(-s,s); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-s,-s); ctx.lineTo(-s*0.6,-s*1.4); ctx.lineTo(s*0.6,-s*1.4); ctx.lineTo(s,-s); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s,-s); ctx.lineTo(s*0.6,-s*1.4); ctx.lineTo(s*0.6,s* -1.4 + s*1.4); ctx.lineTo(s,s); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    function cylinder(ctx,size){
        ctx.beginPath(); ctx.ellipse(0,-size*0.7,size*0.9,size*0.35,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.rect(-size*0.9,-size*0.7,size*1.8,size*1.2); ctx.fill(); ctx.stroke();
    }
    function cone(ctx,size){
        ctx.beginPath(); ctx.moveTo(0,-size); ctx.lineTo(size*0.9,size); ctx.lineTo(-size*0.9,size); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    function torus(ctx,size){
        ctx.beginPath(); ctx.arc(0,0,size,0,Math.PI*2); ctx.fill(); ctx.globalCompositeOperation='destination-out'; ctx.beginPath(); ctx.arc(0,0,size*0.55,0,Math.PI*2); ctx.fill(); ctx.globalCompositeOperation='source-over'; ctx.stroke();
    }

    function kindHue(kind){
        return Math.abs(kind.split('').reduce((a,c)=>a+c.charCodeAt(0),0)) % 360;
    }

    function speedMultiplier(){
        let m = 1 + (state.level-1) * 0.09;
        if(state.effects.RUSH) m *= 1.9;
        if(state.effects.JAM) m *= 0.55;
        return m;
    }

    // spawn particles
    function spawnMany(count){
        for(let i=0;i<count;i++) spawnParticle();
    }
    function spawnParticle(kind){
        kind = kind || SHAPE_TYPES[irand(0, SHAPE_TYPES.length-1)];
        const size = rand(8, 22) * (0.9 + state.level*0.03);
        const side = irand(0,3);
        let x, y;
        if(side===0){ x = -30; y = rand(0,H); }
        else if(side===1){ x = W+30; y = rand(0,H); }
        else if(side===2){ x = rand(0,W); y = -30; }
        else { x = rand(0,W); y = H+30; }
        const angle = Math.atan2(H/2 - y, W/2 - x) + rand(-0.9,0.9);
        const speed = rand(25, 80) * (1 + state.level*0.12);
        const p = new Particle(kind, x, y, size, angle, speed);
        state.particles.push(p);
        return p;
    }

    // spawn special
    function spawnSpecial(){
        const x = rand(80,W-80), y = rand(80,H-80);
        const sp = new Special(x,y, 8, chooseSpecial());
        state.specials.push(sp);
    }

    // collision detection
    function checkCollisions(){
        const pl = state.player;
        const pr = pl.size * 0.5;
        for(let i=state.particles.length-1;i>=0;i--){
            const p = state.particles[i];
            const d = dist(pl.x,pl.y,p.x,p.y);
            if(d < pr + p.r*0.9){
                // collision!
                eatParticle(p);
                state.particles.splice(i,1);
                screenShake(6);
                spawnParticlesEffect(p.x,p.y, p.color, 8);
            }
        }
        // specials pickup
        for(let i=state.specials.length-1;i>=0;i--){
            const s = state.specials[i];
            const d = dist(pl.x,pl.y,s.x,s.y);
            if(d < pr + s.r){
                applySpecial(s.effect);
                state.specials.splice(i,1);
                screenShake(10);
            }
        }
    }

    function eatParticle(p){
        // reverse effects if global reversed
        let healthy = p.isHealthy ^ !!state.effects.REVERSE;
        if(p.reversed) healthy = !healthy;
        if(healthy){
            // grow
            const gain = 4 + Math.round(p.r*0.08);
            state.player.size += gain;
            state.score += 10 + Math.round(p.r);
            state.particlesEaten++;
            audioBeep(880, 0.06);
        } else {
            // damage
            const dmg = 6 + Math.round(p.r*0.06) + (state.level-1);
            state.health = clamp(state.health - dmg, 0, 100);
            state.score -= Math.max(0, 6 - state.level);
            audioBeep(220, 0.08);
            // small hurt effect
        }
        updateUI();
        // check level up
        if(state.particlesEaten >= state.targetToAdvance){
            levelUp();
        }
    }

    function applySpecial(effect){
        // map effect names to behavior
        switch(effect){
            case 'RUSH': state.effects.RUSH = 12; break;
            case 'JAM': state.effects.JAM = 12; break;
            case 'REVERSE': state.effects.REVERSE = 10; reverseAllParticles(true); break;
            case 'CLEAN': state.effects.CLEAN = 10; reverseAllParticles(false); break;
            case 'WEIGHT+':
                state.player.size += 10; audioBeep(980,0.12); break;
            case 'WEIGHT-':
                state.player.size = Math.max(12, state.player.size - 8); audioBeep(580,0.12); break;
        }
        // visual flash and sound
    }

    function reverseAllParticles(flag){
        for(const p of state.particles) p.reversed = !flag ? false : p.reversed;
        // if flag true, flip colors of all particles so they become maybe dangerous/healthy swapped:
        if(flag){
            for(const p of state.particles) p.reversed = !p.reversed;
        }
    }

    function levelUp(){
        if(state.level >= MAX_LEVEL) return win();
        state.level++;
        state.particlesEaten = 0;
        state.targetToAdvance = BASE_TARGET + Math.floor(state.level * 1.9);
        // size slightly decreases
        state.player.size = Math.max(14, state.player.size - Math.floor(state.level*1.1));
        // spawn more particles and increase speed
        spawnMany(BASE_PARTICLES + Math.floor(state.level*3));
        // remove temporary effects
        state.effects = {};
        audioBeep(1200, 0.16);
        shakeScreen(14);
        updateUI();
    }

    function win(){
        running = false;
        overlayTitleText('You beat FatPoly! 🎉', `Score ${state.score} • Level ${state.level}`);
        overlay.classList.remove('hidden');
    }

    function lose(){
        running = false;
        overlayTitleText('You Died', `You reached 0 health. Score ${state.score}`);
        overlay.classList.remove('hidden');
    }

    function overlayTitleText(title, text){
        document.getElementById('overlayTitle').innerText = title;
        overlayText.innerText = text;
        overlayBtn.innerText = 'Restart';
    }

    // UI updates
    function updateUI(){
        healthFill.style.width = Math.max(0, state.health) + '%';
        progressFill.style.width = Math.min(100, state.particlesEaten / state.targetToAdvance * 100) + '%';
        scoreEl.innerText = 'Score: ' + Math.max(0, state.score);
        levelEl.innerText = 'Level: ' + state.level;
        eatenEl.innerText = 'Eaten: ' + state.particlesEaten;
        targetEl.innerText = 'Target: ' + state.targetToAdvance;
    }

    // spawn initial
    function resetGame(){
        state.player = new Player();
        state.particles = [];
        state.specials = [];
        state.particlesEaten = 0;
        state.score = 0;
        state.level = 1;
        state.targetToAdvance = BASE_TARGET;
        state.health = 100;
        state.effects = {};
        state.shake = 0;
        spawnMany(BASE_PARTICLES);
        updateUI();
        overlay.classList.add('hidden');
    }

    // particle effects on eat
    const effectsBuffer = [];
    function spawnParticlesEffect(x,y,color,count){
        for(let i=0;i<count;i++){
            effectsBuffer.push({
                x, y, vx: rand(-120,120), vy: rand(-120,120), life: rand(0.3,0.9), size: rand(2,6), color
            });
        }
    }

    function updateEffects(dt){
        for(let i=effectsBuffer.length-1;i>=0;i--){
            const e = effectsBuffer[i];
            e.vy += 300*dt;
            e.x += e.vx*dt; e.y += e.vy*dt;
            e.life -= dt;
            if(e.life <= 0) effectsBuffer.splice(i,1);
        }
    }

    // screen shake
    function screenShake(amount){
        state.shake = Math.max(state.shake, amount);
    }
    function shakeScreen(amount){
        screenShake(amount);
    }

    // game loop
    let last = performance.now();
    function loop(now){
        const dt = clamp((now - last)/1000, 0, 0.05);
        last = now;
        if(running){
            step(dt);
        }
        render(now);
        requestAnimationFrame(loop);
    }

    function step(dt){
        state.time += dt;
        // update effects durations
        for(const k of Object.keys(state.effects)){
            if(state.effects[k] !== false){
                state.effects[k] -= dt;
                if(state.effects[k] <= 0) delete state.effects[k];
            }
        }
        // occasionally spawn specials
        if(state.time - state.lastSpecial > Math.max(6, 18 - state.level*1.2)){
            state.lastSpecial = state.time;
            spawnSpecial();
        }
        // spawn periodic particles to increase density with level
        if(state.time - state.lastSpawn > Math.max(0.4, 1.6 - state.level*0.12)){
            state.lastSpawn = state.time;
            spawnParticle();
        }
        // update player & particles
        state.player.update(dt);
        for(const p of state.particles) p.update(dt, state.time);
        for(const s of state.specials) s.update(dt);
        // update particle effect particles
        updateEffects(dt);
        // collisions
        checkCollisions();
        // check health lose condition
        if(state.health <= 0) lose();
    }

    // render
    function render(now){
        // background animated gradient
        ctx.save();
        const g = ctx.createLinearGradient(0,0,0,H);
        g.addColorStop(0, '#071026');
        g.addColorStop(1, '#0f1628');
        ctx.fillStyle = g;
        ctx.fillRect(0,0,W,H);

        // moving orbs background
        drawBackgroundOrbs(now);

        // screen shake offset
        let ox = 0, oy = 0;
        if(state.shake > 0){
            ox = rand(-state.shake, state.shake);
            oy = rand(-state.shake, state.shake);
            state.shake = Math.max(0, state.shake - 0.7);
        }
        ctx.translate(ox, oy);

        // draw specials below particles
        for(const s of state.specials) s.draw(ctx);

        // draw particles
        for(const p of state.particles) p.draw(ctx);

        // draw player
        state.player.draw(ctx);

        // draw particle effects (sparks)
        for(const e of effectsBuffer){
            ctx.beginPath();
            ctx.globalAlpha = Math.max(0, e.life);
            ctx.fillStyle = e.color || '#fff';
            ctx.arc(e.x, e.y, e.size, 0, Math.PI*2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        // HUD drawing on canvas - small vignette
        ctx.restore();

        // top-right floating stats
        ctx.save();
        ctx.font = '12px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.fillText(`Level ${state.level} • Score ${state.score}`, 12, 20);
        ctx.restore();
    }

    // animated background orbs
    const orbs = [];
    for(let i=0;i<12;i++) orbs.push({x:rand(0,1),y:rand(0,1),s:rand(40,160),v:rand(0.02,0.08)});
    function drawBackgroundOrbs(now){
        for(const o of orbs){
            o.x += o.v*0.0005;
            o.y += Math.sin(now*0.0008*o.v)*0.0008;
            const x = (o.x % 1 + 1)%1 * W;
            const y = (o.y % 1 + 1)%1 * H;
            const r = o.s * 0.5;
            ctx.beginPath();
            const g = ctx.createRadialGradient(x,y,r*0.2,x,y,r*1.4);
            g.addColorStop(0, 'rgba(169,122,255,0.06)');
            g.addColorStop(1, 'rgba(169,122,255,0)');
            ctx.fillStyle = g;
            ctx.arc(x,y,r,0,Math.PI*2);
            ctx.fill();
        }
    }

    // input handling
    canvas.addEventListener('pointerdown', (e)=>{
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left);
        const y = (e.clientY - rect.top);
        state.player.target.x = clamp(x, state.player.size/2, W - state.player.size/2);
        state.player.target.y = clamp(y, state.player.size/2, H - state.player.size/2);
    });
    // allow dragging
    let dragging = false;
    canvas.addEventListener('pointermove', (e)=>{
        if(e.buttons === 1){
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left);
            const y = (e.clientY - rect.top);
            state.player.target.x = clamp(x, state.player.size/2, W - state.player.size/2);
            state.player.target.y = clamp(y, state.player.size/2, H - state.player.size/2);
        }
    });

    window.addEventListener('keydown', (e)=>{
        if(e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') state.player.moveKeys.up = true;
        if(e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') state.player.moveKeys.down = true;
        if(e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') state.player.moveKeys.left = true;
        if(e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') state.player.moveKeys.right = true;
        if(e.key === ' '){ e.preventDefault(); toggleRunning(); }
    });
    window.addEventListener('keyup', (e)=>{
        if(e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') state.player.moveKeys.up = false;
        if(e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') state.player.moveKeys.down = false;
        if(e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') state.player.moveKeys.left = false;
        if(e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') state.player.moveKeys.right = false;
    });

    // control buttons
    btnStart.addEventListener('click', ()=>{ startGame(); });
    overlayBtn.addEventListener('click', ()=>{ startGame(); });
    btnPause.addEventListener('click', ()=>{ toggleRunning(); });
    btnSound.addEventListener('click', ()=>{ audioEnabled = !audioEnabled; btnSound.innerText = audioEnabled ? '🔊' : '🔈'; });
    btnReset.addEventListener('click', ()=>{ resetGame(); overlay.classList.add('hidden'); running=true; });

    function startGame(){
        resetGame();
        running = true;
        overlay.classList.add('hidden');
    }
    function toggleRunning(){ running = !running; overlay.classList.toggle('hidden', running); }

    // audio simple using WebAudio
    const Audio = (()=>{
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        return {
            beep:(freq, time=0.08, type='sine')=>{
                if(!audioEnabled) return;
                try{
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = type; o.frequency.value = freq;
                    g.gain.value = 0.0001;
                    o.connect(g); g.connect(ctx.destination);
                    const now = ctx.currentTime;
                    g.gain.exponentialRampToValueAtTime(0.22, now + 0.01);
                    g.gain.exponentialRampToValueAtTime(0.0001, now + time);
                    o.start(now); o.stop(now + time + 0.02);
                }catch(e){}
            },
            musicLoop:()=>{
                // simple background sequence using oscillators when running
            }
        };
    })();

    function audioBeep(freq, time){ Audio.beep(freq, time); }

    // small helper to compress damage to UI
    function updateCanvasSize(){
        resize();
        // adjust any positions if needed
    }

    // animation kick-off
    window.addEventListener('load', ()=>{
        resize();
        last = performance.now();
        requestAnimationFrame(loop);
    });

    // initialize
    resetGame();

    // expose some debugging on window (optional)
    window.fatpoly = { state };

})();
