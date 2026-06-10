/**
 * Deterministic baseline match model.
 *
 * The LLM is great at narrative but unreliable at calibrated probabilities, so
 * we ground it: turn each team's squad rating (talent) and recent form
 * (momentum) into expected goals, then derive Win/Draw/Loss from a Poisson
 * scoreline grid. The route anchors the LLM to this baseline and blends the two
 * — leaning on the math when we have real data, on the LLM when we don't.
 */

const BASE_TOTAL_GOALS = 2.6; // typical combined goals in an international match
const GOALS_PER_RATING = 8; // rating points ≈ one goal of expected supremacy
const FORM_WEIGHT = 3; // rating nudge per point of form-per-game above/below average
const GD_WEIGHT = 1.2; // rating nudge per goal of recent goal-difference-per-game
const NEUTRAL_PPG = 1.5; // a .500 record (1W1L) averages 1.5 points per game

function factorial(n) {
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f;
}

function poisson(k, lambda) {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

function round1(x) {
  return Math.round(x * 10) / 10;
}

/** Collapse a team's signals into one composite rating (~60–90). */
function teamStrength(s) {
  const played = s?.form?.played || 0;
  const formPpg = played ? (3 * s.form.w + s.form.d) / played : null; // 0..3
  const gdpg = played ? (s.gf - s.ga) / played : null;

  let rating = typeof s?.squadRating === "number" && !Number.isNaN(s.squadRating)
    ? s.squadRating
    : null;

  if (rating == null) {
    // No squad rating — synthesise one from form so the model still runs.
    rating =
      70 +
      (formPpg != null ? (formPpg - NEUTRAL_PPG) * 6 : 0) +
      (gdpg != null ? gdpg * 2 : 0);
  } else if (formPpg != null) {
    // Nudge the talent rating by recent momentum.
    rating += (formPpg - NEUTRAL_PPG) * FORM_WEIGHT + (gdpg != null ? gdpg * GD_WEIGHT : 0);
  }

  return clamp(rating, 50, 95);
}

/** Fraction of the four key inputs we actually have (0..1). */
export function dataCoverage(signalA, signalB) {
  const hasRA = typeof signalA?.squadRating === "number" && !Number.isNaN(signalA.squadRating);
  const hasRB = typeof signalB?.squadRating === "number" && !Number.isNaN(signalB.squadRating);
  const hasFA = (signalA?.form?.played || 0) > 0;
  const hasFB = (signalB?.form?.played || 0) > 0;
  return (Number(hasRA) + Number(hasRB) + Number(hasFA) + Number(hasFB)) / 4;
}

/** Win/Draw/Loss baseline + expected scoreline from two team signals. */
export function computeBaseline(signalA, signalB) {
  const ratingA = teamStrength(signalA);
  const ratingB = teamStrength(signalB);

  const supremacy = clamp((ratingA - ratingB) / GOALS_PER_RATING, -3, 3);
  const lambdaA = clamp(BASE_TOTAL_GOALS / 2 + supremacy / 2, 0.2, 4.5);
  const lambdaB = clamp(BASE_TOTAL_GOALS / 2 - supremacy / 2, 0.2, 4.5);

  let winA = 0, draw = 0, winB = 0;
  for (let i = 0; i <= 8; i++) {
    for (let j = 0; j <= 8; j++) {
      const p = poisson(i, lambdaA) * poisson(j, lambdaB);
      if (i > j) winA += p;
      else if (i === j) draw += p;
      else winB += p;
    }
  }
  const total = winA + draw + winB || 1;
  const a = Math.round((winA / total) * 100);
  const d = Math.round((draw / total) * 100);
  const b = 100 - a - d;

  return {
    winA: a,
    draw: d,
    winB: b,
    score: `${Math.round(lambdaA)}-${Math.round(lambdaB)}`,
    ratingA: round1(ratingA),
    ratingB: round1(ratingB),
    coverage: dataCoverage(signalA, signalB),
  };
}

/** Trust the math more when coverage is high, the LLM more when it's low. */
export function blendWeight(coverage) {
  return 0.3 + 0.4 * coverage; // 0.3 (no data) → 0.7 (full data)
}

function normalize100(a, d, b) {
  const sum = a + d + b || 1;
  const ra = Math.round((a / sum) * 100);
  const rd = Math.round((d / sum) * 100);
  return { winProbA: ra, drawProb: rd, winProbB: 100 - ra - rd };
}

/** Weighted blend of the deterministic baseline and the LLM's probabilities. */
export function blendProbs(baseline, llm, w) {
  const la = Number(llm?.winProbA) || 0;
  const ld = Number(llm?.drawProb) || 0;
  const lb = Number(llm?.winProbB) || 0;
  return normalize100(
    w * baseline.winA + (1 - w) * la,
    w * baseline.draw + (1 - w) * ld,
    w * baseline.winB + (1 - w) * lb
  );
}

/** Lead of the most-likely outcome over the runner-up (0..1). */
export function marginOf({ winProbA, drawProb, winProbB }) {
  const sorted = [winProbA, drawProb, winProbB].sort((x, y) => y - x);
  return (sorted[0] - sorted[1]) / 100;
}

export function confidenceFrom(coverage, margin) {
  if (coverage >= 0.75 && margin >= 0.18) return "High";
  if (coverage >= 0.5 && margin >= 0.08) return "Medium";
  if (coverage < 0.5) return "Low";
  return "Medium";
}

/** Pick the favourite implied by a probability triple. */
export function favoriteFrom({ winProbA, drawProb, winProbB }, teamA, teamB) {
  if (drawProb >= winProbA && drawProb >= winProbB) return "Draw";
  return winProbA >= winProbB ? teamA : teamB;
}

/** Is "X-Y" consistent with who the probabilities favour? */
export function scoreMatchesFavorite(score, favorite, teamA, teamB) {
  const m = /^\s*(\d+)\s*-\s*(\d+)\s*$/.exec(score || "");
  if (!m) return false;
  const x = Number(m[1]);
  const y = Number(m[2]);
  if (favorite === "Draw") return x === y;
  if (favorite === teamA) return x > y;
  if (favorite === teamB) return y > x;
  return false;
}
