async function fetchGitHubStats() {
    const username = 'chalwk';
    try {
        const userResponse = await fetch(`https://api.github.com/users/${username}`);
        const userData = await userResponse.json();
        document.getElementById('github-repos').innerText = userData.public_repos;
    } catch (err) {
        console.error('Error fetching GitHub stats:', err);
    }
}

// Load stats on page load
fetchGitHubStats();