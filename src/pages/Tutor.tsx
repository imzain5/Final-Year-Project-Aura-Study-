import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, Bot, User, Copy, Loader2, RotateCcw, FileText, BookOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { streamChat, type ChatMessage } from "@/lib/streamChat";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";

const Tutor = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [hasUploads, setHasUploads] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch user's notes to generate dynamic suggestions
  useEffect(() => {
    if (!user) return;
    const fetchContext = async () => {
      const { data: notes } = await supabase
        .from("notes")
        .select("title, subject, summary")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6);

      if (notes && notes.length > 0) {
        setHasUploads(true);
        const topics: string[] = [];
        notes.forEach((n: any) => {
          if (n.title) topics.push(`Explain the key concepts in "${n.title}"`);
          if (n.subject && topics.length < 6) topics.push(`Quiz me on ${n.subject}`);
        });
        setSuggestedTopics(topics.slice(0, 4));
      } else {
        setSuggestedTopics([
          "Explain mitosis vs meiosis",
          "What is Newton's 2nd law?",
          "How do chemical bonds form?",
          "Solve a calculus integral",
        ]);
      }
    };
    fetchContext();
  }, [user]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";
    const upsert = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    try {
      await streamChat({
        messages: allMessages,
        includeContext: true,
        onDelta: upsert,
        onDone: () => setIsLoading(false),
        onError: (err) => { toast.error(err); setIsLoading(false); },
      });
    } catch {
      toast.error("Failed to connect to AI tutor");
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(input); };
  const copyText = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied!"); };

  return (
    <div className="h-[calc(100vh-3.5rem)] p-4 md:p-6">
      <Card className="glass-panel border border-border/15 h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-5 py-3 border-b border-border/10">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow-primary animate-pulse-slow">
            <Sparkles className="w-4 h-4" style={{ color: 'white' }} />
          </div>
          <div className="flex-1">
            <h1 className="text-sm font-bold text-foreground">AI Study Tutor</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              <p className="text-[10px] text-muted-foreground/60">
                {hasUploads ? "Online · Aware of your uploads" : "Online · GPT-4"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-[11px] h-7 text-muted-foreground hover:text-foreground gap-1.5" onClick={() => setMessages([])}>
            <RotateCcw className="w-3 h-3" /> New Chat
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-5 py-4">
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.length === 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0 shadow-card mt-0.5">
                  <Bot className="w-4 h-4" style={{ color: 'white' }} />
                </div>
                <div className="px-4 py-3 rounded-xl rounded-tl-sm text-[13px] leading-relaxed bg-muted/15 border border-border/15 text-foreground/90 max-w-[85%]">
                  {hasUploads ? (
                    <>Hello! 👋 I've reviewed your uploaded study materials. I can explain concepts from your documents, quiz you on topics, or help you connect ideas. What would you like to dive into?</>
                  ) : (
                    <>Hello! 👋 I'm your AI study tutor. Upload a document first and I'll be able to give you personalized help! Or ask me anything about any concept.</>
                  )}
                </div>
              </motion.div>
            )}

            {/* File context indicator */}
            {messages.length === 0 && hasUploads && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/5 border border-accent/10 ml-11">
                <FileText className="w-3.5 h-3.5 text-accent" />
                <span className="text-[10px] text-accent/80">Your uploaded materials are loaded into context</span>
              </motion.div>
            )}

            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                  className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                  {message.role === "assistant" ? (
                    <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0 shadow-card mt-0.5">
                      <Bot className="w-4 h-4" style={{ color: 'white' }} />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg gradient-warm flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-4 h-4" style={{ color: 'white' }} />
                    </div>
                  )}
                  <div className="space-y-1.5 max-w-[85%]">
                    <div className={`px-4 py-3 rounded-xl text-[13px] leading-relaxed ${
                      message.role === "assistant" ? "bg-muted/15 border border-border/15 text-foreground/90 rounded-tl-sm" : "gradient-primary shadow-card rounded-tr-sm"
                    }`} style={message.role === "user" ? { color: 'white' } : {}}>
                      {message.role === "assistant" ? (
                        <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-line">{message.content}</p>
                      )}
                    </div>
                    {message.role === "assistant" && (
                      <div className="flex items-center gap-1 pl-1">
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground/40 hover:text-foreground" onClick={() => copyText(message.content)}>
                          <Copy className="w-2.5 h-2.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0 shadow-card mt-0.5">
                  <Bot className="w-4 h-4" style={{ color: 'white' }} />
                </div>
                <div className="px-4 py-3 rounded-xl bg-muted/15 border border-border/15">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Suggestions */}
        {messages.length === 0 && suggestedTopics.length > 0 && (
          <div className="px-5 py-2 border-t border-border/8">
            <div className="flex gap-2 overflow-x-auto max-w-3xl mx-auto pb-1">
              {suggestedTopics.map((topic, i) => (
                <motion.button key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }}
                  onClick={() => sendMessage(topic)}
                  className="px-3 py-1.5 rounded-full bg-muted/10 border border-border/15 text-[10px] text-muted-foreground/70 hover:text-foreground hover:border-primary/20 hover:bg-primary/5 transition-smooth whitespace-nowrap flex-shrink-0">
                  {topic}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="px-5 py-3 border-t border-border/10">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <Input placeholder={hasUploads ? "Ask about your uploaded materials..." : "Ask me anything about your studies..."}
              className="bg-muted/10 border-border/15 focus:border-primary/30 h-9 text-xs rounded-lg"
              value={input} onChange={(e) => setInput(e.target.value)} disabled={isLoading} />
            <Button type="submit" className="gradient-primary shadow-card hover:shadow-glow-primary h-9 px-5 text-xs transition-smooth" disabled={isLoading || !input.trim()}>
              <Send className="w-3.5 h-3.5 mr-1.5" /> Send
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Tutor;
