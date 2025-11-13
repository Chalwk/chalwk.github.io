class RunAwayGame {
    constructor() {
        this.gameArea = document.getElementById('game-area');
        this.player = document.getElementById('player');
        this.scoreElement = document.getElementById('score');
        this.startBtn = document.getElementById('start-btn');
        this.resetBtn = document.getElementById('reset-btn');
        
        this.gameSpeed = 2;
        this.score = 0;
        this.isPlaying = false;
        this.isJumping = false;
        this.obstacles = [];
        this.gameLoop = null;
        this.obstacleInterval = null;
        
        this.obstacleTypes = ['💣', '🌵', '🪨', '🔥', '⚡'];
        
        this.init();
    }
    
    init() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        
        document.addEventListener('keydown', (e) => {
            if ((e.code === 'Space' || e.code === 'ArrowUp') && this.isPlaying) {
                e.preventDefault();
                this.jump();
            }
        });
        
        // Touch support for mobile
        this.gameArea.addEventListener('touchstart', () => {
            if (this.isPlaying) this.jump();
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
        
        // Clear any existing obstacles
        this.obstacles.forEach(obs => obs.remove());
        this.obstacles = [];
        
        // Start game loop
        this.gameLoop = requestAnimationFrame(() => this.update());
        
        // Start generating obstacles
        this.obstacleInterval = setInterval(() => this.createObstacle(), 1500);
    }
    
    resetGame() {
        this.isPlaying = false;
        this.startBtn.disabled = false;
        this.startBtn.textContent = 'Start Game';
        
        cancelAnimationFrame(this.gameLoop);
        clearInterval(this.obstacleInterval);
        
        // Remove all obstacles
        this.obstacles.forEach(obs => obs.remove());
        this.obstacles = [];
        
        // Reset player position
        this.player.style.bottom = '60px';
        this.player.classList.remove('jumping');
        
        // Remove game over message if exists
        const gameOverMsg = document.querySelector('.game-over');
        if (gameOverMsg) gameOverMsg.remove();
    }
    
    update() {
        if (!this.isPlaying) return;
        
        this.updateScore();
        this.moveObstacles();
        this.checkCollisions();
        
        // Increase game speed gradually
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
    
    createObstacle() {
        if (!this.isPlaying) return;
        
        const obstacle = document.createElement('div');
        obstacle.className = 'obstacle obstacle-moving';
        
        // Random obstacle type
        const randomType = this.obstacleTypes[Math.floor(Math.random() * this.obstacleTypes.length)];
        obstacle.textContent = randomType;
        
        // Random size variation
        const size = 2 + Math.random() * 0.5;
        obstacle.style.fontSize = `${size}rem`;
        
        // Random vertical position (some obstacles can be flying)
        const isFlying = Math.random() > 0.7;
        if (isFlying) {
            obstacle.style.bottom = `${100 + Math.random() * 80}px`;
        } else {
            obstacle.style.bottom = '60px';
        }
        
        this.gameArea.appendChild(obstacle);
        this.obstacles.push(obstacle);
        
        // Remove obstacle when it goes off screen
        setTimeout(() => {
            if (obstacle.parentNode) {
                obstacle.remove();
                this.obstacles = this.obstacles.filter(obs => obs !== obstacle);
            }
        }, 3000);
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
            
            // Simple collision detection
            if (playerRect.right > obstacleRect.left && 
                playerRect.left < obstacleRect.right &&
                playerRect.bottom > obstacleRect.top &&
                playerRect.top < obstacleRect.bottom) {
                
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
        
        // Create game over message
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

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new RunAwayGame();
});