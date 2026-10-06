/* =========================================================
   AI REAL ESTATE
   THREE.JS + GLTF + CINEMATIC SCROLL
   ✅ 60° rotation on scroll (as before)
   ✅ Fixed camera (no zoom)
   ✅ Resistant to mobile URL-bar resize
   ========================================================= */

import * as THREE from "three";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";


/* =========================================================
   DOM
   ========================================================= */

const canvas = document.getElementById("carCanvas");
const loaderScreen = document.getElementById("loader");
const loaderProgress = document.getElementById("loaderProgress");
const progressBar = document.getElementById("progressBar");


/* =========================================================
   THREE SCENE
   ========================================================= */

const scene = new THREE.Scene();


/* =========================================================
   CAMERA — مقادیر ثابت و قفل‌شده
   ========================================================= */

const CAMERA_FOV   = 32;
const CAMERA_X     = 0;
const CAMERA_Y     = 1.15;
const CAMERA_Z     = 7.5;

const camera = new THREE.PerspectiveCamera(
  CAMERA_FOV,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(CAMERA_X, CAMERA_Y, CAMERA_Z);
camera.lookAt(0, 0, 0);


/* =========================================================
   RENDERER
   ========================================================= */

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: "high-performance",
  stencil: false
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = false;


/* =========================================================
   LIGHTING — بدون تغییر، دقیقاً همون قبلی
   ========================================================= */

scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d8d8, 2.2));

const keyLight = new THREE.DirectionalLight(0xffffff, 4);
keyLight.position.set(5, 8, 6);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xdfe6ff, 2);
fillLight.position.set(-5, 3, 4);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 3);
rimLight.position.set(0, 4, -6);
scene.add(rimLight);


/* =========================================================
   CAR GROUP
   ========================================================= */

const carGroup = new THREE.Group();
scene.add(carGroup);


/* =========================================================
   GLTF LOADER
   ========================================================= */

const gltfLoader = new GLTFLoader();


/* =========================================================
   LOAD CAR
   ========================================================= */

let car = null;
let carReady = false;


gltfLoader.load(

  "assets/car/scene.gltf",

  (gltf) => {

    car = gltf.scene;
    carReady = true;


    /* ── مرکز کردن ── */
    const box = new THREE.Box3().setFromObject(car);
    const center = box.getCenter(new THREE.Vector3());
    car.position.sub(center);


    /* ── مقیاس ── */
    const size = box.getSize(new THREE.Vector3());
    const maxSize = Math.max(size.x, size.y, size.z);
    const scale = 4.8 / maxSize;
    car.scale.setScalar(scale);


    /* ── ارتفاع نهایی ── */
    car.position.y = -0.8;


    /* ── متریال ── */
    car.traverse((object) => {

      if (!object.isMesh) return;

      object.castShadow = false;
      object.receiveShadow = false;

      if (object.material) {
        object.material.envMapIntensity = 1.4;
      }

    });


    carGroup.add(car);


    if (loaderProgress) {
      loaderProgress.style.width = "100%";
    }

    setTimeout(() => {

      if (loaderScreen) {
        loaderScreen.classList.add("hidden");
      }

    }, 500);

  },

  (progress) => {

    if (progress.total > 0 && loaderProgress) {

      const percent = (progress.loaded / progress.total) * 100;
      loaderProgress.style.width = `${percent}%`;

    }

  },

  (error) => {

    console.error("CAR LOAD ERROR:", error);

    if (loaderProgress) loaderProgress.style.width = "100%";

    setTimeout(() => {

      if (loaderScreen) {
        loaderScreen.classList.add("hidden");
      }

    }, 500);

  }

);


/* =========================================================
   SCROLL STATE — فقط چرخش، هیچ چیز دیگه
   ========================================================= */

let targetRotation  = 0;
let currentRotation = 0;


/* =========================================================
   SCROLL HANDLER
   ========================================================= */

function updateScroll() {

  const y = window.scrollY || window.pageYOffset;
  const heroHeight = window.innerHeight;

  /* محدوده hero: 0 → 1 */
  const heroProgress = Math.min(y / heroHeight, 1);

  /* ⚡ چرخش ۶۰ درجه در کل hero — دقیقاً مثل قبل */
  targetRotation = heroProgress * (Math.PI / 3);


  /* ── Progress bar ── */
  if (progressBar) {

    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

    if (maxScroll > 0) {

      const globalProgress = y / maxScroll;

      progressBar.style.width = `${Math.max(5, globalProgress * 100)}%`;

    }

  }

}


/* ⚡ passive + rAF throttle */
let scrollTicking = false;

window.addEventListener(

  "scroll",

  () => {

    if (!scrollTicking) {

      window.requestAnimationFrame(() => {

        updateScroll();
        scrollTicking = false;

      });

      scrollTicking = true;

    }

  },

  { passive: true }

);


/* =========================================================
   MOUSE PARALLAX — ملایم
   ========================================================= */

let mouseX = 0;
let mouseY = 0;
let targetMouseX = 0;
let targetMouseY = 0;

const PARALLAX_X = 0.12;   /* ⚡ کمتر شد تا با اسکرول جنگ نکنه */
const PARALLAX_Y = 0.05;

window.addEventListener(

  "pointermove",

  (event) => {

    targetMouseX = (event.clientX / window.innerWidth - 0.5);
    targetMouseY = (event.clientY / window.innerHeight - 0.5);

  },

  { passive: true }

);


/* =========================================================
   RESIZE — فقط اگر عرض تغییر کرد (نه ارتفاع موبایل)
   ⚡ این باگ اصلی بود: URL bar که مخفی می‌شد،
      innerHeight عوض می‌شد و canvas resize می‌شد و ماشین بزرگ می‌شد
   ========================================================= */

let lastWidth = window.innerWidth;
let resizeTimer = null;

window.addEventListener("resize", () => {

  const w = window.innerWidth;

  /* ⚡ اگر فقط ارتفاع عوض شده (URL bar) → نادیده بگیر */
  if (Math.abs(w - lastWidth) < 5) return;

  lastWidth = w;

  clearTimeout(resizeTimer);

  resizeTimer = setTimeout(() => {

    const h = window.innerHeight;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(w, h, false);  /* ⚡ false = CSS رو دست نزن */

  }, 120);

});


/* =========================================================
   ANIMATION LOOP
   ========================================================= */

let lastTime = performance.now();


function animate(now) {

  requestAnimationFrame(animate);

  const dt = Math.min(50, now - lastTime) / 1000;
  lastTime = now;

  const lerp = 1 - Math.pow(0.001, dt);


  /* ── Lerp ── */
  currentRotation += (targetRotation - currentRotation) * lerp;

  mouseX += (targetMouseX - mouseX) * lerp;
  mouseY += (targetMouseY - mouseY) * lerp;


  /* ── ماشین ── */
  if (carReady && car) {

    carGroup.rotation.y = currentRotation + mouseX * PARALLAX_X;
    carGroup.rotation.x = mouseY * 0.02;

    /* ⚡ قفل کردن مقیاس و موقعیت */
    carGroup.scale.set(1, 1, 1);
    carGroup.position.set(0, 0, 0);

  }


  /* ── دوربین: کاملاً ثابت + پارالاکس خیلی ملایم ── */
  camera.fov = CAMERA_FOV;                              /* ⚡ قفل FOV */
  camera.position.z = CAMERA_Z;                         /* ⚡ قفل Z */
  camera.position.x = CAMERA_X + mouseX * 0.10;         /* پارالاکس خیلی کم */
  camera.position.y = CAMERA_Y - mouseY * PARALLAX_Y;

  camera.lookAt(0, 0, 0);


  renderer.render(scene, camera);

}


requestAnimationFrame(animate);


/* =========================================================
   EXPLORE BUTTON
   ========================================================= */

const exploreButton = document.getElementById("exploreButton");

if (exploreButton) {

  exploreButton.addEventListener("click", () => {

    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth"
    });

  });

}


/* =========================================================
   INITIAL
   ========================================================= */

updateScroll();
