import { useEffect, useReducer, useRef, useState } from 'react'
import { initialState, reducer, aiChooseMove } from './game/logic'
import type { PlayerId } from './game/types'
import Board from './components/Board'
import Sidebar from './components/Sidebar'
import { RevealOverlay, GameOverOverlay, HandoffOverlay } from './components/Overlays'
import { RulesModal, SetupScreen } from './components/Modals'

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [handoffFor, setHandoffFor] = useState<PlayerId | null>(null)

  /* ---- automated AI turns ---- */
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    if (state.mode !== 'ai') return
    if (state.phase === 'betting') {
      const t = setTimeout(() => dispatch({ type: 'REVEAL' }), 1600)
      return () => clearTimeout(t)
    }
    if (state.phase === 'reveal') {
      const t = setTimeout(() => dispatch({ type: 'CONTINUE' }), 2400)
      return () => clearTimeout(t)
    }
    if (state.phase === 'placing' && state.current === 'W') {
      const t = setTimeout(() => {
        const { move } = aiChooseMove(stateRef.current)
        dispatch({ type: 'PLACE', r: move.r, c: move.c })
      }, 1200)
      return () => clearTimeout(t)
    }
  }, [state])

  /* ---- pvp handoff mask ---- */
  useEffect(() => {
    if (state.mode === 'pvp' && state.phase === 'betting' && state.pvpBetTurn) {
      setHandoffFor(state.pvpBetTurn)
    } else {
      setHandoffFor(null)
    }
  }, [state.mode, state.phase, state.pvpBetTurn, state.round])

  const confirmBet = (amount: number) => {
    const me: PlayerId = state.mode === 'ai' ? 'B' : state.pvpBetTurn ?? 'B'
    dispatch({ type: 'CONFIRM_BET', player: me, amount })
  }

  if (state.phase === 'setup') {
    return (
      <>
        <SetupScreen
          onStart={(mode, size, bankMode) =>
            dispatch({ type: 'START', mode, boardSize: size, bankMode })
          }
          onRules={() => setRulesOpen(true)}
        />
        {rulesOpen && <RulesModal onClose={() => setRulesOpen(false)} />}
      </>
    )
  }

  return (
    <div className="relative flex min-h-full flex-col">
      {/* header */}
      <header className="flex items-center justify-between border-b border-ink-700/60 px-5 py-3">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-lg font-extrabold tracking-[0.2em] text-slate-100">
            BETTING<span className="text-gold-400"> GOMOKU</span>
          </span>
          <span className="hidden text-[10px] tracking-[0.3em] text-crimson-500 sm:inline">
            SURVIVAL EDITION
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-ink-600 bg-ink-850 px-2.5 py-1 font-mono text-[11px] text-slate-400">
            ROUND {state.round}
          </span>
          <button
            type="button"
            onClick={() => setRulesOpen(true)}
            className="rounded-md border border-ink-600 bg-ink-850 px-2.5 py-1 text-[11px] font-bold tracking-widest text-slate-300 transition hover:border-gold-500/60 hover:text-gold-300"
          >
            RULES
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: 'RESET' })}
            className="rounded-md border border-ink-600 bg-ink-850 px-2.5 py-1 text-[11px] font-bold tracking-widest text-slate-300 transition hover:border-crimson-500/60 hover:text-crimson-400"
          >
            RESET
          </button>
        </div>
      </header>

      {/* main */}
      <main className="flex flex-1 items-center justify-center gap-6 overflow-auto p-4 lg:p-6">
        <Board
          state={state}
          onPlace={(r, c) => dispatch({ type: 'PLACE', r, c })}
        />
        <Sidebar state={state} onConfirmBet={confirmBet} />
      </main>

      {/* overlays */}
      <RevealOverlay
        state={state}
        onContinue={
          state.mode === 'pvp' ? () => dispatch({ type: 'CONTINUE' }) : undefined
        }
      />
      <GameOverOverlay
        state={state}
        onRematch={() => dispatch({ type: 'REMATCH' })}
        onReset={() => dispatch({ type: 'RESET' })}
      />
      {handoffFor && (
        <HandoffOverlay nextPlayer={handoffFor} onReady={() => setHandoffFor(null)} />
      )}

      {rulesOpen && <RulesModal onClose={() => setRulesOpen(false)} />}
    </div>
  )
}
