import * as THREE from "three";
import {
  layoutSkillStar,
  SkillStarGraphModel,
  SkillStarNode,
  SkillNodeStatus,
} from "@/lib/three/skillStarModel";

const STATUS_COLOR: Record<SkillNodeStatus, string> = {
  hub: "#38bdf8",
  covered: "#34d399",
  weak: "#fbbf24",
  missing: "#f87171",
  dimension: "#a78bfa",
};

export type SkillStarSceneHandle = {
  setModel: (model: SkillStarGraphModel) => void;
  resize: () => void;
  dispose: () => void;
  setPaused: (paused: boolean) => void;
};

export type SkillStarSceneOptions = {
  onSelect?: (node: SkillStarNode | null) => void;
  onHover?: (node: SkillStarNode | null) => void;
};

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl"),
    );
  } catch {
    return false;
  }
}

export function canRunSkillStar3d() {
  if (typeof window === "undefined") return false;
  if (!supportsWebGL()) return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (window.matchMedia("(max-width: 640px)").matches) return false;
  return true;
}

function radiusFor(node: SkillStarNode) {
  if (node.status === "hub") return 0.42;
  if (node.status === "dimension") return 0.16 + ((node.score || 50) / 100) * 0.1;
  return 0.14 + ((node.score || 50) / 100) * 0.16;
}

/**
 * Imperative Three.js skill constellation scene.
 */
export function createSkillStarScene(
  container: HTMLElement,
  options: SkillStarSceneOptions = {},
): SkillStarSceneHandle | null {
  if (!supportsWebGL()) return null;

  let disposed = false;
  let paused = false;
  let animationId = 0;
  let model: SkillStarGraphModel | null = null;
  const nodeByMesh = new Map<THREE.Object3D, SkillStarNode>();

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07080f, 0.045);

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
  camera.position.set(0, 1.8, 7.2);

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  container.appendChild(renderer.domElement);
  Object.assign(renderer.domElement.style, {
    width: "100%",
    height: "100%",
    display: "block",
    touchAction: "none",
    cursor: "grab",
  });

  const ambient = new THREE.AmbientLight(0xb6e0fe, 0.55);
  const key = new THREE.PointLight(0x38bdf8, 1.1, 40);
  key.position.set(4, 6, 8);
  const fill = new THREE.PointLight(0x8b5cf6, 0.45, 30);
  fill.position.set(-5, -2, 4);
  scene.add(ambient, key, fill);

  const root = new THREE.Group();
  scene.add(root);

  const nodesGroup = new THREE.Group();
  const linksGroup = new THREE.Group();
  root.add(linksGroup, nodesGroup);

  // Soft background dust
  const dustCount = 80;
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 16;
    dustPos[i * 3 + 1] = (Math.random() - 0.5) * 10;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 16;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0x7dd3fc,
    size: 0.03,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let targetRotY = 0.35;
  let targetRotX = 0.15;
  let hoverId: string | null = null;

  const sphereGeoCache = new Map<string, THREE.SphereGeometry>();
  function geoFor(r: number) {
    const key = r.toFixed(3);
    let g = sphereGeoCache.get(key);
    if (!g) {
      g = new THREE.SphereGeometry(r, 16, 16);
      sphereGeoCache.set(key, g);
    }
    return g;
  }

  function clearGroup(group: THREE.Group) {
    while (group.children.length) {
      const child = group.children[0];
      group.remove(child);
      if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
        // geometries may be shared for spheres — only dispose unique lines
        if (child instanceof THREE.Line) {
          child.geometry.dispose();
        }
        const mat = child.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    }
  }

  function rebuild() {
    clearGroup(nodesGroup);
    clearGroup(linksGroup);
    nodeByMesh.clear();
    if (!model) return;

    const positions = layoutSkillStar(model);
    const posOf = (id: string) => positions.get(id) || { x: 0, y: 0, z: 0 };

    for (const link of model.links) {
      const a = posOf(link.source);
      const b = posOf(link.target);
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(a.x, a.y, a.z),
        new THREE.Vector3(b.x, b.y, b.z),
      ]);
      const mat = new THREE.LineBasicMaterial({
        color: 0x67e8f9,
        transparent: true,
        opacity: 0.22,
      });
      linksGroup.add(new THREE.Line(geo, mat));
    }

    for (const node of model.nodes) {
      const p = posOf(node.id);
      const r = radiusFor(node);
      const color = new THREE.Color(STATUS_COLOR[node.status]);
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: node.status === "hub" ? 0.55 : 0.35,
        metalness: 0.2,
        roughness: 0.35,
        transparent: true,
        opacity: 0.95,
      });
      const mesh = new THREE.Mesh(geoFor(r), mat);
      mesh.position.set(p.x, p.y, p.z);
      mesh.userData.nodeId = node.id;
      nodesGroup.add(mesh);
      nodeByMesh.set(mesh, node);

      // Outer ring for hub
      if (node.status === "hub") {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(r * 1.55, 0.02, 8, 48),
          new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.45,
          }),
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.copy(mesh.position);
        nodesGroup.add(ring);
      }
    }
  }

  function resize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  function pick(clientX: number, clientY: number): SkillStarNode | null {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(nodesGroup.children, false);
    for (const hit of hits) {
      const node = nodeByMesh.get(hit.object);
      if (node) return node;
    }
    return null;
  }

  function onPointerDown(e: PointerEvent) {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    renderer.domElement.style.cursor = "grabbing";
    renderer.domElement.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent) {
    if (dragging) {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      targetRotY += dx * 0.005;
      targetRotX += dy * 0.004;
      targetRotX = Math.max(-0.8, Math.min(0.8, targetRotX));
      return;
    }
    const node = pick(e.clientX, e.clientY);
    const id = node?.id ?? null;
    if (id !== hoverId) {
      hoverId = id;
      options.onHover?.(node);
      renderer.domElement.style.cursor = node ? "pointer" : "grab";
    }
  }

  function onPointerUp(e: PointerEvent) {
    if (dragging) {
      dragging = false;
      renderer.domElement.style.cursor = "grab";
      try {
        renderer.domElement.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
  }

  function onClick(e: MouseEvent) {
    const node = pick(e.clientX, e.clientY);
    options.onSelect?.(node);
  }

  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  renderer.domElement.addEventListener("pointermove", onPointerMove);
  renderer.domElement.addEventListener("pointerup", onPointerUp);
  renderer.domElement.addEventListener("pointercancel", onPointerUp);
  renderer.domElement.addEventListener("click", onClick);

  const clock = new THREE.Clock();

  function tick() {
    if (disposed) return;
    animationId = window.requestAnimationFrame(tick);
    if (paused || document.hidden) return;

    const t = clock.getElapsedTime();
    if (!dragging) {
      targetRotY += 0.0018;
    }
    root.rotation.y += (targetRotY - root.rotation.y) * 0.08;
    root.rotation.x += (targetRotX - root.rotation.x) * 0.08;
    dust.rotation.y = t * 0.02;

    // Subtle pulse on hub
    nodesGroup.children.forEach((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const node = nodeByMesh.get(child);
      if (node?.status === "hub") {
        const s = 1 + Math.sin(t * 2.2) * 0.04;
        child.scale.setScalar(s);
      }
    });

    renderer.render(scene, camera);
  }

  function onVisibility() {
    /* tick checks document.hidden */
  }

  document.addEventListener("visibilitychange", onVisibility);
  resize();
  animationId = window.requestAnimationFrame(tick);

  return {
    setModel(next: SkillStarGraphModel) {
      model = next;
      rebuild();
    },
    resize,
    setPaused(v: boolean) {
      paused = v;
    },
    dispose() {
      disposed = true;
      window.cancelAnimationFrame(animationId);
      document.removeEventListener("visibilitychange", onVisibility);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      renderer.domElement.removeEventListener("click", onClick);
      clearGroup(nodesGroup);
      clearGroup(linksGroup);
      sphereGeoCache.forEach((g) => g.dispose());
      sphereGeoCache.clear();
      dustGeo.dispose();
      dustMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}
