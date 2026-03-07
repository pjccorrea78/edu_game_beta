import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useGame } from "@/contexts/GameContext";
import {
  ArrowLeft, BookOpen, Upload, Sparkles, CheckCircle,
  AlertCircle, RefreshCw, Play, FileText, Clock,
  ChevronRight, Trash2, Eye, Zap
} from "lucide-react";
import { toast } from "sonner";

type Props = {
  onBack: () => void;
  onStartCustomQuiz: (materialId: number, title: string) => void;
};

type ViewState = "list" | "new" | "analyzing" | "preview";

const DISCIPLINE_SUGGESTIONS = [
  { value: "matematica", label: "Matemática", emoji: "🔢" },
  { value: "portugues", label: "Português", emoji: "📖" },
  { value: "geografia", label: "Geografia", emoji: "🌍" },
  { value: "historia", label: "História", emoji: "🏛️" },
  { value: "ciencias", label: "Ciências", emoji: "🔬" },
  { value: "outro", label: "Outro", emoji: "📚" },
];

const STATUS_CONFIG = {
  pending:   { label: "Aguardando",  color: "#9E9E9E", icon: <Clock className="w-4 h-4" />, bg: "#9E9E9E22" },
  analyzing: { label: "Analisando…", color: "#FF9800", icon: <RefreshCw className="w-4 h-4 animate-spin" />, bg: "#FF980022" },
  ready:     { label: "Pronto!",     color: "#4CAF50", icon: <CheckCircle className="w-4 h-4" />, bg: "#4CAF5022" },
  error:     { label: "Erro",        color: "#F44336", icon: <AlertCircle className="w-4 h-4" />, bg: "#F4433622" },
};

export default function StudyMaterial({ onBack, onStartCustomQuiz }: Props) {
  const { sessionId, player } = useGame();
  const [view, setView] = useState<ViewState>("list");
  const [title, setTitle] = useState("");
  const [contentText, setContentText] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewMaterialId, setPreviewMaterialId] = useState<number | null>(null);
  const [charCount, setCharCount] = useState(0);

  const listQuery = trpc.studyMaterial.list.useQuery({ sessionId });
  const submitMaterial = trpc.studyMaterial.submit.useMutation();
  const reanalyzeMutation = trpc.studyMaterial.reanalyze.useMutation();
  const previewQuery = trpc.studyMaterial.getQuestions.useQuery(
    { sessionId, materialId: previewMaterialId! },
    { enabled: previewMaterialId !== null }
  );

  const handleSubmit = async () => {
    if (!title.trim() || contentText.trim().length < 10) {
      toast.error("Preencha o título e o conteúdo (mínimo 10 caracteres)");
      return;
    }
    setIsSubmitting(true);
    setView("analyzing");
    try {
      const result = await submitMaterial.mutateAsync({
        sessionId,
        title: title.trim(),
        contentText: contentText.trim(),
        discipline: discipline || undefined,
      });
      toast.success(`${result.questionsGenerated} perguntas geradas com sucesso! 🎉`);
      setView("list");
      listQuery.refetch();
      setTitle("");
      setContentText("");
      setDiscipline("");
      setCharCount(0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao analisar material");
      setView("new");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReanalyze = async (materialId: number) => {
    try {
      await reanalyzeMutation.mutateAsync({ sessionId, materialId });
      toast.success("Material reanalisado com sucesso!");
      listQuery.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao reanalisar");
    }
  };

  const handlePreview = (materialId: number) => {
    setPreviewMaterialId(materialId);
    setView("preview");
  };

  const materials = listQuery.data?.materials ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-indigo-50 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center gap-3 bg-white shadow-sm sticky top-0 z-10">
        <motion.button
          className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (view !== "list") { setView("list"); }
            else { onBack(); }
          }}
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </motion.button>
        <div className="flex-1">
          <h1 className="font-black text-gray-800 text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-violet-500" />
            Meu Material de Estudo
          </h1>
          <p className="text-xs text-gray-500">Envie seu conteúdo e gere um quiz personalizado</p>
        </div>
        {view === "list" && (
          <motion.button
            className="px-3 py-2 rounded-xl font-bold text-sm text-white flex items-center gap-1.5"
            style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setView("new")}
          >
            <Upload className="w-4 h-4" />
            Novo
          </motion.button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8 pt-4">
        <AnimatePresence mode="wait">

          {/* ─── LIST VIEW ─── */}
          {view === "list" && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* How it works banner */}
              <div className="bg-gradient-to-r from-violet-500 to-indigo-500 rounded-3xl p-5 mb-5 text-white shadow-xl">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">🤖</div>
                  <div>
                    <h2 className="font-black text-lg mb-1">Como funciona?</h2>
                    <p className="text-white/80 text-sm leading-relaxed">
                      Cole o texto do seu material de estudo (apostila, resumo, livro) e nossa IA irá analisar o conteúdo e criar <strong>10 perguntas personalizadas</strong> para você treinar!
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {[
                    { step: "1", text: "Cole o texto", emoji: "📋" },
                    { step: "2", text: "IA analisa", emoji: "🧠" },
                    { step: "3", text: "Faça o quiz!", emoji: "🎯" },
                  ].map((s) => (
                    <div key={s.step} className="bg-white/20 rounded-xl p-2 text-center">
                      <div className="text-xl">{s.emoji}</div>
                      <p className="text-xs font-bold mt-0.5">{s.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Materials list */}
              {listQuery.isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-white rounded-2xl shadow h-24 animate-pulse" />
                  ))}
                </div>
              ) : materials.length === 0 ? (
                <div className="bg-white rounded-3xl shadow p-8 text-center">
                  <div className="text-5xl mb-3">📚</div>
                  <p className="font-black text-gray-700 text-lg">Nenhum material ainda</p>
                  <p className="text-gray-400 text-sm mt-1 mb-4">
                    Envie seu primeiro material de estudo para começar!
                  </p>
                  <motion.button
                    className="px-6 py-3 rounded-2xl font-bold text-white shadow-lg"
                    style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)" }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setView("new")}
                  >
                    <Upload className="w-4 h-4 inline mr-2" />
                    Enviar Material
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="font-black text-gray-700 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-violet-500" />
                    Seus Materiais ({materials.length})
                  </h3>
                  {materials.map((mat, i) => {
                    const statusInfo = STATUS_CONFIG[mat.status as keyof typeof STATUS_CONFIG];
                    return (
                      <motion.div
                        key={mat.id}
                        className="bg-white rounded-2xl shadow-md p-4 border border-gray-100"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.07 }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className="text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                                style={{ background: statusInfo.bg, color: statusInfo.color }}
                              >
                                {statusInfo.icon}
                                {statusInfo.label}
                              </span>
                              {mat.discipline && (
                                <span className="text-xs bg-violet-50 text-violet-600 font-semibold px-2 py-0.5 rounded-full">
                                  {DISCIPLINE_SUGGESTIONS.find(d => d.value === mat.discipline)?.emoji ?? "📚"}{" "}
                                  {DISCIPLINE_SUGGESTIONS.find(d => d.value === mat.discipline)?.label ?? mat.discipline}
                                </span>
                              )}
                            </div>
                            <p className="font-black text-gray-800 truncate">{mat.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {mat.questionsGenerated > 0 && `${mat.questionsGenerated} perguntas geradas · `}
                              {new Date(mat.createdAt).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-3">
                          {mat.status === "ready" && (
                            <>
                              <motion.button
                                className="flex-1 py-2 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-1.5 shadow"
                                style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)" }}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => onStartCustomQuiz(mat.id, mat.title)}
                              >
                                <Play className="w-3.5 h-3.5" />
                                Iniciar Quiz
                              </motion.button>
                              <motion.button
                                className="py-2 px-3 rounded-xl font-bold text-sm bg-gray-100 text-gray-600 flex items-center gap-1"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => handlePreview(mat.id)}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Ver
                              </motion.button>
                            </>
                          )}
                          {mat.status === "error" && (
                            <motion.button
                              className="flex-1 py-2 rounded-xl font-bold text-sm bg-orange-50 text-orange-600 flex items-center justify-center gap-1.5"
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => handleReanalyze(mat.id)}
                              disabled={reanalyzeMutation.isPending}
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              Tentar Novamente
                            </motion.button>
                          )}
                          {mat.status === "analyzing" && (
                            <div className="flex-1 py-2 rounded-xl bg-orange-50 text-orange-600 font-bold text-sm flex items-center justify-center gap-1.5">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Analisando...
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ─── NEW MATERIAL FORM ─── */}
          {view === "new" && (
            <motion.div
              key="new"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
            >
              <div className="bg-white rounded-3xl shadow-lg p-5 mb-4">
                <h2 className="font-black text-gray-800 text-lg mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-500" />
                  Novo Material de Estudo
                </h2>

                {/* Title */}
                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    📌 Título do Material
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Capítulo 3 - Sistema Solar"
                    maxLength={100}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-violet-400 outline-none text-sm font-semibold text-gray-800 transition-colors"
                  />
                </div>

                {/* Discipline selector */}
                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    🏫 Disciplina (opcional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DISCIPLINE_SUGGESTIONS.map((d) => (
                      <motion.button
                        key={d.value}
                        className={`px-3 py-1.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                          discipline === d.value
                            ? "border-violet-400 bg-violet-50 text-violet-700"
                            : "border-gray-200 bg-gray-50 text-gray-600"
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setDiscipline(discipline === d.value ? "" : d.value)}
                      >
                        {d.emoji} {d.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Content text area */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-bold text-gray-700">
                      📝 Conteúdo do Material
                    </label>
                    <span className={`text-xs font-semibold ${charCount > 45000 ? "text-red-500" : "text-gray-400"}`}>
                      {charCount.toLocaleString()} / 50.000
                    </span>
                  </div>
                  <textarea
                    value={contentText}
                    onChange={(e) => {
                      setContentText(e.target.value);
                      setCharCount(e.target.value.length);
                    }}
                    placeholder="Cole aqui o texto do seu material de estudo...

Pode ser:
• Texto de apostila ou livro
• Resumo de aula
• Anotações do caderno
• Qualquer conteúdo que você quer estudar

A IA vai analisar e criar perguntas personalizadas!"
                    maxLength={50000}
                    rows={10}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-violet-400 outline-none text-sm text-gray-800 transition-colors resize-none leading-relaxed"
                  />
                  {contentText.length > 0 && contentText.length < 10 && (
                    <p className="text-xs text-red-500 mt-1">Mínimo de 10 caracteres</p>
                  )}
                </div>

                {/* Tips */}
                <div className="bg-violet-50 rounded-2xl p-3 mb-5">
                  <p className="text-xs font-bold text-violet-700 mb-1">💡 Dicas para melhores resultados:</p>
                  <ul className="text-xs text-violet-600 space-y-0.5">
                    <li>• Quanto mais texto, mais perguntas variadas serão geradas</li>
                    <li>• Textos entre 200-5000 palavras funcionam melhor</li>
                    <li>• Pode colar texto de PDF, livro ou apostila</li>
                  </ul>
                </div>

                {/* Submit button */}
                <motion.button
                  className={`w-full py-4 rounded-2xl font-black text-white text-lg flex items-center justify-center gap-3 shadow-xl ${
                    title.trim() && contentText.trim().length >= 10
                      ? "opacity-100"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                  style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)" }}
                  whileHover={title.trim() && contentText.trim().length >= 10 ? { scale: 1.02 } : {}}
                  whileTap={title.trim() && contentText.trim().length >= 10 ? { scale: 0.98 } : {}}
                  onClick={handleSubmit}
                  disabled={!title.trim() || contentText.trim().length < 10 || isSubmitting}
                >
                  <Sparkles className="w-5 h-5" />
                  Analisar com IA e Gerar Quiz
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ─── ANALYZING VIEW ─── */}
          {view === "analyzing" && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center min-h-[60vh] text-center"
            >
              <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full">
                {/* Animated brain */}
                <motion.div
                  className="text-7xl mb-4"
                  animate={{
                    scale: [1, 1.15, 1],
                    rotate: [0, -5, 5, 0],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  🧠
                </motion.div>

                <h2 className="text-2xl font-black text-gray-800 mb-2">Analisando Material</h2>
                <p className="text-gray-500 text-sm mb-6">
                  Nossa IA está lendo seu conteúdo e criando perguntas personalizadas...
                </p>

                {/* Progress dots */}
                <div className="flex justify-center gap-3 mb-6">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="w-3 h-3 rounded-full"
                      style={{ background: "#7C3AED" }}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>

                {/* Steps */}
                <div className="space-y-2 text-left">
                  {[
                    { text: "Lendo o conteúdo...", delay: 0 },
                    { text: "Identificando conceitos-chave...", delay: 1 },
                    { text: "Gerando perguntas...", delay: 2 },
                    { text: "Verificando respostas...", delay: 3 },
                  ].map((step, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center gap-2 text-sm text-gray-600"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: step.delay * 0.8 }}
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, delay: step.delay * 0.8 }}
                      >
                        <Sparkles className="w-4 h-4 text-violet-400" />
                      </motion.div>
                      {step.text}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── PREVIEW VIEW ─── */}
          {view === "preview" && previewMaterialId && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {previewQuery.isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-2xl shadow h-28 animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="bg-gradient-to-r from-violet-500 to-indigo-500 rounded-3xl p-4 mb-4 text-white">
                    <h2 className="font-black text-lg">{previewQuery.data?.material.title}</h2>
                    <p className="text-white/70 text-sm">
                      {previewQuery.data?.questions.length} perguntas geradas pela IA
                    </p>
                  </div>

                  <div className="space-y-3 mb-5">
                    {(previewQuery.data?.questions ?? []).map((q, i) => (
                      <motion.div
                        key={q.id}
                        className="bg-white rounded-2xl shadow p-4"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <div className="flex items-start gap-2 mb-3">
                          <span className="w-6 h-6 rounded-lg bg-violet-100 text-violet-700 font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <p className="font-bold text-gray-800 text-sm leading-relaxed">{q.questionText}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {(["A", "B", "C", "D"] as const).map((opt) => {
                            const optKey = `option${opt}` as keyof typeof q;
                            const isCorrect = q.correctOption === opt;
                            return (
                              <div
                                key={opt}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold ${
                                  isCorrect
                                    ? "bg-green-50 border border-green-300 text-green-700"
                                    : "bg-gray-50 text-gray-600"
                                }`}
                              >
                                <span
                                  className="w-5 h-5 rounded-md flex items-center justify-center font-black text-xs flex-shrink-0"
                                  style={{ background: isCorrect ? "#4CAF50" : "#9E9E9E", color: "white" }}
                                >
                                  {opt}
                                </span>
                                <span className="line-clamp-2">{q[optKey] as string}</span>
                              </div>
                            );
                          })}
                        </div>
                        {q.explanation && (
                          <p className="text-xs text-gray-500 mt-2 italic border-t border-gray-100 pt-2">
                            💡 {q.explanation}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  <motion.button
                    className="w-full py-4 rounded-2xl font-black text-white text-lg flex items-center justify-center gap-3 shadow-xl"
                    style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)" }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (previewQuery.data?.material) {
                        onStartCustomQuiz(previewQuery.data.material.id, previewQuery.data.material.title);
                      }
                    }}
                  >
                    <Play className="w-5 h-5" />
                    Iniciar Quiz Personalizado!
                    <Zap className="w-5 h-5" />
                  </motion.button>
                </>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
