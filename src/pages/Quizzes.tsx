import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Trophy, Clock, Target, CheckCircle, ArrowLeft, ChevronRight, Loader2, Sparkles, Brain, Zap, BookOpen, BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useActivityLog } from "@/hooks/useActivityLog";
import { motion, AnimatePresence } from "framer-motion";

interface Question { question: string; options: string[]; correct: number; }
interface QuizItem { id: string; title: string; subject: string; questions: Question[]; isGenerated: boolean; }

const SUBJECT_COLORS: Record<string, string> = {
  Biology: "from-emerald-500 to-teal-500",
  Chemistry: "from-orange-500 to-red-500",
  Physics: "from-blue-500 to-indigo-500",
  Math: "from-purple-500 to-pink-500",
  History: "from-amber-500 to-yellow-500",
};

const getGradient = (subject: string) => {
  for (const [key, val] of Object.entries(SUBJECT_COLORS)) {
    if (subject.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return "from-primary to-secondary";
};

const Quizzes = () => {
  const { user } = useAuth();
  const { logActivity } = useActivityLog();
  const [allQuizzes, setAllQuizzes] = useState<QuizItem[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<QuizItem | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [completedQuizzes, setCompletedQuizzes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: genQuizzes } = await supabase.from("generated_quizzes").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      const generated: QuizItem[] = (genQuizzes || []).map((q: any) => ({ id: q.id, title: q.title, subject: q.subject || "General", questions: (q.questions as Question[]) || [], isGenerated: true }));
      setAllQuizzes(generated);
      const { data: results } = await supabase.from("quiz_results").select("quiz_title, score, total_questions").eq("user_id", user.id);
      if (results) { const best: Record<string, number> = {}; results.forEach((r: any) => { const pct = Math.round((r.score / r.total_questions) * 100); best[r.quiz_title] = Math.max(best[r.quiz_title] || 0, pct); }); setCompletedQuizzes(best); }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const startQuiz = (quiz: QuizItem) => { if (!quiz.questions.length) { toast.error("No questions"); return; } setActiveQuiz(quiz); setCurrentQ(0); setSelected(null); setAnswers(new Array(quiz.questions.length).fill(null)); setShowResult(false); setStreak(0); };

  const handleSelect = (i: number) => {
    if (selected !== null || !activeQuiz) return;
    setSelected(i);
    const newA = [...answers]; newA[currentQ] = i; setAnswers(newA);
    const q = activeQuiz.questions[currentQ];
    if (i === q.correct) {
      setStreak(s => s + 1);
      toast.success(streak >= 2 ? `🔥 ${streak + 1} streak! Correct!` : "Correct! 🎉");
    } else {
      setStreak(0);
      toast.error(`Wrong! Answer: ${q.options[q.correct]}`);
    }
  };

  const nextQuestion = async () => {
    if (!activeQuiz) return;
    const questions = activeQuiz.questions;
    if (currentQ < questions.length - 1) { setCurrentQ((c) => c + 1); setSelected(null); } else {
      const score = answers.reduce((acc, ans, i) => acc + (ans === questions[i].correct ? 1 : 0), 0);
      const pct = Math.round((score / questions.length) * 100);
      setCompletedQuizzes((prev) => ({ ...prev, [activeQuiz.title]: Math.max(prev[activeQuiz.title] || 0, pct) }));
      setShowResult(true);
      if (user) { await supabase.from("quiz_results").insert({ user_id: user.id, quiz_title: activeQuiz.title, score, total_questions: questions.length, answers: answers as any }); logActivity("quiz_complete", "Quiz Completed", `${activeQuiz.title} — ${pct}%`); }
    }
  };

  const exitQuiz = () => { setActiveQuiz(null); setShowResult(false); };

  if (loading) return <div className="p-6 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  // Results screen
  if (activeQuiz && showResult) {
    const questions = activeQuiz.questions;
    const score = answers.reduce((acc, ans, i) => acc + (ans === questions[i].correct ? 1 : 0), 0);
    const pct = Math.round((score / questions.length) * 100);
    const grade = pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B" : pct >= 60 ? "C" : "D";

    return (
      <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Card className="glass-panel border border-border/15 p-8 text-center space-y-6 relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${pct >= 80 ? "from-accent to-emerald-400" : pct >= 50 ? "from-primary to-secondary" : "from-destructive to-orange-500"}`} />
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 1, repeat: 2 }}>
              <Trophy className={`w-16 h-16 mx-auto ${pct >= 80 ? "text-accent" : pct >= 50 ? "text-primary" : "text-destructive"}`} />
            </motion.div>
            <h1 className="text-2xl font-bold text-foreground">Quiz Complete!</h1>
            <p className="text-xs text-muted-foreground/60">{activeQuiz.title}</p>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-muted/10 border border-border/10">
                <p className="text-3xl font-bold text-gradient-primary">{pct}%</p>
                <p className="text-[9px] text-muted-foreground/50 mt-1">Score</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/10 border border-border/10">
                <p className="text-3xl font-bold text-foreground">{grade}</p>
                <p className="text-[9px] text-muted-foreground/50 mt-1">Grade</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/10 border border-border/10">
                <p className="text-3xl font-bold text-accent">{score}/{questions.length}</p>
                <p className="text-[9px] text-muted-foreground/50 mt-1">Correct</p>
              </div>
            </div>

            <Progress value={pct} className="h-1.5 max-w-xs mx-auto" />

            {/* Question review */}
            <div className="text-left space-y-2 max-h-[200px] overflow-y-auto">
              {questions.map((q, i) => {
                const isCorrect = answers[i] === q.correct;
                return (
                  <div key={i} className={`p-2.5 rounded-lg text-xs border ${isCorrect ? "bg-accent/5 border-accent/15" : "bg-destructive/5 border-destructive/15"}`}>
                    <div className="flex items-start gap-2">
                      {isCorrect ? <CheckCircle className="w-3.5 h-3.5 text-accent mt-0.5 flex-shrink-0" /> : <span className="w-3.5 h-3.5 rounded-full border-2 border-destructive flex-shrink-0 mt-0.5" />}
                      <div>
                        <p className="text-foreground/80 font-medium">{q.question}</p>
                        {!isCorrect && <p className="text-[10px] text-accent mt-0.5">Correct: {q.options[q.correct]}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 justify-center pt-2">
              <Button onClick={() => startQuiz(activeQuiz)} variant="ghost" className="text-xs h-8">Retake</Button>
              <Button onClick={exitQuiz} className="gradient-primary shadow-card text-xs h-8">Back to Quizzes</Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Active quiz question
  if (activeQuiz) {
    const questions = activeQuiz.questions;
    const correctSoFar = answers.slice(0, currentQ).filter((a, i) => a === questions[i].correct).length;

    return (
      <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
          <Button onClick={exitQuiz} variant="ghost" size="icon" className="h-7 w-7"><ArrowLeft className="w-3.5 h-3.5" /></Button>
          <div className="flex-1">
            <h1 className="text-sm font-bold text-foreground">{activeQuiz.title}</h1>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50">
              <span className="font-mono">{currentQ + 1} / {questions.length}</span>
              {streak >= 2 && <Badge className="bg-orange-500/15 text-orange-400 border-orange-500/20 text-[8px]">🔥 {streak} streak</Badge>}
              <span className="text-accent">{correctSoFar} correct</span>
            </div>
          </div>
          <Badge className="bg-accent/12 text-accent border-accent/15 text-[8px]"><Sparkles className="w-2.5 h-2.5 mr-1" />AI</Badge>
        </motion.div>

        <Progress value={((currentQ + 1) / questions.length) * 100} className="h-1.5" />

        <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
          <Card className="glass-panel border border-border/15 p-6 space-y-5 relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getGradient(activeQuiz.subject)}`} />
            <div className="flex items-start gap-3 pt-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-base font-bold text-foreground flex-1">{questions[currentQ].question}</h2>
            </div>
            <div className="space-y-2.5">
              {questions[currentQ].options.map((opt, i) => {
                let cls = "w-full text-left p-4 rounded-xl border text-xs transition-all duration-300 ";
                if (selected !== null) {
                  if (i === questions[currentQ].correct) cls += "border-accent/30 bg-accent/8 text-accent shadow-[0_0_15px_hsl(var(--accent)/0.1)]";
                  else if (i === selected) cls += "border-destructive/30 bg-destructive/8 text-destructive";
                  else cls += "border-border/10 bg-muted/5 text-muted-foreground/40 opacity-50";
                } else cls += "border-border/15 bg-muted/5 text-foreground/80 hover:border-primary/25 hover:bg-primary/5 hover:shadow-card cursor-pointer";
                return (
                  <motion.button key={i} onClick={() => handleSelect(i)} className={cls} disabled={selected !== null}
                    whileHover={selected === null ? { scale: 1.01 } : {}} whileTap={selected === null ? { scale: 0.99 } : {}}>
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold ${
                        selected !== null && i === questions[currentQ].correct ? "bg-accent/20 text-accent" :
                        selected !== null && i === selected ? "bg-destructive/20 text-destructive" :
                        "bg-muted/15 text-muted-foreground/50"
                      }`}>{String.fromCharCode(65 + i)}</span>
                      <span className="font-medium">{opt}</span>
                      {selected !== null && i === questions[currentQ].correct && <CheckCircle className="w-4 h-4 text-accent ml-auto" />}
                    </div>
                  </motion.button>
                );
              })}
            </div>
            {selected !== null && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                <Button onClick={nextQuestion} className="w-full gradient-primary shadow-card h-10 text-xs">
                  {currentQ < questions.length - 1 ? <>Next Question <ChevronRight className="w-3.5 h-3.5 ml-1" /></> : <>View Results <Trophy className="w-3.5 h-3.5 ml-1" /></>}
                </Button>
              </motion.div>
            )}
          </Card>
        </motion.div>
      </div>
    );
  }

  // Quiz list
  const totalCompleted = Object.keys(completedQuizzes).length;
  const avgScore = totalCompleted ? Math.round(Object.values(completedQuizzes).reduce((a, b) => a + b, 0) / totalCompleted) : 0;
  const perfectCount = Object.values(completedQuizzes).filter((s) => s === 100).length;
  const totalQuestions = allQuizzes.reduce((acc, q) => acc + q.questions.length, 0);

  const stats = [
    { label: "Completed", value: String(totalCompleted), icon: Trophy, gradient: "gradient-primary" },
    { label: "Avg Score", value: totalCompleted ? `${avgScore}%` : "—", icon: Target, gradient: "gradient-accent" },
    { label: "Questions", value: String(totalQuestions), icon: BookOpen, gradient: "gradient-warm" },
    { label: "Perfect", value: String(perfectCount), icon: CheckCircle, gradient: "gradient-primary" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px]">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Zap className="w-7 h-7 text-accent" /> Quizzes
        </h1>
        <p className="text-xs text-muted-foreground/70 mt-0.5">Test your knowledge with AI-generated quizzes</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {stats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="glass-panel-hover p-3.5">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl ${stat.gradient} flex items-center justify-center shadow-card`}><stat.icon className="w-4 h-4" style={{ color: 'white' }} /></div>
                <div><p className="text-[10px] text-muted-foreground/60">{stat.label}</p><p className="text-lg font-bold text-foreground leading-tight">{stat.value}</p></div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {allQuizzes.length > 0 ? (
        <div>
          <h2 className="text-[11px] font-semibold text-foreground/70 mb-3 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-accent" /> Your Quizzes</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {allQuizzes.map((quiz, i) => {
              const bestScore = completedQuizzes[quiz.title];
              const grad = getGradient(quiz.subject);
              return (
                <motion.div key={quiz.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="glass-panel-hover p-0 overflow-hidden">
                    <div className={`h-1 bg-gradient-to-r ${grad}`} />
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5 flex-1">
                          <h3 className="text-xs font-semibold text-foreground/90">{quiz.title}</h3>
                          <div className="flex items-center gap-2 text-[9px] text-muted-foreground/50 font-mono">
                            <span>{quiz.questions.length} questions</span>
                            <span>·</span>
                            <span>{quiz.subject}</span>
                          </div>
                        </div>
                        <Badge className="bg-accent/12 text-accent border-accent/15 text-[8px]"><Sparkles className="w-2.5 h-2.5 mr-0.5" />AI</Badge>
                      </div>

                      {bestScore !== undefined ? (
                        <div className="p-3 rounded-lg bg-muted/8 border border-border/10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] text-muted-foreground/50">Best Score</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-foreground">{bestScore}%</span>
                              {bestScore === 100 && <span className="text-[9px]">🏆</span>}
                            </div>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted/15 overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full bg-gradient-to-r ${bestScore >= 90 ? "from-accent to-emerald-400" : bestScore >= 75 ? "from-primary to-secondary" : "from-orange-500 to-red-500"}`}
                              initial={{ width: 0 }} animate={{ width: `${bestScore}%` }} transition={{ duration: 1, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-center">
                          <p className="text-[10px] text-primary/70 font-medium">Not attempted yet</p>
                        </div>
                      )}

                      <Button onClick={() => startQuiz(quiz)} className={`w-full h-8 text-[10px] ${bestScore !== undefined ? "" : "gradient-primary shadow-card"}`} variant={bestScore !== undefined ? "ghost" : "default"} style={bestScore === undefined ? { color: 'white' } : {}}>
                        <Play className="w-3 h-3 mr-1" />{bestScore !== undefined ? "Retake Quiz" : "Start Quiz"}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="glass-panel border border-border/15 p-10 text-center">
          <Zap className="w-12 h-12 mx-auto mb-3 text-muted-foreground/15" />
          <p className="text-sm font-medium text-foreground/60 mb-1">No quizzes yet</p>
          <p className="text-xs text-muted-foreground/40">Upload a document to auto-generate quizzes with AI</p>
        </Card>
      )}
    </div>
  );
};

export default Quizzes;
