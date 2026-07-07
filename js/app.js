/* VAKIL ADALAT — App Controller
   Wires together data.js, engine.js, state.js, multiplayer.js into the actual game flow.
*/

(function () {
  const screens = document.querySelectorAll(".screen");
  function show(name) {
    screens.forEach((s) => s.classList.toggle("active", s.dataset.screen === name));
  }

  let G = null;                 // current match state
  let currentMode = null;       // 'passplay' | 'party' | 'online' | 'daily'
  let partyRoster = [];
  let dailyPending = false;
  let pendingAfterPass = null;
  let selectedArg = null;
  let selectedEvidence = undefined; // undefined = nothing picked yet, null = "no evidence" chosen
  let reactTimerInterval = null;
  let lastVerdictData = null;

  // ---------- Navigation / actions ----------
  document.body.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    handleAction(btn.dataset.action);
  });

  function handleAction(action) {
    switch (action) {
      case "go-home": show("home"); break;
      case "go-mode-select": show("mode"); break;
      case "go-profiles": renderProfiles(); show("profiles"); break;
      case "go-howtoplay": show("howtoplay"); break;
      case "start-passplay":
        document.getElementById("field-b-group").classList.remove("hidden");
        document.querySelector("#screen-names-2 .section-title").textContent = "Who's arguing?";
        dailyPending = false;
        show("names-2");
        break;
      case "start-party": resetPartyFields(); show("names-party"); break;
      case "start-online": setupOnlineScreen(); show("online"); break;
      case "start-daily":
        dailyPending = true;
        document.getElementById("field-b-group").classList.add("hidden");
        document.querySelector("#screen-names-2 .section-title").textContent = "Play today's case";
        show("names-2");
        break;
      case "confirm-names-2": confirmNames2(); break;
      case "party-add-name": addPartyNameField(); break;
      case "confirm-names-party": confirmNamesParty(); break;
      case "online-create": onlineCreate(); break;
      case "online-join": onlineJoin(); break;
      case "begin-arguments": beginArguments(); break;
      case "pass-continue": passContinue(); break;
      case "submit-statement": submitStatement(); break;
      case "react-accept": reactTo(false); break;
      case "react-object": reactTo(true); break;
      case "continue-after-ruling": continueAfterRuling(); break;
      case "judge-rule-sustain": judgeRule(true); break;
      case "judge-rule-overrule": judgeRule(false); break;
      case "download-receipt": downloadReceipt(); break;
      case "play-again": playAgain(); break;
    }
  }

  // ---------- Name entry ----------
  function confirmNames2() {
    const a = document.getElementById("name-a").value.trim() || "Player A";
    if (dailyPending) {
      currentMode = "daily";
      const c = dailyCase();
      beginMatchWithCase(a, "House", c);
      dailyPending = false;
      document.getElementById("field-b-group").classList.remove("hidden");
      document.querySelector("#screen-names-2 .section-title").textContent = "Who's arguing?";
      renderCaseReveal();
      show("case-reveal");
      return;
    }
    const b = document.getElementById("name-b").value.trim() || "Player B";
    currentMode = "passplay";
    startMatch(a, b);
  }

  function resetPartyFields() {
    document.querySelectorAll(".party-name-input").forEach((el) => (el.value = ""));
    document.getElementById("party-warning").classList.add("hidden");
  }

  function addPartyNameField() {
    const container = document.getElementById("party-name-fields");
    const count = container.querySelectorAll(".party-name-input").length;
    if (count >= 6) return;
    const input = document.createElement("input");
    input.className = "text-input party-name-input";
    input.maxLength = 16;
    input.placeholder = `Player ${count + 1}`;
    container.appendChild(input);
  }

  function confirmNamesParty() {
    const names = [...document.querySelectorAll(".party-name-input")].map((i) => i.value.trim()).filter(Boolean);
    if (names.length < 3) {
      document.getElementById("party-warning").classList.remove("hidden");
      return;
    }
    document.getElementById("party-warning").classList.add("hidden");
    partyRoster = names;
    currentMode = "party";
    startMatch(partyRoster[0], partyRoster[1]);
  }

  // ---------- Online setup ----------
  function setupOnlineScreen() {
    document.getElementById("online-not-configured").classList.toggle("hidden", ONLINE_ENABLED);
    document.getElementById("online-setup").classList.toggle("hidden", !ONLINE_ENABLED);
    document.getElementById("online-waiting").classList.add("hidden");
  }

  async function onlineCreate() {
    const name = document.getElementById("online-name").value.trim() || "Player";
    try {
      const code = await MP.hostCreateRoom(name);
      currentMode = "online";
      document.getElementById("online-setup").classList.add("hidden");
      document.getElementById("online-waiting").classList.remove("hidden");
      document.querySelector("#online-waiting .hint").textContent = "Waiting for the other side to join…";
      document.getElementById("room-code-display").textContent = code;
    } catch (e) {
      alert("Could not start online play: " + e.message);
    }
  }

  async function onlineJoin() {
    const name = document.getElementById("online-name").value.trim() || "Player";
    const code = document.getElementById("online-code").value.trim();
    if (!code) return;
    try {
      await MP.guestJoinRoom(code, name);
      currentMode = "online";
      document.getElementById("online-setup").classList.add("hidden");
      document.getElementById("online-waiting").classList.remove("hidden");
      document.getElementById("room-code-display").textContent = code.toUpperCase();
      document.querySelector("#online-waiting .hint").textContent = "Waiting for the host to start the case…";
    } catch (e) {
      alert("Could not join: " + e.message);
    }
  }

  MP.on(handleOnlineEvent);

  function handleOnlineEvent(event) {
    switch (event.type) {
      case "join":
        if (MP.isHost()) {
          MP.setOpponentName(event.name);
          onlineHostStartMatch(event.name);
        }
        break;
      case "match-start":
        if (!MP.isHost()) onlineGuestReceiveMatchStart(event);
        break;
      case "statement":
        onlineReceiveStatement(event);
        break;
      case "reaction":
        if (MP.isHost()) processResolution(event.objected);
        break;
      case "ruling":
        if (!MP.isHost()) applyResult(G.current, event.result, event.objected);
        break;
      case "verdict":
        if (!MP.isHost()) showVerdictScreen(event.verdictData);
        break;
    }
  }

  function onlineHostStartMatch(opponentName) {
    const hist = loadCaseHistory();
    const c = pickCase(hist);
    pushCaseHistory(c.id);
    beginMatchWithCase(MP.myName, opponentName, c);
    G.onlineMySeat = "A";
    MP.sendAction("match-start", {
      caseId: c.id, handsA: G.hands.A, handsB: G.hands.B,
      hostName: MP.myName, guestName: opponentName,
    });
    renderCaseReveal();
    show("case-reveal");
  }

  function onlineGuestReceiveMatchStart(event) {
    const c = CASES.find((cc) => cc.id === event.caseId);
    G = {
      seats: { A: { name: event.hostName }, B: { name: event.guestName } },
      case: c,
      hands: { A: event.handsA.slice(), B: event.handsB.slice() },
      scores: { A: 0, B: 0 }, round: 1, seq: 0, onlineMySeat: "B",
    };
    renderCaseReveal();
    show("case-reveal");
  }

  function onlineReceiveStatement(event) {
    const statement = { presenterSide: event.presenterSide, argType: event.argType, evidenceCard: event.evidenceCard || null };
    G.current = statement;
    document.getElementById("round-indicator").textContent = `Round ${G.round} of 3`;
    show("court");
    showStatementOnStage(statement);
    if (isMyTurnToReact()) showReactPanel();
  }

  function isMyTurnToPresent(side) { return side === G.onlineMySeat; }
  function isMyTurnToReact() { return currentReactorSide() === G.onlineMySeat; }

  // ---------- Match setup ----------
  function beginMatchWithCase(nameA, nameB, caseObj) {
    const hands = dealHands(caseObj);
    G = {
      seats: { A: { name: nameA }, B: { name: nameB } },
      case: caseObj,
      hands: { A: hands.A.slice(), B: hands.B.slice() },
      scores: { A: 0, B: 0 }, round: 1, seq: 0,
    };
  }

  function startMatch(nameA, nameB) {
    const hist = loadCaseHistory();
    const c = pickCase(hist);
    pushCaseHistory(c.id);
    beginMatchWithCase(nameA, nameB, c);
    renderCaseReveal();
    show("case-reveal");
  }

  function dailyCase() {
    const dayIndex = Math.floor(Date.now() / 86400000);
    return CASES[dayIndex % CASES.length];
  }

  function renderCaseReveal() {
    document.getElementById("reveal-title").textContent = G.case.title;
    document.getElementById("reveal-hook").textContent = G.case.hook;
    document.getElementById("reveal-story").textContent = G.case.story;
    document.getElementById("reveal-plaintiff").textContent = `${G.seats.A.name} — representing ${G.case.plaintiff}`;
    document.getElementById("reveal-defendant").textContent = `${G.seats.B.name} — representing ${G.case.defendant}`;
  }

  function beginArguments() {
    document.getElementById("meter-name-a").textContent = G.seats.A.name;
    document.getElementById("meter-name-b").textContent = G.seats.B.name;
    document.getElementById("stage-case-title").textContent = G.case.title;
    updateMeters();
    show("court");
    nextStatement();
  }

  function updateMeters() {
    const diff = G.scores.A - G.scores.B;
    let credA = 50 + diff / 2;
    credA = Math.max(5, Math.min(95, credA));
    document.getElementById("meter-fill-a").style.width = credA + "%";
    document.getElementById("meter-fill-b").style.width = 100 - credA + "%";
  }

  function currentPresenterSide() { return G.seq === 0 ? "A" : "B"; }
  function currentReactorSide() { return G.seq === 0 ? "B" : "A"; }

  // ---------- Turn flow ----------
  function nextStatement() {
    document.getElementById("round-indicator").textContent = `Round ${G.round} of 3`;
    document.getElementById("stage-statement").classList.add("hidden");
    const presenterSide = currentPresenterSide();

    if (currentMode === "daily" && presenterSide === "B") {
      showWaitingPanel(`${G.seats.B.name} is preparing an argument…`);
      setTimeout(botPresent, 650);
      return;
    }
    if (currentMode === "online") {
      if (isMyTurnToPresent(presenterSide)) showPresentPanel(presenterSide);
      else showWaitingPanel(`Waiting for ${G.seats[presenterSide].name} to present…`);
      return;
    }
    if (currentMode === "daily" && presenterSide === "A") {
      showPresentPanel("A");
      return;
    }
    showPassDevice(G.seats[presenterSide].name, "Choose your argument privately.", () => showPresentPanel(presenterSide));
  }

  function showPassDevice(name, hint, nextFn) {
    document.getElementById("pass-name-target").textContent = name;
    document.getElementById("pass-hint").textContent = hint || "";
    pendingAfterPass = nextFn;
    show("pass-device");
  }

  function passContinue() {
    if (pendingAfterPass) {
      const fn = pendingAfterPass;
      pendingAfterPass = null;
      fn();
    }
  }

  function hideAllCourtPanels() {
    ["panel-present", "panel-react", "panel-ruling", "panel-judge-human", "panel-waiting"].forEach((id) =>
      document.getElementById(id).classList.add("hidden")
    );
  }

  function showWaitingPanel(text) {
    show("court");
    hideAllCourtPanels();
    document.getElementById("panel-waiting").classList.remove("hidden");
    document.getElementById("panel-waiting-text").textContent = text;
  }

  function showPresentPanel(side) {
    show("court");
    hideAllCourtPanels();
    document.getElementById("panel-present").classList.remove("hidden");
    document.getElementById("present-title").textContent = `${G.seats[side].name}, present your argument`;
    renderArgGrid();
    renderHandRow(side);
    selectedArg = null;
    selectedEvidence = undefined;
    document.getElementById("btn-present").disabled = true;
  }

  function renderArgGrid() {
    const grid = document.getElementById("arg-grid");
    grid.innerHTML = "";
    ARGUMENT_TYPES.forEach((a) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "arg-card";
      el.innerHTML = `<span class="arg-card-name">${a.name}</span><span class="arg-card-desc">${a.desc}</span>`;
      el.addEventListener("click", () => {
        selectedArg = a.id;
        [...grid.children].forEach((c) => c.classList.remove("selected"));
        el.classList.add("selected");
        updatePresentButton();
      });
      grid.appendChild(el);
    });
  }

  function renderHandRow(side) {
    const row = document.getElementById("hand-row");
    row.innerHTML = "";
    G.hands[side].forEach((card, idx) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "evidence-card";
      el.textContent = card.text;
      el.addEventListener("click", () => {
        selectedEvidence = idx;
        [...row.children].forEach((c) => c.classList.remove("selected"));
        el.classList.add("selected");
        updatePresentButton();
      });
      row.appendChild(el);
    });
    const noneEl = document.createElement("button");
    noneEl.type = "button";
    noneEl.className = "evidence-card none-option";
    noneEl.textContent = "Argue without evidence";
    noneEl.addEventListener("click", () => {
      selectedEvidence = null;
      [...row.children].forEach((c) => c.classList.remove("selected"));
      noneEl.classList.add("selected");
      updatePresentButton();
    });
    row.appendChild(noneEl);
  }

  function updatePresentButton() {
    document.getElementById("btn-present").disabled = !(selectedArg && selectedEvidence !== undefined);
  }

  function submitStatement() {
    const side = currentPresenterSide();
    const evidenceCard = selectedEvidence === null ? null : G.hands[side][selectedEvidence];
    if (evidenceCard) G.hands[side].splice(selectedEvidence, 1);
    const statement = { presenterSide: side, argType: selectedArg, evidenceCard };
    G.current = statement;
    showStatementOnStage(statement);

    if (currentMode === "online") {
      MP.sendAction("statement", { argType: selectedArg, evidenceCard, presenterSide: side });
      showWaitingPanel(`Waiting for ${G.seats[currentReactorSide()].name} to respond…`);
      return;
    }
    const reactorSide = currentReactorSide();
    if (currentMode === "daily" && reactorSide === "B") {
      showWaitingPanel(`${G.seats.B.name} is considering…`);
      setTimeout(() => botReact(statement), 700);
      return;
    }
    if (currentMode === "daily" && reactorSide === "A") {
      showReactPanel();
      return;
    }
    showPassDevice(G.seats[reactorSide].name, "Decide before you know the truth.", () => showReactPanel());
  }

  function showStatementOnStage(statement) {
    const argument = ARGUMENT_TYPES.find((a) => a.id === statement.argType);
    document.getElementById("stage-statement").classList.remove("hidden");
    document.getElementById("statement-presenter-label").textContent = `${G.seats[statement.presenterSide].name} argues:`;
    document.getElementById("statement-arg-name").textContent = argument.name;
    document.getElementById("statement-evidence-text").textContent = statement.evidenceCard
      ? statement.evidenceCard.text
      : "No evidence offered — just the argument itself.";
  }

  function showReactPanel() {
    show("court");
    hideAllCourtPanels();
    document.getElementById("panel-react").classList.remove("hidden");
    document.getElementById("react-title").textContent = `${G.seats[currentReactorSide()].name}, your call`;
    startReactTimer();
  }

  function startReactTimer() {
    const total = 8000;
    const fill = document.getElementById("timer-bar-fill");
    fill.style.width = "100%";
    clearInterval(reactTimerInterval);
    const start = Date.now();
    reactTimerInterval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / total) * 100);
      fill.style.width = pct + "%";
      if (elapsed >= total) {
        clearInterval(reactTimerInterval);
        reactTo(false);
      }
    }, 100);
  }

  function botPresent() {
    const hand = G.hands.B;
    const argType = ARGUMENT_TYPES[Math.floor(Math.random() * ARGUMENT_TYPES.length)].id;
    let evidenceCard = null;
    if (hand.length && Math.random() < 0.8) {
      const idx = Math.floor(Math.random() * hand.length);
      evidenceCard = hand[idx];
      hand.splice(idx, 1);
    }
    const statement = { presenterSide: "B", argType, evidenceCard };
    G.current = statement;
    showStatementOnStage(statement);
    showReactPanel();
  }

  function botReact(statement) {
    const objected = Math.random() < 0.35;
    processResolution(objected);
  }

  function reactTo(objected) {
    clearInterval(reactTimerInterval);
    if (currentMode === "online") {
      if (MP.isHost()) {
        processResolution(objected);
      } else {
        MP.sendAction("reaction", { objected });
        showWaitingPanel("Waiting for the ruling…");
      }
      return;
    }
    if (currentMode === "party" && objected) {
      goToHumanJudge(G.current);
      return;
    }
    processResolution(objected);
  }

  function goToHumanJudge(statement) {
    const judgeName = partyRoster[2];
    showPassDevice(judgeName, "Time to rule. You alone decide.", () => {
      show("court");
      hideAllCourtPanels();
      document.getElementById("panel-judge-human").classList.remove("hidden");
      document.getElementById("judge-human-name").textContent = judgeName;
      document.getElementById("judge-hint").textContent = judgeHint(statement.argType, statement.evidenceCard);
    });
  }

  function judgeRule(sustain) {
    const statement = G.current;
    const result = resolveStatementHumanJudge({ argType: statement.argType, evidenceCard: statement.evidenceCard, humanSustains: sustain });
    applyResult(statement, result, true);
  }

  function processResolution(objected) {
    const statement = G.current;
    if (objected && currentMode === "party") { goToHumanJudge(statement); return; }
    const result = resolveStatement({ argType: statement.argType, evidenceCard: statement.evidenceCard, objected });
    if (currentMode === "online" && MP.isHost()) {
      MP.sendAction("ruling", { result, objected });
    }
    applyResult(statement, result, objected);
  }

  function applyResult(statement, result, objected) {
    const reactorSide = statement.presenterSide === "A" ? "B" : "A";
    G.scores[statement.presenterSide] += result.presenterDelta;
    G.scores[reactorSide] += result.objectorDelta;
    renderRulingPanel(statement, result, objected);
    updateMeters();
  }

  function renderRulingPanel(statement, result, objected) {
    show("court");
    hideAllCourtPanels();
    document.getElementById("panel-ruling").classList.remove("hidden");
    const stampLabels = {
      accepted: "Accepted", bluffLanded: "Bluff Landed", sustained: "Sustained",
      overruled: "Overruled", caughtFake: "Caught Faking",
    };
    const stampColors = {
      accepted: "var(--sage-bright)", bluffLanded: "var(--brass-bright)", sustained: "var(--sage-bright)",
      overruled: "var(--velvet-bright)", caughtFake: "var(--velvet-bright)",
    };
    const stamp = document.getElementById("ruling-stamp");
    stamp.textContent = stampLabels[result.outcome] || result.outcome;
    stamp.style.color = stampColors[result.outcome] || "var(--brass-bright)";
    document.getElementById("ruling-line").textContent = result.line || "No objection — the point stands.";
    document.getElementById("ruling-detail").textContent = statement.evidenceCard
      ? `The evidence was: ${EVIDENCE_TYPES[statement.evidenceCard.type].label}.`
      : "";
  }

  function continueAfterRuling() {
    document.getElementById("panel-ruling").classList.add("hidden");
    advanceTurn();
  }

  function advanceTurn() {
    G.seq++;
    if (G.seq > 1) { G.seq = 0; G.round++; }
    if (G.round > 3) {
      if (currentMode !== "online" || MP.isHost()) finishMatch();
      else showWaitingPanel("Waiting for the final verdict…");
      return;
    }
    nextStatement();
  }

  function finishMatch() {
    const verdict = decideVerdict(G.scores.A, G.scores.B);
    const verdictData = {
      verdict, scores: { ...G.scores },
      seats: JSON.parse(JSON.stringify(G.seats)), caseTitle: G.case.title,
    };
    if (currentMode === "online" && MP.isHost()) {
      MP.sendAction("verdict", { verdictData });
    }
    showVerdictScreen(verdictData);
  }

  function showVerdictScreen(verdictData) {
    const { verdict, scores, seats, caseTitle } = verdictData;
    const winnerSide = verdict.winner;
    const loserSide = winnerSide === "A" ? "B" : "A";

    document.getElementById("verdict-winner").textContent = `${seats[winnerSide].name} wins the case`;
    document.getElementById("verdict-line").textContent = verdict.line;
    document.getElementById("verdict-name-a").textContent = seats.A.name;
    document.getElementById("verdict-score-a").textContent = Math.round(scores.A);
    document.getElementById("verdict-name-b").textContent = seats.B.name;
    document.getElementById("verdict-score-b").textContent = Math.round(scores.B);

    const { winner: wProfile } = recordResult({
      winnerName: seats[winnerSide].name, loserName: seats[loserSide].name,
      caseTitle, winnerPoints: verdict.winnerPoints, loserPoints: verdict.loserPoints,
    });
    const rank = rankForPoints(wProfile.points);
    document.getElementById("verdict-points").textContent =
      `${seats[winnerSide].name} earns ${verdict.winnerPoints} rank points — now a ${rank.name} (${wProfile.points} pts). ${seats[loserSide].name} earns ${verdict.loserPoints}.`;

    lastVerdictData = { ...verdictData, winnerName: seats[winnerSide].name, loserName: seats[loserSide].name };

    if (currentMode === "party") rotatePartyQueue(winnerSide);
    show("verdict");
  }

  function rotatePartyQueue(winnerSide) {
    const winnerName = G.seats[winnerSide].name;
    const loserSide = winnerSide === "A" ? "B" : "A";
    const loserName = G.seats[loserSide].name;
    const rest = partyRoster.filter((n) => n !== winnerName && n !== loserName);
    partyRoster = [winnerName, ...rest, loserName];
  }

  function playAgain() {
    if (currentMode === "passplay") { startMatch(G.seats.A.name, G.seats.B.name); return; }
    if (currentMode === "party") { startMatch(partyRoster[0], partyRoster[1]); return; }
    if (currentMode === "daily") { show("home"); return; }
    if (currentMode === "online") {
      if (MP.isHost()) onlineHostStartMatch(G.seats.B.name);
      else showWaitingPanel("Waiting for the host to start the next case…");
    }
  }

  // ---------- Receipt download ----------
  function downloadReceipt() {
    if (!lastVerdictData) return;
    const canvas = document.getElementById("receipt-canvas");
    const ctx = canvas.getContext("2d");
    const { winnerName, loserName, caseTitle, verdict } = lastVerdictData;

    const bg = new Image();
    bg.onload = () => {
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
      drawReceiptText(ctx, canvas, { winnerName, loserName, caseTitle, verdict });
      triggerReceiptDownload(canvas);
    };
    bg.onerror = () => {
      // Fall back to a plain background if the art fails to load for any reason.
      ctx.fillStyle = "#2e2016";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#c9a227";
      ctx.lineWidth = 6;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
      drawReceiptText(ctx, canvas, { winnerName, loserName, caseTitle, verdict });
      triggerReceiptDownload(canvas);
    };
    bg.src = "assets/receipt-border.jpg";
  }

  function drawReceiptText(ctx, canvas, { winnerName, loserName, caseTitle, verdict }) {
    ctx.textAlign = "center";
    ctx.fillStyle = "#7c2632";
    ctx.font = "600 30px Georgia";
    ctx.fillText("VAKIL ADALAT", canvas.width / 2, 130);
    ctx.fillStyle = "#5a4632";
    ctx.font = "italic 20px Georgia";
    ctx.fillText("Case Receipt", canvas.width / 2, 165);

    ctx.fillStyle = "#2e2016";
    ctx.font = "600 32px Georgia";
    wrapText(ctx, caseTitle, canvas.width / 2, 260, 560, 40);

    ctx.fillStyle = "#7c2632";
    ctx.font = "600 26px Georgia";
    ctx.fillText(`${winnerName} wins the case`, canvas.width / 2, 440);

    ctx.fillStyle = "#5a4632";
    ctx.font = "400 18px Georgia";
    wrapText(ctx, verdict.line, canvas.width / 2, 480, 520, 26);

    ctx.fillStyle = "#2e2016";
    ctx.font = "500 20px monospace";
    ctx.fillText(`${winnerName}  vs  ${loserName}`, canvas.width / 2, 620);

    ctx.fillStyle = "#7a6a4d";
    ctx.font = "400 15px monospace";
    ctx.fillText(new Date().toLocaleDateString(), canvas.width / 2, canvas.height - 90);
  }

  function triggerReceiptDownload(canvas) {
    const link = document.createElement("a");
    link.download = `vakil-adalat-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = String(text).split(" ");
    let line = "";
    let curY = y;
    for (let i = 0; i < words.length; i++) {
      const test = line + words[i] + " ";
      if (ctx.measureText(test).width > maxWidth && i > 0) {
        ctx.fillText(line, x, curY);
        line = words[i] + " ";
        curY += lineHeight;
      } else {
        line = test;
      }
    }
    ctx.fillText(line, x, curY);
  }

  // ---------- Profiles ----------
  function renderProfiles() {
    const list = document.getElementById("profiles-list");
    const rows = leaderboard();
    if (!rows.length) {
      list.innerHTML = '<p class="hint">No cases played yet. Head to the court.</p>';
      return;
    }
    list.innerHTML = rows.map((p) => {
      const rank = rankForPoints(p.points);
      return `<div class="profile-row">
        <div class="profile-name">${escapeHtml(p.name)}</div>
        <div class="profile-rank">${rank.name} · ${p.points} pts</div>
        <div class="profile-stats">${p.wins}W – ${p.losses}L · Best streak ${p.bestStreak}</div>
      </div>`;
    }).join("");
  }

  function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  show("home");
})();
