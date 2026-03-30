/* Copyright (c) 2024-2026. Jericho Crosby (Chalwk) */

(function () {
    const stories = [
        {
            title: "The Lost Key",
            text: "Elena found a small brass key under the porch. It was old and tarnished, but she felt it was important. She tried it on every lock in the house: the front door, the desk drawer, even the old chest in the attic. None worked. Disappointed, she sat on the garden wall. A glint caught her eye - a tiny lock on a weathered box half-buried in the soil. The key turned smoothly. Inside lay a bundle of letters written by her great-grandmother. Elena spent the evening reading about a love story she never knew.",
            questions: [
                {
                    q: "Where did Elena find the key?",
                    opts: ["In the attic", "Under the porch", "Inside a box", "On the garden wall"],
                    correct: 1
                },
                {
                    q: "What was inside the box?",
                    opts: ["Jewellery", "Gold coins", "Letters", "A photograph"],
                    correct: 2
                },
                {
                    q: "Who wrote the letters?",
                    opts: ["Elena's mother", "Her great-grandmother", "A stranger", "Her grandfather"],
                    correct: 1
                }
            ]
        },
        {
            title: "The Birthday Surprise",
            text: "Leo saved his allowance for months. He wanted to buy his mother a beautiful brooch she had seen in the antique shop. The day before her birthday, he walked to the store with his pocket full of coins and notes. The brooch was still there, glowing under the glass. The shopkeeper smiled and wrapped it in soft paper. On the morning of the birthday, Leo placed the small package beside her breakfast plate. When his mother opened it, her eyes filled with tears. She hugged him tightly and whispered that it was the best gift ever.",
            questions: [
                {q: "What did Leo want to buy?", opts: ["A necklace", "A brooch", "A ring", "A watch"], correct: 1},
                {q: "Where did he buy it?", opts: ["A mall", "An antique shop", "A market", "Online"], correct: 1},
                {
                    q: "How did his mother react?",
                    opts: ["She was surprised but quiet", "She cried and hugged him", "She asked for the receipt", "She put it away"],
                    correct: 1
                }
            ]
        },
        {
            title: "Mountain Hike",
            text: "Three friends - Mia, Carlos, and Jin - decided to hike the Eagle Peak trail. They started at sunrise, carrying water and sandwiches. The path was steep, but the views got better with every step. After two hours they reached a rocky outcrop. Below them lay a valley covered in mist, and above, an eagle circled. They rested, ate their lunch, and took photos. On the way down, Carlos slipped and twisted his ankle. Mia and Jin helped him hobble slowly. They reached the car just as it began to rain. Despite the pain, Carlos grinned and said, 'We'll be back next month.'",
            questions: [
                {q: "How many friends went hiking?", opts: ["Two", "Three", "Four", "Five"], correct: 1},
                {
                    q: "What happened to Carlos?",
                    opts: ["He got lost", "He twisted his ankle", "He ran out of water", "He saw a bear"],
                    correct: 1
                },
                {q: "What did they see above them?", opts: ["A hawk", "A plane", "An eagle", "Clouds"], correct: 2}
            ]
        },
        {
            title: "The Garden Secret",
            text: "Maya's grandmother always spent hours in her garden, tending to roses and lavender. When she passed away, she left Maya a small key with a note: 'Dig where the sunflowers bloom.' Maya waited until spring, then took a shovel to the back corner where sunflowers had grown the year before. About two feet down, she hit a metal box. Inside was a stack of letters tied with ribbon and a faded photograph of a young man in uniform. Maya learned that her grandmother had a sweetheart during the war who never returned. The garden held her memories.",
            questions: [
                {
                    q: "What did Maya's grandmother leave her?",
                    opts: ["A diary", "A key and a note", "A ring", "A flower pot"],
                    correct: 1
                },
                {
                    q: "Where did Maya dig?",
                    opts: ["Under the rose bush", "Where sunflowers bloomed", "Near the fence", "By the lavender"],
                    correct: 1
                },
                {
                    q: "What was in the box?",
                    opts: ["Jewelry and coins", "Letters and a photograph", "A medal and a flag", "Seeds and soil"],
                    correct: 1
                }
            ]
        },
        {
            title: "The Lost Puppy",
            text: "On a rainy Tuesday, Sam heard a whimpering sound coming from the bushes near his garage. He parted the wet leaves and found a small, shivering puppy with a muddy collar but no tag. Sam brought it inside, dried it off, and made a bed from an old blanket. He put up posters around the neighborhood. Three days later, a girl named Lily called, crying with relief. The puppy, named Buster, had slipped out of her yard during the storm. Sam and Lily became friends, and Buster visited often.",
            questions: [
                {
                    q: "Where did Sam find the puppy?",
                    opts: ["In the street", "In bushes near his garage", "At the park", "Under his porch"],
                    correct: 1
                },
                {
                    q: "How did Lily find out about the puppy?",
                    opts: ["She saw a poster", "Sam called her", "The puppy ran home", "A neighbor told her"],
                    correct: 0
                },
                {q: "What was the puppy's name?", opts: ["Sam", "Buster", "Lily", "Tag"], correct: 1}
            ]
        },
        {
            title: "The Science Fair",
            text: "For the school science fair, Priya wanted to build a volcano that erupted with colored foam. She mixed baking soda, vinegar, and red food coloring, but the eruption was weak. Her friend Omar suggested adding dish soap. The next attempt produced a spectacular red fountain that flowed down the sides. The judges were impressed by her persistence and awarded her second place. Priya learned that small changes can make a big difference.",
            questions: [
                {
                    q: "What was Priya's science fair project?",
                    opts: ["A solar system model", "A volcano", "A robot", "A plant experiment"],
                    correct: 1
                },
                {
                    q: "What did Omar suggest adding?",
                    opts: ["More vinegar", "Baking soda", "Dish soap", "Salt"],
                    correct: 2
                },
                {q: "What place did Priya win?", opts: ["First", "Second", "Third", "Honorable mention"], correct: 1}
            ]
        },
        {
            title: "The Old Violin",
            text: "In his grandfather's attic, Liam found a dusty violin case. Inside was a beautiful instrument with a note: 'For Liam, may you find your music.' Liam had never played before, but he signed up for lessons at school. At first, the sounds were screechy, but he practiced every day. By the end of the year, he could play a simple melody. During a family gathering, he performed the song for his grandparents. His grandfather's eyes glistened as he whispered, 'That was your great-grandmother's violin.'",
            questions: [
                {
                    q: "Where did Liam find the violin?",
                    opts: ["In a music shop", "In his grandfather's attic", "At a garage sale", "In school"],
                    correct: 1
                },
                {
                    q: "What did the note say?",
                    opts: ["'For Liam, may you find your music.'", "'This is very old.'", "'Learn to play.'", "'From Grandma.'"],
                    correct: 0
                },
                {
                    q: "Who originally owned the violin?",
                    opts: ["Liam's grandfather", "A famous musician", "Liam's great-grandmother", "A neighbor"],
                    correct: 2
                }
            ]
        },
        {
            title: "The Mysterious Map",
            text: "While cleaning out her late uncle's study, Sofia discovered a rolled-up parchment behind a bookshelf. It was a hand-drawn map of the town with an X marked in the park. Curious, she went to the spot and found a small metal box buried under an oak tree. Inside were old coins and a letter addressed to her uncle from a childhood friend. The letter mentioned a promise to bury a time capsule together. Sofia decided to add a letter of her own and rebury it for future discovery.",
            questions: [
                {
                    q: "Where did Sofia find the map?",
                    opts: ["In a drawer", "Behind a bookshelf", "Under the bed", "In the attic"],
                    correct: 1
                },
                {
                    q: "What was marked on the map?",
                    opts: ["A house", "A river", "An X in the park", "A school"],
                    correct: 2
                },
                {
                    q: "What did Sofia do with the time capsule?",
                    opts: ["Kept the coins", "Gave it to a museum", "Added a letter and reburied it", "Threw it away"],
                    correct: 2
                }
            ]
        }
    ];

    const rsvpStories = [
        {
            title: "The Old Mansion",
            text: "The old mansion stood on a hill overlooking the small town of Millbrook. For decades, locals whispered about the lights that flickered in its windows on stormy nights. No one dared to approach, until a young historian named Claire decided to uncover the truth. She borrowed the keys from the historical society and walked up the overgrown path on a crisp autumn morning. The door groaned as it opened, revealing a grand hall draped in dusty cobwebs. Claire's footsteps echoed on the marble floor. She found a library with books still on the shelves, a kitchen with rusty pots, and a bedroom with a four-poster bed. In the attic, she discovered a trunk filled with letters and photographs. They told the story of Eleanor, a woman who had lived there alone after her fiancé perished in the war. Eleanor had kept the lights burning every night hoping he would return. Claire felt a deep sadness but also admiration. She decided to write an article about Eleanor, ensuring her story would not be forgotten. The town eventually restored the mansion as a small museum, and Claire became its first curator. Visitors came from far away, and on some evenings, they swore they could still see a faint light in the attic window, as if Eleanor's spirit finally found peace. The museum became a beloved landmark, and Claire often gave tours, sharing Eleanor's story with anyone who would listen. She felt a connection to the past and a responsibility to preserve it for future generations. Years later, when Claire retired, she donated all her notes and research to the town archive, ensuring that Eleanor's legacy would live on. The mansion, now a symbol of resilience and memory, continued to attract visitors from all over the world, each leaving with a piece of its hauntingly beautiful history."
        },
        {
            title: "The Lost City of Z",
            text: "Deep in the Amazon rainforest, legends spoke of a lost city of gold, known as El Dorado. For centuries, explorers and adventurers risked their lives to find it, but none succeeded. In the early 20th century, a British explorer named Percy Fawcett became obsessed with the idea. He made several expeditions into the jungle, each time returning with tales of strange creatures and hostile tribes. On his final journey in 1925, he vanished without a trace, along with his son and a friend. Many believed they were killed by natives or succumbed to disease. But others thought Fawcett had discovered the city and chosen to stay. Decades later, archaeologists using satellite imagery found evidence of ancient settlements deep in the rainforest, suggesting that Fawcett might have been right all along. The mystery of his disappearance remains unsolved, but his story inspired countless others to seek the truth. The jungle, vast and unforgiving, keeps its secrets well, and perhaps some mysteries are meant to remain hidden forever. The legend of the lost city continues to captivate the imagination, a testament to humanity's enduring quest for discovery and the unknown."
        },
        {
            title: "The Voyage of the Dawn Treader",
            text: "In the magical land of Narnia, King Caspian built a great ship called the Dawn Treader to sail east in search of seven lost lords. He was joined by Edmund and Lucy Pevensie, their cousin Eustace, and a talking mouse named Reepicheep. Their journey took them to mysterious islands, each with its own wonders and dangers. They encountered sea serpents, invisible warriors, and a dragon that turned out to be Eustace transformed by greed. They met a sorcerer's island where dreams came true, and a pool that turned everything to gold. Finally, they reached the edge of the world, where the sky met the sea. Reepicheep, true to his heart's desire, paddled his small coracle into the Utter East, never to return. The others sailed back to Narnia, forever changed by their adventures. The voyage taught them about courage, friendship, and the importance of seeking what lies beyond the horizon. It was a journey that would be told in Narnian tales for generations, a reminder that the greatest treasures are not gold or jewels, but the memories we create and the people we love."
        },
        {
            title: "The Life of Leonardo da Vinci",
            text: "Leonardo da Vinci was born in 1452 in the small town of Vinci, Italy. From an early age, he showed a keen interest in art, science, and nature. He apprenticed under the artist Verrocchio in Florence, where he honed his skills in painting and sculpture. His most famous works include the Mona Lisa and The Last Supper, but his genius extended far beyond art. He filled notebooks with anatomical drawings, engineering designs, and observations of the natural world. He envisioned flying machines, armored vehicles, and even a primitive form of the helicopter. Despite his many talents, Leonardo struggled to complete many of his projects, often leaving them unfinished. He spent his later years in France, under the patronage of King Francis I, where he continued to sketch and invent until his death in 1519. His legacy lives on not only in his art but in his insatiable curiosity and his belief that knowledge is the key to understanding the world. Leonardo da Vinci remains the quintessential Renaissance man, a symbol of human potential and the power of imagination."
        },
        {
            title: "The History of the Silk Road",
            text: "The Silk Road was not a single road but a network of trade routes connecting China to the Mediterranean. It flourished for over 1,500 years, from around 130 BCE to the 1450s CE. Merchants carried silk, spices, tea, and porcelain from the East, while gold, silver, glassware, and wool traveled from the West. But the Silk Road was more than a trade route; it was a conduit for ideas, religions, and cultures. Buddhism spread from India to China along these paths, and later, Islam and Christianity also found their way. Technologies such as papermaking, gunpowder, and the compass were transmitted across continents. The route was perilous, crossing deserts, mountains, and bandit-infested plains. Caravanserais provided shelter and rest for travelers. The Silk Road declined with the rise of maritime trade and the fall of the Mongol Empire, but its impact on world history is immeasurable. It fostered the exchange of knowledge and goods that shaped civilizations, and its legacy can still be seen today in the cultural connections between East and West."
        }
    ];

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

    const rsvpSelect = document.createElement('select');
    rsvpSelect.id = 'rsvpStorySelect';
    rsvpSelect.style.marginBottom = '10px';
    rsvpSelect.style.width = '100%';
    rsvpSelect.style.padding = '5px';
    rsvpPanel.insertBefore(rsvpSelect, rsvpPanel.firstChild);

    let rsvpWords = [];
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

    function populateRsvpSelect() {
        rsvpSelect.innerHTML = '';
        rsvpStories.forEach((story, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = story.title;
            rsvpSelect.appendChild(option);
        });
    }

    function loadRsvpStory(index) {
        stopRSVP();
        const story = rsvpStories[index];
        rsvpWords = story.text.split(/\s+/);
        currentIdx = 0;
        currentWpm = BASE_WPM;
        liveWpmSpan.textContent = currentWpm;
        wordCountSpan.textContent = '0';
        totalWordsSpan.textContent = rsvpWords.length;
        if (rsvpWords.length) {
            wordDisplaySpan.textContent = rsvpWords[0];
        } else {
            wordDisplaySpan.textContent = '⟵ no words';
        }
    }

    populateRsvpSelect();
    loadRsvpStory(0);

    rsvpSelect.addEventListener('change', (e) => {
        loadRsvpStory(parseInt(e.target.value));
    });

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

    function populateStorySelect() {
        storySelect.innerHTML = '';
        stories.forEach((story, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = story.title;
            storySelect.appendChild(option);
        });
    }

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
            html += `<div class="question-item"><p>${idx + 1}. ${q.q}</p>`;
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

    populateStorySelect();
    loadStory(0);
    resetRSVP();
})();