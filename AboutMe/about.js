// ===== about.js =====
// Lightweight interactivity for About Me page + Coverflow Gallery

document.addEventListener('DOMContentLoaded', function() {

    // ================================================================
    //  HEADER — navbar float/pill behavior, hamburger, scroll progress
    //  (matches the main KennDev site header)
    // ================================================================

    (function() {
        'use strict';

        const navbar = document.getElementById('navbar');
        const hero = document.querySelector('.about-hero');
        const hamburger = document.getElementById('hamburgerBtn');
        const mobileOverlay = document.getElementById('mobileOverlay');

        if (!navbar) return;

        let isAtHeroBottom = false;
        let heroBottom = 0;

        function updateHeroBottom() {
            if (hero) {
                const heroRect = hero.getBoundingClientRect();
                heroBottom = heroRect.bottom;
            }
        }

        function handleScroll() {
            const scrollY = window.scrollY;
            updateHeroBottom();

            const headerOffset = 76;
            const shouldBeAtBottom = hero ? (scrollY + headerOffset >= heroBottom - 100) : scrollY > 40;

            if (shouldBeAtBottom !== isAtHeroBottom) {
                isAtHeroBottom = shouldBeAtBottom;
                navbar.classList.toggle('is-at-hero-bottom', isAtHeroBottom);

                if (isAtHeroBottom) {
                    if (hero) {
                        const heroRect = hero.getBoundingClientRect();
                        const bottomPos = heroRect.bottom - window.scrollY - 64;
                        navbar.style.top = Math.min(bottomPos, window.innerHeight - 80) + 'px';
                    } else {
                        navbar.style.top = '0';
                    }
                    navbar.style.transform = 'translateY(0)';
                } else {
                    navbar.style.top = '0';
                    navbar.style.transform = '';
                }
            }

            if (isAtHeroBottom && hero) {
                const heroRect = hero.getBoundingClientRect();
                const bottomPos = heroRect.bottom - window.scrollY - 64;
                const maxTop = window.innerHeight - 80;
                navbar.style.top = Math.min(Math.max(bottomPos, 0), maxTop) + 'px';
            }
        }

        let ticking = false;
        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(function() {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        window.addEventListener('resize', function() {
            updateHeroBottom();
            handleScroll();
        }, { passive: true });

        updateHeroBottom();
        handleScroll();

        /* ---------- Mobile menu toggle ---------- */
        let menuOpen = false;

        function openMobileMenu() {
            menuOpen = true;
            mobileOverlay.classList.add('is-open');
            hamburger.classList.add('is-active');
            document.body.style.overflow = 'hidden';
        }

        function closeMobileMenu() {
            menuOpen = false;
            mobileOverlay.classList.remove('is-open');
            hamburger.classList.remove('is-active');
            document.body.style.overflow = '';
        }

        if (hamburger) {
            hamburger.addEventListener('click', function() {
                menuOpen ? closeMobileMenu() : openMobileMenu();
            });
        }

        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', function(e) {
                if (e.target === mobileOverlay) closeMobileMenu();
            });
        }

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && menuOpen) {
                closeMobileMenu();
            }
        });

        /* ---------- Scroll progress bar ---------- */
        const scrollProgress = document.getElementById('scrollProgress');
        window.addEventListener('scroll', function() {
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
            if (scrollProgress) {
                scrollProgress.style.width = Math.min(Math.max(progress, 0), 100) + '%';
            }
        }, { passive: true });

    })();

    // ================================================================
    //  COVERFLOW GALLERY
    // ================================================================

    (function() {
        'use strict';

        const CONFIG = {
            cardWidth: 400,
            cardHeight: 400,
            radius: 3,
            tilt: 12,
            sideTilt: 8,
            gap: 8,
            opacity: 60,
            perspective: 1600,
            scaleStep: 0.16,
            maxVisible: 2,
            depth: 240,
            transitionDuration: 0.6,
            transitionEase: 'cubic-bezier(0.22, 1, 0.36, 1)',
            autoplayDelay: 2.5,
            autoplayDirection: 'rightToLeft',
        };

        // ===== YOUR OJT EXPERIENCE & PROJECTS =====
        const slides = [{
            image: 'Images/1.jpg',
            title: 'Fields Monitoring\nMobile App',
            subtitle: 'EMB DENR Region 6 · OJT Project',
            desc: 'Track new building branches across Region 6'
        }, {
            image: 'Images/2.jpg',
            title: 'Fields Monitoring\nWeb App',
            subtitle: 'EMB DENR Region 6 · OJT Project',
            desc: 'Generate formatted reports & store in database'
        }, {
            image: 'Images/3.jpg',
            title: 'FaciliTrack\nMobile App',
            subtitle: 'Capstone Project · ISUFST',
            desc: 'Facility Management & Scheduling System'
        }, {
            image: 'Images/4.jpg',
            title: 'FaciliTrack\nDesktop App',
            subtitle: 'Capstone Project · ISUFST',
            desc: 'Full-featured desktop app for facility monitoring'
        }, {
            image: 'Images/5.jpg',
            title: 'Clean Code\nMVC Architecture',
            subtitle: 'Development Philosophy',
            desc: 'Separating concerns · DAO · Service Layer · Modular'
        }
        ];

        let activeIndex = 0;
        let isLocked = false;
        let autoplayEnabled = false;
        let autoplayTimer = null;
        const n = slides.length;

        const wrapper = document.getElementById('galleryWrapper');
        const stage = document.getElementById('galleryStage');
        const dotsContainer = document.getElementById('galleryDots');

        // ---------- Lightbox ----------
        const lightbox = document.getElementById('galleryLightbox');
        const lightboxImg = document.getElementById('lightboxImage');
        const lightboxTitle = document.getElementById('lightboxTitle');
        const lightboxSubtitle = document.getElementById('lightboxSubtitle');
        const lightboxClose = document.getElementById('lightboxClose');
        let wasAutoplaying = false;

        function openLightbox(slide) {
            if (!lightbox) return;
            lightboxImg.src = slide.image;
            lightboxImg.alt = (slide.title || '').replace(/\n/g, ' ');
            lightboxTitle.textContent = (slide.title || '').replace(/\n/g, ' ');
            lightboxSubtitle.textContent = slide.subtitle || '';

            wasAutoplaying = !!autoplayTimer;
            if (autoplayTimer) {
                clearInterval(autoplayTimer);
                autoplayTimer = null;
            }

            lightbox.classList.add('is-open');
            document.body.style.overflow = 'hidden';
        }

        function closeLightbox() {
            if (!lightbox) return;
            lightbox.classList.remove('is-open');
            document.body.style.overflow = '';
            if (wasAutoplaying) {
                startAutoplay();
            }
        }

        if (lightboxClose) {
            lightboxClose.addEventListener('click', closeLightbox);
        }
        if (lightbox) {
            lightbox.addEventListener('click', function(e) {
                if (e.target === lightbox) closeLightbox();
            });
        }
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && lightbox && lightbox.classList.contains('is-open')) {
                closeLightbox();
            }
        });

        function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

        function mod(n, m) { return ((n % m) + m) % m; }

        function calcRadius(val, w, h) {
            const raw = (clamp(val, 0, 20) / 20) * (Math.min(w, h) / 2);
            return raw;
        }

        // Card size must track the same breakpoints as gallery.css / responsive.css.
        // Without this, the inline width/height set below always wins over the
        // CSS media queries (inline styles beat stylesheet rules), so the cards
        // stayed 400x400 on every screen size and overflowed the wrapper on mobile.
        function getCardSize() {
            const vw = window.innerWidth;
            if (vw <= 480) return { w: 220, h: 220 };
            if (vw <= 768) return { w: 300, h: 300 };
            return { w: CONFIG.cardWidth, h: CONFIG.cardHeight };
        }

        function render() {
            const { w, h } = getCardSize();
            if (stage) {
                stage.style.width = w + 'px';
                stage.style.height = h + 'px';
            }
            const radiusPx = calcRadius(CONFIG.radius, w, h);
            const dim = 1 - clamp(CONFIG.opacity, 0, 100) / 100;
            const dur = CONFIG.transitionDuration;
            const ease = CONFIG.transitionEase;
            const transitionCss = `transform ${dur}s ${ease}, opacity ${dur}s ${ease}`;

            stage.innerHTML = '';

            slides.forEach((slide, i) => {
                let rel = i - activeIndex;
                if (rel > n / 2) rel -= n;
                if (rel < -n / 2) rel += n;

                const ax = Math.abs(rel);
                const visible = ax <= CONFIG.maxVisible;
                const isActive = rel === 0;

                const sc = Math.max(0.4, 1 - ax * CONFIG.scaleStep);
                const tx = rel * (CONFIG.gap * 30);
                const tz = -ax * CONFIG.depth;
                const ry = -rel * CONFIG.tilt;
                const rz = rel * CONFIG.sideTilt;

                const transform =
                    `translate(-50%, -50%) translateX(${tx}px) translateZ(${tz}px) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${sc})`;

                const card = document.createElement('div');
                card.className = 'gallery-card';
                card.style.width = w + 'px';
                card.style.height = h + 'px';
                card.style.borderRadius = radiusPx + 'px';
                card.style.transform = transform;
                card.style.transition = transitionCss;
                card.style.opacity = visible ? 1 : 0;

                // FIX: the active (front) card must stay clickable even while
                // autoplay is running, so it can always open the lightbox.
                // Side cards keep the old behavior (only clickable when autoplay is off).
                card.style.cursor = isActive ? 'zoom-in' : (autoplayEnabled ? 'default' : 'pointer');
                card.style.pointerEvents = (visible && (isActive || !autoplayEnabled)) ? 'auto' : 'none';

                card.dataset.index = i;

                const img = document.createElement('img');
                img.src = slide.image;
                img.alt = slide.title || '';
                img.draggable = false;
                card.appendChild(img);

                const grad = document.createElement('div');
                grad.className = 'card-gradient';
                card.appendChild(grad);

                const titleWrap = document.createElement('div');
                titleWrap.className = 'card-title-wrap';

                const titleSpan = document.createElement('span');
                titleSpan.className = 'card-title';
                titleSpan.textContent = slide.title;
                titleWrap.appendChild(titleSpan);

                if (slide.subtitle) {
                    const sub = document.createElement('div');
                    sub.className = 'card-subtitle';
                    sub.textContent = slide.subtitle;
                    titleWrap.appendChild(sub);
                }

                card.appendChild(titleWrap);

                const dimEl = document.createElement('div');
                dimEl.className = 'card-dim';
                dimEl.style.opacity = isActive ? 0 : dim;
                dimEl.style.transition = `opacity ${dur}s ${ease}`;
                card.appendChild(dimEl);

                card.addEventListener('click', () => {
                    if (isLocked) return;
                    if (isActive) {
                        openLightbox(slide);
                    } else if (!autoplayEnabled) {
                        goTo(i);
                    }
                });

                stage.appendChild(card);
            });

            const dots = dotsContainer.querySelectorAll('.gallery-nav-dot');
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === activeIndex);
            });
        }

        function goTo(index) {
            if (isLocked) return;
            const target = mod(index, n);
            if (target === activeIndex) {
                const next = mod(activeIndex + 1, n);
                lockAndGo(next);
            } else {
                lockAndGo(target);
            }
        }

        function lockAndGo(index) {
            if (isLocked) return;
            isLocked = true;
            activeIndex = index;
            render();
            const ms = Math.max(50, CONFIG.transitionDuration * 1000);
            setTimeout(() => {
                isLocked = false;
            }, ms);
        }

        function startAutoplay() {
            if (autoplayTimer) return;
            const dir = CONFIG.autoplayDirection === 'leftToRight' ? -1 : 1;
            const ms = Math.max(300, CONFIG.autoplayDelay * 1000);
            autoplayTimer = setInterval(() => {
                if (!isLocked) {
                    const next = mod(activeIndex + dir, n);
                    lockAndGo(next);
                }
            }, ms);
            autoplayEnabled = true;
            render();
        }

        function buildDots() {
            dotsContainer.innerHTML = '';
            for (let i = 0; i < n; i++) {
                const dot = document.createElement('button');
                dot.className = 'gallery-nav-dot';
                dot.dataset.index = i;
                dot.setAttribute('aria-label', `Slide ${i + 1}`);
                dot.addEventListener('click', () => {
                    if (!autoplayEnabled && !isLocked) {
                        goTo(i);
                    }
                });
                dotsContainer.appendChild(dot);
            }
        }

        function initGallery() {
            buildDots();
            render();

            wrapper.setAttribute('tabindex', '0');

            let resizeTimer;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    render();
                }, 100);
            });

            // Autoplay starts immediately — no button, no click required.
            startAutoplay();

            console.log('🎠 OJT Experience Gallery ready!');
            console.log(`📸 ${n} projects loaded. Click the dots to jump to a slide.`);
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initGallery);
        } else {
            initGallery();
        }

    })();

    // ================================================================
    //  ARTICLE CHAPTER NAV (scroll-spy + progress rail)
    // ================================================================

    (function() {
        'use strict';

        const nav = document.getElementById('chapterNav');
        const railFill = document.getElementById('chapterRailFill');
        if (!nav || !railFill) return;

        const links = Array.from(nav.querySelectorAll('a[data-chapter]'));
        const chapters = links
            .map(link => document.getElementById(link.dataset.chapter))
            .filter(Boolean);

        if (!chapters.length) return;

        let ticking = false;

        function update() {
            ticking = false;

            const viewportAnchor = window.innerHeight * 0.35;

            // Determine active chapter: the last one whose top has passed the anchor line
            let activeIndex = 0;
            chapters.forEach((chapter, i) => {
                const rect = chapter.getBoundingClientRect();
                if (rect.top <= viewportAnchor) {
                    activeIndex = i;
                }
            });

            links.forEach((link, i) => {
                link.classList.toggle('is-active', i === activeIndex);
            });

            // Progress rail: how far through the whole article we are
            const first = chapters[0].getBoundingClientRect();
            const last = chapters[chapters.length - 1].getBoundingClientRect();
            const totalSpan = (last.top + last.height) - first.top;
            const traveled = viewportAnchor - first.top;
            const pct = totalSpan > 0 ? (traveled / totalSpan) * 100 : 0;
            railFill.style.height = Math.max(0, Math.min(100, pct)) + '%';
        }

        function onScroll() {
            if (!ticking) {
                window.requestAnimationFrame(update);
                ticking = true;
            }
        }

        links.forEach(link => {
            link.addEventListener('click', function(e) {
                const target = document.getElementById(this.dataset.chapter);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        update();

    })();

    // ================================================================
    //  SMOOTH SCROLL & FADE-IN EFFECTS
    // ================================================================

    const smoothLinks = document.querySelectorAll('a[href^="#"]');
    smoothLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                e.preventDefault();
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    const sections = document.querySelectorAll('.section');
    if (sections.length && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

        sections.forEach(section => {
            section.style.opacity = '0.6';
            section.style.transform = 'translateY(8px)';
            section.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            observer.observe(section);
        });
    }

    // Diff panel reveal
    const diffPanel = document.querySelector('.diff-panel');
    if (diffPanel && 'IntersectionObserver' in window) {
        const lines = diffPanel.querySelectorAll('.diff-line');
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!prefersReducedMotion) {
            lines.forEach(line => {
                line.style.opacity = '0';
                line.style.transform = 'translateX(-6px)';
                line.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            });

            const diffObserver = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        lines.forEach((line, i) => {
                            setTimeout(() => {
                                line.style.opacity = '1';
                                line.style.transform = 'translateX(0)';
                            }, i * 70);
                        });
                        obs.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.4 });

            diffObserver.observe(diffPanel);
        }
    }

    // ================================================================
    //  THEME TOGGLE (light / dark — persists across the whole site)
    // ================================================================
    (function() {
        'use strict';

        const THEME_KEY = 'kenndev-theme';
        const themeToggleBtns = document.querySelectorAll('[data-theme-toggle]');

        function getPreferredTheme() {
            const saved = localStorage.getItem(THEME_KEY);
            if (saved === 'light' || saved === 'dark') return saved;
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }

        function applyTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            themeToggleBtns.forEach(function (btn) {
                btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
                btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
                const label = btn.querySelector('.theme-toggle__label');
                if (label) label.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
            });
        }

        applyTheme(getPreferredTheme());

        themeToggleBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                localStorage.setItem(THEME_KEY, next);
                applyTheme(next);
            });
        });
    })();

    if (window.KineticGridBackground && 'ResizeObserver' in window && 'IntersectionObserver' in window) {
        document.querySelectorAll('[data-flow-bg]').forEach(function (canvas) {
            new KineticGridBackground(canvas);
        });
    }

    console.log('👋 Thanks for visiting my About page!');
    console.log('📧 kenndanield@gmail.com');
});