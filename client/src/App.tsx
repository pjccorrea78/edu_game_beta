import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { GameProvider, useGame } from "./contexts/GameContext";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Welcome from "./pages/Welcome";
import GameMap from "./pages/GameMap";
import GameMap3D from "./pages/GameMap3D";
import QuizScreen from "./pages/QuizScreen";
import AvatarShop from "./pages/AvatarShop";
import ProgressPanel from "./pages/ProgressPanel";
import StudyMaterial from "./pages/StudyMaterial";
import SchoolBuilding from "./pages/SchoolBuilding";
import TeacherPanel from "./pages/TeacherPanel";
import Achievements from "./pages/Achievements";
import DailyChallenge from "./pages/DailyChallenge";
import GlobalRanking from "./pages/GlobalRanking";
import DuelChallenge from "./pages/DuelChallenge";
import StoryMode from "./pages/StoryMode";
import PushNotifications from "./pages/PushNotifications";
import AvatarAI from "./pages/AvatarAI";

type Screen =
  | "welcome"
  | "map"
  | "quiz"
  | "shop"
  | "progress"
  | "study"
  | "custom-quiz"
  | "school"
  | "teacher"
  | "achievements"
  | "daily"
  | "ranking"
  | "duel"
  | "story"
  | "notifications"
  | "avatar-ai";

type Discipline = "matematica" | "portugues" | "geografia" | "historia" | "ciencias" | "educacao_fisica" | "arte" | "ensino_religioso";

function GameRouter() {
  const { player, isLoading } = useGame();
  const [screen, setScreen] = useState<Screen>("welcome");
  const [activeDiscipline, setActiveDiscipline] = useState<Discipline | null>(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [customQuizMaterial, setCustomQuizMaterial] = useState<{ id: number; title: string } | null>(null);

  useEffect(() => {
    if (!isLoading && player) {
      const onboarded = localStorage.getItem("edugame_onboarded");
      if (onboarded === "true" && player.nickname && player.nickname !== "Jogador") {
        setHasOnboarded(true);
        setScreen("map");
      } else if (player.nickname && player.nickname !== "Jogador") {
        setHasOnboarded(true);
        setScreen("map");
      }
    }
  }, [player, isLoading]);

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f64f59 100%)" }}
      >
        <motion.div
          className="text-center"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <div className="text-6xl mb-4">🎓</div>
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-white rounded-full"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  const handleWelcomeComplete = () => {
    localStorage.setItem("edugame_onboarded", "true");
    setHasOnboarded(true);
    setScreen("map");
  };

  const handleEnterBuilding = (discipline: Discipline) => {
    setActiveDiscipline(discipline);
    setScreen("quiz");
  };

  const handleQuizFinish = () => {
    setActiveDiscipline(null);
    setScreen("map");
  };

  const handleStartQuizFromProgress = (discipline: Discipline) => {
    setActiveDiscipline(discipline);
    setScreen("quiz");
  };

  const handleStartCustomQuiz = (materialId: number, title: string) => {
    setCustomQuizMaterial({ id: materialId, title });
    setScreen("custom-quiz");
  };

  // When entering a room from SchoolBuilding, go directly to custom quiz
  const handleEnterRoom = (materialId: number, title: string) => {
    setCustomQuizMaterial({ id: materialId, title });
    setScreen("custom-quiz");
  };

  return (
    <div className="min-h-screen no-select">
      <AnimatePresence mode="wait">
        {screen === "welcome" && !hasOnboarded && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen"
          >
            <Welcome onComplete={handleWelcomeComplete} />
          </motion.div>
        )}

        {screen === "map" && (
          <motion.div
            key="map"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen"
            style={{ height: "100svh" }}
          >
            <GameMap3D
              playerAvatar={player?.avatarConfig || {}}
              onBuildingClick={(buildingId) => {
                const disciplineMap: Record<string, Discipline> = {
                  math: "matematica",
                  portuguese: "portugues",
                  geography: "geografia",
                  history: "historia",
                  science: "ciencias",
                  pe: "educacao_fisica",
                  art: "arte",
                  religion: "ensino_religioso",
                };
                const discipline = disciplineMap[buildingId];
                if (discipline) handleEnterBuilding(discipline)
              }}
              onOpenShop={() => setScreen("shop")}
              onOpenProgress={() => setScreen("progress")}
            />
          </motion.div>
        )}

        {screen === "quiz" && activeDiscipline && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen"
          >
            <QuizScreen
              discipline={activeDiscipline}
              onBack={() => setScreen("map")}
              onFinish={handleQuizFinish}
            />
          </motion.div>
        )}

        {screen === "shop" && (
          <motion.div
            key="shop"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            className="min-h-screen"
          >
            <AvatarShop onBack={() => setScreen("map")} />
          </motion.div>
        )}

        {screen === "progress" && (
          <motion.div
            key="progress"
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            className="min-h-screen"
          >
            <ProgressPanel
              onBack={() => setScreen("map")}
              onStartQuiz={handleStartQuizFromProgress}
            />
          </motion.div>
        )}

        {screen === "study" && (
          <motion.div
            key="study"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            className="min-h-screen"
          >
            <StudyMaterial
              onBack={() => setScreen("school")}
              onStartCustomQuiz={handleStartCustomQuiz}
            />
          </motion.div>
        )}

        {screen === "school" && (
          <motion.div
            key="school"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="min-h-screen"
          >
            <SchoolBuilding
              onBack={() => setScreen("map")}
              onEnterRoom={handleEnterRoom}
              onAddMaterial={() => setScreen("study")}
            />
          </motion.div>
        )}

        {screen === "custom-quiz" && customQuizMaterial && (
          <motion.div
            key="custom-quiz"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen"
          >
            <QuizScreen
              discipline={null}
              customMaterialId={customQuizMaterial.id}
              customTitle={customQuizMaterial.title}
              onBack={() => setScreen("school")}
              onFinish={() => {
                setCustomQuizMaterial(null);
                setScreen("school");
              }}
            />
          </motion.div>
        )}

        {screen === "teacher" && (
          <motion.div
            key="teacher"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            className="min-h-screen"
          >
            <TeacherPanel onBack={() => setScreen("map")} />
          </motion.div>
        )}

        {screen === "achievements" && (
          <motion.div
            key="achievements"
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            className="min-h-screen"
          >
            <Achievements onBack={() => setScreen("map")} />
          </motion.div>
        )}

        {screen === "daily" && (
          <motion.div
            key="daily"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen"
          >
            <DailyChallenge onBack={() => setScreen("map")} />
          </motion.div>
        )}

        {screen === "ranking" && (
          <motion.div
            key="ranking"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="min-h-screen"
          >
            <GlobalRanking onBack={() => setScreen("map")} />
          </motion.div>
        )}

        {screen === "duel" && (
          <motion.div
            key="duel"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            className="min-h-screen"
          >
            <DuelChallenge onBack={() => setScreen("map")} />
          </motion.div>
        )}

        {screen === "story" && (
          <motion.div
            key="story"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen"
          >
            <StoryMode
              onBack={() => setScreen("map")}
              onStartQuiz={(discipline) => {
                setActiveDiscipline(discipline as Discipline);
                setScreen("quiz");
              }}
            />
          </motion.div>
        )}

        {screen === "notifications" && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            className="min-h-screen"
          >
            <PushNotifications onBack={() => setScreen("map")} />
          </motion.div>
        )}

        {screen === "avatar-ai" && (
          <motion.div
            key="avatar-ai"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="min-h-screen"
          >
            <AvatarAI onBack={() => setScreen("shop")} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-center" richColors />
          <GameProvider>
            <Switch>
              <Route path="/" component={GameRouter} />
              <Route component={GameRouter} />
            </Switch>
          </GameProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
