/* =========================================================
   AI REAL ESTATE
   THREE.JS + GLTF + CINEMATIC SCROLL
   Fixed camera • Only rotation on scroll • No lag
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
   CAMERA — موقعیت ثابت، هیچ‌وقت با اسکرول تغییر نمی‌کنه
   ========================================================= */

const CAMERA_BASE = {
  x: 0,
  y: 1.15,
  z: 7.5
};

const camera = new THREE.PerspectiveCamera(
  32,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(CAMERA_BASE.x, CAMERA_BASE.y, CAMERA_BASE.z);
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
   LIGHTING — دقیقاً همون نورپردازی خودت
   ========================================================= */

const ambientLight = new THREE.HemisphereLight(
  0xffffff,
  0xd8d8d8,
  2.2
);
scene.add(ambientLight);


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


    /* ── تنظیم ارتفاع نهایی ── */
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


    /* ── Loader complete ── */
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
   SCROLL STATE — فقط چرخش، دوربین ثابت
   ========================================================= */

let targetRotation = 0;
let currentRotation = 0;


/* =========================================================
   SCROLL HANDLER
   ========================================================= */

function updateScroll() {

  const y = window.scrollY || window.pageYOffset;
  const heroHeight = window.innerHeight;

  /* محدوده hero */
  const heroProgress = Math.min(y / heroHeight, 1);

  /* ⚡ فقط ۴۵ درجه در کل hero — خیلی آروم و تمیز */
  targetRotation = heroProgress * (Math.PI / 4);


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
   MOUSE PARALLAX — بسیار ملایم
   ========================================================= */

let mouseX = 0;
let mouseY = 0;
let targetMouseX = 0;
let targetMouseY = 0;


window.addEventListener(

  "pointermove",

  (event) => {

    targetMouseX = (event.clientX / window.innerWidth - 0.5);
    targetMouseY = (event.clientY / window.innerHeight - 0.5);

  },

  { passive: true }

);


/* =========================================================
   RESIZE
   ========================================================= */

let resizeTimer = null;

window.addEventListener("resize", () => {

  clearTimeout(resizeTimer);

  resizeTimer = setTimeout(() => {

    const w = window.innerWidth;
    const h = window.innerHeight;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(w, h);

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

  /* lerp factor بر اساس زمان */
  const lerp = 1 - Math.pow(0.001, dt);


  /* ── Lerp فقط چرخش و موس ── */
  currentRotation += (targetRotation - currentRotation) * lerp;

  mouseX += (targetMouseX - mouseX) * lerp;
  mouseY += (targetMouseY - mouseY) * lerp;


  /* ── ماشین ── */
  if (carReady && car) {

    carGroup.rotation.y = currentRotation + mouseX * 0.10;
    carGroup.rotation.x = mouseY * 0.02;

  }


  /* ── دوربین: ثابت + پارالاکس خیلی کم ── */
  camera.position.x = CAMERA_BASE.x + mouseX * 0.15;
  camera.position.y = CAMERA_BASE.y - mouseY * 0.06;
  camera.position.z = CAMERA_BASE.z;

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
