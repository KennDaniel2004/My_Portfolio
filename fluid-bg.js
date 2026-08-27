(function (window) {
  'use strict';

  function KineticGridBackground(canvas, options) {
    options = options || {};
    this.canvas = canvas;
    this.section = canvas.closest('.section') || canvas.parentElement;
    this.ctx = canvas.getContext('2d', { alpha: false });

    this.getTheme = options.getTheme || function () {
      return document.documentElement.getAttribute('data-theme') || 'light';
    };

    this.spacing = options.spacing || 50;
    this.width = 0;
    this.height = 0;
    this.rafId = null;
    this.isVisible = true;

    this.points = [];
    this.ripples = [];

    this.mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      radius: 170,
      strength: 0.30
    };

    this._onResize = this._onResize.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseLeave = this._onMouseLeave.bind(this);
    this._onClick = this._onClick.bind(this);
    this._render = this._render.bind(this);

    this._resizeObserver = new ResizeObserver(this._onResize);
    this._resizeObserver.observe(this.section);

    this._intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        this.isVisible = entry.isIntersecting;
        if (this.isVisible && !this.rafId) this._render();
      });
    }, { threshold: 0.05 });
    this._intersectionObserver.observe(this.section);

    this.section.addEventListener('mousemove', this._onMouseMove);
    this.section.addEventListener('mouseleave', this._onMouseLeave);
    this.section.addEventListener('click', this._onClick);

    this._onResize();
    this._render();
  }

  KineticGridBackground.prototype._onResize = function () {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.section.getBoundingClientRect();
    this.width = Math.max(rect.width, 1);
    this.height = Math.max(rect.height, 1);
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);

    this._initGrid();
  };

  KineticGridBackground.prototype._initGrid = function () {
    const spacing = this.spacing;
    const cols = Math.ceil(this.width / spacing) + 2;
    const rows = Math.ceil(this.height / spacing) + 2;
    this.points = [];

    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push({
          baseX: c * spacing,
          baseY: r * spacing,
          x: c * spacing,
          y: r * spacing,
          vx: 0,
          vy: 0
        });
      }
      this.points.push(row);
    }
  };

  KineticGridBackground.prototype._onMouseMove = function (e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.targetX = e.clientX - rect.left;
    this.mouse.targetY = e.clientY - rect.top;
  };

  KineticGridBackground.prototype._onMouseLeave = function () {
    this.mouse.targetX = -1000;
    this.mouse.targetY = -1000;
  };

  KineticGridBackground.prototype._onClick = function (e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.ripples.push({
      x: x,
      y: y,
      currentRadius: 0,
      maxRadius: 450,
      speed: 11,
      thickness: 80,
      intensity: 40
    });
  };

  KineticGridBackground.prototype._updateRipples = function () {
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.currentRadius += r.speed;
      if (r.currentRadius > r.maxRadius) {
        this.ripples.splice(i, 1);
      }
    }
  };

  KineticGridBackground.prototype._render = function () {
    if (!this.isVisible) {
      this.rafId = null;
      return;
    }

    const ctx = this.ctx;
    const width = this.width;
    const height = this.height;

    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.18;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.18;

    const isDark = this.getTheme() === 'dark';
    const bgColor = isDark ? '#0b1220' : '#f6f9ff';
    const baseLineColor = isDark ? '255, 255, 255' : '15, 23, 42';
    const activeLineColor = isDark ? '110, 170, 240' : '37, 99, 235';
    const activeDotColor = isDark ? '140, 194, 255' : '29, 78, 216';

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    const rows = this.points.length;
    if (rows === 0) return;
    const cols = this.points[0].length;

    const mouse = this.mouse;
    const ripples = this.ripples;

    // Update points
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const pt = this.points[r][c];
        const dx = mouse.x - pt.baseX;
        const dy = mouse.y - pt.baseY;
        const dist = Math.hypot(dx, dy);

        let targetX = pt.baseX;
        let targetY = pt.baseY;

        if (dist < mouse.radius) {
          const normDist = dist / mouse.radius;
          const factor = Math.pow(1 - normDist, 2.2) * mouse.strength;
          targetX = pt.baseX + dx * factor;
          targetY = pt.baseY + dy * factor;
        }

        ripples.forEach(ripple => {
          const rDx = pt.baseX - ripple.x;
          const rDy = pt.baseY - ripple.y;
          const rDist = Math.hypot(rDx, rDy);

          const waveDist = Math.abs(rDist - ripple.currentRadius);
          if (waveDist < ripple.thickness) {
            const factor = Math.cos((waveDist / ripple.thickness) * (Math.PI / 2));
            const amplitude = ripple.intensity * factor * (1 - ripple.currentRadius / ripple.maxRadius);

            if (rDist > 0) {
              targetX += (rDx / rDist) * amplitude;
              targetY += (rDy / rDist) * amplitude;
            }
          }
        });

        const spring = 0.16;
        const friction = 0.75;

        pt.vx += (targetX - pt.x) * spring;
        pt.vy += (targetY - pt.y) * spring;
        pt.vx *= friction;
        pt.vy *= friction;

        pt.x += pt.vx;
        pt.y += pt.vy;
      }
    }

    const outerAlpha = 0.15;
    const innerAlpha = 0.75;

    // Draw grid
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const pt = this.points[r][c];
        const distToMouse = Math.hypot(pt.x - mouse.x, pt.y - mouse.y);

        let lineAlpha = outerAlpha;
        let dotAlpha = outerAlpha;

        if (distToMouse < mouse.radius) {
          const normDist = distToMouse / mouse.radius;
          const blendFactor = (Math.cos(normDist * Math.PI) + 1) / 2;
          lineAlpha = outerAlpha + ((innerAlpha - outerAlpha) * blendFactor);
          dotAlpha = outerAlpha + ((innerAlpha - outerAlpha) * blendFactor);
        }

        ctx.lineWidth = distToMouse < mouse.radius ? 1.1 : 0.6;
        ctx.strokeStyle = distToMouse < mouse.radius
          ? `rgba(${activeLineColor}, ${lineAlpha})`
          : `rgba(${baseLineColor}, ${lineAlpha})`;

        // Horizontal lines
        if (c < cols - 1) {
          const nextPt = this.points[r][c + 1];
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y);
          const midX = (pt.x + nextPt.x) / 2;
          const midY = (pt.y + nextPt.y) / 2;
          ctx.quadraticCurveTo(midX, midY, nextPt.x, nextPt.y);
          ctx.stroke();
        }

        // Vertical lines
        if (r < rows - 1) {
          const nextPt = this.points[r + 1][c];
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y);
          const midX = (pt.x + nextPt.x) / 2;
          const midY = (pt.y + nextPt.y) / 2;
          ctx.quadraticCurveTo(midX, midY, nextPt.x, nextPt.y);
          ctx.stroke();
        }

        // Intersection dots
        ctx.beginPath();
        if (distToMouse < mouse.radius) {
          ctx.arc(pt.x, pt.y, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${activeDotColor}, ${dotAlpha})`;
          ctx.shadowColor = isDark ? 'rgba(96, 165, 250, 0.5)' : 'rgba(37, 99, 235, 0.4)';
          ctx.shadowBlur = 6;
        } else {
          ctx.arc(pt.x, pt.y, 1.0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${baseLineColor}, ${dotAlpha})`;
          ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    this._updateRipples();
    this.rafId = requestAnimationFrame(this._render);
  };

  KineticGridBackground.prototype.destroy = function () {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this._resizeObserver.disconnect();
    this._intersectionObserver.disconnect();
    this.section.removeEventListener('mousemove', this._onMouseMove);
    this.section.removeEventListener('mouseleave', this._onMouseLeave);
    this.section.removeEventListener('click', this._onClick);
  };

  window.KineticGridBackground = KineticGridBackground;
})(window);