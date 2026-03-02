export type Stage = "preflop" | "flop" | "turn" | "river" | "showdown";

export type ActionType = "FOLD" | "CHECK" | "CALL" | "RAISE";

export interface PlayerState {
  userId: string;
  seat: number;
  chips: number;
  currentBet: number;
  hasFolded: boolean;
  isAllIn: boolean;
}

export interface Card {
  rank: string; // "A", "K", "Q", ..., "2"
  suit: string; // "♠", "♥", "♦", "♣" (or "S","H","D","C" later)
}

export interface HandState {
  handId: string;
  tableId: string;
  stage: Stage;
  pot: number;
  currentBet: number;
  dealerSeat: number;
  turnSeat: number;
  communityCards: Card[];
  players: PlayerState[];
}
