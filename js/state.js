/* VAKIL ADALAT — State & Persistence
   All saved locally in the browser (localStorage). No login needed.
   If Supabase is configured (see js/multiplayer.js + js/config.js), online
   matches also sync live — but everything here works completely offline.
*/

const STORAGE_KEY = "vakiladalat_profiles_v1";
const HISTORY_KEY = "vakiladalat_case_history_v1";

function loadProfiles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn("Could not read saved profiles, starting fresh.", e);
    return {};
  }
}

function saveProfiles(profiles) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch (e) {
    console.warn("Could not save profiles.", e);
  }
}

function getOrCreateProfile(name) {
  const profiles = loadProfiles();
  if (!profiles[name]) {
    profiles[name] = {
      name, points: 0, wins: 0, losses: 0,
      streak: 0, bestStreak: 0,
      history: [], nemesis: {}, badges: {},
      stats: {
        argTypeCounts: {}, argTypeWins: {},
        bluffAttempts: 0, bluffSuccess: 0,
        caughtFakeCount: 0, evidenceCaughtCounts: {},
        appealsWon: 0, appealsLost: 0,
        crossExaminesUsed: 0, giantSlayerCount: 0,
      },
    };
    saveProfiles(profiles);
  }
  if (!profiles[name].stats) {
    profiles[name].stats = {
      argTypeCounts: {}, argTypeWins: {},
      bluffAttempts: 0, bluffSuccess: 0,
      caughtFakeCount: 0, evidenceCaughtCounts: {},
      appealsWon: 0, appealsLost: 0,
      crossExaminesUsed: 0, giantSlayerCount: 0,
    };
  }
  if (!profiles[name].badges) profiles[name].badges = {};
  return profiles[name];
}

function bumpStat(name, key, amount = 1) {
  const profiles = loadProfiles();
  const p = profiles[name] || getOrCreateProfile(name);
  p.stats[key] = (p.stats[key] || 0) + amount;
  profiles[name] = p;
  saveProfiles(profiles);
  return p;
}

// Call after any profile-affecting event (match win/loss, appeal, etc). Returns
// the list of newly-unlocked badges (empty array if nothing new).
function checkAndUnlockBadges(name) {
  const profiles = loadProfiles();
  const p = profiles[name] || getOrCreateProfile(name);
  if (!p.badges) p.badges = {};
  const newly = [];
  BADGES.forEach((b) => {
    if (!p.badges[b.id] && b.check(p)) {
      p.badges[b.id] = new Date().toISOString();
      newly.push(b);
    }
  });
  profiles[name] = p;
  saveProfiles(profiles);
  return newly;
}

// Called once per statement, for the presenting player, to build up their play style stats.
function recordStatementStat(name, { argType, evidenceType, isFake, outcome }) {
  const profiles = loadProfiles();
  const profile = profiles[name] || getOrCreateProfile(name);
  const s = profile.stats;

  s.argTypeCounts[argType] = (s.argTypeCounts[argType] || 0) + 1;
  const favorable = outcome === "accepted" || outcome === "bluffLanded" || (outcome === "overruled");
  if (favorable) s.argTypeWins[argType] = (s.argTypeWins[argType] || 0) + 1;

  if (isFake) {
    s.bluffAttempts += 1;
    if (outcome === "bluffLanded" || outcome === "overruled") s.bluffSuccess += 1;
    if (outcome === "caughtFake") {
      s.caughtFakeCount += 1;
      s.evidenceCaughtCounts[evidenceType] = (s.evidenceCaughtCounts[evidenceType] || 0) + 1;
    }
  }
  profiles[name] = profile;
  saveProfiles(profiles);
}

function adjustPoints(name, delta) {
  const profiles = loadProfiles();
  const profile = profiles[name] || getOrCreateProfile(name);
  profile.points = Math.max(0, profile.points + delta);
  profiles[name] = profile;
  saveProfiles(profiles);
  return profile;
}

function recordAppealResult(name, won) {
  const profiles = loadProfiles();
  const profile = profiles[name] || getOrCreateProfile(name);
  if (won) profile.stats.appealsWon += 1;
  else profile.stats.appealsLost += 1;
  profiles[name] = profile;
  saveProfiles(profiles);
  return profile;
}

function recordResult({ winnerName, loserName, caseTitle, winnerPoints, loserPoints }) {
  const profiles = loadProfiles();
  const winner = profiles[winnerName] || getOrCreateProfile(winnerName);
  const loser = profiles[loserName] || getOrCreateProfile(loserName);

  winner.points += winnerPoints;
  winner.wins += 1;
  winner.streak += 1;
  winner.bestStreak = Math.max(winner.bestStreak, winner.streak);
  winner.history = [{ opponent: loserName, result: "win", caseTitle, date: new Date().toISOString() }, ...winner.history].slice(0, 50);
  winner.nemesis[loserName] = winner.nemesis[loserName] || { wins: 0, losses: 0 };
  winner.nemesis[loserName].wins += 1;

  loser.points += loserPoints;
  loser.losses += 1;
  loser.streak = 0;
  loser.history = [{ opponent: winnerName, result: "loss", caseTitle, date: new Date().toISOString() }, ...loser.history].slice(0, 50);
  loser.nemesis[winnerName] = loser.nemesis[winnerName] || { wins: 0, losses: 0 };
  loser.nemesis[winnerName].losses += 1;

  profiles[winnerName] = winner;
  profiles[loserName] = loser;
  saveProfiles(profiles);
  return { winner, loser };
}

function loadCaseHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function pushCaseHistory(caseId) {
  const hist = loadCaseHistory();
  const updated = [caseId, ...hist].slice(0, 12); // remember the last 12 to avoid quick repeats
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) { /* ignore */ }
  return updated;
}

function leaderboard() {
  const profiles = loadProfiles();
  return Object.values(profiles).sort((a, b) => b.points - a.points);
}