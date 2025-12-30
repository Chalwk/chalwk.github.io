// Copyright (c) 2025. Jericho Crosby (Chalwk)

document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.game-card');

    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    function animateCards() {
        cards.forEach((card, index) => {
            if (isInViewport(card) && !card.classList.contains('animated')) {
                setTimeout(() => {
                    card.classList.add('animated');
                    card.style.animationDelay = `${index * 0.1}s`;
                    card.classList.add('fade-in');
                }, 100);
            }
        });
    }

    animateCards();

    window.addEventListener('scroll', animateCards);
    window.addEventListener('resize', animateCards);
});