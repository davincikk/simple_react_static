import { useCallback, useEffect, useRef, useState } from 'react';
import './styles.css';
import SetupScreen from './components/SetupScreen';
import Board from './components/Board';
import ModeToggle from './components/ModeToggle';
import NumberPad from './components/NumberPad';
import { generatePuzzle, LEVEL_LABELS } from './sudoku';
import { buildCells, applyCellInput } from './game/board';
import { digitInput, keyToInput, shouldIgnoreKeyEvent } from './game/input';

const GENERATION_ERROR = 'Could not create a puzzle. Please try again.';

export default function App() {
  const [screen, setScreen] = useState('setup');
  const [status, setStatus] = useState('idle');
  const [game, setGame] = useState(null);
  const [cells, setCells] = useState(null);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState('pen');
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    },
    []
  );

  const handleStart = (size, level) => {
    if (timerRef.current !== null) return;
    setError(null);
    setStatus('generating');
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      try {
        const result = generatePuzzle(size, level);
        setGame({ size, level, boxRows: result.boxRows, boxCols: result.boxCols });
        setCells(buildCells(result.puzzle));
        setSelected(null);
        setMode('pen');
        setScreen('playing');
      } catch (e) {
        setError(GENERATION_ERROR);
      } finally {
        setStatus('idle');
      }
    }, 0);
  };

  const handleSelect = (row, col) => setSelected({ row, col });

  const applyInput = useCallback(
    (input) => {
      if (!selected || !input) return;
      const { row, col } = selected;
      setCells((prev) => applyCellInput(prev, row, col, input));
    },
    [selected]
  );

  const playing = screen === 'playing' && game !== null && cells !== null;
  const size = game ? game.size : 0;

  useEffect(() => {
    if (!playing) return undefined;
    const onKeyDown = (event) => {
      if (shouldIgnoreKeyEvent(event)) return;
      const input = keyToInput(event.key, size, mode);
      if (!input) return;
      event.preventDefault();
      applyInput(input);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [playing, size, mode, applyInput]);

  if (playing) {
    return (
      <main>
        <h1>{`${game.size}x${game.size} · ${LEVEL_LABELS[game.level]}`}</h1>
        <Board
          size={game.size}
          boxRows={game.boxRows}
          boxCols={game.boxCols}
          cells={cells}
          selected={selected}
          onSelect={handleSelect}
        />
        <div className="controls">
          <ModeToggle mode={mode} onChange={setMode} />
          <NumberPad
            size={game.size}
            onDigit={(d) => applyInput(digitInput(d, mode))}
            onErase={() => applyInput({ type: 'erase' })}
          />
        </div>
      </main>
    );
  }

  return (
    <main>
      <SetupScreen onStart={handleStart} busy={status === 'generating'} error={error || undefined} />
    </main>
  );
}
