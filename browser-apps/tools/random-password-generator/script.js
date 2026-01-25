/*
Copyright (c) 2024-2026. Jericho Crosby (Chalwk)

Random Password Generator - JavaScript
*/

(() => {
    const CONFIG = {
        similarChars: /[il1Lo0O]/g,
        symbols: `!@#$%^&*()-_=+[]{};:,<.>/?~`,
        maxHistory: 200
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
    const copyInsideBtn = el('#copyInside');
    const passwordOutput = el('#passwordOutput');
    const strengthBar = el('#strengthBar');
    const strengthLabelEl = el('#strengthLabel');
    const entropyEl = el('#entropy');
    const zxcvbnScoreEl = el('#zxcvbnScore');
    const guessesLog10El = el('#guessesLog10');
    const crackTimeDisplayEl = el('#crackTimeDisplay');
    const warningsEl = el('#warnings');
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

    function ensureAtLeastOne(charsPerClass, result, targetLength) {
        const replacements = [];
        for (const cls of charsPerClass) {
            const ch = pickRandom(cls);
            const pos = Math.floor(Math.random() * result.length);
            replacements.push({pos, ch});
        }

        replacements.forEach(({pos, ch}) => {
            result[pos] = ch;
        });

        while (result.length > targetLength) {
            const removePos = Math.floor(Math.random() * result.length);
            result.splice(removePos, 1);
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

        if (classes.length > 0) ensureAtLeastOne(classes, result, opts.length);

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

    function formatTime(seconds) {
        if (!isFinite(seconds) || seconds > Number.MAX_SAFE_INTEGER) return 'centuries';
        if (seconds < 1) return 'instantly';

        const intervals = [
            { label: 'century', seconds: 3153600000 },
            { label: 'decade', seconds: 315360000 },
            { label: 'year', seconds: 31536000 },
            { label: 'month', seconds: 2592000 },
            { label: 'week', seconds: 604800 },
            { label: 'day', seconds: 86400 },
            { label: 'hour', seconds: 3600 },
            { label: 'minute', seconds: 60 },
            { label: 'second', seconds: 1 }
        ];

        for (const interval of intervals) {
            const count = Math.floor(seconds / interval.seconds);
            if (count >= 1) {
                return `${count} ${interval.label}${count !== 1 ? 's' : ''}`;
            }
        }
        return `${seconds.toFixed(0)} seconds`;
    }

    function getStrengthLabel(score) {
        const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
        const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];
        return { label: labels[score] || '-', score, color: colors[score] || '#6b7280' };
    }

    function analyzePasswordWithZxcvbn(password, opts) {
        if (!password) return null;

        try {
            const result = zxcvbn(password);
            const entropy = calcEntropy(password, opts);

            return {
                score: result.score,
                entropy: entropy,
                guessesLog10: result.guesses_log10,
                crackTimeSeconds: result.crack_times_seconds.offline_slow_hashing_1e4_per_second,
                feedback: result.feedback,
                warnings: result.feedback.warning || '',
                suggestions: result.feedback.suggestions || []
            };
        } catch (e) {
            console.error('zxcvbn analysis failed:', e);
            const entropy = calcEntropy(password, opts);
            return {
                score: entropy > 60 ? 4 : entropy > 40 ? 3 : entropy > 28 ? 2 : entropy > 20 ? 1 : 0,
                entropy: entropy,
                guessesLog10: Math.log10(Math.pow(2, entropy)),
                crackTimeSeconds: Math.pow(2, entropy) / 10000,
                feedback: {},
                warnings: '',
                suggestions: []
            };
        }
    }

    function gatherWarnings(analysis, opts) {
        const w = [];
        if (analysis.score <= 1) w.push('Password is weak. Consider increasing length or adding more character types.');
        if (analysis.warnings) w.push(analysis.warnings);
        if (analysis.suggestions && analysis.suggestions.length > 0) {
            analysis.suggestions.forEach(suggestion => w.push(suggestion));
        }
        if ((!opts.passphrase) && opts.length < 12) w.push('Password shorter than recommended 12 characters.');
        if (opts.passphrase && opts.words < 4) w.push('Passphrase with fewer than 4 words may be weak.');
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

    function updateStrengthDisplay(password, opts) {
        const analysis = analyzePasswordWithZxcvbn(password, opts);
        if (!analysis) return;

        const strengthInfo = getStrengthLabel(analysis.score);
        strengthLabelEl.textContent = strengthInfo.label;
        zxcvbnScoreEl.textContent = `${analysis.score}/4`;
        zxcvbnScoreEl.style.color = strengthInfo.color;

        const pct = (analysis.score + 1) * 20; // 0-4 score to 20-100%
        strengthBar.style.width = `${pct}%`;
        strengthBar.style.background = strengthInfo.color;

        entropyEl.textContent = analysis.entropy.toFixed(1) + ' bits';
        guessesLog10El.textContent = analysis.guessesLog10.toFixed(1);
        crackTimeDisplayEl.textContent = formatTime(analysis.crackTimeSeconds);

        const warnings = gatherWarnings(analysis, opts);
        warningsEl.innerHTML = warnings.length > 0
            ? warnings.map(w => `<div class="warning-item">⚠ ${w}</div>`).join('')
            : '<div class="warning-item" style="color: var(--success);">✓ All security checks passed</div>';

        if (analysis.score >= 3) {
            passwordOutput.classList.add('celebrate');
            setTimeout(() => passwordOutput.classList.remove('celebrate'), 1000);
        }
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

    function copyPasswordToClipboard() {
        const pw = passwordOutput.value;
        if (!pw) {
            showNotification('No password to copy', 'error');
            return;
        }
        navigator.clipboard.writeText(pw).then(() => {
            showNotification('Password copied to clipboard', 'success');
        }).catch(() => {
            showNotification('Failed to copy to clipboard', 'error');
        });
    }

    function loadSettings() {
        try {
            const raw = localStorage.getItem('password-generator-settings');
            const parsed = raw ? JSON.parse(raw) : {};
            return {
                darkMode: parsed.darkMode || false
            };
        } catch (e) {
            return { darkMode: false };
        }
    }

    function saveSettings(obj) {
        localStorage.setItem('password-generator-settings', JSON.stringify(obj));
    }

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
            if (!pw) {
                showNotification('No character sets selected', 'error');
                return;
            }

            if (!opts.pattern && !opts.passphrase && pw.length !== opts.length) {
                console.warn(`Password length mismatch: expected ${opts.length}, got ${pw.length}`);
                pw = generatePassword(opts);
            }

            passwordOutput.value = pw;
            updateStrengthDisplay(pw, opts);
            showNotification('New password generated', 'success');
        });

        copyBtn.addEventListener('click', copyPasswordToClipboard);
        copyInsideBtn.addEventListener('click', copyPasswordToClipboard);

        darkModeCheck.addEventListener('change', (e) => {
            document.body.classList.toggle('dark-mode', e.target.checked);
            const settings = loadSettings();
            saveSettings({ ...settings, darkMode: e.target.checked });
        });

        const settings = loadSettings();
        darkModeCheck.checked = settings.darkMode;
        if (settings.darkMode) document.body.classList.add('dark-mode');
        updateUIFromOptions();
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
        .warning-item { margin-bottom: 4px; padding: 4px 0; }
        .warning-item:last-child { margin-bottom: 0; }
    `;
    document.head.appendChild(style);

    document.addEventListener('DOMContentLoaded', wire);
})();