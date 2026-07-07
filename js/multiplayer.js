/* VAKIL ADALAT — Online Multiplayer
   Uses Supabase Realtime broadcast — no database tables required for gameplay itself.
   The room's creator ("host") runs the actual game engine and is the source of truth;
   the other player ("guest") sends their choices to the host and receives results back.
   This keeps both sides always in sync with zero risk of the two devices disagreeing.

   Trust note: like pass-and-play on one device, this trusts both players not to peek at
   the other side's private evidence in the browser console. For a casual game between
   friends/family that's the right tradeoff — a fully cheat-proof version would need a
   real backend referee, which is a fair future upgrade if you ever want it.
*/

const MP = (() => {
  let client = null;
  let channel = null;
  let role = null; // "host" | "guest"
  let roomCode = null;
  let myName = null;
  let opponentName = null;
  let listeners = [];

  function on(fn) { listeners.push(fn); }
  function emit(event) { listeners.forEach(fn => fn(event)); }

  function loadLib() {
    return new Promise((resolve, reject) => {
      if (window.supabase) return resolve(window.supabase);
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
      script.onload = () => resolve(window.supabase);
      script.onerror = () => reject(new Error("Could not load the Supabase library. Check your internet connection."));
      document.head.appendChild(script);
    });
  }

  async function ensureClient() {
    if (client) return client;
    const lib = await loadLib();
    client = lib.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    return client;
  }

  function makeCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }

  function subscribeChannel(code) {
    channel = client.channel(`vakiladalat-room-${code}`, { config: { broadcast: { self: false } } });
    channel.on("broadcast", { event: "msg" }, (payload) => {
      emit(payload.payload);
    });
    return new Promise((resolve) => {
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") resolve();
      });
    });
  }

  async function send(event) {
    if (!channel) return;
    await channel.send({ type: "broadcast", event: "msg", payload: event });
  }

  async function hostCreateRoom(name) {
    myName = name;
    role = "host";
    roomCode = makeCode();
    await ensureClient();
    await subscribeChannel(roomCode);
    return roomCode;
  }

  async function guestJoinRoom(code, name) {
    myName = name;
    role = "guest";
    roomCode = code.toUpperCase();
    await ensureClient();
    await subscribeChannel(roomCode);
    await send({ type: "join", name });
  }

  function isHost() { return role === "host"; }
  function getOpponentName() { return opponentName; }
  function setOpponentName(n) { opponentName = n; }

  async function sendAction(type, data) {
    await send({ type, ...data, from: myName });
  }

  function disconnect() {
    if (channel) client.removeChannel(channel);
    channel = null; role = null; roomCode = null; opponentName = null;
  }

  return {
    on, hostCreateRoom, guestJoinRoom, sendAction, disconnect,
    isHost, getOpponentName, setOpponentName,
    get roomCode() { return roomCode; },
    get myName() { return myName; },
  };
})();
