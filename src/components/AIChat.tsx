import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, Bot, User, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { streamChat, type ChatMessage } from "@/lib/streamChat";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";

const AIChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasUploads, setHasUploads] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!user) return;
    supabase.from("notes").select("id").eq("user_id", user.id).limit(1)
      .then(({ data }) => { if (data && data.length > 0) setHasUploads(true); });
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

  return (
    <Card className="glass-panel border border-border/15 flex flex-col h-[440px] overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/10">
        <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center shadow-card animate-pulse-slow">
          <Sparkles className="w-3.5 h-3.5" style={{ color: 'white' }} />
        </div>
        <div className="flex-1">
          <h3 className="text-xs font-semibold text-foreground">AI Study Tutor</h3>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <p className="text-[9px] text-muted-foreground/60">{hasUploads ? "Context loaded" : "Online"}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5">
            <div className="w-6 h-6 rounded-md gradient-primary flex items-center justify-center flex-shrink-0 shadow-card mt-0.5">
              <Bot className="w-3 h-3" style={{ color: 'white' }} />
            </div>
            <div className="max-w-[80%] px-3 py-2.5 rounded-xl rounded-tl-sm text-[12px] leading-relaxed bg-muted/15 border border-border/15 text-foreground/90">
              {hasUploads
                ? "Hey! 👋 I know your study materials. Ask me anything about your uploads!"
                : "Hello! 👋 I'm your AI study tutor. Ask me about any concept and I'll help you learn!"}
            </div>
          </motion.div>
        )}
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
              className={`flex gap-2.5 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
              {message.role === "assistant" ? (
                <div className="w-6 h-6 rounded-md gradient-primary flex items-center justify-center flex-shrink-0 shadow-card mt-0.5">
                  <Bot className="w-3 h-3" style={{ color: 'white' }} />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-md bg-muted/30 flex items-center justify-center flex-shrink-0 border border-border/20 mt-0.5">
                  <User className="w-3 h-3 text-muted-foreground" />
                </div>
              )}
              <div className={`max-w-[80%] px-3 py-2.5 rounded-xl text-[12px] leading-relaxed ${
                message.role === "assistant" ? "bg-muted/15 border border-border/15 text-foreground/90 rounded-tl-sm" : "gradient-primary text-foreground shadow-card rounded-tr-sm"
              }`} style={message.role === "user" ? { color: 'white' } : {}}>
                {message.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                ) : message.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex gap-2.5">
            <div className="w-6 h-6 rounded-md gradient-primary flex items-center justify-center flex-shrink-0 shadow-card mt-0.5">
              <Bot className="w-3 h-3" style={{ color: 'white' }} />
            </div>
            <div className="px-3 py-2.5 rounded-xl bg-muted/15 border border-border/15">
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

      <form onSubmit={handleSubmit} className="px-4 py-2.5 border-t border-border/10">
        <div className="flex gap-2">
          <Input placeholder={hasUploads ? "Ask about your materials..." : "Ask about any concept..."} className="bg-muted/10 border-border/15 focus:border-primary/30 h-8 text-xs rounded-lg"
            value={input} onChange={(e) => setInput(e.target.value)} disabled={isLoading} />
          <Button type="submit" size="icon" className="gradient-primary shadow-card h-8 w-8 flex-shrink-0 hover:shadow-glow-primary transition-smooth" disabled={isLoading || !input.trim()}>
            <Send className="w-3 h-3" />
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default AIChat;
