// Kenn Brand — Choco na Gatas
// Scroll reveal, pour progress bar, dot nav sync

document.addEventListener('DOMContentLoaded', () => {

  /* ---- Hero scroll-scrubbed frame sequence ---- */
  const heroEl = document.getElementById('hero');
  const canvas = document.getElementById('heroCanvas');

  if (heroEl && canvas) {
    const ctx = canvas.getContext('2d');
    const FRAME_COUNT = 53;
    const framePath = (i) => `assets/frames/frame_${String(i).padStart(3, '0')}.jpg`;

    const frames = [];
    let loadedCount = 0;
    let hasDrawnFirst = false;
    const initialProgress = window.scrollY <= 1 ? 0 : 1;

    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.src = framePath(i);
      img.onload = () => {
        loadedCount++;
        if (!hasDrawnFirst) {
          hasDrawnFirst = true;
          drawFrame(Math.round(initialProgress * (FRAME_COUNT - 1)));
        }
      };
      frames.push(img);
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function sizeCanvas() {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
    }
    sizeCanvas();

    let lastDrawnIndex = -1;
    function drawFrame(index) {
      const img = frames[index];
      if (!img || !img.complete || img.naturalWidth === 0) return;
      if (index === lastDrawnIndex) return;
      lastDrawnIndex = index;

      const cw = canvas.width, ch = canvas.height;
      const iw = img.naturalWidth, ih = img.naturalHeight;
      // Frames are pre-composed at 1920x1080 (sharp subject centered over a
      // blurred, extended background), so a straight "cover" fit fills the
      // viewport edge-to-edge on desktop and crops in tight on the subject
      // for mobile/narrow screens, with no letterboxing either way.
      const scale = Math.max(cw / iw, ch / ih);
      const dw = iw * scale, dh = ih * scale;
      const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, dx, dy, dw, dh);
    }

    const heroTextOpen = document.getElementById('heroTextOpen');
    const heroTextClose = document.getElementById('heroTextClose');
    const scrollCue = document.getElementById('scrollCue');
    const scrubFill = document.getElementById('scrubFill');

    function clamp01(v) { return Math.max(0, Math.min(1, v)); }
    function lerp(a, b, t) { return a + (b - a) * t; }

    // Applies hero-text/cue/progress-bar visuals for a given 0..1 progress.
    // Same thresholds as before — only the *source* of progress changed.
    function applyHeroChrome(p) {
      const openOpacity = p <= 0.12 ? 1 : p >= 0.30 ? 0 : 1 - (p - 0.12) / 0.18;
      if (heroTextOpen) {
        heroTextOpen.style.opacity = openOpacity;
        heroTextOpen.style.setProperty('--reveal-shift', `${lerp(0, -18, 1 - openOpacity)}px`);
      }

      const closeOpacity = p <= 0.76 ? 0 : p >= 0.92 ? 1 : (p - 0.76) / 0.16;
      if (heroTextClose) {
        heroTextClose.style.opacity = closeOpacity;
        heroTextClose.style.setProperty('--reveal-shift', `${lerp(18, 0, closeOpacity)}px`);
      }

      if (scrollCue) {
        const cueOpacity = p <= 0.03 ? 1 : p >= 0.1 ? 0 : 1 - (p - 0.03) / 0.07;
        scrollCue.style.opacity = cueOpacity;
      }

      if (scrubFill) scrubFill.style.width = (p * 100) + '%';
    }

    /* ---- Scroll-jacked progress: one intentional wheel/touch gesture ----
       ---- plays the whole clip, instead of needing many small scrolls ---- */
    let progress = window.scrollY <= 1 ? 0 : 1;       // raw target, 0..1
    let displayProgress = progress;                    // eased, actually rendered
    let locked = window.scrollY <= 1;                  // are we intercepting scroll input?
    let rafId = null;

    const EASE = 0.08;                    // lower = slower, more cinematic glide
    const WHEEL_SENSITIVITY = 1 / 1000;   // total deltaY needed to go 0→1 (higher = slower)
    const TOUCH_SENSITIVITY = () => 1 / (window.innerHeight * 0.95);

    function renderLoop() {
      displayProgress += (progress - displayProgress) * EASE;
      if (Math.abs(progress - displayProgress) < 0.001) displayProgress = progress;

      const frameIndex = Math.round(displayProgress * (FRAME_COUNT - 1));
      drawFrame(frameIndex);
      applyHeroChrome(displayProgress);

      // Only release the scroll-jack once the video has *visually* finished
      // easing to the end (or start) — not the instant raw input crosses
      // the threshold — so the clip never gets cut off mid-animation.
      if (progress >= 1 && displayProgress >= 0.999) {
        locked = false;
      } else if (progress <= 0 && displayProgress <= 0.001) {
        locked = window.scrollY <= 1;
      }

      if (displayProgress !== progress) {
        rafId = requestAnimationFrame(renderLoop);
      } else {
        rafId = null;
      }
    }

    function bumpProgress(delta) {
      progress = clamp01(progress + delta);
      if (!rafId) rafId = requestAnimationFrame(renderLoop);
    }

    function onWheel(e) {
      if (!locked) return;

      // Already finished and still scrolling forward, and the visual
      // playback has caught up — release the page to scroll normally into
      // the next section.
      if (progress >= 1 && e.deltaY > 0) {
        if (displayProgress < 0.999) { e.preventDefault(); return; }
        locked = false;
        return;
      }
      // Already at the very start and scrolling further back — nothing
      // above the hero, just absorb it so the page doesn't rubber-band.
      if (progress <= 0 && e.deltaY < 0) {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      bumpProgress(e.deltaY * WHEEL_SENSITIVITY);
    }

    let touchStartY = null;

    function onTouchStart(e) {
      if (!locked) return;
      touchStartY = e.touches[0].clientY;
    }

    function onTouchMove(e) {
      if (!locked || touchStartY === null) return;
      const currentY = e.touches[0].clientY;
      const deltaY = touchStartY - currentY; // swipe up = positive = forward
      touchStartY = currentY;

      if (progress >= 1 && deltaY > 0) {
        if (displayProgress < 0.999) { e.preventDefault(); return; }
        locked = false;
        return;
      }
      if (progress <= 0 && deltaY < 0) {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      bumpProgress(deltaY * TOUCH_SENSITIVITY());
    }

    function onTouchEnd() { touchStartY = null; }

    // Re-engage the scroll-jack if the user scrolls back up to the very
    // top of the page (re-entering the hero from the section below).
    function onWindowScroll() {
      if (window.scrollY <= 1) locked = true;
    }

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('scroll', onWindowScroll, { passive: true });

    window.addEventListener('resize', () => {
      sizeCanvas();
      lastDrawnIndex = -1;
      drawFrame(Math.round(displayProgress * (FRAME_COUNT - 1)));
    });

    applyHeroChrome(displayProgress);
  }

  /* ---- Form video: play while in view, pause on scroll away, ----
     ---- resume from the same spot (no restart), no infinite loop ---- */
  const formVideo = document.querySelector('.form-video');

  if (formVideo && 'IntersectionObserver' in window) {
    const videoIo = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // If it already finished playing, leave it resting on the last
          // frame instead of restarting from the beginning.
          if (!formVideo.ended) {
            formVideo.play().catch(() => {});
          }
        } else {
          formVideo.pause();
        }
      });
    }, { threshold: 0.35 });

    videoIo.observe(formVideo);
  }

  /* ---- Reveal on scroll ---- */
  const revealEls = document.querySelectorAll('[data-reveal]');

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = Array.from(el.parentElement?.querySelectorAll('[data-reveal]') || [])
            .indexOf(el);
          el.style.transitionDelay = `${Math.min(delay, 4) * 70}ms`;
          el.classList.add('in-view');
          io.unobserve(el);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in-view'));
  }

  /* ---- Pour progress bar ---- */
  const pourFill = document.getElementById('pourFill');
  const updatePour = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
    if (pourFill) pourFill.style.width = pct + '%';
  };
  window.addEventListener('scroll', updatePour, { passive: true });
  updatePour();

  /* ---- Dot nav active section sync ---- */
  const navLinks = document.querySelectorAll('.dot-nav a');
  const sections = Array.from(navLinks)
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  const syncNav = () => {
    let current = sections[0];
    const scrollPos = window.scrollY + window.innerHeight * 0.4;
    sections.forEach(sec => {
      if (sec.offsetTop <= scrollPos) current = sec;
    });
    navLinks.forEach(a => {
      const target = document.querySelector(a.getAttribute('href'));
      a.classList.toggle('active', target === current);
    });
  };
  window.addEventListener('scroll', syncNav, { passive: true });
  syncNav();

});