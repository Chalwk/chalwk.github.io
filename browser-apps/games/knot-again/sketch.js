/*
Copyright (c) 2024-2026. Jericho Crosby (Chalwk)

Knot Again - JavaScript (P5.JS)
*/

let canvas;
let nodes = [];
let edges = [];
let draggedNode = null;
let offsetX = 0, offsetY = 0;
let level = 1;
let gameActive = true;
let startTime;
let moveCount = 0;
let winAnimation = false;
let winParticles = [];
let pulse = 0;
let complexity = 'medium';

const NODE_RADIUS = 16;
const NODE_HOVER_RADIUS = 20;
const EDGE_WIDTH = 3;
const CROSSING_WIDTH = 6;
const MIN_NODES = 6;
const MAX_NODES = 14;
const MIN_EDGES = 8;
const MAX_EDGES = 20;

const COLORS = {
    background: [20, 25, 35],
    node: [110, 168, 254],
    nodeHover: [255, 255, 255],
    edge: [255, 255, 255, 180],
    edgeSolved: [126, 231, 199],
    crossing: [255, 107, 107],
    text: [240, 240, 255],
    highlight: [255, 217, 122],
    grid: [40, 45, 55]
};

let levelLabel, edgeCountEl, crossCountEl, bestScoreEl;
let resetBtn, shuffleBtn, nextBtn;
let winOverlay, winNext, winShuffle;
let winLevelEl, winTimeEl, winMovesEl;
let hudCrossCount, hudMoves, hudTime;
let complexitySelect;

function setup() {
    const canvasContainer = document.getElementById('p5-canvas');
    const containerWidth = canvasContainer.offsetWidth;
    const containerHeight = Math.min(canvasContainer.offsetHeight, 600);

    canvas = createCanvas(containerWidth, containerHeight);
    canvas.parent('p5-canvas');
    canvas.style('border-radius', '8px');
    canvas.style('box-shadow', '0 8px 32px rgba(0, 0, 0, 0.4)');

    canvas.elt.addEventListener('touchstart', function(e) {
        if (draggedNode) {
            e.preventDefault();
        }
    }, { passive: false });

    canvas.elt.addEventListener('touchmove', function(e) {
        if (draggedNode) {
            e.preventDefault();
        }
    }, { passive: false });

    levelLabel = document.getElementById('levelLabel');
    edgeCountEl = document.getElementById('edgeCount');
    crossCountEl = document.getElementById('crossCount');
    bestScoreEl = document.getElementById('bestScore');
    resetBtn = document.getElementById('resetBtn');
    shuffleBtn = document.getElementById('shuffleBtn');
    nextBtn = document.getElementById('nextBtn');
    winOverlay = document.getElementById('winOverlay');
    winNext = document.getElementById('winNext');
    winShuffle = document.getElementById('winShuffle');
    winLevelEl = document.getElementById('winLevel');
    winTimeEl = document.getElementById('winTime');
    winMovesEl = document.getElementById('winMoves');
    hudCrossCount = document.getElementById('hudCrossCount');
    hudMoves = document.getElementById('hudMoves');
    hudTime = document.getElementById('hudTime');
    complexitySelect = document.getElementById('complexity');

    winOverlay.classList.add('hidden');

    resetBtn.addEventListener('click', resetLevel);
    resetBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        resetLevel();
    }, { passive: false });

    shuffleBtn.addEventListener('click', shuffleNodes);
    shuffleBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        shuffleNodes();
    }, { passive: false });

    nextBtn.addEventListener('click', nextLevel);
    nextBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        nextLevel();
    }, { passive: false });

    winNext.addEventListener('click', nextLevel);
    winNext.addEventListener('touchstart', function(e) {
        e.preventDefault();
        nextLevel();
    }, { passive: false });

    winShuffle.addEventListener('click', () => {
        winOverlay.classList.add('hidden');
        shuffleNodes();
    });
    winShuffle.addEventListener('touchstart', function(e) {
        e.preventDefault();
        winOverlay.classList.add('hidden');
        shuffleNodes();
    }, { passive: false });

    complexitySelect.value = complexity;
    complexitySelect.addEventListener('change', function() {
        complexity = this.value;
        resetGame();
    });

    document.addEventListener('keydown', handleKeyPress);
    resetGame();

    gameActive = true;

    document.addEventListener('touchstart', function(e) {
        const hamburger = document.querySelector('.hamburger');
        const mobileNav = document.querySelector('.nav-mobile');

        if (!e.target.closest('.hamburger') && !e.target.closest('.nav-mobile') &&
        mobileNav && mobileNav.classList.contains('active')) {
            hamburger.classList.remove('active');
            mobileNav.classList.remove('active');
        }
    });
}

function windowResized() {
    const canvasContainer = document.getElementById('p5-canvas');
    const containerWidth = canvasContainer.offsetWidth;
    const containerHeight = Math.min(canvasContainer.offsetHeight, 600);

    resizeCanvas(containerWidth, containerHeight);
}

function draw() {
    pulse += 0.02;
    background(COLORS.background);

    drawGrid();
    drawEdges();
    drawNodes();
    drawParticles();
    updateHUD();
}

function drawGrid() {
    push();
    stroke(COLORS.grid);
    strokeWeight(1);
    noFill();

    for (let x = 0; x <= width; x += 50) {
        line(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += 50) {
        line(0, y, width, y);
    }

    fill(COLORS.grid);
    noStroke();
    ellipse(width/2, height/2, 4, 4);

    pop();
}

function drawEdges() {
    push();
    noFill();

    for (let edge of edges) {
        const nodeA = nodes[edge.a];
        const nodeB = nodes[edge.b];

        if (!nodeA || !nodeB) continue;

        let hasCrossing = false;
        for (let otherEdge of edges) {
            if (otherEdge === edge) continue;
            const nodeC = nodes[otherEdge.a];
            const nodeD = nodes[otherEdge.b];

            if (segmentsIntersect(
                nodeA, nodeB,
                nodeC, nodeD
            )) {
                hasCrossing = true;
                break;
            }
        }

        if (hasCrossing) {
            stroke(COLORS.crossing);
            strokeWeight(CROSSING_WIDTH);
            const pulseWidth = CROSSING_WIDTH + sin(pulse * 3) * 2;
            strokeWeight(pulseWidth);
        } else {
            stroke(COLORS.edgeSolved[0], COLORS.edgeSolved[1], COLORS.edgeSolved[2], 200);
            strokeWeight(EDGE_WIDTH);
        }

        if (!hasCrossing) {
            drawingContext.shadowBlur = 15;
            drawingContext.shadowColor = `rgba(${COLORS.edgeSolved[0]}, ${COLORS.edgeSolved[1]}, ${COLORS.edgeSolved[2]}, 0.5)`;
        } else {
            drawingContext.shadowBlur = 0;
        }

        line(nodeA.x, nodeA.y, nodeB.x, nodeB.y);

        drawingContext.shadowBlur = 0;
    }
    pop();
}

function drawNodes() {
    push();
    noStroke();

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        const d = dist(mouseX, mouseY, node.x, node.y);
        const isHovered = d < NODE_HOVER_RADIUS && !draggedNode && gameActive;

        fill(COLORS.node[0], COLORS.node[1], COLORS.node[2], 200);
        const radius = isHovered ? NODE_HOVER_RADIUS : NODE_RADIUS;

        drawingContext.shadowBlur = isHovered ? 20 : 10;
        drawingContext.shadowColor = `rgba(${COLORS.node[0]}, ${COLORS.node[1]}, ${COLORS.node[2]}, ${isHovered ? 0.6 : 0.3})`;

        ellipse(node.x, node.y, radius * 2, radius * 2);

        drawingContext.shadowBlur = 0;
        const innerRadius = radius * 0.5;
        fill(255, 255, 255, 220);
        ellipse(node.x, node.y, innerRadius * 2, innerRadius * 2);

        fill(COLORS.text);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(12);
        textStyle(BOLD);
        text(i + 1, node.x, node.y);

        if (node.originalX && node.originalY) {
            stroke(COLORS.node[0], COLORS.node[1], COLORS.node[2], 50);
            strokeWeight(1);
            line(node.x, node.y, node.originalX, node.originalY);
            fill(COLORS.node[0], COLORS.node[1], COLORS.node[2], 30);
            ellipse(node.originalX, node.originalY, 8, 8);
        }
    }

    pop();
}

function drawParticles() {
    for (let i = winParticles.length - 1; i >= 0; i--) {
        const p = winParticles[i];
        p.update();
        p.display();

        if (p.isFinished()) {
            winParticles.splice(i, 1);
        }
    }
}

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = random(-3, 3);
        this.vy = random(-3, 3);
        this.alpha = 255;
        this.size = random(5, 15);
        this.color = color(random(200, 255), random(200, 255), random(200, 255));
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1;
        this.alpha -= 3;
        this.size *= 0.98;
    }

    display() {
        push();
        fill(red(this.color), green(this.color), blue(this.color), this.alpha);
        noStroke();
        ellipse(this.x, this.y, this.size, this.size);
        pop();
    }

    isFinished() {
        return this.alpha <= 0;
    }
}

function mousePressed() {
    if (!gameActive) return false;

    for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        const d = dist(mouseX, mouseY, node.x, node.y);

        if (d < NODE_RADIUS) {
            draggedNode = node;
            offsetX = node.x - mouseX;
            offsetY = node.y - mouseY;

            if (mouseButton === RIGHT) {
                node.x = node.originalX;
                node.y = node.originalY;
                draggedNode = null;
                moveCount++;
                checkWinCondition();
                return false;
            }

            return false;
        }
    }

    return false;
}

function mouseDragged() {
    if (draggedNode && gameActive) {
        draggedNode.x = constrain(mouseX + offsetX, NODE_RADIUS, width - NODE_RADIUS);
        draggedNode.y = constrain(mouseY + offsetY, NODE_RADIUS, height - NODE_RADIUS);
        return false;
    }
}

function mouseReleased() {
    if (draggedNode) {
        draggedNode = null;
        moveCount++;
        checkWinCondition();
    }
}

function touchStarted() {
    const handled = mousePressed();
    if (handled) {
        return false;
    }
    return true;
}

function touchMoved() {
    if (draggedNode) {
        mouseDragged();
        return false;
    }
    return true;
}

function touchEnded() {
    return mouseReleased();
}

function checkWinCondition() {
    let crossingCount = 0;

    for (let i = 0; i < edges.length; i++) {
        const edgeA = edges[i];
        const nodeA1 = nodes[edgeA.a];
        const nodeA2 = nodes[edgeA.b];

        for (let j = i + 1; j < edges.length; j++) {
            const edgeB = edges[j];
            const nodeB1 = nodes[edgeB.a];
            const nodeB2 = nodes[edgeB.b];

            if (edgeA.a === edgeB.a || edgeA.a === edgeB.b ||
            edgeA.b === edgeB.a || edgeA.b === edgeB.b) {
                continue;
            }

            if (segmentsIntersect(
                nodeA1, nodeA2,
                nodeB1, nodeB2
            )) {
                crossingCount++;
                break;
            }
        }
    }

    crossCountEl.textContent = crossingCount;
    hudCrossCount.textContent = crossingCount;

    if (crossingCount === 0 && nodes.length > 0) {
        winGame();
    }
}

function winGame() {
    if (!gameActive) return;

    gameActive = false;
    winAnimation = true;

    for (let node of nodes) {
        for (let i = 0; i < 5; i++) {
            winParticles.push(new Particle(node.x, node.y));
        }
    }

    const elapsedTime = Math.floor((millis() - startTime) / 1000);
    winLevelEl.textContent = level;
    winTimeEl.textContent = `${elapsedTime}s`;
    winMovesEl.textContent = moveCount;

    winOverlay.classList.remove('hidden');

    const bestScore = parseInt(localStorage.getItem('knotBestScore') || '0');
    if (level > bestScore) {
        localStorage.setItem('knotBestScore', level.toString());
        bestScoreEl.textContent = level;
    }
}

function generateLevel() {
    nodes = [];
    edges = [];
    winParticles = [];

    let nodeCount;
    switch(complexity) {
        case 'easy':
            nodeCount = MIN_NODES + Math.min(level, 3);
            break;
        case 'medium':
            nodeCount = MIN_NODES + Math.min(level * 2, 8);
            break;
        case 'hard':
            nodeCount = MIN_NODES + Math.min(level * 3, 12);
            break;
        case 'expert':
            nodeCount = MIN_NODES + Math.min(level * 4, MAX_NODES);
            break;
    }

    nodeCount = constrain(nodeCount, MIN_NODES, MAX_NODES);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = min(width, height) * 0.35;

    for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * TWO_PI;
        const x = centerX + cos(angle) * radius;
        const y = centerY + sin(angle) * radius;

        const jitter = radius * 0.1;
        const jitterX = random(-jitter, jitter);
        const jitterY = random(-jitter, jitter);

        nodes.push({
            x: x + jitterX,
            y: y + jitterY,
            originalX: x + jitterX,
            originalY: y + jitterY
        });
    }

    const targetEdges = constrain(MIN_EDGES + level * 2, MIN_EDGES, MAX_EDGES);

    for (let i = 0; i < nodeCount; i++) {
        edges.push({
            a: i,
            b: (i + 1) % nodeCount
        });
    }

    while (edges.length < targetEdges) {
        const a = floor(random(nodeCount));
        const b = floor(random(nodeCount));

        if (a === b) continue;

        const exists = edges.some(edge =>
        (edge.a === a && edge.b === b) ||
        (edge.a === b && edge.b === a)
        );

        if (!exists) {
            edges.push({ a, b });
        }
    }

    edgeCountEl.textContent = edges.length;
    levelLabel.textContent = level;
}

function segmentsIntersect(p1, p2, p3, p4) {
    function orientation(px, py, qx, qy, rx, ry) {
        const val = (qy - py) * (rx - qx) - (qx - px) * (ry - qy);
        if (val === 0) return 0;
        return (val > 0) ? 1 : 2;
    }

    function onSegment(px, py, qx, qy, rx, ry) {
        return (qx <= max(px, rx) && qx >= min(px, rx) &&
        qy <= max(py, ry) && qy >= min(py, ry));
    }

    const x1 = p1.x, y1 = p1.y;
    const x2 = p2.x, y2 = p2.y;
    const x3 = p3.x, y3 = p3.y;
    const x4 = p4.x, y4 = p4.y;

    const o1 = orientation(x1, y1, x2, y2, x3, y3);
    const o2 = orientation(x1, y1, x2, y2, x4, y4);
    const o3 = orientation(x3, y3, x4, y4, x1, y1);
    const o4 = orientation(x3, y3, x4, y4, x2, y2);

    if (o1 !== o2 && o3 !== o4) return true;

    if (o1 === 0 && onSegment(x1, y1, x3, y3, x2, y2)) return true;
    if (o2 === 0 && onSegment(x1, y1, x4, y4, x2, y2)) return true;
    if (o3 === 0 && onSegment(x3, y3, x1, y1, x4, y4)) return true;
    if (o4 === 0 && onSegment(x3, y3, x2, y2, x4, y4)) return true;

    return false;
}

function shuffleNodes() {
    if (!gameActive) {
        gameActive = true;
        winOverlay.classList.add('hidden');
    }

    const padding = NODE_RADIUS * 3;
    for (let node of nodes) {
        node.x = random(padding, width - padding);
        node.y = random(padding, height - padding);
    }

    moveCount++;
    checkWinCondition();
}

function resetLevel() {
    if (!gameActive) {
        gameActive = true;
        winOverlay.classList.add('hidden');
    }

    for (let node of nodes) {
        node.x = node.originalX;
        node.y = node.originalY;
    }

    moveCount++;
    checkWinCondition();
}

function nextLevel() {
    level++;
    winOverlay.classList.add('hidden');
    resetGame();
}

function updateHUD() {
    if (startTime && gameActive) {
        const elapsed = Math.floor((millis() - startTime) / 1000);
        hudTime.textContent = `${elapsed}s`;
    }
    hudMoves.textContent = moveCount;
}

function resetGame() {
    gameActive = true;
    winAnimation = false;
    winParticles = [];
    startTime = millis();
    moveCount = 0;
    generateLevel();
    checkWinCondition();
    winOverlay.classList.add('hidden');

    const bestScore = parseInt(localStorage.getItem('knotBestScore') || '0');
    bestScoreEl.textContent = bestScore;
}

function handleKeyPress(e) {
    switch(e.key.toLowerCase()) {
        case 'r':
            e.preventDefault();
            resetLevel();
            break;
        case 's':
            e.preventDefault();
            shuffleNodes();
            break;
        case 'n':
            e.preventDefault();
            nextLevel();
            break;
        case 'escape':
            winOverlay.classList.add('hidden');
            break;
    }
}

document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('#p5-canvas')) {
        e.preventDefault();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const mobileNav = document.querySelector('.nav-mobile');

    if (hamburger && mobileNav) {
        const mobileLinks = mobileNav.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                mobileNav.classList.remove('active');
            });
        });

        document.addEventListener('click', function(e) {
            if (!e.target.closest('.hamburger') && !e.target.closest('.nav-mobile') &&
            mobileNav.classList.contains('active')) {
                hamburger.classList.remove('active');
                mobileNav.classList.remove('active');
            }
        });
    }
});