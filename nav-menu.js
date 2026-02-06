document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('header.header');
    const pathSegments = window.location.pathname.split('/');
    const privateWebsiteIndex = pathSegments.indexOf('private-website');
    let basePath = '/';

    if (privateWebsiteIndex !== -1) {
        basePath = '/' + pathSegments.slice(1, privateWebsiteIndex + 1).join('/') + '/';
    }

    if (header) {
        const headerHTML = `
<div class="container">
    <a class="logo" href="${basePath}index.html" aria-label="Home - Jericho's Portfolio">
        <i class="fas fa-code"></i> Jericho
    </a>

    <nav class="nav-desktop" aria-label="Main Navigation">
        <ul class="nav-links">
            <li><a href="${basePath}index.html#about">About</a></li>
            <li><a href="${basePath}browser-apps/apps_and_tools.html">Apps & Tools</a></li>
            <li class="dropdown">
                <button class="dropdown-toggle" aria-expanded="false" aria-haspopup="true">
                    Other Stuff <i class="fas fa-chevron-down" aria-hidden="true"></i>
                </button>
                <ul class="dropdown-menu" role="menu">
                    <li role="none"><a href="https://chalwk.github.io/CPAS/" role="menuitem">CPAS</a></li>
                    <li class="dropdown-submenu" role="none">
                        <button class="submenu-toggle" aria-expanded="false">
                            Education <i class="fas fa-chevron-right" aria-hidden="true"></i>
                        </button>
                        <ul class="submenu" role="menu">
                            <li role="none"><a href="${basePath}education/understanding-autism.html" role="menuitem">Understanding Autism</a></li>
                        </ul>
                    </li>
                </ul>
            </li>
        </ul>
    </nav>

    <button class="hamburger" aria-label="Toggle menu" aria-expanded="false">
        <span></span>
        <span></span>
        <span></span>
    </button>

    <nav class="nav-mobile" aria-label="Mobile Navigation">
        <ul class="nav-mobile-links">
            <li><a href="${basePath}index.html#about">About</a></li>
            <li><a href="${basePath}browser-apps/apps_and_tools.html">Apps & Tools</a></li>
            <li class="dropdown">
                <button class="dropdown-toggle">
                    Other Stuff
                    <i class="fas fa-chevron-down"></i>
                </button>
                <ul class="dropdown-menu">
                    <li><a href="https://chalwk.github.io/CPAS/">CPAS</a></li>
                    <li class="dropdown-submenu">
                        <button class="submenu-toggle">
                            Education
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <ul class="submenu">
                            <li><a href="${basePath}education/understanding-autism.html">Understanding Autism</a></li>
                        </ul>
                    </li>
                </ul>
            </li>
        </ul>
    </nav>
</div>`;

        header.innerHTML = headerHTML;

        const desktopDropdowns = header.querySelectorAll('.nav-desktop .dropdown');
        desktopDropdowns.forEach(dropdown => {
            const toggle = dropdown.querySelector('.dropdown-toggle');
            const menu = dropdown.querySelector('.dropdown-menu');

            toggle.addEventListener('click', function(e) {
                if (window.innerWidth <= 768) return; // Only on desktop
                e.stopPropagation();
                const isExpanded = this.getAttribute('aria-expanded') === 'true';
                this.setAttribute('aria-expanded', !isExpanded);

                desktopDropdowns.forEach(other => {
                    if (other !== dropdown) {
                        other.querySelector('.dropdown-toggle').setAttribute('aria-expanded', 'false');
                        other.querySelector('.dropdown-menu').classList.remove('active');
                    }
                });

                menu.classList.toggle('active');
            });
        });

        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) return;
            if (!e.target.closest('.dropdown')) {
                desktopDropdowns.forEach(dropdown => {
                    dropdown.querySelector('.dropdown-toggle').setAttribute('aria-expanded', 'false');
                    dropdown.querySelector('.dropdown-menu').classList.remove('active');
                });
            }
        });

        const hamburger = header.querySelector('.hamburger');
        const navMobile = header.querySelector('.nav-mobile');
        const mobileDropdowns = navMobile.querySelectorAll('.dropdown');
        const mobileSubmenus = navMobile.querySelectorAll('.dropdown-submenu');

        if (hamburger) {
            hamburger.addEventListener('click', function() {
                const isExpanded = this.getAttribute('aria-expanded') === 'true';
                this.setAttribute('aria-expanded', !isExpanded);
                this.classList.toggle('active');
                navMobile.classList.toggle('active');
                document.body.classList.toggle('menu-open');
            });
        }

        mobileDropdowns.forEach(dropdown => {
            const toggle = dropdown.querySelector('.dropdown-toggle');
            if (toggle) {
                toggle.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const parentLi = this.closest('li');
                    parentLi.classList.toggle('active');
                });
            }
        });

        mobileSubmenus.forEach(submenu => {
            const toggle = submenu.querySelector('.submenu-toggle');
            if (toggle) {
                toggle.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    submenu.classList.toggle('active');
                });
            }
        });

        const mobileLinks = navMobile.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
                navMobile.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                hamburger.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
                navMobile.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        });
    }

    const scrollBtn = document.createElement('button');
    scrollBtn.id = 'scrollToTopBtn';
    scrollBtn.className = 'scroll-to-top';
    scrollBtn.setAttribute('aria-label', 'Scroll to top');
    scrollBtn.setAttribute('tabindex', '-1');
    scrollBtn.innerHTML = '<span class="sr-only">Scroll to top</span><i class="fas fa-chevron-up" aria-hidden="true"></i>';
    document.body.appendChild(scrollBtn);

    const scrollStyle = document.createElement('style');
    scrollStyle.textContent = `
        .scroll-to-top {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            border: none;
            font-size: 20px;
            cursor: pointer;
            box-shadow: var(--shadow-lg);
            opacity: 0;
            visibility: hidden;
            transform: translateY(20px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 999;
            display: flex;
            align-items: center;
            justify-content: center;
            outline: 2px solid transparent;
            outline-offset: 2px;
        }
        .scroll-to-top.visible {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
            tab-index: 0;
        }
        .scroll-to-top:hover,
        .scroll-to-top:focus {
            transform: translateY(-3px) scale(1.05);
            box-shadow: 0 8px 25px rgba(37, 99, 235, 0.3);
            background: linear-gradient(135deg, var(--secondary), var(--primary));
            outline: 2px solid var(--accent);
        }
        .scroll-to-top:active {
            transform: translateY(0) scale(0.98);
        }
        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }
        @media (max-width: 768px) {
            .scroll-to-top {
                bottom: 20px;
                right: 20px;
                width: 45px;
                height: 45px;
                font-size: 18px;
            }
        }
        @media (max-width: 480px) {
            .scroll-to-top {
                bottom: 15px;
                right: 15px;
                width: 40px;
                height: 40px;
            }
        }
    `;
    document.head.appendChild(scrollStyle);

    let scrollTimeout;
    window.addEventListener('scroll', function() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(function() {
            const isVisible = window.pageYOffset > 300;
            scrollBtn.classList.toggle('visible', isVisible);
            scrollBtn.setAttribute('tabindex', isVisible ? '0' : '-1');
            scrollBtn.setAttribute('aria-hidden', !isVisible);
        }, 100);
    });

    scrollBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        this.blur();
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab' && document.body.classList.contains('menu-open')) {
            const focusableElements = navMobile.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    });
});