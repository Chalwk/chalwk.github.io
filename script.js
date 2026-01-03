// Copyright (c) 2025-2026. Jericho Crosby (Chalwk)

document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById("toggle-projects");
    const projectsWrapper = document.getElementById("projects-wrapper");

    if (toggleBtn && projectsWrapper) {
        toggleBtn.addEventListener("click", () => {
            projectsWrapper.classList.toggle("show");

            if (projectsWrapper.classList.contains("show")) {
                toggleBtn.textContent = "Hide Projects";
            } else {
                toggleBtn.textContent = "Show Projects";
            }
        });
    }

    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
});