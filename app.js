import * as THREE from 'three';

const container = document.getElementById('container');
const fileInput = document.getElementById('file');
const dropOverlay = document.getElementById('drop-overlay');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1100);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);
const canvas = renderer.domElement;

const geometry = new THREE.SphereGeometry(500, 64, 40);
geometry.scale(-1, 1, 1); // flip so we render the inside of the sphere
const material = new THREE.MeshBasicMaterial({ color: 0x202020 });
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

const MIN_FOV = 20;
const MAX_FOV = 100;
const BASE_FOV = camera.fov;

let lon = 0;
let lat = 0;
let isDragging = false;
let pointerStartX = 0, pointerStartY = 0;
let lonStart = 0, latStart = 0;

canvas.addEventListener('pointerdown', (e) => {
  isDragging = true;
  pointerStartX = e.clientX;
  pointerStartY = e.clientY;
  lonStart = lon;
  latStart = lat;
  canvas.classList.add('dragging');
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove', (e) => {
  if (!isDragging) return;
  // Scale drag speed by current FOV so zoomed-in dragging feels consistent.
  const speed = (camera.fov / BASE_FOV) * 0.1;
  lon = lonStart - (e.clientX - pointerStartX) * speed;
  lat = latStart + (e.clientY - pointerStartY) * speed;
  lat = Math.max(-85, Math.min(85, lat));
});

const endDrag = (e) => {
  if (!isDragging) return;
  isDragging = false;
  canvas.classList.remove('dragging');
  if (e.pointerId !== undefined && canvas.hasPointerCapture?.(e.pointerId)) {
    canvas.releasePointerCapture(e.pointerId);
  }
};
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('lostpointercapture', endDrag);

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  camera.fov = Math.max(MIN_FOV, Math.min(MAX_FOV, camera.fov + e.deltaY * 0.05));
  camera.updateProjectionMatrix();
}, { passive: false });

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const textureLoader = new THREE.TextureLoader();
let currentObjectUrl = null;

function loadPanorama(url, { revokeAfter = false } = {}) {
  textureLoader.load(
    url,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      const old = sphere.material.map;
      sphere.material.map = texture;
      sphere.material.color.set(0xffffff);
      sphere.material.needsUpdate = true;
      if (old) old.dispose();
      if (revokeAfter) URL.revokeObjectURL(url);
    },
    undefined,
    (err) => {
      console.error('Failed to load panorama:', err);
      if (revokeAfter) URL.revokeObjectURL(url);
    }
  );
}

function loadFromFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
  currentObjectUrl = URL.createObjectURL(file);
  loadPanorama(currentObjectUrl);
}

fileInput.addEventListener('change', (e) => {
  loadFromFile(e.target.files[0]);
});

let dragDepth = 0;
window.addEventListener('dragenter', (e) => {
  e.preventDefault();
  dragDepth++;
  dropOverlay.classList.add('active');
});
window.addEventListener('dragover', (e) => { e.preventDefault(); });
window.addEventListener('dragleave', (e) => {
  e.preventDefault();
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) dropOverlay.classList.remove('active');
});
window.addEventListener('drop', (e) => {
  e.preventDefault();
  dragDepth = 0;
  dropOverlay.classList.remove('active');
  loadFromFile(e.dataTransfer?.files?.[0]);
});

const target = new THREE.Vector3();
function animate() {
  requestAnimationFrame(animate);
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon);
  target.set(
    Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta)
  );
  camera.lookAt(target);
  renderer.render(scene, camera);
}
animate();
