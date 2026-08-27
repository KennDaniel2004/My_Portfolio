
(function (window) {
  'use strict';

  function FluidFlowBackground(canvas, options) {
    options = options || {};
    this.canvas = canvas;
    this.section = canvas.closest('.section') || canvas.parentElement;
    this.ctx = canvas.getContext('2d', { alpha: false });


    this.getTheme = options.getTheme || function () {
      return document.documentElement.getAttribute('data-theme') || 'light';
    };

    this.spacing = options.spacing || 35;
    this.width = 0;
    this.height = 0;
    this.time = 0;
    this.rafId = null;
    this.isVisible = true;

    this.mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };

    this._onResize = this._onResize.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseLeave = this._onMouseLeave.bind(this);
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

    this._onResize();
    this._render();
  }

  FluidFlowBackground.prototype._onResize = function () {
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
  };

  FluidFlowBackground.prototype._onMouseMove = function (e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.targetX = e.clientX - rect.left;
    this.mouse.targetY = e.clientY - rect.top;
  };

  FluidFlowBackground.prototype._onMouseLeave = function () {
    this.mouse.targetX = -1000;
    this.mouse.targetY = -1000;
  };

  FluidFlowBackground.prototype._render = function () {
    if (!this.isVisible) {
      this.rafId = null;
      return;
    }

    const ctx = this.ctx;
    const width = this.width;
    const height = this.height;

    this.time += 0.008;
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.08;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.08;

    const isDark = this.getTheme() === 'dark';
    const bgColor = isDark ? '#080d1a' : '#f6f9ff';
    const lineBaseColor = isDark ? '59, 130, 246' : '30, 64, 175';
    const accentBlue = isDark ? '147, 197, 253' : '29, 78, 216';

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    const spacing = this.spacing;
    const cols = Math.ceil(width / spacing) + 1;
    const rows = Math.ceil(height / spacing) + 1;
    ctx.lineWidth = 1.2;

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = i * spacing;
        const y = j * spacing;

        let angle = Math.sin(x * 0.003 + this.time) + Math.cos(y * 0.003 + this.time);

        const dx = this.mouse.x - x;
        const dy = this.mouse.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let isNear = false;
        if (dist < 150 && dist > 0) {
          isNear = true;
          const pushAngle = Math.atan2(dy, dx) + Math.PI;
          const force = 1 - dist / 220;
          angle = angle * (1 - force) + pushAngle * force;
        }

        const lineLen = isNear ? 22 : 14;
        const x2 = x + Math.cos(angle) * lineLen;
        const y2 = y + Math.sin(angle) * lineLen;

        const alpha = isNear
          ? 0.8
          : (isDark ? 0.15 : 0.22) + Math.sin(x * 0.01 + y * 0.01 + this.time) * 0.1;

        ctx.strokeStyle = isNear
          ? `rgba(${accentBlue}, ${alpha})`
          : `rgba(${lineBaseColor}, ${alpha})`;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }

    this.rafId = requestAnimationFrame(this._render);
  };

  FluidFlowBackground.prototype.destroy = function () {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this._resizeObserver.disconnect();
    this._intersectionObserver.disconnect();
    this.section.removeEventListener('mousemove', this._onMouseMove);
    this.section.removeEventListener('mouseleave', this._onMouseLeave);
  };

  window.FluidFlowBackground = FluidFlowBackground;
})(window);