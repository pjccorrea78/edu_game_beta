import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface LessonVideoProps {
  discipline: string;
  grade: number;
  onClose: () => void;
  onComplete: () => void;
}

interface LessonData {
  title: string;
  discipline: string;
  grade: number;
  duration: number;
  points: Array<{
    duration: number;
    text: string;
    topic: string;
  }>;
  images: Array<{
    topic: string;
    url: string;
  }>;
}

export default function LessonVideo({
  discipline,
  grade,
  onClose,
  onComplete,
}: LessonVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [lessonData, setLessonData] = useState<LessonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fetchedRef = useRef(false);

  // Fetch lesson data - only once
  const generateLessonMutation = trpc.lesson.generateLessonVideo.useMutation();

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    let isMounted = true;

    const fetchLesson = async () => {
      try {
        setIsLoading(true);
        const result = await generateLessonMutation.mutateAsync({
          discipline,
          grade,
        });

        if (!isMounted) return;

        if ("error" in result) {
          setError(result.error || "Erro desconhecido");
          return;
        }

        setLessonData(result.lesson);
      } catch (err) {
        if (isMounted) {
          setError("Falha ao gerar aula. Tente novamente.");
          console.error(err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchLesson();

    return () => {
      isMounted = false;
    };
  }, []);

  // Timer logic - increment elapsed time
  useEffect(() => {
    if (!isPlaying || !lessonData) return;

    intervalRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, lessonData]);

  // Check if current point is complete and advance
  useEffect(() => {
    if (!lessonData || !isPlaying) return;

    const currentPoint = lessonData.points[currentPointIndex];
    if (!currentPoint) return;

    if (elapsedTime >= currentPoint.duration) {
      if (currentPointIndex < lessonData.points.length - 1) {
        setCurrentPointIndex((prev) => prev + 1);
        setElapsedTime(0);
      } else {
        setIsPlaying(false);
      }
    }
  }, [elapsedTime, currentPointIndex, lessonData, isPlaying]);

  // Speak current point text
  useEffect(() => {
    if (!lessonData || !isPlaying) return;

    const currentPoint = lessonData.points[currentPointIndex];
    if (!currentPoint) return;

    // Use Web Speech API
    const utterance = new SpeechSynthesisUtterance(currentPoint.text);
    utterance.lang = "pt-BR";
    utterance.rate = 0.9;
    utterance.volume = isMuted ? 0 : 1;

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }

    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [currentPointIndex, isPlaying, isMuted]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-lg font-semibold">Gerando aula...</p>
            <p className="text-sm text-gray-600">Isso pode levar alguns segundos</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !lessonData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <h2 className="text-xl font-bold mb-4">Erro ao gerar aula</h2>
          <p className="text-gray-600 mb-6">{error || "Tente novamente mais tarde"}</p>
          <Button onClick={onClose} className="w-full">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const currentPoint = lessonData.points[currentPointIndex];
  const currentImage = lessonData.images[currentPointIndex];
  const progress = ((currentPointIndex + elapsedTime / currentPoint.duration) / lessonData.points.length) * 100;
  const isComplete = currentPointIndex === lessonData.points.length - 1 && !isPlaying;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        ref={containerRef}
        className="relative w-full h-full max-w-4xl max-h-screen bg-gradient-to-b from-blue-50 to-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{lessonData.title}</h1>
            <p className="text-blue-100 text-sm">Aula de {lessonData.discipline}</p>
          </div>
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-200">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col md:flex-row gap-6 p-8 overflow-auto">
          {/* Image */}
          <div className="flex-1 flex items-center justify-center">
            {currentImage?.url ? (
              <img
                src={currentImage.url}
                alt={currentPoint.topic}
                className="max-w-full max-h-96 rounded-xl shadow-lg object-cover"
              />
            ) : (
              <div className="w-full h-96 bg-gradient-to-br from-blue-200 to-blue-100 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">📚</div>
                  <p className="text-blue-700 font-semibold">{currentPoint.topic}</p>
                </div>
              </div>
            )}
          </div>

          {/* Text content */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {currentPoint.topic}
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                {currentPoint.text}
              </p>
            </div>

            {/* Point counter */}
            <div className="flex gap-2 flex-wrap">
              {lessonData.points.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-3 h-3 rounded-full transition-all ${
                    idx < currentPointIndex
                      ? "bg-green-500"
                      : idx === currentPointIndex
                        ? "bg-blue-500 scale-125"
                        : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-100 border-t p-6 flex justify-between items-center gap-4">
          <div className="flex gap-2">
            <Button
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Retomar
                </>
              )}
            </Button>

            <Button
              onClick={() => setIsMuted(!isMuted)}
              variant="outline"
              className="text-gray-700"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="text-sm font-semibold text-gray-700">
            {currentPointIndex + 1} / {lessonData.points.length}
          </div>

          {isComplete && (
            <Button
              onClick={() => {
                onComplete();
                onClose();
              }}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              ✓ Aula Concluída
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
