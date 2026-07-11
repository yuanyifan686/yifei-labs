"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import * as THREE from "three";

const resumeScenarios = [
  {
    role: "AI 工作流工程师",
    score: 92,
    evidence: ["Agent 项目经验", "自动化工作流", "内容生成落地"],
    skills: [
      { label: "技能匹配", value: 88 },
      { label: "项目证据", value: 76 },
      { label: "市场准备度", value: 64 },
    ],
    recommendations: [
      { role: "AI 工作流工程师", score: 92 },
      { role: "大模型应用工程师", score: 86 },
      { role: "AI 产品工程师", score: 78 },
    ],
  },
  {
    role: "AI 产品经理",
    score: 89,
    evidence: ["产品闭环案例", "用户研究", "Prompt 方案"],
    skills: [
      { label: "产品判断", value: 86 },
      { label: "AI 理解", value: 79 },
      { label: "落地推进", value: 72 },
    ],
    recommendations: [
      { role: "AI 产品经理", score: 89 },
      { role: "增长产品经理", score: 82 },
      { role: "Prompt 产品顾问", score: 77 },
    ],
  },
  {
    role: "数据分析师",
    score: 84,
    evidence: ["SQL 分析", "指标体系", "业务洞察"],
    skills: [
      { label: "数据建模", value: 81 },
      { label: "业务理解", value: 74 },
      { label: "表达呈现", value: 69 },
    ],
    recommendations: [
      { role: "数据分析师", score: 84 },
      { role: "商业分析师", score: 80 },
      { role: "AI 数据运营", score: 75 },
    ],
  },
  {
    role: "内容自动化运营",
    score: 87,
    evidence: ["内容生产", "自动化工具", "增长实验"],
    skills: [
      { label: "内容策略", value: 83 },
      { label: "工具搭建", value: 78 },
      { label: "复盘能力", value: 70 },
    ],
    recommendations: [
      { role: "内容自动化运营", score: 87 },
      { role: "AI 增长运营", score: 82 },
      { role: "新媒体策略师", score: 76 },
    ],
  },
];

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isMobileViewport() {
  return window.matchMedia("(max-width: 768px)").matches;
}

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

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  if (Array.isArray(material)) {
    material.forEach((item) => item.dispose());
    return;
  }
  material.dispose();
}

function makeGlowTexture(color = "#38bdf8") {
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const rgb = new THREE.Color(color);
  const r = Math.round(rgb.r * 255);
  const g = Math.round(rgb.g * 255);
  const b = Math.round(rgb.b * 255);
  const grad = ctx.createRadialGradient(48, 48, 0, 48, 48, 48);
  grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
  grad.addColorStop(0.22, `rgba(${r},${g},${b},0.55)`);
  grad.addColorStop(0.6, `rgba(${r},${g},${b},0.16)`);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 96, 96);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makeResumeTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 1088;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const gradient = ctx.createLinearGradient(0, 0, 768, 1088);
  gradient.addColorStop(0, "rgba(240, 249, 255, 0.96)");
  gradient.addColorStop(0.55, "rgba(204, 236, 255, 0.9)");
  gradient.addColorStop(1, "rgba(125, 211, 252, 0.78)");
  ctx.fillStyle = gradient;
  roundRect(ctx, 0, 0, 768, 1088, 38);
  ctx.fill();

  ctx.strokeStyle = "rgba(14, 165, 233, 0.55)";
  ctx.lineWidth = 6;
  roundRect(ctx, 18, 18, 732, 1052, 32);
  ctx.stroke();

  ctx.fillStyle = "rgba(8, 47, 73, 0.9)";
  ctx.font = "700 44px system-ui, sans-serif";
  ctx.fillText("YIFEI CANDIDATE", 214, 114);
  ctx.font = "600 22px system-ui, sans-serif";
  ctx.fillStyle = "rgba(8, 47, 73, 0.58)";
  ctx.fillText("AI Application Engineer · Junior", 214, 154);

  ctx.fillStyle = "rgba(14, 165, 233, 0.16)";
  roundRect(ctx, 72, 66, 104, 104, 28);
  ctx.fill();
  ctx.strokeStyle = "rgba(14, 165, 233, 0.55)";
  ctx.lineWidth = 4;
  roundRect(ctx, 72, 66, 104, 104, 28);
  ctx.stroke();
  ctx.fillStyle = "rgba(8, 47, 73, 0.72)";
  ctx.font = "800 30px system-ui, sans-serif";
  ctx.fillText("CV", 104, 132);

  const sections = [
    { title: "PROFILE", y: 236, lines: [480, 560, 410] },
    { title: "EXPERIENCE", y: 430, lines: [560, 500, 455, 350] },
    { title: "PROJECTS", y: 682, lines: [540, 470, 390] },
  ];

  sections.forEach((section) => {
    ctx.fillStyle = "rgba(14, 165, 233, 0.22)";
    roundRect(ctx, 64, section.y - 44, 126, 32, 16);
    ctx.fill();
    ctx.fillStyle = "rgba(8, 47, 73, 0.68)";
    ctx.font = "800 18px system-ui, sans-serif";
    ctx.fillText(section.title, 82, section.y - 21);

    section.lines.forEach((width, index) => {
      const y = section.y + index * 42;
      ctx.fillStyle = index === 0 ? "rgba(8, 47, 73, 0.34)" : "rgba(14, 116, 144, 0.22)";
      roundRect(ctx, 72, y, width, index === 0 ? 18 : 14, 8);
      ctx.fill();
    });
  });

  const tags = ["Agent", "RAG", "Workflow", "Automation", "React"];
  tags.forEach((tag, index) => {
    const x = 72 + (index % 3) * 198;
    const y = 880 + Math.floor(index / 3) * 58;
    ctx.fillStyle = "rgba(16, 185, 129, 0.2)";
    roundRect(ctx, x, y, 154, 36, 18);
    ctx.fill();
    ctx.strokeStyle = "rgba(16, 185, 129, 0.42)";
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, 154, 36, 18);
    ctx.stroke();
    ctx.fillStyle = "rgba(6, 78, 59, 0.78)";
    ctx.font = "700 18px system-ui, sans-serif";
    ctx.fillText(tag, x + 22, y + 24);
  });

  ctx.strokeStyle = "rgba(14, 165, 233, 0.18)";
  ctx.lineWidth = 2;
  for (let y = 210; y < 1020; y += 54) {
    ctx.beginPath();
    ctx.moveTo(64, y);
    ctx.lineTo(704, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function CareerMap3D() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const scenario = resumeScenarios[scenarioIndex];
  const scoreRingStyle = useMemo(
    () => ({
      "--score": `${scenario.score}%`,
    }) as CSSProperties,
    [scenario.score],
  );

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const initial = window.setTimeout(() => {
      setScenarioIndex((current) => (current + 1) % resumeScenarios.length);
    }, 1800);
    const interval = window.setInterval(() => {
      setScenarioIndex((current) => (current + 1) % resumeScenarios.length);
    }, 3800);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const mount = hostRef.current;
    if (!mount) return;
    if (prefersReducedMotion() || !supportsWebGL()) return;

    const container = mount;
    const mobile = isMobileViewport();
    let disposed = false;
    let animationId = 0;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060812, 0.035);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
    camera.position.set(mobile ? 0 : 0.8, mobile ? 0.5 : 0.25, mobile ? 8.4 : 7.2);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !mobile,
      powerPreference: mobile ? "default" : "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.7));
    container.appendChild(renderer.domElement);

    const disposables: Array<() => void> = [];
    const cyan = new THREE.Color("#38bdf8");
    const violet = new THREE.Color("#8b5cf6");
    const emerald = new THREE.Color("#34d399");
    const resumeTexture = makeResumeTexture();

    const ambient = new THREE.AmbientLight(0x8bdcff, 0.85);
    scene.add(ambient);
    const key = new THREE.PointLight(0x38bdf8, 2.6, 18);
    key.position.set(2.8, 2.8, 4);
    scene.add(key);
    const rim = new THREE.PointLight(0x8b5cf6, 2, 18);
    rim.position.set(-3.4, -1.2, 3.5);
    scene.add(rim);

    const world = new THREE.Group();
    world.position.set(mobile ? 0 : 1.35, mobile ? -0.15 : -0.1, 0);
    world.rotation.y = mobile ? -0.08 : -0.26;
    scene.add(world);

    const chamber = new THREE.Group();
    world.add(chamber);

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x17243d,
      emissive: 0x09243a,
      emissiveIntensity: 0.35,
      roughness: 0.22,
      metalness: 0.08,
      transparent: true,
      opacity: 0.38,
      transmission: 0.25,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const documentMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: resumeTexture ?? undefined,
      emissive: 0x2f8fcc,
      emissiveIntensity: 0.06,
      roughness: 0.18,
      metalness: 0.05,
      transparent: true,
      opacity: 0.96,
      side: THREE.DoubleSide,
    });

    const resumeSheet = new THREE.Mesh(
      new THREE.PlaneGeometry(2.15, 3.0, 1, 1),
      documentMaterial,
    );
    resumeSheet.position.set(0, 0.15, 0);
    resumeSheet.rotation.x = -0.08;
    chamber.add(resumeSheet);

    const docFrame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(2.18, 3.03)),
      new THREE.LineBasicMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      }),
    );
    docFrame.position.copy(resumeSheet.position);
    docFrame.position.z += 0.025;
    docFrame.rotation.copy(resumeSheet.rotation);
    chamber.add(docFrame);

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.42,
    });
    const docLines: THREE.Line[] = [];
    for (let i = 0; i < 7; i += 1) {
      const width = i % 3 === 0 ? 1.22 : i % 2 === 0 ? 1.48 : 0.9;
      const y = 0.95 - i * 0.32;
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.68, y, 0.05),
        new THREE.Vector3(-0.68 + width, y, 0.05),
      ]);
      const line = new THREE.Line(geometry, lineMaterial);
      line.rotation.copy(resumeSheet.rotation);
      chamber.add(line);
      docLines.push(line);
    }

    const resumeDetails: THREE.Mesh[] = [];
    const detailMaterial = new THREE.MeshBasicMaterial({
      color: 0xbae6fd,
      transparent: true,
      opacity: 0.52,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const tagMaterial = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const avatar = new THREE.Mesh(new THREE.CircleGeometry(0.22, 36), detailMaterial);
    avatar.position.set(-0.72, 1.12, 0.07);
    avatar.rotation.copy(resumeSheet.rotation);
    chamber.add(avatar);
    resumeDetails.push(avatar);

    const headerLine = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.05), detailMaterial);
    headerLine.position.set(0.16, 1.17, 0.07);
    headerLine.rotation.copy(resumeSheet.rotation);
    chamber.add(headerLine);
    resumeDetails.push(headerLine);

    const sectionBlocks = [
      [-0.35, 0.48, 1.28],
      [-0.22, -0.18, 1.54],
      [-0.42, -0.84, 1.12],
    ] as const;
    sectionBlocks.forEach(([x, y, width]) => {
      const block = new THREE.Mesh(new THREE.PlaneGeometry(width, 0.035), detailMaterial);
      block.position.set(x, y, 0.08);
      block.rotation.copy(resumeSheet.rotation);
      chamber.add(block);
      resumeDetails.push(block);
    });

    const skillTags = [
      [-0.58, -1.16, 0.42],
      [-0.08, -1.16, 0.5],
      [0.5, -1.16, 0.38],
    ] as const;
    skillTags.forEach(([x, y, width]) => {
      const tag = new THREE.Mesh(new THREE.PlaneGeometry(width, 0.12), tagMaterial);
      tag.position.set(x, y, 0.085);
      tag.rotation.copy(resumeSheet.rotation);
      chamber.add(tag);
      resumeDetails.push(tag);
    });

    const scanMaterial = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const scanner = new THREE.Mesh(new THREE.PlaneGeometry(2.55, 0.16), scanMaterial);
    scanner.position.set(0, 1.1, 0.09);
    scanner.rotation.copy(resumeSheet.rotation);
    chamber.add(scanner);

    const scannerBand = new THREE.Mesh(
      new THREE.PlaneGeometry(2.35, 0.46),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    scannerBand.position.set(0, 1.1, 0.1);
    scannerBand.rotation.copy(resumeSheet.rotation);
    chamber.add(scannerBand);

    const scannerCore = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 0.025),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    scannerCore.position.set(0, 1.1, 0.11);
    scannerCore.rotation.copy(resumeSheet.rotation);
    chamber.add(scannerCore);

    const chamberShell = new THREE.Mesh(
      new THREE.BoxGeometry(2.75, 3.55, 0.52),
      glassMaterial,
    );
    chamberShell.position.z = -0.05;
    chamber.add(chamberShell);

    const shellEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(2.75, 3.55, 0.52)),
      new THREE.LineBasicMaterial({
        color: 0x67e8f9,
        transparent: true,
        opacity: 0.32,
        blending: THREE.AdditiveBlending,
      }),
    );
    shellEdges.position.copy(chamberShell.position);
    chamber.add(shellEdges);

    const orbitMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const orbitA = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.012, 8, 140), orbitMaterial);
    orbitA.rotation.x = Math.PI / 2.35;
    orbitA.rotation.z = -0.24;
    chamber.add(orbitA);

    const orbitB = new THREE.Mesh(
      new THREE.TorusGeometry(2.25, 0.01, 8, 140),
      new THREE.MeshBasicMaterial({
        color: 0x8b5cf6,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    orbitB.rotation.x = Math.PI / 2.05;
    orbitB.rotation.y = 0.35;
    chamber.add(orbitB);

    const dock = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 2.35, 0.08, 96),
      new THREE.MeshBasicMaterial({
        color: 0x0ea5e9,
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    dock.position.y = -1.9;
    dock.rotation.x = Math.PI / 2;
    chamber.add(dock);

    const glowTexture = makeGlowTexture();
    const particleCount = mobile ? 80 : 160;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const particleSeeds = new Float32Array(particleCount * 4);
    for (let i = 0; i < particleCount; i += 1) {
      particleSeeds[i * 4] = Math.random();
      particleSeeds[i * 4 + 1] = (Math.random() - 0.5) * 8;
      particleSeeds[i * 4 + 2] = (Math.random() - 0.5) * 5;
      particleSeeds[i * 4 + 3] = (Math.random() - 0.5) * 4;
      const color = cyan.clone().lerp(i % 5 === 0 ? emerald : violet, Math.random() * 0.55);
      particleColors[i * 3] = color.r;
      particleColors[i * 3 + 1] = color.g;
      particleColors[i * 3 + 2] = color.b;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));
    const particleMaterial = new THREE.PointsMaterial({
      map: glowTexture ?? undefined,
      size: mobile ? 0.085 : 0.07,
      transparent: true,
      opacity: 0.62,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new THREE.Points(particleGeometry, particleMaterial));

    const dataBeams = new THREE.Group();
    const beamMaterial = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
    });
    const beamTargets = [
      new THREE.Vector3(-2.5, 1.4, -0.4),
      new THREE.Vector3(2.8, 1.05, -0.2),
      new THREE.Vector3(-2.2, -1.05, 0.15),
      new THREE.Vector3(2.45, -1.35, 0.05),
      new THREE.Vector3(0.1, 2.2, -0.3),
    ];
    beamTargets.forEach((target) => {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.15, 0.12),
        target,
      ]);
      dataBeams.add(new THREE.Line(geometry, beamMaterial));
    });
    chamber.add(dataBeams);

    const pointer = new THREE.Vector2();
    const targetPointer = new THREE.Vector2();
    let running = document.visibilityState === "visible";
    let inView = true;

    function resize() {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    function onPointerMove(event: PointerEvent) {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      targetPointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      targetPointer.y = -((event.clientY - rect.top) / rect.height - 0.5) * 2;
    }

    function onVisibility() {
      running = document.visibilityState === "visible";
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
      },
      { threshold: 0.05 },
    );
    observer.observe(container);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    resize();

    const clock = new THREE.Clock();
    const particleAttr = particleGeometry.getAttribute("position") as THREE.BufferAttribute;

    function animate() {
      if (disposed) return;
      animationId = requestAnimationFrame(animate);
      if (!running || !inView) return;

      const t = clock.getElapsedTime();
      pointer.lerp(targetPointer, 0.045);

      const scanY = 1.26 - ((t * 0.72) % 2.55);
      scanner.position.y = scanY;
      scannerCore.position.y = scanY;
      scannerBand.position.y = scanY;
      scanMaterial.opacity = 0.26 + Math.sin(t * 5) * 0.08;

      chamber.position.y = Math.sin(t * 0.9) * 0.08;
      chamber.rotation.y = Math.sin(t * 0.55) * 0.05;
      chamber.rotation.x = -0.08 + Math.sin(t * 0.4) * 0.025;
      orbitA.rotation.z += 0.006;
      orbitB.rotation.z -= 0.004;
      dock.scale.setScalar(1 + Math.sin(t * 1.8) * 0.025);
      dataBeams.rotation.z = Math.sin(t * 0.4) * 0.08;

      docLines.forEach((line, index) => {
        const material = line.material as THREE.LineBasicMaterial;
        material.opacity = 0.38 + Math.max(0, Math.sin(t * 2.2 + index)) * 0.4;
      });
      detailMaterial.opacity = 0.42 + Math.max(0, Math.sin(t * 1.8)) * 0.18;
      tagMaterial.opacity = 0.28 + Math.max(0, Math.sin(t * 2.1 + 0.8)) * 0.22;

      for (let i = 0; i < particleCount; i += 1) {
        const seed = particleSeeds[i * 4];
        const baseX = particleSeeds[i * 4 + 1];
        const baseY = particleSeeds[i * 4 + 2];
        const baseZ = particleSeeds[i * 4 + 3];
        const orbit = t * (0.18 + seed * 0.2) + seed * Math.PI * 2;
        particlePositions[i * 3] = baseX + Math.sin(orbit) * (0.22 + seed * 0.4);
        particlePositions[i * 3 + 1] = baseY + Math.cos(orbit * 1.2) * 0.22;
        particlePositions[i * 3 + 2] = baseZ + Math.sin(orbit * 0.8) * 0.35;
      }
      particleAttr.needsUpdate = true;

      world.rotation.y = (mobile ? -0.08 : -0.26) + pointer.x * 0.08;
      world.rotation.x = pointer.y * 0.035;
      world.position.x = (mobile ? 0 : 1.35) + pointer.x * 0.08;
      world.position.y = (mobile ? -0.15 : -0.1) + pointer.y * 0.06;

      renderer.render(scene, camera);
    }

    animate();

    disposables.push(() => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      documentMaterial.dispose();
      resumeTexture?.dispose();
      glassMaterial.dispose();
      scanMaterial.dispose();
      lineMaterial.dispose();
      detailMaterial.dispose();
      tagMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      glowTexture?.dispose();
      [resumeSheet, chamberShell, scanner, scannerBand, scannerCore, orbitA, orbitB, dock].forEach((mesh) => {
        mesh.geometry.dispose();
        disposeMaterial(mesh.material);
      });
      [docFrame, shellEdges].forEach((line) => {
        line.geometry.dispose();
        disposeMaterial(line.material);
      });
      resumeDetails.forEach((mesh) => mesh.geometry.dispose());
      docLines.forEach((line) => line.geometry.dispose());
      dataBeams.children.forEach((line) => {
        const item = line as THREE.Line;
        item.geometry.dispose();
      });
      beamMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    });

    return () => {
      disposed = true;
      disposables.forEach((fn) => fn());
    };
  }, []);

  return (
    <div ref={hostRef} className="career-map-3d resume-scan-3d" aria-hidden>
      <div className="resume-scan-fallback">
        <div className="resume-doc-card">
          <div className="resume-doc-icon">CV</div>
          <div className="resume-doc-lines">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="resume-doc-scan" />
        </div>
      </div>

      <div className="resume-hud resume-hud-match !bottom-2 !left-0 !right-0 !p-4 lg:!bottom-auto lg:!left-8 lg:!right-4 lg:!top-[18%] lg:!w-auto lg:!p-5">
        <span className="resume-hud-corner is-tl" />
        <span className="resume-hud-corner is-tr" />
        <span className="resume-hud-corner is-bl" />
        <span className="resume-hud-corner is-br" />
        <div className="scan-beam" />

        <div className="resume-dashboard-head">
          <div>
            <p className="resume-hud-label">岗位匹配仪表盘</p>
            <strong key={scenario.role} className="resume-cycle-text">
              {scenario.role}
            </strong>
          </div>
          <div className="resume-score-ring" style={scoreRingStyle}>
            <span key={scenario.score} className="resume-cycle-text">
              {scenario.score}
            </span>
            <small>%</small>
          </div>
        </div>

        <div className="resume-scan-stages">
          <span>读取简历</span>
          <span>抽取技能</span>
          <span>匹配岗位</span>
          <span>生成建议</span>
        </div>

        <div className="resume-dashboard-grid">
          <div>
            <p className="resume-hud-title">匹配依据</p>
            <div className="resume-evidence-list">
              {scenario.evidence.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="resume-hud-title">能力达标</p>
            <div className="resume-skill-labeled">
              {scenario.skills.map((skill) => (
                <div key={skill.label}>
                  <label>
                    <span>{skill.label}</span>
                    <span>{skill.value}%</span>
                  </label>
                  <div className="bar">
                    <span style={{ width: `${skill.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="resume-hud-title">Top 3 推荐岗位</p>
        {scenario.recommendations.map((item) => (
          <div className="resume-role-row" key={item.role}>
            <span>{item.role}</span>
            <strong>{item.score}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
