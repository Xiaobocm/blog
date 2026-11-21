/* ==========================================================================
   A small particle field: sea-blue triangles and thin lines on a quiet page.
   No library. It pauses when the tab is hidden and respects reduced motion.
   ========================================================================== */

(() => {
  "use strict";

  const canvas = document.getElementById("particles");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const COLOR = "77, 145, 173";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mouse = { x: null, y: null, active: false };

  let width = 0;
  let height = 0;
  let particles = [];
  let frame = 0;

  const rand = (min, max) => min + Math.random() * (max - min);

  function makeParticle(x, y) {
    return {
      x: x ?? rand(0, width),
      y: y ?? rand(0, height),
      vx: rand(-0.7, 0.7),
      vy: rand(-0.7, 0.7),
      size: rand(2.2, 6.2),
      opacity: rand(0.24, 0.88),
      angle: rand(0, Math.PI * 2),
      spin: rand(-0.009, 0.009),
      phase: rand(0, Math.PI * 2),
    };
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.max(8, Math.min(24, Math.round((width * height) / 82000)));
    particles = Array.from({ length: count }, () => makeParticle());

    if (reducedMotion) {
      draw(true);
    }
  }

  function draw(staticFrame = false) {
    // requestAnimationFrame passes a timestamp. Keep only an explicit `true`
    // as the static-frame flag, otherwise the animation stops after one frame.
    staticFrame = staticFrame === true;
    ctx.clearRect(0, 0, width, height);

    for (const particle of particles) {
      if (!staticFrame) {
        if (mouse.active) {
          const dx = particle.x - mouse.x;
          const dy = particle.y - mouse.y;
          const distance = Math.hypot(dx, dy);
          if (distance > 0 && distance < 140) {
            const force = (140 - distance) / 140;
            particle.vx += (dx / distance) * force * 0.025;
            particle.vy += (dy / distance) * force * 0.025;
          }
        }

        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.angle += particle.spin;
        particle.phase += 0.018;

        particle.vx *= 0.998;
        particle.vy *= 0.998;

        if (Math.abs(particle.vx) < 0.12) {
          particle.vx += rand(-0.01, 0.01);
        }
        if (Math.abs(particle.vy) < 0.12) {
          particle.vy += rand(-0.01, 0.01);
        }

        if (particle.x < -10) particle.x = width + 10;
        if (particle.x > width + 10) particle.x = -10;
        if (particle.y < -10) particle.y = height + 10;
        if (particle.y > height + 10) particle.y = -10;
      }

      const alpha = staticFrame
        ? particle.opacity
        : particle.opacity * (0.82 + Math.sin(particle.phase) * 0.18);

      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.angle);
      ctx.beginPath();
      ctx.moveTo(0, -particle.size);
      ctx.lineTo(particle.size * 0.9, particle.size * 0.7);
      ctx.lineTo(-particle.size * 0.9, particle.size * 0.7);
      ctx.closePath();
      ctx.fillStyle = `rgba(${COLOR}, ${alpha})`;
      ctx.fill();
      ctx.restore();
    }

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance >= 160) continue;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(${COLOR}, ${(1 - distance / 160) * 0.3})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    if (!staticFrame && !reducedMotion) {
      frame = window.requestAnimationFrame(() => draw());
    }
  }

  window.addEventListener("resize", resize, { passive: true });

  window.addEventListener(
    "mousemove",
    (event) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      mouse.active = true;
    },
    { passive: true }
  );

  window.addEventListener("mouseleave", () => {
    mouse.active = false;
  });

  window.addEventListener("click", (event) => {
    if (reducedMotion || particles.length >= 26) return;
    particles.push(makeParticle(event.clientX, event.clientY));
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.cancelAnimationFrame(frame);
      return;
    }
    if (!reducedMotion) {
      window.cancelAnimationFrame(frame);
      draw();
    }
  });

  resize();
  if (!reducedMotion) draw();
})();
