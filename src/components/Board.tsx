import { useState } from 'react'
import type { GameState, PlayerId } from '../game/types'
import { colLabel } from '../game/logic'

interface Props {
  state: GameState
  onPlace: (r: number, c: number) => void
}

const STAR_OFFSET = (n: number) => [Math.round(n * 0.25), Math.round(n / 2), Math.round(n * 0.75)]

export default function Board({ state, onPlace }: Props) {
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null)
  const n = state.boardSize
  const stars = new Set(
    STAR_OFFSET(n).flatMap((r) => STAR_OFFSET(n).map((c) => `${r},${c}`)),
  )

  const placing =
    state.phase === 'placing' &&
    (state.mode === 'pvp' || state.current === 'B')
  const hoverPlayer: PlayerId | null = placing ? state.current : null

  return (
    <div className="flex items-center gap-2">
      {/* row labels */}
      <div
        className="grid text-[10px] leading-none text-slate-500 font-mono"
        style={{
          gridTemplateRows: `repeat(${n}, 1fr)`,
          height: '100%',
          width: 14,
        }}
      >
        {Array.from({ length: n }, (_, i) => (
          <span key={i} className="flex items-center justify-end pr-1">
            {n - i}
          </span>
        ))}
      </div>

      <div className="flex flex-col items-center gap-1">
        <div
          className="board-grid relative rounded-xl border border-ink-600/60 shadow-[0_18px_60px_rgba(0,0,0,0.55)]"
          style={
            {
              '--n': n,
              width: 'min(62vh, 600px)',
              height: 'min(62vh, 600px)',
              maxWidth: 'calc(100vw - 32px)',
              maxHeight: 'calc(100vw - 32px)',
            } as React.CSSProperties
          }
        >
          <div
            className="grid h-full w-full"
            style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}
            onPointerLeave={() => setHover(null)}
          >
            {state.board.map((row, r) =>
              row.map((cell, c) => {
                const isLast = state.lastMove?.r === r && state.lastMove?.c === c
                const showGhost =
                  hoverPlayer !== null &&
                  cell === 0 &&
                  hover?.r === r &&
                  hover?.c === c
                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    disabled={!placing || cell !== 0}
                    aria-label={`${colLabel(c)}${n - r}`}
                    onClick={() => placing && onPlace(r, c)}
                    onPointerEnter={() => placing && setHover({ r, c })}
                    className="group relative flex items-center justify-center disabled:cursor-default cursor-pointer"
                  >
                    {stars.has(`${r},${c}`) && cell === 0 && (
                      <span className="absolute h-1 w-1 rounded-full bg-slate-500/50" />
                    )}
                    {cell !== 0 && (
                      <span
                        className={`stone-${cell === 1 ? 'b' : 'w'} animate-pop relative rounded-full ${
                          isLast ? 'ring-2 ring-gold-400 ring-offset-1 ring-offset-ink-850' : ''
                        }`}
                        style={{ width: '78%', height: '78%' }}
                      >
                        {isLast && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="h-1/3 w-1/3 rounded-full bg-gold-400/90" />
                          </span>
                        )}
                      </span>
                    )}
                    {showGhost && (
                      <span
                        className={`stone-${hoverPlayer === 'B' ? 'b' : 'w'} rounded-full opacity-40`}
                        style={{ width: '78%', height: '78%' }}
                      />
                    )}
                  </button>
                )
              }),
            )}
          </div>
        </div>

        {/* column labels */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${n}, 1fr)`,
            width: 'min(62vh, 600px)',
            maxWidth: 'calc(100vw - 32px)',
          }}
        >
          {Array.from({ length: n }, (_, c) => (
            <span
              key={c}
              className="text-center text-[10px] leading-none text-slate-500 font-mono"
            >
              {colLabel(c)}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
