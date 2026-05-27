/* void. — Core Script */

(function () {
    'use strict';

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let scrollProgress   = 0;
    let cursorSize       = 10;
    let collapseProgress = 0;
    let collapseTriggered = false;

    // ── Canvas: Starfield ──
    const canvas = document.getElementById('cosmos');
    const ctx    = canvas.getContext('2d');
    let stars = [], shootingStars = [], W, H;
    let collapseOriginX = 0, collapseOriginY = 0;
    let lenis = null;

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    function createStars() {
        stars = [];
        const count = Math.min(Math.floor((W * H) / 2800), 700);
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * W,
                y: Math.random() * H,
                z: Math.random(),
                baseSize:   Math.random() * 1.4 + 0.2,
                pulse:      Math.random() * Math.PI * 2,
                pulseSpeed: Math.random() * 0.012 + 0.003,
                hue: Math.random() > 0.92 ? (Math.random() > 0.5 ? 200 : 340) : 0,
                sat: Math.random() > 0.92 ? 50 : 0,
            });
        }
    }

    function spawnShootingStar() {
        if (shootingStars.length > 2 || collapseProgress > 0.05) return;
        shootingStars.push({
            x: Math.random() * W * 0.8,
            y: Math.random() * H * 0.35,
            len:   Math.random() * 80 + 40,
            speed: Math.random() * 10 + 5,
            angle: (Math.random() * 30 + 15) * (Math.PI / 180),
            opacity: 1,
            life: 0,
        });
    }

    function drawStars() {
        ctx.clearRect(0, 0, W, H);

        const px = (mouse.x - W / 2) * 0.01;
        const py = (mouse.y - H / 2) * 0.01;
        const pullRadius   = Math.max(200, cursorSize * 3.5);
        const pullStrength = 14 + scrollProgress * 55;
        const collapseCX   = collapseTriggered ? collapseOriginX : W / 2;
        const collapseCY   = collapseTriggered ? collapseOriginY : H / 2;

        for (const s of stars) {
            s.pulse += s.pulseSpeed;
            const pulse = Math.sin(s.pulse) * 0.3 + 0.7;
            let ox = s.x + px * s.z;
            let oy = s.y + py * s.z;

            if (collapseProgress > 0) {
                // Site collapse — all stars spiral toward screen center
                const dx = ox - collapseCX;
                const dy = oy - collapseCY;
                const d  = Math.sqrt(dx * dx + dy * dy);
                if (d > 0) {
                    const force = collapseProgress * 300 + Math.pow(collapseProgress, 2) * 500;
                    const move  = Math.min(force, d * 0.98);
                    ox -= (dx / d) * move;
                    oy -= (dy / d) * move;
                }
            } else {
                // Normal: cursor gravitational pull
                const cdx    = ox - mouse.x;
                const cdy    = oy - mouse.y;
                const cDist2 = cdx * cdx + cdy * cdy;
                if (cDist2 < pullRadius * pullRadius && cDist2 > 1) {
                    const cDist = Math.sqrt(cDist2);
                    const pull  = (1 - cDist / pullRadius) * pullStrength;
                    ox -= (cdx / cDist) * pull;
                    oy -= (cdy / cDist) * pull;
                }
            }

            // Fade stars during collapse
            const starAlpha = collapseProgress > 0
                ? Math.max(0, 1 - collapseProgress * 1.4)
                : 1;

            const size = s.baseSize * pulse * (0.5 + s.z * 0.8);
            const br   = Math.floor(155 + s.z * 100);

            ctx.globalAlpha = starAlpha;
            ctx.fillStyle = s.hue
                ? `hsla(${s.hue},${s.sat}%,70%,${0.5 + s.z * 0.5})`
                : `rgba(${br},${br},${br + 12},${0.35 + s.z * 0.65})`;
            ctx.beginPath();
            ctx.arc(ox, oy, size, 0, Math.PI * 2);
            ctx.fill();

            if (s.z > 0.85 && pulse > 0.92) {
                ctx.fillStyle = `rgba(${br},${br},${br + 12},${0.07 * pulse})`;
                ctx.beginPath();
                ctx.arc(ox, oy, size * 4, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        // Shooting stars (suppressed during collapse)
        if (collapseProgress < 0.05) {
            for (let i = shootingStars.length - 1; i >= 0; i--) {
                const ss = shootingStars[i];
                ss.x += Math.cos(ss.angle) * ss.speed;
                ss.y += Math.sin(ss.angle) * ss.speed;
                ss.life++;
                ss.opacity = Math.max(0, 1 - ss.life / 55);
                if (ss.opacity <= 0) { shootingStars.splice(i, 1); continue; }
                const tx = ss.x - Math.cos(ss.angle) * ss.len;
                const ty = ss.y - Math.sin(ss.angle) * ss.len;
                const grad = ctx.createLinearGradient(tx, ty, ss.x, ss.y);
                grad.addColorStop(0, 'rgba(255,255,255,0)');
                grad.addColorStop(1, `rgba(255,255,255,${ss.opacity * 0.9})`);
                ctx.strokeStyle = grad;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(tx, ty);
                ctx.lineTo(ss.x, ss.y);
                ctx.stroke();
            }
        }

        // Nebula fog (suppressed during collapse)
        if (collapseProgress < 0.05 && scrollProgress > 0.22 && scrollProgress < 0.52) {
            const t = Math.sin(((scrollProgress - 0.22) / 0.3) * Math.PI);
            const fog = ctx.createRadialGradient(
                W * 0.65 + px * 2, H * 0.45 + py * 2, 0,
                W * 0.65, H * 0.45, W * 0.45
            );
            fog.addColorStop(0,   `rgba(200,255,0,${t * 0.04})`);
            fog.addColorStop(0.4, `rgba(80,80,160,${t * 0.04})`);
            fog.addColorStop(1,   'transparent');
            ctx.fillStyle = fog;
            ctx.fillRect(0, 0, W, H);
        }

        // ── Event Horizon ──
        if (collapseProgress > 0.04) {
            const now = performance.now() / 1000;

            // Imploding rings — contract toward center
            for (let r = 0; r < 5; r++) {
                const ph  = ((now * 1.5 + r * 0.2) % 1);
                const rad = (1 - ph) * 500 * collapseProgress;
                const alp = ph * collapseProgress * 0.16;
                if (alp < 0.01 || rad < 2) continue;
                ctx.beginPath();
                ctx.arc(collapseCX, collapseCY, rad, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(200,255,0,${alp})`;
                ctx.lineWidth   = 1.5;
                ctx.stroke();
            }

            // Accretion glow
            const glowR   = 60 + collapseProgress * 80;
            const glowGrd = ctx.createRadialGradient(collapseCX, collapseCY, 0, collapseCX, collapseCY, glowR);
            glowGrd.addColorStop(0,   'transparent');
            glowGrd.addColorStop(0.6, `rgba(200,255,80,${collapseProgress * 0.12})`);
            glowGrd.addColorStop(1,   'transparent');
            ctx.fillStyle = glowGrd;
            ctx.beginPath();
            ctx.arc(collapseCX, collapseCY, glowR, 0, Math.PI * 2);
            ctx.fill();

            // Growing black void that eats the canvas
            const maxR   = Math.sqrt(W * W + H * H);
            const holeR  = Math.pow(collapseProgress, 0.6) * maxR;
            const holeGrd = ctx.createRadialGradient(collapseCX, collapseCY, 0, collapseCX, collapseCY, holeR);
            holeGrd.addColorStop(0,   'rgba(6,6,8,1)');
            holeGrd.addColorStop(0.45, `rgba(6,6,8,${Math.min(1, collapseProgress * 1.2)})`);
            holeGrd.addColorStop(1,   'transparent');
            ctx.fillStyle = holeGrd;
            ctx.fillRect(0, 0, W, H);
        }
    }

    function tick() {
        drawStars();
        requestAnimationFrame(tick);
    }

    // ── Cursor ──
    const cursor = document.getElementById('cursor');
    const halo   = document.getElementById('cursorHalo');
    let fx = mouse.x, fy = mouse.y;

    function trackCursor(e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        if (cursor) {
            cursor.style.left = mouse.x + 'px';
            cursor.style.top  = mouse.y + 'px';
        }
        if (!collapseTriggered) applyMagnet();
    }

    // ── Text Absorption ──
    const absorbState = new Map();
    const absorbed    = new Set();   // permanently consumed elements

    const ABSORB_SEL =
        '.section-num, .section-label, .nav-logo, ' +
        '.section-heading, .section-desc, .origin-visual, ' +
        '.hero-title, .hero-eyebrow, .hero-sub, #scrollHint, ' +
        '.beyond-num, .beyond-title, ' +
        '[data-reveal-fade].revealed';

    function absorbText() {
        if (cursorSize < 22) {
            absorbState.forEach((state, el) => {
                if (state.tx !== 0 || state.ty !== 0) {
                    state.tx *= 0.85;
                    state.ty *= 0.85;
                    el.style.translate = `${state.tx}px ${state.ty}px`;
                }
            });
            return;
        }

        const absorbRadius = cursorSize * 2.6;
        const killRadius   = cursorSize * 0.55;
        const els          = document.querySelectorAll(ABSORB_SEL);

        els.forEach((el) => {
            if (absorbed.has(el)) return;

            if (!absorbState.has(el)) absorbState.set(el, { tx: 0, ty: 0 });
            const state = absorbState.get(el);
            const rect  = el.getBoundingClientRect();
            const cx    = rect.left + rect.width  * 0.5;
            const cy    = rect.top  + rect.height * 0.5;
            const dx    = fx - cx;
            const dy    = fy - cy;
            const dist  = Math.sqrt(dx * dx + dy * dy);

            let targetTx = 0, targetTy = 0;
            if (dist < absorbRadius && dist > 0) {
                const force   = Math.pow(1 - dist / absorbRadius, 2.5);
                const maxPull = cursorSize * 0.55;
                targetTx = (dx / dist) * force * maxPull;
                targetTy = (dy / dist) * force * maxPull;
            }

            state.tx += (targetTx - state.tx) * 0.1;
            state.ty += (targetTy - state.ty) * 0.1;
            el.style.translate = `${state.tx}px ${state.ty}px`;

            if (dist < killRadius && dist > 0) {
                const opacity = Math.max(0, dist / killRadius);
                el.style.opacity = String(opacity);
                if (opacity <= 0.04) {
                    // Permanently consumed by the void
                    absorbed.add(el);
                    el.style.opacity   = '0';
                    el.style.translate = '';
                }
            } else {
                el.style.opacity = '';
            }
        });
    }

    function animateHalo() {
        const targetSize = collapseTriggered
            ? 700
            : 10 + scrollProgress * scrollProgress * 220;
        cursorSize += (targetSize - cursorSize) * (collapseTriggered ? 0.025 : 0.07);

        const lerpFactor = collapseTriggered
            ? 0.004
            : Math.max(0.022, 0.11 - scrollProgress * 0.088);
        fx += (mouse.x - fx) * lerpFactor;
        fy += (mouse.y - fy) * lerpFactor;

        if (cursor) {
            cursor.style.width     = cursorSize + 'px';
            cursor.style.height    = cursorSize + 'px';
            const glow             = collapseTriggered ? cursorSize * 0.14 : scrollProgress * 18;
            const alpha            = collapseTriggered ? 0.4 : 0.2 + scrollProgress * 0.25;
            cursor.style.boxShadow = `0 0 ${6 + glow}px rgba(200,255,0,${alpha})`;
        }
        if (halo) {
            halo.style.left        = fx + 'px';
            halo.style.top         = fy + 'px';
            const haloSize         = Math.max(44, cursorSize * 3.8);
            halo.style.width       = haloSize + 'px';
            halo.style.height      = haloSize + 'px';
            const haloAlpha        = collapseTriggered ? 0.05 : 0.1 + scrollProgress * 0.12;
            halo.style.borderColor = `rgba(200,255,0,${haloAlpha})`;
        }

        if (!collapseTriggered) absorbText();

        requestAnimationFrame(animateHalo);
    }

    // ── DOM Magnetic Effect ──
    const magEls = document.querySelectorAll('.mag');

    function applyMagnet() {
        magEls.forEach((el) => {
            const rect = el.getBoundingClientRect();
            const cx   = rect.left + rect.width  / 2;
            const cy   = rect.top  + rect.height / 2;
            const dx   = mouse.x - cx;
            const dy   = mouse.y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const threshold = 90;
            if (dist < threshold && dist > 0) {
                const force = 1 - dist / threshold;
                el.style.translate = `${dx * force * 0.28}px ${dy * force * 0.28}px`;
            } else {
                el.style.translate = '';
            }
        });
    }

    // ── Text Scramble ──
    function scramble(el, finalText, duration) {
        const chars = '!<>-_\\/[]{}—=+*^?#∅∞◯×';
        let frame = 0;
        const total = Math.floor(duration / 16);
        const id = setInterval(() => {
            el.textContent = finalText.split('').map((ch, i) => {
                if (frame / total > i / finalText.length) return ch;
                return chars[Math.floor(Math.random() * chars.length)];
            }).join('');
            frame++;
            if (frame >= total) { el.textContent = finalText; clearInterval(id); }
        }, 16);
    }

    window._voidScramble = scramble;

    // ── Site Collapse ──
    window._voidCollapse = function () {
        if (collapseTriggered) return;

        // Lock collapse origin at current cursor/halo position
        collapseOriginX = fx;
        collapseOriginY = fy;
        collapseTriggered = true;

        // Stop scroll during collapse, re-enable after so user can slide up to void
        if (lenis) {
            lenis.stop();
            setTimeout(() => { if (lenis) lenis.start(); }, 2200);
        }

        const section = document.querySelector('.section-choice');
        const footer  = document.querySelector('.section-choice .footer');
        const textEls = document.querySelectorAll(
            '.beyond-num, .beyond-label.revealed, ' +
            '.beyond-title .rline.revealed, ' +
            '.beyond-question.revealed, .beyond-manifesto.revealed'
        );

        // ── Choice section: background bleeds to void ──
        gsap.to(section, { backgroundColor: '#060608', duration: 1.6, ease: 'power2.inOut' });

        // Footer survives — transition to void palette so it's visible on dark bg
        if (footer) {
            gsap.to(footer, {
                color:          'rgba(180,190,210,0.22)',
                borderTopColor: 'rgba(180,190,210,0.07)',
                duration: 1.4,
                delay:    1.0,
                ease:     'power2.inOut',
            });
            const link = footer.querySelector('a');
            if (link) gsap.to(link, { color: 'rgba(180,190,210,0.45)', duration: 1.4, delay: 1.0 });
        }

        // ── Suck visible choice section text toward cursor ──
        textEls.forEach((el, i) => {
            el.style.translate = '';
            const rect = el.getBoundingClientRect();
            const dx = collapseOriginX - (rect.left + rect.width  * 0.5);
            const dy = collapseOriginY - (rect.top  + rect.height * 0.5);
            gsap.to(el, {
                x:       dx,
                y:       dy,
                scale:   0.01,
                opacity: 0,
                duration: 1.4 + i * 0.04,
                delay:   0.08 + i * 0.07,
                ease:    'power3.in',
            });
        });

        // ── Consume every section above (void spreads upward) ──
        gsap.to('#nav', { opacity: 0, duration: 0.7, delay: 0.3, ease: 'power2.in' });
        gsap.to('.section-paradox', { opacity: 0, duration: 1.0, delay: 0.5, ease: 'power2.in' });
        gsap.to('.section-acceleration', { opacity: 0, duration: 1.0, delay: 0.75, ease: 'power2.in' });
        gsap.to('.section-ignition',     { opacity: 0, duration: 1.0, delay: 1.0,  ease: 'power2.in' });
        gsap.to('.section-hero',         { opacity: 0, duration: 1.0, delay: 1.25, ease: 'power2.in' });

        // ── Drive canvas collapse ──
        const proxy = { p: 0 };
        gsap.to(proxy, {
            p:        1,
            duration: 4,
            ease:     'power2.in',
            onUpdate() { collapseProgress = proxy.p; },
        });
    };

    // ── Loader ──
    function runLoader() {
        return new Promise((resolve) => {
            const loaderText = document.getElementById('loaderText');
            const fill       = document.getElementById('loaderFill');
            const loader     = document.getElementById('loader');

            loaderText.textContent = '';
            setTimeout(() => scramble(loaderText, 'void.', 900), 200);

            gsap.to(fill, {
                width: '100%',
                duration: 1.5,
                ease: 'power2.inOut',
                delay: 0.4,
                onComplete: () => {
                    gsap.to(loader, {
                        opacity: 0,
                        duration: 0.5,
                        delay: 0.15,
                        ease: 'power2.inOut',
                        onComplete: () => {
                            loader.style.display = 'none';
                            resolve();
                        },
                    });
                },
            });
        });
    }

    // ── Hero Entrance ──
    function animateHero() {
        const voidWord = document.getElementById('voidWord');
        const tl = gsap.timeline();

        tl.to('#nav', { opacity: 1, duration: 0.7, ease: 'power2.out' })
          .to('.hero-eyebrow', { opacity: 1, duration: 0.6, ease: 'power2.out' }, '-=0.3')
          .to(['.hero-t1 span', '.hero-t2 span'], {
              y: '0%', opacity: 1, duration: 1, stagger: 0.14, ease: 'power3.out',
          }, '-=0.3')
          .add(() => {
              if (voidWord) {
                  gsap.to(voidWord, { opacity: 1, duration: 0.15 });
                  setTimeout(() => scramble(voidWord, 'void.', 950), 100);
              }
          }, '-=0.15')
          .to('.hero-sub',   { opacity: 1, duration: 0.6, ease: 'power2.out' }, '+=0.5')
          .to('#scrollHint', { opacity: 1, duration: 0.6, ease: 'power2.out' }, '-=0.2');
    }

    // ── Scroll Animations ──
    function setupScrollAnimations() {
        gsap.registerPlugin(ScrollTrigger);

        ScrollTrigger.create({
            start: 'top top',
            end: 'bottom bottom',
            onUpdate: (self) => {
                scrollProgress = self.progress;
                gsap.set('#progressBar', { width: (scrollProgress * 100) + '%' });
            },
        });

        gsap.to('.hero-content', {
            y: -110, opacity: 0, ease: 'none',
            scrollTrigger: { trigger: '.section-hero', start: 'top top', end: 'bottom top', scrub: true },
        });

        gsap.to('#scrollHint', {
            opacity: 0, ease: 'none',
            scrollTrigger: { trigger: '.section-hero', start: '10% top', end: '30% top', scrub: true },
        });

        gsap.to('#originCircle', {
            scale: 1.3, opacity: 0.5, ease: 'none',
            scrollTrigger: { trigger: '.section-ignition', start: 'top bottom', end: 'bottom top', scrub: true },
        });

        gsap.utils.toArray('.section-num').forEach((num) => {
            const section = num.closest('.section');
            if (!section) return;
            gsap.to(num, {
                y: '12%', ease: 'none',
                scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
            });
        });

        ScrollTrigger.refresh();
    }

    // ── Init ──
    async function init() {
        resize();
        createStars();
        tick();
        animateHalo();

        window.addEventListener('resize', () => { resize(); createStars(); ScrollTrigger.refresh(); });
        window.addEventListener('mousemove', trackCursor);

        setInterval(() => { if (Math.random() > 0.55) spawnShootingStar(); }, 4500);

        await runLoader();

        lenis = new Lenis({ lerp: 0.07, smoothWheel: true });
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
        lenis.on('scroll', ScrollTrigger.update);

        document.querySelectorAll('a[href^="#"]').forEach((a) => {
            a.addEventListener('click', (e) => {
                if (collapseTriggered) return; // reload handles it
                e.preventDefault();
                const target = document.querySelector(a.getAttribute('href'));
                if (target) lenis.scrollTo(target, { duration: 1.4 });
            });
        });

        animateHero();
        setupScrollAnimations();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
