/*
 * HuntSimulation.ts
 * Port of Calystene's hunting simulator, revision 2.00.38
 * (http://alliancead2.free.fr), without any DOM access so the hunt launcher
 * (Ressources.php) and the "Simuler" tab of the hunting box share one engine.
 **********************************************************************/

import {
  HUNT_LOSS_AVG,
  HUNT_LOSS_MAX,
  HUNT_LOSS_MIN,
  HUNT_RATIO,
  HUNT_UNIT_ORDER,
  HUNT_XP_ORDER,
  UNIT_ATTACK,
} from "~/constants";

export type Losses = { MIN: number; AVG: number; MAX: number };

export type HuntInput = {
  /** unit counts, UNIT_NAMES order minus the workers (index 0 = JSN) */
  units: number[];
  /** Armes level */
  weapons: number;
  /** Bouclier thoracique level */
  shield: number;
  /** terrain when the hunts leave, drives their duration */
  launchHF: number;
  /** terrain when the hunts arrive, drives their difficulty */
  endHF: number;
  /** reference ratio aimed at, one of HUNT_RATIO */
  ratio: number;
  /** maximum number of hunts (Vitesse de chasse + 1, minus running ones) */
  maxCount: number;
  /** 0 lets the simulator choose */
  fixedCount?: number;
  /** 0 lets the simulator choose */
  fixedAmount?: number;
};

export type HuntDetail = {
  units: number[];
  difficulty: number;
  losses: Losses;
  att: number;
  ratio: number;
};

export type HuntResult = {
  count: number;
  amount: number;
  armyAtt: number;
  difficulty: number;
  ratio: number;
  refIndex: number;
  losses: Losses;
  hunts: HuntDetail[];
};

// JSN sent with each hunt when XP-able units go along: max losses × this factor.
const LOSSES_SECURITY_FACTOR = 2.0;

export function baseAttack(units: number[]): number {
  return units.reduce((acc, n, i) => acc + n * UNIT_ATTACK[i + 1], 0);
}

export function armyAttack(units: number[], weapons: number): number {
  let base = baseAttack(units);
  return base + (base * weapons) / 10;
}

/**
 * Difficulty of one hunt of `amount` cm² arriving on a terrain of `hf` cm².
 */
export function singleDifficulty(hf: number, amount: number): number {
  return (
    (amount + hf * 0.01) *
    Math.pow(1.04, Math.round(Math.log(hf / 50) / Math.log(Math.pow(10, 0.1)))) *
    3
  );
}

/**
 * Total difficulty of `count` hunts of `amount` cm², each one landing on the
 * terrain the previous ones brought.
 */
export function totalDifficulty(endHF: number, amount: number, count: number): number {
  let difficulty = 0;
  for (let i = 0; i < count; i++) difficulty += singleDifficulty(endHF + amount * i, amount);
  return difficulty;
}

/**
 * Index of the reference ratio used for the loss estimates: the closest one
 * below the real ratio (the worst case).
 */
export function refRatioIndex(ratio: number): number {
  let index = 0;
  for (let i = 0; i < HUNT_RATIO.length; i++) if (HUNT_RATIO[i] <= ratio + 0.0001) index = i;
  return index;
}

/**
 * Estimated losses, as a number of JSN killed.
 */
export function huntLosses(ratioIndex: number, difficulty: number, shield: number): Losses {
  let factor = (difficulty / (10 + shield)) * 10;
  return {
    MIN: HUNT_LOSS_MIN[ratioIndex] * factor,
    AVG: HUNT_LOSS_AVG[ratioIndex] * factor,
    MAX: HUNT_LOSS_MAX[ratioIndex] * factor,
  };
}

/**
 * Hunt duration in seconds.
 */
export function huntDuration(launchHF: number, amount: number, huntSpeed: number): number {
  return Math.round((amount + launchHF) * Math.pow(0.9, huntSpeed));
}

/**
 * Number of hunts and terrain per hunt that keep the ratio at or above the
 * target. The search (back from the 2009 Excel simulator) starts at a quarter
 * of the launch terrain.
 */
export function computeHunts(
  ratio: number,
  armyAtt: number,
  maxCount: number,
  endHF: number,
  minAmount: number,
  fixedCount = 0,
  fixedAmount = 0,
): { count: number; amount: number } {
  let target = ratio + 0.0001,
    amount = fixedAmount > 0 ? fixedAmount : Math.max(1, minAmount),
    count = fixedCount > 0 ? fixedCount : 1,
    ratioOf = (a: number, c: number) => armyAtt / totalDifficulty(endHF, a, c);
  if (!fixedCount) while (ratioOf(amount, count + 1) >= target && count < maxCount) count++;
  if (!fixedAmount) {
    // too difficult: lower the amount, by decreasing powers of ten
    for (let j = 5000000000000; j > 4; j /= 10)
      while (amount > j && amount > 1 && ratioOf(amount - j, count) < target) amount -= j;
    while (amount > 1 && ratioOf(amount - 1, count) < target) amount--;
    // too easy: raise it
    for (let j = 5000000000000; j > 4; j /= 10)
      while (ratioOf(amount + j, count) >= target) amount += j;
    while (ratioOf(amount + 1, count) >= target) amount++;
    // 2.00.38: small hunts could end 1 cm² above the target ratio
    while (amount > 1 && ratioOf(amount, count) < target) amount--;
  }
  return { count, amount };
}

/**
 * Spreads the army over the hunts, from the last one to the first: JSN first
 * (twice the max losses when XP-able units go along, otherwise in proportion
 * of the difficulty), then the other units until the hunt's share of the
 * attack is reached. The first hunt takes whatever is left.
 */
export function dispatchUnits(
  units: number[],
  endHF: number,
  amount: number,
  count: number,
  refIndex: number,
  shield: number,
): { units: number[]; difficulty: number; losses: Losses }[] {
  let available = units.slice(),
    difficulty = totalDifficulty(endHF, amount, count),
    remaining = difficulty,
    base = baseAttack(units),
    hunts = new Array(count);
  for (let h = count - 1; h >= 0; h--) {
    let sent = new Array(14).fill(0),
      diff = singleDifficulty(endHF + h * amount, amount),
      losses = huntLosses(refIndex, diff, shield),
      att = difficulty ? (diff * base) / difficulty : 0,
      xp = HUNT_XP_ORDER.some((u) => available[u] > 0);
    if (xp) sent[0] = Math.round(losses.MAX * LOSSES_SECURITY_FACTOR);
    else {
      sent[0] = Math.round((available[0] * diff) / remaining);
      remaining -= diff;
    }
    if (!h || sent[0] > available[0] || sent[0] < 0) sent[0] = available[0];
    available[0] -= sent[0];
    att -= sent[0] * UNIT_ATTACK[1];
    for (let u of HUNT_UNIT_ORDER) {
      if (available[u] <= 0 || att <= 0) continue;
      let n =
        available[u] * UNIT_ATTACK[u + 1] > att
          ? Math.round(att / UNIT_ATTACK[u + 1])
          : available[u];
      // Deliberate deviation from 2.00.38, which tests `sent[u] + n` here: for
      // the JSN top-up that counts the guard JSN twice, and the hunt then takes
      // the whole remaining stock, leaving the first hunts without any JSN.
      if (!h || n > available[u] || n < 0) n = available[u];
      sent[u] += n;
      available[u] -= n;
      att -= n * UNIT_ATTACK[u + 1];
    }
    hunts[h] = { units: sent, difficulty: diff, losses };
  }
  return hunts;
}

/**
 * Full simulation: hunt count and amount, ratio, losses and dispatch.
 */
export function simulateHunts(input: HuntInput): HuntResult {
  let endHF = Math.max(1, input.endHF),
    launchHF = Math.max(1, input.launchHF),
    armyAtt = armyAttack(input.units, input.weapons),
    { count, amount } = computeHunts(
      input.ratio,
      armyAtt,
      input.maxCount,
      endHF,
      Math.round(launchHF / 4),
      input.fixedCount || 0,
      input.fixedAmount || 0,
    ),
    difficulty = totalDifficulty(endHF, amount, count),
    ratio = armyAtt / difficulty,
    refIndex = refRatioIndex(ratio),
    hunts = dispatchUnits(input.units, endHF, amount, count, refIndex, input.shield).map((h) => {
      let att = armyAttack(h.units, input.weapons);
      return { ...h, att, ratio: att / h.difficulty };
    });
  return {
    count,
    amount,
    armyAtt,
    difficulty,
    ratio,
    refIndex,
    losses: huntLosses(refIndex, difficulty, input.shield),
    hunts,
  };
}

/**
 * What each ratio of the list would give with the simulator choosing the
 * count and amount, to label the ratio options.
 */
export function ratioPreviews(input: HuntInput) {
  let endHF = Math.max(1, input.endHF),
    armyAtt = armyAttack(input.units, input.weapons),
    minAmount = Math.round(Math.max(1, input.launchHF) / 4);
  return HUNT_RATIO.map((r, i) => {
    if (!armyAtt) return null;
    let { count, amount } = computeHunts(r, armyAtt, input.maxCount, endHF, minAmount);
    return {
      count,
      amount,
      losses: huntLosses(i, totalDifficulty(endHF, amount, count), input.shield),
    };
  });
}

/**
 * Losses if the terrain is `newEndHF` instead of the planned `endHF` when the
 * hunts arrive. The armies stay as dispatched, so each hunt gets its own new
 * ratio (its attack was sized for the reference ratio at the planned terrain).
 */
export function otherHFLosses(
  armyAtt: number,
  endHF: number,
  newEndHF: number,
  amount: number,
  count: number,
  refIndex: number,
  shield: number,
): Losses & { ratio: number; refIndex: number } {
  let sum = { MIN: 0, AVG: 0, MAX: 0 },
    newDifficulty = totalDifficulty(Math.max(1, newEndHF), amount, count);
  for (let h = 0; h < count; h++) {
    let newDiff = singleDifficulty(Math.max(1, newEndHF) + amount * h, amount),
      oldDiff = singleDifficulty(Math.max(1, endHF) + amount * h, amount),
      losses = huntLosses(
        refRatioIndex((oldDiff * HUNT_RATIO[refIndex]) / newDiff),
        newDiff,
        shield,
      );
    sum.MIN += losses.MIN;
    sum.AVG += losses.AVG;
    sum.MAX += losses.MAX;
  }
  let ratio = armyAtt / newDifficulty;
  return { ...sum, ratio, refIndex: refRatioIndex(ratio) };
}
