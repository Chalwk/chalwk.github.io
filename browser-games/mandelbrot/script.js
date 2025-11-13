const canvas = document.getElementById('mandelbrot');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth * 0.8;
canvas.height = window.innerHeight * 0.8;

let width = canvas.width;
let height = canvas.height;

// Mandelbrot settings
let minRe = -2.5, maxRe = 1;
let minIm = -1, maxIm = 1;
const maxIter = 150;

// Convert pixel to complex number
function pixelToComplex(x, y) {
    const real = minRe + (x / width) * (maxRe - minRe);
    const imag = minIm + (y / height) * (maxIm - minIm);
    return { real, imag };
}

// Compute Mandelbrot
function mandelbrot(cRe, cIm) {
    let zRe = 0, zIm = 0;
    let n = 0;

    while (n < maxIter) {
        let zRe2 = zRe * zRe - zIm * zIm + cRe;
        let zIm2 = 2 * zRe * zIm + cIm;
        zRe = zRe2;
        zIm = zIm2;

        if (zRe * zRe + zIm * zIm > 4) break;
        n++;
    }
    return n;
}

// Draw Mandelbrot
function draw() {
    const imgData = ctx.createImageData(width, height);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const { real, imag } = pixelToComplex(x, y);
            const m = mandelbrot(real, imag);

            const color = m === maxIter ? 0 : Math.floor(255 * m / maxIter);
            const idx = (y * width + x) * 4;
            imgData.data[idx] = color;       // R
            imgData.data[idx+1] = color;     // G
            imgData.data[idx+2] = 255 - color; // B
            imgData.data[idx+3] = 255;       // A
        }
    }
    ctx.putImageData(imgData, 0, 0);
}

draw();

// Zoom on click
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { real, imag } = pixelToComplex(x, y);

    const zoomFactor = 0.5;
    const reRange = (maxRe - minRe) * zoomFactor;
    const imRange = (maxIm - minIm) * zoomFactor;

    minRe = real - reRange / 2;
    maxRe = real + reRange / 2;
    minIm = imag - imRange / 2;
    maxIm = imag + imRange / 2;

    draw();
});

document.getElementById('backButton').addEventListener('click', () => {
    window.location.href = '../index.html';
});

