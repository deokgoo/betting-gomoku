import type { GameState, PlayerId } from '../game/types'
import { PLAYER_NAME } from '../game/types'

/* ---------------- reveal overlay ---------------- */

function RevealCard({
  state,
  player,
}: {
  state: GameState
  player: PlayerId
}) {
  const bet = state.reveal?.bets[player] ?? 0
  const isWinner = state.reveal?.winner === player
  return (
    <div
      className={`animate-reveal-flip rounded-2xl border p-6 backdrop-blur ${
        isWinner
          ? 'border-gold-500 bg-ink-800/90 shadow-[0_0_50px_rgba(212,164,55,0.35)]'
          : 'border-ink-600 bg-ink-850/90'
      }`}
      style={{ transformOrigin: 'center' }}
    >
      <div className="flex items-center gap-2">
        <span className={`h-4 w-4 rounded-full ${player === 'B' ? 'stone-b' : 'stone-w'}`} />
        <span className="font-display text-sm font-bold tracking-[0.2em] text-slate-200">
          {PLAYER_NAME[player](state.mode)}
        </span>
      </div>
      <div className="mt-3 font-mono text-5xl font-bold text-slate-100">{bet}</div>
      <div
        className={`mt-2 text-[10px] font-bold tracking-[0.25em] ${
          isWinner ? 'text-gold-400' : 'text-slate-600'
        }`}
      >
        {isWinner ? (state.reveal?.tiebreak ? 'TIE — TOKEN WINS' : 'WINS THE MOVE') : 'HOLDS STEADY'}
      </div>
    </div>
  )
}

export function RevealOverlay({
  state,
  onContinue,
}: {
  state: GameState
  onContinue?: () => void
}) {
  if (state.phase !== 'reveal' || !state.reveal) return null
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink-950/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-5">
        <div className="flex items-center gap-5 px-4">
          <RevealCard state={state} player="B" />
          <span className="font-display text-2xl font-extrabold tracking-[0.3em] text-crimson-500 animate-pop">
            VS
          </span>
          <RevealCard state={state} player="W" />
        </div>
        {onContinue && (
          <button
            type="button"
            onClick={onContinue}
            className="animate-fade-up rounded-lg border border-gold-500/70 bg-gold-500/15 px-8 py-2.5 font-display text-xs font-bold tracking-[0.25em] text-gold-300 transition hover:bg-gold-500/25"
          >
            CONTINUE
          </button>
        )}
      </div>
    </div>
  )
}

/* ---------------- game over overlay ---------------- */

export function GameOverOverlay({
  state,
  onRematch,
  onReset,
}: {
  state: GameState
  onRematch: () => void
  onReset: () => void
}) {
  if (state.phase !== 'gameOver') return null
  const title = state.draw
    ? 'STALEMATE'
    : state.winner === 'B' || state.winner === 'W'
      ? `${PLAYER_NAME[state.winner](state.mode)} WINS`
      : ''
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink-950/80 backdrop-blur">
      <div className="animate-pop w-[340px] rounded-2xl border border-ink-600 bg-ink-850 p-8 text-center shadow-2xl">
        <div className="text-[10px] font-bold tracking-[0.4em] text-crimson-500">
          ROUND {state.round} — {state.bankMode ? 'BANK MODE' : 'CLASSIC'}
        </div>
        <h2 className="mt-3 font-display text-3xl font-extrabold tracking-widest text-gold-400">
          {state.draw ? 'BOARD FULL' : title}
        </h2>
        <div className="mt-5 flex items-center justify-center gap-8">
          {(['B', 'W'] as PlayerId[]).map((p) => (
            <div key={p} className="text-center">
              <span className="mb-1 flex justify-center">
                <span className={`h-5 w-5 rounded-full ${p === 'B' ? 'stone-b' : 'stone-w'}`} />
              </span>
              <div className="text-[10px] tracking-widest text-slate-500">
                {PLAYER_NAME[p](state.mode)}
              </div>
              <div className="font-mono text-2xl font-bold text-slate-100">
                {state.chips[p]}
              </div>
              <div className="text-[9px] tracking-widest text-slate-600">CHIPS</div>
            </div>
          ))}
          {state.bank > 0 && (
            <div className="text-center">
              <div className="text-[10px] tracking-widest text-gold-500">BANK</div>
              <div className="font-mono text-2xl font-bold text-gold-300">{state.bank}</div>
              <div className="text-[9px] tracking-widest text-slate-600">BURNED</div>
            </div>
          )}
        </div>
        <div className="mt-7 flex gap-3">
          <button
            type="button"
            onClick={onRematch}
            className="flex-1 rounded-lg bg-gradient-to-r from-gold-500 to-gold-400 py-2.5 font-display text-xs font-bold tracking-[0.2em] text-ink-950 transition hover:brightness-110"
          >
            REMATCH
          </button>
          <button
            type="button"
            onClick={onReset}
            className="flex-1 rounded-lg border border-ink-600 bg-ink-800 py-2.5 font-display text-xs font-bold tracking-[0.2em] text-slate-300 transition hover:border-slate-500"
          >
            SETUP
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------------- pvp handoff mask ---------------- */

export function HandoffOverlay({
  nextPlayer,
  onReady,
}: {
  nextPlayer: PlayerId
  onReady: () => void
}) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-ink-950/95 backdrop-blur">
      <span className="text-[10px] font-bold tracking-[0.4em] text-slate-500">
        PASS THE DEVICE
      </span>
      <div className="flex items-center gap-3">
        <span
          className={`h-8 w-8 rounded-full ${nextPlayer === 'B' ? 'stone-b' : 'stone-w'}`}
        />
        <span className="font-display text-3xl font-extrabold tracking-[0.25em] text-slate-100">
          {PLAYER_NAME[nextPlayer]('pvp')}
        </span>
      </div>
      <p className="text-sm text-slate-400">Your bet stays hidden until revealed.</p>
      <button
        type="button"
        onClick={onReady}
        className="mt-2 rounded-lg bg-gradient-to-r from-crimson-500 to-crimson-400 px-10 py-3 font-display text-sm font-bold tracking-[0.25em] text-white shadow-[0_4px_24px_rgba(224,52,76,0.4)] transition hover:brightness-110"
      >
        I&apos;M READY
      </button>
    </div>
  )
}
