/* VAKIL ADALAT — Game Engine
   Pure logic. No DOM here — ui.js reads these results and renders them.
*/

const RANKS = [
  { name: "Junior Advocate",        min: 0 },
  { name: "Senior Advocate",        min: 100 },
  { name: "Supreme Court Advocate", min: 250 },
  { name: "Judge",                  min: 500 },
];

function rankForPoints(points) {
  let current = RANKS[0];
  for (const r of RANKS) if (points >= r.min) current = r;
  return current;
}

function pointsToNextRank(points) {
  const next = RANKS.find(r => r.min > points);
  return next ? next.min - points : null;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickCase(recentIds = []) {
  const fresh = CASES.filter(c => !recentIds.includes(c.id));
  const pool = fresh.length ? fresh : CASES;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Deal each side their 3 private evidence cards, shuffled.
function dealHands(caseObj) {
  const evidenceA = shuffle(caseObj.evidence.filter(e => e.owner === "A"));
  const evidenceB = shuffle(caseObj.evidence.filter(e => e.owner === "B"));
  return { A: evidenceA, B: evidenceB };
}

function pickLine(bucket) {
  const arr = JUDGE_LINES[bucket];
  return arr[Math.floor(Math.random() * arr.length)];
}

// Resolve one statement: presenter plays an argument type + optional evidence card.
// If objected is true, the judge rules. `judge` shapes how that ruling leans.
function resolveStatement({ argType, evidenceCard, objected, judge }) {
  const j = judge || JUDGES.find((jj) => jj.id === "fair");
  const argument = ARGUMENT_TYPES.find(a => a.id === argType);
  const hasSynergy = evidenceCard && argument.synergy.includes(evidenceCard.type);
  const baseStrength = evidenceCard ? EVIDENCE_TYPES[evidenceCard.type].baseStrength : 1;
  const strength = Math.min(6, baseStrength + (hasSynergy ? 1.5 : 0));
  const isFake = !!(evidenceCard && EVIDENCE_TYPES[evidenceCard.type].forged);

  if (!objected) {
    if (isFake) {
      return {
        objected: false, outcome: "bluffLanded",
        presenterDelta: 12, objectorDelta: 0,
        line: pickLine("bluffLanded"), hasSynergy, strength,
      };
    }
    const gain = Math.round(2 + strength);
    return {
      objected: false, outcome: "accepted",
      presenterDelta: gain, objectorDelta: 0,
      line: null, hasSynergy, strength,
    };
  }

  // Objection raised — judge rules, and this judge's personality shapes the call.
  if (isFake) {
    const caught = Math.random() < j.fakeCatchRate;
    if (caught) {
      return {
        objected: true, outcome: "caughtFake",
        presenterDelta: -14, objectorDelta: 10,
        line: pickLine("caughtFake"), hasSynergy, strength,
      };
    }
    // The forgery slipped past this particular judge — bluff survives a direct challenge.
    return {
      objected: true, outcome: "overruled",
      presenterDelta: 14, objectorDelta: -6,
      line: pickLine("overruled"), hasSynergy, strength,
    };
  }

  const argBias = j.argTypeFavor[argType] || 0;
  const evidenceBias = evidenceCard ? (j.evidenceDistrust[evidenceCard.type] || 0) : 0;
  const sustainProb = Math.max(0.08, Math.min(0.9,
    1 - (strength - 1) / 6 - (hasSynergy ? 0.15 : 0) + j.sustainBias + argBias + evidenceBias
  ));
  const sustained = Math.random() < sustainProb;

  if (sustained) {
    return {
      objected: true, outcome: "sustained",
      presenterDelta: -8, objectorDelta: 8,
      line: pickLine("sustained"), hasSynergy, strength,
    };
  }
  return {
    objected: true, outcome: "overruled",
    presenterDelta: 4, objectorDelta: -6,
    line: pickLine("overruled"), hasSynergy, strength,
  };
}

// Used in Party Mode, where a real person plays Judge instead of the algorithm.
// humanSustains: true if the human Judge ruled "Sustained", false if "Overruled".
function resolveStatementHumanJudge({ argType, evidenceCard, humanSustains }) {
  const argument = ARGUMENT_TYPES.find(a => a.id === argType);
  const hasSynergy = evidenceCard && argument.synergy.includes(evidenceCard.type);
  const isFake = !!(evidenceCard && EVIDENCE_TYPES[evidenceCard.type].forged);
  const strength = evidenceCard ? EVIDENCE_TYPES[evidenceCard.type].baseStrength + (hasSynergy ? 1.5 : 0) : 1;

  if (humanSustains) {
    if (isFake) {
      return { objected: true, outcome: "caughtFake", presenterDelta: -14, objectorDelta: 10, line: pickLine("caughtFake"), hasSynergy, strength };
    }
    return { objected: true, outcome: "sustained", presenterDelta: -8, objectorDelta: 8, line: pickLine("sustained"), hasSynergy, strength };
  }
  if (isFake) {
    return { objected: true, outcome: "overruled", presenterDelta: 14, objectorDelta: -6, line: pickLine("overruled"), hasSynergy, strength };
  }
  return { objected: true, outcome: "overruled", presenterDelta: 4, objectorDelta: -6, line: pickLine("overruled"), hasSynergy, strength };
}

function judgeHint(argType, evidenceCard) {
  if (!evidenceCard) return "There's no evidence backing this one up.";
  const argument = ARGUMENT_TYPES.find(a => a.id === argType);
  const hasSynergy = argument.synergy.includes(evidenceCard.type);
  const strength = EVIDENCE_TYPES[evidenceCard.type].baseStrength + (hasSynergy ? 1.5 : 0);
  if (strength >= 5) return "This one feels fairly strong.";
  if (strength >= 3.5) return "This one seems reasonable, but not airtight.";
  return "This one feels a little shaky.";
}

function decideVerdict(scoreA, scoreB) {
  const diff = Math.abs(scoreA - scoreB);
  const winner = scoreA === scoreB ? (Math.random() < 0.5 ? "A" : "B") : (scoreA > scoreB ? "A" : "B");
  const closeCall = diff <= 6;
  const line = scoreA === scoreB ? pickLine("winClose") : (closeCall ? pickLine("winClose") : pickLine("winClear"));
  const margin = scoreA === scoreB ? 1 : diff;
  const winnerPoints = Math.min(35, 15 + Math.round(margin));
  const loserPoints = 5;
  return { winner, line, margin, winnerPoints, loserPoints, tie: scoreA === scoreB };
}

if (typeof module !== "undefined") {
  module.exports = {
    RANKS, rankForPoints, pointsToNextRank, shuffle, pickCase,
    dealHands, resolveStatement, resolveStatementHumanJudge, judgeHint, decideVerdict,
  };
}
