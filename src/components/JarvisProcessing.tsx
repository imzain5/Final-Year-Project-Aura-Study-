import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Cpu, Zap, Brain, FileText, Layers, CheckCircle2, Sparkles, BookOpen, HelpCircle, ListTodo, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface JarvisProcessingProps {
  isActive: boolean;
  fileName: string;
  onComplete?: () => void;
}

const STATUS_MESSAGES = [
  { text: "Initializing neural scan...", icon: Cpu, delay: 0 },
  { text: "Reading document structure...", icon: FileText, delay: 2500 },
  { text: "Extracting key concepts...", icon: Brain, delay: 5500 },
  { text: "Generating flashcards...", icon: Layers, delay: 9000 },
  { text: "Building quiz questions...", icon: Zap, delay: 12500 },
  { text: "Creating study plan...", icon: Shield, delay: 16000 },
  { text: "Finalizing materials...", icon: Sparkles, delay: 19500 },
];

const NAV_CARDS = [
  { label: "Smart Notes", desc: "View AI-generated notes", icon: BookOpen, path: "/notes", gradient: "from-primary to-secondary" },
  { label: "Flashcards", desc: "Study with auto cards", icon: Layers, path: "/flashcards", gradient: "from-secondary to-pink-500" },
  { label: "Quizzes", desc: "Test your knowledge", icon: HelpCircle, path: "/quizzes", gradient: "from-accent to-cyan-400" },
  { label: "Study Plan", desc: "Your task schedule", icon: ListTodo, path: "/planner", gradient: "from-primary to-accent" },
];

const JarvisProcessing = ({ isActive, fileName, onComplete }: JarvisProcessingProps) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; duration: number; delay: number }[]>([]);
  const [dataStreams, setDataStreams] = useState<{ id: number; angle: number; length: number; delay: number }[]>([]);
  const [complete, setComplete] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive) {
      setCurrentStep(0);
      setComplete(false);
      setProgressPct(0);
      return;
    }

    startTimeRef.current = Date.now();

    const newParticles = Array.from({ length: 40 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 3 + 1, duration: Math.random() * 3 + 2, delay: Math.random() * 2,
    }));
    setParticles(newParticles);

    const newStreams = Array.from({ length: 12 }, (_, i) => ({
      id: i, angle: (360 / 12) * i, length: Math.random() * 40 + 60, delay: Math.random() * 1.5,
    }));
    setDataStreams(newStreams);

    const timers = STATUS_MESSAGES.map((msg, i) => setTimeout(() => setCurrentStep(i), msg.delay));

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setProgressPct(Math.min(95, (elapsed / 22000) * 95));
    }, 100);

    return () => { timers.forEach(clearTimeout); if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive]);

  useEffect(() => {
    if (!isActive && complete) {
      const t = setTimeout(() => setComplete(false), 500);
      return () => clearTimeout(t);
    }
  }, [isActive, complete]);

  const triggerComplete = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setProgressPct(100);
    setComplete(true);
  };

  useEffect(() => {
    if (isActive) { (window as any).__jarvisComplete = triggerComplete; }
    return () => { delete (window as any).__jarvisComplete; };
  }, [isActive]);

  const handleNavigate = (path: string) => {
    onComplete?.();
    navigate(path);
  };

  if (!isActive && !complete) return null;

  return (
    <AnimatePresence>
      {(isActive || complete) && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-8"
          style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
        >
          <div className="absolute inset-0 bg-background/90" />

          {particles.map((p) => (
            <motion.div
              key={p.id} className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: `hsl(var(--primary) / ${Math.random() * 0.5 + 0.2})` }}
              animate={{ y: [0, -30, 0], opacity: [0.2, 0.8, 0.2], scale: [1, 1.5, 1] }}
              transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}

          <div className="relative z-10 flex flex-col items-center">
            {/* Orbital animation */}
            <div className="relative w-44 h-44 md:w-56 md:h-56">
              <motion.div className="absolute inset-0 rounded-full border border-primary/20" animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>
                {[0, 90, 180, 270].map((deg) => (
                  <motion.div key={deg} className="absolute w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]"
                    style={{ top: "50%", left: "50%", transform: `rotate(${deg}deg) translateX(calc(50% + 3.2rem)) translate(-50%, -50%)` }}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity, delay: deg / 360 }} />
                ))}
              </motion.div>
              <motion.div className="absolute inset-4 md:inset-5 rounded-full border border-accent/15" animate={{ rotate: -360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }}>
                {[0, 120, 240].map((deg) => (
                  <motion.div key={deg} className="absolute w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_hsl(var(--accent))]"
                    style={{ top: "50%", left: "50%", transform: `rotate(${deg}deg) translateX(calc(50% + 2.2rem)) translate(-50%, -50%)` }}
                    animate={{ scale: [1, 2, 1], opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, delay: deg / 360 }} />
                ))}
              </motion.div>

              {dataStreams.map((stream) => (
                <motion.div key={stream.id} className="absolute h-px origin-left" style={{ top: "50%", left: "50%", width: `${stream.length}px`, transform: `rotate(${stream.angle}deg)`, background: `linear-gradient(90deg, hsl(var(--primary) / 0.4), transparent)` }}
                  animate={{ opacity: [0, 0.8, 0], scaleX: [0.3, 1, 0.3] }} transition={{ duration: 2, delay: stream.delay, repeat: Infinity, ease: "easeInOut" }} />
              ))}

              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                  <motion.div className="absolute inset-0 rounded-full blur-xl" style={{ background: `radial-gradient(circle, hsl(var(--primary) / 0.4), transparent 70%)` }} animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
                  <motion.div className="relative w-14 h-14 md:w-18 md:h-18 rounded-full gradient-primary flex items-center justify-center shadow-[0_0_40px_hsl(var(--primary)/0.5)]" animate={complete ? { scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.5 }}>
                    <AnimatePresence mode="wait">
                      {complete ? (
                        <motion.div key="done" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200 }}>
                          <CheckCircle2 className="w-7 h-7 md:w-9 md:h-9" style={{ color: "white" }} />
                        </motion.div>
                      ) : (
                        <motion.div key="brain" animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                          <Brain className="w-7 h-7 md:w-9 md:h-9" style={{ color: "white" }} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              </div>
            </div>

            {/* Status text */}
            <div className="mt-6 text-center space-y-3 w-full max-w-sm px-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex items-center justify-center gap-2">
                <div className="h-px flex-1 max-w-12 bg-gradient-to-r from-transparent to-primary/30" />
                <span className="text-[10px] text-primary/60 font-mono tracking-widest uppercase">{fileName}</span>
                <div className="h-px flex-1 max-w-12 bg-gradient-to-l from-transparent to-primary/30" />
              </motion.div>

              <AnimatePresence mode="wait">
                {complete ? (
                  <motion.div key="complete-msg" initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ type: "spring", stiffness: 150 }} className="space-y-2">
                    <h2 className="text-xl md:text-2xl font-bold text-gradient-primary tracking-tight">All Systems Ready, Sir</h2>
                    <p className="text-xs text-accent font-medium">✦ Notes · Flashcards · Quizzes · Study Plan ✦</p>
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-[10px] text-muted-foreground/50">
                      Select where to go next
                    </motion.p>
                  </motion.div>
                ) : (
                  <motion.div key={`step-${currentStep}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="flex items-center justify-center gap-2">
                    {(() => {
                      const StepIcon = STATUS_MESSAGES[currentStep]?.icon || Cpu;
                      return (
                        <>
                          <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                            <StepIcon className="w-4 h-4 text-primary" />
                          </motion.div>
                          <span className="text-sm font-medium text-foreground/80">{STATUS_MESSAGES[currentStep]?.text}</span>
                        </>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Progress bar */}
              <div className="relative w-full">
                <div className="h-1 rounded-full bg-muted/15 overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ background: complete ? "linear-gradient(90deg, hsl(var(--accent)), hsl(var(--primary)))" : "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))", width: `${progressPct}%` }} transition={{ duration: 0.3 }} />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[9px] text-muted-foreground/40 font-mono">{complete ? "COMPLETE" : "PROCESSING"}</span>
                  <span className="text-[9px] text-primary/60 font-mono font-bold">{Math.round(progressPct)}%</span>
                </div>
              </div>

              {!complete && (
                <div className="flex items-center justify-center gap-1.5">
                  {STATUS_MESSAGES.map((_, i) => (
                    <motion.div key={i} className={`h-1 rounded-full transition-all duration-300 ${i <= currentStep ? "w-4 bg-primary" : "w-1.5 bg-muted/20"}`}
                      animate={i === currentStep ? { opacity: [0.5, 1, 0.5] } : {}} transition={{ duration: 1, repeat: Infinity }} />
                  ))}
                </div>
              )}

              {!complete && (
                <motion.div className="text-[9px] text-muted-foreground/30 font-mono tracking-[0.3em] uppercase" animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity }}>
                  ◈ BrainGrid AI engine active ◈
                </motion.div>
              )}
            </div>

            {/* === POST-COMPLETION NAVIGATION CARDS === */}
            {complete && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="mt-8 w-full max-w-lg px-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  {NAV_CARDS.map((card, i) => (
                    <motion.button
                      key={card.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1 + i * 0.12, type: "spring", stiffness: 200 }}
                      onClick={() => handleNavigate(card.path)}
                      className="group relative overflow-hidden rounded-xl border border-border/15 bg-muted/10 p-4 text-left hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
                    >
                      {/* Shimmer on hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%]" style={{ transition: "transform 0.6s" }} />
                      <div className="relative flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-card flex-shrink-0 group-hover:scale-110 transition-transform`}>
                          <card.icon className="w-4 h-4" style={{ color: "white" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-foreground/90">{card.label}</span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                          </div>
                          <span className="text-[10px] text-muted-foreground/50">{card.desc}</span>
                        </div>
                      </div>
                      {/* Pulse dot */}
                      <motion.div
                        className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent"
                        animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                      />
                    </motion.button>
                  ))}
                </div>

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.6 }}
                  onClick={() => onComplete?.()}
                  className="mt-4 w-full text-center text-[10px] text-muted-foreground/40 hover:text-foreground/60 transition-colors py-2"
                >
                  or stay on uploads →
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default JarvisProcessing;
