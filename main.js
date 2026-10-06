/* =========================================================
   AI REAL ESTATE — MAIN JAVASCRIPT
   3D Car Scene + Cinematic Scroll + Loader
   ========================================================= */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


/* =========================================================
   1. DOM REFS
   ========================================================= */

const canvas      = document.getElementById('carCanvas');
const loaderEl    = document.getElementById('loader');
const progressEl  = document.getElementById('loaderProgress');
const sceneWrap   = document.getElementById('scene-container');
const progressBar = document.getElementById('progressBar');
const exploreBtn  = document.getElementById('exploreButton');


/* =========================================================
   2. SCENE SETUP
   ========================================================= */

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  38,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true,
  powerPreference: 'high-performance',
  stencil: false,
  depth: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.outputColorSpace = THREE.SRGBColorSpace;


/* =========================================================
   3. LIGHTING
   ========================================================= */

scene.add(new THREE.AmbientLight(0xffffff, 1.1));

const hemi = new THREE.HemisphereLight(0xffffff, 0xbbbbbb, 1.4);
hemi.position.set(0, 20, 0);
scene.add(hemi);

const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
keyLight.position.set(8, 12, 8);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.bias = -0.0005;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.9);
fillLight.position.set(-10, 6, -8);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xa8b6ff, 0.7);
rimLight.position.set(0, 4, -12);
scene.add(rimLight);


/* =========================================================
   4. CAMERA + CAR STATE
   ========================================================= */

/* هدف اولیه دوربین */
const cameraTarget = new THREE.Vector3(0, 0.4, 0);

camera.position.set(0, 1.1, 6.5);
camera.lookAt(cameraTarget);

let carModel = null;

/* مقادیر زاویه سینمایی برای ۳ صحنه */
const ANGLES = {
  front:   0,                    // جلو
  quarter: Math.PI * 0.28,       // ~۵۰ درجه (نمای سه‌رخ)
  side:    Math.PI * 0.5         // پهلوی کامل
};

/* مقادیر FOV برای هر صحنه */
const FOV = {
  front:   38,
  quarter: 34,
  side:    30
};


/* =========================================================
   5. LOAD CAR MODEL
   ========================================================= */

const gltfLoader = new GLTFLoader();

gltfLoader.load(
  'assets/car/scene.gltf',

  /* onLoad */
  (gltf) => {

    carModel = gltf.scene;

    /* ── محاسبه bounding box برای مقیاس و مرکز ── */
    const box    = new THREE.Box3().setFromObject(carModel);
    const size   = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    /* مقیاس هدف */
    const targetScale = 3.6 / maxDim;

    carModel.scale.setScalar(targetScale);

    /* مرکز ماشین روی (0, y, 0) */
    carModel.position.set(
      -center.x * targetScale,
      -center.y * targetScale - 0.15,
      -center.z * targetScale
    );

    /* سایه + دریافت نور */
    carModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.envMapIntensity = 0.9;
        }
      }
    });

    /* ⚡ ماشین رو مخفی کن تا با بعد از آماده شدن کامل ظاهر شه */
    carModel.visible = false;

    scene.add(carModel);

    /* ── FIX: هرگونه transform CSS که ممکنه با JS جنگ کنه رو پاک کن ── */
    if (sceneWrap) {
      sceneWrap.style.transform = 'none';
    }

    /* ⚡ بعد از فریم بعدی، ماشین رو با fade نرم نشون بده */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        carModel.visible = true;
        carModel.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.transparent = true;
            child.material.opacity = 0;
            animateOpacity(child.material, 1, 700);
          }
        });
      });
    });

    /* ── ScrollTrigger / Scroll listener رو با تاخیر بذار ── */
    setTimeout(setupScrollAnimation, 100);

    /* پنهان کردن لودر */
    setTimeout(() => {
      if (loaderEl) loaderEl.classList.add('hidden');
    }, 900);

  },

  /* onProgress */
  (xhr) => {

    if (xhr.total && progressEl) {
      const pct = Math.min(100, (xhr.loaded / xhr.total) * 100);
      progressEl.style.width = pct + '%';
    }

  },

  /* onError */
  (error) => {

    console.error('[Car model error]', error);

    /* در صورت خطا، بازم لودر رو ببند */
    if (loaderEl) loaderEl.classList.add('hidden');

  }
);


/* =========================================================
   6. HELPERS
   ========================================================= */

/* Fade in material */
function animateOpacity(material, target, duration) {

  const start    = performance.now();
  const startVal = material.opacity;

  function tick(now) {

    const t = Math.min(1, (now - start) / duration);
    /* ease-out cubic */
    const eased = 1 - Math.pow(1 - t, 3);

    material.opacity = startVal + (target - startVal) * eased;

    if (t < 1) requestAnimationFrame(tick);

  }

  requestAnimationFrame(tick);

}


/* =========================================================
   7. SCROLL ANIMATION (بدون GSAP — فقط rAF + lerp)
   ========================================================= */

/* مقادیر هدف (تیون اسکرول) */
let scrollTargetRotY  = ANGLES.front;
let scrollTargetFov   = FOV.front;

/* مقادیر فعلی (lerp) */
let currentRotY  = ANGLES.front;
let currentFov   = FOV.front;

/* وضعیت */
let scrollProgress = 0;
let scrollActive   = false;


function setupScrollAnimation() {

  if (!carModel) return;

  /* شروع به گوش دادن به اسکرول */
  window.addEventListener('scroll', onScroll, { passive: true });

  /* init */
  onScroll();

}


function onScroll() {

  const y = window.scrollY || window.pageYOffset;
  const vh = window.innerHeight;

  /* محدوده اسکرول: از 0 تا ارتفاع Hero */
  const heroHeight = vh;
  const p = Math.min(1, Math.max(0, y / heroHeight));

  scrollProgress = p;

  /* ⚡ CINEMATIC CUT بین ۳ زاویه:
     - 0   → 0.33   : جلو (front)
     - 0.33 → 0.66  : سه‌رخ (quarter)
     - 0.66 → 1.0   : پهلو (side)
  */

  let targetRotY, targetFov;

  if (p < 0.33) {

    targetRotY = ANGLES.front;
    targetFov  = FOV.front;

  } else if (p < 0.66) {

    targetRotY = ANGLES.quarter;
    targetFov  = FOV.quarter;

  } else {

    targetRotY = ANGLES.side;
    targetFov  = FOV.side;

  }

  scrollTargetRotY = targetRotY;
  scrollTargetFov  = targetFov;

  /* آپدیت نوار پیشرفت */
  if (progressBar) {
    progressBar.style.width = (20 + p * 80) + '%';
  }

}


/* =========================================================
   8. RENDER LOOP — بدون lag، با lerp نرم
   ========================================================= */

let lastTime = performance.now();

function animate(now) {

  requestAnimationFrame(animate);

  /* delta time برای یکنواختی روی همه دستگاه‌ها */
  const dt = Math.min(50, now - lastTime) / 1000;
  lastTime = now;

  if (carModel) {

    /* ⚡ Lerp نرم — به جای snap خشک، حرکت مایع */
    const lerpFactor = 1 - Math.pow(0.001, dt); // ~smooth

    currentRotY += (scrollTargetRotY - currentRotY) * lerpFactor;
    currentFov  += (scrollTargetFov  - currentFov)  * lerpFactor;

    /* اعمال چرخش */
    carModel.rotation.y = currentRotY;

    /* اعمال FOV */
    if (Math.abs(camera.fov - currentFov) > 0.01) {
      camera.fov = currentFov;
      camera.updateProjectionMatrix();
    }

  }

  renderer.render(scene, camera);

}

requestAnimationFrame(animate);


/* =========================================================
   9. RESIZE
   ========================================================= */

let resizeTimer = null;

window.addEventListener('resize', () => {

  clearTimeout(resizeTimer);

  resizeTimer = setTimeout(() => {

    const w = window.innerWidth;
    const h = window.innerHeight;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));

  }, 120);

});


/* =========================================================
   10. EXPLORE BUTTON
   ========================================================= */

if (exploreBtn) {

  exploreBtn.addEventListener('click', () => {

    const target = document.querySelector('.property-entry');

    if (target) {

      target.scrollIntoView({ behavior: 'smooth', block: 'start' });

    }

  });

}


/* =========================================================
   11. PAUSE RENDER وقتی تب مخفی می‌شه (صرفه‌جویی GPU)
   ========================================================= */

document.addEventListener('visibilitychange', () => {

  if (document.hidden) {
    /* وقتی مخفی، فریم‌ریت رو کمتر کن */
    renderer.setAnimationLoop(null);
  } else {
    renderer.setAnimationLoop(null); /* از rAF داخلی استفاده می‌کنیم */
  }

});


/* =========================================================
   12. CLEANUP (اختیاری)
   ========================================================= */

window.addEventListener('beforeunload', () => {

  if (renderer) {
    renderer.dispose();
  }

});
