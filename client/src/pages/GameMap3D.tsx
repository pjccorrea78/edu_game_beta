import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Menu, X, Zap, Trophy, BookOpen, Palette, Heart, Users, Settings, Bell } from "lucide-react";
import BuildingInterior3D from "@/components/BuildingInterior3D";

// ─── Disciplinas / Prédios ────────────────────────────────────────────────────
const BUILDINGS = [
  { id: "math",      name: "Matemática",       discipline: "matematica",       color: 0x3B82F6, accent: 0x1D4ED8, position: [-18, 0, -18] as [number,number,number] },
  { id: "portuguese",name: "Português",         discipline: "portugues",        color: 0xEF4444, accent: 0xB91C1C, position: [ 18, 0, -18] as [number,number,number] },
  { id: "science",   name: "Ciências",          discipline: "ciencias",         color: 0x22C55E, accent: 0x15803D, position: [-18, 0,  18] as [number,number,number] },
  { id: "history",   name: "História",          discipline: "historia",         color: 0xF59E0B, accent: 0xB45309, position: [ 18, 0,  18] as [number,number,number] },
  { id: "geography", name: "Geografia",         discipline: "geografia",        color: 0x8B5CF6, accent: 0x6D28D9, position: [-18, 0,   0] as [number,number,number] },
  { id: "art",       name: "Arte",              discipline: "arte",             color: 0xEC4899, accent: 0xBE185D, position: [ 18, 0,   0] as [number,number,number] },
  { id: "pe",        name: "Ed. Física",        discipline: "educacao_fisica",  color: 0xF97316, accent: 0xC2410C, position: [  0, 0, -18] as [number,number,number] },
  { id: "religion",  name: "Ens. Religioso",    discipline: "ensino_religioso", color: 0x06B6D4, accent: 0x0E7490, position: [  0, 0,  18] as [number,number,number] },
];

// ─── Props ────────────────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function createBuilding(
  scene: THREE.Scene,
  bld: typeof BUILDINGS[0],
  colliders: THREE.Box3[]
) {
  const group = new THREE.Group();
  const [bx, , bz] = bld.position;

  // Base do prédio (redimensionado: 60% do tamanho original)
  const bodyGeo = new THREE.BoxGeometry(5.5, 6, 5.5);
  const bodyMat = new THREE.MeshLambertMaterial({ color: bld.color });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.set(0, 3, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Telhado (proporcionalmente menor)
  const roofGeo = new THREE.ConeGeometry(4, 2, 4);
  const roofMat = new THREE.MeshLambertMaterial({ color: bld.accent });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.set(0, 7, 0);
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  // Janelas (frente)
  const winMat = new THREE.MeshLambertMaterial({ color: 0xBAE6FD, emissive: 0x7DD3FC, emissiveIntensity: 0.5 });
  const winGeo = new THREE.BoxGeometry(1, 1, 0.15);
  const winPositions = [[-1.2, 4.5], [0, 4.5], [1.2, 4.5], [-1.2, 2.5], [0, 2.5], [1.2, 2.5]];
  winPositions.forEach(([wx, wy]) => {
    const win = new THREE.Mesh(winGeo, winMat);
    win.position.set(wx, wy, 2.8);
    win.castShadow = true;
    group.add(win);
  });

  // Porta (melhor proporcao)
  const doorGeo = new THREE.BoxGeometry(1.2, 2, 0.15);
  const doorMat = new THREE.MeshLambertMaterial({ color: bld.accent });
  const door = new THREE.Mesh(doorGeo, doorMat);
  door.position.set(0, 1, 2.8);
  door.castShadow = true;
  group.add(door);

  // Placa com nome
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const colorHex = "#" + bld.color.toString(16).padStart(6, "0");
  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 48px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(bld.name, 256, 64);
  const tex = new THREE.CanvasTexture(canvas);
  const signGeo = new THREE.PlaneGeometry(5, 1.2);
  const signMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  const sign = new THREE.Mesh(signGeo, signMat);
  sign.position.set(0, 6.5, 2.85);
  group.add(sign);

  group.position.set(bx, 0, bz);
  scene.add(group);

  // Colisao (ajustada para novo tamanho)
  const box = new THREE.Box3();
  box.setFromCenterAndSize(
    new THREE.Vector3(bx, 3, bz),
    new THREE.Vector3(6.5, 7, 6.5)
  );
  colliders.push(box);

  return group;
}

function createCity(scene: THREE.Scene, colliders: THREE.Box3[]) {
  // ── Chão base (grama) ──────────────────────────────────────────────────────
  const groundGeo = new THREE.PlaneGeometry(80, 80);
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x4ADE80 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // ── Ruas (asfalto) ─────────────────────────────────────────────────────────
  const roadMat = new THREE.MeshLambertMaterial({ color: 0x374151 });
  // Rua horizontal central
  const hRoad = new THREE.Mesh(new THREE.PlaneGeometry(80, 8), roadMat);
  hRoad.rotation.x = -Math.PI / 2;
  hRoad.position.set(0, 0.01, 0);
  hRoad.receiveShadow = true;
  scene.add(hRoad);
  // Rua vertical central
  const vRoad = new THREE.Mesh(new THREE.PlaneGeometry(8, 80), roadMat);
  vRoad.rotation.x = -Math.PI / 2;
  vRoad.position.set(0, 0.01, 0);
  vRoad.receiveShadow = true;
  scene.add(vRoad);

  // ── Calçadas ───────────────────────────────────────────────────────────────
  const sidewalkMat = new THREE.MeshLambertMaterial({ color: 0xD1D5DB });
  const sidewalkH = new THREE.Mesh(new THREE.PlaneGeometry(80, 2), sidewalkMat);
  sidewalkH.rotation.x = -Math.PI / 2;
  sidewalkH.position.set(0, 0.02, 5);
  scene.add(sidewalkH);
  const sidewalkH2 = new THREE.Mesh(new THREE.PlaneGeometry(80, 2), sidewalkMat);
  sidewalkH2.rotation.x = -Math.PI / 2;
  sidewalkH2.position.set(0, 0.02, -5);
  scene.add(sidewalkH2);
  const sidewalkV = new THREE.Mesh(new THREE.PlaneGeometry(2, 80), sidewalkMat);
  sidewalkV.rotation.x = -Math.PI / 2;
  sidewalkV.position.set(5, 0.02, 0);
  scene.add(sidewalkV);
  const sidewalkV2 = new THREE.Mesh(new THREE.PlaneGeometry(2, 80), sidewalkMat);
  sidewalkV2.rotation.x = -Math.PI / 2;
  sidewalkV2.position.set(-5, 0.02, 0);
  scene.add(sidewalkV2);

  // ── Faixas de pedestre ─────────────────────────────────────────────────────
  const stripeMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
  for (let i = -3; i <= 3; i += 1.5) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 6), stripeMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(i, 0.03, 0);
    scene.add(stripe);
    const stripe2 = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.5), stripeMat);
    stripe2.rotation.x = -Math.PI / 2;
    stripe2.position.set(0, 0.03, i);
    scene.add(stripe2);
  }

  // ── Linhas centrais da rua (tracejado amarelo) ─────────────────────────────
  const dashMat = new THREE.MeshLambertMaterial({ color: 0xFBBF24 });
  for (let i = -36; i <= 36; i += 6) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.3), dashMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(i, 0.03, 0);
    scene.add(dash);
    const dash2 = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 3), dashMat);
    dash2.rotation.x = -Math.PI / 2;
    dash2.position.set(0, 0.03, i);
    scene.add(dash2);
  }

  // ── Árvores ────────────────────────────────────────────────────────────────
  const treeTrunkMat = new THREE.MeshLambertMaterial({ color: 0x92400E });
  const treeTopMat = new THREE.MeshLambertMaterial({ color: 0x16A34A });
  const treePositions = [
    [-10, 8], [10, 8], [-10, -8], [10, -8],
    [-8, 10], [8, 10], [-8, -10], [8, -10],
    [-25, 8], [25, 8], [-25, -8], [25, -8],
  ];
  treePositions.forEach(([tx, tz]) => {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2), treeTrunkMat);
    trunk.position.set(tx, 1, tz);
    trunk.castShadow = true;
    scene.add(trunk);
    const top = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 6), treeTopMat);
    top.position.set(tx, 3.5, tz);
    top.castShadow = true;
    scene.add(top);
  });

  // ── Postes de luz ──────────────────────────────────────────────────────────
  const poleMat = new THREE.MeshLambertMaterial({ color: 0x6B7280 });
  const lampMat = new THREE.MeshLambertMaterial({ color: 0xFEF08A, emissive: 0xFEF08A, emissiveIntensity: 0.8 });
  const polePositions = [[-12, 6], [12, 6], [-12, -6], [12, -6]];
  polePositions.forEach(([px, pz]) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 5), poleMat);
    pole.position.set(px, 2.5, pz);
    scene.add(pole);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.4), lampMat);
    lamp.position.set(px, 5.2, pz);
    scene.add(lamp);
    const light = new THREE.PointLight(0xFEF9C3, 1.5, 12);
    light.position.set(px, 5, pz);
    scene.add(light);
  });

  // ── Prédios ────────────────────────────────────────────────────────────────
  BUILDINGS.forEach(b => createBuilding(scene, b, colliders));
}

// ─── Avatar humanóide ─────────────────────────────────────────────────────────
function createHumanAvatar(skinColor: number, shirtColor: number, pantsColor: number, gender?: string, hairStyle?: string) {
  const group = new THREE.Group();
  const skinMat = new THREE.MeshLambertMaterial({ color: skinColor });
  const shirtMat = new THREE.MeshLambertMaterial({ color: shirtColor });
  const pantsMat = new THREE.MeshLambertMaterial({ color: pantsColor });
  const shoesMat = new THREE.MeshLambertMaterial({ color: 0x1C1917 });
  const eyeMat = new THREE.MeshLambertMaterial({ color: 0x1E293B });

  // Cabeça
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), skinMat);
  head.position.y = 1.65;
  head.castShadow = true;
  group.add(head);

  // Cabelo simples
  const hairColor = 0x3B2F2F;
  const hairMat = new THREE.MeshLambertMaterial({ color: hairColor });
  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.35, 0.75), hairMat);
  hair.position.set(0, 1.8, 0);
  group.add(hair);

  // Olhos
  const eyeGeo = new THREE.BoxGeometry(0.12, 0.12, 0.05);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.15, 1.68, 0.36);
  group.add(eyeL);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(0.15, 1.68, 0.36);
  group.add(eyeR);

  // Tronco
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.7, 0.35), shirtMat);
  torso.position.y = 1.05;
  torso.castShadow = true;
  group.add(torso);

  // Braço esquerdo
  const armL = new THREE.Group();
  const armLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.6, 0.25), shirtMat);
  armLMesh.position.y = -0.3;
  armL.add(armLMesh);
  const handL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.22), skinMat);
  handL.position.y = -0.65;
  armL.add(handL);
  armL.position.set(-0.47, 1.35, 0);
  group.add(armL);

  // Braço direito
  const armR = new THREE.Group();
  const armRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.6, 0.25), shirtMat);
  armRMesh.position.y = -0.3;
  armR.add(armRMesh);
  const handR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.22), skinMat);
  handR.position.y = -0.65;
  armR.add(handR);
  armR.position.set(0.47, 1.35, 0);
  group.add(armR);

  // Perna esquerda
  const legL = new THREE.Group();
  const legLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.6, 0.28), pantsMat);
  legLMesh.position.y = -0.3;
  legL.add(legLMesh);
  const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 0.35), shoesMat);
  shoeL.position.set(0, -0.65, 0.04);
  legL.add(shoeL);
  legL.position.set(-0.18, 0.68, 0);
  group.add(legL);

  // Perna direita
  const legR = new THREE.Group();
  const legRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.6, 0.28), pantsMat);
  legRMesh.position.y = -0.3;
  legR.add(legRMesh);
  const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 0.35), shoesMat);
  shoeR.position.set(0, -0.65, 0.04);
  legR.add(shoeR);
  legR.position.set(0.18, 0.68, 0);
  group.add(legR);

  return { group, head, armL, armR, legL, legR };
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function GameMap3D({
  playerAvatar,
  onBuildingClick,
  onOpenShop,
  onOpenProgress,

  onOpenSchool,
  onOpenTeacher,
  onOpenAchievements,
  onOpenDaily,
  onOpenRanking,
  onOpenDuel,
  onOpenStory,
  onOpenNotifications,
  onOpenAvatarAI,
}: GameMap3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const avatarRef = useRef<ReturnType<typeof createHumanAvatar> | null>(null);
  const playerPosRef = useRef(new THREE.Vector3(0, 0, 0));
  const playerRotRef = useRef(0);
  const keysRef = useRef<Record<string, boolean>>({});
  const collidersRef = useRef<THREE.Box3[]>([]);
  const animTimeRef = useRef(0);
  const frameRef = useRef(0);

  const [showMenu, setShowMenu] = useState(false);
  const [nearbyBuilding, setNearbyBuilding] = useState<string | null>(null);
  const [isEntering, setIsEntering] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<typeof BUILDINGS[0] | null>(null);
  // Joystick usa refs para evitar closure stale no loop Three.js
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickVisual, setJoystickVisual] = useState({ x: 0, y: 0 });
  const joystickDeltaRef = useRef({ x: 0, y: 0 }); // lido diretamente no loop
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const joystickStartRef = useRef({ x: 0, y: 0 });
  const joystickActiveRef = useRef(false);

  // ── Setup Three.js ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const W = container.clientWidth;
    const H = container.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x87CEEB);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Cena
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x87CEEB, 40, 80);
    sceneRef.current = scene;

    // Câmera
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 200);
    camera.position.set(0, 8, 12);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Iluminação
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xFFF9C4, 1.2);
    sun.position.set(20, 40, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 100;
    sun.shadow.camera.left = -50;
    sun.shadow.camera.right = 50;
    sun.shadow.camera.top = 50;
    sun.shadow.camera.bottom = -50;
    scene.add(sun);

    // Céu com gradiente
    const skyGeo = new THREE.SphereGeometry(90, 16, 8);
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x7DD3FC, side: THREE.BackSide });
    scene.add(new THREE.Mesh(skyGeo, skyMat));

    // Nuvens
    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    [[15, 25, -20], [-20, 22, -15], [5, 28, -30]].forEach(([cx, cy, cz]) => {
      const cloud = new THREE.Group();
      [0, 2, -2, 1.5, -1.5].forEach((ox, i) => {
        const c = new THREE.Mesh(new THREE.SphereGeometry(2 + i * 0.3, 6, 4), cloudMat);
        c.position.set(ox * 1.5, Math.sin(i) * 0.5, 0);
        cloud.add(c);
      });
      cloud.position.set(cx, cy, cz);
      scene.add(cloud);
    });

    // Cidade
    createCity(scene, collidersRef.current);

    // Avatar
    const skinColor = playerAvatar?.skinColor ?? 0xFDBA74;
    const shirtColor = playerAvatar?.shirtColor ?? 0x6366F1;
    const pantsColor = playerAvatar?.pantsColor ?? 0x1E40AF;
    const avatar = createHumanAvatar(skinColor, shirtColor, pantsColor, playerAvatar?.gender, playerAvatar?.hairStyle);
    avatar.group.position.copy(playerPosRef.current);
    scene.add(avatar.group);
    avatarRef.current = avatar;

    // Resize
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    // Loop de animação
    const SPEED = 0.08;
    const clock = new THREE.Clock();

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      animTimeRef.current += dt;
      const t = animTimeRef.current;

      const keys = keysRef.current;
      let moveX = 0;
      let moveZ = 0;

      if (keys["w"] || keys["arrowup"])    moveZ -= 1;
      if (keys["s"] || keys["arrowdown"])  moveZ += 1;
      if (keys["a"] || keys["arrowleft"])  moveX -= 1;
      if (keys["d"] || keys["arrowright"]) moveX += 1;

      // Joystick override (lê ref, nunca stale)
      const jd = joystickDeltaRef.current;
      if (jd.x !== 0 || jd.y !== 0) {
        moveX = jd.x;
        moveZ = jd.y;
      }

      const isMoving = moveX !== 0 || moveZ !== 0;

      if (isMoving) {
        const angle = Math.atan2(moveX, moveZ);
        playerRotRef.current = angle;

        const newX = playerPosRef.current.x + moveX * SPEED;
        const newZ = playerPosRef.current.z + moveZ * SPEED;

        // Colisão
        const testBox = new THREE.Box3(
          new THREE.Vector3(newX - 0.4, 0, newZ - 0.4),
          new THREE.Vector3(newX + 0.4, 2, newZ + 0.4)
        );
        const blocked = collidersRef.current.some(c => c.intersectsBox(testBox));

        if (!blocked) {
          playerPosRef.current.x = Math.max(-38, Math.min(38, newX));
          playerPosRef.current.z = Math.max(-38, Math.min(38, newZ));
        }

        // Animação de caminhada
        const walkSpeed = 8;
        avatar.legL.rotation.x = Math.sin(t * walkSpeed) * 0.5;
        avatar.legR.rotation.x = -Math.sin(t * walkSpeed) * 0.5;
        avatar.armL.rotation.x = -Math.sin(t * walkSpeed) * 0.4;
        avatar.armR.rotation.x = Math.sin(t * walkSpeed) * 0.4;
      } else {
        // Idle: leve balanço
        avatar.armL.rotation.x = Math.sin(t * 1.5) * 0.04;
        avatar.armR.rotation.x = Math.sin(t * 1.5) * 0.04;
        avatar.legL.rotation.x = 0;
        avatar.legR.rotation.x = 0;
      }

      // Posicionar avatar
      avatar.group.position.copy(playerPosRef.current);
      avatar.group.rotation.y = playerRotRef.current;

      // Câmera terceira pessoa
      const camDist = 10;
      const camHeight = 7;
      const camAngle = playerRotRef.current;
      const targetCamX = playerPosRef.current.x + Math.sin(camAngle) * camDist;
      const targetCamZ = playerPosRef.current.z + Math.cos(camAngle) * camDist;
      camera.position.lerp(
        new THREE.Vector3(targetCamX, playerPosRef.current.y + camHeight, targetCamZ),
        0.08
      );
      camera.lookAt(
        playerPosRef.current.x,
        playerPosRef.current.y + 1.2,
        playerPosRef.current.z
      );

      // Detectar prédio próximo
      let closest: string | null = null;
      let closestDist = Infinity;
      BUILDINGS.forEach(b => {
        const dx = playerPosRef.current.x - b.position[0];
        const dz = playerPosRef.current.z - b.position[2];
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 7 && dist < closestDist) {
          closestDist = dist;
          closest = b.id;
        }
      });
      setNearbyBuilding(closest);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // ── Teclado ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key === "Escape" || e.key.toLowerCase() === "m") {
        setShowMenu(prev => !prev);
      }
      if (e.key.toLowerCase() === "e") {
        // Entrar no prédio mais próximo
        const nearby = document.querySelector('[data-nearby-building]') as HTMLElement;
        if (nearby) nearby.click();
      }
    };
    const onUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  // ── Joystick touch ──────────────────────────────────────────────────────────
  const handleJoystickStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    joystickStartRef.current = { x: touch.clientX, y: touch.clientY };
    joystickActiveRef.current = true;
    setJoystickActive(true);
  }, []);

  const handleJoystickMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!joystickActiveRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - joystickStartRef.current.x;
    const dy = touch.clientY - joystickStartRef.current.y;
    const maxR = 40;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const scale = dist > maxR ? maxR / dist : 1;
    const nx = (dx * scale) / maxR;
    const ny = (dy * scale) / maxR;
    joystickDeltaRef.current = { x: nx, y: ny }; // atualiza ref imediatamente
    setJoystickVisual({ x: nx, y: ny }); // atualiza visual
  }, []);

  const handleJoystickEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    joystickActiveRef.current = false;
    joystickDeltaRef.current = { x: 0, y: 0 };
    setJoystickActive(false);
    setJoystickVisual({ x: 0, y: 0 });
  }, []);

  // ── Entrar no prédio ────────────────────────────────────────────────────────
  const enterBuilding = useCallback(() => {
    if (!nearbyBuilding) return;
    const building = BUILDINGS.find(b => b.id === nearbyBuilding);
    if (building) {
      setSelectedBuilding(building);
    }
  }, [nearbyBuilding]);

  const nearbyBuildingData = BUILDINGS.find(b => b.id === nearbyBuilding);

  const handleBuildingInteriorClose = () => {
    setSelectedBuilding(null);
  };

  const handleBuildingInteriorOption = (option: "lesson" | "quiz") => {
    if (selectedBuilding) {
      setSelectedBuilding(null);
      if (option === "quiz") {
        onBuildingClick(selectedBuilding.id);
      }
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-sky-400" ref={containerRef}>

      {/* HUD: Info do jogador */}
      <div className="absolute top-3 left-3 pointer-events-none z-10">
        <div className="bg-black/50 text-white rounded-xl px-3 py-2 text-sm backdrop-blur">
          <p className="font-bold text-base">🎮 {playerAvatar?.name ?? "Jogador"}</p>
          <p className="text-yellow-300 text-xs">⭐ {playerAvatar?.points ?? 0} pts</p>
        </div>
      </div>

      {/* Botão Menu (único - aparece em todos os dispositivos no topo direito) */}
      <div className="absolute top-3 right-3 z-20 pointer-events-auto">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowMenu(!showMenu)}
          className="bg-black/50 border-white/30 text-white hover:bg-black/70 w-10 h-10"
        >
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
                { label: "🛒 Loja",              fn: () => { onOpenShop(); setShowMenu(false); } },
                { label: "📊 Progresso",          fn: () => { onOpenProgress(); setShowMenu(false); } },

                { label: "🏫 Minha Escola",       fn: () => { onOpenSchool?.(); setShowMenu(false); } },
                { label: "👩‍🏫 Painel do Professor", fn: () => { onOpenTeacher?.(); setShowMenu(false); } },
                { label: "🏆 Conquistas",         fn: () => { onOpenAchievements?.(); setShowMenu(false); } },
                { label: "⚡ Desafio Diário",     fn: () => { onOpenDaily?.(); setShowMenu(false); } },
                { label: "🥇 Ranking",            fn: () => { onOpenRanking?.(); setShowMenu(false); } },
                { label: "⚔️ Duelos",             fn: () => { onOpenDuel?.(); setShowMenu(false); } },
                { label: "📖 Modo História",      fn: () => { onOpenStory?.(); setShowMenu(false); } },
                { label: "🔔 Notificações",       fn: () => { onOpenNotifications?.(); setShowMenu(false); } },
              ].map(({ label, fn }) => (
                <button
                  key={label}
                  onClick={fn}
                  className="text-left px-3 py-2 rounded-lg text-sm hover:bg-white/10 transition-colors text-gray-100"
                >
                  {label}
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Prédio próximo */}
      {nearbyBuildingData && !isEntering && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <Card className="px-5 py-3 bg-black/80 border-yellow-400/50 text-white text-center backdrop-blur">
            <p className="font-bold text-base">{nearbyBuildingData.name}</p>
            <p className="text-xs text-gray-400 mb-2">Pressione E ou toque para entrar</p>
            <Button size="sm" onClick={enterBuilding} data-nearby-building="true" className="bg-yellow-400 text-black hover:bg-yellow-300 font-bold">
              Entrar →
            </Button>
          </Card>
        </div>
      )}

      {/* Animação de entrada */}
      {isEntering && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="text-white text-center">
            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-lg font-bold">Entrando...</p>
          </div>
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

      {/* Joystick virtual (mobile) */}
      <div
        ref={joystickBaseRef}
        className="absolute bottom-6 left-6 z-20 w-28 h-28 rounded-full bg-white/20 border-2 border-white/40 backdrop-blur flex items-center justify-center md:hidden"
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
        style={{ touchAction: "none" }}
      >
        <div
          className="w-12 h-12 rounded-full bg-white/60 shadow-lg transition-transform"
          style={{
            transform: joystickActive
              ? `translate(${joystickVisual.x * 28}px, ${joystickVisual.y * 28}px)`
              : "translate(0,0)",
          }}
        />
      </div>

      {/* Botao Entrar (mobile, quando proximo) */}
      {nearbyBuildingData && !isEntering && (
        <div className="absolute bottom-24 right-6 z-20 pointer-events-auto md:hidden">
          <Button
            onClick={enterBuilding}
            className="w-16 h-16 rounded-full bg-yellow-400 text-black font-bold text-xs shadow-lg"
          >
            Entrar
          </Button>
        </div>
      )}

      {/* Interior 3D do predio */}
      {selectedBuilding && (
        <BuildingInterior3D
          buildingId={selectedBuilding.id}
          buildingName={selectedBuilding.name}
          discipline={selectedBuilding.discipline}
          color={selectedBuilding.color}
          onClose={handleBuildingInteriorClose}
          onSelectOption={handleBuildingInteriorOption}
        />
      )}
    </div>
  );
}
