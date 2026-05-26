/* void. — Motion effects */

(function () {
    const { animate } = Motion;

    // ── Section text & fade reveals via IntersectionObserver ──
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(({ target, isIntersecting }) => {
            if (!isIntersecting) return;
            target.querySelectorAll('.rline').forEach((line) => {
                line.classList.add('revealed');
                // Scramble text as it materializes from the void
                if (window._voidScramble && line.dataset.text) {
                    window._voidScramble(line, line.dataset.text, 950);
                }
            });
            const parent = target.closest('.section-body') || target.closest('.beyond-inner');
            if (parent) {
                parent.querySelectorAll('[data-reveal-fade]').forEach((el) => el.classList.add('revealed'));
                const cta = parent.querySelector('.beyond-cta');
                if (cta) cta.classList.add('revealed');
            }
            revealObserver.unobserve(target);
        });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

    document.querySelectorAll('[data-reveal]').forEach((el) => revealObserver.observe(el));

    // ── Standalone fade reveals (beyond-label) ──
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(({ target, isIntersecting }) => {
            if (!isIntersecting) return;
            target.classList.add('revealed');
            fadeObserver.unobserve(target);
        });
    }, { rootMargin: '0px 0px -5% 0px', threshold: 0.2 });

    document.querySelectorAll('[data-reveal-fade]:not(.section-body [data-reveal-fade])').forEach((el) => {
        fadeObserver.observe(el);
    });

    // ── CTA hover scale via Motion ──
    const cta = document.querySelector('.beyond-cta');
    if (cta) {
        cta.addEventListener('mouseenter', () => animate(cta, { scale: 1.04 }, { duration: 0.2 }));
        cta.addEventListener('mouseleave', () => animate(cta, { scale: 1 }, { duration: 0.25 }));
    }
})();
