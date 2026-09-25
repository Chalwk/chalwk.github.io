// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

(function () {
    const surnameInput = document.getElementById('surname');
    const liveModeChk = document.getElementById('liveMode');
    const keepCaseChk = document.getElementById('keepCase');
    const generateBtn = document.getElementById('generate');
    const copyBtn = document.getElementById('copy');
    const copyInsideBtn = document.getElementById('copyInside');
    const clearBtn = document.getElementById('clear');

    const pseudonymOutput = document.getElementById('pseudonymOutput');
    const mappingGrid = document.getElementById('mappingGrid');
    const mappingEmpty = document.getElementById('mappingEmpty');
    const warnings = document.getElementById('warnings');
    const circleSvg = document.getElementById('alphabetCircle');

    const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const CIRCLE_SIZE = 400;
    const CIRCLE_CENTER = CIRCLE_SIZE / 2;
    const CIRCLE_RADIUS = 160;
    const LABEL_RADIUS = CIRCLE_RADIUS + 22;

    function oppositeChar(char) {
        const isLetter = /[a-zA-Z]/.test(char);
        if (!isLetter) return char;

        const isUpper = char === char.toUpperCase();
        const base = isUpper ? 65 : 97;
        const idx = char.toUpperCase().charCodeAt(0) - 65;
        const oppIdx = (idx + 13) % 26;
        const oppChar = String.fromCharCode(base + oppIdx);
        return oppChar;
    }

    function transform(surname, keepCase) {
        const chars = surname.split('');
        return chars.map(ch => {
            if (!/[a-zA-Z]/.test(ch)) return ch;
            const result = oppositeChar(ch);
            if (keepCase) {
                return ch === ch.toUpperCase() ? result.toUpperCase() : result.toLowerCase();
            }
            return result;
        }).join('');
    }

    function pointOnCircle(index, total, radius) {
        const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
        return {
            x: CIRCLE_CENTER + radius * Math.cos(angle),
            y: CIRCLE_CENTER + radius * Math.sin(angle)
        };
    }

    function buildCircle(activeLetters) {
        const svgNS = 'http://www.w3.org/2000/svg';
        circleSvg.innerHTML = '';

        const ring = document.createElementNS(svgNS, 'circle');
        ring.setAttribute('cx', CIRCLE_CENTER);
        ring.setAttribute('cy', CIRCLE_CENTER);
        ring.setAttribute('r', CIRCLE_RADIUS);
        ring.setAttribute('class', 'circle-ring');
        circleSvg.appendChild(ring);

        const activeSet = new Set(activeLetters);
        const drawnPairs = new Set();

        for (let i = 0; i < 26; i++) {
            const letter = ALPHABET[i];
            const oppLetter = oppositeChar(letter);
            const pairKey = [letter, oppLetter].sort().join('');
            if (drawnPairs.has(pairKey)) continue;
            drawnPairs.add(pairKey);

            const isActivePair = activeSet.has(letter) || activeSet.has(oppLetter);
            const p1 = pointOnCircle(i, 26, CIRCLE_RADIUS);
            const p2 = pointOnCircle(ALPHABET.indexOf(oppLetter), 26, CIRCLE_RADIUS);

            const line = document.createElementNS(svgNS, 'line');
            line.setAttribute('x1', p1.x);
            line.setAttribute('y1', p1.y);
            line.setAttribute('x2', p2.x);
            line.setAttribute('y2', p2.y);
            line.setAttribute('class', isActivePair ? 'circle-link circle-link-active' : 'circle-link');
            circleSvg.appendChild(line);
        }

        for (let i = 0; i < 26; i++) {
            const letter = ALPHABET[i];
            const isActive = activeSet.has(letter);
            const dotPos = pointOnCircle(i, 26, CIRCLE_RADIUS);
            const labelPos = pointOnCircle(i, 26, LABEL_RADIUS);

            const dot = document.createElementNS(svgNS, 'circle');
            dot.setAttribute('cx', dotPos.x);
            dot.setAttribute('cy', dotPos.y);
            dot.setAttribute('r', isActive ? 7 : 5);
            dot.setAttribute('class', isActive ? 'circle-dot circle-dot-active' : 'circle-dot');
            circleSvg.appendChild(dot);

            const label = document.createElementNS(svgNS, 'text');
            label.setAttribute('x', labelPos.x);
            label.setAttribute('y', labelPos.y);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('dominant-baseline', 'middle');
            label.setAttribute('class', isActive ? 'circle-label circle-label-active' : 'circle-label');
            label.textContent = letter;
            circleSvg.appendChild(label);
        }
    }

    function buildMapping(surname, keepCase) {
        mappingGrid.innerHTML = '';
        const letters = surname.split('').filter(ch => /[a-zA-Z]/.test(ch));

        if (letters.length === 0) {
            mappingGrid.appendChild(mappingEmpty);
            return;
        }

        letters.forEach(ch => {
            let result = oppositeChar(ch);
            if (keepCase) {
                result = ch === ch.toUpperCase() ? result.toUpperCase() : result.toLowerCase();
            }

            const item = document.createElement('div');
            item.className = 'mapping-item';
            item.innerHTML = `
                <span class="mapping-from">${ch.toUpperCase()}</span>
                <i class="fas fa-arrow-right mapping-arrow"></i>
                <span class="mapping-to">${result.toUpperCase()}</span>
            `;
            mappingGrid.appendChild(item);
        });
    }

    function getActiveLetters(surname) {
        const active = new Set();
        surname.split('').forEach(ch => {
            if (/[a-zA-Z]/.test(ch)) {
                const upper = ch.toUpperCase();
                active.add(upper);
                active.add(oppositeChar(upper));
            }
        });
        return active;
    }

    function updateOutput() {
        const surname = surnameInput.value.trim();
        const keepCase = keepCaseChk.checked;

        if (!surname) {
            pseudonymOutput.value = '';
            warnings.style.display = 'none';
            buildMapping('', keepCase);
            buildCircle(new Set());
            return;
        }

        const pseudonym = transform(surname, keepCase);
        pseudonymOutput.value = pseudonym;

        const hasLetters = /[a-zA-Z]/.test(surname);
        if (!hasLetters) {
            warnings.textContent = 'No letters detected - only letters A-Z are transformed by the cipher.';
            warnings.style.display = 'block';
        } else {
            warnings.style.display = 'none';
        }

        buildMapping(surname, keepCase);
        buildCircle(getActiveLetters(surname));
    }

    function copyToClipboard() {
        const value = pseudonymOutput.value;
        if (!value) return;

        navigator.clipboard.writeText(value).then(() => {
            const originalTitle = copyBtn.title;
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
                copyBtn.title = originalTitle;
            }, 1500);
        }).catch(() => {
            pseudonymOutput.select();
            document.execCommand('copy');
        });
    }

    function updateGenerateButtonVisibility() {
        generateBtn.style.display = liveModeChk.checked ? 'none' : '';
    }

    surnameInput.addEventListener('input', () => {
        if (liveModeChk.checked) updateOutput();
    });

    liveModeChk.addEventListener('change', updateGenerateButtonVisibility);
    keepCaseChk.addEventListener('change', updateOutput);
    generateBtn.addEventListener('click', updateOutput);
    copyBtn.addEventListener('click', copyToClipboard);
    copyInsideBtn.addEventListener('click', copyToClipboard);

    clearBtn.addEventListener('click', () => {
        surnameInput.value = '';
        surnameInput.focus();
        updateOutput();
    });

    window.addEventListener('load', () => {
        buildCircle(new Set());
        buildMapping('', keepCaseChk.checked);
        updateGenerateButtonVisibility();
    });
})();