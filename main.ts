// Midnight Fridge Roast — deterministic roast scorer.
// make.fun competition: u-carbon-forge-midnight-fridge-roast-fc5d44a7
//
// A deterministic TypeScript program (Node 22, zero dependencies) that
// scores original one-line roasts about raiding the fridge at midnight,
// picks the winner by deterministic argmax, and writes it to
// output/entry.txt.
//
// Judge's brief (from the competition page):
//   - one single line of text; the joke is the whole entry
//   - the house judge reads two lines at a time and asks which is funnier
//   - the roast must come from how midnight fridge-raiding really behaves:
//     the light, the leftovers, the 2am standing-eating, the condiment
//     archaeology, the diet you broke at noon
//   - no character limit is published for this bounty, so the pool uses the
//     sibling one-liner standard: at most 200 characters.
//
// Scoring rubric (each 0-10, editorial judgement recorded in the data):
//   truth      - how true the observation is about midnight snacking
//   laugh      - how well the laugh lands inside a single line
//   roast      - how sharp the roast is (it stings the raider, not the fridge)
//   originality- how fresh the angle is (no curfew/bouncer/cry-for-help cliches)
//   total      = truth + laugh + roast + originality (max 40)
// Hard gates: single line, <= 200 chars, ends with sentence punctuation,
// plain ASCII. Tie-break: higher total, then shorter line, then earlier index.
// The winner is therefore fully determined by the data + the rubric.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

interface Candidate {
  line: string;
  truth: number; // 0-10: true about how midnight fridge-raiding really behaves
  laugh: number; // 0-10: laugh lands inside one line
  roast: number; // 0-10: sharp roast of the midnight raider
  originality: number; // 0-10: fresh angle, dodges the obvious cracks
  why: string;
}

// REVISION v2 (after web originality checks): the v1 winner (goblin eating
// cold chicken by hand in the dark) was demoted — eating chicken by hand in
// the dark as "goblin mode" is already a viral Nov 2026 joke (Threads
// rotisserie-chicken reply; r/sillyconfession sink-in-the-dark post), so its
// originality drops 9 -> 4. "Raccoon with a mortgage" was demoted 9 -> 3:
// the exact phrase is already published ("standing in front of the fridge
// like a raccoon with a mortgage", bluesbestlife.com; also imcwc.com).
// "Cold pasta over the sink" drops 8 -> 6 for the same viral sink-eating
// beat. The new winner is the standing-up line, whose exact punchline
// ("sitting down would make it a meal") returned no match online.
const CANDIDATES: Candidate[] = [
  {
    line: "I eat dinner at seven like an adult, then at 2am I am back at the fridge eating cold chicken with my hands, in the dark, like a goblin who pays rent.",
    truth: 9, laugh: 9, roast: 9, originality: 4,
    why: "DEMOTED v2: chicken-by-hand in the dark as 'goblin mode' is already a viral Nov 2026 joke; the line is true and funny but not original.",
  },
  {
    line: "I told myself one bite at midnight, then ate standing up in the dark because sitting down would make it a meal.",
    truth: 10, laugh: 8, roast: 8, originality: 9,
    why: "Standing up to eat so it does not count as a meal is the exact self-deception everyone does at 2am.",
  },
  {
    line: "At 2am the fridge light is the only spotlight I will ever get, and I use it to eat cheese straight from the block like a raccoon with a mortgage.",
    truth: 8, laugh: 9, roast: 8, originality: 3,
    why: "DEMOTED v2: 'raccoon with a mortgage' is already published verbatim about standing at the fridge (bluesbestlife.com, imcwc.com); not original.",
  },
  {
    line: "At midnight my fridge is a slot machine: I keep pulling the handle hoping for something that is not a jar of pickles.",
    truth: 8, laugh: 8, roast: 7, originality: 9,
    why: "Opening the fridge again and again hoping the contents changed is the midnight loop; pickles are always what is left.",
  },
  {
    line: "I opened the fridge at midnight for water and left with cold pizza, a pickle, and a brand-new personality.",
    truth: 8, laugh: 8, roast: 7, originality: 8,
    why: "Nobody goes to the fridge at midnight for water and comes back with only water.",
  },
  {
    line: "The leftovers in my fridge have been there so long they pay rent, and I still eat them at 2am like it is a dare.",
    truth: 8, laugh: 7, roast: 8, originality: 8,
    why: "Ancient leftovers eaten at 2am anyway is a dare you take against your own stomach.",
  },
  {
    line: "Every jar at the back of my fridge expired during a previous relationship, and I still open them at midnight hoping for a miracle.",
    truth: 9, laugh: 8, roast: 8, originality: 9,
    why: "Condiment archaeology: the back of the fridge is a museum of expired jars and past relationships.",
  },
  {
    line: "I keep opening the fridge, staring, closing it, and opening it again, like the food will have changed its mind about me.",
    truth: 10, laugh: 7, roast: 7, originality: 8,
    why: "The open-stare-close-reopen loop is the most universal midnight fridge behaviour there is.",
  },
  {
    line: "I went to the fridge for a glass of water and came back with half a cake, because at 2am thirst is just hunger in a disguise.",
    truth: 8, laugh: 8, roast: 7, originality: 7,
    why: "Midnight thirst is hunger in a disguise, and the cake is always the disguise's victim.",
  },
  {
    line: "The fridge hums at 2am like it is judging me, and it is right, because I am eating the garnish off last Tuesday's takeaway.",
    truth: 9, laugh: 8, roast: 8, originality: 8,
    why: "Eating the garnish off days-old takeaway at 2am is rock bottom with a side of parsley.",
  },
  {
    line: "My diet died at noon, so at midnight I am eating cold pasta over the sink like it does not count if nobody sees it.",
    truth: 9, laugh: 8, roast: 9, originality: 6,
    why: "DEMOTED v2: eating over the sink in the dark is the same viral goblin-mode beat as the demoted winner; kept for its diet-died-at-noon setup.",
  },
  {
    line: "The cheese drawer is where my diet goes to die, and at midnight I visit it like a grave I keep bringing snacks to.",
    truth: 8, laugh: 7, roast: 8, originality: 7,
    why: "Everyone has a drawer that is a graveyard for their diet, visited nightly.",
  },
  {
    line: "At 2am the only thing colder than my fridge is my willpower, and the fridge is the one that keeps winning.",
    truth: 7, laugh: 6, roast: 7, originality: 6,
    why: "Willpower versus fridge is a fair fight only until midnight.",
  },
  {
    line: "The fridge light turns on every time I open it, which makes it the only thing in my life that is happy to see me at 2am.",
    truth: 8, laugh: 7, roast: 6, originality: 7,
    why: "The light really does greet you every time; the joke is that nothing else does at 2am.",
  },
];

const MAX_CHARS = 200;

function total(c: Candidate): number {
  return c.truth + c.laugh + c.roast + c.originality;
}

function validate(c: Candidate): string[] {
  const problems: string[] = [];
  if (c.line.includes("\n")) problems.push("multi-line");
  if (c.line.length > MAX_CHARS) problems.push(`too long (${c.line.length} chars)`);
  if (!/[.!?]$/.test(c.line)) problems.push("no closing punctuation");
  if (/\s{2,}/.test(c.line)) problems.push("double space");
  for (let i = 0; i < c.line.length; i++) {
    if (c.line.charCodeAt(i) > 127) { problems.push("non-ASCII"); break; }
  }
  if (c.truth < 0 || c.truth > 10 || c.laugh < 0 || c.laugh > 10 ||
      c.roast < 0 || c.roast > 10 || c.originality < 0 || c.originality > 10) {
    problems.push("score out of range");
  }
  return problems;
}

function main(): void {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? join(process.cwd(), "output");
  mkdirSync(outDir, { recursive: true });

  const scored = CANDIDATES.map((c, i) => ({ ...c, index: i, total: total(c), problems: validate(c) }));
  const rejected = scored.filter((s) => s.problems.length > 0);
  if (rejected.length > 0) {
    for (const r of rejected) console.error(`REJECTED #${r.index}: ${r.problems.join(", ")}`);
    throw new Error(`${rejected.length} candidate(s) failed validation`);
  }

  // Deterministic argmax: highest total, then shortest line, then earliest index.
  const ranked = [...scored].sort(
    (a, b) => b.total - a.total || a.line.length - b.line.length || a.index - b.index,
  );
  console.log("rank  total  truth laugh roast orig chars");
  for (const s of ranked) {
    console.log(
      `#${String(ranked.indexOf(s) + 1).padStart(2)}  ${String(s.total).padStart(2)}/40   ${s.truth}      ${s.laugh}     ${s.roast}     ${s.originality}    ${String(s.line.length).padStart(3)}`,
    );
  }

  const winner = ranked[0];
  const outPath = join(outDir, "entry.txt");
  writeFileSync(outPath, winner.line + "\n", "utf8");
  // Round-trip verification: read the file back and throw unless byte-identical.
  const roundTrip = readFileSync(outPath, "utf8");
  if (roundTrip !== winner.line + "\n") {
    throw new Error(`round-trip mismatch in ${outPath}`);
  }
  console.log(`\nWINNER (${winner.total}/40, ${winner.line.length} chars):`);
  console.log(winner.line);
  console.log(`Wrote ${outPath}`);
}

main();
