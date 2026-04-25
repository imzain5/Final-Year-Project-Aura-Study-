import { useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RotateCcw, Check, X, Shuffle, Play, ChevronLeft, ChevronRight, Layers, Trophy, Plus, Loader2, Sparkles, Brain, Zap, BookOpen, Target, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useActivityLog } from "@/hooks/useActivityLog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";

interface FlashCard { q: string; a: string; detail?: string; }
interface Deck { id: string; name: string; cards: FlashCard[]; created_at?: string; }

const SUBJECT_COLORS: Record<string, string> = {
  Biology: "from-emerald-500 to-teal-500",
  Chemistry: "from-orange-500 to-red-500",
  Physics: "from-blue-500 to-indigo-500",
  Math: "from-purple-500 to-pink-500",
  History: "from-amber-500 to-yellow-500",
};

const getGradient = (name: string) => {
  for (const [key, val] of Object.entries(SUBJECT_COLORS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return "from-primary to-secondary";
};

const Flashcards = () => {
  const { user } = useAuth();
  const { logActivity } = useActivityLog();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [unknown, setUnknown] = useState<Set<number>>(new Set());
  const [sessionComplete, setSessionComplete] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDeck, setNewDeck] = useState({ name: "", cardsText: "" });

  useEffect(() => {
    if (!user) return;
    const fetchDecks = async () => {
      const { data } = await supabase.from("flashcard_decks").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (data) {
        setDecks(data.map((d: any) => ({ id: d.id, name: d.name, cards: (d.cards as unknown as FlashCard[]) || [], created_at: d.created_at })));
      }
      setLoading(false);
    };
    fetchDecks();
  }, [user]);

  const activeDeck = decks.find((d) => d.id === activeDeckId);
  const cards = activeDeck?.cards || [];
  const totalCards = decks.reduce((acc, d) => acc + d.cards.length, 0);

  const resetSession = () => { setCurrentCard(0); setFlipped(false); setKnown(new Set()); setUnknown(new Set()); setSessionComplete(false); };
  const switchDeck = (id: string) => { setActiveDeckId(id); resetSession(); };

  const handleKnow = useCallback(() => {
    setKnown((prev) => new Set(prev).add(currentCard));
    setUnknown((prev) => { const n = new Set(prev); n.delete(currentCard); return n; });
    if (currentCard < cards.length - 1) { setCurrentCard((c) => c + 1); setFlipped(false); } else {
      setSessionComplete(true);
      logActivity("flashcard_session", "Flashcard Session", `${activeDeck?.name} — ${known.size + 1}/${cards.length} known`);
    }
    toast.success("Known ✓");
  }, [currentCard, cards.length, known.size, activeDeck?.name, logActivity]);

  const handleDontKnow = useCallback(() => {
    setUnknown((prev) => new Set(prev).add(currentCard));
    setKnown((prev) => { const n = new Set(prev); n.delete(currentCard); return n; });
    if (currentCard < cards.length - 1) { setCurrentCard((c) => c + 1); setFlipped(false); } else { setSessionComplete(true); }
    toast("Will review later");
  }, [currentCard, cards.length]);

  const createDeck = async () => {
    if (!newDeck.name || !user) { toast.error("Deck name required"); return; }
    const parsedCards: FlashCard[] = newDeck.cardsText.split("\n").filter((l) => l.trim()).map((line) => { const [q, a] = line.split("|").map((s) => s.trim()); return { q: q || line, a: a || "Answer needed" }; });
    const { data, error } = await supabase.from("flashcard_decks").insert({ user_id: user.id, name: newDeck.name, cards: (parsedCards.length > 0 ? parsedCards : [{ q: "Sample question", a: "Sample answer" }]) as any }).select().single();
    if (error) { toast.error("Failed"); return; }
    setDecks((prev) => [{ id: data.id, name: data.name, cards: (data.cards as unknown as FlashCard[]) || [], created_at: data.created_at }, ...prev]);
    setNewDeck({ name: "", cardsText: "" }); setDialogOpen(false);
    logActivity("deck_create", "Deck Created", newDeck.name);
    toast.success("Deck created! 🎴");
  };

  const score = cards.length > 0 ? Math.round((known.size / cards.length) * 100) : 0;

  if (loading) return <div className="p-6 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  const stats = [
    { label: "Total Decks", value: String(decks.length), icon: Layers, gradient: "gradient-primary" },
    { label: "Total Cards", value: String(totalCards), icon: BookOpen, gradient: "gradient-accent" },
    { label: "AI Generated", value: String(decks.filter(d => d.cards.length > 3).length), icon: Sparkles, gradient: "gradient-warm" },
    { label: "Mastery", value: activeDeck ? `${score}%` : "—", icon: Target, gradient: "gradient-primary" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Brain className="w-7 h-7 text-primary" /> Flashcards
          </h1>
          <p className="text-xs text-muted-foreground/70 mt-0.5">{decks.length} decks · {totalCards} cards total</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="text-xs h-8 text-muted-foreground hover:text-foreground gap-1.5"><Plus className="w-3.5 h-3.5" /> New Deck</Button>
            </DialogTrigger>
            <DialogContent className="glass-panel border border-border/15">
              <DialogHeader><DialogTitle className="text-sm">Create Deck</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5"><Label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Deck Name</Label><Input value={newDeck.name} onChange={(e) => setNewDeck((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Chemistry" className="bg-muted/10 border-border/15 h-8 text-xs" /></div>
                <div className="space-y-1.5"><Label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Cards (Q | A per line)</Label><Textarea value={newDeck.cardsText} onChange={(e) => setNewDeck((p) => ({ ...p, cardsText: e.target.value }))} placeholder={"What is H₂O? | Water"} className="bg-muted/10 border-border/15 text-xs min-h-[100px]" /></div>
                <Button onClick={createDeck} className="w-full gradient-primary shadow-card text-xs h-8">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
          {activeDeck && <Button onClick={resetSession} className="gradient-primary shadow-card text-xs h-8 gap-1.5"><RotateCcw className="w-3.5 h-3.5" /> Restart</Button>}
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {stats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="glass-panel-hover p-3.5">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl ${stat.gradient} flex items-center justify-center shadow-card`}>
                  <stat.icon className="w-4 h-4" style={{ color: 'white' }} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground/60">{stat.label}</p>
                  <p className="text-lg font-bold text-foreground leading-tight">{stat.value}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Active Study Session */}
      {activeDeck && cards.length > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="glass-panel border border-border/15 p-6 relative overflow-hidden">
            {/* Subtle gradient bar at top */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getGradient(activeDeck.name)}`} />
            <div className="max-w-3xl mx-auto space-y-5 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Badge variant="outline" className="border-primary/12 text-primary/70 text-[9px]">{activeDeck.name}</Badge>
                  <span className="text-[10px] text-muted-foreground/50 font-mono">{currentCard + 1}/{cards.length}</span>
                  <span className="text-[10px] text-accent font-medium">{known.size} ✓</span>
                  <span className="text-[10px] text-destructive/70 font-medium">{unknown.size} ✗</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-accent/10 text-accent text-[8px] border-accent/15"><Sparkles className="w-2.5 h-2.5 mr-0.5" />AI Generated</Badge>
                  <Button onClick={resetSession} variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/40"><RotateCcw className="w-3 h-3" /></Button>
                </div>
              </div>

              <Progress value={((currentCard + 1) / cards.length) * 100} className="h-1.5" />

              {sessionComplete ? (
                <div className="min-h-[280px] glass-panel border-2 border-accent/15 rounded-2xl p-8 flex items-center justify-center">
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4">
                    <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 1, repeat: 2 }}>
                      <Trophy className="w-16 h-16 text-accent mx-auto" />
                    </motion.div>
                    <h2 className="text-xl font-bold text-foreground">Session Complete! 🎉</h2>
                    <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-accent" /> {known.size} known</span>
                      <span className="flex items-center gap-1"><X className="w-3.5 h-3.5 text-destructive" /> {unknown.size} review</span>
                    </div>
                    <div className="text-4xl font-bold text-gradient-primary">{score}%</div>
                    <Button onClick={resetSession} className="gradient-primary shadow-card text-xs h-8"><Shuffle className="w-3.5 h-3.5 mr-1.5" /> Study Again</Button>
                  </motion.div>
                </div>
              ) : (
                <>
                  <motion.div
                    key={`${currentCard}-${flipped}`}
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => setFlipped(!flipped)}
                    className="min-h-[280px] glass-panel border-2 rounded-2xl p-8 flex items-center justify-center cursor-pointer transition-smooth border-primary/10 hover:border-primary/20 relative overflow-hidden"
                  >
                    {/* Corner decoration */}
                    <div className="absolute top-3 left-3 text-[8px] text-muted-foreground/30 font-mono">{flipped ? "ANSWER" : "QUESTION"}</div>
                    <div className="absolute top-3 right-3 text-[8px] text-muted-foreground/30 font-mono">#{currentCard + 1}</div>
                    <div className="text-center space-y-3">
                      {!flipped ? (
                        <>
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                            <Zap className="w-5 h-5 text-primary" />
                          </div>
                          <h2 className="text-xl md:text-2xl font-bold text-foreground">{cards[currentCard].q}</h2>
                          <p className="text-[10px] text-muted-foreground/40">Tap to reveal answer</p>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-2">
                            <Check className="w-5 h-5 text-accent" />
                          </div>
                          <h2 className="text-xl md:text-2xl font-bold text-gradient-primary">{cards[currentCard].a}</h2>
                          {cards[currentCard].detail && <p className="text-xs text-muted-foreground/60 max-w-lg">{cards[currentCard].detail}</p>}
                        </>
                      )}
                    </div>
                  </motion.div>
                  <div className="flex items-center justify-center gap-2.5">
                    <Button onClick={() => { setCurrentCard(Math.max(0, currentCard - 1)); setFlipped(false); }} variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground/40" disabled={currentCard === 0}><ChevronLeft className="w-4 h-4" /></Button>
                    <Button onClick={handleDontKnow} variant="outline" className="border-destructive/15 text-destructive/80 hover:bg-destructive/5 h-9 text-xs gap-1.5 px-5"><X className="w-3.5 h-3.5" /> Don't Know</Button>
                    <Button onClick={handleKnow} className="gradient-primary shadow-card h-9 text-xs gap-1.5 px-5"><Check className="w-3.5 h-3.5" /> I Know This</Button>
                    <Button onClick={() => { setCurrentCard(Math.min(cards.length - 1, currentCard + 1)); setFlipped(false); }} variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground/40" disabled={currentCard === cards.length - 1}><ChevronRight className="w-4 h-4" /></Button>
                  </div>
                </>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Deck Grid */}
      <div>
        <h2 className="text-[11px] font-semibold text-foreground/70 mb-3 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-primary" /> Your Decks</h2>
        {decks.length === 0 ? (
          <Card className="glass-panel border border-border/15 p-10 text-center">
            <Layers className="w-12 h-12 mx-auto mb-3 text-muted-foreground/15" />
            <p className="text-sm font-medium text-foreground/60 mb-1">No flashcard decks yet</p>
            <p className="text-xs text-muted-foreground/40">Upload a document to auto-generate, or create manually</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {decks.map((deck, i) => {
              const isActive = activeDeckId === deck.id;
              const grad = getGradient(deck.name);
              return (
                <motion.div key={deck.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className={`glass-panel-hover p-0 cursor-pointer overflow-hidden ${isActive ? "border-primary/25 shadow-glow-primary" : ""}`} onClick={() => switchDeck(deck.id)}>
                    {/* Color bar */}
                    <div className={`h-1 bg-gradient-to-r ${grad}`} />
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-semibold text-foreground/90">{deck.name}</h3>
                        {isActive && <Badge className="gradient-primary text-[8px] border-0" style={{ color: 'white' }}>Active</Badge>}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded-lg bg-muted/8 border border-border/8 text-center">
                          <p className="text-lg font-bold text-foreground">{deck.cards.length}</p>
                          <p className="text-[9px] text-muted-foreground/50">Cards</p>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/8 border border-border/8 text-center">
                          <p className="text-lg font-bold text-accent">{isActive ? `${score}%` : "—"}</p>
                          <p className="text-[9px] text-muted-foreground/50">Mastery</p>
                        </div>
                      </div>
                      <Button size="sm" variant={isActive ? "default" : "ghost"} className={`w-full text-[10px] h-7 ${isActive ? "gradient-primary shadow-card" : "text-muted-foreground/60"}`} style={isActive ? { color: 'white' } : {}}>
                        <Play className="w-3 h-3 mr-1" /> {isActive ? "Studying" : "Study Now"}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Flashcards;
