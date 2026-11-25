import { useState } from 'react'
import type { GameState, LogEntry, PlayerId } from '../game/types'
import { PLAYER_NAME } from '../game/types'
import { sanitizeBet } from '../game/logic'

/* ---------------- player card ---------------- */

function PlayerCard({
  state,
  player,
}: {
  state: GameState
  player: PlayerId
}) {
  const active = state.phase !== 'gameOver' && state.current === player
  const holdingToken = state.token === player
  const isAi = state.mode === 'ai' && player === 'W'
  return (
    <div
      className={`rounded-xl border p-3 transition-all ${
        active
          ? 'border-gold-500/70 bg-ink-800/80 animate-glow'
          : 'border-ink-600/50 bg-ink-850/60'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`h-3.5 w-3.5 rounded-full ${
              player === 'B' ? 'stone-b' : 'stone-w'
            }`}
          />
          <span className="font-display text-xs font-bold tracking-widest text-slate-200">
            {PLAYER_NAME[player](state.mode)}
          </span>
          {holdingToken && (
            <span
              className="rounded-full border border-gold-500/60 bg-gold-500/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-gold-300"
              title="Tiebreaker token"
            >
              TIE-BREAK
            </span>
          )}
        </div>
        {active && (
          <span className="text-[9px] font-bold tracking-[0.2em] text-gold-400">
            YOUR TURN
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-[10px] uppercase tracking-widest text-slate-500">Chips</span>
        <span
          className={`font-mono text-2xl font-bold ${
            state.chips[player] < 20 ? 'text-crimson-400' : 'text-slate-100'
          }`}
        >
          {state.chips[player]}
        </span>
      </div>
      {isAi && state.phase === 'betting' && (
        <p className="mt-1 text-[10px] text-slate-500 italic">AI is weighing the board…</p>
      )}
    </div>
  )
}

/* ---------------- phase stepper ---------------- */

const PHASES = [
  { key: 'betting', label: 'BET' },
  { key: 'reveal', label: 'REVEAL' },
  { key: 'placing', label: 'PLACE' },
] as const

function PhaseStepper({ state }: { state: GameState }) {
  if (state.phase === 'setup' || state.phase === 'gameOver') return null
  const idx = PHASES.findIndex((p) => p.key === state.phase)
  return (
    <div className="flex items-center gap-1">
      {PHASES.map((p, i) => (
        <div key={p.key} className="flex flex-1 items-center gap-1 last:flex-none">
          <div
            className={`flex-1 rounded-md px-2 py-1 text-center text-[10px] font-bold tracking-widest ${
              i < idx
                ? 'bg-ink-700 text-slate-500'
                : i === idx
                  ? 'bg-gold-500 text-ink-950'
                  : 'bg-ink-800 text-slate-500'
            }`}
          >
            {p.label}
          </div>
          {i < PHASES.length - 1 && <span className="text-slate-600 text-xs">→</span>}
        </div>
      ))}
    </div>
  )
}

/* ---------------- bet panel ---------------- */

function BetPanel({
  state,
  onConfirm,
}: {
  state: GameState
  onConfirm: (amount: number) => void
}) {
  const me: PlayerId = state.mode === 'ai' ? 'B' : (state.pvpBetTurn ?? 'B')
  const myTurn =
    state.phase === 'betting' &&
    (state.mode === 'ai' ? true : state.pvpBetTurn === me)
  const chips = state.chips[me]
  const value = state.bets[me] ?? 0
  const [draft, setDraft] = useState(value)

  const set = (v: number) => {
    const s = sanitizeBet(v, chips)
    setDraft(s)
  }

  return (
    <div className="rounded-xl border border-ink-600/50 bg-ink-850/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-display text-[11px] font-bold tracking-widest text-slate-300">
          YOUR BET
        </span>
        <span className="text-[10px] text-slate-500">
          {state.mode === 'ai' ? 'BLACK' : PLAYER_NAME[me](state.mode)} · bank{' '}
          {state.bank > 0 ? `+${state.bank}` : '—'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={chips}
          step={1}
          value={draft}
          disabled={!myTurn}
          onChange={(e) => set(Number(e.target.value))}
          className="bet-slider flex-1 disabled:opacity-40"
          style={{ '--fill': `${chips ? (draft / chips) * 100 : 0}%` } as React.CSSProperties}
        />
        <input
          type="number"
          min={0}
          max={chips}
          value={draft}
          disabled={!myTurn}
          onChange={(e) => set(Number(e.target.value))}
          className="w-16 rounded-md border border-ink-600 bg-ink-900 px-2 py-1 text-right font-mono text-sm text-slate-100 focus:border-gold-500 focus:outline-none disabled:opacity-40"
        />
      </div>

      <div className="mt-2 flex gap-1">
        {[0.1, 0.25, 0.5, 1].map((f) => (
          <button
            key={f}
            type="button"
            disabled={!myTurn}
            onClick={() => set(Math.round(chips * f))}
            className="flex-1 rounded-md border border-ink-600 bg-ink-800 py-1 text-[10px] font-bold text-slate-300 transition hover:border-gold-500/60 hover:text-gold-300 disabled:opacity-40"
          >
            {f === 1 ? 'ALL' : `${f * 100}%`}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={!myTurn}
        onClick={() => onConfirm(draft)}
        className="mt-3 w-full rounded-lg bg-gradient-to-r from-gold-500 to-gold-400 py-2.5 font-display text-sm font-bold tracking-widest text-ink-950 shadow-[0_4px_20px_rgba(212,164,55,0.3)] transition hover:brightness-110 disabled:opacity-40 disabled:shadow-none"
      >
        {state.mode === 'ai' ? 'REVEAL BOTS' : 'LOCK IN'}
      </button>
      <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
        Higher bet wins the move. Ties go to the tie-break token holder. The winner pays the
        loser their bet{state.bankMode ? ' — bets burn to the bank (bank mode)' : ''}.
      </p>
    </div>
  )
}

/* ---------------- bet log ---------------- */

function BetLog({ log }: { log: LogEntry[] }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-ink-600/50 bg-ink-850/60 p-3">
      <span className="font-display text-[11px] font-bold tracking-widest text-slate-300">
        BATTLE LOG
      </span>
      <div className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {log.length === 0 && (
          <p className="text-[11px] text-slate-600 italic">No rounds yet.</p>
        )}
        {log.map((e) => (
          <div
            key={e.round}
            className="flex items-center gap-2 rounded-md bg-ink-900/70 px-2 py-1.5 text-[11px]"
          >
            <span className="w-8 shrink-0 font-mono text-slate-500">R{e.round}</span>
            <span className="shrink-0 font-mono text-slate-300">
              <b className="text-slate-100">B {e.bets.B}</b>
              <span className="text-slate-600"> vs </span>
              <b className={e.winner === 'W' ? 'text-gold-300' : 'text-slate-100'}>W {e.bets.W}</b>
            </span>
            <span className="shrink-0 text-slate-600">→</span>
            <span
              className={`shrink-0 font-bold ${
                e.winner === 'B' ? 'text-slate-100' : 'text-gold-300'
              }`}
            >
              {e.winner}
              {e.tiebreak && <span className="text-gold-500" title="tiebreak"> ✦</span>}
            </span>
            {e.move && <span className="ml-auto font-mono text-slate-500">{e.move ? `(${e.move.r},${e.move.c})` : ''}</span>}
            {e.endedWith && (
              <span className="ml-auto rounded bg-crimson-600/20 px-1.5 py-0.5 text-[9px] font-bold text-crimson-400">
                GAME OVER
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------------- sidebar ---------------- */

export default function Sidebar({
  state,
  onConfirmBet,
}: {
  state: GameState
  onConfirmBet: (amount: number) => void
}) {
  return (
    <aside className="flex w-[300px] shrink-0 flex-col gap-3">
      <PhaseStepper state={state} />
      <PlayerCard state={state} player="B" />
      <PlayerCard state={state} player="W" />
      {(state.phase === 'betting' || state.phase === 'reveal') && (
        <BetPanel state={state} onConfirm={onConfirmBet} />
      )}
      {state.phase === 'placing' && (
        <div className="rounded-xl border border-crimson-500/40 bg-ink-850/60 p-3">
          <span className="font-display text-[11px] font-bold tracking-widest text-crimson-400">
            PLACE A STONE
          </span>
          <p className="mt-1 text-[11px] text-slate-400">
            {PLAYER_NAME[state.current](state.mode)} won the bet — click any empty cell.
          </p>
        </div>
      )}
      <BetLog log={state.log} />
    </aside>
  )
}
