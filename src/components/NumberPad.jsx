import PropTypes from 'prop-types';

export default function NumberPad({ size, onDigit, onErase }) {
  const digits = Array.from({ length: size }, (_, i) => i + 1);
  return (
    <div role="group" aria-label="Number pad" className="numpad">
      {digits.map((d) => (
        <button key={d} type="button" aria-label={`Digit ${d}`} onClick={() => onDigit(d)}>
          {d}
        </button>
      ))}
      <button type="button" onClick={() => onErase()}>
        Erase
      </button>
    </div>
  );
}

NumberPad.propTypes = {
  size: PropTypes.number.isRequired,
  onDigit: PropTypes.func.isRequired,
  onErase: PropTypes.func.isRequired,
};
