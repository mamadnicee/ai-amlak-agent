/* =========================================================
   AI REAL ESTATE — MAIN.JS
   Aspect-aware camera + car sizing
   ========================================================= */

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";


const canvas         = document.getElementById("carCanvas");
const loaderScreen   = document.getElementById("loader");
const loaderProgress = document.getElementById("loaderProgress");
const progressBar    = document.getElementById("progressBar");


const scene = new THREE.Scene();


/* =========================================================
   CAMERA — تنظیمات تطبیقی با aspect
   ========================================================= */

const aspect = window.innerWidth / window.innerHeight;

/* دوربین: روی دسکتاپ بالاتر می‌ره که به ماشین نگاه کنه */
const cameraY = aspect < 1.5 ? 1.2 : 1.8;

/* lookAt: روی دسکتاپ بالاتر، پس ماشین پایین کادر میاد */
const lookAtY = aspect < 1.5 ? 0 : 0.7;

const camera = new THREE.PerspectiveCamera(
  45,
  aspect,
  0.1,
  1000
);

camera.position.set(0, cameraY, 7);
camera.lookAt(0, lookAtY, 0);


/* =========================================================
   RENDERER
   ========================================================= */

const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = false;


/* =========================================================
   LIGHTING
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
   CAR GROUP — موقعیت پایه
   ========================================================= */

const carGroup = new THREE.Group();
carGroup.position.y = -0.6;
scene.add(carGroup);

let carReady = false;


/* =========================================================
   LOAD CAR
   ========================================================= */

new GLTFLoader().load(

  "assets/car/scene.gltf",

  (gltf) => {

    console.log("✅ Car loaded");

    const car = gltf.scene;

    const box    = new THREE.Box3().setFromObject(car);
    const size   = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    console.log("📦 Size:", size.x.toFixed(2), size.y.toFixed(2), size.z.toFixed(2));
    console.log("📏 maxDim:", maxDim.toFixed(2));


    /* ⚡ اندازه بر اساس aspect — موبایل بزرگ‌تر */
    let targetSize;
    if (aspect < 1)        targetSize = 4.8;   /* موبایل — مثل قبل بزرگ */
    else if (aspect < 1.5) targetSize = 4.6;   /* تبلت */
    else if (aspect < 2)   targetSize = 4.4;   /* دسکتاپ */
    else                   targetSize = 4.2;   /* اولتراواید */

    const sf = targetSize / maxDim;

    console.log("⚖️ Target:", targetSize, "Scale:", sf.toFixed(4));

    car.scale.setScalar(sf);
    car.position.set(-center.x * sf, -center.y * sf, -center.z * sf);


    /* متریال */
    car.traverse((c) => {
      if (c.isMesh) {
        c.frustumCulled = false;
        c.castShadow = false;
        c.receiveShadow = false;
        if (c.material) {
          c.material.envMapIntensity = 1.4;
        }
      }
    });


    carGroup.add(car);
    carReady = true;

    if (loaderProgress) loaderProgress.style.width = "100%";

    setTimeout(() => {
      if (loaderScreen) loaderScreen.classList.add("hidden");
    }, 400);

  },

  (progress) => {
    if (progress.total > 0 && loaderProgress) {
      loaderProgress.style.width = `${(progress.loaded / progress.total) * 100}%`;
    }
  },

  (error) => {
    console.error("❌ Car load error:", error);
    if (loaderProgress) loaderProgress.style.width = "100%";
    setTimeout(() => {
      if (loaderScreen) loaderScreen.classList.add("hidden");
    }, 400);
  }

);


/* =========================================================
   SCROLL
   ========================================================= */

let targetRotation  = 0;
let currentRotation = 0;

function updateScroll() {
  const y = window.scrollY || window.pageYOffset;
  const heroProgress = Math.min(y / window.innerHeight, 1);
  targetRotation = heroProgress * (Math.PI / 3);

  if (progressBar) {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll > 0) {
      progressBar.style.width = `${Math.max(5, (y / maxScroll) * 100)}%`;
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
   MOUSE
   ========================================================= */

let mouseX = 0, mouseY = 0;
let targetMouseX = 0, targetMouseY = 0;

window.addEventListener("pointermove", (e) => {
  targetMouseX = e.clientX / window.innerWidth  - 0.5;
  targetMouseY = e.clientY / window.innerHeight - 0.5;
}, { passive: true });


/* =========================================================
   RESIZE
   ========================================================= */

let lastWidth = window.innerWidth;
let resizeTimer = null;

window.addEventListener("resize", () => {
  const w = window.innerWidth;
  if (Math.abs(w - lastWidth) < 5) return;
  lastWidth = w;

  clearTimeout(resizeTimer);

  resizeTimer = setTimeout(() => {
    camera.aspect = w / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(w, window.innerHeight, false);
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


  if (carReady) {
    carGroup.rotation.y = currentRotation + mouseX * 0.10;
    carGroup.rotation.x = mouseY * 0.02;
  }


  camera.position.x = mouseX * 0.10;
  camera.position.y = cameraY - mouseY * 0.05;
  camera.position.z = 7;
  camera.lookAt(0, lookAtY, 0);

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);


/* =========================================================
   EXPLORE BUTTON
   ========================================================= */

const exploreButton = document.getElementById("exploreButton");
if (exploreButton) {
  exploreButton.addEventListener("click", () => {
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
  });
}


updateScroll();
