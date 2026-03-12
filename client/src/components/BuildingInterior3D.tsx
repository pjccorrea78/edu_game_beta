import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import LessonVideo from "./LessonVideo";

interface BuildingInterior3DProps {
  buildingId: string;
  buildingName: string;
  discipline: string;
  color: number;
  onClose: () => void;
  onSelectOption: (option: "lesson" | "quiz") => void;
}

// Criar professor 3D humanóide
function createTeacher(skinColor: number = 0xFDBA74, shirtColor: number = 0xEF4444) {
  const group = new THREE.Group();
  const skinMat = new THREE.MeshLambertMaterial({ color: skinColor });
  const shirtMat = new THREE.MeshLambertMaterial({ color: shirtColor });
  const pantsMat = new THREE.MeshLambertMaterial({ color: 0x1E40AF });
  const shoesMat = new THREE.MeshLambertMaterial({ color: 0x1C1917 });
  const eyeMat = new THREE.MeshLambertMaterial({ color: 0x1E293B });

  // Cabeça
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), skinMat);
  head.position.y = 2;
  head.castShadow = true;
  group.add(head);

  // Cabelo
  const hairMat = new THREE.MeshLambertMaterial({ color: 0x3B2F2F });
  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.4, 0.85), hairMat);
  hair.position.set(0, 2.2, 0);
  group.add(hair);

  // Olhos
  const eyeGeo = new THREE.BoxGeometry(0.15, 0.15, 0.05);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.2, 2.05, 0.41);
  group.add(eyeL);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(0.2, 2.05, 0.41);
  group.add(eyeR);

  // Tronco
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.85, 0.4), shirtMat);
  torso.position.y = 1.2;
  torso.castShadow = true;
  group.add(torso);

  // Braço esquerdo
  const armL = new THREE.Group();
  const armLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.7, 0.3), shirtMat);
  armLMesh.position.y = -0.35;
  armL.add(armLMesh);
  const handL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), skinMat);
  handL.position.y = -0.8;
  armL.add(handL);
  armL.position.set(-0.55, 1.5, 0);
  group.add(armL);

  // Braço direito
  const armR = new THREE.Group();
  const armRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.7, 0.3), shirtMat);
  armRMesh.position.y = -0.35;
  armR.add(armRMesh);
  const handR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), skinMat);
  handR.position.y = -0.8;
  armR.add(handR);
  armR.position.set(0.55, 1.5, 0);
  group.add(armR);

  // Perna esquerda
  const legL = new THREE.Group();
  const legLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.7, 0.32), pantsMat);
  legLMesh.position.y = -0.35;
  legL.add(legLMesh);
  const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.4), shoesMat);
  shoeL.position.set(0, -0.75, 0.05);
  legL.add(shoeL);
  legL.position.set(-0.2, 0.8, 0);
  group.add(legL);

  // Perna direita
  const legR = new THREE.Group();
  const legRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.7, 0.32), pantsMat);
  legRMesh.position.y = -0.35;
  legR.add(legRMesh);
  const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.4), shoesMat);
  shoeR.position.set(0, -0.75, 0.05);
  legR.add(shoeR);
  legR.position.set(0.2, 0.8, 0);
  group.add(legR);

  return { group, armL, armR, legL, legR };
}

export default function BuildingInterior3D({
  buildingId,
  buildingName,
  discipline,
  color,
  onClose,
  onSelectOption,
}: BuildingInterior3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const teacherRef = useRef<ReturnType<typeof createTeacher> | null>(null);
  const animTimeRef = useRef(0);
  const frameRef = useRef(0);
  const [showOptions, setShowOptions] = useState(false);
  const [showLesson, setShowLesson] = useState(false);

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
    renderer.setClearColor(0xE8D4C4);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 200);
    camera.position.set(0, 1.5, 4);
    camera.lookAt(0, 1.2, 0);
    cameraRef.current = camera;

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xFFF9C4, 1);
    sun.position.set(5, 5, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    scene.add(sun);

    // Piso da sala
    const floorGeo = new THREE.PlaneGeometry(10, 10);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Parede de fundo
    const backWallGeo = new THREE.PlaneGeometry(10, 8);
    const backWallMat = new THREE.MeshLambertMaterial({ color: 0xFFF8DC });
    const backWall = new THREE.Mesh(backWallGeo, backWallMat);
    backWall.position.set(0, 4, -5);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Parede esquerda
    const leftWallGeo = new THREE.PlaneGeometry(10, 8);
    const leftWallMat = new THREE.MeshLambertMaterial({ color: 0xF5F5DC });
    const leftWall = new THREE.Mesh(leftWallGeo, leftWallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-5, 4, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Parede direita
    const rightWallGeo = new THREE.PlaneGeometry(10, 8);
    const rightWallMat = new THREE.MeshLambertMaterial({ color: 0xF5F5DC });
    const rightWall = new THREE.Mesh(rightWallGeo, rightWallMat);
    rightWall.rotation.y = Math.PI / 2;
    rightWall.position.set(5, 4, 0);
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // Quadro negro
    const boardGeo = new THREE.PlaneGeometry(3, 2);
    const boardMat = new THREE.MeshLambertMaterial({ color: 0x2C2C2C });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.set(0, 4.5, -4.9);
    scene.add(board);

    // Título na lousa
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#2C2C2C";
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(buildingName, 256, 128);
    const tex = new THREE.CanvasTexture(canvas);
    const boardTextMat = new THREE.MeshBasicMaterial({ map: tex });
    const boardText = new THREE.Mesh(boardGeo, boardTextMat);
    boardText.position.set(0, 4.5, -4.85);
    scene.add(boardText);

    // Professor
    const teacher = createTeacher(0xFDBA74, color);
    teacher.group.position.set(0, 0, 0);
    scene.add(teacher.group);
    teacherRef.current = teacher;

    // Carteira
    const deskGeo = new THREE.BoxGeometry(1.5, 0.8, 1);
    const deskMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.set(0, 0.4, 2);
    desk.castShadow = true;
    scene.add(desk);

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

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      animTimeRef.current += dt;
      const t = animTimeRef.current;

      // Professor balança levemente
      if (teacher) {
        teacher.armL.rotation.x = Math.sin(t * 1.5) * 0.1;
        teacher.armR.rotation.x = Math.sin(t * 1.5 + Math.PI) * 0.1;
        teacher.legL.rotation.x = Math.sin(t * 0.8) * 0.05;
        teacher.legR.rotation.x = Math.sin(t * 0.8 + Math.PI) * 0.05;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Show options after 1 second
    const timer = setTimeout(() => setShowOptions(true), 1000);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [buildingName, color]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="relative w-full h-full">
        {/* 3D Canvas */}
        <div ref={containerRef} className="w-full h-full" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white/90 hover:bg-white p-2 rounded-lg transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Options Modal */}
        {showOptions && !showLesson && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-center mb-2">Bem-vindo!</h2>
            <p className="text-center text-gray-600 mb-6">
              Olá! Sou seu professor de {buildingName}. O que você gostaria de fazer?
            </p>

            <div className="space-y-3">
              <Button
                onClick={() => setShowLesson(true)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-6 text-lg"
              >
                📚 Assistir Aula (2 min)
              </Button>
              <Button
                onClick={() => onSelectOption("quiz")}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-6 text-lg"
              >
                ✏️ Responder Perguntas
              </Button>
            </div>
          </div>
        )}

        {showLesson && (
          <LessonVideo
            discipline={discipline}
            grade={6}
            onClose={() => {
              setShowLesson(false);
              setShowOptions(true);
            }}
            onComplete={() => {
              // Award points for watching lesson
            }}
          />
        )}
      </div>
    </div>
  );
}
