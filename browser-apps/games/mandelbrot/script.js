/*
Copyright (c) 2025-2026. Jericho Crosby (Chalwk)

Mandelbrot JavaScript
*/

(() => {
    // UI elements
    const canvas = document.getElementById('fractal');
    const ctx = canvas.getContext('2d', { alpha: false });

    const iterationsEl = document.getElementById('iterations');
    const expEl = document.getElementById('exponent');
    const hueEl = document.getElementById('hue');
    const satEl = document.getElementById('saturation');
    const lightEl = document.getElementById('lightness');
    const bailoutEl = document.getElementById('bailout');

    const iterVal = document.getElementById('iterVal');
    const expVal = document.getElementById('expVal');
    const hueVal = document.getElementById('hueVal');
    const satVal = document.getElementById('satVal');
    const lightVal = document.getElementById('lightVal');
    const bailoutVal = document.getElementById('bailoutVal');

    const resetBtn = document.getElementById('reset');
    const saveBtn = document.getElementById('save');
    const toggleProgressBtn = document.getElementById('toggleProgress');

    const centerInfo = document.getElementById('centerInfo');
    const zoomInfo = document.getElementById('zoomInfo');

    let renderToken = 0; // increment to cancel previous renders

    // View parameters
    let view = {
        centerX: -0.5,
        centerY: 0,
        // viewWidth: complex-plane width; default covers approx [-2.5, 1] => width ~3.5
        viewWidth: 3.5,
        maxIter: parseInt(iterationsEl.value, 10),
        exponent: parseFloat(expEl.value),
        hue: parseFloat(hueEl.value),
        saturation: parseFloat(satEl.value),
        lightness: parseFloat(lightEl.value),
        bailout: parseFloat(bailoutEl.value),
        progressive: true
    };

    // Keep track of devicePixelRatio for crisp rendering
    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        triggerRender();
    }

    // Web Worker creation via Blob
    const workerCode = `
self.addEventListener('message', (ev) => {
  const msg = ev.data;
  if (msg.type === 'render') {
    const {
      width, height,
      centerX, centerY, viewWidth,
      maxIter, exponent, hue, saturation, lightness, bailout, progressive
    } = msg;

    const scale = viewWidth / width;
    const out = new Uint8ClampedArray(width * height * 4);
    const rowBufSize = width * 4;

    for (let y = 0; y < height; y++) {
      const cy = centerY + (y - height / 2) * scale;
      for (let x = 0; x < width; x++) {
        const cx = centerX + (x - width / 2) * scale;
        let zx = 0.0, zy = 0.0;
        let iter = 0;
        let r = 0;

        while (iter < maxIter) {
          r = Math.hypot(zx, zy);
          if (r > bailout) break;
          let theta = Math.atan2(zy, zx);
          const rp = Math.pow(r, exponent);
          const nx = rp * Math.cos(exponent * theta) + cx;
          const ny = rp * Math.sin(exponent * theta) + cy;
          zx = nx; zy = ny;
          iter++;
        }

        const idx = (y * width + x) * 4;
        if (iter === maxIter) {
          out[idx] = out[idx + 1] = out[idx + 2] = 0;
          out[idx + 3] = 255;
        } else {
          // Smooth coloring with safe logs
          const log_zn = Math.log(Math.max(r, 1e-10));
          const nu = iter + 1 - Math.log(Math.max(log_zn, 1e-10)) / Math.log(Math.max(exponent, 1e-10));
          const t = Math.max(0, Math.min(1, nu / maxIter));

          // Hue offset + gradient
          const hueVal = ((hue + 360 * t) % 360 + 360) % 360;
          const s = Math.min(Math.max(saturation / 100, 0), 1);
          const l = Math.min(Math.max(lightness / 100, 0), 1);

          // HSL -> RGB
          const c = (1 - Math.abs(2 * l - 1)) * s;
          const hPrime = hueVal / 60;
          const xCol = c * (1 - Math.abs((hPrime % 2) - 1));
          let rCol = 0, gCol = 0, bCol = 0;

          if (hPrime >= 0 && hPrime < 1) { rCol = c; gCol = xCol; bCol = 0; }
          else if (hPrime < 2) { rCol = xCol; gCol = c; bCol = 0; }
          else if (hPrime < 3) { rCol = 0; gCol = c; bCol = xCol; }
          else if (hPrime < 4) { rCol = 0; gCol = xCol; bCol = c; }
          else if (hPrime < 5) { rCol = xCol; gCol = 0; bCol = c; }
          else { rCol = c; gCol = 0; bCol = xCol; }

          const m = l - c / 2;
          out[idx] = Math.round((rCol + m) * 255);
          out[idx + 1] = Math.round((gCol + m) * 255);
          out[idx + 2] = Math.round((bCol + m) * 255);
          out[idx + 3] = 255;
        }
      }

      // Post progressive rows
      if (progressive && (y % 8 === 0 || y === height - 1)) {
        const startRow = Math.max(0, y - 7);
        const numRows = y - startRow + 1;
        const chunk = new Uint8ClampedArray(numRows * rowBufSize);
        const srcStart = startRow * rowBufSize;
        chunk.set(out.subarray(srcStart, srcStart + chunk.length));
        self.postMessage({ type: 'partial', y: startRow, rows: numRows, width, buffer: chunk.buffer }, [chunk.buffer]);
      }
    }

    // Final full image
    self.postMessage({ type: 'done', width, height, buffer: out.buffer }, [out.buffer]);
  }
});
`;

    const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(workerBlob);
    const worker = new Worker(workerUrl);

    let pendingRenderId = 0;
    let lastRenderParams = null;

    // Draw a partial chunk received from worker
    worker.addEventListener('message', (ev) => {
        const msg = ev.data;
        if (msg.type === 'partial') {
            const { y, rows, width, buffer } = msg;
            const height = canvas.height;
            const dpr = Math.max(1, window.devicePixelRatio || 1);
            // create ImageData and put into canvas (must scale because worker receives dpr-scaled sizes)
            const imgData = new ImageData(new Uint8ClampedArray(buffer), width, rows);
            // draw at proper position. Note: worker used scaled width,height; canvas internal size matches that
            // compute target y in device pixels
            ctx.putImageData(imgData, 0, y);
        } else if (msg.type === 'done') {
            const { width, height, buffer } = msg;
            const imgData = new ImageData(new Uint8ClampedArray(buffer), width, height);
            ctx.putImageData(imgData, 0, 0);
        }
    });

    function renderChunkedProgressive() {
        // cancel any previous render
        renderToken++;
        const token = renderToken;

        const dpr = Math.max(1, window.devicePixelRatio || 1);
        const width = canvas.width;   // device pixels
        const height = canvas.height; // device pixels
        if (width === 0 || height === 0) return;

        const scale = view.viewWidth / width;
        const rowBufSize = width * 4;
        const out = new Uint8ClampedArray(width * height * 4); // full buffer (used to collect chunks)
        const batchRows = 8; // rows per time-slice to keep UI responsive

        // update info text immediately
        const zoom = 3.5 / view.viewWidth;
        centerInfo.textContent = `${(view.centerX).toFixed(10)}, ${(view.centerY).toFixed(10)}`;
        zoomInfo.textContent = `${zoom.toFixed(5)}x`;

        // helper: compute color for a single pixel
        function computePixel(cx, cy) {
            let zx = 0.0, zy = 0.0;
            let iter = 0;
            let r = 0;

            const maxIter = Math.max(1, Math.floor(view.maxIter));
            const exponent = Math.max(0.0000001, view.exponent);
            const bailout = Math.max(2, view.bailout);

            while (iter < maxIter) {
                r = Math.hypot(zx, zy);
                if (r > bailout) break;
                const theta = Math.atan2(zy, zx);
                const rp = Math.pow(r || 0, exponent);
                const nx = rp * Math.cos(exponent * theta) + cx;
                const ny = rp * Math.sin(exponent * theta) + cy;
                zx = nx; zy = ny;
                iter++;
            }

            if (iter === maxIter) {
                return [0, 0, 0, 255];
            } else {
                // smooth coloring with guards against NaN
                const safeR = Math.max(r, 1e-12);
                const log_zn = Math.log(safeR);
                const safeLogLog = Math.max(Math.log(Math.max(Math.abs(log_zn), 1e-12)), 1e-12);
                const nu = iter + 1 - safeLogLog / Math.log(Math.max(exponent, 1e-12));
                const t = Math.min(Math.max(nu / maxIter, 0), 1);

                const hueVal = ((view.hue + 360 * t) % 360 + 360) % 360;
                const s = Math.min(Math.max(view.saturation / 100, 0), 1);
                const l = Math.min(Math.max(view.lightness / 100, 0), 1);

                // HSL -> RGB (fast)
                const c = (1 - Math.abs(2 * l - 1)) * s;
                const hPrime = hueVal / 60;
                const xCol = c * (1 - Math.abs((hPrime % 2) - 1));
                let rCol = 0, gCol = 0, bCol = 0;

                if (hPrime >= 0 && hPrime < 1) { rCol = c; gCol = xCol; bCol = 0; }
                else if (hPrime < 2) { rCol = xCol; gCol = c; bCol = 0; }
                else if (hPrime < 3) { rCol = 0; gCol = c; bCol = xCol; }
                else if (hPrime < 4) { rCol = 0; gCol = xCol; bCol = c; }
                else if (hPrime < 5) { rCol = xCol; gCol = 0; bCol = c; }
                else { rCol = c; gCol = 0; bCol = xCol; }

                const m = l - c / 2;
                return [
                    Math.round((rCol + m) * 255),
                    Math.round((gCol + m) * 255),
                    Math.round((bCol + m) * 255),
                    255
                ];
            }
        }

        let rowStart = 0;
        function renderNextBatch() {
            // if token changed, stop rendering
            if (token !== renderToken) return;

            const lastRow = Math.min(height - 1, rowStart + batchRows - 1);

            // compute batch rows
            for (let y = rowStart; y <= lastRow; y++) {
                const cy = view.centerY + (y - height / 2) * scale;
                const baseIdx = y * rowBufSize;
                for (let x = 0; x < width; x++) {
                    const cx = view.centerX + (x - width / 2) * scale;
                    const color = computePixel(cx, cy);
                    const idx = baseIdx + x * 4;
                    out[idx] = color[0];
                    out[idx + 1] = color[1];
                    out[idx + 2] = color[2];
                    out[idx + 3] = color[3];
                }
            }

            // draw this chunk to canvas as ImageData (device-pixel coordinates)
            const chunkRows = lastRow - rowStart + 1;
            try {
                const imgData = new ImageData(new Uint8ClampedArray(out.buffer, rowStart * rowBufSize, chunkRows * rowBufSize), width, chunkRows);
                // putImageData is in device-pixel coordinates
                ctx.putImageData(imgData, 0, rowStart);
            } catch (err) {
                // Some browsers may not like subarray + ImageData with shared buffer offset.
                // Fallback: copy the rows into a fresh buffer
                const tmp = new Uint8ClampedArray(chunkRows * rowBufSize);
                tmp.set(new Uint8ClampedArray(out.buffer.slice(rowStart * rowBufSize, rowStart * rowBufSize + tmp.length)));
                const imgData2 = new ImageData(tmp, width, chunkRows);
                ctx.putImageData(imgData2, 0, rowStart);
            }

            rowStart = lastRow + 1;

            if (rowStart < height) {
                // schedule next batch so UI stays responsive
                setTimeout(renderNextBatch, 0);
            } else {
                // finished
                return;
            }
        }

        // start progressive rendering
        setTimeout(renderNextBatch, 0);
    }

    // Trigger a render with current view parameters
    function triggerRender() {
        // Guard: ensure canvas has size
        const w = canvas.width;
        const h = canvas.height;
        if (w === 0 || h === 0) return;

        // Update the on-screen info quickly
        const zoom = 3.5 / view.viewWidth;
        centerInfo.textContent = `${(view.centerX).toFixed(10)}, ${(view.centerY).toFixed(10)}`;
        zoomInfo.textContent = `${zoom.toFixed(5)}x`;

        // start progressive main-thread render (cancels previous)
        renderChunkedProgressive();
    }

    // UI bindings
    function bindUI() {
        // show initial values
        iterVal.textContent = iterationsEl.value;
        expVal.textContent = parseFloat(expEl.value).toFixed(2);
        hueVal.textContent = hueEl.value;
        satVal.textContent = satEl.value;
        lightVal.textContent = lightEl.value;
        bailoutVal.textContent = bailoutEl.value;

        iterationsEl.addEventListener('input', (e) => {
            iterVal.textContent = e.target.value;
            view.maxIter = parseInt(e.target.value, 10);
            triggerRender();
        });
        expEl.addEventListener('input', (e) => {
            expVal.textContent = parseFloat(e.target.value).toFixed(2);
            view.exponent = parseFloat(e.target.value);
            triggerRender();
        });
        hueEl.addEventListener('input', (e) => {
            hueVal.textContent = e.target.value;
            view.hue = parseFloat(e.target.value);
            triggerRender();
        });
        satEl.addEventListener('input', (e) => {
            satVal.textContent = e.target.value;
            view.saturation = parseFloat(e.target.value);
            triggerRender();
        });
        lightEl.addEventListener('input', (e) => {
            lightVal.textContent = e.target.value;
            view.lightness = parseFloat(e.target.value);
            triggerRender();
        });
        bailoutEl.addEventListener('input', (e) => {
            bailoutVal.textContent = e.target.value;
            view.bailout = parseFloat(e.target.value);
            triggerRender();
        });

        resetBtn.addEventListener('click', () => {
            view.centerX = -0.5;
            view.centerY = 0;
            view.viewWidth = 3.5;
            view.maxIter = parseInt(iterationsEl.value, 10);
            view.exponent = parseFloat(expEl.value);
            triggerRender();
        });

        saveBtn.addEventListener('click', () => {
            // create a temporary link
            const link = document.createElement('a');
            link.download = 'mandelbrot.png';
            // draw current canvas to an offscreen 2D context at display size
            // create a temporary canvas at displayed CSS size
            const cssW = canvas.clientWidth;
            const cssH = canvas.clientHeight;
            const temp = document.createElement('canvas');
            temp.width = cssW;
            temp.height = cssH;
            const tctx = temp.getContext('2d');
            // draw scaled
            tctx.drawImage(canvas, 0, 0, cssW, cssH);
            link.href = temp.toDataURL('image/png');
            link.click();
        });

        toggleProgressBtn.addEventListener('click', () => {
            view.progressive = !view.progressive;
            toggleProgressBtn.textContent = view.progressive ? 'Toggle Progressive' : 'Progressive OFF';
            triggerRender();
        });
    }

    // Interaction: drag to pan, wheel to zoom, double-click to zoom
    function bindInteraction() {
        let dragging = false;
        let lastX = 0, lastY = 0;

        canvas.addEventListener('mousedown', (e) => {
            dragging = true;
            canvas.style.cursor = 'grabbing';
            lastX = e.clientX;
            lastY = e.clientY;
        });
        window.addEventListener('mouseup', () => {
            dragging = false;
            canvas.style.cursor = 'grab';
        });
        window.addEventListener('mousemove', (e) => {
            if (!dragging) return;
            const rect = canvas.getBoundingClientRect();
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            lastX = e.clientX;
            lastY = e.clientY;
            const dpr = Math.max(1, window.devicePixelRatio || 1);
            const width = canvas.width;
            const scale = view.viewWidth / width;
            view.centerX -= dx * scale;
            view.centerY -= dy * scale;
            triggerRender();
        });

        // wheel to zoom around cursor
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = Math.sign(e.deltaY);
            // zoom multiplier per wheel notch
            const factor = Math.pow(1.15, -delta);
            // convert mouse to complex coords
            const rect = canvas.getBoundingClientRect();
            const cx = e.clientX - rect.left;
            const cy = e.clientY - rect.top;
            // canvas internal pixels
            const width = canvas.width;
            const height = canvas.height;
            const scaleBefore = view.viewWidth / width;
            const px = view.centerX + (cx * (view.viewWidth / width) - (width/2)*(view.viewWidth/width));
            const py = view.centerY + (cy * (view.viewWidth / width) - (height/2)*(view.viewWidth/width));
            view.viewWidth *= factor;
            const scaleAfter = view.viewWidth / width;
            // recompute center so that the complex point under cursor remains fixed
            view.centerX = px - (cx - width/2) * scaleAfter;
            view.centerY = py - (cy - height/2) * scaleAfter;
            triggerRender();
        }, { passive: false });

        // double click to zoom in centered at mouse
        canvas.addEventListener('dblclick', (e) => {
            const rect = canvas.getBoundingClientRect();
            const cx = e.clientX - rect.left;
            const cy = e.clientY - rect.top;
            const width = canvas.width;
            const height = canvas.height;
            const scaleBefore = view.viewWidth / width;
            const px = view.centerX + (cx - width/2) * scaleBefore;
            const py = view.centerY + (cy - height/2) * scaleBefore;
            view.viewWidth *= 0.5;
            const scaleAfter = view.viewWidth / width;
            view.centerX = px - (cx - width/2) * scaleAfter;
            view.centerY = py - (cy - height/2) * scaleAfter;
            triggerRender();
        });

        // Touch support (basic)
        let lastTouchDistance = null;
        canvas.addEventListener('touchstart', (ev) => {
            if (ev.touches.length === 1) {
                lastX = ev.touches[0].clientX;
                lastY = ev.touches[0].clientY;
            } else if (ev.touches.length === 2) {
                lastTouchDistance = Math.hypot(
                    ev.touches[0].clientX - ev.touches[1].clientX,
                    ev.touches[0].clientY - ev.touches[1].clientY
                );
            }
        }, { passive: true });

        canvas.addEventListener('touchmove', (ev) => {
            ev.preventDefault();
            if (ev.touches.length === 1) {
                const dx = ev.touches[0].clientX - lastX;
                const dy = ev.touches[0].clientY - lastY;
                lastX = ev.touches[0].clientX;
                lastY = ev.touches[0].clientY;
                const width = canvas.width;
                const scale = view.viewWidth / width;
                view.centerX -= dx * scale;
                view.centerY -= dy * scale;
                triggerRender();
            } else if (ev.touches.length === 2 && lastTouchDistance !== null) {
                const newDist = Math.hypot(
                    ev.touches[0].clientX - ev.touches[1].clientX,
                    ev.touches[0].clientY - ev.touches[1].clientY
                );
                const factor = lastTouchDistance / newDist;
                lastTouchDistance = newDist;
                view.viewWidth *= factor;
                triggerRender();
            }
        }, { passive: false });

        window.addEventListener('resize', resizeCanvas);
    }

    // init
    function init() {
        bindUI();
        bindInteraction();
        resizeCanvas();
        // small delay to ensure layout settled
        setTimeout(() => triggerRender(), 50);
    }

    init();
})();
