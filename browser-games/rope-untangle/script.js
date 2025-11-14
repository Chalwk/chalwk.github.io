// script.js
class RopeUntanglingGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.points = [];
        this.edges = [];
        this.draggingPoint = null;
        this.level = 1;
        this.isLevelComplete = false;

        this.initializeEventListeners();
        this.generateLevel();
        this.gameLoop();
    }

    initializeEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));

        // Touch events for mobile devices
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));

        document.getElementById('resetButton').addEventListener('click', () => {
            this.resetLevel();
        });

        document.getElementById('newLevelButton').addEventListener('click', () => {
            this.level++;
            document.getElementById('levelNumber').textContent = this.level;
            this.generateLevel();
        });
    }

    generateLevel() {
        this.points = [];
        this.edges = [];
        this.isLevelComplete = false;

        // Number of points increases with level
        const numPoints = Math.min(6 + Math.floor(this.level / 2), 12);

        // Create points in a circle initially
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(this.canvas.width, this.canvas.height) * 0.35;

        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * 2 * Math.PI;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            this.points.push({ x, y });
        }

        // Create edges - start with a cycle
        for (let i = 0; i < numPoints; i++) {
            this.edges.push([i, (i + 1) % numPoints]);
        }

        // Add some additional edges to make it more complex
        const extraEdges = Math.min(Math.floor(this.level / 2) + 2, numPoints / 2);
        for (let i = 0; i < extraEdges; i++) {
            let a, b;
            do {
                a = Math.floor(Math.random() * numPoints);
                b = Math.floor(Math.random() * numPoints);
            } while (a === b || this.edgeExists(a, b));

            this.edges.push([a, b]);
        }

        // Randomly perturb points to create intersections
        this.perturbPoints();

        // Check if level is already solved (unlikely but possible)
        if (this.checkLevelComplete()) {
            this.perturbPoints(); // Perturb again if already solved
        }
    }

    perturbPoints() {
        const perturbation = Math.min(this.canvas.width, this.canvas.height) * 0.3;

        this.points.forEach(point => {
            point.x += (Math.random() - 0.5) * perturbation;
            point.y += (Math.random() - 0.5) * perturbation;

            // Keep points within canvas bounds
            point.x = Math.max(20, Math.min(this.canvas.width - 20, point.x));
            point.y = Math.max(20, Math.min(this.canvas.height - 20, point.y));
        });
    }

    edgeExists(a, b) {
        return this.edges.some(edge =>
        (edge[0] === a && edge[1] === b) || (edge[0] === b && edge[1] === a)
        );
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.startDrag(x, y);
    }

    handleMouseMove(e) {
        if (this.draggingPoint) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.dragPoint(x, y);
        }
    }

    handleMouseUp() {
        this.draggingPoint = null;
    }

    handleTouchStart(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        this.startDrag(x, y);
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (this.draggingPoint) {
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            this.dragPoint(x, y);
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.draggingPoint = null;
    }

    startDrag(x, y) {
        // Find the closest point to the click
        let minDist = 30; // Maximum distance to consider a point
        let closestPoint = null;

        for (let i = 0; i < this.points.length; i++) {
            const point = this.points[i];
            const dist = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);

            if (dist < minDist) {
                minDist = dist;
                closestPoint = i;
            }
        }

        this.draggingPoint = closestPoint;
    }

    dragPoint(x, y) {
        if (this.draggingPoint !== null) {
            // Keep point within canvas bounds
            const point = this.points[this.draggingPoint];
            point.x = Math.max(20, Math.min(this.canvas.width - 20, x));
            point.y = Math.max(20, Math.min(this.canvas.height - 20, y));
        }
    }

    resetLevel() {
        this.generateLevel();
    }

    checkLevelComplete() {
        // Check if any edges intersect
        for (let i = 0; i < this.edges.length; i++) {
            for (let j = i + 1; j < this.edges.length; j++) {
                const edge1 = this.edges[i];
                const edge2 = this.edges[j];

                // Skip if edges share a vertex
                if (edge1[0] === edge2[0] || edge1[0] === edge2[1] ||
                edge1[1] === edge2[0] || edge1[1] === edge2[1]) {
                    continue;
                }

                const p1 = this.points[edge1[0]];
                const p2 = this.points[edge1[1]];
                const p3 = this.points[edge2[0]];
                const p4 = this.points[edge2[1]];

                if (this.linesIntersect(p1, p2, p3, p4)) {
                    return false;
                }
            }
        }

        return true;
    }

    linesIntersect(p1, p2, p3, p4) {
        // Calculate direction vectors
        const denominator = ((p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y));

        // Lines are parallel
        if (denominator === 0) return false;

        const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denominator;
        const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denominator;

        // Check if intersection point is within both line segments
        return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw edges
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = '#333';

        this.edges.forEach(edge => {
            const p1 = this.points[edge[0]];
            const p2 = this.points[edge[1]];

            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.stroke();
        });

        // Draw points
        this.points.forEach(point => {
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
            this.ctx.fillStyle = '#2196F3';
            this.ctx.fill();
            this.ctx.strokeStyle = '#0b7dda';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });

        // Draw dragging point with highlight
        if (this.draggingPoint !== null) {
            const point = this.points[this.draggingPoint];
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 15, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(33, 150, 243, 0.5)';
            this.ctx.fill();
        }
    }

    gameLoop() {
        this.draw();

        // Check if level is complete
        if (!this.isLevelComplete && this.checkLevelComplete()) {
            this.isLevelComplete = true;
            this.showLevelComplete();
        }

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    showLevelComplete() {
        const message = document.getElementById('message');
        message.classList.remove('hidden');

        setTimeout(() => {
            message.classList.add('hidden');
            this.level++;
            document.getElementById('levelNumber').textContent = this.level;
            this.generateLevel();
        }, 2000);
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new RopeUntanglingGame();
});