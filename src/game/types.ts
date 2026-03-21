export type Rank = "A" | "K" | "Q" | "J" | "T" | "9" | "8" | "7" | "6" | "5" | "4" | "3" | "2";
export type Suit = "S" | "H" | "D" | "C";
export type Stage = "preflop" | "flop" | "turn" | "river" | "showdown";
export type ActionType = "FOLD" | "CHECK" | "CALL" | "RAISE";

export interface Card {
  rank: Rank;
  suit: Suit;
}

export interface SidePot {
  amount: number;
  eligiblePlayerIds: string[];
}

export interface PlayerState {
  userId: string;
  seat: number;
  chips: number;
  currentBet: number;
  hasFolded: boolean;
  isAllIn: boolean;
  holeCards: Card[];
}

export interface HandState {
  handId: string;
  tableId: string;
  stage: Stage;
  pot: number;
  currentBet: number;
  smallBlind: number;
  bigBlind: number;
  dealerSeat: number;
  turnSeat: number;
  deck: Card[];
  communityCards: Card[];
  sidePots: SidePot[];
  players: PlayerState[];
}

export interface PlayerAction {
  userId: string;
  action: ActionType;
  amount?: number;
}

export interface GameConfig {
  tableId: string;
  smallBlind: number;
  bigBlind: number;
  maxPlayers: number;
  startingChips: number;
}
