# Power of Ten: Lost Civilization — Playtest Review and Art Briefs

Build reviewed: `44959fc8-Power_of_Ten_Cloudflare_Pages.zip` (30 files: `index.html`, `game.js`, five chapter pages with their JS/CSS, `place-value-scroll.html`, `rounding-scroll.html`, and 11 PNGs in `assets/`).
Target: desktop and current iPads. Old-iPad (iOS 10.3.3) limits no longer apply.
Scope: game only. No Supabase or Cloudflare work.

## How this review was done

- **Code review, not browser play.** The sandbox cannot open the game in a browser, so every finding below comes from reading the source. Items marked **[needs play test]** must be confirmed by playing on a real screen.
- **Answer generators read, not executed.** I checked the rounding and mummy answer keys by hand against their prompts. I did not run the scribe code generator.
- **Cross-checks that did run:** every element ID that the JavaScript looks up exists in its page's HTML, and the scripts each page loads are correct (`mummy-battle.html` loads `scribe-codes.js` for `normalizeCode`).

## Headline problems

1. **Fixed question order can be memorized.** In Chapter 2 (Falling Seals) and the Finale (Mummy's Last Stand), the same numbers appear in the same order with the same answers every run. A student can finish by repetition, and the score doesn't show whether they understand the skill.
2. **Chapter 1 has two steps that can be passed without reasoning.** Step 2 (move the 5 to tens) is a single toggle.
3. **Feedback is thin.** Wrong answers have no shake or sound, sound is off by default, and Chapters 2–4 have no sound at all.
4. **Hints are not tiered outside Chapter 1.** The rounding quiz gives one clue every time, and Chapter 2 and the Finale have no hint.

## Chapter by chapter

### Chapter 1: The Awakening (`game.js`)

**Keep:** The story with clickable glossary words, TEN's coaching bubble, the seven-system trail, and the tiered hints. The place-value chart modal (`openChart`) is a good self-check tool.

**Stuck or losing interest:**
- **Step 2 (move the 5 to tens) can be passed in one click.** The "Its value is ten times as much" button turns on after any move, so the student never computes 5 tens = 50.
- **Step 4 (Find the hidden forty)** has three digit choices and three place choices. A student who guesses one of nine combinations and types 40 passes. The same numbers appear every run.

**Single change to make first:** In Step 2, require the student to type the new value (50) before the check button enables. Students then have to compute the value, not just move the tile.

**Other changes:**
- Step 4 gets a generated number (e.g., 2–9 in one place, a different digit in another) so memorized answers don't work.
- Step 7 (final seal) has an optional reflection. Make one line required, such as "Why does the 0 hold the tenths place?", because the teacher summary says mastery means explaining the zero.

### Chapter 2: The Falling Seals (`falling-seals.js`)

**Keep:** The three-lane boulders with keyboard keys 1–3, the untimed checkbox, the timed countdown bar, and the feedback that names the wrong place ("Tens is two places to the left of the decimal point"). That feedback teaches the place value.

**Stuck or losing interest:**
- **The 12 examples are fixed** (`examples` array), and the lane pattern repeats every three rounds. A replay is identical, so a student can memorize all ten challenge answers.
- **No accuracy score.** The results screen shows seals cleared, best streak, and retries. It doesn't show first-attempt accuracy, which is what the teacher summary asks teachers to check.
- **A timeout counts as a miss but gives no cause beyond "Time ran out."** Adding "Hint: count from the decimal point" would turn the timeout into a teaching moment.
- **Boulder labels** use `clamp(11px, 2.4vw, 17px)`. On a small iPad, "Thousandths" may wrap. **[needs play test]**

**Single change to make first:** Generate fresh numbers for each run. Keep the same place-value rules, and draw from a pool of four-digit whole numbers with up to three decimal places. Randomize which lane holds the right answer on every round.

**Other changes:** Show first-attempt accuracy on the results screen. Add a hint button after two misses on the same round (currently there is no hint at all).

### Chapter 3: The Chamber of Scribes (`scribes.js`, `scribe-codes.js`)

**Keep:** The torch economy with a clear explanation of each lost torch, the five locks per chamber, the per-type hints ("Split at 'and'"), and the progression from hundreds to billions. The coverage is good: every room has at least two decimal codes, which matches the teacher summary.

**Stuck or losing interest:**
- **The first codes in each chamber are the same on every new browser.** The offset `(sequence + 37 + slot*19) % count` is fixed, so classmates on the same kind of machine see the same starting codes.
- **Dead end when a chamber's deck runs out.** The screen says "Every code in this set has been used" and hides the restart button. The student has no next step.
- **The hint is generic for whole numbers.** It says "Write each group in its place." The teacher summary asks students to explain what each decimal zero holds, but the game never asks.

**Single change to make first:** Seed each deal with a random start offset, and reshuffle a chamber's pool when it runs out. This removes the shared starting codes and the dead end.

**Other changes:** For whole-number codes, add a hint like "Count the groups of three digits from the right." Add a required "Which zero holds an empty place?" check in the Chamber 3 room where the teacher summary expects it.

**Note:** The door opens with a CSS slide (`.unlocked .closed-door` moves up). It works, but it has no art. See the art brief.

### Chapter 4: Rounding Scroll and Crystal Crossing (`rounding-scroll.html`, `rounding-ruins.js`)

**Keep:** The walkthrough steps (find the place, look one digit right, decide, remove digits) with the number line. Random rounding questions on each run. Crystals that act as checkpoints. Three hazards (lift, crumbling ledge, darts). The quiz can't be dismissed with Escape, so the student has to solve it. Touch buttons and keyboard controls both work.

**Stuck or losing interest:**
- **Room 1 (whole numbers) uses only values under 1** (0.426, 0.764, 0.350, 0.849). Students round 0.4 to 0 without seeing a place they need to think about. The fix is to use values such as 12.426.
- **The clue never escalates.** Every wrong try repeats the same clue: the digit to the right and "keep" or "increase." Tier 1 should name the target place. Tier 2 should show the midpoint on the number line. Reveal the answer only after two misses.
- **The walkthrough plays itself.** "Play steps" advances without the student predicting the rounding digit. Add a "You try" step before the reveal.
- **Crumbling ledge telegraphs only in text** (`'Cracked stones collapse soon after you land'`). The 0.65-second collapse is easy to miss on the status bar. See the art brief.
- **Results don't separate rounding misses from jump misses.** The results show poison hits (`spills`) but not wrong crystal answers. Add a count of wrong rounding answers, so the teacher can tell the two apart.

**Single change to make first:** Add a "You try" step to the walkthrough (student predicts the rounding digit before the reveal), and add tiered hints to the crystal quiz.

**Also check:** Room 3's crumbling ledge at speed. **[needs play test]**

### Finale: The Mummy's Last Stand (`mummy-battle.js`)

**Keep:** Twenty questions, four per skill, a 16-hit win threshold (80%), a per-skill score, and an explanation for every item in the results. The hit and counter animations show who landed the last attack. The results screen matches what the teacher summary promises.

**Stuck or losing interest:**
- **Fixed questions and order.** The same 20 items appear every battle. A student who beats the boss once can pass the next battle from memory. Only the multiple-choice options shuffle.
- **Six of the 20 items are multiple choice** (Q1, Q3, Q9, Q11, Q15, Q16). A student can guess 25% of them. The teacher summary's "3 of 4 per skill" check isn't shown anywhere in the game.
- **The counter message is vague.** "The mummy countered. This answer was incorrect." doesn't say what to check.
- **Results are not saved.** The per-skill scores are on screen only, so the teacher summary's pre/post growth can't be measured here. This is noted as out of scope for now.

**Single change to make first:** Build two question pools per skill and draw four per skill at random. Keep the 16-hit rule.

**Other changes:** Replace the counter text with a skill-specific hint, such as "Check the place of the digit first." Convert the Q1 and Q15 multiple-choice items to typed answers, or add a hint before each answer.

## Cross-cutting issues

| Area | Current state | Standard (edu-game-polish) |
|---|---|---|
| Sound | Chime only in Chapter 1, off by default. No sound in Chapters 2–4. | Correct, wrong, and streak sounds in every chapter, on by default with a mute |
| Wrong answer | Text and color only in most chapters | Small shake and soft low tone, never harsh |
| Hints | Chapter 1 tiered; Chapter 2 none; Chapter 3 one; Chapter 4 one; Finale none | Tiered hints in every chapter, with a pulse after two misses |
| Pause, restart, mute | Chapter 1 only | Pause overlay with resume, restart, quit in every game |
| Progress view | Chapter 1 trail and journal | Completed-items view in every chapter |
| Fonts | Google Fonts loaded from a CDN in `style.css` | Works offline; self-hosting is a question for the Cloudflare step |

## Top five improvements, ranked by learning impact

| Rank | Change | Size | Why it matters |
|---|---|---|---|
| 1 | Randomize question pools in Chapter 2 and the Finale | Medium | Stops memorized replays; the score starts to show understanding |
| 2 | Require typed values in Chapter 1 Steps 2 and 4 | Quick | Removes the one-click pass |
| 3 | Add a "You try" step to the walkthrough and tiered hints to the crystal quiz | Medium | Students solve before being shown; hints escalate instead of repeating |
| 4 | Seed Scribe codes randomly and reshuffle exhausted decks | Quick | Removes shared starting codes and the dead end |
| 5 | Sound on by default, plus wrong-answer shake across all chapters | Quick to medium | Makes every answer respond, as the standard requires |

**Fresh-problem check:** After each change, give the student one new number from the same skill. If they can do it without the game's examples, the change worked.

## Art briefs (for approval)

Existing sprite art: `archive-characters.png` (explorer and TEN, four frames each), `mummy-boss.png`, `scribe-characters.png`, `falling-tunnel.png`, `grand-archive.png`, `scribe-rooms.png`, and others. In-game the explorer is about 46 px tall and TEN about 29 px tall on a 448×160 world canvas. New art should match that scale.

Assets are listed by priority.

### 1. Crumbling ledge telegraph (top priority)

- **Scene and trigger:** Chapter 4, Crystal Crossing, room 4 stone ledge with `hazard: 'crumble'`. Starts when the hero lands (`crumbleAt` is set). Collapses after 0.65 s.
- **Frames:** 4, in one horizontal row.
  - Frame 1: intact ledge, faint hairline crack.
  - Frame 2: crack spreads, two chips missing.
  - Frame 3: block splits diagonally, dust at the seam, lower half dropping.
  - Frame 4: rubble and dust only. The code removes the block at 0.65 s.
- **Timing:** Frames at 0, 0.22, 0.44, and 0.65 s.
- **Frame size and sheet:** 128×54 px per frame (2× the 27 px ledge depth), sheet 512×54.
- **What the player should understand:** This ledge is about to fall. Keep moving. The telegraph has to be readable without the status text.
- **Prototype first:** Yes. It is the smallest asset and tests whether visual warning works before the rest of the set.

### 2. Mummy ward shatter (second priority)

- **Scene and trigger:** Finale, on a correct attack (`correctCount` increases). One ward breaks per hit, so 16 wards break in total.
- **Frames:** 5, in one row.
  - Frame 1: intact glowing turquoise ward disc.
  - Frame 2: cracks with light leaking through.
  - Frame 3: splits into pieces with a turquoise spark burst.
  - Frame 4: pieces flying outward.
  - Frame 5: faint dust motes.
- **Timing:** 0.52 s, matching the existing `.boss-impact` animation.
- **Frame size and sheet:** 96×96 px per frame, sheet 480×96.
- **Placement:** Above the mummy, never over the question text or answer field.
- **What the player should understand:** Each correct answer breaks one ward, and 16 wards must break to win.

### 3. Boulder break (Chapter 2)

- **Trigger:** Correct lane answer (existing `broken` class).
- **Frames:** 4 (whole, crack, shatter, dust). 128×96 px per frame, sheet 512×96.
- **Timing:** 0.4 s.
- **Understanding:** This answer was correct and the path is clear.

### 4. Crystal light-up (Chapter 4)

- **Trigger:** Correct rounding answer (`lit++`).
- **Frames:** 6 (dormant, pulse, spark, lit). 64×64 px per frame, sheet 384×64.
- **Timing:** 0.5 s.
- **Understanding:** This checkpoint is saved.

### 5. TEN pointing to a place column (Chapter 1)

- **Trigger:** Step 2 when the 5 is moved to tens.
- **Frames:** 4 (idle, point up-left, point at the tens column, nod).
- **Size:** Match the existing TEN scale (about 29 px tall in-scene).
- **Understanding:** Tens is the column that makes the 5 worth 50.

### Not recommended now

- **Scribe door opening:** The CSS slide already works. Art would only add detail, so this can wait.

## Copy-ready image prompts (top two assets)

**Crumbling ledge**

> 32-bit pixel art sprite sheet, 4 frames in one horizontal row, each frame 128×54 px. Transparent background, no border, no shadow outside the stone. An ancient sandstone ledge block in the style of Egyptian and Mesopotamian ruins: warm browns #68492d and #d0a66f with a light top edge and dark navy-shadowed underside. Frame 1: intact block with a faint hairline crack. Frame 2: cracks spread across the top, two small chips missing. Frame 3: the block splits diagonally, dust puffs at the seam, the lower half dropping. Frame 4: only dust motes and a few small rubble pieces, empty transparent space where the ledge was. Same camera angle and baseline on every frame, same left and right edges, 1 pixel = 1 sprite pixel, no anti-aliasing, palette of about 12 colors. No text, no characters.

**Mummy ward shatter**

> 32-bit pixel art sprite sheet, 5 frames in one horizontal row, each frame 96×96 px. Transparent background, no border. A floating hieroglyphic ward disc in bronze with a glowing turquoise #74e6cc center and a navy #0c171e outline. Frame 1: intact disc. Frame 2: cracks with turquoise light leaking through. Frame 3: the disc splits into pieces with a turquoise spark burst. Frame 4: pieces flying outward. Frame 5: faint dust motes. The center of the disc stays at the same point on every frame. 1 pixel = 1 sprite pixel, no anti-aliasing, palette of about 12 colors. No text, no characters.

## Three changes to build first (after approval)

1. **Prototype the crumbling ledge sprite (asset 1).** Smallest scope, and it tests whether a visual warning works before any other art is made.
2. **Randomize the Chapter 2 and Finale question pools (ranked #1 above).** This is a code change, not art, and it has the biggest effect on whether the scores mean anything.
3. **Add typed answers to Chapter 1 Steps 2 and 4 (ranked #2 above).** Quick fix that closes the one-click pass.

The ward shatter (asset 2) follows once the crumbling ledge is approved.

---

**Approval needed:** Confirm the asset priorities and the build order. I have not edited any game files.
