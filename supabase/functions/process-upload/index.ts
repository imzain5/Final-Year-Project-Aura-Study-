import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { upload_id } = await req.json();
    if (!upload_id) throw new Error("upload_id is required");

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Get upload record
    const { data: upload, error: uploadErr } = await supabase
      .from("uploads")
      .select("*")
      .eq("id", upload_id)
      .single();

    if (uploadErr || !upload) throw new Error("Upload not found");

    // 2. Download the file
    const { data: fileData, error: dlErr } = await supabase.storage
      .from("user-uploads")
      .download(upload.storage_path);

    if (dlErr || !fileData) throw new Error("Failed to download file");

    // 3. Extract text from the file
    let fileText = "";
    const fileType = upload.file_type as string;

    if (fileType.includes("text") || fileType.includes("txt")) {
      fileText = await fileData.text();
    } else if (fileType.includes("pdf")) {
      // For PDFs, convert to base64 and use AI vision to extract text
      const buffer = await fileData.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      const extractRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Extract ALL the text content from this PDF document. Return the raw text preserving the structure (headings, paragraphs, bullet points). Do not add commentary, just return the extracted text.",
                },
                {
                  type: "image_url",
                  image_url: { url: `data:application/pdf;base64,${base64}` },
                },
              ],
            },
          ],
        }),
      });

      if (extractRes.ok) {
        const extractData = await extractRes.json();
        fileText = extractData.choices?.[0]?.message?.content || "";
      }
    } else if (fileType.includes("doc")) {
      // For docx, try reading as text (simplified)
      fileText = await fileData.text();
    }

    if (!fileText || fileText.length < 20) {
      // Update status
      await supabase.from("uploads").update({ status: "error" }).eq("id", upload_id);
      return new Response(
        JSON.stringify({ error: "Could not extract enough text from this file." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Truncate to ~12000 chars to stay within token limits
    const truncatedText = fileText.slice(0, 12000);

    // 4. Use AI to generate study materials
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a study material generator. Given document text, generate comprehensive study materials. Return a JSON object with this EXACT structure (no markdown, no code blocks, just raw JSON):
{
  "subject": "detected subject area (e.g. Biology, Physics, History)",
  "summary": "a concise 2-3 sentence summary of the document",
  "notes_title": "a good title for notes based on this content",
  "notes_content": "detailed study notes with key concepts, definitions, and explanations formatted with markdown headings and bullet points",
  "flashcards": [
    {"q": "question text", "a": "answer text", "detail": "optional explanation"},
    ... (generate 5-10 flashcards covering key concepts)
  ],
  "quiz_questions": [
    {"question": "question text", "options": ["A", "B", "C", "D"], "correct": 0},
    ... (generate 5 multiple-choice questions, correct is the 0-based index)
  ],
  "planner_tasks": [
    {"topic": "specific study task", "duration": "30m"},
    ... (generate 3-5 study tasks to master this material)
  ]
}`,
          },
          {
            role: "user",
            content: `Generate study materials from this document:\n\n${truncatedText}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_study_materials",
              description: "Generate study materials from document text",
              parameters: {
                type: "object",
                properties: {
                  subject: { type: "string" },
                  summary: { type: "string" },
                  notes_title: { type: "string" },
                  notes_content: { type: "string" },
                  flashcards: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        q: { type: "string" },
                        a: { type: "string" },
                        detail: { type: "string" },
                      },
                      required: ["q", "a"],
                    },
                  },
                  quiz_questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        options: { type: "array", items: { type: "string" } },
                        correct: { type: "number" },
                      },
                      required: ["question", "options", "correct"],
                    },
                  },
                  planner_tasks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        topic: { type: "string" },
                        duration: { type: "string" },
                      },
                      required: ["topic", "duration"],
                    },
                  },
                },
                required: ["subject", "summary", "notes_title", "notes_content", "flashcards", "quiz_questions", "planner_tasks"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_study_materials" } },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI error:", aiRes.status, errText);
      await supabase.from("uploads").update({ status: "error" }).eq("id", upload_id);
      return new Response(
        JSON.stringify({ error: "AI processing failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      await supabase.from("uploads").update({ status: "error" }).eq("id", upload_id);
      return new Response(
        JSON.stringify({ error: "AI did not return structured data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const materials = JSON.parse(toolCall.function.arguments);
    const userId = upload.user_id;
    const today = new Date().toISOString().split("T")[0];

    // 5. Save generated materials to database
    const results: Record<string, any> = {};

    // Save note
    const { data: noteData } = await supabase.from("notes").insert({
      user_id: userId,
      title: materials.notes_title || upload.file_name,
      subject: materials.subject || "General",
      content: materials.notes_content || "",
      summary: materials.summary || "",
      upload_id: upload_id,
    }).select().single();
    results.note = noteData;

    // Save flashcard deck
    const { data: deckData } = await supabase.from("flashcard_decks").insert({
      user_id: userId,
      name: `${materials.subject || upload.file_name} Flashcards`,
      cards: materials.flashcards || [],
    }).select().single();
    results.deck = deckData;

    // Save generated quiz
    const quizTitle = `${materials.subject || upload.file_name} Quiz`;
    const { data: quizData } = await supabase.from("generated_quizzes").insert({
      user_id: userId,
      title: quizTitle,
      subject: materials.subject || "General",
      upload_id: upload_id,
      questions: materials.quiz_questions || [],
    }).select().single();
    results.quiz = quizData;

    // Save planner tasks
    const plannerInserts = (materials.planner_tasks || []).map((t: any) => ({
      user_id: userId,
      subject: materials.subject || "General",
      topic: t.topic,
      duration: t.duration || "30m",
      scheduled_time: "TBD",
      done: false,
      task_date: today,
    }));

    if (plannerInserts.length > 0) {
      const { data: taskData } = await supabase.from("planner_tasks").insert(plannerInserts).select();
      results.tasks = taskData;
    }

    // Log activity
    await supabase.from("activity_log").insert({
      user_id: userId,
      activity_type: "upload_processed",
      title: "Upload Processed",
      description: `Generated study materials from ${upload.file_name}`,
    });

    // Update upload status
    await supabase.from("uploads").update({ status: "processed" }).eq("id", upload_id);

    return new Response(
      JSON.stringify({
        success: true,
        materials: {
          subject: materials.subject,
          summary: materials.summary,
          note_id: results.note?.id,
          deck_id: results.deck?.id,
          quiz_id: results.quiz?.id,
          quiz_title: results.quiz?.title,
          tasks_count: plannerInserts.length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("process-upload error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
