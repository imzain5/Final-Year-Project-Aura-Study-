import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileText, Star, Grid, List, ArrowLeft, Plus, Loader2, Trash2, BookOpen, Sparkles, Brain, Hash, Clock, ChevronRight, Eye, Download, Zap, Shield, Cpu } from "lucide-react";
import { generateNotePdf } from "@/lib/generateNotePdf";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useActivityLog } from "@/hooks/useActivityLog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

interface Note {
  id: string; title: string; subject: string; content: string; summary: string; starred: boolean; created_at: string; updated_at: string;
}

const subjectColors: Record<string, string> = {};
const colorPalette = [
  "from-primary to-secondary",
  "from-secondary to-pink-500",
  "from-accent to-cyan-400",
  "from-primary to-accent",
  "from-purple-500 to-pink-500",
  "from-blue-500 to-teal-400",
];
const getSubjectGradient = (subject: string) => {
  if (!subject) return colorPalette[0];
  if (!subjectColors[subject]) {
    subjectColors[subject] = colorPalette[Object.keys(subjectColors).length % colorPalette.length];
  }
  return subjectColors[subject];
};

const Notes = () => {
  const { user } = useAuth();
  const { logActivity } = useActivityLog();
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", subject: "", content: "", summary: "" });

  useEffect(() => {
    if (!user) return;
    const fetchNotes = async () => {
      const { data, error } = await supabase.from("notes").select("*").eq("user_id", user.id).order("updated_at", { ascending: false });
      if (!error && data) setNotes(data as Note[]);
      setLoading(false);
    };
    fetchNotes();
  }, [user]);

  const toggleStar = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    const newStarred = !note.starred;
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, starred: newStarred } : n)));
    await supabase.from("notes").update({ starred: newStarred }).eq("id", id);
    toast.success(newStarred ? "Starred!" : "Unstarred");
  };

  const addNote = async () => {
    if (!newNote.title || !user) { toast.error("Title is required"); return; }
    const { data, error } = await supabase.from("notes").insert({ user_id: user.id, title: newNote.title, subject: newNote.subject, content: newNote.content, summary: newNote.summary }).select().single();
    if (error) { toast.error("Failed to create note"); return; }
    setNotes((prev) => [data as Note, ...prev]);
    setNewNote({ title: "", subject: "", content: "", summary: "" });
    setDialogOpen(false);
    logActivity("note_create", "Note Created", newNote.title);
    toast.success("Note created! 📝");
  };

  const deleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes((prev) => prev.filter((n) => n.id !== id));
    await supabase.from("notes").delete().eq("id", id);
    if (activeNote?.id === id) setActiveNote(null);
    toast("Note deleted");
  };

  const subjects = [...new Set(notes.map((n) => n.subject).filter(Boolean))];
  const starredNotes = notes.filter((n) => n.starred);
  const filtered = notes.filter((n) => {
    const matchesSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.subject?.toLowerCase().includes(search.toLowerCase());
    const matchesFolder = !activeFolder || n.subject === activeFolder;
    return matchesSearch && matchesFolder;
  });

  // Parse content sections for the detail view
  const parseContentSections = (content: string) => {
    if (!content) return [];
    const lines = content.split("\n");
    const sections: { heading: string; body: string }[] = [];
    let current: { heading: string; body: string } | null = null;

    for (const line of lines) {
      if (line.startsWith("## ") || line.startsWith("### ") || line.startsWith("# ")) {
        if (current) sections.push(current);
        current = { heading: line.replace(/^#+\s*/, ""), body: "" };
      } else {
        if (!current) current = { heading: "", body: "" };
        current.body += line + "\n";
      }
    }
    if (current) sections.push(current);
    return sections;
  };

  if (loading) return <div className="p-6 flex items-center justify-center min-h-[400px]"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  // === NOTE DETAIL VIEW ===
  if (activeNote) {
    const sections = parseContentSections(activeNote.content);
    const wordCount = activeNote.content?.split(/\s+/).filter(Boolean).length || 0;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));
    const sectionCount = sections.filter(s => s.heading).length;

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 md:p-6 space-y-5 max-w-4xl">
        {/* Back nav */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
          <Button onClick={() => setActiveNote(null)} variant="ghost" size="sm" className="h-7 text-[10px] text-muted-foreground/60 hover:text-foreground gap-1.5">
            <ArrowLeft className="w-3 h-3" /> Back to Library
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-1 text-[9px] text-muted-foreground/30 font-mono">
            <Shield className="w-3 h-3" /> SECURE DOC
          </div>
        </motion.div>

        {/* Hero header card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="relative overflow-hidden border border-border/10 p-0">
            <div className="absolute inset-0 gradient-mesh opacity-40" />
            <div className="absolute inset-0 dot-pattern opacity-30" />
            {/* Top accent bar */}
            <div className={`h-1 w-full bg-gradient-to-r ${getSubjectGradient(activeNote.subject)}`} />
            <div className="relative p-5 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {activeNote.subject && (
                      <Badge className={`bg-gradient-to-r ${getSubjectGradient(activeNote.subject)} text-[8px] border-0 px-2.5 py-0.5 uppercase tracking-wider`} style={{ color: 'white' }}>
                        {activeNote.subject}
                      </Badge>
                    )}
                    <span className="text-[8px] text-muted-foreground/30 font-mono uppercase tracking-widest">
                      Neural Document
                    </span>
                  </div>
                  <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight leading-tight">{activeNote.title}</h1>
                  <p className="text-[10px] text-muted-foreground/40 mt-1.5 font-mono">
                    {new Date(activeNote.created_at).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button onClick={() => {
                    try {
                      generateNotePdf(activeNote);
                      toast.success("PDF exported — BrainGrid Neural Document");
                    } catch (err) {
                      console.error("PDF generation error:", err);
                      toast.error("Failed to generate PDF");
                    }
                  }} size="sm" className="h-8 text-[10px] gradient-primary shadow-glow-primary hover:shadow-elevated gap-1.5 transition-smooth">
                    <Download className="w-3.5 h-3.5" /> Export PDF
                  </Button>
                  <Button onClick={(e) => toggleStar(activeNote.id, e)} variant="ghost" size="icon" className="h-8 w-8">
                    <Star className={`w-4 h-4 ${activeNote.starred ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`} />
                  </Button>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/10">
                {[
                  { icon: Clock, label: `${readTime} min read`, value: "" },
                  { icon: Hash, label: `${wordCount} words`, value: "" },
                  { icon: Cpu, label: `${sectionCount} sections`, value: "" },
                  { icon: Zap, label: "AI Processed", value: "" },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[9px] text-muted-foreground/40 font-mono">
                    <stat.icon className="w-3 h-3 text-primary/50" />
                    {stat.label}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* AI Summary card */}
        {activeNote.summary && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="relative overflow-hidden border border-accent/15 p-0">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-accent to-accent/20" />
              <div className="p-4 pl-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0 shadow-glow-accent">
                    <Brain className="w-4 h-4" style={{ color: 'white' }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-[9px] font-bold text-accent uppercase tracking-widest">Neural Summary</h3>
                      <div className="h-px flex-1 bg-accent/10" />
                      <span className="text-[8px] text-accent/40 font-mono">AI-GEN</span>
                    </div>
                    <p className="text-xs text-foreground/75 leading-relaxed">{activeNote.summary}</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Table of contents (if multiple sections) */}
        {sectionCount > 2 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <Card className="glass-panel border border-border/10 p-4">
              <h3 className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-2 flex items-center gap-2">
                <FileText className="w-3 h-3" /> Document Index
              </h3>
              <div className="grid grid-cols-2 gap-1">
                {sections.filter(s => s.heading).map((section, i) => (
                  <div key={i} className="text-[10px] text-muted-foreground/50 flex items-center gap-2 py-1 px-2 rounded hover:bg-muted/10 transition-smooth">
                    <span className="text-primary/60 font-mono text-[8px]">{String(i + 1).padStart(2, "0")}</span>
                    <span className="truncate">{section.heading}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Content sections */}
        {sections.length > 1 ? (
          <div className="space-y-3">
            {sections.map((section, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.04 }}>
                <Card className="glass-panel border border-border/10 p-5 hover:border-primary/10 transition-smooth group">
                  {section.heading && (
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[8px] font-mono text-primary/40 bg-primary/5 px-1.5 py-0.5 rounded">{String(i + 1).padStart(2, "0")}</span>
                      <div className="w-1 h-4 rounded-full gradient-primary opacity-60" />
                      <h2 className="text-sm font-semibold text-foreground/90">{section.heading}</h2>
                      <div className="h-px flex-1 bg-border/10 group-hover:bg-primary/10 transition-smooth" />
                    </div>
                  )}
                  <div className="prose prose-invert prose-sm max-w-none text-xs text-foreground/65 leading-relaxed pl-[3.2rem]">
                    <ReactMarkdown>{section.body.trim()}</ReactMarkdown>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="glass-panel border border-border/10 p-6">
              <div className="prose prose-invert prose-sm max-w-none text-xs text-foreground/65 leading-relaxed">
                <ReactMarkdown>{activeNote.content || "No content yet."}</ReactMarkdown>
              </div>
            </Card>
          </motion.div>
        )}
      </motion.div>
    );
  }

  // === LIST VIEW ===
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-primary" /> Notes Library
          </h1>
          <p className="text-xs text-muted-foreground/60 mt-0.5">{notes.length} notes · {subjects.length} subjects · {starredNotes.length} starred</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary shadow-card hover:shadow-glow-primary text-xs h-8 transition-smooth"><Plus className="w-3.5 h-3.5 mr-1.5" /> New Note</Button>
          </DialogTrigger>
          <DialogContent className="glass-panel border border-border/15">
            <DialogHeader><DialogTitle className="text-sm">Create Note</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5"><Label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Title</Label><Input value={newNote.title} onChange={(e) => setNewNote((p) => ({ ...p, title: e.target.value }))} placeholder="Note title" className="bg-muted/10 border-border/15 h-8 text-xs" /></div>
              <div className="space-y-1.5"><Label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Subject</Label><Input value={newNote.subject} onChange={(e) => setNewNote((p) => ({ ...p, subject: e.target.value }))} placeholder="e.g. Biology" className="bg-muted/10 border-border/15 h-8 text-xs" /></div>
              <div className="space-y-1.5"><Label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Summary</Label><Input value={newNote.summary} onChange={(e) => setNewNote((p) => ({ ...p, summary: e.target.value }))} placeholder="Brief summary" className="bg-muted/10 border-border/15 h-8 text-xs" /></div>
              <div className="space-y-1.5"><Label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Content</Label><Textarea value={newNote.content} onChange={(e) => setNewNote((p) => ({ ...p, content: e.target.value }))} placeholder="Write your notes..." className="bg-muted/10 border-border/15 text-xs min-h-[100px]" /></div>
              <Button onClick={addNote} className="w-full gradient-primary shadow-card text-xs h-8">Create Note</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes..." className="pl-9 h-9 bg-muted/10 border-border/15 focus:border-primary/30 text-xs" />
        </div>
        <div className="flex items-center gap-1">
          <Button onClick={() => setViewMode("grid")} variant="ghost" size="icon" className={`h-8 w-8 ${viewMode === "grid" ? "text-primary bg-primary/10" : "text-muted-foreground/40"}`}><Grid className="w-3.5 h-3.5" /></Button>
          <Button onClick={() => setViewMode("list")} variant="ghost" size="icon" className={`h-8 w-8 ${viewMode === "list" ? "text-primary bg-primary/10" : "text-muted-foreground/40"}`}><List className="w-3.5 h-3.5" /></Button>
        </div>
      </div>

      {/* Subject pills */}
      {subjects.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setActiveFolder(null)} variant={!activeFolder ? "default" : "ghost"} size="sm" className={`text-[10px] h-7 rounded-full px-3 ${!activeFolder ? "gradient-primary" : ""}`}>
            <Hash className="w-3 h-3 mr-1" /> All
          </Button>
          {subjects.map((s) => (
            <Button
              key={s}
              onClick={() => setActiveFolder(activeFolder === s ? null : s)}
              variant={activeFolder === s ? "default" : "ghost"}
              size="sm"
              className={`text-[10px] h-7 rounded-full px-3 ${activeFolder === s ? `bg-gradient-to-r ${getSubjectGradient(s)}` : "hover:bg-muted/20"}`}
              style={activeFolder === s ? { color: 'white' } : {}}
            >
              {s}
            </Button>
          ))}
        </div>
      )}

      {/* Stats row */}
      {notes.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Notes", value: notes.length, icon: FileText, gradient: "gradient-primary" },
            { label: "Subjects", value: subjects.length, icon: BookOpen, gradient: "gradient-accent" },
            { label: "Starred", value: starredNotes.length, icon: Star, gradient: "gradient-warm" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="glass-panel border border-border/10 p-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${stat.gradient} flex items-center justify-center shadow-card`}>
                  <stat.icon className="w-4 h-4" style={{ color: 'white' }} />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{stat.value}</p>
                  <p className="text-[9px] text-muted-foreground/50">{stat.label}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Notes grid / list */}
      <AnimatePresence mode="wait">
        {viewMode === "grid" ? (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((note, i) => {
              const wordCount = note.content?.split(/\s+/).filter(Boolean).length || 0;
              return (
                <motion.div key={note.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card onClick={() => setActiveNote(note)} className="glass-panel-hover p-0 cursor-pointer group overflow-hidden">
                    {/* Top color bar */}
                    <div className={`h-1 w-full bg-gradient-to-r ${getSubjectGradient(note.subject)}`} />
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {note.subject && (
                            <Badge className={`bg-gradient-to-r ${getSubjectGradient(note.subject)} text-[8px] border-0 px-2`} style={{ color: 'white' }}>
                              {note.subject}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={(e) => toggleStar(note.id, e)} className="p-0.5"><Star className={`w-3.5 h-3.5 ${note.starred ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/25 hover:text-yellow-400"} transition-smooth`} /></button>
                          <button onClick={(e) => deleteNote(note.id, e)} className="p-0.5 opacity-0 group-hover:opacity-100 transition-smooth"><Trash2 className="w-3.5 h-3.5 text-muted-foreground/25 hover:text-destructive" /></button>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground/90 mb-1 line-clamp-1">{note.title}</h3>
                        <p className="text-[11px] text-muted-foreground/50 line-clamp-3 leading-relaxed">{note.summary || note.content?.slice(0, 150)}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border/10">
                        <div className="flex items-center gap-2 text-[9px] text-muted-foreground/35 font-mono">
                          <span>{new Date(note.updated_at).toLocaleDateString()}</span>
                          <span>·</span>
                          <span>{wordCount} words</span>
                        </div>
                        <span className="text-[9px] text-primary/60 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-smooth">
                          <Eye className="w-3 h-3" /> Read
                        </span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1.5">
            {filtered.map((note, i) => (
              <motion.div key={note.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                <Card onClick={() => setActiveNote(note)} className="glass-panel-hover p-3.5 cursor-pointer flex items-center gap-3 group">
                  <div className={`w-1 h-8 rounded-full bg-gradient-to-b ${getSubjectGradient(note.subject)} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-semibold text-foreground/90">{note.title}</h3>
                    <p className="text-[10px] text-muted-foreground/45 truncate">{note.summary || note.content?.slice(0, 80)}</p>
                  </div>
                  {note.subject && <Badge variant="outline" className="border-primary/12 text-primary/60 text-[9px] flex-shrink-0">{note.subject}</Badge>}
                  <button onClick={(e) => toggleStar(note.id, e)} className="p-0.5 flex-shrink-0"><Star className={`w-3.5 h-3.5 ${note.starred ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/25"}`} /></button>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/20 group-hover:text-primary/50 transition-smooth flex-shrink-0" />
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl gradient-primary mx-auto mb-4 flex items-center justify-center opacity-20">
            <FileText className="w-8 h-8" style={{ color: 'white' }} />
          </div>
          <p className="text-sm text-muted-foreground/50">{notes.length === 0 ? "No notes yet" : "No notes match your search"}</p>
          <p className="text-[10px] text-muted-foreground/30 mt-1">{notes.length === 0 ? "Upload a document to auto-generate AI notes" : "Try a different filter"}</p>
        </div>
      )}
    </div>
  );
};

export default Notes;
