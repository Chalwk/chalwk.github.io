/*
Copyright (c) 2024-2026. Jericho Crosby (Chalwk)

Speed Reading Tester - JavaScript
*/

(function() {
    const stories = [
        {
            title: "The Lost Key",
            text: "Elena found a small brass key under the porch. It was old and tarnished, but she felt it was important. She tried it on every lock in the house: the front door, the desk drawer, even the old chest in the attic. None worked. Disappointed, she sat on the garden wall. A glint caught her eye — a tiny lock on a weathered box half-buried in the soil. The key turned smoothly. Inside lay a bundle of letters written by her great-grandmother. Elena spent the evening reading about a love story she never knew.",
            questions: [
                { q: "Where did Elena find the key?", opts: ["In the attic", "Under the porch", "Inside a box", "On the garden wall"], correct: 1 },
                { q: "What was inside the box?", opts: ["Jewellery", "Gold coins", "Letters", "A photograph"], correct: 2 },
                { q: "Who wrote the letters?", opts: ["Elena's mother", "Her great-grandmother", "A stranger", "Her grandfather"], correct: 1 }
            ]
        },
        {
            title: "The Birthday Surprise",
            text: "Leo saved his allowance for months. He wanted to buy his mother a beautiful brooch she had seen in the antique shop. The day before her birthday, he walked to the store with his pocket full of coins and notes. The brooch was still there, glowing under the glass. The shopkeeper smiled and wrapped it in soft paper. On the morning of the birthday, Leo placed the small package beside her breakfast plate. When his mother opened it, her eyes filled with tears. She hugged him tightly and whispered that it was the best gift ever.",
            questions: [
                { q: "What did Leo want to buy?", opts: ["A necklace", "A brooch", "A ring", "A watch"], correct: 1 },
                { q: "Where did he buy it?", opts: ["A mall", "An antique shop", "A market", "Online"], correct: 1 },
                { q: "How did his mother react?", opts: ["She was surprised but quiet", "She cried and hugged him", "She asked for the receipt", "She put it away"], correct: 1 }
            ]
        },
        {
            title: "Mountain Hike",
            text: "Three friends — Mia, Carlos, and Jin — decided to hike the Eagle Peak trail. They started at sunrise, carrying water and sandwiches. The path was steep, but the views got better with every step. After two hours they reached a rocky outcrop. Below them lay a valley covered in mist, and above, an eagle circled. They rested, ate their lunch, and took photos. On the way down, Carlos slipped and twisted his ankle. Mia and Jin helped him hobble slowly. They reached the car just as it began to rain. Despite the pain, Carlos grinned and said, 'We'll be back next month.'",
            questions: [
                { q: "How many friends went hiking?", opts: ["Two", "Three", "Four", "Five"], correct: 1 },
                { q: "What happened to Carlos?", opts: ["He got lost", "He twisted his ankle", "He ran out of water", "He saw a bear"], correct: 1 },
                { q: "What did they see above them?", opts: ["A hawk", "A plane", "An eagle", "Clouds"], correct: 2 }
            ]
        }
    ];

    const longRsvpText = "The old mansion stood on a hill overlooking the small town of Millbrook. For decades, locals whispered about the lights that flickered in its windows on stormy nights. No one dared to approach, until a young historian named Claire decided to uncover the truth. She borrowed the keys from the historical society and walked up the overgrown path on a crisp autumn morning. The door groaned as it opened, revealing a grand hall draped in dusty cobwebs. Claire's footsteps echoed on the marble floor. She found a library with books still on the shelves, a kitchen with rusty pots, and a bedroom with a four-poster bed. In the attic, she discovered a trunk filled with letters and photographs. They told the story of Eleanor, a woman who had lived there alone after her fiancé perished in the war. Eleanor had kept the lights burning every night hoping he would return. Claire felt a deep sadness but also admiration. She decided to write an article about Eleanor, ensuring her story would not be forgotten. The town eventually restored the mansion as a small museum, and Claire became its first curator. Visitors came from far away, and on some evenings, they swore they could still see a faint light in the attic window, as if Eleanor's spirit finally found peace.";

    const tabRSVP = document.getElementById('tabRSVP');
    const tabStory = document.getElementById('tabStory');
    const rsvpPanel = document.getElementById('rsvpPanel');
    const storyPanel = document.getElementById('storyPanel');
    const wordDisplaySpan = document.getElementById('currentWord');
    const liveWpmSpan = document.getElementById('liveWpm');
    const wordCountSpan = document.getElementById('wordCount');
    const totalWordsSpan = document.getElementById('totalWords');
    const beginBtn = document.getElementById('rsvpBegin');
    const stopBtn = document.getElementById('rsvpStop');
    const resetBtn = document.getElementById('rsvpReset');
    const storySelect = document.getElementById('storySelect');
    const storyTextDisplay = document.getElementById('storyTextDisplay');
    const storyTimerSpan = document.getElementById('storyTimer');
    const storyWordCountSpan = document.getElementById('storyWordCount');
    const storyStartBtn = document.getElementById('storyStart');
    const storyFinishBtn = document.getElementById('storyFinish');
    const storyResetBtn = document.getElementById('storyReset');
    const comprehensionArea = document.getElementById('comprehensionArea');
    const questionsContainer = document.getElementById('questionsContainer');
    const submitAnswersBtn = document.getElementById('submitAnswers');
    const comprehensionScore = document.getElementById('comprehensionScore');

    let rsvpWords = longRsvpText.split(/\s+/);
    let currentIdx = 0;
    let currentWpm = 120;
    const BASE_WPM = 120;
    const MAX_WPM = 800;
    const INCREMENT = 2;
    let rsvpInterval = null;
    let isRunning = false;

    let storyTimerInterval = null;
    let storyStartTime = null;
    let storyElapsedSeconds = 0;
    let currentStoryIndex = 0;
    let storyFinished = false;
    let storyWordsCount = 0;
    let storyCompleted = false;

    totalWordsSpan.textContent = rsvpWords.length;

    function stopRSVP() {
        if (rsvpInterval) {
            clearInterval(rsvpInterval);
            rsvpInterval = null;
        }
        isRunning = false;
        beginBtn.disabled = false;
        stopBtn.disabled = true;
    }

    function resetRSVP() {
        stopRSVP();
        currentIdx = 0;
        currentWpm = BASE_WPM;
        liveWpmSpan.textContent = currentWpm;
        wordCountSpan.textContent = '0';
        wordDisplaySpan.textContent = rsvpWords.length ? rsvpWords[0] : '⟵ no words';
    }

    function displayNextWord() {
        if (!rsvpWords.length) return;
        if (currentIdx >= rsvpWords.length) {
            stopRSVP();
            wordDisplaySpan.textContent = '✓ finished';
            return;
        }
        wordDisplaySpan.textContent = rsvpWords[currentIdx];
        wordCountSpan.textContent = currentIdx + 1;
        currentIdx++;
        currentWpm = Math.min(currentWpm + INCREMENT, MAX_WPM);
        liveWpmSpan.textContent = currentWpm;
        if (isRunning) {
            if (rsvpInterval) clearInterval(rsvpInterval);
            const delayMs = 60000 / currentWpm;
            rsvpInterval = setInterval(displayNextWord, delayMs);
        }
    }

    function startRSVP() {
        if (isRunning) return;
        if (!rsvpWords.length) return;
        if (currentIdx >= rsvpWords.length) {
            currentIdx = 0;
            currentWpm = BASE_WPM;
            liveWpmSpan.textContent = currentWpm;
        }
        isRunning = true;
        beginBtn.disabled = true;
        stopBtn.disabled = false;
        if (currentIdx === 0 && rsvpWords.length) {
            wordDisplaySpan.textContent = rsvpWords[0];
            wordCountSpan.textContent = '1';
            currentIdx = 1;
        }
        const delayMs = 60000 / currentWpm;
        rsvpInterval = setInterval(displayNextWord, delayMs);
    }

    beginBtn.addEventListener('click', startRSVP);
    stopBtn.addEventListener('click', stopRSVP);
    resetBtn.addEventListener('click', resetRSVP);

    function loadStory(index) {
        currentStoryIndex = index;
        const story = stories[index];
        storyTextDisplay.textContent = story.text;
        const words = story.text.trim().split(/\s+/).length;
        storyWordsCount = words;
        storyWordCountSpan.textContent = words;
        storyTimerSpan.textContent = '0.0';
        comprehensionArea.classList.add('hidden');
        storyFinished = false;
        storyCompleted = false;
        storyFinishBtn.disabled = true;
        storyStartBtn.disabled = false;
        if (storyTimerInterval) clearInterval(storyTimerInterval);
        storyElapsedSeconds = 0;
        let html = '';
        story.questions.forEach((q, idx) => {
            html += `<div class="question-item"><p>${idx+1}. ${q.q}</p>`;
            q.opts.forEach((opt, optIdx) => {
                html += `<label><input type="radio" name="q${idx}" value="${optIdx}"> ${opt}</label>`;
            });
            html += '</div>';
        });
        questionsContainer.innerHTML = html;
    }

    function startStoryTimer() {
        if (storyTimerInterval) clearInterval(storyTimerInterval);
        storyStartTime = Date.now() - storyElapsedSeconds * 1000;
        storyTimerInterval = setInterval(() => {
            const now = Date.now();
            storyElapsedSeconds = (now - storyStartTime) / 1000;
            storyTimerSpan.textContent = storyElapsedSeconds.toFixed(1);
        }, 100);
    }

    storySelect.addEventListener('change', (e) => {
        loadStory(parseInt(e.target.value));
    });

    storyStartBtn.addEventListener('click', () => {
        if (storyFinished) {
            storyElapsedSeconds = 0;
            storyFinished = false;
            storyCompleted = false;
        }
        storyStartBtn.disabled = true;
        storyFinishBtn.disabled = false;
        comprehensionArea.classList.add('hidden');
        startStoryTimer();
    });

    storyFinishBtn.addEventListener('click', () => {
        if (storyCompleted) return;
        storyCompleted = true;
        clearInterval(storyTimerInterval);
        storyFinishBtn.disabled = true;
        storyFinished = true;
        comprehensionArea.classList.remove('hidden');
        comprehensionScore.innerHTML = '';
    });

    storyResetBtn.addEventListener('click', () => {
        clearInterval(storyTimerInterval);
        storyElapsedSeconds = 0;
        storyTimerSpan.textContent = '0.0';
        storyStartBtn.disabled = false;
        storyFinishBtn.disabled = true;
        comprehensionArea.classList.add('hidden');
        storyFinished = false;
        storyCompleted = false;
        loadStory(currentStoryIndex);
    });

    submitAnswersBtn.addEventListener('click', () => {
        const story = stories[currentStoryIndex];
        let correct = 0;
        story.questions.forEach((q, idx) => {
            const radios = document.getElementsByName(`q${idx}`);
            for (let i = 0; i < radios.length; i++) {
                if (radios[i].checked && parseInt(radios[i].value) === q.correct) {
                    correct++;
                    break;
                }
            }
        });
        const minutes = storyElapsedSeconds / 60;
        const wpm = minutes > 0 ? Math.round(storyWordsCount / minutes) : 0;
        comprehensionScore.innerHTML = `<span class="wpm-badge" style="background:var(--primary)">${wpm} WPM</span> &nbsp; Comprehension: ${correct}/${story.questions.length} correct.`;
    });

    tabRSVP.addEventListener('click', () => {
        tabRSVP.classList.add('active');
        tabStory.classList.remove('active');
        rsvpPanel.classList.remove('hidden');
        storyPanel.classList.add('hidden');
        stopRSVP();
    });

    tabStory.addEventListener('click', () => {
        tabStory.classList.add('active');
        tabRSVP.classList.remove('active');
        storyPanel.classList.remove('hidden');
        rsvpPanel.classList.add('hidden');
        stopRSVP();
        if (!storyTextDisplay.textContent.trim()) loadStory(0);
    });

    loadStory(0);
    resetRSVP();
})();