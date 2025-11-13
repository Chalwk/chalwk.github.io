// Mobile Navigation
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

// Close mobile menu when clicking a link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
    });
});

// Projects Toggle
document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById("toggle-projects");
    const projectsWrapper = document.getElementById("projects-wrapper");

    toggleBtn.addEventListener("click", () => {
        projectsWrapper.classList.toggle("show");

        if (projectsWrapper.classList.contains("show")) {
            toggleBtn.textContent = "Hide Projects";
        } else {
            toggleBtn.textContent = "Show Projects";
        }
    });
});