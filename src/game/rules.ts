import type {
  HandState,
  PlayerAction,
  ActionType,
  Card,
  Rank,
  Suit,
  EvaluatedHand,
  HandRankCategory,
  PotWinner,
  SidePot,
  ShowdownResult,
  PlayerState,
} from "./types.js";
import { HAND_RANK_ORDER } from "./types.js";

// ─────────────────────────────────────────────
// DECK
// ─────────────────────────────────────────────

const RANKS: Rank[] = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
const SUITS: Suit[] = ["S", "H", "D", "C"];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j] as Card;
    shuffled[j] = temp as Card;
  }
  return shuffled;
}

// ─────────────────────────────────────────────
// ACTION VALIDATION
// ─────────────────────────────────────────────

export function getValidActions(hand: HandState, userId: string): ActionType[] {
  const player = hand.players.find((p) => p.userId === userId);

  if (!player || player.hasFolded || player.isAllIn) return [];
  if (hand.players[hand.turnSeat]?.userId !== userId) return [];

  const actions: ActionType[] = ["FOLD"];

  if (player.currentBet === hand.currentBet) {
    actions.push("CHECK");
  } else {
    actions.push("CALL");
  }

  if (player.chips > 0) {
    actions.push("RAISE");
  }

  return actions;
}

// ─────────────────────────────────────────────
// APPLY ACTION
// ─────────────────────────────────────────────

export function applyAction(hand: HandState, playerAction: PlayerAction): HandState {
  const { userId, action, amount } = playerAction;

  const validActions = getValidActions(hand, userId);
  if (!validActions.includes(action)) {
    throw new Error(`Invalid action ${action} for player ${userId}`);
  }

  // Deep clone so we never mutate the original state
  const state: HandState = JSON.parse(JSON.stringify(hand)) as HandState;
  const player = state.players.find((p) => p.userId === userId);
  if (!player) throw new Error(`Player ${userId} not found`);

  switch (action) {
    case "FOLD": {
      player.hasFolded = true;
      break;
    }

    case "CHECK": {
      // No chips change, just advance turn
      break;
    }

    case "CALL": {
      const callAmount = Math.min(state.currentBet - player.currentBet, player.chips);
      player.chips -= callAmount;
      player.currentBet += callAmount;
      state.pot += callAmount;

      if (player.chips === 0) {
        player.isAllIn = true;
      }
      break;
    }

    case "RAISE": {
      if (!amount || amount <= state.currentBet) {
        const raiseError = `Raise amount ${String(amount ?? 0)} must be greater than current bet ${String(state.currentBet)}`;
        throw new Error(raiseError);
      }
      const raiseAmount = Math.min(amount - player.currentBet, player.chips);
      player.chips -= raiseAmount;
      player.currentBet += raiseAmount;
      state.pot += raiseAmount;
      state.currentBet = player.currentBet;

      if (player.chips === 0) {
        player.isAllIn = true;
      }
      break;
    }
  }

  return advanceTurn(state);
}

// ─────────────────────────────────────────────
// TURN MANAGEMENT
// ─────────────────────────────────────────────

export function advanceTurn(hand: HandState): HandState {
  const state: HandState = JSON.parse(JSON.stringify(hand)) as HandState;

  // If only one player hasn't folded, they win — hand is over
  const nonFolded = state.players.filter((p) => !p.hasFolded);
  if (nonFolded.length === 1) {
    state.stage = "showdown";
    return state;
  }

  // Check if betting round is complete (all active players have matched the bet)
  const activePlayers = state.players.filter((p) => !p.hasFolded && !p.isAllIn);
  const bettingComplete = activePlayers.every((p) => p.currentBet === state.currentBet);

  if (bettingComplete) {
    return advanceStage(state);
  }

  // Find next active player after current turn seat
  const playerCount = state.players.length;
  let nextSeat = (state.turnSeat + 1) % playerCount;

  for (let i = 0; i < playerCount; i++) {
    const candidate = state.players.find((p) => p.seat === nextSeat);
    if (candidate && !candidate.hasFolded && !candidate.isAllIn) {
      state.turnSeat = nextSeat;
      return state;
    }
    nextSeat = (nextSeat + 1) % playerCount;
  }

  return state;
}

// ─────────────────────────────────────────────
// STAGE ADVANCEMENT
// ─────────────────────────────────────────────

export function advanceStage(hand: HandState): HandState {
  const state: HandState = JSON.parse(JSON.stringify(hand)) as HandState;

  // Reset bets for new stage
  state.players = state.players.map((p) => ({ ...p, currentBet: 0 }));
  state.currentBet = 0;

  // Set turn to first active player after dealer
  const playerCount = state.players.length;
  let nextSeat = (state.dealerSeat + 1) % playerCount;
  for (let i = 0; i < playerCount; i++) {
    const candidate = state.players.find((p) => p.seat === nextSeat);
    if (candidate && !candidate.hasFolded && !candidate.isAllIn) {
      state.turnSeat = nextSeat;
      break;
    }
    nextSeat = (nextSeat + 1) % playerCount;
  }

  switch (state.stage) {
    case "preflop": {
      const flop = state.deck.splice(0, 3);
      state.communityCards.push(...flop);
      state.stage = "flop";
      break;
    }
    case "flop": {
      const turnCard = state.deck.splice(0, 1);
      state.communityCards.push(...turnCard);
      state.stage = "turn";
      break;
    }
    case "turn": {
      const river = state.deck.splice(0, 1);
      state.communityCards.push(...river);
      state.stage = "river";
      break;
    }
    case "river": {
      state.stage = "showdown";
      break;
    }
    case "showdown": {
      break;
    }
  }

  return state;
}

// ─────────────────────────────────────────────
// DEALING
// ─────────────────────────────────────────────

export function dealHoleCards(hand: HandState): HandState {
  const state: HandState = JSON.parse(JSON.stringify(hand)) as HandState;

  for (const player of state.players) {
    if (!player.hasFolded) {
      player.holeCards = state.deck.splice(0, 2);
    }
  }

  return state;
}

// ─────────────────────────────────────────────
// HAND EVALUATION
// ─────────────────────────────────────────────

const RANK_VALUES: Record<Rank, number> = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8,
  "9": 9, T: 10, J: 11, Q: 12, K: 13, A: 14,
};

function rankValue(card: Card): number {
  return RANK_VALUES[card.rank];
}

function getCombinations(cards: Card[], k: number): Card[][] {
  const results: Card[][] = [];
  function combine(start: number, combo: Card[]) {
    if (combo.length === k) {
      results.push([...combo]);
      return;
    }
    for (let i = start; i < cards.length; i++) {
      combo.push(cards[i] as Card);
      combine(i + 1, combo);
      combo.pop();
    }
  }
  combine(0, []);
  return results;
}

function evaluate5(cards: Card[]): EvaluatedHand {
  const values = cards.map(rankValue).sort((a, b) => b - a);
  const suits = cards.map((c) => c.suit);

  const isFlush = suits.every((s) => s === suits[0]);

  // Check for straight (including A-2-3-4-5 wheel)
  let isStraight = false;
  let straightHigh = values[0] as number;

  const unique = [...new Set(values)];
  if (unique.length === 5) {
    if ((unique[0] as number) - (unique[4] as number) === 4) {
      isStraight = true;
      straightHigh = unique[0] as number;
    } else if (
      unique[0] === 14 && unique[1] === 5 && unique[2] === 4 &&
      unique[3] === 3 && unique[4] === 2
    ) {
      isStraight = true;
      straightHigh = 5; // wheel: 5-high straight
    }
  }

  // Count ranks
  const counts = new Map<number, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);

  let category: HandRankCategory;
  let kickers: number[];

  if (isFlush && isStraight) {
    if (straightHigh === 14) {
      category = "ROYAL_FLUSH";
    } else {
      category = "STRAIGHT_FLUSH";
    }
    kickers = [straightHigh];
  } else if ((groups[0] as [number, number])[1] === 4) {
    category = "FOUR_OF_A_KIND";
    kickers = [(groups[0] as [number, number])[0], (groups[1] as [number, number])[0]];
  } else if ((groups[0] as [number, number])[1] === 3 && (groups[1] as [number, number])[1] === 2) {
    category = "FULL_HOUSE";
    kickers = [(groups[0] as [number, number])[0], (groups[1] as [number, number])[0]];
  } else if (isFlush) {
    category = "FLUSH";
    kickers = values;
  } else if (isStraight) {
    category = "STRAIGHT";
    kickers = [straightHigh];
  } else if ((groups[0] as [number, number])[1] === 3) {
    category = "THREE_OF_A_KIND";
    kickers = [
      (groups[0] as [number, number])[0],
      (groups[1] as [number, number])[0],
      (groups[2] as [number, number])[0],
    ];
  } else if ((groups[0] as [number, number])[1] === 2 && (groups[1] as [number, number])[1] === 2) {
    category = "TWO_PAIR";
    kickers = [
      (groups[0] as [number, number])[0],
      (groups[1] as [number, number])[0],
      (groups[2] as [number, number])[0],
    ];
  } else if ((groups[0] as [number, number])[1] === 2) {
    category = "ONE_PAIR";
    kickers = groups.map((g) => g[0]);
  } else {
    category = "HIGH_CARD";
    kickers = values;
  }

  return {
    category,
    rankValue: HAND_RANK_ORDER.indexOf(category),
    kickers,
    cards,
  };
}

export function evaluateHand(holeCards: Card[], communityCards: Card[]): EvaluatedHand {
  const allCards = [...holeCards, ...communityCards];
  const combos = getCombinations(allCards, 5);

  let best: EvaluatedHand | null = null;
  for (const combo of combos) {
    const result = evaluate5(combo);
    if (!best || compareHands(result, best) > 0) {
      best = result;
    }
  }

  return best as EvaluatedHand;
}

export function compareHands(a: EvaluatedHand, b: EvaluatedHand): number {
  if (a.rankValue !== b.rankValue) return a.rankValue - b.rankValue;

  for (let i = 0; i < Math.min(a.kickers.length, b.kickers.length); i++) {
    if ((a.kickers[i] as number) !== (b.kickers[i] as number)) {
      return (a.kickers[i] as number) - (b.kickers[i] as number);
    }
  }

  return 0; // tie
}

// ─────────────────────────────────────────────
// SIDE POT CALCULATION
// ─────────────────────────────────────────────

interface BetRecord {
  userId: string;
  totalBet: number;
  hasFolded: boolean;
}

export function calculateSidePots(players: PlayerState[], totalPot: number): SidePot[] {
  // Build bet records from players who contributed chips
  const bets: BetRecord[] = players
    .filter((p) => p.currentBet > 0 || p.isAllIn || !p.hasFolded)
    .map((p) => ({
      userId: p.userId,
      totalBet: p.isAllIn ? p.currentBet : Infinity, // non-all-in players can cover any amount
      hasFolded: p.hasFolded,
    }));

  // Get unique all-in amounts, sorted ascending
  const allInAmounts = [
    ...new Set(
      bets
        .filter((b) => b.totalBet !== Infinity && b.totalBet > 0)
        .map((b) => b.totalBet)
    ),
  ].sort((a, b) => a - b);

  if (allInAmounts.length === 0) {
    // No side pots needed — single main pot
    const eligible = players.filter((p) => !p.hasFolded).map((p) => p.userId);
    return [{ amount: totalPot, eligiblePlayerIds: eligible }];
  }

  const pots: SidePot[] = [];
  let previousLevel = 0;

  for (const level of allInAmounts) {
    const increment = level - previousLevel;
    const contributors = bets.filter((b) => b.totalBet >= level);
    const potAmount = increment * contributors.length;
    const eligible = contributors.filter((b) => !b.hasFolded).map((b) => b.userId);

    if (potAmount > 0 && eligible.length > 0) {
      pots.push({ amount: potAmount, eligiblePlayerIds: eligible });
    }
    previousLevel = level;
  }

  // Remaining pot from players who bet more than the highest all-in
  const highestAllIn = allInAmounts[allInAmounts.length - 1] as number;
  const remainingContributors = bets.filter((b) => b.totalBet > highestAllIn);
  if (remainingContributors.length > 0) {
    const remaining = totalPot - pots.reduce((sum, p) => sum + p.amount, 0);
    if (remaining > 0) {
      const eligible = remainingContributors
        .filter((b) => !b.hasFolded)
        .map((b) => b.userId);
      if (eligible.length > 0) {
        pots.push({ amount: remaining, eligiblePlayerIds: eligible });
      }
    }
  }

  return pots;
}

// ─────────────────────────────────────────────
// SHOWDOWN & POT DISTRIBUTION
// ─────────────────────────────────────────────

export function resolveShowdown(hand: HandState): ShowdownResult {
  const state: HandState = JSON.parse(JSON.stringify(hand)) as HandState;
  const handsByPlayer = new Map<string, EvaluatedHand>();
  const nonFolded = state.players.filter((p) => !p.hasFolded);

  // If only one player left (everyone else folded), they win the whole pot
  if (nonFolded.length === 1) {
    const winner = nonFolded[0] as PlayerState;
    return {
      winners: [{ userId: winner.userId, amount: state.pot }],
      handsByPlayer,
    };
  }

  // Evaluate each non-folded player's hand
  for (const player of nonFolded) {
    const evaluated = evaluateHand(player.holeCards, state.communityCards);
    handsByPlayer.set(player.userId, evaluated);
  }

  // Calculate side pots
  const pots = calculateSidePots(state.players, state.pot);

  // Distribute each pot
  const winnings = new Map<string, number>();

  for (const pot of pots) {
    // Find the best hand among eligible players
    let bestHand: EvaluatedHand | null = null;
    const potWinners: string[] = [];

    for (const playerId of pot.eligiblePlayerIds) {
      const hand = handsByPlayer.get(playerId);
      if (!hand) continue;

      if (!bestHand) {
        bestHand = hand;
        potWinners.push(playerId);
      } else {
        const cmp = compareHands(hand, bestHand);
        if (cmp > 0) {
          bestHand = hand;
          potWinners.length = 0;
          potWinners.push(playerId);
        } else if (cmp === 0) {
          potWinners.push(playerId);
        }
      }
    }

    // Split pot evenly among winners, remainder to earliest seat
    if (potWinners.length > 0) {
      const share = Math.floor(pot.amount / potWinners.length);
      const remainder = pot.amount - share * potWinners.length;

      for (const winnerId of potWinners) {
        winnings.set(winnerId, (winnings.get(winnerId) ?? 0) + share);
      }

      // Remainder chip goes to first winner by seat order
      if (remainder > 0) {
        const firstWinner = potWinners
          .map((id) => state.players.find((p) => p.userId === id))
          .filter((p): p is PlayerState => p !== undefined)
          .sort((a, b) => a.seat - b.seat)[0];
        if (firstWinner) {
          winnings.set(firstWinner.userId, (winnings.get(firstWinner.userId) ?? 0) + remainder);
        }
      }
    }
  }

  const winners: PotWinner[] = [...winnings.entries()].map(([userId, amount]) => ({
    userId,
    amount,
  }));

  return { winners, handsByPlayer };
}
