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
    <a class="logo" href="${basePath}index.html">
        <i class="fas fa-code"></i> Jericho
    </a>

    <nav class="nav-desktop">
        <ul class="nav-links">
            <li><a href="${basePath}index.html#about">About</a></li>
            <li><a href="${basePath}browser-apps/apps_and_tools.html">Apps & Tools</a></li>
            <li class="dropdown">
                <a class="dropdown-toggle" href="#">Other Stuff <i class="fas fa-chevron-down"></i></a>
                <ul class="dropdown-menu">
                    <li><a href="https://chalwk.github.io/CPAS/">CPAS</a></li>
                    <li class="dropdown-submenu">
                        <a class="submenu-toggle" href="#">Education <i class="fas fa-chevron-right"></i></a>
                        <ul class="submenu">
                            <li><a href="${basePath}education/understanding-autism.html">Understanding Autism</a></li>
                        </ul>
                    </li>
                </ul>
            </li>
        </ul>
    </nav>

    <div class="hamburger">
        <span></span>
        <span></span>
        <span></span>
    </div>

    <nav class="nav-mobile">
        <ul class="nav-mobile-links">
            <li><a href="${basePath}index.html#about">About</a></li>
            <li><a href="${basePath}browser-apps/apps_and_tools.html">Apps & Tools</a></li>
            <li class="dropdown">
                <a class="dropdown-toggle" href="#">
                    Other Stuff
                    <i class="fas fa-chevron-down"></i>
                </a>
                <ul class="dropdown-menu">
                    <li><a href="https://chalwk.github.io/CPAS/">CPAS</a></li>
                    <li class="dropdown-submenu">
                        <a class="submenu-toggle" href="#">
                            Education
                            <i class="fas fa-chevron-right"></i>
                        </a>
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

        const hamburger = header.querySelector('.hamburger');
        const navMobile = header.querySelector('.nav-mobile');
        const mobileDropdowns = navMobile.querySelectorAll('.dropdown');
        const mobileSubmenus = navMobile.querySelectorAll('.dropdown-submenu');

        if (hamburger) {
            hamburger.addEventListener('click', function() {
                this.classList.toggle('active');
                navMobile.classList.toggle('active');
            });
        }

        mobileDropdowns.forEach(dropdown => {
            const toggle = dropdown.querySelector('.dropdown-toggle');
            if (toggle) {
                toggle.addEventListener('click', function(e) {
                    e.preventDefault();
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
                    submenu.classList.toggle('active');
                });
            }
        });

        const mobileLinks = navMobile.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                navMobile.classList.remove('active');
            });
        });
    }

    const scrollBtn = document.createElement('button');
    scrollBtn.id = 'scrollToTopBtn';
    scrollBtn.className = 'scroll-to-top';
    scrollBtn.setAttribute('aria-label', 'Scroll to top');
    scrollBtn.innerHTML = '↑';
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
            font-size: 24px;
            cursor: pointer;
            box-shadow: var(--shadow);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .scroll-to-top.visible {
            opacity: 1;
            visibility: visible;
        }
        .scroll-to-top:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 12px rgba(0,0,0,0.15);
            background: linear-gradient(135deg, var(--secondary), var(--primary));
        }
        @media (max-width: 768px) {
            .scroll-to-top {
                bottom: 20px;
                right: 20px;
                width: 45px;
                height: 45px;
                font-size: 20px;
            }
        }
    `;
    document.head.appendChild(scrollStyle);

    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    });

    scrollBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});