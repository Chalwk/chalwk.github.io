/*
Copyright (c) 2024-2026. Jericho Crosby (Chalwk)

List Alphabetizer - JavaScript
*/

(function() {
    const inputTextarea = document.getElementById('inputText');
    const outputTextarea = document.getElementById('outputText');
    const alphabetizeBtn = document.getElementById('alphabetizeBtn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const printBtn = document.getElementById('printBtn');
    const saveUrlBtn = document.getElementById('saveUrlBtn');

    const sortModes = document.getElementsByName('sortMode');
    const removeDuplicatesChk = document.getElementById('removeDuplicates');
    const stripHtmlChk = document.getElementById('stripHtml');

    const toLowercaseChk = document.getElementById('toLowercase');
    const capitalizeTitlesChk = document.getElementById('capitalizeTitles');
    const numberResultsChk = document.getElementById('numberResults');
    const numberSeparator = document.getElementById('numberSeparator');
    const addCustomTextChk = document.getElementById('addCustomText');
    const customPrefix = document.getElementById('customPrefix');
    const removeFirstWordChk = document.getElementById('removeFirstWord');
    const removeFirstCharsChk = document.getElementById('removeFirstChars');
    const removeCharsCount = document.getElementById('removeCharsCount');

    const ignoreFirstWordsChk = document.getElementById('ignoreFirstWords');
    const ignoreWordsCount = document.getElementById('ignoreWordsCount');
    const ignoreDefiniteChk = document.getElementById('ignoreDefinite');
    const ignoreIndefiniteChk = document.getElementById('ignoreIndefinite');
    const ignoreCaseChk = document.getElementById('ignoreCase');

    const sepRadios = document.getElementsByName('separator');
    const customDelimiter = document.getElementById('customDelimiter');

    function getSelectedSortMode() {
        for (let r of sortModes) if (r.checked) return r.value;
        return 'az';
    }

    function getSelectedSeparator() {
        for (let r of sepRadios) if (r.checked) return r.value;
        return 'auto';
    }

    function stripHtmlTags(str) {
        return str.replace(/<[^>]*>/g, '');
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
            raw = text.split(delim).map(s => s.trim());
        } else {
            const newlines = (text.match(/\n/g) || []).length;
            const commas = (text.match(/,/g) || []).length;
            const tabs = (text.match(/\t/g) || []).length;
            const blanks = (text.match(/\n\s*\n/g) || []).length;
            if (blanks > Math.max(newlines/2, 2)) raw = text.split(/\n\s*\n/).map(s => s.trim());
            else if (tabs > commas && tabs > newlines) raw = text.split('\t').map(s => s.trim());
            else if (commas > newlines) raw = text.split(',').map(s => s.trim());
            else raw = text.split(/\r?\n/).map(s => s.trim());
        }
        return raw.filter(item => item.length > 0);
    }

    function applyPreTransformations(items) {
        return items.map(item => {
            let str = item;
            if (stripHtmlChk.checked) str = stripHtmlTags(str);
            if (removeFirstWordChk.checked) {
                let parts = str.trim().split(/\s+/);
                if (parts.length > 1) str = parts.slice(1).join(' ');
                else str = '';
            }
            if (removeFirstCharsChk.checked && removeCharsCount.value > 0) {
                let n = parseInt(removeCharsCount.value) || 0;
                str = str.substring(n);
            }
            return str.trim();
        }).filter(s => s !== '');
    }

    function getComparisonString(original) {
        let str = original;
        if (ignoreCaseChk.checked) str = str.toLowerCase();

        if (ignoreFirstWordsChk.checked) {
            let n = parseInt(ignoreWordsCount.value) || 1;
            let parts = str.split(/\s+/);
            if (parts.length > n) str = parts.slice(n).join(' ');
            else str = '';
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

    function getLastName(entry) {
        let parts = entry.trim().split(/\s+/);
        return parts.length ? parts[parts.length-1] : '';
    }

    function processList() {
        let rawInput = inputTextarea.value;
        let items = splitInput(rawInput);
        items = applyPreTransformations(items);

        if (removeDuplicatesChk.checked) {
            items = [...new Set(items)];
        }

        const sortMode = getSelectedSortMode();
        if (sortMode === 'random') {
            for (let i = items.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [items[i], items[j]] = [items[j], items[i]];
            }
        } else {
            items.sort((a, b) => {
                let normA = a, normB = b;
                if (sortMode === 'lastName') {
                    normA = getLastName(a);
                    normB = getLastName(b);
                } else {
                    normA = getComparisonString(a);
                    normB = getComparisonString(b);
                }
                if (sortMode === 'za') {
                    return normB.localeCompare(normA);
                } else {
                    return normA.localeCompare(normB);
                }
            });
        }

        let outputLines = items.map((line, idx) => {
            let out = line;
            if (toLowercaseChk.checked) out = out.toLowerCase();
            if (capitalizeTitlesChk.checked) {
                out = out.replace(/\b\w/g, l => l.toUpperCase());
            }
            return out;
        });

        if (addCustomTextChk.checked && customPrefix.value.trim() !== '') {
            outputLines = outputLines.map(line => customPrefix.value.trim() + line);
        }
        if (numberResultsChk.checked) {
            const sep = numberSeparator.value || '. ';
            outputLines = outputLines.map((line, i) => (i+1) + sep + line);
        }

        outputTextarea.value = outputLines.join('\n');
    }

    alphabetizeBtn.addEventListener('click', processList);

    copyBtn.addEventListener('click', () => {
        outputTextarea.select();
        document.execCommand('copy');
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy', 1500);
    });

    downloadBtn.addEventListener('click', () => {
        const blob = new Blob([outputTextarea.value], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'alphabetized_list.txt';
        a.click();
        URL.revokeObjectURL(url);
    });

    printBtn.addEventListener('click', () => {
        const win = window.open('', '', 'width=800,height=600');
        win.document.write('<pre>' + outputTextarea.value + '</pre>');
        win.print();
        win.close();
    });

    saveUrlBtn.addEventListener('click', () => {
        const params = new URLSearchParams();
        params.set('input', inputTextarea.value);
        window.location.hash = params.toString();
        alert('Input saved to URL (hash fragment). Share this link.');
    });

    window.addEventListener('DOMContentLoaded', () => {
        processList();
    });
})();