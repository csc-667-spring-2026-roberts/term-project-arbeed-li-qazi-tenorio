import type { HandState, PlayerAction, ActionType, Card, Rank, Suit } from "./types.js";

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
