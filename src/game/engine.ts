import type { HandState } from "./types.js";

export function createTestHand(): HandState {
  return {
    handId: "test-hand-1",
    tableId: "test-table-1",
    stage: "preflop",
    pot: 15, // small blind 5 + big blind 10 already posted
    currentBet: 10, // big blind amount
    smallBlind: 5,
    bigBlind: 10,
    dealerSeat: 0,
    turnSeat: 2, // first to act preflop is after big blind
    deck: [],
    communityCards: [],
    sidePots: [],
    players: [
      {
        userId: "player1",
        seat: 0,
        chips: 995,
        currentBet: 5, // posted small blind
        hasFolded: false,
        isAllIn: false,
        holeCards: [],
      },
      {
        userId: "player2",
        seat: 1,
        chips: 990,
        currentBet: 10, // posted big blind
        hasFolded: false,
        isAllIn: false,
        holeCards: [],
      },
      {
        userId: "player3",
        seat: 2,
        chips: 1000,
        currentBet: 0, // UTG, first to act
        hasFolded: false,
        isAllIn: false,
        holeCards: [],
      },
    ],
  };
}
