import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import BlockyAvatar from "@/components/BlockyAvatar";
import { Settings, Trophy, BookOpen, Zap, Palette, Heart, Users, Menu, X } from "lucide-react";

type Building = {
  id: string;
  name: string;
  discipline: string;
  position: [number, number, number];
  color: THREE.Color;
  icon: React.ReactNode;
};

const BUILDINGS: Building[] = [
  { id: "math", name: "Matemática", discipline: "matematica", position: [-5, 0, -5], color: new THREE.Color(0x4169E1), icon: <Zap /> },
  { id: "portuguese", name: "Português", discipline: "portugues", position: [5, 0, -5], color: new THREE.Color(0xFF6B6B), icon: <BookOpen /> },
  { id: "geography", name: "Geografia", discipline: "geografia", position: [-5, 0, 5], color: new THREE.Color(0x51CF66), icon: <Zap /> },
  { id: "history", name: "História", discipline: "historia", position: [5, 0, 5], color: new THREE.Color(0xFFD93D), icon: <Trophy /> },
  { id: "science", name: "Ciências", discipline: "ciencias", position: [-8, 0, 0], color: new THREE.Color(0x6C5CE7), icon: <Palette /> },
  { id: "pe", name: "Educação Física", discipline: "educacao_fisica", position: [8, 0, 0], color: new THREE.Color(0xFF8C42), icon: <Heart /> },
  { id: "art", name: "Arte", discipline: "arte", position: [0, 0, -8], color: new THREE.Color(0xFF1493), icon: <Palette /> },
  { id: "religion", name: "Ensino Religioso", discipline: "ensino_religioso", position: [0, 0, 8], color: new THREE.Color(0x87CEEB), icon: <Users /> },
];

interface GameMap3DProps {
  playerAvatar: any;
  onBuildingClick: (buildingId: string) => void;
  onOpenShop: () => void;
  onOpenProgress: () => void;
  onOpenStudy?: () => void;
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

export default function GameMap3D({
  playerAvatar,
  onBuildingClick,
  onOpenShop,
  onOpenProgress,
  onOpenStudy,
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
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const buildingMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const playerMeshRef = useRef<THREE.Mesh | null>(null);
  const playerPosRef = useRef(new THREE.Vector3(0, 0.4, 0));
  const playerVelocityRef = useRef(new THREE.Vector3(0, 0, 0));
  const playerRotationRef = useRef(0);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);
  const [isEntering, setIsEntering] = useState(false);
  const [enteringBuildingId, setEnteringBuildingId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [nearbyBuilding, setNearbyBuilding] = useState<string | null>(null);
  const cameraAnimationProgress = useRef(0);
  const targetCameraPos = useRef<THREE.Vector3 | null>(null);
  const targetCameraLookAt = useRef<THREE.Vector3 | null>(null);

  // Proximity detection
  const PROXIMITY_DISTANCE = 3;

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 40, 80);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(15, 20, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    scene.add(directionalLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(40, 40);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Create buildings
    BUILDINGS.forEach((building) => {
      const geometry = new THREE.BoxGeometry(1.5, 2, 1.5);
      const material = new THREE.MeshStandardMaterial({ color: building.color });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(building.position[0], building.position[1], building.position[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.buildingId = building.id;
      scene.add(mesh);
      buildingMeshesRef.current.set(building.id, mesh);

      // Roof
      const roofGeometry = new THREE.ConeGeometry(0.9, 1, 4);
      const roofMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
      const roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.set(building.position[0], building.position[1] + 1.5, building.position[2]);
      roof.castShadow = true;
      roof.receiveShadow = true;
      scene.add(roof);

      // Door indicator
      const doorGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.1);
      const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      const door = new THREE.Mesh(doorGeometry, doorMaterial);
      door.position.set(building.position[0], building.position[1] + 0.4, building.position[2] + 0.75);
      door.castShadow = true;
      scene.add(door);
    });

    // Create player
    const playerGeometry = new THREE.BoxGeometry(0.5, 0.8, 0.5);
    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xFF69B4 });
    const playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
    playerMesh.position.copy(playerPosRef.current);
    playerMesh.castShadow = true;
    playerMesh.receiveShadow = true;
    scene.add(playerMesh);
    playerMeshRef.current = playerMesh;

    // Keyboard handlers
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current[key] = true;
      
      if (e.key === "Escape" || key === "m") {
        setShowMenu(prev => !prev);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current[key] = false;
    };

    // Mouse move for building detection
    const onMouseMove = (event: MouseEvent) => {
      if (!renderer.domElement) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(Array.from(buildingMeshesRef.current.values()));

      if (intersects.length > 0) {
        const buildingId = intersects[0].object.userData.buildingId;
        setHoveredBuilding(buildingId);
      } else {
        setHoveredBuilding(null);
      }
    };

    // Click to enter building
    const onClick = () => {
      if (isEntering || !nearbyBuilding) return;
      const building = BUILDINGS.find(b => b.id === nearbyBuilding);
      if (building) {
        setIsEntering(true);
        setEnteringBuildingId(nearbyBuilding);
        targetCameraPos.current = new THREE.Vector3(
          building.position[0],
          building.position[1] + 3,
          building.position[2] + 2
        );
        targetCameraLookAt.current = new THREE.Vector3(
          building.position[0],
          building.position[1] + 1,
          building.position[2]
        );
        cameraAnimationProgress.current = 0;
      }
    };

    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("click", onClick);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Player movement (WASD)
      const moveSpeed = 0.2;
      const keys = keysPressed.current;
      const moveDirection = new THREE.Vector3();

      // Check all possible key variations
      if (keys["w"] || keys["W"]) moveDirection.z -= moveSpeed;
      if (keys["s"] || keys["S"]) moveDirection.z += moveSpeed;
      if (keys["a"] || keys["A"]) moveDirection.x -= moveSpeed;
      if (keys["d"] || keys["D"]) moveDirection.x += moveSpeed;

      // Arrow keys
      if (keys["arrowup"]) moveDirection.z -= moveSpeed;
      if (keys["arrowdown"]) moveDirection.z += moveSpeed;
      if (keys["arrowleft"]) moveDirection.x -= moveSpeed;
      if (keys["arrowright"]) moveDirection.x += moveSpeed;

      // Update player position
      if (moveDirection.length() > 0) {
        playerPosRef.current.add(moveDirection);
        // Clamp to map bounds
        playerPosRef.current.x = Math.max(-18, Math.min(18, playerPosRef.current.x));
        playerPosRef.current.z = Math.max(-18, Math.min(18, playerPosRef.current.z));

        // Rotate player to face movement direction
        playerRotationRef.current = Math.atan2(moveDirection.x, moveDirection.z);
      }

      // Update player mesh
      if (playerMeshRef.current) {
        playerMeshRef.current.position.copy(playerPosRef.current);
        playerMeshRef.current.rotation.y = playerRotationRef.current;
        // Bounce animation
        playerMeshRef.current.position.y = playerPosRef.current.y + Math.sin(Date.now() * 0.005) * 0.05;
      }

      // Check proximity to buildings
      let closest: { id: string; distance: number } | null = null;
      BUILDINGS.forEach((b: Building) => {
        const dist = playerPosRef.current.distanceTo(new THREE.Vector3(b.position[0], b.position[1], b.position[2]));
        if (dist < PROXIMITY_DISTANCE) {
          if (!closest || dist < closest.distance) {
            closest = { id: b.id, distance: dist };
          }
        }
      });
      setNearbyBuilding((closest as { id: string; distance: number } | null)?.id || null);

      // Rotate buildings
      buildingMeshesRef.current.forEach((mesh) => {
        mesh.rotation.y += 0.003;
      });

      // Camera entering animation
      if (isEntering && targetCameraPos.current && targetCameraLookAt.current) {
        cameraAnimationProgress.current += 0.02;
        if (cameraAnimationProgress.current >= 1) {
          cameraAnimationProgress.current = 1;
          setTimeout(() => {
            setIsEntering(false);
            if (enteringBuildingId) {
              onBuildingClick(enteringBuildingId);
            }
          }, 300);
        }
        const progress = cameraAnimationProgress.current;
        const startPos = camera.position.clone();
        const startLookAt = new THREE.Vector3(0, 0, 0);
        
        camera.position.lerpVectors(startPos, targetCameraPos.current, progress);
        const currentLookAt = new THREE.Vector3().lerpVectors(startLookAt, targetCameraLookAt.current, progress);
        camera.lookAt(currentLookAt);
      } else {
        // Third-person camera following player
        const cameraDistance = 6;
        const cameraHeight = 3;
        const targetCameraX = playerPosRef.current.x - Math.sin(playerRotationRef.current) * cameraDistance;
        const targetCameraZ = playerPosRef.current.z - Math.cos(playerRotationRef.current) * cameraDistance;
        
        camera.position.x += (targetCameraX - camera.position.x) * 0.1;
        camera.position.z += (targetCameraZ - camera.position.z) * 0.1;
        camera.position.y = playerPosRef.current.y + cameraHeight;
        camera.lookAt(playerPosRef.current.x, playerPosRef.current.y + 0.3, playerPosRef.current.z);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      renderer.domElement.removeEventListener("mousemove", onMouseMove);
      renderer.domElement.removeEventListener("click", onClick);
      cancelAnimationFrame(animationId);
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [isEntering, onBuildingClick, enteringBuildingId, showMenu]);

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-b from-sky-300 to-sky-100">
      {/* 3D Canvas */}
      <div ref={containerRef} className="flex-1" />

      {/* HUD - Top Left: Player Info */}
      {!isEntering && (
        <div className="absolute top-4 left-4 pointer-events-auto">
          <Card className="p-4 bg-white/90 backdrop-blur">
            <div className="flex items-center gap-4">
              <BlockyAvatar config={playerAvatar} size={80} />
              <div>
                <h2 className="font-bold text-lg">Jogador</h2>
                <p className="text-sm text-gray-600">Pontos: 1,250</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* HUD - Top Right: Menu Button */}
      {!isEntering && (
        <div className="absolute top-4 right-4 pointer-events-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowMenu(!showMenu)}
            className="w-12 h-12"
          >
            {showMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      )}

      {/* Floating Menu */}
      {showMenu && !isEntering && (
        <div className="absolute top-20 right-4 pointer-events-auto z-50">
          <Card className="p-4 bg-white/95 backdrop-blur shadow-lg">
            <div className="flex flex-col gap-2 w-56 max-h-96 overflow-y-auto">
              <Button variant="outline" className="justify-start" onClick={() => { onOpenShop(); setShowMenu(false); }}>
                <Settings className="w-4 h-4 mr-2" /> Loja
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => { onOpenProgress(); setShowMenu(false); }}>
                <Trophy className="w-4 h-4 mr-2" /> Progresso
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => { onOpenStudy?.(); setShowMenu(false); }}>
                <BookOpen className="w-4 h-4 mr-2" /> Meu Material
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => { onOpenSchool?.(); setShowMenu(false); }}>
                <Palette className="w-4 h-4 mr-2" /> Prédio Personalizado
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => { onOpenTeacher?.(); setShowMenu(false); }}>
                <Users className="w-4 h-4 mr-2" /> Painel do Professor
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => { onOpenAchievements?.(); setShowMenu(false); }}>
                <Trophy className="w-4 h-4 mr-2" /> Conquistas
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => { onOpenDaily?.(); setShowMenu(false); }}>
                <Zap className="w-4 h-4 mr-2" /> Desafio Diário
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => { onOpenRanking?.(); setShowMenu(false); }}>
                <Trophy className="w-4 h-4 mr-2" /> Ranking
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => { onOpenDuel?.(); setShowMenu(false); }}>
                <Zap className="w-4 h-4 mr-2" /> Duelos
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => { onOpenStory?.(); setShowMenu(false); }}>
                <BookOpen className="w-4 h-4 mr-2" /> Modo História
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => { onOpenNotifications?.(); setShowMenu(false); }}>
                <Heart className="w-4 h-4 mr-2" /> Notificações
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => { onOpenAvatarAI?.(); setShowMenu(false); }}>
                <Palette className="w-4 h-4 mr-2" /> Avatar IA
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Building Info & Interaction */}
      {nearbyBuilding && !isEntering && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-none">
          <Card className="p-4 bg-white/95 backdrop-blur text-center">
            <p className="font-bold text-lg">
              {BUILDINGS.find((b) => b.id === nearbyBuilding)?.name}
            </p>
            <p className="text-sm text-gray-600 mb-2">Você está próximo!</p>
            <Button
              onClick={() => {
                const building = BUILDINGS.find(b => b.id === nearbyBuilding);
                if (building) {
                  setIsEntering(true);
                  setEnteringBuildingId(nearbyBuilding);
                  targetCameraPos.current = new THREE.Vector3(
                    building.position[0],
                    building.position[1] + 3,
                    building.position[2] + 2
                  );
                  targetCameraLookAt.current = new THREE.Vector3(
                    building.position[0],
                    building.position[1] + 1,
                    building.position[2]
                  );
                  cameraAnimationProgress.current = 0;
                }
              }}
              className="pointer-events-auto"
            >
              Entrar
            </Button>
          </Card>
        </div>
      )}

      {/* Controls Help */}
      {!isEntering && (
        <div className="absolute bottom-4 left-4 pointer-events-none">
          <Card className="p-3 bg-white/90 backdrop-blur text-xs">
            <p className="font-semibold mb-1">Controles:</p>
            <p>WASD ou Setas: Mover</p>
            <p>ESC ou M: Menu</p>
          </Card>
        </div>
      )}

      {/* Entering Animation */}
      {isEntering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-white text-center">
            <div className="animate-spin mb-4">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full" />
            </div>
            <p className="text-lg font-bold">Entrando no prédio...</p>
          </div>
        </div>
      )}
    </div>
  );
}
