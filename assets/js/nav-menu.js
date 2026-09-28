// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

document.addEventListener('DOMContentLoaded', function () {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const header = document.querySelector('header.header');
    if (header) {
        // desktop dropdowns: toggle on click (not hover)
        const desktopDropdowns = header.querySelectorAll('.nav-desktop .dropdown');
        desktopDropdowns.forEach(dropdown => {
            const toggle = dropdown.querySelector('.dropdown-toggle');
            const menu = dropdown.querySelector('.dropdown-menu');

            toggle.addEventListener('click', function (e) {
                if (window.innerWidth <= 768) return;
                e.stopPropagation();
                const isExpanded = this.getAttribute('aria-expanded') === 'true';
                this.setAttribute('aria-expanded', !isExpanded);

                // close other dropdowns
                desktopDropdowns.forEach(other => {
                    if (other !== dropdown) {
                        other.querySelector('.dropdown-toggle').setAttribute('aria-expanded', 'false');
                        other.querySelector('.dropdown-menu').classList.remove('active');
                    }
                });

                menu.classList.toggle('active');
            });
        });

        // click outside closes all desktop dropdowns
        document.addEventListener('click', function (e) {
            if (window.innerWidth <= 768) return;
            if (!e.target.closest('.dropdown')) {
                desktopDropdowns.forEach(dropdown => {
                    dropdown.querySelector('.dropdown-toggle').setAttribute('aria-expanded', 'false');
                    dropdown.querySelector('.dropdown-menu').classList.remove('active');
                });
            }
        });

        // close desktop dropdowns with Escape
        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape' || window.innerWidth <= 768) return;
            desktopDropdowns.forEach(dropdown => {
                const toggle = dropdown.querySelector('.dropdown-toggle');
                const menu = dropdown.querySelector('.dropdown-menu');
                toggle.setAttribute('aria-expanded', 'false');
                menu.classList.remove('active');
            });
        });

        // submenu positioning: avoid going off-screen right
        function adjustSubmenuPosition(submenu) {
            if (window.innerWidth <= 768) return;
            const parentLi = submenu.closest('.dropdown-submenu');
            if (!parentLi) return;
            const rect = submenu.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            if (rect.right > viewportWidth) {
                parentLi.classList.add('right-align');
            } else {
                parentLi.classList.remove('right-align');
            }
        }

        const desktopSubmenuItems = header.querySelectorAll('.nav-desktop .dropdown-submenu');
        desktopSubmenuItems.forEach(item => {
            const submenu = item.querySelector('.submenu');
            if (submenu) {
                item.addEventListener('mouseenter', () => adjustSubmenuPosition(submenu));
                item.addEventListener('mouseleave', () => {
                    item.classList.remove('right-align');
                });
            }
        });

        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (window.innerWidth > 768) {
                    desktopSubmenuItems.forEach(item => {
                        if (item.matches(':hover')) {
                            const submenu = item.querySelector('.submenu');
                            if (submenu) adjustSubmenuPosition(submenu);
                        }
                    });
                }
            }, 100);
        });
    }

    // mobile menu hamburger toggle
    const hamburger = document.querySelector('.hamburger');
    const navMobile = document.querySelector('.nav-mobile');
    if (hamburger && navMobile) {
        const closeMobileMenu = () => {
            hamburger.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
            navMobile.classList.remove('active');
            document.body.classList.remove('menu-open');
        };

        hamburger.addEventListener('click', function () {
            requestAnimationFrame(() => {
                const isExpanded = this.getAttribute('aria-expanded') === 'true';
                this.setAttribute('aria-expanded', !isExpanded);
                this.classList.toggle('active');
                navMobile.classList.toggle('active');
                document.body.classList.toggle('menu-open');
            });
        });

        // mobile dropdowns: expand/collapse on click
        const mobileDropdowns = navMobile.querySelectorAll('.dropdown');
        mobileDropdowns.forEach(dropdown => {
            const toggle = dropdown.querySelector('.dropdown-toggle');
            if (toggle) {
                toggle.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const parentLi = this.closest('li');
                    parentLi.classList.toggle('active');
                });
            }
        });

        // mobile submenus
        const mobileSubmenus = navMobile.querySelectorAll('.dropdown-submenu');
        mobileSubmenus.forEach(submenu => {
            const toggle = submenu.querySelector('.submenu-toggle');
            if (toggle) {
                toggle.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    submenu.classList.toggle('active');
                });
            }
        });

        // close mobile menu when any link is clicked
        navMobile.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });

        // ESC key closes mobile menu and returns focus to hamburger
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
                closeMobileMenu();
                hamburger.focus();
            }
        });
    }

    // scroll-to-top button: appears after scrolling
    const scrollBtn = document.createElement('button');
    scrollBtn.id = 'scrollToTopBtn';
    scrollBtn.className = 'scroll-to-top';
    scrollBtn.type = 'button';
    scrollBtn.setAttribute('aria-label', 'Scroll to top');
    scrollBtn.setAttribute('tabindex', '-1');
    scrollBtn.setAttribute('aria-hidden', 'true');
    scrollBtn.innerHTML = '<i class="fas fa-chevron-up" aria-hidden="true"></i>';
    document.body.appendChild(scrollBtn);

    let scrollTicking = false;
    function updateScrollButton() {
        const isVisible = window.pageYOffset > 300;
        scrollBtn.classList.toggle('visible', isVisible);
        scrollBtn.setAttribute('tabindex', isVisible ? '0' : '-1');
        scrollBtn.setAttribute('aria-hidden', String(!isVisible));
        scrollTicking = false;
    }

    window.addEventListener('scroll', () => {
        if (scrollTicking) return;
        scrollTicking = true;
        window.requestAnimationFrame(updateScrollButton);
    }, { passive: true });
    updateScrollButton();

    scrollBtn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        this.blur();
    });

    // trap focus inside mobile menu when open
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab' || !document.body.classList.contains('menu-open')) return;
        const navMobile = document.querySelector('.nav-mobile');
        if (!navMobile) return;

        const focusableElements = navMobile.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
        }
    });
});