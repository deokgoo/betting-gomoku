import { useState } from 'react'
import type { GameMode } from '../game/types'

/* ---------------- rules modal ---------------- */

export function RulesModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-fade-up max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-ink-600 bg-ink-850 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl font-extrabold tracking-[0.2em] text-gold-400">
          HOW IT WORKS
        </h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-slate-300">
          <li>
            <b className="text-slate-100">BET</b> — both players secretly wager 0–100 chips on
            who gets the next move.
          </li>
          <li>
            <b className="text-slate-100">REVEAL</b> — bets flip open simultaneously. The higher
            bid takes the move; ties are decided by the <b className="text-gold-300">tie-break
            token</b> (it then passes to the other player).
          </li>
          <li>
            <b className="text-slate-100">SETTLE</b> — the winner pays their own bet to the loser
            (total stays 200). In bank mode the winner&apos;s bet burns instead.
          </li>
          <li>
            <b className="text-slate-100">PLACE</b> — the winner drops one stone anywhere on the
            empty board.
          </li>
          <li>
            <b className="text-crimson-400">WIN</b> — first to line up 5 stones in a row (any
            direction) wins the game.
          </li>
        </ol>
        <div className="mt-4 rounded-lg border border-ink-600 bg-ink-900/70 p-3 text-xs leading-relaxed text-slate-400">
          Bankrupted players can still bet 0 — a 0–0 standoff keeps the token holder in control, so
          even the broke side has a fight.
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-gradient-to-r from-gold-500 to-gold-400 py-2.5 font-display text-xs font-bold tracking-[0.25em] text-ink-950 transition hover:brightness-110"
        >
          GOT IT
        </button>
      </div>
    </div>
  )
}

/* ---------------- setup screen ---------------- */

export function SetupScreen({
  onStart,
  onRules,
}: {
  onStart: (mode: GameMode, size: number, bankMode: boolean) => void
  onRules: () => void
}) {
  const [mode, setMode] = useState<GameMode>('ai')
  const [size, setSize] = useState(15)
  const [bankMode, setBankMode] = useState(false)

  const opt = <T extends string | number | boolean>(
    value: T,
    active: T,
    label: string,
    onClick: () => void,
  ) => (
    <button
      key={String(value)}
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg border px-3 py-2.5 font-display text-xs font-bold tracking-[0.15em] transition ${
        active === value
          ? 'border-gold-500 bg-gold-500/15 text-gold-300'
          : 'border-ink-600 bg-ink-850 text-slate-400 hover:border-slate-500'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="animate-fade-up w-full max-w-md rounded-2xl border border-ink-600 bg-ink-850/90 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
        <div className="text-center">
          <div className="text-[10px] font-bold tracking-[0.5em] text-crimson-500">
            SURVIVAL EDITION
          </div>
          <h1 className="mt-2 font-display text-4xl font-extrabold tracking-[0.15em] text-slate-100">
            BETTING<span className="text-gold-400"> GOMOKU</span>
          </h1>
          <p className="mt-2 text-xs tracking-wide text-slate-500">
            Bet chips for the move. Place stones. Make five or perish.
          </p>
        </div>

        <div className="mt-7 space-y-5">
          <div>
            <div className="mb-2 text-[10px] font-bold tracking-[0.3em] text-slate-500">
              MODE
            </div>
            <div className="flex gap-2">
              {opt('ai', mode, 'VS AI', () => setMode('ai'))}
              {opt('pvp', mode, '2 PLAYER', () => setMode('pvp'))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-[10px] font-bold tracking-[0.3em] text-slate-500">
              BOARD
            </div>
            <div className="flex gap-2">
              {opt(11, size, '11 × 11', () => setSize(11))}
              {opt(13, size, '13 × 13', () => setSize(13))}
              {opt(15, size, '15 × 15', () => setSize(15))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-[10px] font-bold tracking-[0.3em] text-slate-500">
              SETTLEMENT
            </div>
            <div className="flex gap-2">
              {opt(false, bankMode, 'CLASSIC · PAYOUT', () => setBankMode(false))}
              {opt(true, bankMode, 'BANK · BURN', () => setBankMode(true))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onStart(mode, size, bankMode)}
          className="mt-8 w-full rounded-xl bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500 py-3.5 font-display text-sm font-extrabold tracking-[0.3em] text-ink-950 shadow-[0_6px_30px_rgba(212,164,55,0.4)] transition hover:brightness-110"
        >
          ENTER THE ARENA
        </button>

        <button
          type="button"
          onClick={onRules}
          className="mt-3 w-full rounded-xl border border-ink-600 bg-ink-800/60 py-2.5 text-xs font-bold tracking-[0.3em] text-slate-400 transition hover:border-slate-500 hover:text-slate-200"
        >
          RULES
        </button>
      </div>
    </div>
  )
}
