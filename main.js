/* void. — Core Script */

(function () {
    'use strict';

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let scrollProgress = 0;

    // ── Canvas: Starfield ──
    const canvas = document.getElementById('cosmos');
    const ctx = canvas.getContext('2d');
    let stars = [], shootingStars = [], W, H;

    function resize() {
        W = canvas.width = window.innerWidth;
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
                baseSize: Math.random() * 1.4 + 0.2,
                pulse: Math.random() * Math.PI * 2,
                pulseSpeed: Math.random() * 0.012 + 0.003,
                hue: Math.random() > 0.92 ? (Math.random() > 0.5 ? 200 : 340) : 0,
                sat: Math.random() > 0.92 ? 50 : 0,
            });
        }
    }

    function spawnShootingStar() {
        if (shootingStars.length > 2) return;
        shootingStars.push({
            x: Math.random() * W * 0.8,
            y: Math.random() * H * 0.35,
            len: Math.random() * 80 + 40,
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

        for (const s of stars) {
            s.pulse += s.pulseSpeed;
            const pulse = Math.sin(s.pulse) * 0.3 + 0.7;
            let ox = s.x + px * s.z;
            let oy = s.y + py * s.z;

            // Black hole cursor — gravitational pull on nearby stars
            const cdx = ox - mouse.x;
            const cdy = oy - mouse.y;
            const cDist2 = cdx * cdx + cdy * cdy;
            if (cDist2 < 40000 && cDist2 > 1) {
                const cDist = Math.sqrt(cDist2);
                const pull = (1 - cDist / 200) * 14;
                ox -= (cdx / cDist) * pull;
                oy -= (cdy / cDist) * pull;
            }

            const size = s.baseSize * pulse * (0.5 + s.z * 0.8);
            const br = Math.floor(155 + s.z * 100);

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
        }

        // Shooting stars
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

        // Nebula fog — appears in the acceleration zone
        if (scrollProgress > 0.22 && scrollProgress < 0.52) {
            const t = Math.sin(((scrollProgress - 0.22) / 0.3) * Math.PI);
            const fog = ctx.createRadialGradient(
                W * 0.65 + px * 2, H * 0.45 + py * 2, 0,
                W * 0.65, H * 0.45, W * 0.45
            );
            fog.addColorStop(0, `rgba(200,255,0,${t * 0.04})`);
            fog.addColorStop(0.4, `rgba(80,80,160,${t * 0.04})`);
            fog.addColorStop(1, 'transparent');
            ctx.fillStyle = fog;
            ctx.fillRect(0, 0, W, H);
        }
    }

    function tick() {
        drawStars();
        requestAnimationFrame(tick);
    }

    // ── Cursor ──
    const cursor = document.getElementById('cursor');
    const halo = document.getElementById('cursorHalo');
    let fx = mouse.x, fy = mouse.y;

    function trackCursor(e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        if (cursor) {
            cursor.style.left = mouse.x + 'px';
            cursor.style.top = mouse.y + 'px';
        }
        applyMagnet();
    }

    function animateHalo() {
        fx += (mouse.x - fx) * 0.11;
        fy += (mouse.y - fy) * 0.11;
        if (halo) {
            halo.style.left = fx + 'px';
            halo.style.top = fy + 'px';
        }
        requestAnimationFrame(animateHalo);
    }

    // ── DOM Magnetic Effect ──
    const magEls = document.querySelectorAll('.mag');

    function applyMagnet() {
        magEls.forEach((el) => {
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = mouse.x - cx;
            const dy = mouse.y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const threshold = 90;
            if (dist < threshold && dist > 0) {
                const force = 1 - dist / threshold;
                // Use individual translate property to compose with other transforms
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

    // ── Loader ──
    function runLoader() {
        return new Promise((resolve) => {
            const loaderText = document.getElementById('loaderText');
            const fill = document.getElementById('loaderFill');
            const loader = document.getElementById('loader');

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
              y: '0%',
              opacity: 1,
              duration: 1,
              stagger: 0.14,
              ease: 'power3.out',
          }, '-=0.3')
          .add(() => {
              if (voidWord) {
                  gsap.to(voidWord, { opacity: 1, duration: 0.15 });
                  setTimeout(() => scramble(voidWord, 'void.', 950), 100);
              }
          }, '-=0.15')
          .to('.hero-sub', { opacity: 1, duration: 0.6, ease: 'power2.out' }, '+=0.5')
          .to('#scrollHint', { opacity: 1, duration: 0.6, ease: 'power2.out' }, '-=0.2');
    }

    // ── Scroll Animations ──
    function setupScrollAnimations() {
        gsap.registerPlugin(ScrollTrigger);

        // Global scroll progress
        ScrollTrigger.create({
            start: 'top top',
            end: 'bottom bottom',
            onUpdate: (self) => {
                scrollProgress = self.progress;
                gsap.set('#progressBar', { width: (scrollProgress * 100) + '%' });
            },
        });

        // Hero content parallax out
        gsap.to('.hero-content', {
            y: -110,
            opacity: 0,
            ease: 'none',
            scrollTrigger: {
                trigger: '.section-hero',
                start: 'top top',
                end: 'bottom top',
                scrub: true,
            },
        });

        gsap.to('#scrollHint', {
            opacity: 0,
            ease: 'none',
            scrollTrigger: {
                trigger: '.section-hero',
                start: '10% top',
                end: '30% top',
                scrub: true,
            },
        });

        // Origin circle expand on scroll
        gsap.to('#originCircle', {
            scale: 1.3,
            opacity: 0.5,
            ease: 'none',
            scrollTrigger: {
                trigger: '.section-ignition',
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
            },
        });

        // Section watermark parallax
        gsap.utils.toArray('.section-num').forEach((num) => {
            const section = num.closest('.section');
            if (!section) return;
            gsap.to(num, {
                y: '12%',
                ease: 'none',
                scrollTrigger: {
                    trigger: section,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                },
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

        window.addEventListener('resize', () => {
            resize();
            createStars();
            ScrollTrigger.refresh();
        });

        window.addEventListener('mousemove', trackCursor);

        setInterval(() => {
            if (Math.random() > 0.55) spawnShootingStar();
        }, 4500);

        await runLoader();

        const lenis = new Lenis({ lerp: 0.07, smoothWheel: true });
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
        lenis.on('scroll', ScrollTrigger.update);

        document.querySelectorAll('a[href^="#"]').forEach((a) => {
            a.addEventListener('click', (e) => {
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
