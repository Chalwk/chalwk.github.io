/*
Copyright (c) 2025-2026. Jericho Crosby (Chalwk)

nav.js (script shared between pages)
*/

class NavigationManager {
    constructor() {
        this.hamburger = null;
        this.navMobile = null;
        this.header = null;
        this.dropdownToggles = null;
        this.submenuToggles = null;
        this.submenus = null;
        this.isDesktop = window.innerWidth > 768;
        this.resizeTimeout = null;
        this.init();
    }

    init() {
        setTimeout(() => {
            this.setupElements();
            this.setupHamburger();
            this.setupMobileDropdowns();
            this.setupDesktopDropdowns();
            this.setupSubmenuResponsive();
            this.setupCloseMenuOnLinkClick();
            this.setupCloseOnOutsideClick();
            this.setupResizeHandler();
        }, 100);
    }

    setupElements() {
        this.hamburger = document.querySelector('.hamburger');
        this.navMobile = document.querySelector('.nav-mobile');
        this.header = document.querySelector('.header');
        this.dropdownToggles = document.querySelectorAll('.dropdown-toggle');
        this.submenuToggles = document.querySelectorAll('.submenu-toggle');
        this.submenus = document.querySelectorAll('.dropdown-submenu');
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
                if (this.isDesktop) {
                    dropdown.classList.add('active');
                }
            });

            dropdown.addEventListener('mouseleave', () => {
                if (this.isDesktop) {
                    dropdown.classList.remove('active');

                    dropdown.querySelectorAll('.dropdown-submenu.active').forEach(submenu => {
                        submenu.classList.remove('active');
                    });
                }
            });
        });

        this.submenus.forEach(submenu => {
            submenu.addEventListener('mouseenter', () => {
                if (this.isDesktop) {
                    submenu.classList.add('active');
                    this.adjustSubmenuPosition(submenu);
                }
            });

            submenu.addEventListener('mouseleave', () => {
                if (this.isDesktop) {
                    submenu.classList.remove('active');
                }
            });
        });
    }

    setupSubmenuResponsive() {
        if (this.isDesktop) {
            this.submenus.forEach(submenu => {
                if (submenu.classList.contains('active')) {
                    this.adjustSubmenuPosition(submenu);
                }
            });
        }
    }

    adjustSubmenuPosition(submenu) {
        if (!this.isDesktop) return;

        const submenuEl = submenu.querySelector('.submenu');
        if (!submenuEl) return;

        submenuEl.classList.remove('position-left');

        const viewportWidth = window.innerWidth;
        const submenuRect = submenuEl.getBoundingClientRect();
        const parentRect = submenu.getBoundingClientRect();

        const wouldOverflowRight = parentRect.right + submenuRect.width > viewportWidth;

        if (wouldOverflowRight) {
            submenuEl.classList.add('position-left');
        }
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

            if (this.isDesktop) {
                const isClickInsideDropdown = e.target.closest('.dropdown');

                if (!isClickInsideDropdown) {
                    document.querySelectorAll('.dropdown.active').forEach(dropdown => {
                        dropdown.classList.remove('active');
                    });
                }
            }
        });
    }

    setupResizeHandler() {
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);

            this.resizeTimeout = setTimeout(() => {
                const newIsDesktop = window.innerWidth > 768;

                if (this.isDesktop !== newIsDesktop) {
                    this.isDesktop = newIsDesktop;

                    if (!newIsDesktop) {
                        const hamburger = document.querySelector('.hamburger');
                        const navMobile = document.querySelector('.nav-mobile');
                        const header = document.querySelector('.header');

                        if (hamburger) hamburger.classList.remove('active');
                        if (navMobile) navMobile.classList.remove('active');
                        if (header) header.classList.remove('active');

                        this.closeAllDropdowns();

                        document.querySelectorAll('.submenu.position-left').forEach(submenu => {
                            submenu.classList.remove('position-left');
                        });
                    } else {
                        this.submenus.forEach(submenu => {
                            if (submenu.classList.contains('active')) {
                                this.adjustSubmenuPosition(submenu);
                            }
                        });
                    }
                } else if (newIsDesktop) {
                    this.submenus.forEach(submenu => {
                        if (submenu.classList.contains('active')) {
                            this.adjustSubmenuPosition(submenu);
                        }
                    });
                }
            }, 250);
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
    new NavigationManager();
});