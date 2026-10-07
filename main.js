/* =========================================================
   AI REAL ESTATE — MAIN.JS
   Aspect-aware car sizing + Fixed camera
   ========================================================= */

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";


const canvas         = document.getElementById("carCanvas");
const loaderScreen   = document.getElementById("loader");
const loaderProgress = document.getElementById("loaderProgress");
const progressBar    = document.getElementById("progressBar");


/* =========================================================
   SCENE
   ========================================================= */

const scene = new THREE.Scene();


/* =========================================================
   CAMERA — FOV و Z ثابت، فقط موقعیت‌دهی adapt
   ========================================================= */

const CAMERA_FOV = 32;
const CAMERA_X   = 0;
const CAMERA_Y   = 0.3;
const CAMERA_Z   = 7;

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
   LIGHTING — همون نورپردازی خودت
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

let carReady = false;


/* =========================================================
   COMPUTE SIZE BASED ON ASPECT
   ⚡ روی دسکتاپ پهن، ماشین بزرگ‌تر می‌شه که معلوم باشه
   ========================================================= */

function computeTargetSize() {
  const aspect = window.innerWidth / window.innerHeight;
  /* موبایل (aspect < 1.2): 4.8 | دسکتاپ پهن: بالاتر */
  if (aspect < 1.2) return 4.8;
  return 4.8 + (aspect - 1.2) * 2.2;
}

function computeYOffset() {
  const aspect = window.innerWidth / window.innerHeight;
  return aspect < 1.2 ? -0.8 : -0.6;
}


/* =========================================================
   LOAD CAR
   ========================================================= */

gltfLoader.load(

  "assets/car/scene.gltf",

  (gltf) => {

    const raw = gltf.scene;


    /* ── bounds ── */
    const box    = new THREE.Box3().setFromObject(raw);
    const size   = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);


    /* ── مقیاس تطبیقی ── */
    const targetSize = computeTargetSize();
    const yOffset    = computeYOffset();
    const scaleFactor = targetSize / maxDim;


    /* ── مرکز کردن مدل داخل wrapper ── */
    raw.position.set(-center.x, -center.y, -center.z);


    /* ── wrapper برای scale ── */
    const wrapper = new THREE.Group();
    wrapper.add(raw);
    wrapper.scale.setScalar(scaleFactor);
    wrapper.position.y = yOffset;


    /* ── متریال ── */
    raw.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = false;
        if (child.material) {
          child.material.envMapIntensity = 1.4;
        }
      }
    });


    carGroup.add(wrapper);
    carReady = true;


    /* ── Loader ── */
    if (loaderProgress) {
      loaderProgress.style.width = "100%";
    }

    setTimeout(() => {
      if (loaderScreen) {
        loaderScreen.classList.add("hidden");
      }
    }, 400);

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
    }, 400);

  }

);


/* =========================================================
   SCROLL STATE
   ========================================================= */

let targetRotation  = 0;
let currentRotation = 0;


function updateScroll() {

  const y          = window.scrollY || window.pageYOffset;
  const heroHeight = window.innerHeight;
  const heroProgress = Math.min(y / heroHeight, 1);

  /* ۶۰ درجه چرخش */
  targetRotation = heroProgress * (Math.PI / 3);


  if (progressBar) {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll > 0) {
      const gp = y / maxScroll;
      progressBar.style.width = `${Math.max(5, gp * 100)}%`;
    }
  }

}


let scrollTicking = false;

window.addEventListener("scroll", () => {

  if (!scrollTicking) {
    window.requestAnimationFrame(() => {
      updateScroll();
      scrollTicking = false;
    });
    scrollTicking = true;
  }

}, { passive: true });


/* =========================================================
   MOUSE PARALLAX
   ========================================================= */

let mouseX = 0, mouseY = 0;
let targetMouseX = 0, targetMouseY = 0;

window.addEventListener("pointermove", (e) => {

  targetMouseX = (e.clientX / window.innerWidth  - 0.5);
  targetMouseY = (e.clientY / window.innerHeight - 0.5);

}, { passive: true });


/* =========================================================
   RESIZE — فقط با تغییر عرض
   ========================================================= */

let lastWidth = window.innerWidth;
let resizeTimer = null;

window.addEventListener("resize", () => {

  const w = window.innerWidth;
  if (Math.abs(w - lastWidth) < 5) return;
  lastWidth = w;

  clearTimeout(resizeTimer);

  resizeTimer = setTimeout(() => {

    const h = window.innerHeight;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(w, h, false);

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

  currentRotation += (targetRotation - currentRotation) * lerp;
  mouseX += (targetMouseX - mouseX) * lerp;
  mouseY += (targetMouseY - mouseY) * lerp;


  /* ماشین */
  if (carReady) {
    carGroup.rotation.y = currentRotation + mouseX * 0.10;
    carGroup.rotation.x = mouseY * 0.02;
  }


  /* دوربین — قفل */
  camera.position.x = CAMERA_X + mouseX * 0.10;
  camera.position.y = CAMERA_Y - mouseY * 0.05;
  camera.position.z = CAMERA_Z;

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


updateScroll();
