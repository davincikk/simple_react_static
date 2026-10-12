import { useEffect, useRef, useState } from 'react';
import './styles.css';
import SetupScreen from './components/SetupScreen';
import Board from './components/Board';
import { generatePuzzle, LEVEL_LABELS } from './sudoku';
import { buildCells } from './game/board';

const GENERATION_ERROR = 'Could not create a puzzle. Please try again.';

export default function App() {
  const [screen, setScreen] = useState('setup');
  const [status, setStatus] = useState('idle');
  const [game, setGame] = useState(null);
  const [cells, setCells] = useState(null);
  const [selected, setSelected] = useState(null);
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
        setScreen('playing');
      } catch (e) {
        setError(GENERATION_ERROR);
      } finally {
        setStatus('idle');
      }
    }, 0);
  };

  const handleSelect = (row, col) => setSelected({ row, col });

  if (screen === 'playing' && game && cells) {
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
      </main>
    );
  }

  return (
    <main>
      <SetupScreen onStart={handleStart} busy={status === 'generating'} error={error || undefined} />
    </main>
  );
}
