import PropTypes from 'prop-types';

export default function ModeToggle({ mode, onChange }) {
  return (
    <fieldset className="mode">
      <legend>Input mode</legend>
      <label>
        <input
          type="radio"
          name="input-mode"
          value="pen"
          checked={mode === 'pen'}
          onChange={() => onChange('pen')}
        />
        Pen
      </label>
      <label>
        <input
          type="radio"
          name="input-mode"
          value="pencil"
          checked={mode === 'pencil'}
          onChange={() => onChange('pencil')}
        />
        Pencil
      </label>
    </fieldset>
  );
}

ModeToggle.propTypes = {
  mode: PropTypes.oneOf(['pen', 'pencil']).isRequired,
  onChange: PropTypes.func.isRequired,
};
