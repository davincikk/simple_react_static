import { useState } from 'react';
import PropTypes from 'prop-types';
import { SIZES, LEVELS, LEVEL_LABELS } from '../sudoku';

export default function SetupScreen({ onStart, busy, error }) {
  const [size, setSize] = useState(9);
  const [level, setLevel] = useState('easy');

  const handleStart = () => {
    if (busy) return;
    onStart(size, level);
  };

  return (
    <section className="setup" aria-busy={busy ? 'true' : 'false'}>
      <h1>New game</h1>
      <fieldset disabled={busy}>
        <legend>Grid size</legend>
        {SIZES.map((n) => (
          <label key={n}>
            <input
              type="radio"
              name="size"
              value={n}
              checked={size === n}
              onChange={() => setSize(n)}
            />
            {`${n}x${n}`}
          </label>
        ))}
      </fieldset>
      <fieldset disabled={busy}>
        <legend>Difficulty</legend>
        {LEVELS.map((l) => (
          <label key={l}>
            <input
              type="radio"
              name="level"
              value={l}
              checked={level === l}
              onChange={() => setLevel(l)}
            />
            {LEVEL_LABELS[l]}
          </label>
        ))}
      </fieldset>
      <button type="button" onClick={handleStart} disabled={busy}>
        Start game
      </button>
      <p role="status" className="status">
        {busy ? 'Generating puzzle…' : ''}
      </p>
      {error ? (
        <p role="alert" className="error">
          {error}
        </p>
      ) : null}
    </section>
  );
}

SetupScreen.propTypes = {
  onStart: PropTypes.func.isRequired,
  busy: PropTypes.bool,
  error: PropTypes.string,
};

SetupScreen.defaultProps = { busy: false, error: undefined };
