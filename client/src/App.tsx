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
import QuizScreen from "./pages/QuizScreen";
import AvatarShop from "./pages/AvatarShop";
import ProgressPanel from "./pages/ProgressPanel";

type Screen = "welcome" | "map" | "quiz" | "shop" | "progress";
type Discipline = "matematica" | "portugues" | "geografia" | "historia" | "ciencias";

function GameRouter() {
  const { player, isLoading } = useGame();
  const [screen, setScreen] = useState<Screen>("welcome");
  const [activeDiscipline, setActiveDiscipline] = useState<Discipline | null>(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  // Check if player has already set a nickname (returning player)
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
            <GameMap
              onEnterBuilding={handleEnterBuilding}
              onOpenShop={() => setScreen("shop")}
              onOpenProgress={() => setScreen("progress")}
              onOpenAvatar={() => setScreen("shop")}
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
