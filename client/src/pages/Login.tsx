import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";

export default function Login() {
  const [loginUrl, setLoginUrl] = useState<string>("");

  useEffect(() => {
    const url = getLoginUrl();
    setLoginUrl(url);
  }, []);

  const handleLogin = () => {
    if (loginUrl) {
      window.location.href = loginUrl;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
      >
        {/* Logo/Title */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-center mb-8"
        >
          <div className="text-6xl mb-4">🎓</div>
          <h1 className="text-3xl font-bold text-gray-800">EduGame</h1>
          <p className="text-gray-600 mt-2">Aprenda jogando!</p>
        </motion.div>

        {/* Description */}
        <div className="mb-8 text-center">
          <p className="text-gray-700 mb-4">
            Bem-vindo ao EduGame! Faça login para começar sua jornada educacional.
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <p>✨ Aprenda com aulas interativas</p>
            <p>🏆 Ganhe pontos e troféus</p>
            <p>🎮 Desafie seus amigos</p>
          </div>
        </div>

        {/* Login Button */}
        <Button
          onClick={handleLogin}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
        >
          🔐 Entrar com Manus
        </Button>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Ao fazer login, você concorda com nossos Termos de Serviço
        </p>
      </motion.div>
    </div>
  );
}
