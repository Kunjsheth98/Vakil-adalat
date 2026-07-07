// Vakil Adalat — Live Case Generator (Supabase Edge Function)
// Deploy with the Supabase CLI: supabase functions deploy generate-cases
// Free — runs on Supabase's own infrastructure, no Railway or separate host needed.
//
// Set the secret once: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// (Supabase provides SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY automatically —
// you don't need to set those yourself.)
//
// Call it:
//   POST https://<your-project>.supabase.co/functions/v1/generate-cases?count=10
//   GET  https://<your-project>.supabase.co/functions/v1/generate-cases?count=0   (returns cached cases instead)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const EVIDENCE_TYPES = ["solid", "eye", "clue", "said", "fake"];

const SYSTEM_PROMPT = `You write cases for Vakil Adalat, a courtroom bluffing game.

Each case is a small, funny, everyday dispute — the kind that happens between roommates,
neighbors, siblings, coworkers, or friends in India. Never anything violent, illegal, or
serious (no crimes, no injuries, nothing dark). Keep the tone light and a little absurd.

Use plain, easy English. No legal jargon, no words a non-lawyer would need to look up.

Return ONLY valid JSON matching this exact shape, nothing else — no preamble, no markdown fences:

{
  "title": "The [Something] [Something]",
  "hook": "One suspenseful sentence.",
  "plaintiff": "short label, e.g. 'Meera' or 'the building watchman'",
  "defendant": "short label for the accused",
  "story": "Two plain sentences setting up the dispute.",
  "evidence": [
    {"type": "solid|eye|clue|said|fake", "text": "one sentence of evidence", "owner": "A"},
    ... exactly 6 entries, exactly 3 owner "A" and 3 owner "B" ...
  ],
  "twist": "One sentence revealing what actually happened."
}

Exactly ONE of the 6 evidence entries must be type "fake". Evidence should be split so
neither side has the full picture, and combined they point to the twist.`;

function validateCase(c: any): boolean {
  if (!c || typeof c !== "object") return false;
  if (!["title", "hook", "plaintiff", "defendant", "story", "evidence", "twist"].every((k) => k in c)) return false;
  if (!Array.isArray(c.evidence) || c.evidence.length !== 6) return false;
  const owners = c.evidence.map((e: any) => e.owner);
  if (owners.filter((o: string) => o === "A").length !== 3) return false;
  if (owners.filter((o: string) => o === "B").length !== 3) return false;
  const types = c.evidence.map((e: any) => e.type);
  if (types.some((t: string) => !EVIDENCE_TYPES.includes(t))) return false;
  if (types.filter((t: string) => t === "fake").length !== 1) return false;
  return true;
}

async function generateOneCase(): Promise<any | null> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: "Generate one new case." }],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  let text = (data.content?.[0]?.text || "").trim();
  if (text.startsWith("```")) {
    text = text.split("```")[1].replace(/^json/, "").trim();
  }
  try {
    const caseObj = JSON.parse(text);
    if (!validateCase(caseObj)) return null;
    caseObj.id = "gen-" + crypto.randomUUID().slice(0, 8);
    return caseObj;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const count = Math.max(0, Math.min(30, Number(url.searchParams.get("count") ?? "10")));

  try {
    if (count === 0) {
      const { data, error } = await supabase
        .from("generated_cases")
        .select("data")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return new Response(JSON.stringify({ cases: data.map((r) => r.data) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const generated: any[] = [];
    let attempts = 0;
    while (generated.length < count && attempts < count * 3) {
      attempts++;
      const c = await generateOneCase();
      if (c) generated.push(c);
    }

    if (generated.length) {
      const rows = generated.map((c) => ({ id: c.id, data: c }));
      const { error } = await supabase.from("generated_cases").insert(rows);
      if (error) throw error;
    }

    return new Response(JSON.stringify({ generated: generated.length, requested: count, cases: generated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
