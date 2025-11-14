class RunAwayGame {
    constructor() {
        this.gameArea = document.getElementById('game-area');
        this.player = document.getElementById('player');
        this.scoreElement = document.getElementById('score');
        this.startBtn = document.getElementById('start-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.browserBtn = document.getElementById('browser-btn');

        this.gameSpeed = 2;
        this.score = 0;
        this.isPlaying = false;
        this.isJumping = false;
        this.isCrouching = false;
        this.obstacles = [];
        this.gameLoop = null;
        this.obstacleInterval = null;

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
        this.gameArea.addEventListener('touchstart', () => {
            if (this.isPlaying && !this.isJumping && !this.isCrouching) this.jump();
        });
    }

    startGame() {
        if (this.isPlaying) return;

        this.isPlaying = true;
        this.score = 0;
        this.gameSpeed = 2;
        this.updateScore();

        this.startBtn.disabled = true;
        this.startBtn.textContent = 'Playing...';

        this.obstacles.forEach(obs => obs.remove());
        this.obstacles = [];

        this.gameLoop = requestAnimationFrame(() => this.update());
        this.obstacleInterval = setInterval(() => this.createObstacle(), 1500);
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

    update() {
        if (!this.isPlaying) return;

        this.updateScore();
        this.moveObstacles();
        this.checkCollisions();

        if (this.score % 100 === 0 && this.score > 0) {
            this.gameSpeed = 2 + Math.floor(this.score / 100) * 0.5;
        }

        this.gameLoop = requestAnimationFrame(() => this.update());
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

        this.gameArea.appendChild(obstacle);
        this.obstacles.push(obstacle);

        setTimeout(() => {
            if (obstacle.parentNode) {
                obstacle.remove();
                this.obstacles = this.obstacles.filter(obs => obs !== obstacle);
            }
        }, 5000);
    }

    moveObstacles() {
        this.obstacles.forEach(obstacle => {
            const currentRight = parseInt(obstacle.style.right) || -50;
            obstacle.style.right = `${currentRight + this.gameSpeed}px`;
        });
    }

    checkCollisions() {
        const playerRect = this.player.getBoundingClientRect();

        for (let obstacle of this.obstacles) {
            const obstacleRect = obstacle.getBoundingClientRect();

            const playerHitbox = {
                left: playerRect.left + 5,
                right: playerRect.right - 5,
                top: playerRect.top + (this.isCrouching ? 10 : 0),
                bottom: playerRect.bottom - (this.isCrouching ? 0 : 5)
            };

            const obstacleHitbox = {
                left: obstacleRect.left + 10,
                right: obstacleRect.right - 10,
                top: obstacleRect.top + 10,
                bottom: obstacleRect.bottom - 10
            };

            if (playerHitbox.right > obstacleHitbox.left &&
            playerHitbox.left < obstacleHitbox.right &&
            playerHitbox.bottom > obstacleHitbox.top &&
            playerHitbox.top < obstacleHitbox.bottom) {

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
