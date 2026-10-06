/* =========================================================
   AI REAL ESTATE
   PROPERTY INTELLIGENCE
   Motion Controller
   ========================================================= */


/* =========================================================
   LOADER
   ========================================================= */

const loader =
  document.getElementById("loader");


window.addEventListener(
  "load",
  () => {

    setTimeout(() => {

      loader.classList.add("hide");

    }, 1100);

  }
);


/* =========================================================
   REVEAL SYSTEM
   ========================================================= */

const revealElements =
  document.querySelectorAll(
    ".content-main, " +
    ".analysis-copy, " +
    ".intelligence-panel, " +
    ".persian-content, " +
    ".final-content"
  );


revealElements.forEach(
  (element) => {

    element.classList.add("reveal");

  }
);


const observer =
  new IntersectionObserver(

    (entries) => {

      entries.forEach(
        (entry) => {

          if (
            entry.isIntersecting
          ) {

            entry.target.classList.add(
              "visible"
            );

          }

        }
      );

    },

    {
      threshold: 0.18
    }

  );


revealElements.forEach(
  (element) => {

    observer.observe(element);

  }
);


/* =========================================================
   PARALLAX
   ========================================================= */

const ambientOne =
  document.querySelector(
    ".ambient-one"
  );

const ambientTwo =
  document.querySelector(
    ".ambient-two"
  );


let mouseX = 0;

let mouseY = 0;

let currentX = 0;

let currentY = 0;


window.addEventListener(
  "pointermove",
  (event) => {

    mouseX =
      (event.clientX /
        window.innerWidth - .5);

    mouseY =
      (event.clientY /
        window.innerHeight - .5);

  },
  {
    passive: true
  }
);


function animateParallax() {

  currentX +=
    (mouseX - currentX) * .035;

  currentY +=
    (mouseY - currentY) * .035;


  if (ambientOne) {

    ambientOne.style.transform =
      `translate(
        ${currentX * 25}px,
        ${currentY * 25}px
      )`;

  }


  if (ambientTwo) {

    ambientTwo.style.transform =
      `translate(
        ${currentX * -18}px,
        ${currentY * -18}px
      )`;

  }


  requestAnimationFrame(
    animateParallax
  );

}


animateParallax();


/* =========================================================
   SCROLL PROGRESS
   ========================================================= */

window.addEventListener(
  "scroll",
  () => {

    const scrollTop =
      window.scrollY;

    const documentHeight =
      document.documentElement
        .scrollHeight -
      window.innerHeight;

    const progress =
      documentHeight > 0
        ? scrollTop / documentHeight
        : 0;

    document.body.style
      .setProperty(
        "--scroll-progress",
        progress
      );

  },
  {
    passive: true
  }
);


/* =========================================================
   KEYBOARD NAVIGATION
   ========================================================= */

document.addEventListener(
  "keydown",
  (event) => {

    if (event.key === "Escape") {

      window.location.href =
        "../index.html";

    }

  }
);
