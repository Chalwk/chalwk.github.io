const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const keys = {};
document.addEventListener('keydown', e => keys[e.code] = true);
document.addEventListener('keyup', e => keys[e.code] = false);

let score = 0;
let lives = 3;
let gameOver = false;

// ---------- Starfield ----------
class Star {
    constructor(x, y, size, speed) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = speed;
    }
    update() {
        this.x -= this.speed;
        if(this.x < 0) this.x = canvas.width;
    }
    draw() {
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

const stars = [];
for(let i=0; i<150; i++){
    stars.push(new Star(Math.random()*canvas.width, Math.random()*canvas.height, Math.random()*2+1, Math.random()*1+0.2));
}

// ---------- Player ----------
const player = {
    x: canvas.width/2,
    y: canvas.height/2,
    angle: 0,
    radius: 15,
    speed: 0,
    bullets: [],
    canShoot: true
};

function drawPlayer(x, y, size = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(player.angle);
    ctx.strokeStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(20*size,0);
    ctx.lineTo(-15*size,10*size);
    ctx.lineTo(-10*size,0);
    ctx.lineTo(-15*size,-10*size);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}

// ---------- Asteroids ----------
class Asteroid {
    constructor(x, y, radius, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.velocity = velocity;
        this.vertices = [];
        for(let i=0;i<Math.floor(Math.random()*5)+5;i++){
            this.vertices.push(Math.random()*radius*0.6+radius*0.4);
        }
        this.angle = 0;
    }
    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        if(this.x<0) this.x=canvas.width;
        if(this.x>canvas.width) this.x=0;
        if(this.y<0) this.y=canvas.height;
        if(this.y>canvas.height) this.y=0;
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.strokeStyle='white';
        ctx.beginPath();
        for(let i=0;i<this.vertices.length;i++){
            const angle = (Math.PI*2/this.vertices.length)*i;
            const r = this.vertices[i];
            const x = Math.cos(angle)*r;
            const y = Math.sin(angle)*r;
            if(i===0) ctx.moveTo(x,y);
            else ctx.lineTo(x,y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
}

const asteroids = [];
function spawnAsteroids(num=6){
    for(let i=0;i<num;i++){
        asteroids.push(new Asteroid(Math.random()*canvas.width, Math.random()*canvas.height, Math.random()*30+20, {x:(Math.random()-0.5)*2, y:(Math.random()-0.5)*2}));
    }
}
spawnAsteroids();

// ---------- Bullets ----------
function shootBullet() {
    player.bullets.push({
        x: player.x + Math.cos(player.angle)*20,
        y: player.y + Math.sin(player.angle)*20,
        angle: player.angle,
        speed: 5
    });
}

// ---------- Enemy ----------
class Enemy {
    constructor() {
        this.x = Math.random()*canvas.width;
        this.y = -50;
        this.radius = 20;
        this.speed = 1 + Math.random();
        this.bullets = [];
        this.shootCooldown = 0;
    }
    update() {
        this.y += this.speed;
        if(this.y > canvas.height + 50){
            this.x = Math.random()*canvas.width;
            this.y = -50;
        }
        this.shootCooldown--;
        if(this.shootCooldown<=0){
            this.bullets.push({x:this.x, y:this.y, angle: Math.atan2(player.y-this.y, player.x-this.x), speed: 3});
            this.shootCooldown = 100;
        }
        this.bullets.forEach((b, i)=>{
            b.x += Math.cos(b.angle)*b.speed;
            b.y += Math.sin(b.angle)*b.speed;
            if(b.x<0 || b.x>canvas.width || b.y<0 || b.y>canvas.height){
                this.bullets.splice(i,1);
            }
        });
    }
    draw() {
        ctx.strokeStyle='red';
        ctx.beginPath();
        ctx.rect(this.x-15,this.y-10,30,20);
        ctx.stroke();
        this.bullets.forEach(b=>{
            ctx.fillStyle='red';
            ctx.beginPath();
            ctx.arc(b.x,b.y,3,0,Math.PI*2);
            ctx.fill();
        });
    }
}

// Enemy spawn system
let enemy = null;
let enemySpawnTimer = Math.floor(Math.random() * 500) + 500; // ~8-16s

// ---------- Helper ----------
function wrap(obj){
    if(obj.x < 0) obj.x = canvas.width;
    if(obj.x > canvas.width) obj.x = 0;
    if(obj.y < 0) obj.y = canvas.height;
    if(obj.y > canvas.height) obj.y = 0;
}

// ---------- Game Loop ----------
function update() {
    if(gameOver) return;

    // Player controls
    if(keys['ArrowLeft']) player.angle -= 0.05;
    if(keys['ArrowRight']) player.angle += 0.05;
    if(keys['ArrowUp']){
        player.speed = 3;
        player.x += Math.cos(player.angle)*player.speed;
        player.y += Math.sin(player.angle)*player.speed;
    } else player.speed=0;

    wrap(player);

    // Shooting
    if(keys['Space']){
        if(player.canShoot){
            shootBullet();
            player.canShoot = false;
            setTimeout(()=>player.canShoot=true, 200);
        }
    }

    // Update bullets
    player.bullets.forEach((b,i)=>{
        b.x += Math.cos(b.angle)*b.speed;
        b.y += Math.sin(b.angle)*b.speed;
        if(b.x<0 || b.x>canvas.width || b.y<0 || b.y>canvas.height){
            player.bullets.splice(i,1);
        }
    });

    asteroids.forEach(a=>a.update());

    // Random enemy spawn
    if(!enemy){
        enemySpawnTimer--;
        if(enemySpawnTimer <= 0){
            enemy = new Enemy();
            enemySpawnTimer = Math.floor(Math.random() * 1000) + 800; // next random spawn
        }
    }

    // Enemy update
    if(enemy){
        enemy.update();

        // Enemy bullet-player collisions
        enemy.bullets.forEach((b, i)=>{
            const dx = b.x - player.x;
            const dy = b.y - player.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if(dist < player.radius){
                enemy.bullets.splice(i,1);
                lives--;
                if(lives <= 0){
                    gameOver = true;
                }
            }
        });

        // Remove enemy if offscreen
        if(enemy.y > canvas.height + 50){
            enemy = null;
        }
    }

    // Bullet-asteroid collisions
    player.bullets.forEach((b,i)=>{
        asteroids.forEach((a,j)=>{
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if(dist < a.radius){
                player.bullets.splice(i,1);
                asteroids.splice(j,1);
                score += 10;
                if(a.radius>15){
                    asteroids.push(new Asteroid(a.x,a.y,a.radius/2,{x:(Math.random()-0.5)*2, y:(Math.random()-0.5)*2}));
                    asteroids.push(new Asteroid(a.x,a.y,a.radius/2,{x:(Math.random()-0.5)*2, y:(Math.random()-0.5)*2}));
                }
            }
        });
    });

    asteroids.forEach((a, i) => {
        const dx = a.x - player.x;
        const dy = a.y - player.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if(dist < a.radius + player.radius){
            // Collision detected
            lives--;
            if(lives <= 0){
                gameOver = true;
            }
            // Remove the asteroid and break it into smaller ones
            asteroids.splice(i, 1);
            score += 10;
            if(a.radius > 15){
                asteroids.push(new Asteroid(a.x, a.y, a.radius/2, {x:(Math.random()-0.5)*2, y:(Math.random()-0.5)*2}));
                asteroids.push(new Asteroid(a.x, a.y, a.radius/2, {x:(Math.random()-0.5)*2, y:(Math.random()-0.5)*2}));
            }
        }
    });
}

function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    stars.forEach(s=>{s.update(); s.draw();});

    asteroids.forEach(a=>a.draw());

    drawPlayer(player.x, player.y);

    player.bullets.forEach(b=>{
        ctx.fillStyle='white';
        ctx.beginPath();
        ctx.arc(b.x,b.y,3,0,Math.PI*2);
        ctx.fill();
    });

    if(enemy) enemy.draw();

    // ---------- HUD ----------
    for(let i=0;i<lives;i++){
        ctx.save();
        ctx.translate(30 + i*40, 30);
        ctx.rotate(0); // Fixed angle (no rotation)
        ctx.strokeStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(10,0);
        ctx.lineTo(-7.5,5);
        ctx.lineTo(-5,0);
        ctx.lineTo(-7.5,-5);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
    ctx.fillStyle = 'white';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, canvas.width - 120, 30);

    // ---------- Game Over ----------
    if(gameOver){
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0,0,canvas.width,canvas.height);

        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.font = '50px sans-serif';
        ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 50);
        ctx.font = '30px sans-serif';
        ctx.fillText(`Score: ${score}`, canvas.width/2, canvas.height/2);
        ctx.font = '20px sans-serif';
        ctx.fillText(`Press R to Restart`, canvas.width/2, canvas.height/2 + 50);
    }
}

document.addEventListener('keydown', e=>{
    if(gameOver && e.key.toLowerCase() === 'r'){
        window.location.reload();
    }
});

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
