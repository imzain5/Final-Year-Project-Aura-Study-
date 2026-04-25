import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { messages, include_context } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    let contextBlock = "";

    // If client requests context, fetch user's notes to make tutor file-aware
    if (include_context) {
      const authHeader = req.headers.get("Authorization") || "";
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: notes } = await supabase
          .from("notes")
          .select("title, subject, summary, content")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (notes && notes.length > 0) {
          contextBlock = "\n\n--- STUDENT'S UPLOADED STUDY MATERIALS ---\n" +
            notes.map((n: any, i: number) =>
              `[${i + 1}] "${n.title}" (${n.subject || "General"})\nSummary: ${n.summary || "N/A"}\nContent preview: ${(n.content || "").slice(0, 800)}`
            ).join("\n\n") +
            "\n--- END MATERIALS ---\n\nUse the above materials to give personalized answers. Reference specific topics from their uploads when relevant.";
        }
      }
    }

    const systemPrompt = `You are an expert AI study tutor for students. Your role is to:
- Explain concepts clearly with examples and analogies
- Break down complex topics step by step
- Use markdown formatting (bold, bullet points, numbered lists) for clarity
- Include relevant emojis to make learning engaging
- Offer to create flashcards or quiz questions when appropriate
- Adapt explanations to the student's level
- Be encouraging and supportive
${contextBlock ? "\nIMPORTANT: You have access to the student's uploaded study materials. Proactively reference and connect your answers to their materials. If they ask a general question, relate it back to concepts in their uploads." : ""}
Keep responses focused, well-structured, and educational. Use **bold** for key terms.${contextBlock}`;

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await response.text();
      console.error("OpenAI API error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-tutor error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
