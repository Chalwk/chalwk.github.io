/* Copyright (c) 2024-2026. Jericho Crosby (Chalwk) */

(function () {
    const inputTextarea = document.getElementById('inputText');
    const alphabetizeBtn = document.getElementById('alphabetizeBtn');
    const scrambleBtn = document.getElementById('scrambleBtn');
    const copyBtn = document.getElementById('copyBtn');

    const sortModes = document.getElementsByName('sortMode');
    const sortWordNum = document.getElementById('sortWordNum');
    const wordNumRow = document.getElementById('wordNumRow');
    const reverseOrderChk = document.getElementById('reverseOrder');

    const removeDuplicatesChk = document.getElementById('removeDuplicates');
    const stripHtmlChk = document.getElementById('stripHtml');
    const normalizeSpacesChk = document.getElementById('normalizeSpaces');
    const removePunctuationChk = document.getElementById('removePunctuation');
    const removeFirstWordChk = document.getElementById('removeFirstWord');
    const removeFirstCharsChk = document.getElementById('removeFirstChars');
    const removeCharsCount = document.getElementById('removeCharsCount');

    const ignoreFirstWordsChk = document.getElementById('ignoreFirstWords');
    const ignoreWordsCount = document.getElementById('ignoreWordsCount');
    const ignoreDefiniteChk = document.getElementById('ignoreDefinite');
    const ignoreIndefiniteChk = document.getElementById('ignoreIndefinite');
    const ignoreCaseChk = document.getElementById('ignoreCase');

    const numberResultsChk = document.getElementById('numberResults');
    const numberSeparator = document.getElementById('numberSeparator');
    const addCustomTextChk = document.getElementById('addCustomText');
    const customPrefix = document.getElementById('customPrefix');
    const customSuffix = document.getElementById('customSuffix');

    const sepRadios = document.getElementsByName('separator');
    const customDelimiter = document.getElementById('customDelimiter');

    const outputSepRadios = document.getElementsByName('outputSeparator');
    const outputCustomRow = document.getElementById('outputCustomRow');
    const outputCustomDelimiter = document.getElementById('outputCustomDelimiter');

    function showWordNumRow() {
        const selected = Array.from(sortModes).find(r => r.checked)?.value;
        wordNumRow.style.display = selected === 'wordNum' ? 'flex' : 'none';
    }

    Array.from(sortModes).forEach(r => r.addEventListener('change', showWordNumRow));
    showWordNumRow();

    function showOutputCustomRow() {
        const selected = Array.from(outputSepRadios).find(r => r.checked)?.value;
        outputCustomRow.style.display = selected === 'custom' ? 'flex' : 'none';
    }

    Array.from(outputSepRadios).forEach(r => r.addEventListener('change', showOutputCustomRow));
    showOutputCustomRow();

    function getSelectedSeparator() {
        for (let r of sepRadios) if (r.checked) return r.value;
        return 'auto';
    }

    function stripHtmlTags(str) {
        return str.replace(/<[^>]*>/g, '');
    }

    function normalizeSpaces(str) {
        return str.replace(/\s+/g, ' ').trim();
    }

    function removePunctuation(str) {
        return str.replace(/[^\w\s]/g, '');
    }

    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function splitInput(text) {
        const mode = getSelectedSeparator();
        let raw = [];
        if (mode === 'newline') raw = text.split(/\r?\n/);
        else if (mode === 'comma') raw = text.split(',').map(s => s.trim());
        else if (mode === 'tab') raw = text.split('\t').map(s => s.trim());
        else if (mode === 'blankline') raw = text.split(/\n\s*\n/).map(s => s.trim());
        else if (mode === 'custom') {
            const delim = customDelimiter.value || ',';
            const escaped = escapeRegex(delim);
            raw = text.split(new RegExp(escaped)).map(s => s.trim());
        } else {
            const newlines = (text.match(/\n/g) || []).length;
            const commas = (text.match(/,/g) || []).length;
            const tabs = (text.match(/\t/g) || []).length;
            const blanks = (text.match(/\n\s*\n/g) || []).length;
            if (blanks > Math.max(newlines / 2, 2)) raw = text.split(/\n\s*\n/).map(s => s.trim());
            else if (tabs > commas && tabs > newlines) raw = text.split('\t').map(s => s.trim());
            else if (commas > newlines) raw = text.split(',').map(s => s.trim());
            else raw = text.split(/\r?\n/).map(s => s.trim());
        }
        return raw.filter(item => item.length > 0);
    }

    function cleanItem(str) {
        let s = str;
        if (stripHtmlChk.checked) s = stripHtmlTags(s);
        if (removeFirstWordChk.checked) {
            let parts = s.trim().split(/\s+/);
            s = parts.length > 1 ? parts.slice(1).join(' ') : '';
        }
        if (removeFirstCharsChk.checked && removeCharsCount.value > 0) {
            let n = parseInt(removeCharsCount.value) || 0;
            s = s.substring(n);
        }
        if (normalizeSpacesChk.checked) s = normalizeSpaces(s);
        if (removePunctuationChk.checked) s = removePunctuation(s);
        return s.trim();
    }

    function getComparisonKey(original) {
        let str = original;
        if (ignoreCaseChk.checked) str = str.toLowerCase();

        if (ignoreFirstWordsChk.checked) {
            let n = parseInt(ignoreWordsCount.value) || 1;
            let parts = str.split(/\s+/);
            str = parts.length > n ? parts.slice(n).join(' ') : '';
        }

        if (ignoreDefiniteChk.checked || ignoreIndefiniteChk.checked) {
            let words = str.split(/\s+/);
            let articles = [];
            if (ignoreDefiniteChk.checked) articles.push('the');
            if (ignoreIndefiniteChk.checked) articles.push('a', 'an');
            while (words.length > 0 && articles.includes(words[0].toLowerCase())) {
                words.shift();
            }
            str = words.join(' ');
        }
        return str;
    }

    function getWordAt(str, pos, zeroBased = false) {
        let parts = str.trim().split(/\s+/);
        let idx = zeroBased ? pos : pos - 1;
        return (idx >= 0 && idx < parts.length) ? parts[idx] : '';
    }

    function applyOutputFormatting(items) {
        let outputLines = items.map(line => {
            let out = line;

            const caseOpt = document.querySelector('input[name="caseOption"]:checked')?.value || 'none';
            if (caseOpt === 'lower') out = out.toLowerCase();
            else if (caseOpt === 'upper') out = out.toUpperCase();
            else if (caseOpt === 'title') {
                out = out.replace(/\b\w/g, l => l.toUpperCase());
            } else if (caseOpt === 'sentence') {
                out = out.charAt(0).toUpperCase() + out.slice(1).toLowerCase();
            }

            return out;
        });

        if (addCustomTextChk.checked) {
            const prefix = customPrefix.value || '';
            const suffix = customSuffix.value || '';
            outputLines = outputLines.map(line => prefix + line + suffix);
        }

        if (numberResultsChk.checked) {
            const sep = numberSeparator.value || '. ';
            outputLines = outputLines.map((line, i) => (i + 1) + sep + line);
        }

        return outputLines;
    }

    function processList() {
        let rawInput = inputTextarea.value;
        let items = splitInput(rawInput);

        items = items.map(cleanItem).filter(s => s !== '');

        if (removeDuplicatesChk.checked) {
            items = [...new Set(items)];
        }

        const sortMode = document.querySelector('input[name="sortMode"]:checked')?.value || 'az';

        if (sortMode === 'random') {
            for (let i = items.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [items[i], items[j]] = [items[j], items[i]];
            }
        } else {
            items.sort((a, b) => {
                let keyA, keyB;

                if (sortMode === 'lastName') {
                    keyA = getWordAt(a, -1, true);
                    keyB = getWordAt(b, -1, true);
                } else if (sortMode === 'wordNum') {
                    const pos = parseInt(sortWordNum.value) || 1;
                    keyA = getWordAt(a, pos, false);
                    keyB = getWordAt(b, pos, false);
                } else {
                    keyA = getComparisonKey(a);
                    keyB = getComparisonKey(b);
                }

                if (sortMode === 'za') {
                    return keyB.localeCompare(keyA);
                } else {
                    return keyA.localeCompare(keyB);
                }
            });
        }

        let outputLines = applyOutputFormatting(items);

        if (reverseOrderChk.checked) {
            outputLines.reverse();
        }

        const outputSep = document.querySelector('input[name="outputSeparator"]:checked')?.value || 'newline';
        let joinStr = '\n';
        if (outputSep === 'comma') joinStr = ', ';
        else if (outputSep === 'tab') joinStr = '\t';
        else if (outputSep === 'custom') joinStr = outputCustomDelimiter.value || ',';

        inputTextarea.value = outputLines.join(joinStr);
    }

    function scrambleList() {
        let rawInput = inputTextarea.value;
        let items = splitInput(rawInput);

        items = items.map(cleanItem).filter(s => s !== '');

        if (removeDuplicatesChk.checked) {
            items = [...new Set(items)];
        }

        for (let i = items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [items[i], items[j]] = [items[j], items[i]];
        }

        let outputLines = applyOutputFormatting(items);

        if (reverseOrderChk.checked) {
            outputLines.reverse();
        }

        const outputSep = document.querySelector('input[name="outputSeparator"]:checked')?.value || 'newline';
        let joinStr = '\n';
        if (outputSep === 'comma') joinStr = ', ';
        else if (outputSep === 'tab') joinStr = '\t';
        else if (outputSep === 'custom') joinStr = outputCustomDelimiter.value || ',';

        inputTextarea.value = outputLines.join(joinStr);
    }

    alphabetizeBtn.addEventListener('click', processList);
    scrambleBtn.addEventListener('click', scrambleList);

    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(inputTextarea.value);
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy', 1500);
        } catch (err) {
            inputTextarea.select();
            document.execCommand('copy');
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy', 1500);
        }
    });
})();