export type PlayerId = 'B' | 'W'

export type Cell = 0 | 1 | 2 // 0=empty, 1=black, 2=white

export type Phase = 'setup' | 'betting' | 'reveal' | 'placing' | 'gameOver'

export type GameMode = 'ai' | 'pvp'

export interface Move {
  r: number
  c: number
}

export interface RevealData {
  bets: Record<PlayerId, number>
  winner: PlayerId
  tiebreak: boolean
}

export interface LogEntry {
  round: number
  bets: Record<PlayerId, number>
  winner: PlayerId
  tiebreak: boolean
  move: Move | null
  endedWith: PlayerId | null // set when the game ends on this round
}

export interface GameState {
  phase: Phase
  mode: GameMode
  boardSize: number
  bankMode: boolean // true: winner's bet goes to the bank instead of the loser
  board: Cell[][]
  chips: Record<PlayerId, number>
  bank: number
  token: PlayerId // tiebreaker token holder
  current: PlayerId // player who will place this turn
  bets: Record<PlayerId, number | null>
  reveal: RevealData | null
  lastMove: Move | null
  winner: PlayerId | null // null while playing; 'draw' not representable — use `draw` flag
  draw: boolean
  round: number
  log: LogEntry[]
  pvpBetTurn: PlayerId | null // whose bet is being entered in pvp
}

export type Action =
  | { type: 'START'; mode: GameMode; boardSize: number; bankMode: boolean }
  | { type: 'CONFIRM_BET'; player: PlayerId; amount: number }
  | { type: 'REVEAL' }
  | { type: 'CONTINUE' }
  | { type: 'PLACE'; r: number; c: number }
  | { type: 'REMATCH' }
  | { type: 'RESET' }

export const PLAYER_NAME: Record<PlayerId, (mode: GameMode) => string> = {
  B: (m) => (m === 'ai' ? 'BLACK · You' : 'BLACK'),
  W: (m) => (m === 'ai' ? 'WHITE · AI' : 'WHITE'),
}

export const opp = (p: PlayerId): PlayerId => (p === 'B' ? 'W' : 'B')
