import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import BlockyAvatar from "@/components/BlockyAvatar";
import { Home, Settings, Trophy, Users, BookOpen, Zap, Palette, Heart } from "lucide-react";

type Building = {
  id: string;
  name: string;
  discipline: string;
  position: [number, number, number];
  color: THREE.Color;
  icon: React.ReactNode;
};

const BUILDINGS: Building[] = [
  { id: "math", name: "Matemática", discipline: "matematica", position: [-3, 0, 0], color: new THREE.Color(0x4169E1), icon: <Zap /> },
  { id: "portuguese", name: "Português", discipline: "portugues", position: [3, 0, 0], color: new THREE.Color(0xFF6B6B), icon: <BookOpen /> },
  { id: "geography", name: "Geografia", discipline: "geografia", position: [-1.5, 0, -3], color: new THREE.Color(0x51CF66), icon: <Home /> },
  { id: "history", name: "História", discipline: "historia", position: [1.5, 0, -3], color: new THREE.Color(0xFFD93D), icon: <Trophy /> },
  { id: "science", name: "Ciências", discipline: "ciencias", position: [-1.5, 0, 3], color: new THREE.Color(0x6C5CE7), icon: <Palette /> },
  { id: "pe", name: "Educação Física", discipline: "educacao_fisica", position: [1.5, 0, 3], color: new THREE.Color(0xFF8C42), icon: <Heart /> },
  { id: "art", name: "Arte", discipline: "arte", position: [-3, 0, -1.5], color: new THREE.Color(0xFF1493), icon: <Palette /> },
  { id: "religion", name: "Ensino Religioso", discipline: "ensino_religioso", position: [3, 0, -1.5], color: new THREE.Color(0x87CEEB), icon: <Users /> },
];

interface GameMap3DProps {
  playerAvatar: any;
  onBuildingClick: (buildingId: string) => void;
  onOpenShop: () => void;
  onOpenProgress: () => void;
}

export default function GameMap3D({ playerAvatar, onBuildingClick, onOpenShop, onOpenProgress }: GameMap3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const buildingMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const playerMeshRef = useRef<THREE.Mesh | null>(null);
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 20, 50);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 8, 10);
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
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(30, 30);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Create buildings
    BUILDINGS.forEach((building) => {
      const geometry = new THREE.BoxGeometry(1.2, 2, 1.2);
      const material = new THREE.MeshPhongMaterial({ color: building.color });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...building.position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { buildingId: building.id };

      // Roof
      const roofGeometry = new THREE.ConeGeometry(0.8, 0.8, 4);
      const roofMaterial = new THREE.MeshPhongMaterial({ color: new THREE.Color(building.color).multiplyScalar(0.7) });
      const roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.y = 1.2;
      roof.castShadow = true;
      mesh.add(roof);

      scene.add(mesh);
      buildingMeshesRef.current.set(building.id, mesh);
    });

    // Create player
    const playerGeometry = new THREE.BoxGeometry(0.4, 0.8, 0.4);
    const playerMaterial = new THREE.MeshPhongMaterial({ color: 0xFFD700 });
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(0, 0.4, 0);
    player.castShadow = true;
    scene.add(player);
    playerMeshRef.current = player;

    // Mouse events
    const onMouseMove = (event: MouseEvent) => {
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

    const onClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(Array.from(buildingMeshesRef.current.values()));

      if (intersects.length > 0) {
        const buildingId = intersects[0].object.userData.buildingId;
        onBuildingClick(buildingId);
      }
    };

    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("click", onClick);

    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Rotate buildings
      buildingMeshesRef.current.forEach((mesh, buildingId) => {
        mesh.rotation.y += 0.005;

        // Highlight hovered building
        if (buildingId === hoveredBuilding) {
          mesh.scale.lerp(new THREE.Vector3(1.1, 1.1, 1.1), 0.1);
        } else {
          mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
        }
      });

      // Bounce player
      if (playerMeshRef.current) {
        playerMeshRef.current.position.y = 0.4 + Math.sin(Date.now() * 0.003) * 0.1;
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
      renderer.domElement.removeEventListener("mousemove", onMouseMove);
      renderer.domElement.removeEventListener("click", onClick);
      cancelAnimationFrame(animationId);
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [hoveredBuilding, onBuildingClick]);

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-b from-sky-300 to-sky-100">
      {/* 3D Canvas */}
      <div ref={containerRef} className="flex-1" />

      {/* HUD */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
        {/* Player Info */}
        <Card className="p-4 pointer-events-auto bg-white/90 backdrop-blur">
          <div className="flex items-center gap-4">
            <BlockyAvatar config={playerAvatar} size={80} />
            <div>
              <h2 className="font-bold text-lg">Jogador</h2>
              <p className="text-sm text-gray-600">Pontos: 1,250</p>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-2 pointer-events-auto">
          <Button variant="outline" size="icon" onClick={onOpenShop}>
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={onOpenProgress}>
            <Trophy className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Building Info */}
      {hoveredBuilding && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-none">
          <Card className="p-3 bg-white/95 backdrop-blur text-center">
            <p className="font-semibold">
              {BUILDINGS.find((b) => b.id === hoveredBuilding)?.name}
            </p>
            <p className="text-xs text-gray-600">Clique para entrar</p>
          </Card>
        </div>
      )}
    </div>
  );
}
