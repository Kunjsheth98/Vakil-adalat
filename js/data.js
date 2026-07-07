/* VAKIL ADALAT — Game Data
   Everything here is plain data. Add new cases by copying the shape below —
   the engine and UI read this file automatically, nothing else needs to change.
*/

// ---------- EVIDENCE TYPES ----------
// "fake" cards are bluffs: big reward if your opponent doesn't call them out,
// big penalty if they do and the judge catches it.
const EVIDENCE_TYPES = {
  solid:  { label: "Solid Proof",   baseStrength: 5 },
  eye:    { label: "Eyewitness",    baseStrength: 4 },
  clue:   { label: "Indirect Clue", baseStrength: 3 },
  said:   { label: "Someone Said",  baseStrength: 2 },
  fake:   { label: "Fake",          baseStrength: 5, forged: true },
};

// ---------- ARGUMENT TYPES ----------
// Each player picks one of these to pair with an evidence card when they present.
const ARGUMENT_TYPES = [
  { id: "state",   name: "State Your Case",       desc: "Lay out your side, plain and simple.",          synergy: ["solid", "clue"] },
  { id: "question",name: "Question Them",         desc: "Push on a weak point in their story.",          synergy: ["said", "clue"] },
  { id: "history",name: "Bring Up Their History",desc: "Point out something they did before.",         synergy: ["eye", "said"] },
  { id: "emotion", name: "Make It Emotional",      desc: "Make the judge feel it, not just hear it.",     synergy: ["eye", "fake"] },
  { id: "loophole",name: "Find The Loophole",      desc: "Twist the rules in your favor.",                synergy: ["clue", "solid"] },
  { id: "twist",   name: "Reveal A Twist",         desc: "Drop something nobody saw coming.",             synergy: ["fake", "eye"] },
];

// ---------- JUDGE FLAVOR LINES ----------
const JUDGE_LINES = {
  sustained: [
    "Objection sustained. That claim doesn't hold up.",
    "Sustained. Nice catch.",
    "The court agrees — that argument falls apart.",
    "Sustained. You saw right through that.",
    "That won't stand. Objection sustained.",
    "Sustained. The evidence just wasn't strong enough.",
    "The court is not convinced. Sustained.",
    "Good instinct — sustained.",
    "Sustained. That story had a hole in it.",
    "The judge nods. Sustained.",
  ],
  overruled: [
    "Overruled. That argument was solid.",
    "Overruled — you jumped the gun there.",
    "The court disagrees. Overruled.",
    "Overruled. Should've let that one go.",
    "That objection doesn't land. Overruled.",
    "Overruled. The evidence checks out.",
    "The judge shakes their head. Overruled.",
    "Overruled — a bit too eager there.",
    "That claim was fine. Overruled.",
    "Overruled. Save your objections for something weaker.",
  ],
  caughtFake: [
    "Caught red-handed. That evidence was fake, and the court noticed.",
    "The court examines it closely — this is forged. Big mistake.",
    "Fake evidence, exposed in open court. That costs you.",
    "The judge isn't fooled. That was a forgery.",
  ],
  bluffLanded: [
    "Nobody questioned it. That bluff paid off completely.",
    "Unchallenged, and it worked. Bold move.",
    "The court took it at face value. Well played.",
    "No one saw through it. That's a win.",
  ],
  winClose: [
    "A close one. The court had to think this through.",
    "It came down to the final word.",
    "Both sides argued well. This one was tight.",
  ],
  winClear: [
    "The court's decision is clear on this one.",
    "No real contest here — one side argued much better.",
    "This case was decided early, and it stayed that way.",
  ],
};

// ---------- CASE BANK ----------
// evidence[].owner: "A" or "B" — which player privately holds that card.
// Each case has 6 evidence cards, 3 per side, so neither player sees the full picture.
const CASES = [
  {
    id: "c01", title: "The Vanishing Biryani",
    hook: "Someone's lunch disappeared from the office fridge. The whole floor has opinions.",
    plaintiff: "Sneha", defendant: "Priya",
    story: "Sneha's biryani vanished from the shared fridge between 1 and 2 PM. Priya was the last person seen near it.",
    evidence: [
      { type: "solid", text: "The office camera shows someone in a blue kurta opening the fridge at 1 PM.", owner: "A" },
      { type: "said", text: "The security guard mentions seeing Priya carry a tiffin box out around that time.", owner: "A" },
      { type: "fake", text: "A note turns up claiming 'I saw Priya eat it — signed, a colleague.' No such colleague exists.", owner: "A" },
      { type: "clue", text: "Priya's own empty tiffin is found in the sink around the same time.", owner: "B" },
      { type: "eye", text: "Rahul says he saw Sneha's tiffin still sitting in the fridge at 2 PM.", owner: "B" },
      { type: "solid", text: "Priya's phone shows a call from 12:45 to 1:15 PM — she was outside the building.", owner: "B" },
    ],
    twist: "The biryani was finished by the office boy, who confessed over chai two days later.",
  },
  {
    id: "c02", title: "The Wi-Fi Password Betrayal",
    hook: "The building Wi-Fi password changed overnight, and one flat is being blamed.",
    plaintiff: "Aditya", defendant: "the Mehta family",
    story: "The shared building Wi-Fi password changed without warning. Aditya says the Mehtas did it out of spite after last month's parking dispute.",
    evidence: [
      { type: "clue", text: "The Mehtas' teenage son is the only other person who knows the router login.", owner: "A" },
      { type: "said", text: "The watchman mentions someone from 'the Mehta side' fiddling with the router box.", owner: "A" },
      { type: "fake", text: "A screenshot appears to show Mr. Mehta texting 'let's teach him a lesson' — but the timestamp looks off.", owner: "A" },
      { type: "solid", text: "The router company confirms the password reset was triggered from a maintenance app, not manually.", owner: "B" },
      { type: "eye", text: "A neighbor saw the internet technician visit that same morning for a routine update.", owner: "B" },
      { type: "clue", text: "The Mehtas' own Wi-Fi also stopped working that day.", owner: "B" },
    ],
    twist: "It really was a routine provider update. The Mehtas didn't even know the password had changed.",
  },
  {
    id: "c03", title: "The Group Project Ghost",
    hook: "One name is on the project, and everyone insists it isn't the one who did the work.",
    plaintiff: "Meera", defendant: "Kabir",
    story: "Kabir's name is listed as lead on a group project that scored well, but Meera says she wrote most of it.",
    evidence: [
      { type: "solid", text: "The document's edit history shows Meera made 80% of the changes.", owner: "A" },
      { type: "said", text: "A classmate mentions overhearing Kabir say he 'barely touched it.'", owner: "A" },
      { type: "fake", text: "A chat message appears where Kabir 'admits' he did nothing — but the chat app shows no such message was ever sent.", owner: "A" },
      { type: "eye", text: "The professor recalls Kabir asking sharp, detailed questions about the topic in class.", owner: "B" },
      { type: "clue", text: "Kabir's laptop shows hours of research browsing on the same topic that week.", owner: "B" },
      { type: "solid", text: "An earlier draft, saved on Kabir's device, already had the project's core structure.", owner: "B" },
    ],
    twist: "They'd split the work exactly evenly — Meera wrote the words, Kabir built the entire structure and research.",
  },
  {
    id: "c04", title: "The Terrace Garden Turf War",
    hook: "One pot of tomatoes has turned two flatmates into rivals.",
    plaintiff: "Farida", defendant: "Om",
    story: "Farida's tomato plants on the shared terrace were found trampled. Om had complained about the plants blocking his drying rack the week before.",
    evidence: [
      { type: "said", text: "The building help mentions Om muttering about 'sorting out the plant problem.'", owner: "A" },
      { type: "clue", text: "Om's slippers left a print in the soil near the damaged pots.", owner: "A" },
      { type: "fake", text: "A note is 'found' saying Om planned it — but it's written in handwriting that doesn't match his at all.", owner: "A" },
      { type: "eye", text: "The building watchman saw a large stray cat chasing pigeons across the terrace that morning.", owner: "B" },
      { type: "solid", text: "CCTV from the stairwell shows Om never went up to the terrace that day.", owner: "B" },
      { type: "clue", text: "The same footprint pattern is found near three other pots on the terrace, all damaged the same way.", owner: "B" },
    ],
    twist: "A stray cat, chased by a dog, had rampaged across the entire terrace. Om's slippers were an old pair he'd thrown out weeks earlier.",
  },
  {
    id: "c05", title: "The Cousin's Cookbook Claim",
    hook: "Grandmother's handwritten recipe book has two claimants and one binding.",
    plaintiff: "Ritu", defendant: "Naina",
    story: "Grandmother passed without naming who should keep her recipe book. Both cousins say she promised it to them.",
    evidence: [
      { type: "said", text: "An aunt recalls Grandmother once saying Ritu 'has my hands for cooking.'", owner: "A" },
      { type: "clue", text: "Ritu has been the one cooking Grandmother's recipes at every family function for years.", owner: "A" },
      { type: "fake", text: "A torn note surfaces reading 'the book goes to Ritu' — but it's on paper that wasn't even sold when Grandmother was alive.", owner: "A" },
      { type: "eye", text: "The family priest remembers Grandmother handing the book to Naina personally, two years before she passed.", owner: "B" },
      { type: "solid", text: "The inside cover has a note in Grandmother's own hand: 'For Naina, who will feed the whole family.'", owner: "B" },
      { type: "clue", text: "Naina has been collecting and organizing all of Grandmother's other recipes into a second notebook.", owner: "B" },
    ],
    twist: "Grandmother had written Naina's name inside, but always meant for the two cousins to cook from it together.",
  },
  {
    id: "c06", title: "The Cricket Ball Window",
    hook: "A window is shattered, a cricket ball sits on the carpet, and every kid in the colony has an alibi.",
    plaintiff: "Mr. Nair", defendant: "the colony kids' cricket team",
    story: "Mr. Nair's living room window shattered during evening play. He says the team captain, Aryan, hit the ball.",
    evidence: [
      { type: "eye", text: "A passerby saw a boy in a yellow jersey take the shot right before the crash.", owner: "A" },
      { type: "clue", text: "Aryan was batting at that exact over, based on the match scorecard kept by the kids.", owner: "A" },
      { type: "fake", text: "A 'confession note' appears under Mr. Nair's door — but none of the kids can write in that handwriting.", owner: "A" },
      { type: "solid", text: "The scorecard shows Aryan was actually bowling, not batting, at that over.", owner: "B" },
      { type: "said", text: "Another neighbor mentions a strong gust of wind knocked a flowerpot off a balcony around the same time.", owner: "B" },
      { type: "clue", text: "Glass shards are found scattered in a pattern more consistent with something falling from above than a ball from the street.", owner: "B" },
    ],
    twist: "A flowerpot from the fourth floor had actually fallen and hit the window. The cricket ball landed nearby purely by coincidence.",
  },
  {
    id: "c07", title: "The Wedding Playlist Coup",
    hook: "The DJ played the wrong song at the wrong moment, and someone must answer for it.",
    plaintiff: "the bride, Ishita", defendant: "her cousin, Dev",
    story: "During the couple's first dance, the DJ played an upbeat item number instead of the chosen romantic song. Ishita says Dev, who controls the playlist app, swapped it as a prank.",
    evidence: [
      { type: "said", text: "A cousin overheard Dev laughing about 'a surprise' for the first dance, days before the wedding.", owner: "A" },
      { type: "clue", text: "Dev's phone was connected to the DJ's speaker system at the time.", owner: "A" },
      { type: "fake", text: "A screenshot shows Dev 'confirming' the prank in a group chat — but the message format doesn't match that app at all.", owner: "A" },
      { type: "solid", text: "The DJ's own equipment log shows a playlist software glitch reordered the queue automatically.", owner: "B" },
      { type: "eye", text: "The sound engineer saw the error appear on his screen and tried to fix it in real time.", owner: "B" },
      { type: "clue", text: "The same software glitch happened at another wedding the DJ worked the week before.", owner: "B" },
    ],
    twist: "The DJ's playlist app had a known bug that randomly reordered songs. Dev's 'surprise' was actually a gift, unrelated to the music.",
  },
  {
    id: "c08", title: "The Society Parking Spot Standoff",
    hook: "One parking spot, two cars, and a scratch that wasn't there yesterday.",
    plaintiff: "Mrs. Kapoor", defendant: "the new tenant, Vivaan",
    story: "Mrs. Kapoor's car has a fresh scratch, and she parks in the same spot Vivaan tried to take last week.",
    evidence: [
      { type: "clue", text: "Vivaan was seen parking a slightly larger car in that same tight spot recently.", owner: "A" },
      { type: "said", text: "The society watchman mentions overhearing Vivaan complain about the spot being 'too small for anyone.'", owner: "A" },
      { type: "fake", text: "A photo appears to show Vivaan's car close to the scratch — but the photo's timestamp is from a different day entirely.", owner: "A" },
      { type: "solid", text: "CCTV footage shows a delivery scooter clipping Mrs. Kapoor's car while reversing.", owner: "B" },
      { type: "eye", text: "A resident saw the delivery rider apologize and quickly ride off.", owner: "B" },
      { type: "clue", text: "The scratch height and angle match a scooter mirror, not a car.", owner: "B" },
    ],
    twist: "A delivery scooter did it and left before anyone caught the number plate. Vivaan hadn't parked there in over a week.",
  },
  {
    id: "c09", title: "The Group Chat Admin Removal",
    hook: "Someone got removed from the family WhatsApp group, and nobody will admit who did it.",
    plaintiff: "Uncle Suresh", defendant: "his nephew, Karan",
    story: "Uncle Suresh was removed from the family group chat right after a heated argument about property. He blames Karan, the group's admin.",
    evidence: [
      { type: "clue", text: "Karan is one of only two admins in the group.", owner: "A" },
      { type: "said", text: "A cousin recalls Karan saying Uncle Suresh's messages were 'getting out of hand.'", owner: "A" },
      { type: "fake", text: "A screenshot shows Karan 'confirming' the removal to a friend — but the phone model shown doesn't match Karan's at all.", owner: "A" },
      { type: "solid", text: "WhatsApp's own group log shows the other admin, Aunt Pooja, made the removal, not Karan.", owner: "B" },
      { type: "eye", text: "Aunt Pooja's daughter says her mother was visibly upset and left the room right after the argument.", owner: "B" },
      { type: "clue", text: "Karan was on a work call, phone untouched, for the entire duration of the argument.", owner: "B" },
    ],
    twist: "Aunt Pooja removed Uncle Suresh in the heat of the moment and immediately regretted it, but was too embarrassed to say so.",
  },
  {
    id: "c10", title: "The Elevator Etiquette Case",
    hook: "The lift got stuck, tempers got shorter, and now there's a formal complaint.",
    plaintiff: "Mr. Joshi", defendant: "the delivery agent, Sanjay",
    story: "Mr. Joshi says Sanjay held the lift door open with heavy boxes, causing it to jam for twenty minutes with him inside.",
    evidence: [
      { type: "said", text: "The building guard mentions Sanjay was in a hurry with a large delivery that day.", owner: "A" },
      { type: "clue", text: "Sanjay's delivery log shows a stop at that exact floor around the time of the jam.", owner: "A" },
      { type: "fake", text: "A 'complaint form' from another resident appears, blaming Sanjay directly — but the resident named says they never wrote it.", owner: "A" },
      { type: "solid", text: "The lift maintenance company's report shows a worn-out door sensor, a known recurring fault.", owner: "B" },
      { type: "eye", text: "Another tenant recalls the same lift getting briefly stuck the previous week, with nobody near the doors.", owner: "B" },
      { type: "clue", text: "Sanjay had already left the building, based on his delivery app's GPS log, before the jam occurred.", owner: "B" },
    ],
    twist: "The lift had a documented sensor fault that the society had been ignoring for months.",
  },
  {
    id: "c11", title: "The Salon Appointment Standoff",
    hook: "Two women, one appointment slot, and a salon receptionist caught in the middle.",
    plaintiff: "Anushka", defendant: "Tanvi",
    story: "Anushka arrives for her 5 PM slot to find Tanvi already in the chair, both holding booking confirmations for the same time.",
    evidence: [
      { type: "solid", text: "Anushka's phone shows a confirmation SMS for the 5 PM slot, sent three days earlier.", owner: "A" },
      { type: "said", text: "The salon's junior staff recalls Anushka calling to confirm the appointment that morning.", owner: "A" },
      { type: "fake", text: "A screenshot appears showing Tanvi booking a 'fake' slot to steal it — but the booking app used doesn't even have that screen.", owner: "A" },
      { type: "eye", text: "The salon owner remembers personally booking Tanvi for 5 PM after a walk-in cancellation created the slot.", owner: "B" },
      { type: "clue", text: "The salon's booking system shows a known double-booking bug from that week, confirmed by three other customers.", owner: "B" },
      { type: "solid", text: "Tanvi's confirmation message has an identical timestamp to Anushka's, down to the second — proof of the system glitch.", owner: "B" },
    ],
    twist: "The salon's new booking software had double-booked several slots that week. Neither woman had done anything wrong.",
  },
  {
    id: "c12", title: "The Missing Umbrella Mystery",
    hook: "A favorite umbrella disappears from the office stand on the rainiest day of the year.",
    plaintiff: "Neha", defendant: "the intern, Yash",
    story: "Neha's umbrella, a distinctive purple one, vanished from the office stand right when the monsoon started. Yash was seen leaving early that day.",
    evidence: [
      { type: "clue", text: "Yash left the office right as the rain started, without an umbrella of his own that morning.", owner: "A" },
      { type: "said", text: "A colleague mentions seeing 'someone new' near the umbrella stand that afternoon.", owner: "A" },
      { type: "fake", text: "A photo appears to show Yash holding a purple umbrella outside — but the location in the photo isn't even near the office.", owner: "A" },
      { type: "solid", text: "CCTV shows a food delivery rider grabbing an umbrella from the stand by mistake, then returning it the next day.", owner: "B" },
      { type: "eye", text: "The security guard confirms the rider returned an umbrella the following morning, apologizing for the mix-up.", owner: "B" },
      { type: "clue", text: "Yash's own umbrella was later found, left behind in a meeting room the whole time.", owner: "B" },
    ],
    twist: "A confused delivery rider grabbed the wrong umbrella by mistake and returned it the very next day.",
  },
  {
    id: "c13", title: "The Chai Stall Credit Dispute",
    hook: "The neighborhood chai stall says someone owes forty days of unpaid tea, and two regulars are pointing fingers.",
    plaintiff: "the chai stall owner, Bhaiyya", defendant: "the regular customer, Rohit",
    story: "Bhaiyya's notebook shows an unpaid tab under 'Rohit,' but Rohit insists he always pays in cash immediately.",
    evidence: [
      { type: "said", text: "Another regular recalls Rohit saying 'add it to my tab' more than once.", owner: "A" },
      { type: "clue", text: "The notebook entry is dated across weeks matching Rohit's regular visiting pattern exactly.", owner: "A" },
      { type: "fake", text: "A 'signed IOU' turns up in Rohit's name — but Rohit has never signed anything at that stall, ever.", owner: "A" },
      { type: "solid", text: "Rohit's bank statement shows daily small cash withdrawals matching tea money, every single day in that period.", owner: "B" },
      { type: "eye", text: "The stall's other worker remembers a different regular, also named Rohit, who does run a tab.", owner: "B" },
      { type: "clue", text: "Bhaiyya's notebook has no surname, and two customers share the same first name.", owner: "B" },
    ],
    twist: "There were two Rohits, and Bhaiyya's notebook never distinguished between them. The tab belonged to the other one.",
  },
  {
    id: "c14", title: "The Diwali Lights Short Circuit",
    hook: "A power cut hit the whole lane on Diwali night, and two houses blame each other's decorations.",
    plaintiff: "the Sharmas", defendant: "the Guptas",
    story: "The Sharmas' elaborate light display went dark along with half the lane's power. They say the Guptas overloaded the shared line with an oversized setup.",
    evidence: [
      { type: "clue", text: "The Guptas installed noticeably more lights than previous years, based on neighbors' photos.", owner: "A" },
      { type: "said", text: "An electrician mentions the Guptas asking him about running 'a lot more current' this year.", owner: "A" },
      { type: "fake", text: "A bill appears showing the Guptas bought an unusually high number of light strings — but the shop named on it closed down two years ago.", owner: "A" },
      { type: "solid", text: "The electricity board's report says an old transformer in the lane failed due to age, unrelated to any single house.", owner: "B" },
      { type: "eye", text: "Three other lanes on the same grid also lost power that same evening.", owner: "B" },
      { type: "clue", text: "The transformer had been flagged for replacement in a notice sent out two months earlier.", owner: "B" },
    ],
    twist: "An aging transformer serving several lanes failed on its own, a problem the electricity board had already been warned about.",
  },
  {
    id: "c15", title: "The Library Book Highlighter Crime",
    hook: "A library book comes back covered in yellow highlighter, and the last two borrowers are being questioned.",
    plaintiff: "the college librarian", defendant: "the student, Ayesha",
    story: "A reference book is returned heavily highlighted, against library rules. Ayesha borrowed it right before it was returned.",
    evidence: [
      { type: "clue", text: "The borrowing register shows Ayesha had the book for two full weeks before returning it.", owner: "A" },
      { type: "said", text: "A classmate recalls Ayesha mentioning she 'marks up' her study books a lot.", owner: "A" },
      { type: "fake", text: "A 'confession note' inside the book reads 'sorry, was in a hurry — Ayesha' — but Ayesha's actual handwriting looks nothing like it.", owner: "A" },
      { type: "solid", text: "The register shows another student borrowed the book for two days between Ayesha's return and the librarian noticing the marks.", owner: "B" },
      { type: "eye", text: "The library assistant recalls that other student, Farhan, returning it looking flustered.", owner: "B" },
      { type: "clue", text: "Farhan's own notes for that week use the exact same brand of yellow highlighter.", owner: "B" },
    ],
    twist: "Farhan borrowed the book briefly in between and marked it up, then returned it quickly hoping nobody would notice.",
  },
  {
    id: "c16", title: "The Gym Locker Swap",
    hook: "Someone's gym bag went home with the wrong person, and now a phone is missing.",
    plaintiff: "Zoya", defendant: "the new gym member, Karthik",
    story: "Zoya's phone was in her gym bag, which went missing from the locker room. Karthik, new to the gym, had a similar bag.",
    evidence: [
      { type: "clue", text: "Karthik's bag is the same brand and color as Zoya's.", owner: "A" },
      { type: "said", text: "The gym trainer recalls Karthik leaving in a rush, looking a little confused about his belongings.", owner: "A" },
      { type: "fake", text: "A message appears where Karthik supposedly 'admits' taking the wrong bag on purpose — but it's from a number that was never his.", owner: "A" },
      { type: "solid", text: "Karthik returned to the gym the same evening, bag in hand, once he realized the mix-up at home.", owner: "B" },
      { type: "eye", text: "The front desk confirms Karthik came back and handed the bag over immediately, phone untouched inside.", owner: "B" },
      { type: "clue", text: "Zoya's phone had no new activity, calls, or messages during the hours it was missing.", owner: "B" },
    ],
    twist: "It was a genuine mix-up between two identical gym bags. Karthik returned it the same evening, embarrassed but honest.",
  },
  {
    id: "c17", title: "The Exam Snack Contribution Dispute",
    hook: "A study group's snack fund is short, and one member is accused of eating more than they paid for.",
    plaintiff: "the study group", defendant: "Dhruv",
    story: "The shared snack fund for exam-week study sessions is running low, and the group suspects Dhruv of eating without contributing his share.",
    evidence: [
      { type: "said", text: "A group member mentions Dhruv always arriving 'just as the snacks come out.'", owner: "A" },
      { type: "clue", text: "Dhruv's contribution to the shared fund app shows the smallest amount among the group.", owner: "A" },
      { type: "fake", text: "A doctored screenshot shows Dhruv 'refusing to pay' in the group chat — but the message doesn't appear anywhere in the actual chat history.", owner: "A" },
      { type: "solid", text: "Dhruv's payment app shows he separately bought snacks for the whole group twice, outside the shared fund.", owner: "B" },
      { type: "eye", text: "Another group member recalls Dhruv insisting on buying a full round of samosas 'on him' just last week.", owner: "B" },
      { type: "clue", text: "Dhruv contributed less to the fund specifically because he was already covering snacks separately.", owner: "B" },
    ],
    twist: "Dhruv had been quietly buying extra snacks out of his own pocket instead of the shared fund, which is why his fund contribution looked low.",
  },
  {
    id: "c18", title: "The Society Holi Water Balloon Incident",
    hook: "A car's paint got damaged during Holi, and the colony kids are all suspects.",
    plaintiff: "Mr. Verma", defendant: "the colony's Holi committee",
    story: "Mr. Verma's car has paint damage after Holi celebrations, and he blames the water balloon fight organized by the colony kids.",
    evidence: [
      { type: "clue", text: "The car was parked directly below the terrace where the water balloon fight happened.", owner: "A" },
      { type: "said", text: "A neighbor recalls seeing balloons filled with colored water thrown from that terrace all afternoon.", owner: "A" },
      { type: "fake", text: "A 'list of culprits' is passed around naming specific kids — but it's clearly written by someone who wasn't even present that day.", owner: "A" },
      { type: "solid", text: "The car mechanic's report says the damage is from bird droppings left untreated for weeks, not water or color.", owner: "B" },
      { type: "eye", text: "Mr. Verma's own neighbor recalls mentioning the bird droppings to him a week before Holi.", owner: "B" },
      { type: "clue", text: "None of the other cars parked in the same spot during Holi show any paint damage at all.", owner: "B" },
    ],
    twist: "The damage was old bird-dropping corrosion Mr. Verma had ignored for weeks. Holi had nothing to do with it.",
  },
  {
    id: "c19", title: "The Karaoke Mic Hijack",
    hook: "One friend's big karaoke moment got cut short, and the mic cable was mysteriously unplugged.",
    plaintiff: "Ananya", defendant: "her friend, Ishaan",
    story: "Right as Ananya hit the chorus of her favorite song, the mic went dead. She's convinced Ishaan unplugged it out of friendly rivalry.",
    evidence: [
      { type: "said", text: "A friend mentions Ishaan joking earlier that night about 'stealing the spotlight.'", owner: "A" },
      { type: "clue", text: "Ishaan was standing closest to the sound system's cable box at the time.", owner: "A" },
      { type: "fake", text: "A video clip appears to show Ishaan's hand near the plug — but the video is clearly from a different, earlier song.", owner: "A" },
      { type: "solid", text: "The karaoke machine's own fault log shows a battery cut-off, a known issue with that rental unit.", owner: "B" },
      { type: "eye", text: "The venue staff recalls the same machine cutting out during a different group's turn earlier that evening.", owner: "B" },
      { type: "clue", text: "Ishaan was actually filming Ananya's performance on his phone at the exact moment the mic died.", owner: "B" },
    ],
    twist: "The rented karaoke machine had a faulty battery that had already cut out once earlier that night, for a completely different group.",
  },
  {
    id: "c20", title: "The Shared Cab Fare Fallout",
    hook: "Four friends shared a cab home, and the fare-splitting math has turned into a small war.",
    plaintiff: "Priyanka", defendant: "Zubin",
    story: "Priyanka says Zubin paid for a shorter distance than everyone else but is asking for an equal split.",
    evidence: [
      { type: "clue", text: "Zubin got off two stops before everyone else, based on the group's memory of the ride.", owner: "A" },
      { type: "said", text: "Another friend recalls Zubin insisting the split should be 'equal no matter what.'", owner: "A" },
      { type: "fake", text: "A 'fare breakdown' appears showing Zubin owing less than he offered — but the numbers on it don't match the cab app's actual receipt at all.", owner: "A" },
      { type: "solid", text: "The cab app's official receipt shows Zubin paid extra upfront to cover the tip and waiting charges for everyone.", owner: "B" },
      { type: "eye", text: "The driver remembers Zubin specifically asking to round up the fare so it would be 'easy to split evenly.'", owner: "B" },
      { type: "clue", text: "The final amount, split four ways, comes out exactly even once the tip Zubin covered is factored in.", owner: "B" },
    ],
    twist: "Zubin had quietly covered the tip and waiting charges himself, which is exactly why the even split made sense.",
  },
  {
    id: "c21", title: "The Bakery Cake Mix-Up",
    hook: "Two identical birthday cakes, one bakery counter, and a very confused delivery boy.",
    plaintiff: "the Malhotra family", defendant: "the bakery", 
    story: "The Malhotras ordered a cake with 'Happy Birthday Aryan' but received one that says 'Happy Birthday Arnav' instead.",
    evidence: [
      { type: "solid", text: "The bakery's order slip clearly lists 'Aryan' with the correct spelling and pickup time.", owner: "A" },
      { type: "said", text: "A bakery staff member mentions two cakes for similar names were being prepared the same afternoon.", owner: "A" },
      { type: "fake", text: "A receipt appears showing the Malhotras 'confirmed' the wrong name themselves — but the receipt format doesn't match this bakery's billing system.", owner: "A" },
      { type: "eye", text: "The delivery boy recalls grabbing the wrong box because both cakes looked identical and were placed side by side.", owner: "B" },
      { type: "clue", text: "Another family with a child named Arnav had ordered the exact same cake design that same day.", owner: "B" },
      { type: "solid", text: "The bakery's kitchen camera shows both boxes being packed correctly, just placed next to each other before pickup.", owner: "B" },
    ],
    twist: "Two families ordered the same cake design for kids with similar names, and the delivery boy simply grabbed the wrong box.",
  },
  {
    id: "c22", title: "The Remote Control Case",
    hook: "The TV remote is missing its batteries again, and one roommate is tired of asking.",
    plaintiff: "Tanya", defendant: "her flatmate, Om Prakash",
    story: "The TV remote keeps losing its batteries, and Tanya suspects Om Prakash keeps taking them for his gaming controller.",
    evidence: [
      { type: "clue", text: "Om Prakash's gaming controller uses the exact same battery size as the TV remote.", owner: "A" },
      { type: "said", text: "A friend recalls Om Prakash mentioning he 'always seems to run low' on batteries.", owner: "A" },
      { type: "fake", text: "A 'confession text' from Om Prakash's number turns up — but he was never even in a group chat with Tanya's number.", owner: "A" },
      { type: "solid", text: "The apartment's smoke detector was chirping for a week, and the building maintenance log shows its battery was finally swapped.", owner: "B" },
      { type: "eye", text: "The maintenance man recalls grabbing 'whatever batteries were lying around' to silence the smoke detector.", owner: "B" },
      { type: "clue", text: "The missing batteries were found inside the smoke detector casing during the maintenance visit.", owner: "B" },
    ],
    twist: "The building's maintenance man had grabbed the remote's batteries to quiet a chirping smoke detector, with no one's permission.",
  },
  {
    id: "c23", title: "The Rickshaw Meter Standoff",
    hook: "A rickshaw fare dispute turned into a shouting match, and now both sides want a ruling.",
    plaintiff: "the auto driver, Ganesh", defendant: "the passenger, Simran",
    story: "Ganesh says Simran refused to pay the full metered fare. Simran says the meter was tampered with to run faster than usual.",
    evidence: [
      { type: "said", text: "A nearby vendor recalls Ganesh's meter 'clicking a bit too fast' on previous rides too.", owner: "A" },
      { type: "clue", text: "Simran's ride-tracking app shows a shorter distance than the fare Ganesh charged.", owner: "A" },
      { type: "fake", text: "A 'certificate' appears claiming Ganesh's meter was 'officially inspected and found faulty' — but no such inspection ever took place.", owner: "A" },
      { type: "solid", text: "The RTO's records show Ganesh's meter was calibrated and certified correct just one month earlier.", owner: "B" },
      { type: "eye", text: "A traffic policeman nearby recalls the same route taking longer that day due to a diversion for roadwork.", owner: "B" },
      { type: "clue", text: "The diversion added extra distance that Simran's app, using the usual route, didn't account for.", owner: "B" },
    ],
    twist: "A road diversion for repair work added real distance the tracking app hadn't accounted for. The meter had been correctly certified all along.",
  },
  {
    id: "c24", title: "The Office AC Temperature Truce",
    hook: "The office thermostat has become a battlefield, and someone keeps changing it in secret.",
    plaintiff: "the sales team", defendant: "the tech team",
    story: "The sales team says the tech team keeps secretly lowering the shared office AC to freezing, without asking anyone.",
    evidence: [
      { type: "clue", text: "The tech team's desks are closest to the thermostat control panel.", owner: "A" },
      { type: "said", text: "A colleague recalls a tech team member joking about needing it 'server-room cold' to think straight.", owner: "A" },
      { type: "fake", text: "A photo appears showing a tech team member's hand on the thermostat — but the photo's date is from a public holiday when the office was shut.", owner: "A" },
      { type: "solid", text: "Facilities confirms the thermostat has been running on an automated schedule since last month, not manual control.", owner: "B" },
      { type: "eye", text: "The facilities technician recalls setting the automated schedule himself, following an email requesting energy savings.", owner: "B" },
      { type: "clue", text: "The temperature drops happen at the exact same time every single day, matching a timer, not a person.", owner: "B" },
    ],
    twist: "Facilities had quietly switched the AC to an automated energy-saving schedule weeks earlier, and never told anyone.",
  },
];

// ---------- JUDGES ----------
// Each case is presided over by a randomly assigned judge with a real personality.
// This is knowable at case reveal, so players can plan around it — not hidden info.
const JUDGES = [
  {
    id: "strict", name: "Justice Rao", title: "The Strict One",
    desc: "Goes by the book. Weak objections rarely survive in this court.",
    sustainBias: 0.08, argTypeFavor: { loophole: -0.10 }, evidenceDistrust: { said: 0.08 },
    fakeCatchRate: 0.95,
  },
  {
    id: "sentimental", name: "Justice Iyer", title: "The Sentimental One",
    desc: "Swayed by a good story. Emotional arguments hit harder here.",
    sustainBias: -0.03, argTypeFavor: { emotion: -0.15 }, evidenceDistrust: {},
    fakeCatchRate: 0.82,
  },
  {
    id: "skeptical", name: "Justice Bhatt", title: "The Skeptic",
    desc: "Trusts nothing at first glance. Eyewitness claims get extra scrutiny.",
    sustainBias: 0.05, argTypeFavor: {}, evidenceDistrust: { eye: 0.12 },
    fakeCatchRate: 0.90,
  },
  {
    id: "quick", name: "Justice Fernandes", title: "The Quick One",
    desc: "Wants this case done today. Weak objections get overruled fast.",
    sustainBias: -0.08, argTypeFavor: {}, evidenceDistrust: {},
    fakeCatchRate: 0.75,
  },
  {
    id: "fair", name: "Justice Menon", title: "By The Book",
    desc: "No quirks, no favorites. Straightforward, balanced rulings.",
    sustainBias: 0, argTypeFavor: {}, evidenceDistrust: {},
    fakeCatchRate: 0.85,
  },
];

function pickJudge() {
  return JUDGES[Math.floor(Math.random() * JUDGES.length)];
}

if (typeof module !== "undefined") {
  module.exports = { EVIDENCE_TYPES, ARGUMENT_TYPES, JUDGE_LINES, CASES, JUDGES, pickJudge };
}

