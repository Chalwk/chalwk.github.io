// Copyright (c) 2024-2026. Jericho Crosby (Chalwk)

document.querySelectorAll('.page-nav-link').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 100,
                behavior: 'smooth'
            });
        }
    });
});

window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('.page-section');
    const navLinks = document.querySelectorAll('.page-nav-link');

    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (pageYOffset >= sectionTop - 150) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.style.background = 'var(--light)';
        link.style.color = 'var(--dark)';
        if (link.getAttribute('href') === `#${current}`) {
            link.style.background = 'var(--primary)';
            link.style.color = 'white';
        }
    });
});