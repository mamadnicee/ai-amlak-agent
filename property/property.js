/* =========================================================
   AI REAL ESTATE
   PROPERTY INTELLIGENCE — Motion Controller
   ========================================================= */

(function () {
  'use strict';

  /* =========================================================
     1. LOADER — بعد از لود کامل مخفی می‌شه
     ========================================================= */
  const loader = document.getElementById('loader');
  if (loader) {
    window.addEventListener('load', () => {
      setTimeout(() => loader.classList.add('hide'), 900);
    });
    // فالبک: اگه load دیر شد
    setTimeout(() => loader.classList.add('hide'), 3500);
  }


  /* =========================================================
     2. NAVBAR — hide on scroll down, show on scroll up
     ========================================================= */
  const navbar = document.getElementById('navbar');
  let lastY = window.scrollY;
  let ticking = false;

  function handleNavbar() {
    const y = window.scrollY;
    if (!navbar) return;

    if (y > 80 && y > lastY) {
      navbar.classList.add('nav-hidden');
    } else {
      navbar.classList.remove('nav-hidden');
    }
    lastY = y;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(handleNavbar);
      ticking = true;
    }
  }, { passive: true });


  /* =========================================================
     3. REVEAL — همه اجزای دارای data-reveal
     ========================================================= */
  const revealItems = document.querySelectorAll('[data-reveal]');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -70px 0px'
      }
    );

    revealItems.forEach((el) => revealObserver.observe(el));
  } else {
    // فالبک برای مرورگرهای قدیمی
    revealItems.forEach((el) => el.classList.add('reveal'));
  }


  /* =========================================================
     4. SIGNAL BARS — وقتی پنل وارد دید شد، پر شوند
     ========================================================= */
  const signals = document.querySelectorAll('.signal');

  if (signals.length && 'IntersectionObserver' in window) {
    const signalObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal');
            signalObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    signals.forEach((el) => signalObserver.observe(el));
  }


  /* =========================================================
     5. SCROLL PROGRESS — CSS variable
     ========================================================= */
  let progressTicking = false;

  window.addEventListener('scroll', () => {
    if (!progressTicking) {
      window.requestAnimationFrame(() => {
        const docH = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docH > 0 ? window.scrollY / docH : 0;
        document.body.style.setProperty('--scroll-progress', progress.toFixed(4));
        progressTicking = false;
      });
      progressTicking = true;
    }
  }, { passive: true });


  /* =========================================================
     6. PARALLAX — ambient lights با موس
     (فقط روی دسکتاپ، سبک و بدون لگ)
     ========================================================= */
  const ambientOne = document.querySelector('.ambient-one');
  const ambientTwo = document.querySelector('.ambient-two');

  const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (isDesktop && !reduceMotion && (ambientOne || ambientTwo)) {
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    let rafId = null;

    window.addEventListener('pointermove', (event) => {
      targetX = (event.clientX / window.innerWidth - 0.5);
      targetY = (event.clientY / window.innerHeight - 0.5);

      if (!rafId) rafId = requestAnimationFrame(animateParallax);
    }, { passive: true });

    function animateParallax() {
      currentX += (targetX - currentX) * 0.045;
      currentY += (targetY - currentY) * 0.045;

      if (ambientOne) {
        ambientOne.style.transform =
          `translate(${currentX * 28}px, ${currentY * 28}px)`;
      }
      if (ambientTwo) {
        ambientTwo.style.transform =
          `translate(${currentX * -20}px, ${currentY * -20}px)`;
      }

      // ادامه بده تا نزدیک هدف شد
      if (Math.abs(currentX - targetX) > 0.001 ||
          Math.abs(currentY - targetY) > 0.001) {
        rafId = requestAnimationFrame(animateParallax);
      } else {
        rafId = null;
      }
    }
  }


  /* =========================================================
     7. KEYBOARD — Escape → برگشت به صفحه اصلی
     ========================================================= */
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      window.location.href = '../index.html';
    }
  });


  /* =========================================================
     8. SCROLL PERFORMANCE HINT
     ========================================================= */
  // اسکرول اصلی رو نرم نگه دار (فقط hint، رفتار پیش‌فرض)
  document.documentElement.style.scrollBehavior = 'smooth';

})();
