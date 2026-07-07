"""
Vakil Adalat — Live Case Generator
-----------------------------------
Optional service. The game ships with 24 hand-written cases and works fully without
this — deploy it only when you want cases that never repeat.

What it does: generates new cases in the exact JSON shape js/data.js already uses,
via the Claude API, and caches them in Supabase so the game can pull a fresh batch
instead of (or alongside) the built-in CASES array.

Deploy: same pattern as your other apps — Railway, with ANTHROPIC_API_KEY,
SUPABASE_URL, and SUPABASE_SERVICE_KEY set as environment variables.

Endpoints:
  POST /generate-batch?count=10   -> generates N new cases, stores them in Supabase,
                                      returns them
  GET  /cases?limit=20            -> returns cases from Supabase (freshest first)
"""

import os
import json
import random
import string
from typing import Optional

import anthropic
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from pydantic import BaseModel

app = FastAPI(title="Vakil Adalat Case Generator")

# Allow the game (hosted on GitHub Pages) to call this service directly.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to your actual GitHub Pages URL once deployed
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

if not ANTHROPIC_API_KEY:
    raise RuntimeError("ANTHROPIC_API_KEY is not set")
if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("SUPABASE_URL / SUPABASE_SERVICE_KEY are not set")

claude = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

EVIDENCE_TYPES = ["solid", "eye", "clue", "said", "fake"]

SYSTEM_PROMPT = """You write cases for Vakil Adalat, a courtroom bluffing game.

Each case is a small, funny, everyday dispute — the kind that happens between roommates,
neighbors, siblings, coworkers, or friends in India. Never anything violent, illegal, or
serious (no crimes, no injuries, nothing dark). Keep the tone light and a little absurd.

Use plain, easy English. No legal jargon, no words a non-lawyer would need to look up.

You must return ONLY valid JSON, matching this exact shape, and nothing else —
no preamble, no markdown fences, no explanation:

{
  "title": "The [Something] [Something]",
  "hook": "One suspenseful sentence that makes someone want to know what happened.",
  "plaintiff": "a short label for the person bringing the complaint, e.g. 'Meera' or 'the building watchman'",
  "defendant": "a short label for the person being accused",
  "story": "Two plain sentences setting up the dispute.",
  "evidence": [
    {"type": "solid|eye|clue|said|fake", "text": "one sentence of evidence", "owner": "A"},
    ... exactly 6 entries total, exactly 3 with owner "A" and exactly 3 with owner "B" ...
  ],
  "twist": "One sentence revealing what actually happened — should recontextualize the evidence."
}

Evidence type guide:
- "solid": strong, hard-to-argue-with proof
- "eye": someone directly saw something relevant
- "clue": circumstantial, suggestive but not conclusive
- "said": secondhand, someone mentioned something
- "fake": evidence that turns out to be fabricated or misleading — exactly ONE of the
  6 evidence entries per case should be "fake", no more, no fewer

Evidence should be split so neither side has the full picture — that's what makes the
game work. Real information should exist on both sides that, combined, points to the twist."""


class Case(BaseModel):
    title: str
    hook: str
    plaintiff: str
    defendant: str
    story: str
    evidence: list
    twist: str


def _validate_case(case: dict) -> bool:
    if not all(k in case for k in ["title", "hook", "plaintiff", "defendant", "story", "evidence", "twist"]):
        return False
    ev = case["evidence"]
    if len(ev) != 6:
        return False
    owners = [e.get("owner") for e in ev]
    if owners.count("A") != 3 or owners.count("B") != 3:
        return False
    types = [e.get("type") for e in ev]
    if any(t not in EVIDENCE_TYPES for t in types):
        return False
    if types.count("fake") != 1:
        return False
    return True


def _generate_one_case() -> Optional[dict]:
    response = claude.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": "Generate one new case."}],
    )
    text = response.content[0].text.strip()
    # Strip markdown fences if the model adds them despite instructions.
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    try:
        case = json.loads(text)
    except json.JSONDecodeError:
        return None
    if not _validate_case(case):
        return None
    case["id"] = "gen-" + "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return case


@app.post("/generate-batch")
def generate_batch(count: int = Query(default=10, ge=1, le=30)):
    generated = []
    attempts = 0
    max_attempts = count * 3  # allow retries for cases that fail validation

    while len(generated) < count and attempts < max_attempts:
        attempts += 1
        case = _generate_one_case()
        if case:
            generated.append(case)

    if not generated:
        raise HTTPException(status_code=502, detail="Claude did not return any valid cases. Try again.")

    rows = [{"id": c["id"], "data": c} for c in generated]
    supabase.table("generated_cases").insert(rows).execute()

    return {"generated": len(generated), "requested": count, "cases": generated}


@app.get("/cases")
def get_cases(limit: int = Query(default=20, ge=1, le=100)):
    result = (
        supabase.table("generated_cases")
        .select("data")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return {"cases": [row["data"] for row in result.data]}


@app.get("/health")
def health():
    return {"status": "ok"}
