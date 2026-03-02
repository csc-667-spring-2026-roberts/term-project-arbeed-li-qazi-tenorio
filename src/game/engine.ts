import type { HandState } from "./types.js";

export function createTestHand(): HandState {
  return {
    handId: "test-hand-1",
    tableId: "test-table-1",
    stage: "preflop",
    pot: 0,
    currentBet: 0,
    dealerSeat: 0,
    turnSeat: 1,
    communityCards: [],
    players: [
      { userId: "player1", seat: 0, chips: 1000, currentBet: 0, hasFolded: false, isAllIn: false },
      { userId: "player2", seat: 1, chips: 1000, currentBet: 0, hasFolded: false, isAllIn: false },
    ],
  };
}
