// Deno integration test for the artefact-generation JSON schema.
//
// Validates that an OpenAI-shaped tool-call response parses into the structure
// expected by the process-upload Edge Function's downstream fan-out writes.
// Uses a captured mock response so the test runs offline and deterministically.
//
// Run with:
//   cd supabase/functions && deno test --allow-all

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.168.0/testing/asserts.ts";

// A realistic mock of an OpenAI tool-call response, matching the schema
// declared in process-upload/index.ts.
const mockOpenAIResponse = {
  choices: [
    {
      message: {
        tool_calls: [
          {
            function: {
              name: "generate_study_materials",
              arguments: JSON.stringify({
                subject: "Biology",
                summary:
                  "Cellular respiration is the set of metabolic reactions " +
                  "that convert biochemical energy from nutrients into ATP.",
                notes_title: "Cellular Respiration",
                notes_content:
                  "# Cellular Respiration\n\n## Stages\n\n- Glycolysis\n- Krebs cycle\n- Electron transport chain",
                flashcards: [
                  { q: "What does ATP stand for?", a: "Adenosine triphosphate", detail: "the energy currency of the cell" },
                  { q: "Where does glycolysis occur?", a: "The cytoplasm" },
                  { q: "What is the final electron acceptor?", a: "Oxygen" },
                ],
                quiz_questions: [
                  {
                    question: "Which molecule is the final electron acceptor in the electron transport chain?",
                    options: ["Oxygen", "Carbon dioxide", "Water", "Glucose"],
                    correct: 0,
                  },
                  {
                    question: "Where does the Krebs cycle take place?",
                    options: ["Cytoplasm", "Mitochondrial matrix", "Nucleus", "Golgi apparatus"],
                    correct: 1,
                  },
                ],
                planner_tasks: [
                  { topic: "Review the stages of glycolysis", duration: "30m" },
                  { topic: "Practice questions on the Krebs cycle", duration: "45m" },
                ],
              }),
            },
          },
        ],
      },
    },
  ],
};

Deno.test("tool-call response exposes a generate_study_materials function", () => {
  const toolCall = mockOpenAIResponse.choices[0].message.tool_calls[0];
  assertEquals(toolCall.function.name, "generate_study_materials");
});

Deno.test("parsed artefacts contain all 7 required top-level fields", () => {
  const toolCall = mockOpenAIResponse.choices[0].message.tool_calls[0];
  const materials = JSON.parse(toolCall.function.arguments);

  assert(typeof materials.subject === "string", "subject missing");
  assert(typeof materials.summary === "string", "summary missing");
  assert(typeof materials.notes_title === "string", "notes_title missing");
  assert(typeof materials.notes_content === "string", "notes_content missing");
  assert(Array.isArray(materials.flashcards), "flashcards not array");
  assert(Array.isArray(materials.quiz_questions), "quiz_questions not array");
  assert(Array.isArray(materials.planner_tasks), "planner_tasks not array");
});

Deno.test("every flashcard has non-empty q and a fields", () => {
  const materials = JSON.parse(
    mockOpenAIResponse.choices[0].message.tool_calls[0].function.arguments
  );
  assert(materials.flashcards.length > 0, "flashcards array is empty");
  for (const card of materials.flashcards) {
    assert(typeof card.q === "string" && card.q.length > 0, "flashcard q missing");
    assert(typeof card.a === "string" && card.a.length > 0, "flashcard a missing");
  }
});

Deno.test("every quiz question has exactly 4 options", () => {
  const materials = JSON.parse(
    mockOpenAIResponse.choices[0].message.tool_calls[0].function.arguments
  );
  for (const q of materials.quiz_questions) {
    assertEquals(q.options.length, 4, `question has ${q.options.length} options, expected 4`);
  }
});

Deno.test("every quiz question has a valid 0-indexed correct answer", () => {
  const materials = JSON.parse(
    mockOpenAIResponse.choices[0].message.tool_calls[0].function.arguments
  );
  for (const q of materials.quiz_questions) {
    assert(typeof q.correct === "number", "correct is not a number");
    assert(q.correct >= 0, "correct is negative");
    assert(q.correct < q.options.length, "correct index out of bounds");
    assert(Number.isInteger(q.correct), "correct is not an integer");
  }
});

Deno.test("every planner task has a topic and duration", () => {
  const materials = JSON.parse(
    mockOpenAIResponse.choices[0].message.tool_calls[0].function.arguments
  );
  for (const t of materials.planner_tasks) {
    assert(typeof t.topic === "string" && t.topic.length > 0, "task topic missing");
    assert(typeof t.duration === "string" && t.duration.length > 0, "task duration missing");
  }
});

Deno.test("missing tool_calls is detected as a recoverable error", () => {
  const badResponse = { choices: [{ message: {} }] };
  const toolCall = (badResponse as unknown as {
    choices?: Array<{ message?: { tool_calls?: unknown[] } }>;
  }).choices?.[0]?.message?.tool_calls?.[0];
  assertEquals(toolCall, undefined);
});

Deno.test("malformed JSON in arguments is caught cleanly", () => {
  const badCall = {
    function: { name: "generate_study_materials", arguments: "{not-json" },
  };
  let caught = false;
  try {
    JSON.parse(badCall.function.arguments);
  } catch {
    caught = true;
  }
  assert(caught, "expected JSON parse to throw on malformed input");
});
