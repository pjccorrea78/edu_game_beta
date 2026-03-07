import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useGame } from "@/contexts/GameContext";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface PushNotificationsProps {
  onBack: () => void;
}

export default function PushNotifications({ onBack }: PushNotificationsProps) {
  const { sessionId } = useGame();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [parentEmail, setParentEmail] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportResult, setReportResult] = useState<{ reportText: string; accuracy: number } | null>(null);
  const [activeTab, setActiveTab] = useState<"push" | "report">("push");

  const { data: pushStatus, refetch: refetchPushStatus } = trpc.push.getStatus.useQuery(
    { sessionId },
    { enabled: !!sessionId }
  );

  const { data: lastReport } = trpc.parentReport.getLastReport.useQuery(
    { sessionId },
    { enabled: !!sessionId }
  );

  const subscribeMutation = trpc.push.subscribe.useMutation({
    onSuccess: () => {
      setIsSubscribed(true);
      toast.success("🔔 Notificações ativadas! Você receberá lembretes do desafio diário.");
      refetchPushStatus();
    },
    onError: () => toast.error("Erro ao ativar notificações."),
  });

  const unsubscribeMutation = trpc.push.unsubscribe.useMutation({
    onSuccess: () => {
      setIsSubscribed(false);
      toast.success("🔕 Notificações desativadas.");
      refetchPushStatus();
    },
  });

  const testNotificationMutation = trpc.push.sendTestNotification.useMutation({
    onSuccess: () => toast.success("📬 Notificação de teste enviada!"),
    onError: () => toast.error("Erro ao enviar notificação de teste."),
  });

  const generateReportMutation = trpc.parentReport.generateAndSend.useMutation({
    onSuccess: (data) => {
      setReportResult({ reportText: data.reportText, accuracy: data.accuracy });
      toast.success("📊 Relatório gerado e enviado com sucesso!");
      setReportLoading(false);
    },
    onError: () => {
      toast.error("Erro ao gerar relatório.");
      setReportLoading(false);
    },
  });

  useEffect(() => {
    setIsSupported("serviceWorker" in navigator && "PushManager" in window);
  }, []);

  useEffect(() => {
    if (pushStatus) setIsSubscribed(pushStatus.subscribed);
  }, [pushStatus]);

  const handleSubscribe = async () => {
    if (!isSupported) {
      toast.error("Seu navegador não suporta notificações push.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Permissão de notificação negada.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        toast.error("Chave VAPID não configurada.");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      const json = sub.toJSON();
      await subscribeMutation.mutateAsync({
        sessionId,
        endpoint: sub.endpoint,
        p256dh: (json.keys?.p256dh as string) || "",
        auth: (json.keys?.auth as string) || "",
      });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao ativar notificações push.");
    }
  };

  const handleUnsubscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      await unsubscribeMutation.mutateAsync({ sessionId });
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateReport = () => {
    if (!parentEmail || !parentEmail.includes("@")) {
      toast.error("Digite um e-mail válido.");
      return;
    }
    setReportLoading(true);
    generateReportMutation.mutate({ sessionId, parentEmail });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-indigo-900 to-purple-900 text-white">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-4"
        >
          <span className="text-xl">←</span>
          <span className="font-fredoka">Voltar</span>
        </button>
        <div className="text-center">
          <div className="text-5xl mb-2">🔔</div>
          <h1 className="text-3xl font-fredoka font-bold text-yellow-300">Notificações & Relatórios</h1>
          <p className="text-white/60 text-sm mt-1">Configure alertas e relatórios para os pais</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex bg-white/10 rounded-2xl p-1">
          <button
            onClick={() => setActiveTab("push")}
            className={`flex-1 py-2 rounded-xl font-fredoka text-sm transition-all ${
              activeTab === "push" ? "bg-blue-500 text-white shadow" : "text-white/60"
            }`}
          >
            🔔 Push
          </button>
          <button
            onClick={() => setActiveTab("report")}
            className={`flex-1 py-2 rounded-xl font-fredoka text-sm transition-all ${
              activeTab === "report" ? "bg-purple-500 text-white shadow" : "text-white/60"
            }`}
          >
            📊 Relatório
          </button>
        </div>
      </div>

      <div className="px-4 pb-8">
        {activeTab === "push" ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Support Status */}
            <div className={`rounded-2xl p-4 ${isSupported ? "bg-green-500/20 border border-green-400/30" : "bg-red-500/20 border border-red-400/30"}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{isSupported ? "✅" : "❌"}</span>
                <div>
                  <p className="font-fredoka font-bold text-white text-sm">
                    {isSupported ? "Notificações suportadas" : "Não suportado"}
                  </p>
                  <p className="text-white/60 text-xs">
                    {isSupported
                      ? "Seu navegador suporta notificações push"
                      : "Use Chrome ou Firefox para ativar notificações"}
                  </p>
                </div>
              </div>
            </div>

            {/* Subscription Status */}
            <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-fredoka font-bold text-white">Lembrete Diário</h3>
                  <p className="text-white/60 text-xs mt-0.5">Receba alertas do desafio diário</p>
                </div>
                <div className={`w-12 h-6 rounded-full transition-all cursor-pointer ${isSubscribed ? "bg-green-400" : "bg-white/20"}`}
                  onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
                >
                  <div className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-all ${isSubscribed ? "ml-6.5" : "ml-0.5"}`} />
                </div>
              </div>

              <div className="space-y-2 text-sm text-white/60">
                <div className="flex items-center gap-2">
                  <span>🌟</span>
                  <span>Lembrete do desafio diário</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🏆</span>
                  <span>Alertas de conquistas desbloqueadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📚</span>
                  <span>Novos materiais de estudo disponíveis</span>
                </div>
              </div>
            </div>

            {/* Test Notification */}
            {isSubscribed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white/10 rounded-2xl p-4 border border-white/10"
              >
                <h3 className="font-fredoka font-bold text-white mb-2">Testar Notificação</h3>
                <p className="text-white/60 text-xs mb-3">Envie uma notificação de teste para verificar se está funcionando</p>
                <button
                  onClick={() => testNotificationMutation.mutate({ sessionId })}
                  disabled={testNotificationMutation.isPending}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-fredoka py-2.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  {testNotificationMutation.isPending ? "Enviando..." : "📬 Enviar Teste"}
                </button>
              </motion.div>
            )}

            {/* How it works */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <h3 className="font-fredoka text-white/80 text-sm font-bold mb-2">Como funciona?</h3>
              <p className="text-white/50 text-xs leading-relaxed">
                As notificações push aparecem no seu celular mesmo quando o app está fechado. 
                Você receberá um lembrete toda manhã para completar o desafio diário e ganhar pontos bônus!
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Last Report */}
            {lastReport && (
              <div className="bg-green-500/20 border border-green-400/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span>✅</span>
                  <span className="font-fredoka font-bold text-white text-sm">Último relatório enviado</span>
                </div>
                <p className="text-white/60 text-xs">
                  Para: {lastReport.parentEmail} • Semana de {lastReport.weekStart}
                </p>
                <p className="text-white/60 text-xs mt-1">
                  {lastReport.quizzesCompleted} quizzes • {lastReport.totalAnswers > 0 ? Math.round((lastReport.correctAnswers / lastReport.totalAnswers) * 100) : 0}% de acerto
                </p>
              </div>
            )}

            {/* Generate Report */}
            <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
              <h3 className="font-fredoka font-bold text-white mb-1">Relatório Semanal para Pais</h3>
              <p className="text-white/60 text-xs mb-4">
                A IA gera um relatório personalizado com o desempenho da semana e envia para o e-mail dos responsáveis
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-white/70 text-xs font-fredoka block mb-1">E-mail dos pais/responsáveis</label>
                  <input
                    type="email"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    placeholder="pais@email.com"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>

                <button
                  onClick={handleGenerateReport}
                  disabled={reportLoading || !parentEmail}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-fredoka font-bold py-3 rounded-xl disabled:opacity-50 transition-all active:scale-95"
                >
                  {reportLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span> Gerando relatório...
                    </span>
                  ) : "📊 Gerar e Enviar Relatório"}
                </button>
              </div>
            </div>

            {/* Report Result */}
            {reportResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 rounded-2xl p-4 border border-purple-400/30"
              >
                <h3 className="font-fredoka font-bold text-white mb-2">📄 Relatório Gerado</h3>
                <div className="bg-white/5 rounded-xl p-3 mb-3">
                  <p className="text-white/80 text-xs leading-relaxed">{reportResult.reportText}</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-yellow-300 font-fredoka">Taxa de acerto: {reportResult.accuracy}%</span>
                </div>
              </motion.div>
            )}

            {/* Info */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <h3 className="font-fredoka text-white/80 text-sm font-bold mb-2">O que inclui o relatório?</h3>
              <div className="space-y-1.5 text-white/50 text-xs">
                <div className="flex items-center gap-2"><span>📚</span><span>Quizzes completados na semana</span></div>
                <div className="flex items-center gap-2"><span>✅</span><span>Taxa de acerto por disciplina</span></div>
                <div className="flex items-center gap-2"><span>🏆</span><span>Conquistas desbloqueadas</span></div>
                <div className="flex items-center gap-2"><span>💡</span><span>Sugestões personalizadas de melhoria</span></div>
                <div className="flex items-center gap-2"><span>🌟</span><span>Mensagem motivacional da IA</span></div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
