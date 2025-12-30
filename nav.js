// Copyright (c) 2025. Jericho Crosby (Chalwk)

class NavigationManager {
    constructor() {
        this.hamburger = document.querySelector('.hamburger');
        this.navLinks = document.querySelector('.nav-links');
        this.dropdowns = document.querySelectorAll('.dropdown');
        this.dropdownToggles = document.querySelectorAll('.dropdown-toggle');
        this.submenuToggles = document.querySelectorAll('.submenu-toggle');

        this.init();
    }

    init() {
        this.setupHamburger();
        this.setupDropdowns();
        this.closeDropdownsOnClickOutside();
    }

    setupHamburger() {
        if (!this.hamburger || !this.navLinks) return;

        this.hamburger.addEventListener('click', () => {
            this.hamburger.classList.toggle('active');
            this.navLinks.classList.toggle('active');
        });

        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                this.hamburger.classList.remove('active');
                this.navLinks.classList.remove('active');

                if (window.innerWidth <= 768) {
                    this.dropdowns.forEach(dropdown => {
                        dropdown.classList.remove('active');
                    });
                    document.querySelectorAll('.dropdown-submenu').forEach(submenu => {
                        submenu.classList.remove('active');
                    });
                }
            });
        });
    }

    setupDropdowns() {
        this.dropdowns.forEach(dropdown => {
            dropdown.addEventListener('mouseenter', () => {
                if (window.innerWidth > 768) {
                    dropdown.classList.add('active');
                }
            });

            dropdown.addEventListener('mouseleave', () => {
                if (window.innerWidth > 768) {
                    dropdown.classList.remove('active');
                }
            });
        });

        this.dropdownToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    const dropdown = toggle.closest('.dropdown');
                    const isActive = dropdown.classList.contains('active');

                    this.dropdowns.forEach(d => {
                        if (d !== dropdown) {
                            d.classList.remove('active');
                        }
                    });

                    dropdown.classList.toggle('active');

                    if (!isActive) {
                        const submenu = dropdown.querySelector('.dropdown-submenu');
                        if (submenu) {
                            submenu.classList.remove('active');
                        }
                    }
                }
            });
        });

        this.submenuToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    e.stopPropagation();
                    const submenu = toggle.closest('.dropdown-submenu');
                    submenu.classList.toggle('active');
                }
            });
        });
    }

    closeDropdownsOnClickOutside() {
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown') && !e.target.closest('.hamburger')) {
                this.dropdowns.forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
                document.querySelectorAll('.dropdown-submenu').forEach(submenu => {
                    submenu.classList.remove('active');
                });

                if (window.innerWidth <= 768) {
                    this.hamburger?.classList.remove('active');
                    this.navLinks?.classList.remove('active');
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new NavigationManager();
});