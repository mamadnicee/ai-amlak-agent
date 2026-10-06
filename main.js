/* =========================================================
   AI REAL ESTATE
   THREE.JS + GLTF + SCROLL INTERACTION
   ========================================================= */

import * as THREE from "three";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";


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

scene.background = new THREE.Color(0xf4f4f2);


/* =========================================================
   CAMERA
   ========================================================= */

const camera = new THREE.PerspectiveCamera(
  32,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(
  0,
  1.15,
  7.5
);


/* =========================================================
   RENDERER
   ========================================================= */

const renderer = new THREE.WebGLRenderer({

  canvas,

  antialias: true,

  alpha: true,

  powerPreference: "high-performance"
});

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio, 1.5)
);

renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.toneMapping = THREE.ACESFilmicToneMapping;

renderer.toneMappingExposure = 1.15;


/* =========================================================
   LIGHTING
   ========================================================= */

const ambientLight = new THREE.HemisphereLight(
  0xffffff,
  0xd8d8d8,
  2.2
);

scene.add(ambientLight);


const keyLight = new THREE.DirectionalLight(
  0xffffff,
  4
);

keyLight.position.set(
  5,
  8,
  6
);

scene.add(keyLight);


const fillLight = new THREE.DirectionalLight(
  0xdfe6ff,
  2
);

fillLight.position.set(
  -5,
  3,
  4
);

scene.add(fillLight);


const rimLight = new THREE.DirectionalLight(
  0xffffff,
  3
);

rimLight.position.set(
  0,
  4,
  -6
);

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


/*
  اگر مدل با Draco فشرده شده باشد
  این بخش آماده است.
*/

const dracoLoader = new DRACOLoader();

dracoLoader.setDecoderPath(
  "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/libs/draco/"
);

gltfLoader.setDRACOLoader(dracoLoader);


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


    /*
      مرکز کردن مدل
    */

    const box = new THREE.Box3().setFromObject(car);

    const center = box.getCenter(
      new THREE.Vector3()
    );

    car.position.sub(center);


    /*
      محاسبه اندازه
    */

    const size = box.getSize(
      new THREE.Vector3()
    );

    const maxSize = Math.max(
      size.x,
      size.y,
      size.z
    );


    /*
      نرمال کردن اندازه ماشین
    */

    const targetSize = 4.8;

    const scale =
      targetSize / maxSize;

    car.scale.setScalar(scale);


    /*
      کمی پایین‌تر
    */

    car.position.y = -0.8;


    /*
      سایه / کیفیت متریال
    */

    car.traverse((object) => {

      if (!object.isMesh) return;

      object.castShadow = true;

      object.receiveShadow = true;

      if (object.material) {

        object.material.envMapIntensity = 1.4;

      }

    });


    carGroup.add(car);


    /*
      Loader complete
    */

    loaderProgress.style.width = "100%";


    setTimeout(() => {

      loaderScreen.classList.add("hidden");

    }, 500);

  },

  (progress) => {

    if (progress.total > 0) {

      const percent =
        (progress.loaded / progress.total) * 100;

      loaderProgress.style.width =
        `${percent}%`;

    }

  },

  (error) => {

    console.error(
      "CAR LOAD ERROR:",
      error
    );

    loaderProgress.style.width = "100%";

    setTimeout(() => {

      loaderScreen.classList.add("hidden");

    }, 500);

  }

);


/* =========================================================
   OPTIONAL CONTROLS
   ========================================================= */

const controls = new OrbitControls(
  camera,
  canvas
);

controls.enabled = false;

controls.enableDamping = true;


/* =========================================================
   SCROLL STATE
   ========================================================= */

let scrollProgress = 0;

let targetRotation = 0;

let currentRotation = 0;

let targetCameraZ = 7.5;

let currentCameraZ = 7.5;


/* =========================================================
   SCROLL
   ========================================================= */

function updateScroll() {

  const maxScroll =
    document.documentElement.scrollHeight -
    window.innerHeight;

  if (maxScroll <= 0) return;

  scrollProgress =
    window.scrollY / maxScroll;

  /*
    فقط Hero را برای چرخش ماشین استفاده می‌کنیم.
  */

  const heroHeight =
    window.innerHeight;

  const heroProgress =
    Math.min(
      window.scrollY / heroHeight,
      1
    );


  /*
    0 → 360 degrees
  */

  targetRotation =
    heroProgress * Math.PI * 2;


  /*
    Camera movement
  */

  targetCameraZ =
    7.5 - heroProgress * 1.2;


  /*
    Progress UI
  */

  progressBar.style.width =
    `${Math.max(5, scrollProgress * 100)}%`;
}


window.addEventListener(
  "scroll",
  updateScroll,
  { passive: true }
);


/* =========================================================
   MOUSE PARALLAX
   ========================================================= */

let mouseX = 0;

let mouseY = 0;

let targetMouseX = 0;

let targetMouseY = 0;


window.addEventListener(
  "pointermove",
  (event) => {

    targetMouseX =
      (event.clientX / window.innerWidth - .5);

    targetMouseY =
      (event.clientY / window.innerHeight - .5);

  },
  { passive: true }
);


/* =========================================================
   RESIZE
   ========================================================= */

window.addEventListener(
  "resize",
  () => {

    camera.aspect =
      window.innerWidth /
      window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 1.5)
    );

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );

  }
);


/* =========================================================
   ANIMATION LOOP
   ========================================================= */

const clock = new THREE.Clock();


function animate() {

  requestAnimationFrame(animate);


  /*
    Smooth interpolation
  */

  currentRotation +=
    (targetRotation - currentRotation) * 0.075;


  currentCameraZ +=
    (targetCameraZ - currentCameraZ) * 0.06;


  mouseX +=
    (targetMouseX - mouseX) * 0.04;


  mouseY +=
    (targetMouseY - mouseY) * 0.04;


  /*
    CAR
  */

  if (carReady && car) {

    carGroup.rotation.y =
      currentRotation;


    /*
      Mouse interaction
    */

    carGroup.rotation.y +=
      mouseX * 0.12;


    carGroup.rotation.x =
      mouseY * 0.025;


    /*
      subtle floating motion
    */

    carGroup.position.y =
      Math.sin(
        clock.getElapsedTime() * .8
      ) * 0.025;

  }


  /*
    CAMERA
  */

  camera.position.z =
    currentCameraZ;

  camera.position.x =
    mouseX * .18;

  camera.position.y =
    1.15 - mouseY * .08;

  camera.lookAt(
    0,
    0,
    0
  );


  controls.update();


  renderer.render(
    scene,
    camera
  );
}


animate();


/* =========================================================
   EXPLORE BUTTON
   ========================================================= */

document
  .getElementById("exploreButton")
  .addEventListener("click", () => {

    window.scrollTo({

      top: window.innerHeight,

      behavior: "smooth"

    });

  });


/* =========================================================
   INITIAL
   ========================================================= */

updateScroll();
