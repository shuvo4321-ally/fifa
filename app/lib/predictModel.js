/**
 * Deterministic baseline match model.
 *
 * The LLM is great at narrative but unreliable at calibrated probabilities, so
 * we ground it: turn each team's squad rating (talent) and recent form
 * (momentum) into expected goals, then derive Win/Draw/Loss from a Poisson
 * scoreline grid. The route anchors the LLM to this baseline and blends the two
 * — leaning on the math when we have real data, on the LLM when we don't.
 */

const BASE_TOTAL_GOALS = 2.9; // combined expected goals — slightly above the 2.6 international average for WC attacking play
// Log-linear goal model (see computeBaseline): a rating edge scales expected
// goals multiplicatively. RATING_SCALE = rating points per unit of supremacy on
// the log scale; SUP_CAP caps a blowout around 5-0 instead of letting it run away.
const RATING_SCALE = 10;  // lower = rating gaps produce bigger goal differences
const SUP_CAP = 1.8;      // allow genuine mismatches to open up to 4-0 / 5-0
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

// Dixon-Coles low-score dependency correction. Independent Poisson systematically
// under-predicts 0-0 and 1-1 and over-predicts 1-0 / 0-1; this tau re-weights just
// those four cells (rho < 0) so the grid matches real football. A pure calibration
// fix — strictly more correct, no trade-off.
const DC_RHO = -0.12;
function dcTau(i, j, lambdaA, lambdaB) {
  if (i === 0 && j === 0) return 1 - lambdaA * lambdaB * DC_RHO;
  if (i === 0 && j === 1) return 1 + lambdaA * DC_RHO;
  if (i === 1 && j === 0) return 1 + lambdaB * DC_RHO;
  if (i === 1 && j === 1) return 1 - DC_RHO;
  return 1;
}

function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

function round1(x) {
  return Math.round(x * 10) / 10;
}

/**
 * Collapse a team's signals into one composite rating (~60–90) AND
 * separate attack / defense sub-ratings used to shape the goal model.
 */
function teamStrength(s) {
  const played = s?.form?.played || 0;
  const formPpg = played ? (3 * s.form.w + s.form.d) / played : null; // 0..3
  const gdpg = played ? (s.gf - s.ga) / played : null;
  const gpg = played ? s.gf / played : null;   // goals per game scored
  const gapg = played ? s.ga / played : null;   // goals per game conceded

  let rating = typeof s?.squadRating === "number" && !Number.isNaN(s.squadRating)
    ? s.squadRating
    : null;

  // Blend in top-11 average if available (weights star quality)
  if (typeof s?.top11 === "number" && !Number.isNaN(s.top11) && rating != null) {
    rating = 0.7 * rating + 0.3 * s.top11;
  }

  if (s?.elo) {
    const eloRating = 65 + ((s.elo - 1400) / 750) * 27;
    if (rating != null) {
      rating = 0.5 * rating + 0.5 * eloRating;
    } else {
      rating = eloRating;
    }
  }

  // Shrink the form/goal-difference nudge by sample size so a single fluke
  // result (e.g. one 4-0 win) can't masquerade as elite form — it earns its
  // full weight only over several games. Regression to the mean = less overfit.
  const formConfidence = played / (played + 4); // 1g → .2, 3g → .43, 6g → .6
  if (rating == null) {
    // No squad rating — synthesise one from form so the model still runs.
    rating =
      70 +
      (formPpg != null ? (formPpg - NEUTRAL_PPG) * 6 * formConfidence : 0) +
      (gdpg != null ? gdpg * 2 * formConfidence : 0);
  } else if (formPpg != null) {
    // Nudge the talent rating by recent momentum.
    rating += ((formPpg - NEUTRAL_PPG) * FORM_WEIGHT + (gdpg != null ? gdpg * GD_WEIGHT : 0)) * formConfidence;
  }

  // Win/loss streak bonus: consecutive recent wins boost confidence, losses dampen it.
  const outcomes = s?.outcomes || [];
  let streak = 0;
  if (outcomes.length > 0) {
    const first = outcomes[0];
    for (const o of outcomes) {
      if (o === first) streak++;
      else break;
    }
    if (first === "W") rating += Math.min(streak, 4) * 0.8;
    else if (first === "L") rating -= Math.min(streak, 4) * 0.8;
  }

  return {
    overall: clamp(rating, 50, 95),
    attack: s?.attack || null,    // { overall, sho, pac } from Supabase
    defense: s?.defense || null,  // { overall, def, phy } from Supabase
    gpg: gpg,                      // goals per game
    gapg: gapg,                    // goals conceded per game
  };
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
  const strA = teamStrength(signalA);
  const strB = teamStrength(signalB);
  const ratingA = strA.overall;
  const ratingB = strB.overall;

  // Log-linear (Poisson-regression style) goal model: a rating edge scales
  // expected goals multiplicatively.
  const supremacy = clamp((ratingA - ratingB) / RATING_SCALE, -SUP_CAP, SUP_CAP);
  const half = BASE_TOTAL_GOALS / 2;
  let lambdaA = clamp(half * Math.exp(supremacy), 0.15, 4.8);
  let lambdaB = clamp(half * Math.exp(-supremacy), 0.15, 4.8);

  // ── Matchup-specific adjustments from real data ──

  // 1. Attack vs Defense: if team A has strong attack and team B has weak defense,
  //    A should score more than the generic model predicts (and vice versa).
  if (strA.attack?.overall && strB.defense?.overall) {
    const atkEdge = (Number(strA.attack.overall) - Number(strB.defense.overall)) / 100;
    lambdaA = clamp(lambdaA * (1 + atkEdge * 0.5), 0.15, 5.5);
  }
  if (strB.attack?.overall && strA.defense?.overall) {
    const atkEdge = (Number(strB.attack.overall) - Number(strA.defense.overall)) / 100;
    lambdaB = clamp(lambdaB * (1 + atkEdge * 0.5), 0.15, 5.5);
  }

  // 2. Actual goals-per-game from recent matches, SHRUNK toward the model by
  //    sample size (regression to the mean). With few games the per-game rate is
  //    noisy, so we trust it little; a sustained multi-game scoring run earns
  //    more weight. This captures a genuinely hot attack without overfitting a
  //    single fluke result — improving accuracy rather than just inflating goals.
  const games = Math.min(signalA?.form?.played || 0, signalB?.form?.played || 0);
  const wReal = games / (games + 4); // 0 (no data) → .43 (3 games) → .5 (4) → .67 (8)
  if (strA.gpg != null && strB.gapg != null) {
    const realGoalSignal = (strA.gpg + strB.gapg) / 2;  // avg of A's scoring + B's conceding
    lambdaA = clamp((1 - wReal) * lambdaA + wReal * realGoalSignal, 0.15, 5.5);
  }
  if (strB.gpg != null && strA.gapg != null) {
    const realGoalSignal = (strB.gpg + strA.gapg) / 2;
    lambdaB = clamp((1 - wReal) * lambdaB + wReal * realGoalSignal, 0.15, 5.5);
  }

  let winA = 0, draw = 0, winB = 0;
  const scorelines = []; // { score, prob }
  for (let i = 0; i <= 8; i++) {
    for (let j = 0; j <= 8; j++) {
      const p = dcTau(i, j, lambdaA, lambdaB) * poisson(i, lambdaA) * poisson(j, lambdaB);
      if (i > j) winA += p;
      else if (i === j) draw += p;
      else winB += p;
      scorelines.push({ score: `${i}-${j}`, prob: p });
    }
  }
  const total = winA + draw + winB || 1;
  const a = Math.round((winA / total) * 100);
  const d = Math.round((draw / total) * 100);
  const b = 100 - a - d;

  // The single most accurate point estimate is the MODE — the most-probable
  // scoreline. It also self-adjusts correctly: a dominant side gets its big
  // score, two defensive sides get a low draw, evenly-matched sides get 1-1.
  scorelines.sort((x, y) => y.prob - x.prob);
  const pickedScore = scorelines[0].score;

  return {
    winA: a,
    draw: d,
    winB: b,
    score: pickedScore,
    lambdaA: round1(lambdaA),
    lambdaB: round1(lambdaB),
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
