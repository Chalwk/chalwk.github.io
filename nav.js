// Copyright (c) 2025. Jericho Crosby (Chalwk)

class NavigationManager {
    constructor() {
        this.hamburger = null;
        this.navMobile = null;
        this.header = null;
        this.dropdownToggles = null;
        this.submenuToggles = null;

        this.init();
    }

    init() {
        setTimeout(() => {
            this.setupElements();
            this.setupHamburger();
            this.setupMobileDropdowns();
            this.setupDesktopDropdowns();
            this.setupCloseMenuOnLinkClick();
            this.setupCloseOnOutsideClick();
        }, 100);
    }

    setupElements() {
        this.hamburger = document.querySelector('.hamburger');
        this.navMobile = document.querySelector('.nav-mobile');
        this.header = document.querySelector('.header');
        this.dropdownToggles = document.querySelectorAll('.dropdown-toggle');
        this.submenuToggles = document.querySelectorAll('.submenu-toggle');
    }

    setupHamburger() {
        if (!this.hamburger || !this.navMobile) {
            console.error('Navigation elements not found');
            return;
        }

        this.hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMobileMenu();
        });
    }

    toggleMobileMenu() {
        this.hamburger.classList.toggle('active');
        this.navMobile.classList.toggle('active');
        this.header.classList.toggle('active');
        if (!this.navMobile.classList.contains('active')) {
            this.closeAllDropdowns();
        }
    }

    closeMobileMenu() {
        this.hamburger.classList.remove('active');
        this.navMobile.classList.remove('active');
        this.header.classList.remove('active');
        this.closeAllDropdowns();
    }

    setupMobileDropdowns() {
        this.dropdownToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    e.stopPropagation();

                    const dropdown = toggle.closest('.dropdown');
                    const isActive = dropdown.classList.contains('active');

                    document.querySelectorAll('.dropdown.active').forEach(other => {
                        if (other !== dropdown) {
                            other.classList.remove('active');
                        }
                    });

                    if (!isActive) {
                        dropdown.querySelectorAll('.dropdown-submenu.active').forEach(submenu => {
                            submenu.classList.remove('active');
                        });
                    }

                    dropdown.classList.toggle('active');
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

    setupDesktopDropdowns() {
        const dropdowns = document.querySelectorAll('.dropdown');

        dropdowns.forEach(dropdown => {
            dropdown.addEventListener('mouseenter', () => {
                if (window.innerWidth > 768) {
                    dropdown.classList.add('active');
                }
            });

            dropdown.addEventListener('mouseleave', () => {
                if (window.innerWidth > 768) {
                    dropdown.classList.remove('active');

                    dropdown.querySelectorAll('.dropdown-submenu.active').forEach(submenu => {
                        submenu.classList.remove('active');
                    });
                }
            });
        });

        const submenus = document.querySelectorAll('.dropdown-submenu');
        submenus.forEach(submenu => {
            submenu.addEventListener('mouseenter', () => {
                if (window.innerWidth > 768) {
                    submenu.classList.add('active');
                }
            });

            submenu.addEventListener('mouseleave', () => {
                if (window.innerWidth > 768) {
                    submenu.classList.remove('active');
                }
            });
        });
    }

    setupCloseMenuOnLinkClick() {
        document.querySelectorAll('.nav-mobile a').forEach(link => {
            const isDropdownToggle = link.classList.contains('dropdown-toggle') ||
            link.classList.contains('submenu-toggle');

            if (!isDropdownToggle) {
                link.addEventListener('click', () => {
                    if (window.innerWidth <= 768) {
                        this.closeMobileMenu();
                    }
                });
            }
        });
    }

    setupCloseOnOutsideClick() {
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                const isClickInsideMenu = this.navMobile && this.navMobile.contains(e.target);
                const isClickOnHamburger = this.hamburger && this.hamburger.contains(e.target);

                if (!isClickInsideMenu && !isClickOnHamburger && this.navMobile && this.navMobile.classList.contains('active')) {
                    this.closeMobileMenu();
                }
            }

            if (window.innerWidth > 768) {
                const isClickInsideDropdown = e.target.closest('.dropdown');

                if (!isClickInsideDropdown) {
                    document.querySelectorAll('.dropdown.active').forEach(dropdown => {
                        dropdown.classList.remove('active');
                    });
                }
            }
        });
    }

    closeAllDropdowns() {
        document.querySelectorAll('.dropdown.active').forEach(dropdown => {
            dropdown.classList.remove('active');
        });

        document.querySelectorAll('.dropdown-submenu.active').forEach(submenu => {
            submenu.classList.remove('active');
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const navigationManager = new NavigationManager();

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (window.innerWidth > 768) {
                const hamburger = document.querySelector('.hamburger');
                const navMobile = document.querySelector('.nav-mobile');
                const header = document.querySelector('.header');

                if (hamburger) hamburger.classList.remove('active');
                if (navMobile) navMobile.classList.remove('active');
                if (header) header.classList.remove('active');

                navigationManager.closeAllDropdowns();
            }
        }, 250);
    });
});