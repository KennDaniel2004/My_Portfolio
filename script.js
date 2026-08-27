/* =========================================================
   KennDev Portfolio — Main interactions
   ========================================================= */
document.addEventListener('DOMContentLoaded', function() {

  const navbar = document.getElementById('navbar');
  const hero = document.getElementById('home');
  const hamburger = document.getElementById('hamburgerBtn');
  const mobileOverlay = document.getElementById('mobileOverlay');

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
    const shouldBeAtBottom = scrollY + headerOffset >= heroBottom - 100;

    if (shouldBeAtBottom !== isAtHeroBottom) {
      isAtHeroBottom = shouldBeAtBottom;
      navbar.classList.toggle('is-at-hero-bottom', isAtHeroBottom);

      if (isAtHeroBottom) {
        const heroRect = hero.getBoundingClientRect();
        const bottomPos = heroRect.bottom - window.scrollY - 64;
        navbar.style.top = Math.min(bottomPos, window.innerHeight - 80) + 'px';
        navbar.style.transform = 'translateY(0)';
      } else {
        navbar.style.top = '0';
        navbar.style.transform = '';
      }
    }

    if (isAtHeroBottom) {
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

  /* Logo click -> scroll to top */
  const logoLink = document.getElementById('logoLink');
  if (logoLink) {
    logoLink.addEventListener('click', function(e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* Mobile menu toggle */
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

  /* Smooth scroll for nav buttons */
  function scrollToTarget(selector) {
    const el = document.querySelector(selector);
    if (el) {
      const navH = navbar.offsetHeight || 76;
      const top = el.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
  }

  document.querySelectorAll('[data-target]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const target = this.getAttribute('data-target');
      closeMobileMenu();
      scrollToTarget(target);
    });
  });

  /* Hero scroll cue */
  const scrollCue = document.getElementById('scrollCue');
  if (scrollCue) {
    scrollCue.addEventListener('click', function() {
      const target = document.getElementById('about');
      if (target) {
        const navH = navbar.offsetHeight || 76;
        const top = target.getBoundingClientRect().top + window.scrollY - navH;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  }

  /* Scroll progress bar */
  const scrollProgress = document.getElementById('scrollProgress');
  window.addEventListener('scroll', function() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
    if (scrollProgress) {
      scrollProgress.style.width = Math.min(Math.max(progress, 0), 100) + '%';
    }
  }, { passive: true });

  /* Reveal-on-scroll */
  const revealEls = document.querySelectorAll('[data-reveal]');
  const revealObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry, i) {
      if (entry.isIntersecting) {
        entry.target.style.transitionDelay = ((i % 6) * 60) + 'ms';
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealEls.forEach(function(el) {
    revealObserver.observe(el);
  });

  /* Contact form validation */
  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  const formStatus = document.getElementById('formStatus');

  const fields = {
    name: { el: document.getElementById('name'), err: document.getElementById('nameError') },
    email: { el: document.getElementById('email'), err: document.getElementById('emailError') },
    subject: { el: document.getElementById('subject'), err: document.getElementById('subjectError') },
    message: { el: document.getElementById('message'), err: document.getElementById('messageError') },
  };

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validateField(key) {
    const field = fields[key];
    if (!field) return true;
    const { el, err } = field;
    let message = '';

    if (!el.value.trim()) {
      message = 'This field is required.';
    } else if (key === 'email' && !emailPattern.test(el.value.trim())) {
      message = 'Enter a valid email address.';
    } else if (key === 'message' && el.value.trim().length < 10) {
      message = 'Message should be at least 10 characters.';
    }

    err.textContent = message;
    const container = el.closest('.form-field');
    if (container) {
      container.classList.toggle('has-error', Boolean(message));
    }
    el.setAttribute('aria-invalid', message ? 'true' : 'false');
    return !message;
  }

  if (form) {
    Object.keys(fields).forEach(function(key) {
      const field = fields[key];
      if (!field) return;
      field.el.addEventListener('blur', function() { validateField(key); });
      field.el.addEventListener('input', function() {
        const container = field.el.closest('.form-field');
        if (container && container.classList.contains('has-error')) {
          validateField(key);
        }
      });
    });

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const results = Object.keys(fields).map(function(key) { return validateField(key); });
      const isValid = results.every(Boolean);

      if (!isValid) {
        formStatus.textContent = 'Please fix the highlighted fields.';
        formStatus.classList.remove('is-success');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      setTimeout(function() {
        formStatus.textContent = 'Thanks, ' + fields.name.el.value.trim() + '! Your message has been sent.';
        formStatus.classList.add('is-success');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
        form.reset();
      }, 900);
    });
  }

  /* Close mobile menu on Escape */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && menuOpen) {
      closeMobileMenu();
    }
  });

  /* Theme toggle */
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

  /* Fluid flow backgrounds */
  if (window.FluidFlowBackground && 'ResizeObserver' in window && 'IntersectionObserver' in window) {
    document.querySelectorAll('[data-flow-bg]').forEach(function (canvas) {
      new FluidFlowBackground(canvas);
    });
  }

  console.log('✦ KennDev Portfolio');
});