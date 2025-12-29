// Copyright (c) 2025. Jericho Crosby (Chalwk)

const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
    });
});

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

document.addEventListener('DOMContentLoaded', function() {
    const dropdowns = document.querySelectorAll('.dropdown');

    dropdowns.forEach(dropdown => {
        const dropbtn = dropdown.querySelector('.dropbtn');

        dropbtn.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                dropdown.classList.toggle('active');

                dropdowns.forEach(otherDropdown => {
                    if (otherDropdown !== dropdown) {
                        otherDropdown.classList.remove('active');
                    }
                });
            }
        });
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown')) {
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }
    });

    document.addEventListener('DOMContentLoaded', function() {
        const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
        const submenuToggles = document.querySelectorAll('.submenu-toggle');

        dropdownToggles.forEach(toggle => {
            toggle.addEventListener('click', function(e) {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    const dropdown = this.closest('.dropdown');
                    dropdown.classList.toggle('active');

                    dropdownToggles.forEach(otherToggle => {
                        if (otherToggle !== this) {
                            const otherDropdown = otherToggle.closest('.dropdown');
                            otherDropdown.classList.remove('active');
                        }
                    });
                }
            });
        });

        submenuToggles.forEach(toggle => {
            toggle.addEventListener('click', function(e) {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    const submenu = this.closest('.dropdown-submenu');
                    submenu.classList.toggle('active');
                }
            });
        });

        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                if (!e.target.closest('.dropdown')) {
                    dropdownToggles.forEach(toggle => {
                        const dropdown = toggle.closest('.dropdown');
                        dropdown.classList.remove('active');
                    });
                }
            }
        });
    });
});