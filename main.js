import "./style.css";
import "./reset.css";

import * as THREE from "three";
import { vertexShader } from "./shader/vertexShader";
import { flagmentShader } from "./shader/flagmentShader";

import Lenis from "@studio-freight/lenis";

let camera, scene, renderer, geometry;
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

function init() {
  scene = new THREE.Scene();
  const fov = 60,
    fovRad = (fov / 2) * (Math.PI / 180),
    aspect = sizes.width / sizes.height,
    dist = sizes.height / 2 / Math.tan(fovRad),
    near = 0.1,
    far = 1000;
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = dist;
  scene.add(camera);

  renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector("#canvas"),
    antialias: true, //アンチエイリアスを適応
  });
  renderer.setSize(sizes.width, sizes.height);
  renderer.setClearColor(new THREE.Color(0xeeeeee));
  renderer.setPixelRatio(window.devicePixelRatio);

  window.addEventListener("resize", () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(onWindowResize, 200);
  });
}

class ImagePlane {
  constructor(mesh, img) {
    this.refImage = img;
    this.mesh = mesh;
  }
  setParams() {
    const rect = this.refImage.getBoundingClientRect();

    this.mesh.scale.x = rect.width;
    this.mesh.scale.y = rect.height;

    const x = rect.left - sizes.width / 2 + rect.width / 2;
    const y = -rect.top + sizes.height / 2 - rect.height / 2;
    this.mesh.position.set(x, y, this.mesh.position.z);
  }

  update(offset) {
    this.setParams();
    this.mesh.material.uniforms.uTime.value = offset;
  }
}

const createMesh = (geometry, material) => {
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
};

const createMaterial = (img) => {
  const texture = new THREE.TextureLoader().load(img.src);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: texture },
      uImageAspect: { value: img.naturalWidth / img.naturalHeight },
      uPlaneAspect: { value: img.clientWidth / img.clientHeight },
      uTime: { value: 0 },
    },
    vertexShader: vertexShader,
    fragmentShader: flagmentShader,
  });
  return material;
};

const imagePlaneArray = [];

function animate() {
  updateScroll();
  for (const plane of imagePlaneArray) {
    plane.update(scrollOffset);
  }
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

const imageArray = [...document.querySelectorAll(".item-image")];

const main = () => {
  window.addEventListener("load", () => {
    for (let i = 0; i < imageArray.length; i++) {
      geometry = new THREE.PlaneGeometry(1, 1, 100, 100);
      const img = imageArray[i];
      const material = createMaterial(img, i);
      const mesh = createMesh(geometry, material);
      scene.add(mesh);
      const imagePlane = new ImagePlane(mesh, img);
      imagePlane.setParams();
      imagePlaneArray.push(imagePlane);
    }
    animate();
  });
};

function onWindowResize() {
  const fov = 60;
  const fovRad = (fov / 2) * (Math.PI / 180);
  const dist = sizes.width / 2 / Math.tan(fovRad);
  camera.position.z = dist;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.render(scene, camera);
}

init();
main();

let targetScrollY = 0;
let currentScrollY = 0;
let scrollOffset = 0;

const lerp = (start, end, multiplier) => {
  return (1 - multiplier) * start + multiplier * end;
};

const updateScroll = () => {
  targetScrollY = document.documentElement.scrollTop;

  currentScrollY = lerp(currentScrollY, targetScrollY, 0.1);
  scrollOffset = targetScrollY - currentScrollY;
};

// ------------------------------------------------------------------------------------------------------------------
// --------------------------------------------- 慣性スクロール ------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------------
const lenis = new Lenis({
  lerp: 20, // 慣性の強さ
  duration: 2, // スクロールアニメーションの時間
  easing: easeOutQuart,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

const easeOutQuart = (x) => {
  return 1 - Math.pow(1 - x, 4);
};
