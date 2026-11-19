# Gameplay redesign: Welcome Island

Release 2.1.0-quest-rehearsal.1, prepared 19 November 2026.

## The problem addressed

The previous pupil experience was a 24-screen study/choice/typing sequence. The map did not determine play, a correct response produced generic feedback, and research terminology dominated the learning screen. A theme and an ARCS observation form did not provide an adequate game experience.

The redesign makes the opening lesson a recover-the-school-map mission with four selectable stops. Each stop contains two words and has a beginning, a distinct supported challenge, written recall and a visible consequence. Pupils can save and pause between or within stops. No countdown, lost lives, public leaderboard or streak penalty is used.

| Opening stop | Targets in the draft pack | Supported challenge | Written recall | Visible consequence |
|---|---|---|---|---|
| Crew Dock | confident, nervous | Select word labels and place them beside character messages | Meaning cue → typed English form | Crew ready to sail; map piece |
| Signal Tower | eager, curious | Assemble scrambled letter tiles | English word → typed BM/English meaning | Signal restored; map piece |
| Message Bridge | calm, proud | Select messages and send them to the appropriate word dock | Meaning cue → typed English form | Bridge repaired; map piece |
| Hidden Cove | worried, patient | Choose word signs for contextual trail messages | English word → typed BM/English meaning | Safe route marked; map piece |

All character messages, illustrations, story text and rewards were authored for LexiTrek. The storyline uses the broad school-and-friendship theme; it does not reproduce textbook exercises, passages or media.

## ARCS made observable

These are design intentions to inspect and playtest, not evidence of increased motivation.

| Dimension | Implemented feature | Evidence to look for in a pupil pilot |
|---|---|---|
| Attention | Searchable satchels; distinct labelling, tile-building, sorting and route interfaces; changing task scenes | Pupils notice relevant vocabulary, understand the interactions and remain engaged without being distracted by artwork |
| Relevance | First-day introductions, feelings, club interest, cooperation and school-life examples; words solve crew messages | Pupils can explain a real school situation in which a target word would be useful |
| Confidence | Two-word opening stops; selectable order; optional clues; corrective feedback; one supported written retry; no loss penalty | Pupils can begin independently, recover after an error, and distinguish asking for help from failing |
| Satisfaction | Immediate word-specific acknowledgement, completed-stop map pieces, changing map states, personal collection and final welcome flag | Pupils understand what they earned and feel the effort produced a visible result; rewards do not imply mastery |

These elements overlap within each stop. They are not four separate islands representing A, R, C and S.

## Research design changes requiring review

The opening lesson still plans 24 **encounters**, rather than 24 separate screens: eight word displays, eight supported responses and eight written recall responses. This is a pacing/interface redesign; it is not a claim that research dosage has been reduced or that pupils need fewer encounters. The four short stops are the pupil-facing unit of progress. No fixed stop duration has been validated.

The cognitive tasks have also changed and must not be treated as identical to the preceding release:

- Letter construction replaces recognition in selected stops. It is explicitly labelled `build` and always supported.
- Introduction lessons alternate form and meaning recall between stops. S1 has four of each; later cumulative practice still includes all 32 candidates in both directions at S8.
- Within a lesson, learners can choose the order of complete stops. Actual choices and encounter order are logged; S1–S8 remain sequential.
- Later review lessons group up to four words per stop; opening and other introduction-lesson stops use two. A session with more review words has more stops, rather than pretending all lessons are four stops.
- Clues requested before a written response are recorded as support. Feedback retries have `firstAttempt:false`, `attemptNumber:2`, and cannot count as independent successes.
- Grouped responses have `elapsedMs:null` at the item level. A separate `quest_activity_completed` event records measured group time. Item times are not invented by splitting group time.
- A map piece is awarded once for completing a stop, including stops completed using corrective feedback. It is never a vocabulary test score.
- Saving the final treasure closes the lesson with observed teaching minutes unknown. The teacher can subsequently record observed digital-lesson time, with the source and an audit record for amendments.

Before research use, reconcile these choices with the teaching manual and protocol, review every message/cue against the intended sense, pilot workload inside the planned eight 30-minute lessons, then freeze the reviewed version before O1. Approval fields now also require `gameplayReviewReference` and `timingPilotReference`. Enter actual evidence, not placeholder approval strings.

The new version has a separate local storage key and source/content fingerprint. Earlier local records are not imported, overwritten or deleted. If an earlier frozen research run exists, the redesign blocks its pupil content on that browser, including during follow-up, rather than silently starting a new practice run. Review the redesign in a separate development browser profile. Teacher provides a download of the earlier local run if present. Do not combine exports from the two versions or continue an earlier frozen study using this redesign.

Independent O1/O2/O3, consent filtering, external scoring, assessment windows and the post-S8 practice pause remain in force. No primary outcome instrument or pupil motivation scale has been added.

## Review before release

The automated tests cover software rules and generated screens, including a complete game-engine journey through all eight lessons. They do not verify CSS layout or real pointer, touch, keyboard, browser storage or service-worker behaviour.

The managed preview service was unavailable. A separate GitHub Pages review route was therefore published without replacing the root app: https://chotsm.github.io/LexiTrek-Research/quest-preview/#adventure .

On 19 November 2026, a desktop browser completed all four opening stops, including reverse-order clue discovery, correct supported labelling, a wrong written response, a requested hint, a supported retry, tile assembly, pause/reload/resume retaining a partial word, an unfamiliar meaning sent for review, sorting, keyboard-operated route choices, final treasure saving and the personal collection. The local JSON download was inspected: rehearsal purpose, 24 completed encounters, four map pieces, support/first-attempt distinctions, null individual times for grouped responses and unknown observed teaching minutes were retained. No application-origin console error was observed; browser-extension metadata errors were unrelated to the application. No horizontal overflow was observed at the tested desktop width.

Actual mobile touch, narrow layout, comprehensive keyboard/screen-reader accessibility, genuine network-off offline reload and school-device use remain unverified. Before replacing the pupil-facing root release, review at least:

1. A narrow phone and a school workstation: map-pin overlap, text wrapping, contrast, input keyboard and readable instructions.
2. Each of the four opening supported interactions, wrong answers, an unfamiliar meaning, a clue and a supported second try.
3. Keyboard-only control and focus after collecting a clue, using a tile and requesting support; reduced-motion preference.
4. Pause mid-word, refresh, resume and complete a stop; collect each map piece once and save the final treasure.
5. First online preparation, then genuine offline reload and completion on the actual device, followed by local export.
6. A small supervised pupil playtest: perceived task burden, enjoyment, comprehension of instructions and observed completion time. Revise before claiming motivational suitability or effectiveness.
