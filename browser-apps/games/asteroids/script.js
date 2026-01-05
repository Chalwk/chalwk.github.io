/*
Copyright (c) 2024-2026. Jericho Crosby (Chalwk)

Asteroids - JavaScript
*/

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');
const livesDisplay = document.getElementById('livesDisplay');
const restartBtn = document.getElementById('restartBtn');

const rotateLeftBtn = document.getElementById('rotateLeftBtn');
const rotateRightBtn = document.getElementById('rotateRightBtn');
const thrustBtn = document.getElementById('thrustBtn');
const shootBtn = document.getElementById('shootBtn');
const mobileRestartBtn = document.getElementById('mobileRestartBtn');
const mobileControls = document.getElementById('mobileControls');

let score = 0;
let lives = 3;
let gameOver = false;
let stars = [];

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

function resizeCanvas() {
    const isMobile = window.innerWidth <= 768;
    const container = canvas.parentElement;

    if (isMobile) {
        const containerWidth = container.clientWidth;
        canvas.width = containerWidth;
        canvas.height = Math.min(containerWidth * 0.75, window.innerHeight * 0.5);
    } else {
        const maxWidth = Math.min(800, window.innerWidth - 60);
        canvas.width = maxWidth;
        canvas.height = maxWidth * 0.75;
    }

    stars.length = 0;
    for(let i = 0; i < 150; i++) {
        stars.push(new Star(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            Math.random() * 2 + 1,
            Math.random() * 1 + 0.2
        ));
    }
}

function initializeStars() {
    for(let i = 0; i < 150; i++) {
        stars.push(new Star(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            Math.random() * 2 + 1,
            Math.random() * 1 + 0.2
        ));
    }
}

const keys = {};

document.addEventListener('keydown', e => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
    }
    keys[e.code] = true;
});

document.addEventListener('keyup', e => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
    }
    keys[e.code] = false;
});

function setupMobileControls() {
    rotateLeftBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys['ArrowLeft'] = true;
        rotateLeftBtn.classList.add('active');
    });

    rotateLeftBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys['ArrowLeft'] = false;
        rotateLeftBtn.classList.remove('active');
    });

    rotateRightBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys['ArrowRight'] = true;
        rotateRightBtn.classList.add('active');
    });

    rotateRightBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys['ArrowRight'] = false;
        rotateRightBtn.classList.remove('active');
    });

    thrustBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys['ArrowUp'] = true;
        thrustBtn.classList.add('active');
    });

    thrustBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys['ArrowUp'] = false;
        thrustBtn.classList.remove('active');
    });

    shootBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys['Space'] = true;
        shootBtn.classList.add('active');

        if (player.canShoot) {
            shootBullet();
            player.canShoot = false;
            setTimeout(() => {
                player.canShoot = true;
                if (keys['Space']) {
                    shootBullet();
                    player.canShoot = false;
                    setTimeout(() => player.canShoot = true, 200);
                }
            }, 200);
        }
    });

    shootBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys['Space'] = false;
        shootBtn.classList.remove('active');
    });

    mobileRestartBtn.addEventListener('click', restartGame);
    mobileRestartBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        restartGame();
        mobileRestartBtn.classList.add('active');
        setTimeout(() => mobileRestartBtn.classList.remove('active'), 200);
    });

    rotateLeftBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        keys['ArrowLeft'] = true;
    });

    rotateLeftBtn.addEventListener('mouseup', () => {
        keys['ArrowLeft'] = false;
    });

    rotateRightBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        keys['ArrowRight'] = true;
    });

    rotateRightBtn.addEventListener('mouseup', () => {
        keys['ArrowRight'] = false;
    });

    thrustBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        keys['ArrowUp'] = true;
    });

    thrustBtn.addEventListener('mouseup', () => {
        keys['ArrowUp'] = false;
    });

    shootBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        keys['Space'] = true;
    });

    shootBtn.addEventListener('mouseup', () => {
        keys['Space'] = false;
    });
}

const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
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
    ctx.moveTo(20 * size, 0);
    ctx.lineTo(-15 * size, 10 * size);
    ctx.lineTo(-10 * size, 0);
    ctx.lineTo(-15 * size, -10 * size);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}

class Asteroid {
    constructor(x, y, radius, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.velocity = velocity;
        this.vertices = [];
        for(let i = 0; i < Math.floor(Math.random() * 5) + 5; i++) {
            this.vertices.push(Math.random() * radius * 0.6 + radius * 0.4);
        }
        this.angle = 0;
    }
    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        if(this.x < 0) this.x = canvas.width;
        if(this.x > canvas.width) this.x = 0;
        if(this.y < 0) this.y = canvas.height;
        if(this.y > canvas.height) this.y = 0;
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.strokeStyle = 'white';
        ctx.beginPath();
        for(let i = 0; i < this.vertices.length; i++) {
            const angle = (Math.PI * 2 / this.vertices.length) * i;
            const r = this.vertices[i];
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if(i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
}

const asteroids = [];
function spawnAsteroids(num = 6) {
    for(let i = 0; i < num; i++) {
        asteroids.push(new Asteroid(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            Math.random() * 30 + 20,
            {
                x: (Math.random() - 0.5) * 2,
                y: (Math.random() - 0.5) * 2
            }
        ));
    }
}

function shootBullet() {
    player.bullets.push({
        x: player.x + Math.cos(player.angle) * 20,
        y: player.y + Math.sin(player.angle) * 20,
        angle: player.angle,
        speed: 5
    });
}

class Enemy {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = -50;
        this.radius = 20;
        this.speed = 1 + Math.random();
        this.bullets = [];
        this.shootCooldown = 0;
    }
    update() {
        this.y += this.speed;
        if(this.y > canvas.height + 50) {
            this.x = Math.random() * canvas.width;
            this.y = -50;
        }
        this.shootCooldown--;
        if(this.shootCooldown <= 0) {
            this.bullets.push({
                x: this.x,
                y: this.y,
                angle: Math.atan2(player.y - this.y, player.x - this.x),
                speed: 3
            });
            this.shootCooldown = 100;
        }
        this.bullets.forEach((b, i) => {
            b.x += Math.cos(b.angle) * b.speed;
            b.y += Math.sin(b.angle) * b.speed;
            if(b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
                this.bullets.splice(i, 1);
            }
        });
    }
    draw() {
        ctx.strokeStyle = 'red';
        ctx.beginPath();
        ctx.rect(this.x - 15, this.y - 10, 30, 20);
        ctx.stroke();
        this.bullets.forEach(b => {
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

let enemy = null;
let enemySpawnTimer = Math.floor(Math.random() * 500) + 500;

function wrap(obj) {
    if(obj.x < 0) obj.x = canvas.width;
    if(obj.x > canvas.width) obj.x = 0;
    if(obj.y < 0) obj.y = canvas.height;
    if(obj.y > canvas.height) obj.y = 0;
}

function update() {
    if(gameOver) return;

    if(keys['ArrowLeft']) player.angle -= 0.07;
    if(keys['ArrowRight']) player.angle += 0.07;
    if(keys['ArrowUp']) {
        player.speed = 5;
        player.x += Math.cos(player.angle) * player.speed;
        player.y += Math.sin(player.angle) * player.speed;
    } else {
        player.speed = 0;
    }

    wrap(player);

    if(keys['Space']) {
        if(player.canShoot) {
            shootBullet();
            player.canShoot = false;
            setTimeout(() => player.canShoot = true, 200);
        }
    }

    player.bullets.forEach((b, i) => {
        b.x += Math.cos(b.angle) * b.speed;
        b.y += Math.sin(b.angle) * b.speed;
        if(b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
            player.bullets.splice(i, 1);
        }
    });

    asteroids.forEach(a => a.update());

    if(!enemy) {
        enemySpawnTimer--;
        if(enemySpawnTimer <= 0) {
            enemy = new Enemy();
            enemySpawnTimer = Math.floor(Math.random() * 1000) + 800;
        }
    }

    if(enemy) {
        enemy.update();

        enemy.bullets.forEach((b, i) => {
            const dx = b.x - player.x;
            const dy = b.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if(dist < player.radius) {
                enemy.bullets.splice(i, 1);
                lives--;
                livesDisplay.textContent = lives;
                if(lives <= 0) {
                    gameOver = true;
                    restartBtn.style.display = 'flex';
                }
            }
        });

        if(enemy.y > canvas.height + 50) {
            enemy = null;
        }
    }

    player.bullets.forEach((b, i) => {
        asteroids.forEach((a, j) => {
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if(dist < a.radius) {
                player.bullets.splice(i, 1);
                asteroids.splice(j, 1);
                score += 10;
                scoreDisplay.textContent = score;
                if(a.radius > 15) {
                    asteroids.push(new Asteroid(a.x, a.y, a.radius / 2, {
                        x: (Math.random() - 0.5) * 2,
                        y: (Math.random() - 0.5) * 2
                    }));
                    asteroids.push(new Asteroid(a.x, a.y, a.radius / 2, {
                        x: (Math.random() - 0.5) * 2,
                        y: (Math.random() - 0.5) * 2
                    }));
                }
            }
        });
    });

    asteroids.forEach((a, i) => {
        const dx = a.x - player.x;
        const dy = a.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if(dist < a.radius + player.radius) {
            lives--;
            livesDisplay.textContent = lives;
            if(lives <= 0) {
                gameOver = true;
                restartBtn.style.display = 'flex';
            }
            asteroids.splice(i, 1);
            score += 10;
            scoreDisplay.textContent = score;
            if(a.radius > 15) {
                asteroids.push(new Asteroid(a.x, a.y, a.radius / 2, {
                    x: (Math.random() - 0.5) * 2,
                    y: (Math.random() - 0.5) * 2
                }));
                asteroids.push(new Asteroid(a.x, a.y, a.radius / 2, {
                    x: (Math.random() - 0.5) * 2,
                    y: (Math.random() - 0.5) * 2
                }));
            }
        }
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    stars.forEach(s => {
        s.update();
        s.draw();
    });

    asteroids.forEach(a => a.draw());

    drawPlayer(player.x, player.y);

    player.bullets.forEach(b => {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });

    if(enemy) enemy.draw();

    if(gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.font = 'min(50px, 8vw) sans-serif';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
        ctx.font = 'min(30px, 5vw) sans-serif';
        ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2);
        ctx.font = 'min(20px, 4vw) sans-serif';
        ctx.fillText(`Press R to Restart`, canvas.width / 2, canvas.height / 2 + 50);

        if (window.innerWidth <= 768) {
            mobileRestartBtn.style.display = 'block';
        }
    } else {
        if (window.innerWidth <= 768) {
            mobileRestartBtn.style.display = 'block';
        }
    }
}

document.addEventListener('keydown', e => {
    if(gameOver && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        restartGame();
    }
});

restartBtn.addEventListener('click', restartGame);

function restartGame() {
    score = 0;
    lives = 3;
    gameOver = false;
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.angle = 0;
    player.bullets = [];
    asteroids.length = 0;
    enemy = null;
    scoreDisplay.textContent = score;
    livesDisplay.textContent = lives;
    restartBtn.style.display = 'none';
    spawnAsteroids();
    if (window.innerWidth <= 768) {
        mobileControls.style.display = 'flex';
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function initializeGame() {
    const container = canvas.parentElement;
    const maxWidth = Math.min(800, window.innerWidth - 60);
    canvas.width = maxWidth;
    canvas.height = maxWidth * 0.75;

    initializeStars();
    setupMobileControls();
    spawnAsteroids();
    gameLoop();
}

window.addEventListener('load', () => {
    canvas.focus();
    initializeGame();
    if (window.innerWidth <= 768) {
        mobileControls.style.display = 'flex';
    }
});

canvas.addEventListener('click', () => {
    canvas.focus();
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    canvas.focus();
});

canvas.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
    }
});

document.querySelectorAll('.control-btn').forEach(btn => {
    btn.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
});

window.addEventListener('resize', () => {
    resizeCanvas();
    if (!gameOver) {
        player.x = canvas.width / 2;
        player.y = canvas.height / 2;
    }
});