import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  ChevronRight,
  Users,
  BookOpen,
  Medal,
  Copy,
  Search,
  Upload,
  Download,
} from "lucide-react";
import { toast } from "sonner";

const GRADE_LABELS: Record<string, string> = {
  "1": "1º Ano",
  "2": "2º Ano",
  "3": "3º Ano",
  "4": "4º Ano",
  "5": "5º Ano",
  "6": "6º Ano",
  "7": "7º Ano",
  "8": "8º Ano",
  "9": "9º Ano",
};

const GRADE_COLORS: Record<string, { bg: string; color: string }> = {
  "1": { bg: "from-pink-400 to-rose-400", color: "#EC4899" },
  "2": { bg: "from-red-400 to-orange-400", color: "#FF6B6B" },
  "3": { bg: "from-orange-400 to-yellow-400", color: "#F59E0B" },
  "4": { bg: "from-yellow-400 to-lime-400", color: "#FBBF24" },
  "5": { bg: "from-green-400 to-emerald-400", color: "#10B981" },
  "6": { bg: "from-teal-400 to-cyan-400", color: "#14B8A6" },
  "7": { bg: "from-cyan-400 to-blue-400", color: "#06B6D4" },
  "8": { bg: "from-blue-400 to-indigo-400", color: "#3B82F6" },
  "9": { bg: "from-indigo-400 to-purple-400", color: "#6366F1" },
};

type Screen = "schools" | "grades" | "classes" | "class-detail";

export function TeacherPanelNew({ sessionId }: { sessionId: string }) {
  const [screen, setScreen] = useState<Screen>("schools");
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [selectedGradeId, setSelectedGradeId] = useState<number | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  // Queries
  const schoolsQuery = trpc.teacher.listSchools.useQuery({ sessionId });
  const gradesQuery = trpc.teacher.getGradesBySchool.useQuery(
    { sessionId, schoolId: selectedSchoolId! },
    { enabled: !!selectedSchoolId }
  );
  const classesQuery = trpc.teacher.getClassesByGrade.useQuery(
    { sessionId, gradeId: selectedGradeId! },
    { enabled: !!selectedGradeId }
  );
  const classDetailQuery = trpc.teacher.getClass.useQuery(
    { sessionId, classId: selectedClassId! },
    { enabled: !!selectedClassId }
  );

  const handleBack = () => {
    if (screen === "class-detail") {
      setScreen("classes");
      setSelectedClassId(null);
    } else if (screen === "classes") {
      setScreen("grades");
      setSelectedGradeId(null);
    } else if (screen === "grades") {
      setScreen("schools");
      setSelectedSchoolId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <AnimatePresence mode="wait">
        {screen === "schools" && (
          <SchoolsScreen
            key="schools"
            sessionId={sessionId}
            schools={schoolsQuery.data ?? []}
            isLoading={schoolsQuery.isLoading}
            onSelectSchool={(schoolId) => {
              setSelectedSchoolId(schoolId);
              setScreen("grades");
            }}
          />
        )}

        {screen === "grades" && selectedSchoolId && (
          <GradesScreen
            key="grades"
            sessionId={sessionId}
            schoolId={selectedSchoolId}
            grades={gradesQuery.data ?? []}
            isLoading={gradesQuery.isLoading}
            onBack={handleBack}
            onSelectGrade={(gradeId) => {
              setSelectedGradeId(gradeId);
              setScreen("classes");
            }}
          />
        )}

        {screen === "classes" && selectedGradeId && (
          <ClassesScreen
            key="classes"
            sessionId={sessionId}
            gradeId={selectedGradeId}
            classes={classesQuery.data ?? []}
            isLoading={classesQuery.isLoading}
            onBack={handleBack}
            onSelectClass={(classId) => {
              setSelectedClassId(classId);
              setScreen("class-detail");
            }}
          />
        )}

        {screen === "class-detail" && selectedClassId && classDetailQuery.data && (
          <ClassDetailScreen
            key="class-detail"
            sessionId={sessionId}
            classId={selectedClassId}
            classData={classDetailQuery.data}
            onBack={handleBack}
            onRefresh={() => classDetailQuery.refetch()}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Schools Screen ───────────────────────────────────────────────────────────
function SchoolsScreen({
  sessionId,
  schools,
  isLoading,
  onSelectSchool,
}: {
  sessionId: string;
  schools: any[];
  isLoading: boolean;
  onSelectSchool: (schoolId: number) => void;
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", city: "", state: "" });
  const createMutation = trpc.teacher.createSchool.useMutation({
    onSuccess: () => {
      setFormData({ name: "", city: "", state: "" });
      setShowCreateForm(false);
      toast.success("Escola criada!");
    },
  });

  const handleCreate = () => {
    if (!formData.name || !formData.city || !formData.state) {
      toast.error("Preencha todos os campos");
      return;
    }
    createMutation.mutate({ sessionId, ...formData });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto"
    >
      <div className="mb-6">
        <h1 className="text-4xl font-black text-gray-800 mb-2">Minhas Escolas</h1>
        <p className="text-gray-600">Selecione uma escola para gerenciar turmas e salas</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <motion.div
            className="w-10 h-10 border-4 border-purple-200 border-t-purple-500 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      ) : schools.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl">
          <div className="text-5xl mb-4">🏫</div>
          <p className="text-gray-600 font-semibold mb-4">Nenhuma escola criada</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-purple-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-purple-600"
          >
            <Plus className="w-4 h-4 inline mr-2" /> Criar Escola
          </button>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {schools.map((school, i) => (
            <motion.button
              key={school.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelectSchool(school.id)}
              className="w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all text-left flex items-center justify-between group"
            >
              <div>
                <p className="font-bold text-gray-800">{school.name}</p>
                <p className="text-sm text-gray-500">{school.city}, {school.state}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
            </motion.button>
          ))}
        </div>
      )}

      <button
        onClick={() => setShowCreateForm(!showCreateForm)}
        className="w-full bg-purple-500 text-white py-3 rounded-2xl font-bold hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" /> Criar Nova Escola
      </button>

      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 bg-white rounded-2xl p-4 space-y-3"
          >
            <input
              type="text"
              placeholder="Nome da escola"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="text"
              placeholder="Cidade"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="text"
              placeholder="Estado (sigla)"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
              maxLength={2}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="flex-1 bg-purple-500 text-white py-2 rounded-xl font-bold hover:bg-purple-600 disabled:opacity-50"
              >
                Criar
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-xl font-bold hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Grades Screen (Turmas por série) ──────────────────────────────────────────
function GradesScreen({
  sessionId,
  schoolId,
  grades,
  isLoading,
  onBack,
  onSelectGrade,
}: {
  sessionId: string;
  schoolId: number;
  grades: any[];
  isLoading: boolean;
  onBack: () => void;
  onSelectGrade: (gradeId: number) => void;
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string | null>(null);
  const createMutation = trpc.teacher.createGrade.useMutation({
    onSuccess: () => {
      setSelectedGradeLevel(null);
      setShowCreateForm(false);
      toast.success("Turma criada!");
    },
  });

  const handleCreate = () => {
    if (!selectedGradeLevel) {
      toast.error("Selecione uma série");
      return;
    }
    createMutation.mutate({ sessionId, schoolId, gradeLevel: selectedGradeLevel as any });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-gray-800">Turmas</h1>
          <p className="text-sm text-gray-600">Organize por série</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <motion.div
            className="w-10 h-10 border-4 border-purple-200 border-t-purple-500 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {Object.entries(GRADE_LABELS).map(([level, label]) => {
            const grade = grades.find((g) => g.gradeLevel === level);
            const colors = GRADE_COLORS[level];
            return (
              <motion.button
                key={level}
                onClick={() => grade && onSelectGrade(grade.id)}
                disabled={!grade}
                className={`p-4 rounded-2xl font-bold text-white transition-all ${
                  grade
                    ? `bg-gradient-to-br ${colors.bg} shadow-lg hover:shadow-xl cursor-pointer`
                    : "bg-gray-200 text-gray-400 cursor-not-allowed opacity-50"
                }`}
              >
                {label}
              </motion.button>
            );
          })}
        </div>
      )}

      <button
        onClick={() => setShowCreateForm(!showCreateForm)}
        className="w-full bg-purple-500 text-white py-3 rounded-2xl font-bold hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" /> Criar Turma
      </button>

      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 bg-white rounded-2xl p-4"
          >
            <p className="font-bold text-gray-800 mb-3">Selecione a série:</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {Object.entries(GRADE_LABELS).map(([level, label]) => (
                <button
                  key={level}
                  onClick={() => setSelectedGradeLevel(level)}
                  className={`py-2 rounded-xl font-bold transition-all ${
                    selectedGradeLevel === level
                      ? "bg-purple-500 text-white"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending || !selectedGradeLevel}
                className="flex-1 bg-purple-500 text-white py-2 rounded-xl font-bold hover:bg-purple-600 disabled:opacity-50"
              >
                Criar
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-xl font-bold hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Classes Screen (Salas) ────────────────────────────────────────────────────
function ClassesScreen({
  sessionId,
  gradeId,
  classes,
  isLoading,
  onBack,
  onSelectClass,
}: {
  sessionId: string;
  gradeId: number;
  classes: any[];
  isLoading: boolean;
  onBack: () => void;
  onSelectClass: (classId: number) => void;
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", year: new Date().getFullYear() });
  const createMutation = trpc.teacher.createClass.useMutation({
    onSuccess: () => {
      setFormData({ name: "", year: new Date().getFullYear() });
      setShowCreateForm(false);
      toast.success("Sala criada!");
    },
  });

  const handleCreate = () => {
    if (!formData.name) {
      toast.error("Digite o nome da sala");
      return;
    }
    // TODO: Get schoolId from context
    // For now, using gradeId as reference
    createMutation.mutate({
      sessionId,
      schoolId: 1, // Placeholder
      name: formData.name,
      year: formData.year,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-gray-800">Salas</h1>
          <p className="text-sm text-gray-600">Clique em uma sala para gerenciar alunos e materiais</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <motion.div
            className="w-10 h-10 border-4 border-purple-200 border-t-purple-500 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl">
          <div className="text-5xl mb-4">🚪</div>
          <p className="text-gray-600 font-semibold mb-4">Nenhuma sala criada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {classes.map((cls, i) => (
            <motion.button
              key={cls.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelectClass(cls.id)}
              className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all text-left"
            >
              <p className="font-bold text-gray-800 text-lg">{cls.name}</p>
              <p className="text-sm text-gray-500 mt-1">Ano: {cls.year}</p>
              <div className="flex items-center gap-2 mt-3 text-xs text-gray-600">
                <Users className="w-4 h-4" /> {cls.studentCount || 0} alunos
              </div>
            </motion.button>
          ))}
        </div>
      )}

      <button
        onClick={() => setShowCreateForm(!showCreateForm)}
        className="w-full bg-purple-500 text-white py-3 rounded-2xl font-bold hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" /> Criar Sala
      </button>

      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 bg-white rounded-2xl p-4 space-y-3"
          >
            <input
              type="text"
              placeholder="Nome da sala (ex: 5º Ano A)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="flex-1 bg-purple-500 text-white py-2 rounded-xl font-bold hover:bg-purple-600 disabled:opacity-50"
              >
                Criar
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-xl font-bold hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Class Detail Screen ───────────────────────────────────────────────────────
function ClassDetailScreen({
  sessionId,
  classId,
  classData,
  onBack,
  onRefresh,
}: {
  sessionId: string;
  classId: number;
  classData: any;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [tab, setTab] = useState<"students" | "materials">("students");
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [searchNickname, setSearchNickname] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const searchQuery = trpc.teacher.searchStudents.useQuery(
    { sessionId, nickname: searchNickname },
    { enabled: false }
  );
  const addStudentMutation = trpc.teacher.addStudentManually.useMutation({
    onSuccess: () => {
      setSearchNickname("");
      setSearchResults([]);
      setShowAddStudent(false);
      onRefresh();
      toast.success("Aluno adicionado!");
    },
  });

  const handleSearch = async () => {
    if (!searchNickname.trim()) return;
    const result = await searchQuery.refetch();
    if (result.data) {
      setSearchResults(result.data);
    }
  };

  const handleAddStudent = (playerId: number) => {
    addStudentMutation.mutate({ sessionId, classId, playerId });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-gray-800">{classData.class?.name}</h1>
          <p className="text-sm text-gray-600">Gerenciar alunos e materiais</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white rounded-2xl p-2">
        <button
          onClick={() => setTab("students")}
          className={`flex-1 py-2 rounded-xl font-bold transition-all ${
            tab === "students"
              ? "bg-purple-500 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" /> Alunos
        </button>
        <button
          onClick={() => setTab("materials")}
          className={`flex-1 py-2 rounded-xl font-bold transition-all ${
            tab === "materials"
              ? "bg-purple-500 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <BookOpen className="w-4 h-4 inline mr-2" /> Materiais
        </button>
      </div>

      {/* Students Tab */}
      {tab === "students" && (
        <div className="space-y-4">
          <button
            onClick={() => setShowAddStudent(!showAddStudent)}
            className="w-full bg-purple-500 text-white py-3 rounded-2xl font-bold hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> Adicionar Aluno
          </button>

          <AnimatePresence>
            {showAddStudent && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-2xl p-4 space-y-3"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Buscar aluno por nickname..."
                    value={searchNickname}
                    onChange={(e) => setSearchNickname(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={searchQuery.isLoading}
                    className="bg-purple-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-purple-600 disabled:opacity-50"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {searchResults.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-xl"
                      >
                        <div>
                          <p className="font-bold text-gray-800">{student.nickname}</p>
                          <p className="text-xs text-gray-500">{student.totalPoints} pontos</p>
                        </div>
                        <button
                          onClick={() => handleAddStudent(student.id)}
                          disabled={addStudentMutation.isPending}
                          className="bg-green-500 text-white px-3 py-1 rounded-lg font-bold hover:bg-green-600 disabled:opacity-50 flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" /> Adicionar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Students List */}
          <div className="space-y-2">
            {classData.students?.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-2xl">
                <p className="text-gray-600">Nenhum aluno nesta sala</p>
              </div>
            ) : (
              classData.students?.map((student: any, i: number) => (
                <motion.div
                  key={student.playerId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-xl p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-gray-800">{student.nickname}</p>
                    <p className="text-xs text-gray-500">{student.totalPoints} pontos</p>
                  </div>
                  <Eye className="w-5 h-5 text-gray-400" />
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Materials Tab */}
      {tab === "materials" && (
        <div className="space-y-4">
          <button
            className="w-full bg-purple-500 text-white py-3 rounded-2xl font-bold hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
          >
            <Upload className="w-5 h-5" /> Enviar Material
          </button>

          <div className="space-y-2">
            <div className="text-center py-8 bg-white rounded-2xl">
              <p className="text-gray-600">Nenhum material enviado</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
