import type {
  Action,
  Cell,
  GameMode,
  GameState,
  Move,
  PlayerId,
  RevealData,
} from './types'
import { opp } from './types'

export const DIRS: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
]

export function emptyBoard(n: number): Cell[][] {
  return Array.from({ length: n }, () => Array<Cell>(n).fill(0))
}

export function initialState(): GameState {
  return {
    phase: 'setup',
    mode: 'ai',
    boardSize: 15,
    bankMode: false,
    board: emptyBoard(15),
    chips: { B: 100, W: 100 },
    bank: 0,
    token: 'B',
    current: 'B',
    bets: { B: null, W: null },
    reveal: null,
    lastMove: null,
    winner: null,
    draw: false,
    round: 0,
    log: [],
    pvpBetTurn: null,
  }
}

/** Sanitize a bet: integer, 0..chips. Out-of-range input clamps; invalid -> 0. */
export function sanitizeBet(amount: number, chips: number): number {
  if (!Number.isFinite(amount)) return 0
  const v = Math.floor(amount)
  if (v < 0) return 0
  if (v > chips) return chips
  return v
}

const inB = (b: Cell[][], r: number, c: number) =>
  r >= 0 && r < b.length && c >= 0 && c < b.length

/** True if placing at (r,c) completes 5+ in a row for that cell's owner. */
export function checkWin(b: Cell[][], r: number, c: number): boolean {
  const p = b[r][c]
  if (p === 0) return false
  for (const [dr, dc] of DIRS) {
    let n = 1
    for (const s of [1, -1]) {
      let rr = r + dr * s
      let cc = c + dc * s
      while (inB(b, rr, cc) && b[rr][cc] === p) {
        n++
        rr += dr * s
        cc += dc * s
      }
    }
    if (n >= 5) return true
  }
  return false
}

function isFull(b: Cell[][]): boolean {
  return b.every((row) => row.every((c) => c !== 0))
}

/* ------------------------------ AI: board ------------------------------ */

/** Line weight for a run of length n if a stone were placed at the cell. */
function lineWeight(run: number): number {
  if (run >= 5) return 1_000_000
  if (run === 4) return 10_000
  if (run === 3) return 1_000
  if (run === 2) return 100
  if (run === 1) return 10
  return 0
}

/**
 * Score the line formed around (r,c) for player p, summed over 4 directions.
 * Counts consecutive p stones on both sides (the placed stone included).
 */
function cellLineScore(b: Cell[][], r: number, c: number, p: 1 | 2): number {
  let total = 0
  for (const [dr, dc] of DIRS) {
    let run = 1
    for (const s of [1, -1]) {
      let rr = r + dr * s
      let cc = c + dc * s
      while (inB(b, rr, cc) && b[rr][cc] === p) {
        run++
        rr += dr * s
        cc += dc * s
      }
    }
    total += lineWeight(Math.min(run, 5))
  }
  return total
}

/** Best move score if player p were to move now (max over empty cells). */
function bestMoveScore(b: Cell[][], p: 1 | 2): number {
  let best = 0
  for (let r = 0; r < b.length; r++) {
    for (let c = 0; c < b.length; c++) {
      if (b[r][c] !== 0) continue
      const s = cellLineScore(b, r, c, p)
      if (s > best) best = s
    }
  }
  return best
}

export interface AiPlacement {
  move: Move
  reason: 'win' | 'block' | 'build'
}

/**
 * Heuristic placement: win if possible, else block opponent's winning cell,
 * else maximize attack + defense (with slight center bias for ties).
 */
export function aiChooseMove(state: GameState): AiPlacement {
  const b = state.board
  const n = b.length
  const me: 1 | 2 = state.current === 'B' ? 1 : 2
  const them: 1 | 2 = me === 1 ? 2 : 1

  let best: Move | null = null
  let bestScore = -1
  const center = (n - 1) / 2
  const hasStones = b.some((row) => row.some((x) => x !== 0))
  if (!hasStones) return { move: { r: center, c: center }, reason: 'build' }

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (b[r][c] !== 0) continue
      // only consider cells within 2 rings of existing stones (fast + focused)
      if (!nearStone(b, r, c)) continue
      const attack = cellLineScore(b, r, c, me)
      const defend = cellLineScore(b, r, c, them)
      const dist = Math.abs(r - center) + Math.abs(c - center)
      const score = attack * 1.05 + defend - dist * 0.01
      if (score > bestScore) {
        bestScore = score
        best = { r, c }
      }
    }
  }
  if (!best) best = { r: center, c: center }

  const reason: AiPlacement['reason'] =
    bestScore >= 1_000_000 ? 'win' : defendAt(b, best, them) >= 1_000 ? 'block' : 'build'
  return { move: best, reason }
}

function defendAt(b: Cell[][], m: Move, p: 1 | 2): number {
  return cellLineScore(b, m.r, m.c, p)
}

function nearStone(b: Cell[][], r: number, c: number): boolean {
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      if (inB(b, r + dr, c + dc) && b[r + dr][c + dc] !== 0) return true
    }
  }
  return false
}

/* ------------------------------ AI: betting ------------------------------ */

/**
 * Threat-driven betting: bet aggressively when the current turn is decisive
 * (we can win, or opponent would win / extend a strong line), save chips otherwise.
 */
export function aiBetAmount(state: GameState): number {
  const me: 1 | 2 = state.current === 'B' ? 1 : 2
  const them: 1 | 2 = me === 1 ? 2 : 1
  const chips = state.chips[state.current]
  const myBest = bestMoveScore(state.board, me)
  const oppBest = bestMoveScore(state.board, them)

  let fraction: number
  if (myBest >= 1_000_000) fraction = 0.95 // we win if we get the move — go all in
  else if (oppBest >= 1_000_000) fraction = 0.8 // must block their winning cell
  else if (oppBest >= 10_000 || myBest >= 10_000) fraction = 0.55 // open-4 battles
  else if (oppBest >= 1_000 || myBest >= 1_000) fraction = 0.3 // open-3 territory
  else fraction = 0.08 // quiet turn — conserve

  return sanitizeBet(Math.round(chips * fraction), chips)
}

/* ------------------------------ reducer ------------------------------ */

function startGame(mode: GameMode, boardSize: number, bankMode: boolean): GameState {
  return {
    ...initialState(),
    phase: 'betting',
    mode,
    boardSize,
    bankMode,
    board: emptyBoard(boardSize),
    current: 'B',
    token: 'B',
    bets: { B: null, W: null },
    round: 1,
    // pvp: non-mover bets first, then the mover
    pvpBetTurn: mode === 'pvp' ? 'W' : null,
  }
}

function resolveReveal(state: GameState): {
  reveal: RevealData
  chips: Record<PlayerId, number>
  bank: number
  token: PlayerId
} {
  const bB = state.bets.B ?? 0
  const bW = state.bets.W ?? 0
  let winner: PlayerId
  let tiebreak = false
  if (bB > bW) winner = 'B'
  else if (bW > bB) winner = 'W'
  else {
    winner = state.token
    tiebreak = true
  }
  const loser = opp(winner)

  // winner pays its own bet; loser keeps its bet. (bank mode: winner's bet burns)
  const chips: Record<PlayerId, number> = { ...state.chips }
  let bank = state.bank
  chips[winner] = Math.max(0, chips[winner] - (state.bets[winner] ?? 0))
  if (state.bankMode) {
    bank += state.bets[winner] ?? 0
  } else {
    chips[loser] += state.bets[winner] ?? 0
  }
  const token = tiebreak ? loser : state.token

  return {
    reveal: { bets: { B: bB, W: bW }, winner, tiebreak },
    chips,
    bank,
    token,
  }
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START':
      return startGame(action.mode, action.boardSize, action.bankMode)

    case 'REMATCH':
      return startGame(state.mode, state.boardSize, state.bankMode)

    case 'RESET':
      return { ...initialState(), mode: state.mode, boardSize: state.boardSize, bankMode: state.bankMode }

    case 'CONFIRM_BET': {
      if (state.phase !== 'betting') return state
      const amount = sanitizeBet(action.amount, state.chips[action.player])
      const bets = { ...state.bets, [action.player]: amount }
      const next = { ...state, bets }
      // pvp: hand off to the other bettor (mover always bets last)
      if (state.mode === 'pvp') {
        const other = opp(action.player)
        if (bets[other] === null) {
          return { ...next, pvpBetTurn: other }
        }
        const res = resolveReveal(next)
        return { ...next, ...res, phase: 'reveal', pvpBetTurn: null }
      }
      // ai mode: human confirms; AI bet is supplied by the caller via REVEAL
      return next
    }

    case 'REVEAL': {
      if (state.phase !== 'betting' && state.phase !== 'reveal') return state
      // ai mode: fill AI bet if missing
      let base = state
      if (state.mode === 'ai' && state.bets.W === null) {
        base = { ...state, bets: { ...state.bets, W: aiBetAmount(state) } }
      }
      if (base.bets.B === null || base.bets.W === null) return state
      const res = resolveReveal(base)
      return { ...base, ...res, phase: 'reveal', pvpBetTurn: null }
    }

    case 'CONTINUE': {
      // advance from the reveal screen to placement (pvp button / ai auto)
      if (state.phase !== 'reveal') return state
      return { ...state, phase: 'placing' }
    }

    case 'PLACE': {
      if (state.phase !== 'placing' || !state.reveal) return state
      const { r, c } = action
      if (!inB(state.board, r, c) || state.board[r][c] !== 0) return state
      const player = state.current
      const board = state.board.map((row) => [...row])
      board[r][c] = player === 'B' ? 1 : 2

      const won = checkWin(board, r, c)
      const full = isFull(board)
      const entry = {
        round: state.round,
        bets: state.reveal.bets,
        winner: state.reveal.winner,
        tiebreak: state.reveal.tiebreak,
        move: { r, c },
        endedWith: won ? player : null,
      }
      const log = [entry, ...state.log]

      if (won) {
        return {
          ...state,
          board,
          lastMove: { r, c },
          phase: 'gameOver',
          winner: player,
          draw: false,
          log,
        }
      }
      if (full) {
        return {
          ...state,
          board,
          lastMove: { r, c },
          phase: 'gameOver',
          winner: null,
          draw: true,
          log,
        }
      }
      const next = opp(player)
      return {
        ...state,
        board,
        lastMove: { r, c },
        phase: 'betting',
        current: next,
        round: state.round + 1,
        bets: { B: null, W: null },
        reveal: null,
        pvpBetTurn: state.mode === 'pvp' ? opp(next) : null,
        log,
      }
    }
  }
}

/** Column letter for coordinate labels. */
export function colLabel(c: number): string {
  return String.fromCharCode(65 + c)
}
