/*
Copyright (c) 2025-2026. Jericho Crosby (Chalwk)

Giggle Factory - JavaScript
*/

const jokeText = document.getElementById('jokeText');
const newJokeBtn = document.getElementById('newJokeBtn');
const copyBtn = document.getElementById('copyBtn');
const tweetBtn = document.getElementById('tweetBtn');
const fallbackBtn = document.getElementById('fallbackBtn');
const status = document.getElementById('status');
const jokeType = document.getElementById('jokeType');
const jokeSource = document.getElementById('jokeSource');

const FALLBACK_JOKES = [
    "I told my computer I needed a break, and it said 'No problem - I'll go to sleep.'",
    "Why do programmers prefer dark mode? Because light attracts bugs.",
    "Why did the scarecrow win an award? He was outstanding in his field.",
    "I had a joke about UDP, but I'm not sure if you got it.",
    "Parallel lines have so much in common. It's a shame they'll never meet."
];

let lastJoke = '';
let currentApiIndex = 0;

const JOKE_APIS = [
    {
        name: 'Dad Jokes',
        source: 'icanhazdadjoke',
        url: 'https://icanhazdadjoke.com/',
        headers: { Accept: 'application/json' },
        parser: (data) => data.joke
    },
    {
        name: 'Chuck Norris',
        source: 'api.chucknorris.io',
        url: 'https://api.chucknorris.io/jokes/random',
        headers: { Accept: 'application/json' },
        parser: (data) => data.value
    },
    {
        name: 'JokeAPI',
        source: 'jokeapi.dev',
        url: 'https://v2.jokeapi.dev/joke/Any?type=single',
        headers: { Accept: 'application/json' },
        parser: (data) => data.joke || `${data.setup} ${data.delivery}`
    },
    {
        name: 'Programming',
        source: 'jokeapi.dev',
        url: 'https://v2.jokeapi.dev/joke/Programming?type=single',
        headers: { Accept: 'application/json' },
        parser: (data) => data.joke || `${data.setup} ${data.delivery}`
    },
    {
        name: 'Official Joke API',
        source: 'official-joke-api.appspot.com',
        url: 'https://official-joke-api.appspot.com/jokes/random',
        headers: { Accept: 'application/json' },
        parser: (data) => `${data.setup} ${data.punchline}`
    },
    {
        name: 'Geek Jokes',
        source: 'geek-jokes.sameerkumar.website',
        url: 'https://geek-jokes.sameerkumar.website/api?format=json',
        headers: { Accept: 'application/json' },
        parser: (data) => data.joke
    },
    {
        name: 'Random Jokes',
        source: 'sv443.net/jokeapi',
        url: 'https://v2.jokeapi.dev/joke/Miscellaneous,Dark,Any?type=single',
        headers: { Accept: 'application/json' },
        parser: (data) => data.joke || `${data.setup} ${data.delivery}`
    }
];

function cycleApi() {
    currentApiIndex = (currentApiIndex + 1) % JOKE_APIS.length;
    return JOKE_APIS[currentApiIndex];
}

function getCurrentApi() {
    return JOKE_APIS[currentApiIndex];
}

async function fetchJoke() {
    const api = getCurrentApi();
    setStatus(`fetching from ${api.source}...`);
    jokeType.textContent = api.name.toLowerCase();
    jokeSource.textContent = api.source;

    try {
        const res = await fetch(api.url, {
            headers: { ...api.headers, "User-Agent": "GiggleFactory/1.0" }
        });

        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const data = await res.json();
        let text = api.parser(data);

        if (!text || text.trim() === '') {
            throw new Error('Empty joke response');
        }

        text = text.trim();
        showJoke(text);
        setStatus(`from ${api.source}`);
    } catch (err) {
        console.warn(`Fetch from ${api.source} failed:`, err);

        const nextApi = cycleApi();
        setStatus(`${api.source} failed, trying ${nextApi.source}`);

        try {
            const res = await fetch(nextApi.url, {
                headers: { ...nextApi.headers, "User-Agent": "GiggleFactory/1.0" }
            });

            if (!res.ok) throw new Error(`API error: ${res.status}`);

            const data = await res.json();
            let text = nextApi.parser(data);

            if (!text || text.trim() === '') {
                throw new Error('Empty joke response');
            }

            text = text.trim();
            showJoke(text);
            jokeType.textContent = nextApi.name.toLowerCase();
            jokeSource.textContent = nextApi.source;
            setStatus(`from ${nextApi.source} (fallback)`);
        } catch (secondErr) {
            console.warn(`Fallback API also failed:`, secondErr);
            setStatus('all APIs failed, using local');
            const local = FALLBACK_JOKES[Math.floor(Math.random() * FALLBACK_JOKES.length)];
            jokeType.textContent = 'local fallback';
            jokeSource.textContent = 'local';
            showJoke(local);
        }
    }
}

function showJoke(text) {
    lastJoke = text;
    jokeText.textContent = text;
}

function setStatus(txt) {
    status.textContent = txt;
}

newJokeBtn.addEventListener('click', fetchJoke);

newJokeBtn.addEventListener('dblclick', () => {
    cycleApi();
    fetchJoke();
});

fallbackBtn.addEventListener('click', () => {
    const local = FALLBACK_JOKES[Math.floor(Math.random() * FALLBACK_JOKES.length)];
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

window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'j') {
        fetchJoke();
    }
    if (e.key.toLowerCase() === 'a') {
        cycleApi();
        fetchJoke();
    }
});

fetchJoke();