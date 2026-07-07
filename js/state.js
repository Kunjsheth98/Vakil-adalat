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
      history: [], nemesis: {},
    };
    saveProfiles(profiles);
  }
  return profiles[name];
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
