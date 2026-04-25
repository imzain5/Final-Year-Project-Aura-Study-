import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Image, File, Music, Video, Loader2, Trash2, Download, Sparkles, Brain, Zap, BookOpen, HelpCircle, ListTodo, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import JarvisProcessing from "@/components/JarvisProcessing";

interface UploadRecord {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  status: string;
  created_at: string;
}

const getFileIcon = (type: string) => {
  if (type.includes("pdf") || type.includes("doc") || type.includes("text")) return FileText;
  if (type.includes("image")) return Image;
  if (type.includes("audio")) return Music;
  if (type.includes("video")) return Video;
  return File;
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const featureCards = [
  { icon: BookOpen, label: "Smart Notes", desc: "AI-structured notes with key concepts", gradient: "from-primary to-secondary" },
  { icon: Zap, label: "Flashcards", desc: "Auto-generated study cards", gradient: "from-secondary to-pink-500" },
  { icon: HelpCircle, label: "Quizzes", desc: "Test your understanding instantly", gradient: "from-accent to-cyan-400" },
  { icon: ListTodo, label: "Study Plan", desc: "Scheduled tasks & topics", gradient: "from-primary to-accent" },
];

const Uploads = () => {
  const { user } = useAuth();
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [jarvisActive, setJarvisActive] = useState(false);
  const [jarvisFileName, setJarvisFileName] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUploads = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("uploads")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setUploads(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchUploads(); }, [fetchUploads]);

  const processUpload = async (uploadId: string, fileName: string) => {
    setProcessing(uploadId);
    setJarvisFileName(fileName);
    setJarvisActive(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-upload`,
        { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` }, body: JSON.stringify({ upload_id: uploadId }) }
      );
      if ((window as any).__jarvisComplete) (window as any).__jarvisComplete();
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Processing failed" }));
        toast.error(err.error || "Failed");
        setJarvisActive(false);
        return;
      }
      const result = await res.json();
      setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, status: "processed" } : u)));
      setTimeout(() => {
        toast.success(`✨ Materials generated from ${fileName}!`, {
          description: `Notes, ${result.materials?.quiz_title || "quiz"}, flashcards & tasks created.`,
          duration: 6000,
        });
      }, 3000);
    } catch {
      toast.error("Failed to process file");
      setJarvisActive(false);
    } finally {
      setProcessing(null);
    }
  };

  const handleJarvisComplete = () => setJarvisActive(false);

  const handleUpload = async (files: FileList | null) => {
    if (!files || !user) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) { toast.error(`${file.name} is too large (max 20 MB)`); continue; }
      const storagePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: storageError } = await supabase.storage.from("user-uploads").upload(storagePath, file);
      if (storageError) { toast.error(`Failed to upload ${file.name}`); continue; }
      const { data: dbData, error: dbError } = await supabase.from("uploads").insert({ user_id: user.id, file_name: file.name, file_type: file.type || "application/octet-stream", file_size: file.size, storage_path: storagePath, status: "uploaded" }).select().single();
      if (dbError || !dbData) { toast.error(`Failed to save ${file.name}`); } else {
        toast.success(`${file.name} uploaded!`);
        setUploads((prev) => [dbData as UploadRecord, ...prev]);
        const supportedTypes = ["pdf", "text", "txt", "doc"];
        if (supportedTypes.some((t) => file.type.includes(t) || file.name.endsWith(`.${t}`))) processUpload(dbData.id, file.name);
      }
    }
    setUploading(false);
  };

  const handleDelete = async (upload: UploadRecord) => {
    await supabase.storage.from("user-uploads").remove([upload.storage_path]);
    await supabase.from("uploads").delete().eq("id", upload.id);
    setUploads((prev) => prev.filter((u) => u.id !== upload.id));
    toast.success("Deleted");
  };

  const handleDownload = async (upload: UploadRecord) => {
    const { data } = await supabase.storage.from("user-uploads").download(upload.storage_path);
    if (!data) { toast.error("Download failed"); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a"); a.href = url; a.download = upload.file_name; a.click(); URL.revokeObjectURL(url);
  };

  const totalSize = uploads.reduce((acc, u) => acc + u.file_size, 0);
  const storagePercent = Math.round((totalSize / (100 * 1024 * 1024)) * 100);

  const getStatusBadge = (status: string) => {
    if (status === "processed") return <Badge className="bg-accent/15 text-accent border-accent/20 text-[9px] font-medium"><Sparkles className="w-2.5 h-2.5 mr-1" />Processed</Badge>;
    if (status === "error") return <Badge variant="destructive" className="text-[9px]">Error</Badge>;
    return <Badge variant="outline" className="border-primary/15 text-primary/80 text-[9px]">Uploaded</Badge>;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px]">
      <JarvisProcessing isActive={jarvisActive} fileName={jarvisFileName} onComplete={handleJarvisComplete} />

      {/* === HERO UPLOAD ZONE === */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 shadow-glow-primary">
          {/* Animated background */}
          <div className="absolute inset-0 gradient-mesh opacity-60" />
          <div className="absolute inset-0 dot-pattern opacity-40" />
          
          {/* Animated orbs */}
          <motion.div
            className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, hsl(220 80% 62% / 0.6), transparent 70%)" }}
            animate={{ scale: [1, 1.2, 1], x: [0, 10, 0], y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, hsl(270 65% 62% / 0.6), transparent 70%)" }}
            animate={{ scale: [1, 1.15, 1], x: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />

          <div className="relative z-10 p-6 md:p-10">
            <div className="flex flex-col items-center text-center space-y-5">
              {/* Icon */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <div className="w-20 h-20 rounded-3xl gradient-primary flex items-center justify-center shadow-glow-primary">
                  {uploading ? <Loader2 className="w-9 h-9 animate-spin" style={{ color: 'white' }} /> : <Brain className="w-9 h-9" style={{ color: 'white' }} />}
                </div>
                <motion.div
                  className="absolute -inset-2 rounded-[1.5rem] border-2 border-primary/30"
                  animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>

              {/* Text */}
              <div className="space-y-2 max-w-lg">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                  Upload & <span className="text-gradient-primary">Activate AI</span>
                </h1>
                <p className="text-sm text-muted-foreground/70 leading-relaxed">
                  Drop your study material here. Our AI reads, understands, and generates 
                  <strong className="text-foreground/80"> notes, flashcards, quizzes & study plans</strong> — all in seconds.
                </p>
              </div>

              {/* Upload zone */}
              <input ref={fileInputRef} type="file" multiple className="hidden" accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.mp3,.mp4" onChange={(e) => handleUpload(e.target.files)} />
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full max-w-xl"
              >
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all duration-300 ${
                    isDragOver
                      ? "border-primary bg-primary/10 shadow-glow-primary"
                      : "border-primary/25 hover:border-primary/50 hover:bg-primary/5"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleUpload(e.dataTransfer.files); }}
                >
                  <AnimatePresence mode="wait">
                    {isDragOver ? (
                      <motion.div key="drop" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="flex flex-col items-center gap-2">
                        <Zap className="w-8 h-8 text-primary animate-pulse" />
                        <span className="text-sm font-semibold text-primary">Release to upload</span>
                      </motion.div>
                    ) : (
                      <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2">
                        <Upload className="w-6 h-6 text-primary/60" />
                        <div>
                          <span className="text-sm font-medium text-foreground/80">Click to browse</span>
                          <span className="text-sm text-muted-foreground/50"> or drag & drop</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/40">PDF, DOCX, TXT, PNG, JPG, MP3, MP4 · Max 20 MB</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* What gets generated */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl pt-2">
                {featureCards.map((f, i) => (
                  <motion.div
                    key={f.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/20 border border-border/10 hover:border-primary/20 transition-smooth group"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${f.gradient} flex items-center justify-center shadow-card group-hover:scale-110 transition-smooth`}>
                      <f.icon className="w-4 h-4" style={{ color: 'white' }} />
                    </div>
                    <span className="text-[10px] font-semibold text-foreground/80">{f.label}</span>
                    <span className="text-[9px] text-muted-foreground/50 text-center leading-tight">{f.desc}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Storage bar */}
      <Card className="glass-panel border border-border/15 p-3.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-muted-foreground/60">Storage</span>
          <span className="text-[10px] font-medium text-foreground/70 font-mono">{formatSize(totalSize)} / 100 MB</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted/15 overflow-hidden">
          <motion.div
            className="h-full rounded-full gradient-primary"
            initial={{ width: 0 }}
            animate={{ width: `${storagePercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </Card>

      {/* File List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
            Your Files
            <Badge variant="outline" className="text-[9px] border-border/20">{uploads.length}</Badge>
          </h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : uploads.length === 0 ? (
          <Card className="glass-panel p-10 text-center">
            <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/15" />
            <p className="text-xs text-muted-foreground/50">No files yet. Upload your first document above to activate all features.</p>
          </Card>
        ) : (
          <div className="space-y-1.5">
            {uploads.map((file, i) => {
              const Icon = getFileIcon(file.file_type);
              const isProcessing = processing === file.id;
              return (
                <motion.div key={file.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card className="glass-panel-hover p-3.5 group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-card">
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'white' }} /> : <Icon className="w-4 h-4" style={{ color: 'white' }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-medium text-foreground/90 truncate">{file.file_name}</h3>
                          {getStatusBadge(file.status)}
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground/50 mt-0.5 font-mono">
                          <span>{file.file_type.split("/").pop()?.toUpperCase()}</span>
                          <span>·</span>
                          <span>{formatSize(file.file_size)}</span>
                          <span>·</span>
                          <span>{new Date(file.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {file.status === "uploaded" && !isProcessing && (
                          <Button variant="ghost" size="sm" className="h-7 text-[10px] text-primary hover:text-primary gap-1" onClick={() => processUpload(file.id, file.file_name)}>
                            <Sparkles className="w-3 h-3" /> Process
                          </Button>
                        )}
                        {file.status === "processed" && (
                          <span className="text-[9px] text-accent flex items-center gap-1 mr-2"><ArrowRight className="w-3 h-3" /> Ready</span>
                        )}
                        {isProcessing && <span className="text-[9px] text-primary animate-pulse mr-2">Processing...</span>}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/50 hover:text-foreground" onClick={() => handleDownload(file)}><Download className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/50 hover:text-destructive" onClick={() => handleDelete(file)}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </div>
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

export default Uploads;
