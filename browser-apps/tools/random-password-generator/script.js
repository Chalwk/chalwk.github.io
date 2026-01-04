/*
Copyright (c) 2025-2026. Jericho Crosby (Chalwk)

Random Password Generator - JavaScript
*/

(() => {
    const CONFIG = {
        similarChars: /[il1Lo0O]/g,
        symbols: `!@#$%^&*()-_=+[]{};:,<.>/?~`,
        maxHistory: 200,
        attackSpeeds: {
            singleGpu: 1e9,
            gpuFarm: 1e12,
            nationState: 1e14,
            quantumOps: 1e10
        }
    };

    const WORDS = [
        `apple`,`river`,`stone`,`ocean`,`sun`,
        `moon`,`forest`,`shadow`,`ember`,`silver`,
        `iron`,`sage`,`crane`,`wolf`,`breeze`,
        `ember`,`cinder`,`harbor`,`crest`,`lumen`
    ];

    const el = (sel, root = document) => root.querySelector(sel);
    const els = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const escapeHtml = s => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]));

    const lengthInput = el('#length');
    const lengthVal = el('#lengthVal');
    const upperCheck = el('#upper');
    const lowerCheck = el('#lower');
    const numbersCheck = el('#numbers');
    const symbolsCheck = el('#symbols');
    const customInput = el('#custom');
    const includeSimilarCheck = el('#includeSimilar');
    const passphraseModeCheck = el('#passphraseMode');
    const passphraseWordsInput = el('#passphraseWords');
    const patternInput = el('#pattern');
    const generateBtn = el('#generate');
    const copyBtn = el('#copy');
    const favBtn = el('#fav');
    const exportTxtBtn = el('#exportTxt');
    const exportCsvBtn = el('#exportCsv');
    const clearHistoryBtn = el('#clearHistory');
    const passwordOutput = el('#passwordOutput');
    const strengthBar = el('#strengthBar');
    const strengthLabelEl = el('#strengthLabel');
    const entropyEl = el('#entropy');
    const bitsEl = el('#bits');
    const guessesEl = el('#guesses');
    const timeToCrackEl = el('#timeToCrack');
    const warningsEl = el('#warnings');
    const historyList = el('#historyList');
    const darkModeCheck = el('#darkMode');

    function buildPool(opts) {
        let pool = new Set();
        if (opts.upper) 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(c => pool.add(c));
        if (opts.lower) 'abcdefghijklmnopqrstuvwxyz'.split('').forEach(c => pool.add(c));
        if (opts.numbers) '0123456789'.split('').forEach(c => pool.add(c));
        if (opts.symbols) CONFIG.symbols.split('').forEach(c => pool.add(c));
        if (opts.custom) opts.custom.split('').forEach(c => pool.add(c));

        if (opts.excludeSimilar) {
            for (const c of Array.from(pool)) {
                if (CONFIG.similarChars.test(c)) pool.delete(c);
            }
        }
        return Array.from(pool);
    }

    function pickRandom(arr) {
        const idx = Math.floor(Math.random() * arr.length);
        return arr[idx];
    }

    function ensureAtLeastOne(charsPerClass, result) {
        for (const cls of charsPerClass) {
            const ch = pickRandom(cls);
            const pos = Math.floor(Math.random() * (result.length + 1));
            result.splice(pos, 0, ch);
        }
    }

    function generateFromPattern(pattern, opts) {
        const pool = buildPool(opts);
        const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const lower = 'abcdefghijklmnopqrstuvwxyz'.split('');
        const digits = '0123456789'.split('');
        const symbols = CONFIG.symbols.split('');
        const out = [];

        for (let i = 0; i < pattern.length; i++) {
            const t = pattern[i];
            if (t === 'C') out.push(pickRandom(upper));
            else if (t === 'c') out.push(pickRandom(lower));
            else if (t === 'd') out.push(pickRandom(digits));
            else if (t === 's') out.push(pickRandom(symbols));
            else if (t === '*') out.push(pickRandom(pool));
            else out.push(t);
        }
        return out.join('');
    }

    function generatePassphrase(words = 4, opts = {}) {
        const pick = () => WORDS[Math.floor(Math.random() * WORDS.length)];
        const parts = [];
        for (let i = 0; i < words; i++) {
            let w = pick();
            if (Math.random() < 0.5) w = w.charAt(0).toUpperCase() + w.slice(1);
            parts.push(w);
        }
        const sep = opts.passphraseSep !== undefined ? opts.passphraseSep : '-';
        return parts.join(sep);
    }

    function generatePassword(opts) {
        if (opts.pattern) return generateFromPattern(opts.pattern, opts);
        if (opts.passphrase) return generatePassphrase(opts.words, opts);
        const pool = buildPool(opts);
        if (pool.length === 0) return '';
        const result = [];
        for (let i = 0; i < opts.length; i++) result.push(pickRandom(pool));
        const classes = [];
        if (opts.upper) classes.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
        if (opts.lower) classes.push('abcdefghijklmnopqrstuvwxyz'.split(''));
        if (opts.numbers) classes.push('0123456789'.split(''));
        if (opts.symbols) classes.push(CONFIG.symbols.split(''));
        if (opts.custom) classes.push(opts.custom.split(''));
        if (classes.length > 0) ensureAtLeastOne(classes, result);
        return result.join('');
    }

    function log2(x) { return Math.log(x) / Math.LN2; }

    function calcEntropy(password, opts) {
        if (opts.pattern) {
            let ent = 0;
            for (const t of opts.pattern) {
                if (t === 'C') ent += log2(26);
                else if (t === 'c') ent += log2(26);
                else if (t === 'd') ent += log2(10);
                else if (t === 's') ent += log2(CONFIG.symbols.length);
                else if (t === '*') ent += log2(buildPool(opts).length);
                else ent += log2(1);
            }
            return ent;
        }
        if (opts.passphrase) {
            const wordEntropy = Math.log2(WORDS.length || 1);
            return opts.words * wordEntropy;
        }
        const poolSize = buildPool(opts).length || 1;
        return password.length * log2(poolSize);
    }

    function guessesFromEntropy(entropy) {
        return Math.pow(2, entropy);
    }

    function formatTime(seconds) {
        if (!isFinite(seconds) || seconds > Number.MAX_SAFE_INTEGER) return 'practically infinite';
        const years = seconds / 60 / 60 / 24 / 365;
        if (years > 1) return `${years.toFixed(2)} years`;
        const days = seconds / 60 / 60 / 24;
        if (days > 1) return `${days.toFixed(2)} days`;
        const hours = seconds / 60 / 60;
        if (hours > 1) return `${hours.toFixed(2)} hours`;
        const minutes = seconds / 60;
        if (minutes > 1) return `${minutes.toFixed(2)} minutes`;
        return `${seconds.toFixed(2)} seconds`;
    }

    function estimateCrackTimes(entropy) {
        const guesses = guessesFromEntropy(entropy);
        const speeds = CONFIG.attackSpeeds;
        const single = guesses / speeds.singleGpu;
        const farm = guesses / speeds.gpuFarm;
        const nation = guesses / speeds.nationState;
        const quantumGuesses = Math.pow(2, entropy / 2);
        const quantum = quantumGuesses / speeds.quantumOps;
        return { guesses, single, farm, nation, quantum };
    }

    function getStrengthLabel(entropy) {
        if (entropy < 28) return { label: 'Weak', score: 0 };
        if (entropy < 36) return { label: 'Fair', score: 1 };
        if (entropy < 60) return { label: 'Strong', score: 2 };
        return { label: 'Very Strong', score: 3 };
    }

    function formatLargeNumber(n) {
        if (!isFinite(n) || n > 1e18) return 'Very large';
        return Math.round(n).toLocaleString();
    }

    function detectRepeatingSequence(s) {
        const n = s.length;
        for (let k = 1; k <= Math.floor(n / 2); k++) {
            for (let i = 0; i <= n - 2 * k; i++) {
                const a = s.substr(i, k);
                const b = s.substr(i + k, k);
                if (a === b && k >= 2) return a;
            }
        }
        return null;
    }

    function countCharacterClasses(s) {
        return {
            upper: /[A-Z]/.test(s),
            lower: /[a-z]/.test(s),
            digits: /[0-9]/.test(s),
            symbols: new RegExp('[' + escapeForRegExp(CONFIG.symbols) + ']').test(s)
        };
    }

    function escapeForRegExp(s) { return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'); }

    function gatherWarnings(pw, opts, entropy) {
        const w = [];
        if ((!opts.passphrase) && pw.length < 12) w.push('Password shorter than recommended 12 characters.');
        if (opts.passphrase && opts.words < 4) w.push('Passphrase with fewer than 4 words may be weak.');
        const repeat = detectRepeatingSequence(pw);
        if (repeat) w.push('Detected repeated sequence: ' + repeat);
        const classes = countCharacterClasses(pw);
        if (!opts.passphrase && Object.values(classes).filter(Boolean).length < 2) w.push('Low character class diversity. Use multiple sets.');
        if (entropy < 28) w.push('Low entropy. Consider increasing length or use more character sets.');
        return w;
    }

    function readOptionsFromUI() {
        return {
            length: parseInt(lengthInput.value, 10),
            upper: upperCheck.checked,
            lower: lowerCheck.checked,
            numbers: numbersCheck.checked,
            symbols: symbolsCheck.checked,
            custom: customInput.value || '',
            excludeSimilar: includeSimilarCheck.checked,
            passphrase: passphraseModeCheck.checked,
            words: parseInt(passphraseWordsInput.value, 10) || 4,
            pattern: patternInput.value || ''
        };
    }

    function updateUIFromOptions() {
        const opts = readOptionsFromUI();
        lengthVal.textContent = opts.length;
        passphraseWordsInput.disabled = !opts.passphrase;
    }

    function updateStrengthDisplay(entropy) {
        entropyEl.textContent = entropy.toFixed(2) + ' bits';
        bitsEl.textContent = entropy.toFixed(2);
        const est = estimateCrackTimes(entropy);
        const lines = [];
        lines.push(`Single GPU: ${formatTime(est.single)}`);
        lines.push(`GPU farm: ${formatTime(est.farm)}`);
        lines.push(`Nation state: ${formatTime(est.nation)}`);
        lines.push(`Quantum (Grover-style): ${formatTime(est.quantum)}`);
        timeToCrackEl.innerHTML = lines.join('<br>');
        guessesEl.textContent = formatLargeNumber(est.guesses);
        const strengthInfo = getStrengthLabel(entropy);
        strengthLabelEl.textContent = strengthInfo.label;
        const pct = Math.min(100, Math.max(6, entropy / 80 * 100));
        strengthBar.style.width = `${pct}%`;
        if (entropy < 28) strengthBar.style.background = '#ef4444';
        else if (entropy < 36) strengthBar.style.background = '#f59e0b';
        else if (entropy < 60) strengthBar.style.background = '#10b981';
        else strengthBar.style.background = 'linear-gradient(90deg, #10b981, #06b6d4)';
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            border-radius: var(--radius);
            box-shadow: var(--shadow-lg);
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    const STORAGE_KEY = "password-generator-history-v2";

    function loadHistory() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error("Failed to load history", e);
            return [];
        }
    }

    function saveHistory(arr) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(arr || []));
        renderHistory();
    }

    function addToHistory(entry) {
        const settings = loadSettings();
        const arr = loadHistory();
        arr.unshift(entry);
        if (arr.length > (settings.maxHistory || CONFIG.maxHistory)) {
            arr.splice((settings.maxHistory || CONFIG.maxHistory));
        }
        saveHistory(arr);
    }

    function renderHistory() {
        const arr = loadHistory();
        historyList.innerHTML = '';
        if (!arr.length) {
            historyList.innerHTML = `<div class="muted" style="padding: 2rem; text-align: center;">No password history yet.</div>`;
            return;
        }
        arr.forEach((item, idx) => {
            const itemEl = document.createElement('div');
            itemEl.className = 'history-item';
            itemEl.innerHTML = `
                <div class="left">
                    <div style="font-weight: 500; margin-bottom: 4px;">${new Date(item.date).toLocaleString()}</div>
                    <div style="font-family: var(--font-mono); font-size: 0.85rem; word-break: break-all;">${escapeHtml(truncate(item.pw, 40))}</div>
                    ${item.entropy ? `<div style="font-size: 0.75rem; color: var(--gray); margin-top: 4px;">${item.entropy.toFixed(2)} bits</div>` : ''}
                </div>
                <div class="right">
                    <button class="btn small" data-action="use" data-idx="${idx}" title="Use this password">Use</button>
                    <button class="btn small" data-action="copy" data-idx="${idx}" title="Copy to clipboard">Copy</button>
                </div>
            `;
            historyList.appendChild(itemEl);
        });
        els('[data-action="use"]', historyList).forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.dataset.idx);
                const arr = loadHistory();
                if (arr[idx]) {
                    passwordOutput.value = arr[idx].pw;
                    showNotification('Password loaded into output');
                }
            });
        });
        els('[data-action="copy"]', historyList).forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.dataset.idx);
                const arr = loadHistory();
                if (arr[idx]) {
                    navigator.clipboard.writeText(arr[idx].pw).then(() => {
                        showNotification('Password copied to clipboard', 'success');
                    });
                }
            });
        });
    }

    function truncate(s, n) { return s.length > n ? s.slice(0, n - 2) + '..' : s; }

    function loadSettings() {
        try {
            const raw = localStorage.getItem(`${STORAGE_KEY}-settings`);
            const parsed = raw ? JSON.parse(raw) : {};
            return {
                maxHistory: parsed.maxHistory || CONFIG.maxHistory,
                darkMode: parsed.darkMode || false
            };
        } catch (e) {
            return {
                maxHistory: CONFIG.maxHistory,
                darkMode: false
            };
        }
    }

    function saveSettings(obj) {
        localStorage.setItem(`${STORAGE_KEY}-settings`, JSON.stringify(obj));
    }

    function exportTxt() {
        const arr = loadHistory();
        if (!arr.length) {
            showNotification('No history to export', 'error');
            return;
        }
        const text = arr.map(it => `${new Date(it.date).toISOString()},${it.pw}`).join('\n');
        downloadBlob(text, `passwords-${new Date().toISOString().slice(0,10)}.txt`, 'text/plain');
        showNotification('History exported as TXT', 'success');
    }

    function exportCsv() {
        const arr = loadHistory();
        if (!arr.length) {
            showNotification('No history to export', 'error');
            return;
        }
        const csv = ['date,password,entropy'];
        arr.forEach(it => csv.push(`${new Date(it.date).toISOString()},"${escapeCsv(it.pw)}",${it.entropy || ''}`));
        downloadBlob(csv.join('\n'), `passwords-${new Date().toISOString().slice(0,10)}.csv`, 'text/csv');
        showNotification('History exported as CSV', 'success');
    }

    function downloadBlob(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    function escapeCsv(s) { return String(s).replace(/"/g, '""'); }

    function wire() {
        lengthInput.addEventListener('input', updateUIFromOptions);
        upperCheck.addEventListener('change', updateUIFromOptions);
        lowerCheck.addEventListener('change', updateUIFromOptions);
        numbersCheck.addEventListener('change', updateUIFromOptions);
        symbolsCheck.addEventListener('change', updateUIFromOptions);
        customInput.addEventListener('input', updateUIFromOptions);
        includeSimilarCheck.addEventListener('change', updateUIFromOptions);
        patternInput.addEventListener('input', updateUIFromOptions);
        passphraseModeCheck.addEventListener('change', () => {
            passphraseWordsInput.disabled = !passphraseModeCheck.checked;
            updateUIFromOptions();
        });
        passphraseWordsInput.addEventListener('input', updateUIFromOptions);

        generateBtn.addEventListener('click', () => {
            const opts = readOptionsFromUI();
            let pw = generatePassword(opts);
            if (!pw) { showNotification('No character sets selected', 'error'); return; }
            passwordOutput.value = pw;
            favBtn.dataset.pw = pw;
            favBtn.innerHTML = '<i class="far fa-star"></i>';
            const entropy = calcEntropy(pw, opts);
            const warnings = gatherWarnings(pw, opts, entropy);
            warningsEl.innerHTML = warnings.map(w => `⚠ ${w}`).join('<br>') || '<span style="color: var(--success);">✓ All security checks passed</span>';
            updateStrengthDisplay(entropy);
            if (entropy >= 60) { passwordOutput.classList.add('celebrate'); setTimeout(() => passwordOutput.classList.remove('celebrate'), 1000); }
            addToHistory({ pw, entropy, date: Date.now() });
        });

        copyBtn.addEventListener('click', () => {
            const pw = passwordOutput.value;
            if (!pw) { showNotification('No password to copy', 'error'); return; }
            navigator.clipboard.writeText(pw).then(() => { showNotification('Password copied to clipboard', 'success'); }).catch(() => { showNotification('Failed to copy to clipboard', 'error'); });
        });

        favBtn.addEventListener('click', () => {
            const pw = favBtn.dataset.pw;
            if (!pw) { showNotification('No password to favorite', 'error'); return; }
            addToHistory({ pw, date: Date.now(), fav: true });
            favBtn.innerHTML = '<i class="fas fa-star" style="color: #f59e0b;"></i>';
            showNotification('Password added to favorites', 'success');
        });

        exportTxtBtn.addEventListener('click', exportTxt);
        exportCsvBtn.addEventListener('click', exportCsv);

        clearHistoryBtn.addEventListener('click', () => {
            if (confirm('Clear all password history? This cannot be undone.')) {
                localStorage.removeItem(STORAGE_KEY);
                renderHistory();
                showNotification('History cleared', 'success');
            }
        });

        darkModeCheck.addEventListener('change', (e) => {
            document.body.classList.toggle('dark-mode', e.target.checked);
            const settings = loadSettings();
            saveSettings({ ...settings, darkMode: e.target.checked });
        });

        const settings = loadSettings();
        darkModeCheck.checked = settings.darkMode;
        if (settings.darkMode) document.body.classList.add('dark-mode');
        updateUIFromOptions();
        renderHistory();
    }

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
        @keyframes pop { 0% { transform: scale(0.9); opacity: 0; } 60% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        .celebrate { animation: pop 0.6s ease; border-color: var(--success) !important; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important; }
        .dark-mode { background: var(--darker) !important; color: var(--light) !important; }
        .dark-mode .panel { background: rgba(30, 41, 59, 0.8) !important; border-color: rgba(100, 116, 139, 0.3) !important; }
        .dark-mode input, .dark-mode textarea, .dark-mode select { background: rgba(15, 23, 42, 0.6) !important; border-color: rgba(100, 116, 139, 0.4) !important; color: var(--light) !important; }
    `;
    document.head.appendChild(style);

    document.addEventListener('DOMContentLoaded', wire);
})();