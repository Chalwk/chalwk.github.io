// Copyright (c) 2025-2026. Jericho Crosby (Chalwk)

class RunAwayGame {
    constructor() {
        this.gameArea = document.getElementById('game-area');
        this.player = document.getElementById('player');
        this.scoreElement = document.getElementById('score');
        this.startBtn = document.getElementById('start-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.browserBtn = document.getElementById('browser-btn');

        this.gameSpeed = 4;
        this.score = 0;
        this.isPlaying = false;
        this.isJumping = false;
        this.isCrouching = false;
        this.obstacles = [];
        this.gameLoop = null;
        this.obstacleInterval = null;
        this.lastFrameTime = 0;
        this.obstacleSpawnTime = 1500;

        this.obstacleTypes = ['🌵', '🍄', '🌱', '🌳', '🌴', '🌲', '🎋', '🌿', '🌾'];

        this.init();
    }

    init() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.resetBtn.addEventListener('click', () => this.resetGame());

        this.browserBtn.addEventListener('click', () => {
            window.location.href = '../index.html';
        });

        document.addEventListener('keydown', (e) => {
            if (!this.isPlaying) return;

            if ((e.code === 'Space' || e.code === 'ArrowUp') && !this.isJumping && !this.isCrouching) {
                e.preventDefault();
                this.jump();
            }

            if (e.code === 'ArrowDown' && !this.isJumping) {
                e.preventDefault();
                this.crouch();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (!this.isPlaying) return;

            if (e.code === 'ArrowDown' && this.isCrouching) {
                e.preventDefault();
                this.standUp();
            }
        });

        // Touch support for mobile
        this.gameArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.isPlaying && !this.isJumping && !this.isCrouching) this.jump();
        });
    }

    startGame() {
        if (this.isPlaying) return;

        this.isPlaying = true;
        this.score = 0;
        this.gameSpeed = 4;
        this.obstacleSpawnTime = 1500;
        this.updateScore();

        this.startBtn.disabled = true;
        this.startBtn.textContent = 'Playing...';

        this.obstacles.forEach(obs => obs.remove());
        this.obstacles = [];

        this.lastFrameTime = performance.now();
        this.gameLoop = requestAnimationFrame((timestamp) => this.update(timestamp));
        this.obstacleInterval = setInterval(() => this.createObstacle(), this.obstacleSpawnTime);
    }

    resetGame() {
        this.isPlaying = false;
        this.isCrouching = false;
        this.player.classList.remove('crouching');
        this.startBtn.disabled = false;
        this.startBtn.textContent = 'Start Game';

        cancelAnimationFrame(this.gameLoop);
        clearInterval(this.obstacleInterval);

        this.obstacles.forEach(obs => obs.remove());
        this.obstacles = [];

        this.player.style.bottom = '56px';
        this.player.classList.remove('jumping');

        const gameOverMsg = document.querySelector('.game-over');
        if (gameOverMsg) gameOverMsg.remove();
    }

    update(timestamp) {
        if (!this.isPlaying) return;

        // Calculate delta time for consistent movement regardless of frame rate
        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;

        this.updateScore();
        this.moveObstacles(deltaTime);
        this.checkCollisions();

        // Gradually increase difficulty
        if (this.score % 100 === 0 && this.score > 0) {
            this.gameSpeed = 1.5 + Math.floor(this.score / 100) * 0.3;
            // Increase obstacle spawn rate
            if (this.obstacleSpawnTime > 800) {
                this.obstacleSpawnTime -= 50;
                clearInterval(this.obstacleInterval);
                this.obstacleInterval = setInterval(() => this.createObstacle(), this.obstacleSpawnTime);
            }
        }

        this.gameLoop = requestAnimationFrame((ts) => this.update(ts));
    }

    jump() {
        if (this.isJumping) return;

        this.isJumping = true;
        this.player.classList.add('jumping');

        setTimeout(() => {
            this.isJumping = false;
            this.player.classList.remove('jumping');
        }, 500);
    }

    crouch() {
        if (this.isCrouching || this.isJumping) return;

        this.isCrouching = true;
        this.player.classList.add('crouching');
    }

    standUp() {
        if (!this.isCrouching) return;

        this.isCrouching = false;
        this.player.classList.remove('crouching');
    }

    createObstacle() {
        if (!this.isPlaying) return;

        const obstacle = document.createElement('div');
        obstacle.className = 'obstacle obstacle-moving';

        const randomType = this.obstacleTypes[Math.floor(Math.random() * this.obstacleTypes.length)];
        obstacle.textContent = randomType;

        const size = 2 + Math.random() * 0.5;
        obstacle.style.fontSize = `${size}rem`;

        const isFlying = Math.random() > 0.7;
        if (isFlying) {
            obstacle.classList.add('flying');
            obstacle.style.bottom = `${120 + Math.random() * 60}px`;
        } else {
            obstacle.style.bottom = '56px';
        }

        // Set initial position off-screen to the right
        obstacle.style.right = '-50px';

        this.gameArea.appendChild(obstacle);
        this.obstacles.push(obstacle);

        // Clean up obstacles that are off-screen
        setTimeout(() => {
            if (obstacle.parentNode) {
                obstacle.remove();
                this.obstacles = this.obstacles.filter(obs => obs !== obstacle);
            }
        }, 6000);
    }

    moveObstacles(deltaTime) {
        // Use deltaTime for consistent movement regardless of frame rate
        const movement = this.gameSpeed * (deltaTime / 16); // Normalize to 60fps

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            const currentRight = parseFloat(obstacle.style.right) || -50;
            obstacle.style.right = `${currentRight + movement}px`;

            // Remove obstacles that are far off-screen
            if (currentRight > window.innerWidth + 100) {
                obstacle.remove();
                this.obstacles.splice(i, 1);
            }
        }
    }

    checkCollisions() {
        const playerRect = this.player.getBoundingClientRect();

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            const obstacleRect = obstacle.getBoundingClientRect();

            // Simple collision detection with adjusted hitboxes
            if (playerRect.right - 15 > obstacleRect.left + 10 &&
            playerRect.left + 15 < obstacleRect.right - 10 &&
            playerRect.bottom - (this.isCrouching ? 20 : 10) > obstacleRect.top + 10 &&
            playerRect.top + (this.isCrouching ? 20 : 10) < obstacleRect.bottom - 10) {

                this.gameOver();
                return;
            }
        }
    }

    updateScore() {
        if (this.isPlaying) {
            this.score += 1;
            this.scoreElement.textContent = `Score: ${this.score}`;
        }
    }

    gameOver() {
        this.isPlaying = false;
        cancelAnimationFrame(this.gameLoop);
        clearInterval(this.obstacleInterval);

        this.startBtn.disabled = false;
        this.startBtn.textContent = 'Start Game';

        const gameOverMsg = document.createElement('div');
        gameOverMsg.className = 'game-over';
        gameOverMsg.innerHTML = `
            <h2>Game Over!</h2>
            <p>Final Score: ${this.score}</p>
            <button onclick="this.parentElement.remove()">OK</button>
        `;

        this.gameArea.appendChild(gameOverMsg);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new RunAwayGame();
});