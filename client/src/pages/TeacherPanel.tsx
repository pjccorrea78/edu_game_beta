import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useGame } from "@/contexts/GameContext";
import { toast } from "sonner";
import BlockyAvatar from "@/components/BlockyAvatar";
import {
  ArrowLeft, GraduationCap, Users, Trophy, Target, TrendingUp,
  Search, Star, BookOpen, BarChart3, Medal, Plus, Trash2, Pencil,
  Copy, School, DoorOpen, ChevronRight, UserPlus, X, Eye,
  AlertTriangle, CheckCircle, XCircle, Clock,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────
type Tab = "schools" | "classes" | "students" | "legacy";
type SchoolData = { id: number; name: string; city?: string | null; state?: string | null; createdAt: Date };
type ClassData = { id: number; schoolId: number; name: string; grade?: string | null; year?: number | null; inviteCode: string; studentCount?: number; createdAt: Date };
type StudentData = { id: number; classId: number; playerId: number; nickname: string; totalPoints: number; avatarConfig: any; gender?: string | null; age?: number | null; grade?: string | null; enrolledAt: Date };

const GRADES = [
  { value: "1", label: "1º Ano" }, { value: "2", label: "2º Ano" }, { value: "3", label: "3º Ano" },
  { value: "4", label: "4º Ano" }, { value: "5", label: "5º Ano" }, { value: "6", label: "6º Ano" },
  { value: "7", label: "7º Ano" }, { value: "8", label: "8º Ano" }, { value: "9", label: "9º Ano" },
];

// ─── Shared Components ──────────────────────────────────────────────
function EmptyState({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-6">
      <motion.div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4" animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}>
        {icon}
      </motion.div>
      <p className="font-bold text-gray-700 text-sm mb-1">{title}</p>
      <p className="text-gray-400 text-xs leading-relaxed">{sub}</p>
    </div>
  );
}

function ConfirmDialog({ title, message, onConfirm, onCancel }: { title: string; message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
        <h3 className="font-bold text-gray-800 text-lg mb-2">{title}</h3>
        <p className="text-gray-500 text-sm mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm">Excluir</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Schools Tab ────────────────────────────────────────────────────
function SchoolsTab({ sessionId, onSelectSchool }: { sessionId: string; onSelectSchool: (id: number, name: string) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: schools, refetch } = trpc.teacher.listSchools.useQuery({ sessionId });
  const createMut = trpc.teacher.createSchool.useMutation({ onSuccess: () => { refetch(); resetForm(); toast.success("Escola criada!"); } });
  const updateMut = trpc.teacher.updateSchool.useMutation({ onSuccess: () => { refetch(); resetForm(); toast.success("Escola atualizada!"); } });
  const deleteMut = trpc.teacher.deleteSchool.useMutation({ onSuccess: () => { refetch(); setDeleteId(null); toast.success("Escola excluída!"); } });

  function resetForm() { setShowForm(false); setEditingId(null); setName(""); setCity(""); setState(""); }

  function handleEdit(s: SchoolData) { setEditingId(s.id); setName(s.name); setCity(s.city ?? ""); setState(s.state ?? ""); setShowForm(true); }

  function handleSave() {
    if (!name.trim()) return;
    if (editingId) {
      updateMut.mutate({ sessionId, schoolId: editingId, name: name.trim(), city: city.trim() || undefined, state: state.trim() || undefined });
    } else {
      createMut.mutate({ sessionId, name: name.trim(), city: city.trim() || undefined, state: state.trim() || undefined });
    }
  }

  return (
    <div className="space-y-3">
      {/* Add button */}
      <motion.button onClick={() => { resetForm(); setShowForm(true); }} className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md" whileTap={{ scale: 0.98 }}>
        <Plus className="w-4 h-4" /> Nova Escola
      </motion.button>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div className="bg-white rounded-2xl p-4 shadow-sm border border-blue-100" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <div className="flex justify-between items-center mb-3">
              <p className="font-bold text-gray-700 text-sm">{editingId ? "Editar Escola" : "Nova Escola"}</p>
              <button onClick={resetForm}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome da escola *" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium mb-2 focus:outline-none focus:border-blue-400" />
            <div className="grid grid-cols-2 gap-2 mb-3">
              <input value={city} onChange={e => setCity(e.target.value)} placeholder="Cidade" className="border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
              <input value={state} onChange={e => setState(e.target.value)} placeholder="Estado (UF)" maxLength={2} className="border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm uppercase focus:outline-none focus:border-blue-400" />
            </div>
            <button onClick={handleSave} disabled={!name.trim() || createMut.isPending || updateMut.isPending} className="w-full py-2.5 rounded-xl bg-blue-500 text-white font-bold text-sm disabled:opacity-50">
              {createMut.isPending || updateMut.isPending ? "Salvando..." : editingId ? "Salvar Alterações" : "Criar Escola"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {!schools || schools.length === 0 ? (
        <EmptyState icon={<School className="w-8 h-8 text-blue-400" />} title="Nenhuma escola cadastrada" sub="Crie sua primeira escola para começar a organizar turmas e alunos." />
      ) : (
        schools.map((s, i) => (
          <motion.div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <School className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm truncate">{s.name}</p>
                <p className="text-xs text-gray-400">{[s.city, s.state].filter(Boolean).join(" - ") || "Sem localização"}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => handleEdit(s)} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-blue-50"><Pencil className="w-3.5 h-3.5 text-gray-400" /></button>
                <button onClick={() => setDeleteId(s.id)} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-red-50"><Trash2 className="w-3.5 h-3.5 text-gray-400" /></button>
                <button onClick={() => onSelectSchool(s.id, s.name)} className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><ChevronRight className="w-4 h-4 text-blue-500" /></button>
              </div>
            </div>
          </motion.div>
        ))
      )}

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId && (
          <ConfirmDialog title="Excluir Escola?" message="Todas as turmas e alunos vinculados serão removidos. Esta ação não pode ser desfeita." onConfirm={() => deleteMut.mutate({ sessionId, schoolId: deleteId })} onCancel={() => setDeleteId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Classes Tab ────────────────────────────────────────────────────
function ClassesTab({ sessionId, schoolId, schoolName, onBack, onSelectClass }: { sessionId: string; schoolId: number; schoolName: string; onBack: () => void; onSelectClass: (id: number, name: string) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: schoolData, refetch } = trpc.teacher.getSchool.useQuery({ sessionId, schoolId });
  const createMut = trpc.teacher.createClass.useMutation({ onSuccess: () => { refetch(); resetForm(); toast.success("Turma criada!"); } });
  const updateMut = trpc.teacher.updateClass.useMutation({ onSuccess: () => { refetch(); resetForm(); toast.success("Turma atualizada!"); } });
  const deleteMut = trpc.teacher.deleteClass.useMutation({ onSuccess: () => { refetch(); setDeleteId(null); toast.success("Turma excluída!"); } });

  const classes = schoolData?.classes ?? [];

  function resetForm() { setShowForm(false); setEditingId(null); setName(""); setGrade(""); }

  function handleEdit(c: any) { setEditingId(c.id); setName(c.name); setGrade(c.grade ?? ""); setShowForm(true); }

  function handleSave() {
    if (!name.trim()) return;
    const gradeVal = grade || undefined;
    if (editingId) {
      updateMut.mutate({ sessionId, classId: editingId, name: name.trim(), grade: gradeVal as any });
    } else {
      createMut.mutate({ sessionId, schoolId, name: name.trim(), grade: gradeVal as any, year: new Date().getFullYear() });
    }
  }

  function copyCode(code: string) { navigator.clipboard.writeText(code); toast.success("Código copiado!"); }

  return (
    <div className="space-y-3">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <button onClick={onBack} className="text-blue-500 font-bold hover:underline">Escolas</button>
        <ChevronRight className="w-3 h-3" />
        <span className="font-bold text-gray-600 truncate">{schoolName}</span>
      </div>

      {/* Add */}
      <motion.button onClick={() => { resetForm(); setShowForm(true); }} className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md" whileTap={{ scale: 0.98 }}>
        <Plus className="w-4 h-4" /> Nova Turma
      </motion.button>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <div className="flex justify-between items-center mb-3">
              <p className="font-bold text-gray-700 text-sm">{editingId ? "Editar Turma" : "Nova Turma"}</p>
              <button onClick={resetForm}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome da turma (ex: 5º Ano A) *" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium mb-2 focus:outline-none focus:border-emerald-400" />
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1.5 font-medium">Série (opcional)</p>
              <div className="grid grid-cols-5 gap-1.5">
                {GRADES.map(g => (
                  <button key={g.value} onClick={() => setGrade(grade === g.value ? "" : g.value)} className={`rounded-lg py-1.5 text-xs font-bold transition-all ${grade === g.value ? "bg-emerald-500 text-white" : "bg-gray-50 text-gray-500 hover:bg-emerald-50"}`}>
                    {g.label.replace(" Ano", "º")}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleSave} disabled={!name.trim() || createMut.isPending || updateMut.isPending} className="w-full py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm disabled:opacity-50">
              {createMut.isPending || updateMut.isPending ? "Salvando..." : editingId ? "Salvar Alterações" : "Criar Turma"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {classes.length === 0 ? (
        <EmptyState icon={<DoorOpen className="w-8 h-8 text-emerald-400" />} title="Nenhuma turma nesta escola" sub="Crie turmas para organizar seus alunos e acompanhar o progresso." />
      ) : (
        classes.map((c, i) => (
          <motion.div key={c.id} className="bg-white rounded-2xl p-4 shadow-sm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <DoorOpen className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm truncate">{c.name}</p>
                <p className="text-xs text-gray-400">{c.grade ? GRADES.find(g => g.value === c.grade)?.label : "Série não definida"}{c.year ? ` • ${c.year}` : ""}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => handleEdit(c)} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-emerald-50"><Pencil className="w-3.5 h-3.5 text-gray-400" /></button>
                <button onClick={() => setDeleteId(c.id)} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-red-50"><Trash2 className="w-3.5 h-3.5 text-gray-400" /></button>
                <button onClick={() => onSelectClass(c.id, c.name)} className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center"><ChevronRight className="w-4 h-4 text-emerald-500" /></button>
              </div>
            </div>
            {/* Invite code badge */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
              <div className="flex items-center gap-2">
                <UserPlus className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-500">Código de convite:</span>
                <span className="font-mono font-bold text-sm text-emerald-600 tracking-wider">{c.inviteCode}</span>
              </div>
              <button onClick={() => copyCode(c.inviteCode)} className="text-xs text-blue-500 font-bold hover:underline flex items-center gap-1"><Copy className="w-3 h-3" /> Copiar</button>
            </div>
          </motion.div>
        ))
      )}

      <AnimatePresence>
        {deleteId && (
          <ConfirmDialog title="Excluir Turma?" message="Todos os alunos vinculados serão removidos desta turma. Esta ação não pode ser desfeita." onConfirm={() => deleteMut.mutate({ sessionId, classId: deleteId })} onCancel={() => setDeleteId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Student Detail Modal (progresso + questões erradas) ────────────
const DISCIPLINE_NAMES: Record<string, string> = {
  matematica: "Matemática", portugues: "Português", geografia: "Geografia",
  historia: "História", ciencias: "Ciências", educacao_fisica: "Ed. Física",
  arte: "Arte", ensino_religioso: "Ens. Religioso",
};
const DISCIPLINE_EMOJIS: Record<string, string> = {
  matematica: "🔢", portugues: "📖", geografia: "🌍", historia: "🏛️",
  ciencias: "🔬", educacao_fisica: "⚽", arte: "🎨", ensino_religioso: "✨",
};
const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

function StudentDetailModal({ studentDetail, studentName, onClose }: {
  studentDetail: {
    totalQuizzes: number;
    totalQuestions: number;
    totalCorrect: number;
    totalWrong: number;
    overallAccuracy: number;
    byDiscipline: Record<string, { count: number; correct: number; wrong: number; accuracy: number }>;
    wrongQuestions: Array<{
      questionId: number; questionText: string;
      optionA: string; optionB: string; optionC: string; optionD: string;
      correctOption: string; explanation: string | null;
      discipline: string; difficulty: string; servedAt: Date;
    }>;
    recentSessions: any[];
  };
  studentName: string;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"progress" | "wrong">("progress");
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [filterDisc, setFilterDisc] = useState<string>("all");

  const d = studentDetail;
  const wrongFiltered = filterDisc === "all"
    ? d.wrongQuestions
    : d.wrongQuestions.filter(q => q.discipline === filterDisc);

  // Disciplines that have wrong answers
  const wrongDisciplines = Array.from(new Set(d.wrongQuestions.map(q => q.discipline)));

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl"
        initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">{studentName}</h3>
            <p className="text-xs text-gray-400">Progresso detalhado do aluno</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 px-5 pt-3 pb-2">
          <button
            onClick={() => setTab("progress")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${tab === "progress" ? "bg-blue-500 text-white shadow" : "bg-gray-100 text-gray-500"}`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Progresso
          </button>
          <button
            onClick={() => setTab("wrong")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${tab === "wrong" ? "bg-red-500 text-white shadow" : "bg-gray-100 text-gray-500"}`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Erros ({d.wrongQuestions.length})
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          <AnimatePresence mode="wait">
            {/* ── Progress Tab ── */}
            {tab === "progress" && (
              <motion.div key="progress" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                {/* Stats cards */}
                <div className="grid grid-cols-4 gap-2 mt-3 mb-4">
                  {[
                    { label: "Quizzes", value: d.totalQuizzes, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Acertos", value: d.totalCorrect, color: "text-green-600", bg: "bg-green-50" },
                    { label: "Erros", value: d.totalWrong, color: "text-red-600", bg: "bg-red-50" },
                    { label: "Acerto", value: `${d.overallAccuracy}%`, color: "text-purple-600", bg: "bg-purple-50" },
                  ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-xl p-2.5 text-center`}>
                      <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-[10px] text-gray-500">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Accuracy ring */}
                <div className="flex justify-center mb-4">
                  <div className="relative w-28 h-28">
                    <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                      <circle cx="60" cy="60" r="48" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                      <circle
                        cx="60" cy="60" r="48" fill="none"
                        stroke={d.overallAccuracy >= 70 ? "#22c55e" : d.overallAccuracy >= 50 ? "#eab308" : "#ef4444"}
                        strokeWidth="10" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 48}`}
                        strokeDashoffset={`${2 * Math.PI * 48 * (1 - d.overallAccuracy / 100)}`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-gray-800">{d.overallAccuracy}%</span>
                      <span className="text-[10px] text-gray-400">geral</span>
                    </div>
                  </div>
                </div>

                {/* By discipline */}
                {Object.keys(d.byDiscipline).length > 0 && (
                  <div>
                    <p className="font-bold text-gray-600 text-xs uppercase tracking-wider mb-2">Por Disciplina</p>
                    <div className="space-y-2">
                      {Object.entries(d.byDiscipline)
                        .sort(([, a], [, b]) => a.accuracy - b.accuracy)
                        .map(([disc, data]) => (
                        <div key={disc} className="bg-gray-50 rounded-xl px-3 py-2.5">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-base">{DISCIPLINE_EMOJIS[disc] ?? "📚"}</span>
                            <span className="text-sm font-bold text-gray-700 flex-1">{DISCIPLINE_NAMES[disc] ?? disc}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              data.accuracy >= 70 ? "bg-green-100 text-green-700" :
                              data.accuracy >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                            }`}>{data.accuracy}%</span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-gray-400">
                            <span>{data.count} questões</span>
                            <span className="text-green-500">✓ {data.correct}</span>
                            <span className="text-red-400">✗ {data.wrong}</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${data.accuracy}%`,
                                background: data.accuracy >= 70 ? "#22c55e" : data.accuracy >= 50 ? "#eab308" : "#ef4444",
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {d.totalQuestions === 0 && (
                  <div className="text-center py-8">
                    <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Nenhuma questão respondida ainda</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Wrong Questions Tab ── */}
            {tab === "wrong" && (
              <motion.div key="wrong" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                {d.wrongQuestions.length === 0 ? (
                  <div className="text-center py-10">
                    <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-bold text-sm">Nenhum erro registrado!</p>
                    <p className="text-gray-400 text-xs mt-1">O aluno ainda não errou nenhuma questão rastreada.</p>
                  </div>
                ) : (
                  <>
                    {/* Discipline filter */}
                    {wrongDisciplines.length > 1 && (
                      <div className="flex gap-1.5 mt-3 mb-3 overflow-x-auto pb-1 no-scrollbar">
                        <button
                          onClick={() => setFilterDisc("all")}
                          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            filterDisc === "all" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          Todas ({d.wrongQuestions.length})
                        </button>
                        {wrongDisciplines.map(disc => {
                          const count = d.wrongQuestions.filter(q => q.discipline === disc).length;
                          return (
                            <button
                              key={disc}
                              onClick={() => setFilterDisc(disc)}
                              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                filterDisc === disc ? "bg-red-500 text-white" : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {DISCIPLINE_EMOJIS[disc] ?? "📚"} {count}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Wrong question cards */}
                    <div className="space-y-2 mt-2">
                      {wrongFiltered.map((q, i) => {
                        const isExpanded = expandedQ === q.questionId;
                        const optionKeys = ["optionA", "optionB", "optionC", "optionD"] as const;
                        return (
                          <motion.div
                            key={`${q.questionId}-${i}`}
                            className="bg-red-50 border border-red-100 rounded-xl overflow-hidden"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                          >
                            {/* Question header - always visible */}
                            <button
                              onClick={() => setExpandedQ(isExpanded ? null : q.questionId)}
                              className="w-full text-left p-3"
                            >
                              <div className="flex items-start gap-2">
                                <div className="w-6 h-6 rounded-full bg-red-200 text-red-700 flex items-center justify-center shrink-0 mt-0.5">
                                  <XCircle className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-800 font-medium leading-snug">{q.questionText}</p>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[10px] bg-white text-gray-500 px-1.5 py-0.5 rounded">{DISCIPLINE_EMOJIS[q.discipline] ?? ""} {DISCIPLINE_NAMES[q.discipline] ?? q.discipline}</span>
                                    <span className="text-[10px] bg-white text-gray-400 px-1.5 py-0.5 rounded">
                                      {q.difficulty === "easy" ? "⭐ Fácil" : q.difficulty === "hard" ? "⭐⭐⭐ Difícil" : "⭐⭐ Médio"}
                                    </span>
                                  </div>
                                </div>
                                <ChevronRight className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                              </div>
                            </button>

                            {/* Expanded: show options + correct answer */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-3 pb-3 space-y-1.5">
                                    {OPTION_LETTERS.map((letter, oi) => {
                                      const optText = q[optionKeys[oi]];
                                      const isCorrect = letter === q.correctOption;
                                      return (
                                        <div
                                          key={letter}
                                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                                            isCorrect
                                              ? "bg-green-100 border border-green-300 text-green-800 font-bold"
                                              : "bg-white border border-gray-200 text-gray-600"
                                          }`}
                                        >
                                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                            isCorrect ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                                          }`}>{letter}</span>
                                          <span className="flex-1">{optText}</span>
                                          {isCorrect && <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
                                        </div>
                                      );
                                    })}
                                    {q.explanation && (
                                      <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mt-2">
                                        <p className="text-[10px] text-blue-500 font-bold mb-0.5">💡 Explicação</p>
                                        <p className="text-xs text-blue-800 leading-relaxed">{q.explanation}</p>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Students Tab ───────────────────────────────────────────────────
function StudentsTab({ sessionId, classId, className: clsName, onBack }: { sessionId: string; classId: number; className: string; onBack: () => void }) {
  const [viewingPlayer, setViewingPlayer] = useState<number | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ playerId: number; nickname: string } | null>(null);

  const { data, refetch, isLoading } = trpc.teacher.getClass.useQuery({ sessionId, classId });
  const removeMut = trpc.teacher.removeStudent.useMutation({ onSuccess: () => { refetch(); setRemoveTarget(null); toast.success("Aluno removido!"); } });

  const { data: studentDetail } = trpc.teacher.getStudentDetail.useQuery(
    { sessionId, playerId: viewingPlayer! },
    { enabled: !!viewingPlayer }
  );

  const students = data?.students ?? [];
  const stats = data?.stats;
  const cls = data?.class;

  const disciplineNames: Record<string, string> = {
    matematica: "Matemática", portugues: "Português", geografia: "Geografia",
    historia: "História", ciencias: "Ciências", educacao_fisica: "Ed. Física",
    arte: "Arte", ensino_religioso: "Ens. Religioso",
  };

  function copyCode(code: string) { navigator.clipboard.writeText(code); toast.success("Código copiado!"); }

  return (
    <div className="space-y-3">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400 flex-wrap">
        <button onClick={onBack} className="text-blue-500 font-bold hover:underline">Turmas</button>
        <ChevronRight className="w-3 h-3" />
        <span className="font-bold text-gray-600 truncate">{clsName}</span>
      </div>

      {/* Class header */}
      {cls && (
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-bold text-lg">{cls.name}</p>
              <p className="text-white/70 text-xs">{cls.grade ? GRADES.find(g => g.value === cls.grade)?.label : ""}{cls.year ? ` • ${cls.year}` : ""}</p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-xl px-3 py-1.5 text-center">
              <p className="text-2xl font-bold">{stats?.totalStudents ?? 0}</p>
              <p className="text-[10px] text-white/80">alunos</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2">
            <UserPlus className="w-4 h-4 text-white/70" />
            <span className="text-xs text-white/70">Convite:</span>
            <span className="font-mono font-bold tracking-wider">{cls.inviteCode}</span>
            <button onClick={() => copyCode(cls.inviteCode)} className="ml-auto text-xs bg-white/20 rounded-lg px-2 py-1 font-bold"><Copy className="w-3 h-3 inline mr-1" />Copiar</button>
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && stats.totalStudents > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Alunos", value: stats.totalStudents, icon: <Users className="w-4 h-4 text-blue-500" />, bg: "bg-blue-50" },
            { label: "Pts Médio", value: stats.avgPoints, icon: <TrendingUp className="w-4 h-4 text-green-500" />, bg: "bg-green-50" },
            { label: "Quizzes", value: stats.totalQuizzes, icon: <Target className="w-4 h-4 text-purple-500" />, bg: "bg-purple-50" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-3 shadow-sm text-center">
              <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center mx-auto mb-1`}>{s.icon}</div>
              <p className="font-bold text-gray-800 text-lg">{s.value}</p>
              <p className="text-[10px] text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Student list */}
      {isLoading ? (
        <div className="flex justify-center py-10"><motion.div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} /></div>
      ) : students.length === 0 ? (
        <EmptyState icon={<Users className="w-8 h-8 text-violet-400" />} title="Nenhum aluno nesta turma" sub={`Compartilhe o código ${cls?.inviteCode ?? ""} para que os alunos entrem na turma pelo jogo.`} />
      ) : (
        <div className="space-y-2">
          <p className="font-bold text-gray-700 text-sm flex items-center gap-2"><Medal className="w-4 h-4 text-yellow-500" /> Alunos ({students.length})</p>
          {students.map((s, i) => {
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
            return (
              <motion.div key={s.playerId} className="bg-white rounded-xl p-3 shadow-sm" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                    {s.avatarConfig ? (
                      <BlockyAvatar config={s.avatarConfig as any} size={40} />
                    ) : (
                      <span className="text-lg">{medal ?? `#${i + 1}`}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm truncate">{medal ? `${medal} ` : ""}{s.nickname}</p>
                    <p className="text-xs text-gray-400">
                      {s.age ? `${s.age} anos` : ""}{s.grade ? ` • ${s.grade}º ano` : ""}
                      {s.gender ? ` • ${s.gender === "masculino" ? "♂" : "♀"}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="text-right mr-1">
                      <p className="font-bold text-sm text-gray-800">{s.totalPoints}</p>
                      <p className="text-[10px] text-gray-400">pontos</p>
                    </div>
                    <button onClick={() => setViewingPlayer(s.playerId)} className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><Eye className="w-3.5 h-3.5 text-blue-500" /></button>
                    <button onClick={() => setRemoveTarget({ playerId: s.playerId, nickname: s.nickname })} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-red-50"><Trash2 className="w-3.5 h-3.5 text-gray-400" /></button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Student detail modal */}
      <AnimatePresence>
        {viewingPlayer && studentDetail && (
          <StudentDetailModal
            studentDetail={studentDetail as any}
            studentName={students.find(s => s.playerId === viewingPlayer)?.nickname ?? "Aluno"}
            onClose={() => setViewingPlayer(null)}
          />
        )}
      </AnimatePresence>

      {/* Remove confirm */}
      <AnimatePresence>
        {removeTarget && (
          <ConfirmDialog title="Remover Aluno?" message={`"${removeTarget.nickname}" será removido desta turma. O progresso do aluno no jogo não será afetado.`} onConfirm={() => removeMut.mutate({ sessionId, classId, playerId: removeTarget.playerId })} onCancel={() => setRemoveTarget(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Legacy Turma Tab ───────────────────────────────────────────────
function LegacyTurmaTab({ sessionId }: { sessionId: string }) {
  const [code, setCode] = useState("");
  const [searchCode, setSearchCode] = useState<string | null>(null);
  const { data, isLoading, error } = trpc.teacher.getTurmaProgress.useQuery({ code: searchCode! }, { enabled: !!searchCode });

  const sessions = data?.sessions ?? [];
  const stats = data?.stats;
  const byPlayer = new Map<number, typeof sessions[0]>();
  sessions.forEach(s => { const ex = byPlayer.get(s.playerId); if (!ex || s.score > ex.score) byPlayer.set(s.playerId, s); });
  const uniqueStudents = Array.from(byPlayer.values()).sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-500" /> Buscar por código de material</p>
        <div className="flex gap-2">
          <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && code.trim().length >= 4 && setSearchCode(code.trim().toUpperCase())} placeholder="Ex: ABC123" maxLength={8} className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold tracking-widest text-center focus:outline-none focus:border-blue-400 uppercase" />
          <button className="bg-blue-500 text-white rounded-xl px-4 py-2.5 font-bold text-sm flex items-center gap-2" onClick={() => code.trim().length >= 4 && setSearchCode(code.trim().toUpperCase())} disabled={isLoading}><Search className="w-4 h-4" /> Buscar</button>
        </div>
      </div>
      {isLoading && <div className="flex justify-center py-8"><motion.div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} /></div>}
      {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center"><p className="text-red-600 font-bold text-sm">Código não encontrado</p></div>}
      {data && !isLoading && (
        <>
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 text-white">
            <p className="text-xs opacity-80 mb-1">Material</p>
            <p className="font-bold text-lg">{data.materialTitle}</p>
          </div>
          {stats && (
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white rounded-xl p-3 shadow-sm text-center"><p className="font-bold text-lg text-gray-800">{stats.totalStudents}</p><p className="text-[10px] text-gray-400">Alunos</p></div>
              <div className="bg-white rounded-xl p-3 shadow-sm text-center"><p className="font-bold text-lg text-gray-800">{stats.avgAccuracy}%</p><p className="text-[10px] text-gray-400">Acerto médio</p></div>
            </div>
          )}
          <div className="space-y-2">
            {uniqueStudents.map((s, i) => {
              const acc = Math.round((s.correctAnswers / s.totalQuestions) * 100);
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
              return (
                <div key={s.id} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-sm">{medal ?? `#${i+1}`}</div>
                  <div className="flex-1 min-w-0"><p className="font-bold text-gray-800 text-sm truncate">{s.nickname ?? "Jogador"}</p></div>
                  <div className="text-right"><p className="font-bold text-sm text-gray-800">{s.score} pts</p><p className="text-xs text-gray-400">{acc}%</p></div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main TeacherPanel ──────────────────────────────────────────────
export default function TeacherPanel({ onBack }: { onBack: () => void }) {
  const { sessionId } = useGame();
  const [tab, setTab] = useState<Tab>("schools");
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [selectedSchoolName, setSelectedSchoolName] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedClassName, setSelectedClassName] = useState("");

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "schools", label: "Escolas", icon: <School className="w-4 h-4" /> },
    { key: "classes", label: "Turmas", icon: <DoorOpen className="w-4 h-4" /> },
    { key: "students", label: "Alunos", icon: <Users className="w-4 h-4" /> },
    { key: "legacy", label: "Material", icon: <BookOpen className="w-4 h-4" /> },
  ];

  function handleSelectSchool(id: number) {
    setSelectedSchoolId(id);
    setTab("classes");
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg, #1e3a5f15 0%, #f8f9ff 30%)" }}>
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <motion.button className="w-10 h-10 rounded-xl bg-white shadow flex items-center justify-center" whileTap={{ scale: 0.95 }} onClick={onBack}>
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </motion.button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-gray-800 text-lg">Painel do Professor</span>
          </div>
          <p className="text-xs text-gray-500">Gerencie escolas, turmas e alunos</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="px-4 mb-3">
        <div className="bg-white rounded-2xl p-1.5 shadow-sm flex gap-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                if (t.key === "schools") { setSelectedSchoolId(null); setSelectedClassId(null); }
                if (t.key === "classes" && !selectedSchoolId) setTab("schools");
                if (t.key === "students" && !selectedClassId) setTab(selectedSchoolId ? "classes" : "schools");
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                tab === t.key ? "bg-blue-500 text-white shadow" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {tab === "schools" && (
            <motion.div key="schools" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <SchoolsTab sessionId={sessionId} onSelectSchool={(id, name) => {
                setSelectedSchoolId(id);
                setSelectedSchoolName(name);
                setTab("classes");
              }} />
            </motion.div>
          )}

          {tab === "classes" && selectedSchoolId && (
            <motion.div key="classes" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <ClassesTab
                sessionId={sessionId}
                schoolId={selectedSchoolId}
                schoolName={selectedSchoolName || "Escola"}
                onBack={() => { setTab("schools"); setSelectedSchoolId(null); }}
                onSelectClass={(id, name) => { setSelectedClassId(id); setSelectedClassName(name); setTab("students"); }}
              />
            </motion.div>
          )}

          {tab === "students" && selectedClassId && (
            <motion.div key="students" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <StudentsTab sessionId={sessionId} classId={selectedClassId} className={selectedClassName} onBack={() => setTab("classes")} />
            </motion.div>
          )}

          {tab === "legacy" && (
            <motion.div key="legacy" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <LegacyTurmaTab sessionId={sessionId} />
            </motion.div>
          )}

          {tab === "classes" && !selectedSchoolId && (
            <motion.div key="no-school" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <EmptyState icon={<School className="w-8 h-8 text-blue-400" />} title="Selecione uma escola primeiro" sub="Vá para a aba Escolas e selecione ou crie uma escola." />
            </motion.div>
          )}

          {tab === "students" && !selectedClassId && (
            <motion.div key="no-class" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <EmptyState icon={<DoorOpen className="w-8 h-8 text-emerald-400" />} title="Selecione uma turma primeiro" sub="Vá para a aba Turmas e selecione uma turma para ver os alunos." />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
