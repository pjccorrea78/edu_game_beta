import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Menu, X } from "lucide-react";
import BuildingInterior3D from "@/components/BuildingInterior3D";

// ─── Layout: 8 prédios em anel ao redor de uma praça central ──────
const R = 22; // raio do anel
const BUILDINGS = [
  { id: "math",       name: "Matemática",      discipline: "matematica",       color: 0x3B82F6, accent: 0x1D4ED8, angle: 0 },
  { id: "portuguese", name: "Português",        discipline: "portugues",        color: 0xEF4444, accent: 0xB91C1C, angle: Math.PI * 0.25 },
  { id: "science",    name: "Ciências",         discipline: "ciencias",         color: 0x22C55E, accent: 0x15803D, angle: Math.PI * 0.5 },
  { id: "history",    name: "História",         discipline: "historia",         color: 0xF59E0B, accent: 0xB45309, angle: Math.PI * 0.75 },
  { id: "geography",  name: "Geografia",        discipline: "geografia",        color: 0x8B5CF6, accent: 0x6D28D9, angle: Math.PI },
  { id: "art",        name: "Arte",             discipline: "arte",             color: 0xEC4899, accent: 0xBE185D, angle: Math.PI * 1.25 },
  { id: "pe",         name: "Ed. Física",       discipline: "educacao_fisica",  color: 0xF97316, accent: 0xC2410C, angle: Math.PI * 1.5 },
  { id: "religion",   name: "Ens. Religioso",   discipline: "ensino_religioso", color: 0x06B6D4, accent: 0x0E7490, angle: Math.PI * 1.75 },
].map(b => ({ ...b, position: [Math.sin(b.angle) * R, 0, Math.cos(b.angle) * R] as [number, number, number] }));

interface GameMap3DProps {
  playerAvatar: any;
  onBuildingClick: (buildingId: string) => void;
  onOpenShop: () => void;
  onOpenProgress: () => void;
  onOpenSchool?: () => void;
  onOpenTeacher?: () => void;
  onOpenAchievements?: () => void;
  onOpenDaily?: () => void;
  onOpenRanking?: () => void;
  onOpenDuel?: () => void;
  onOpenStory?: () => void;
  onOpenNotifications?: () => void;
  onOpenAvatarAI?: () => void;
}

// ─── Building factory ───────────────────────────────────────────────
function createBuilding(scene: THREE.Scene, bld: typeof BUILDINGS[0], colliders: THREE.Box3[]) {
  const group = new THREE.Group();
  const [bx, , bz] = bld.position;

  // Corpo principal
  const bodyGeo = new THREE.BoxGeometry(5, 6.5, 5);
  const bodyMat = new THREE.MeshLambertMaterial({ color: bld.color });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.set(0, 3.25, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Telhado piramidal
  const roofGeo = new THREE.ConeGeometry(3.8, 2.2, 4);
  const roofMat = new THREE.MeshLambertMaterial({ color: bld.accent });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.set(0, 7.6, 0);
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  // Janelas (frente = lado voltado para o centro)
  const winMat = new THREE.MeshLambertMaterial({ color: 0xBAE6FD, emissive: 0x7DD3FC, emissiveIntensity: 0.5 });
  const winGeo = new THREE.BoxGeometry(0.8, 0.9, 0.12);
  [[-1, 4.8], [1, 4.8], [-1, 2.8], [1, 2.8]].forEach(([wx, wy]) => {
    const win = new THREE.Mesh(winGeo, winMat);
    win.position.set(wx, wy, 2.55);
    group.add(win);
  });

  // Porta
  const doorGeo = new THREE.BoxGeometry(1.1, 2.1, 0.12);
  const doorMat = new THREE.MeshLambertMaterial({ color: bld.accent });
  const door = new THREE.Mesh(doorGeo, doorMat);
  door.position.set(0, 1.05, 2.55);
  group.add(door);

  // Placa com nome (em canvas)
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#" + bld.color.toString(16).padStart(6, "0");
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 48px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(bld.name, 256, 64);
  const tex = new THREE.CanvasTexture(canvas);
  const signGeo = new THREE.PlaneGeometry(4.5, 1.1);
  const signMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  const sign = new THREE.Mesh(signGeo, signMat);
  sign.position.set(0, 6.8, 2.56);
  group.add(sign);

  // Posicionar e rotacionar para ficar virado para o centro (0,0,0)
  group.position.set(bx, 0, bz);
  group.lookAt(0, 0, 0);

  scene.add(group);

  // Colisão
  const box = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(bx, 3, bz),
    new THREE.Vector3(6, 7, 6)
  );
  colliders.push(box);
  return group;
}

// ─── Praça central ──────────────────────────────────────────────────
function createPlaza(scene: THREE.Scene) {
  // Piso da praça (círculo de pedra/concreto claro)
  const plazaGeo = new THREE.CircleGeometry(12, 48);
  const plazaMat = new THREE.MeshLambertMaterial({ color: 0xE5E7EB });
  const plaza = new THREE.Mesh(plazaGeo, plazaMat);
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = 0.02;
  plaza.receiveShadow = true;
  scene.add(plaza);

  // Borda decorativa da praça
  const borderGeo = new THREE.RingGeometry(11.5, 12.3, 48);
  const borderMat = new THREE.MeshLambertMaterial({ color: 0x9CA3AF });
  const border = new THREE.Mesh(borderGeo, borderMat);
  border.rotation.x = -Math.PI / 2;
  border.position.y = 0.03;
  scene.add(border);

  // Anel decorativo interno
  const innerRing = new THREE.Mesh(new THREE.RingGeometry(5.5, 6, 48), new THREE.MeshLambertMaterial({ color: 0xD1D5DB }));
  innerRing.rotation.x = -Math.PI / 2;
  innerRing.position.y = 0.025;
  scene.add(innerRing);

  // ── Fonte d'água central ──────────────────────────────────────────
  // Base da fonte
  const fountainBase = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.5, 0.6, 24),
    new THREE.MeshLambertMaterial({ color: 0x9CA3AF })
  );
  fountainBase.position.set(0, 0.3, 0);
  fountainBase.castShadow = true;
  scene.add(fountainBase);

  // Bacia da fonte
  const basinGeo = new THREE.CylinderGeometry(1.8, 2, 0.3, 24);
  const basinMat = new THREE.MeshLambertMaterial({ color: 0x78716C });
  const basin = new THREE.Mesh(basinGeo, basinMat);
  basin.position.set(0, 0.75, 0);
  scene.add(basin);

  // Água
  const waterGeo = new THREE.CylinderGeometry(1.7, 1.7, 0.15, 24);
  const waterMat = new THREE.MeshLambertMaterial({ color: 0x60A5FA, transparent: true, opacity: 0.7 });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.position.set(0, 0.82, 0);
  scene.add(water);

  // Pilar central da fonte
  const pillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.3, 1.8, 12),
    new THREE.MeshLambertMaterial({ color: 0x78716C })
  );
  pillar.position.set(0, 1.5, 0);
  pillar.castShadow = true;
  scene.add(pillar);

  // Topo ornamental
  const topOrn = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 12, 8),
    new THREE.MeshLambertMaterial({ color: 0xFCD34D, emissive: 0xFCD34D, emissiveIntensity: 0.3 })
  );
  topOrn.position.set(0, 2.6, 0);
  scene.add(topOrn);

  // ── Bancos ao redor da praça ──────────────────────────────────────
  const benchWood = new THREE.MeshLambertMaterial({ color: 0x92400E });
  const benchMetal = new THREE.MeshLambertMaterial({ color: 0x6B7280 });
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const bx = Math.sin(angle) * 8;
    const bz = Math.cos(angle) * 8;

    const benchGroup = new THREE.Group();
    // Assento
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.7), benchWood);
    seat.position.y = 0.55;
    seat.castShadow = true;
    benchGroup.add(seat);
    // Encosto
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 0.1), benchWood);
    back.position.set(0, 0.9, -0.3);
    back.castShadow = true;
    benchGroup.add(back);
    // Pernas
    [-0.8, 0.8].forEach(lx => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 0.5), benchMetal);
      leg.position.set(lx, 0.27, 0);
      benchGroup.add(leg);
    });

    benchGroup.position.set(bx, 0, bz);
    benchGroup.lookAt(0, 0, 0); // virado para a fonte
    scene.add(benchGroup);
  }

  // ── Canteiros de flores ───────────────────────────────────────────
  const flowerColors = [0xF472B6, 0xFB923C, 0xA78BFA, 0x34D399, 0xFBBF24, 0xF87171];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const fx = Math.sin(angle) * 10;
    const fz = Math.cos(angle) * 10;

    // Base terra
    const bed = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.8, 0.2, 12),
      new THREE.MeshLambertMaterial({ color: 0x78350F })
    );
    bed.position.set(fx, 0.1, fz);
    scene.add(bed);

    // Flores (3 por canteiro)
    for (let f = 0; f < 3; f++) {
      const fa = (f / 3) * Math.PI * 2;
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 6, 4),
        new THREE.MeshLambertMaterial({ color: flowerColors[(i * 3 + f) % flowerColors.length] })
      );
      flower.position.set(fx + Math.sin(fa) * 0.35, 0.4, fz + Math.cos(fa) * 0.35);
      scene.add(flower);
      // Caule
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.25, 4),
        new THREE.MeshLambertMaterial({ color: 0x16A34A })
      );
      stem.position.set(fx + Math.sin(fa) * 0.35, 0.25, fz + Math.cos(fa) * 0.35);
      scene.add(stem);
    }
  }
}

// ─── Calçadas radiais + terreno ─────────────────────────────────────
function createEnvironment(scene: THREE.Scene) {
  // Chão principal (grama)
  const groundGeo = new THREE.PlaneGeometry(100, 100);
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x4ADE80 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Anel de calçada ao redor dos prédios
  const walkRing = new THREE.Mesh(
    new THREE.RingGeometry(17, 28, 48),
    new THREE.MeshLambertMaterial({ color: 0xD4C9B0 })
  );
  walkRing.rotation.x = -Math.PI / 2;
  walkRing.position.y = 0.015;
  walkRing.receiveShadow = true;
  scene.add(walkRing);

  // Calçadas radiais conectando praça aos prédios
  const walkMat = new THREE.MeshLambertMaterial({ color: 0xD4C9B0 });
  BUILDINGS.forEach(b => {
    const angle = b.angle;
    const pathLen = R - 10;
    const pathGroup = new THREE.Group();
    const pathGeo = new THREE.PlaneGeometry(3, pathLen);
    const path = new THREE.Mesh(pathGeo, walkMat);
    path.rotation.x = -Math.PI / 2;
    path.position.set(0, 0, pathLen / 2 + 8);
    pathGroup.add(path);

    // Bordas da calçada (pedras)
    const curbMat = new THREE.MeshLambertMaterial({ color: 0x9CA3AF });
    [-1.6, 1.6].forEach(ox => {
      const curb = new THREE.Mesh(new THREE.PlaneGeometry(0.2, pathLen), curbMat);
      curb.rotation.x = -Math.PI / 2;
      curb.position.set(ox, 0.005, pathLen / 2 + 8);
      pathGroup.add(curb);
    });

    pathGroup.position.y = 0.02;
    pathGroup.rotation.y = -angle;
    scene.add(pathGroup);
  });

  // ── Árvores na grama entre calçadas ────────────────────────────────
  const treeTrunkMat = new THREE.MeshLambertMaterial({ color: 0x92400E });
  const treeTopMat = new THREE.MeshLambertMaterial({ color: 0x16A34A });
  const treeTopDark = new THREE.MeshLambertMaterial({ color: 0x15803D });
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2 + Math.PI / 16;
    const dist = 15 + (i % 2) * 18;
    const tx = Math.sin(angle) * dist;
    const tz = Math.cos(angle) * dist;

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 2.5, 6), treeTrunkMat);
    trunk.position.set(tx, 1.25, tz);
    trunk.castShadow = true;
    scene.add(trunk);
    const top = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 6), i % 2 === 0 ? treeTopMat : treeTopDark);
    top.position.set(tx, 3.5, tz);
    top.castShadow = true;
    scene.add(top);
  }

  // ── Postes de luz na calçada ───────────────────────────────────────
  const poleMat = new THREE.MeshLambertMaterial({ color: 0x6B7280 });
  const lampMat = new THREE.MeshLambertMaterial({ color: 0xFEF08A, emissive: 0xFEF08A, emissiveIntensity: 0.8 });
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const px = Math.sin(angle) * 16;
    const pz = Math.cos(angle) * 16;

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 4.5, 6), poleMat);
    pole.position.set(px, 2.25, pz);
    scene.add(pole);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.3), lampMat);
    lamp.position.set(px, 4.7, pz);
    scene.add(lamp);
    const light = new THREE.PointLight(0xFEF9C3, 1, 10);
    light.position.set(px, 4.5, pz);
    scene.add(light);
  }

  // ── Placa "Bem-vindo à EduCity" na entrada (sul) ──────────────────
  const signCanvas = document.createElement("canvas");
  signCanvas.width = 512; signCanvas.height = 160;
  const sctx = signCanvas.getContext("2d")!;
  sctx.fillStyle = "#7C3AED";
  sctx.roundRect(0, 0, 512, 160, 20);
  sctx.fill();
  sctx.fillStyle = "#ffffff";
  sctx.font = "bold 42px sans-serif";
  sctx.textAlign = "center";
  sctx.fillText("🎓 Bem-vindo à EduCity!", 256, 65);
  sctx.font = "24px sans-serif";
  sctx.fillStyle = "#E0D4FF";
  sctx.fillText("Explore, aprenda e divirta-se!", 256, 115);
  const signTex = new THREE.CanvasTexture(signCanvas);
  const welcomeSign = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.5), new THREE.MeshBasicMaterial({ map: signTex, transparent: true }));
  welcomeSign.position.set(0, 3, 35);
  welcomeSign.rotation.y = Math.PI;
  scene.add(welcomeSign);
  // Poste da placa
  const signPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3, 6), poleMat);
  signPole.position.set(-2, 1.5, 35);
  scene.add(signPole);
  const signPole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3, 6), poleMat);
  signPole2.position.set(2, 1.5, 35);
  scene.add(signPole2);
}

// ─── Avatar humanóide (preservado) ──────────────────────────────────
function createHumanAvatar(skinColor: number, shirtColor: number, pantsColor: number, hairColor?: number, gender?: string, hairStyle?: string) {
  const group = new THREE.Group();
  const skinMat = new THREE.MeshLambertMaterial({ color: skinColor });
  const shirtMat = new THREE.MeshLambertMaterial({ color: shirtColor });
  const pantsMat = new THREE.MeshLambertMaterial({ color: pantsColor });
  const shoesMat = new THREE.MeshLambertMaterial({ color: 0x1C1917 });
  const eyeMat = new THREE.MeshLambertMaterial({ color: 0x1E293B });
  const hairMat = new THREE.MeshLambertMaterial({ color: hairColor ?? 0x3B2F2F });

  // Cabeça
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), skinMat);
  head.position.y = 1.65; head.castShadow = true;
  group.add(head);

  // Cabelo
  if (gender === "feminino") {
    const longHair = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.8, 0.76), hairMat);
    longHair.position.set(0, 1.7, -0.05);
    group.add(longHair);
    // Fios longos atrás
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.2), hairMat);
    back.position.set(0, 1.2, -0.35);
    group.add(back);
  } else {
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.35, 0.75), hairMat);
    hair.position.set(0, 1.88, 0);
    group.add(hair);
  }

  // Olhos
  const eyeGeo = new THREE.BoxGeometry(0.12, 0.12, 0.05);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(-0.15, 1.68, 0.36); group.add(eyeL);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(0.15, 1.68, 0.36); group.add(eyeR);

  // Tronco
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.7, 0.35), shirtMat);
  torso.position.y = 1.05; torso.castShadow = true;
  group.add(torso);

  // Braço esquerdo
  const armL = new THREE.Group();
  armL.add(new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.6, 0.25), shirtMat).translateY(-0.3));
  armL.add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.22), skinMat).translateY(-0.65));
  armL.position.set(-0.47, 1.35, 0);
  group.add(armL);

  // Braço direito
  const armR = new THREE.Group();
  armR.add(new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.6, 0.25), shirtMat).translateY(-0.3));
  armR.add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.22), skinMat).translateY(-0.65));
  armR.position.set(0.47, 1.35, 0);
  group.add(armR);

  // Perna esquerda
  const legL = new THREE.Group();
  legL.add(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.6, 0.28), pantsMat).translateY(-0.3));
  legL.add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 0.35), shoesMat).translateY(-0.65));
  legL.position.set(-0.18, 0.68, 0);
  group.add(legL);

  // Perna direita
  const legR = new THREE.Group();
  legR.add(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.6, 0.28), pantsMat).translateY(-0.3));
  legR.add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 0.35), shoesMat).translateY(-0.65));
  legR.position.set(0.18, 0.68, 0);
  group.add(legR);

  return { group, head, armL, armR, legL, legR };
}

// ─── NPC (outros "jogadores" estáticos para ambiente multiplayer) ──
function createNPCs(scene: THREE.Scene) {
  const npcConfigs = [
    { skin: 0xFDBA74, shirt: 0xE11D48, pants: 0x1E3A5F, pos: [4, 0, 6], gender: "feminino" },
    { skin: 0xC68642, shirt: 0x2563EB, pants: 0x374151, pos: [-5, 0, 8], gender: "masculino" },
    { skin: 0xF5DEB3, shirt: 0x7C3AED, pants: 0x4338CA, pos: [7, 0, -3], gender: "feminino" },
    { skin: 0x8D5524, shirt: 0x059669, pants: 0x1C1917, pos: [-3, 0, -7], gender: "masculino" },
    { skin: 0xFDBCB4, shirt: 0xF97316, pants: 0x78350F, pos: [9, 0, 2], gender: "masculino" },
  ];
  npcConfigs.forEach(cfg => {
    const npc = createHumanAvatar(cfg.skin, cfg.shirt, cfg.pants, undefined, cfg.gender);
    npc.group.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    // Virado para a fonte
    npc.group.lookAt(0, 0, 0);

    // Animação idle sutil
    const idlePhase = Math.random() * Math.PI * 2;
    (npc as any)._idlePhase = idlePhase;
    (npc as any)._armL = npc.armL;
    (npc as any)._armR = npc.armR;

    scene.add(npc.group);
  });
}

// ─── Componente principal ───────────────────────────────────────────
export default function GameMap3D({
  playerAvatar, onBuildingClick, onOpenShop, onOpenProgress,
  onOpenSchool, onOpenTeacher, onOpenAchievements, onOpenDaily,
  onOpenRanking, onOpenDuel, onOpenStory, onOpenNotifications, onOpenAvatarAI,
}: GameMap3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const avatarRef = useRef<ReturnType<typeof createHumanAvatar> | null>(null);
  const playerPosRef = useRef(new THREE.Vector3(0, 0, 5)); // Começa na praça!
  const playerRotRef = useRef(0);
  const keysRef = useRef<Record<string, boolean>>({});
  const collidersRef = useRef<THREE.Box3[]>([]);
  const animTimeRef = useRef(0);
  const frameRef = useRef(0);

  const [showMenu, setShowMenu] = useState(false);
  const [nearbyBuilding, setNearbyBuilding] = useState<string | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<typeof BUILDINGS[0] | null>(null);
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickVisual, setJoystickVisual] = useState({ x: 0, y: 0 });
  const joystickDeltaRef = useRef({ x: 0, y: 0 });
  const joystickActiveRef = useRef(false);
  const joystickStartRef = useRef({ x: 0, y: 0 });

  // ── Setup Three.js ────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const W = container.clientWidth;
    const H = container.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x87CEEB);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x87CEEB, 45, 90);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200);
    camera.position.set(0, 10, 18);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Iluminação
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const sun = new THREE.DirectionalLight(0xFFF9C4, 1.2);
    sun.position.set(25, 45, 25);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 120;
    sun.shadow.camera.left = -55; sun.shadow.camera.right = 55;
    sun.shadow.camera.top = 55; sun.shadow.camera.bottom = -55;
    scene.add(sun);

    // Céu
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x7DD3FC, side: THREE.BackSide });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(95, 16, 8), skyMat));

    // Nuvens
    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    [[18, 28, -25], [-22, 25, -18], [8, 30, -35], [-15, 27, 20], [30, 26, 10]].forEach(([cx, cy, cz]) => {
      const cloud = new THREE.Group();
      for (let i = 0; i < 5; i++) {
        const c = new THREE.Mesh(new THREE.SphereGeometry(1.8 + i * 0.4, 6, 4), cloudMat);
        c.position.set((i - 2) * 1.4, Math.sin(i) * 0.4, 0);
        cloud.add(c);
      }
      cloud.position.set(cx, cy, cz);
      scene.add(cloud);
    });

    // Construir mundo
    createEnvironment(scene);
    createPlaza(scene);
    BUILDINGS.forEach(b => createBuilding(scene, b, collidersRef.current));
    createNPCs(scene);

    // Colisão da fonte central
    collidersRef.current.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(0, 1, 0), new THREE.Vector3(5, 4, 5)
    ));

    // Avatar do jogador
    const sc = typeof playerAvatar?.skinColor === "string" ? parseInt(playerAvatar.skinColor.replace("#", ""), 16) : (playerAvatar?.skinColor ?? 0xFDBA74);
    const shc = typeof playerAvatar?.shirtColor === "string" ? parseInt(playerAvatar.shirtColor.replace("#", ""), 16) : (playerAvatar?.shirtColor ?? 0x6366F1);
    const pc = typeof playerAvatar?.pantsColor === "string" ? parseInt(playerAvatar.pantsColor.replace("#", ""), 16) : (playerAvatar?.pantsColor ?? 0x1E40AF);
    const hc = typeof playerAvatar?.hairColor === "string" ? parseInt(playerAvatar.hairColor.replace("#", ""), 16) : undefined;
    const avatar = createHumanAvatar(sc, shc, pc, hc, playerAvatar?.gender, playerAvatar?.hairStyle);
    avatar.group.position.copy(playerPosRef.current);
    scene.add(avatar.group);
    avatarRef.current = avatar;

    // Resize
    const onResize = () => {
      const w = container.clientWidth; const h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    // Loop
    const SPEED = 0.09;
    const clock = new THREE.Clock();

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      animTimeRef.current += dt;
      const t = animTimeRef.current;

      const keys = keysRef.current;
      let moveX = 0, moveZ = 0;
      if (keys["w"] || keys["arrowup"])    moveZ -= 1;
      if (keys["s"] || keys["arrowdown"])  moveZ += 1;
      if (keys["a"] || keys["arrowleft"])  moveX -= 1;
      if (keys["d"] || keys["arrowright"]) moveX += 1;

      const jd = joystickDeltaRef.current;
      if (jd.x !== 0 || jd.y !== 0) { moveX = jd.x; moveZ = jd.y; }

      const isMoving = moveX !== 0 || moveZ !== 0;

      if (isMoving) {
        playerRotRef.current = Math.atan2(moveX, moveZ);
        const newX = playerPosRef.current.x + moveX * SPEED;
        const newZ = playerPosRef.current.z + moveZ * SPEED;

        const testBox = new THREE.Box3(
          new THREE.Vector3(newX - 0.4, 0, newZ - 0.4),
          new THREE.Vector3(newX + 0.4, 2, newZ + 0.4)
        );
        if (!collidersRef.current.some(c => c.intersectsBox(testBox))) {
          playerPosRef.current.x = Math.max(-45, Math.min(45, newX));
          playerPosRef.current.z = Math.max(-45, Math.min(45, newZ));
        }

        avatar.legL.rotation.x = Math.sin(t * 8) * 0.5;
        avatar.legR.rotation.x = -Math.sin(t * 8) * 0.5;
        avatar.armL.rotation.x = -Math.sin(t * 8) * 0.4;
        avatar.armR.rotation.x = Math.sin(t * 8) * 0.4;
      } else {
        avatar.armL.rotation.x = Math.sin(t * 1.5) * 0.04;
        avatar.armR.rotation.x = Math.sin(t * 1.5) * 0.04;
        avatar.legL.rotation.x = 0;
        avatar.legR.rotation.x = 0;
      }

      avatar.group.position.copy(playerPosRef.current);
      avatar.group.rotation.y = playerRotRef.current;

      // Câmera terceira pessoa
      const camAngle = playerRotRef.current;
      camera.position.lerp(
        new THREE.Vector3(
          playerPosRef.current.x + Math.sin(camAngle) * 10,
          playerPosRef.current.y + 7,
          playerPosRef.current.z + Math.cos(camAngle) * 10
        ), 0.07
      );
      camera.lookAt(playerPosRef.current.x, playerPosRef.current.y + 1.2, playerPosRef.current.z);

      // Prédio próximo
      let closest: string | null = null;
      let closestDist = Infinity;
      BUILDINGS.forEach(b => {
        const dx = playerPosRef.current.x - b.position[0];
        const dz = playerPosRef.current.z - b.position[2];
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 7 && dist < closestDist) { closestDist = dist; closest = b.id; }
      });
      setNearbyBuilding(closest);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  // ── Teclado ────────────────────────────────────────────────────────
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key === "Escape" || e.key.toLowerCase() === "m") setShowMenu(p => !p);
      if (e.key.toLowerCase() === "e" && nearbyBuilding) enterBuilding();
    };
    const onUp = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => { window.removeEventListener("keydown", onDown); window.removeEventListener("keyup", onUp); };
  }, [nearbyBuilding]);

  // ── Joystick ───────────────────────────────────────────────────────
  const handleJoystickStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    joystickStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    joystickActiveRef.current = true;
    setJoystickActive(true);
  }, []);
  const handleJoystickMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!joystickActiveRef.current) return;
    const dx = e.touches[0].clientX - joystickStartRef.current.x;
    const dy = e.touches[0].clientY - joystickStartRef.current.y;
    const maxR = 40;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const scale = dist > maxR ? maxR / dist : 1;
    joystickDeltaRef.current = { x: (dx * scale) / maxR, y: (dy * scale) / maxR };
    setJoystickVisual({ x: joystickDeltaRef.current.x, y: joystickDeltaRef.current.y });
  }, []);
  const handleJoystickEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    joystickActiveRef.current = false;
    joystickDeltaRef.current = { x: 0, y: 0 };
    setJoystickActive(false);
    setJoystickVisual({ x: 0, y: 0 });
  }, []);

  // ── Entrar no prédio ───────────────────────────────────────────────
  const enterBuilding = useCallback(() => {
    if (!nearbyBuilding) return;
    setSelectedBuilding(BUILDINGS.find(b => b.id === nearbyBuilding) ?? null);
  }, [nearbyBuilding]);

  const nearbyBuildingData = BUILDINGS.find(b => b.id === nearbyBuilding);

  return (
    <div className="relative w-full h-full overflow-hidden bg-sky-400" ref={containerRef}>
      {/* HUD */}
      <div className="absolute top-3 left-3 pointer-events-none z-10">
        <div className="bg-black/50 text-white rounded-xl px-3 py-2 text-sm backdrop-blur">
          <p className="font-bold text-base">🎮 {playerAvatar?.name ?? "Jogador"}</p>
          <p className="text-yellow-300 text-xs">⭐ {playerAvatar?.points ?? 0} pts</p>
        </div>
      </div>

      {/* Menu button */}
      <div className="absolute top-3 right-3 z-20 pointer-events-auto">
        <Button variant="outline" size="icon" onClick={() => setShowMenu(!showMenu)} className="bg-black/50 border-white/30 text-white hover:bg-black/70 w-10 h-10">
          {showMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Menu flutuante */}
      {showMenu && (
        <div className="absolute top-14 right-3 z-30 pointer-events-auto w-52">
          <Card className="p-2 bg-gray-900/95 border-gray-700 text-white backdrop-blur max-h-[80vh] overflow-y-auto">
            <p className="text-center text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Menu</p>
            <div className="flex flex-col gap-1">
              {[
                { label: "🛒 Loja", fn: () => { onOpenShop(); setShowMenu(false); } },
                { label: "📊 Progresso", fn: () => { onOpenProgress(); setShowMenu(false); } },
                { label: "🏫 Minha Escola", fn: () => { onOpenSchool?.(); setShowMenu(false); } },
                { label: "👩‍🏫 Painel Professor", fn: () => { onOpenTeacher?.(); setShowMenu(false); } },
                { label: "🏆 Conquistas", fn: () => { onOpenAchievements?.(); setShowMenu(false); } },
                { label: "⚡ Desafio Diário", fn: () => { onOpenDaily?.(); setShowMenu(false); } },
                { label: "🥇 Ranking", fn: () => { onOpenRanking?.(); setShowMenu(false); } },
                { label: "⚔️ Duelos", fn: () => { onOpenDuel?.(); setShowMenu(false); } },
                { label: "📖 Modo História", fn: () => { onOpenStory?.(); setShowMenu(false); } },
                { label: "🔔 Notificações", fn: () => { onOpenNotifications?.(); setShowMenu(false); } },
              ].map(({ label, fn }) => (
                <button key={label} onClick={fn} className="text-left px-3 py-2 rounded-lg text-sm hover:bg-white/10 transition-colors text-gray-100">{label}</button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Prédio próximo */}
      {nearbyBuildingData && !selectedBuilding && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <Card className="px-5 py-3 bg-black/80 border-yellow-400/50 text-white text-center backdrop-blur">
            <p className="font-bold text-base">{nearbyBuildingData.name}</p>
            <p className="text-xs text-gray-400 mb-2">Pressione E ou toque para entrar</p>
            <Button size="sm" onClick={enterBuilding} className="bg-yellow-400 text-black hover:bg-yellow-300 font-bold">Entrar →</Button>
          </Card>
        </div>
      )}

      {/* Controles (desktop) */}
      <div className="absolute bottom-3 left-3 z-10 pointer-events-none hidden md:block">
        <div className="bg-black/50 text-white rounded-xl px-3 py-2 text-xs backdrop-blur">
          <p className="font-semibold mb-1">Controles</p>
          <p>WASD / Setas — Mover</p>
          <p>E — Entrar no prédio</p>
          <p>ESC / M — Menu</p>
        </div>
      </div>

      {/* Joystick (mobile) */}
      <div
        className="absolute bottom-6 left-6 z-20 w-28 h-28 rounded-full bg-white/20 border-2 border-white/40 backdrop-blur flex items-center justify-center md:hidden"
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
        style={{ touchAction: "none" }}
      >
        <div className="w-12 h-12 rounded-full bg-white/60 shadow-lg transition-transform" style={{ transform: joystickActive ? `translate(${joystickVisual.x * 28}px, ${joystickVisual.y * 28}px)` : "translate(0,0)" }} />
      </div>

      {/* Botão Entrar (mobile) */}
      {nearbyBuildingData && !selectedBuilding && (
        <div className="absolute bottom-24 right-6 z-20 pointer-events-auto md:hidden">
          <Button onClick={enterBuilding} className="w-16 h-16 rounded-full bg-yellow-400 text-black font-bold text-xs shadow-lg">Entrar</Button>
        </div>
      )}

      {/* Interior do prédio */}
      {selectedBuilding && (
        <BuildingInterior3D
          buildingId={selectedBuilding.id}
          buildingName={selectedBuilding.name}
          discipline={selectedBuilding.discipline}
          color={selectedBuilding.color}
          onClose={() => setSelectedBuilding(null)}
          onSelectOption={(option) => {
            setSelectedBuilding(null);
            if (option === "quiz") onBuildingClick(selectedBuilding.id);
          }}
        />
      )}
    </div>
  );
}
