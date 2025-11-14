const jokeText = document.getElementById('jokeText');
const newJokeBtn = document.getElementById('newJokeBtn');
const copyBtn = document.getElementById('copyBtn');
const tweetBtn = document.getElementById('tweetBtn');
const fallbackBtn = document.getElementById('fallbackBtn');
const status = document.getElementById('status');
const jokeType = document.getElementById('jokeType');
const jokeSource = document.getElementById('jokeSource');

const FALLBACK_JOKES = [
    "I told my computer I needed a break, and it said 'No problem - I’ll go to sleep.'",
    "Why do programmers prefer dark mode? Because light attracts bugs.",
    "Why did the scarecrow win an award? He was outstanding in his field.",
    "I had a joke about UDP, but I’m not sure if you got it.",
    "Parallel lines have so much in common. It’s a shame they’ll never meet."
];

let lastJoke = '';

async function fetchJoke() {
    setStatus('fetching...');
    jokeType.textContent = 'dad joke';
    jokeSource.textContent = 'icanhazdadjoke';

    try {
        const res = await fetch('https://icanhazdadjoke.com/', {
            headers: { Accept: 'application/json', "User-Agent": 'GiggleFactory/1.0' }
        });
        if (!res.ok) throw new Error('Bad response');
        const data = await res.json();
        const text = data && data.joke ? data.joke.trim() : FALLBACK_JOKES[Math.floor(Math.random()*FALLBACK_JOKES.length)];
        showJoke(text);
        setStatus('fresh from the web');
    } catch (err) {
        console.warn('Fetch failed', err);
        setStatus('offline, using local fallback');
        const local = FALLBACK_JOKES[Math.floor(Math.random()*FALLBACK_JOKES.length)];
        jokeType.textContent = 'local fallback';
        jokeSource.textContent = 'local';
        showJoke(local);
    }
}

function showJoke(text) {
    lastJoke = text;
    jokeText.textContent = text;
}

function setStatus(txt){
    status.textContent = txt;
}

newJokeBtn.addEventListener('click', fetchJoke);
fallbackBtn.addEventListener('click', () => {
    const local = FALLBACK_JOKES[Math.floor(Math.random()*FALLBACK_JOKES.length)];
    jokeType.textContent = 'local fallback';
    jokeSource.textContent = 'local';
    showJoke(local);
    setStatus('served from local stash');
});

copyBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(lastJoke || jokeText.textContent);
        setStatus('copied to clipboard');
    } catch (err) {
        setStatus('copy failed');
    }
});

tweetBtn.addEventListener('click', () => {
    const text = encodeURIComponent(lastJoke || jokeText.textContent);
    const url = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(url, '_blank');
});

// keyboard shortcut J for new joke
window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'j') {
        fetchJoke();
    }
});

// initial joke
fetchJoke();