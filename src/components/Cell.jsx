import PropTypes from 'prop-types';

function cellName(row, col, value, given) {
  const prefix = `Row ${row + 1}, column ${col + 1}`;
  if (value === 0) return `${prefix}, empty`;
  return given ? `${prefix}, given ${value}` : `${prefix}, ${value}`;
}

export default function Cell({ row, col, value, given, selected = false, onSelect }) {
  const classes = ['cell', given ? 'cell--given' : 'cell--player'];
  if (!given && value !== 0) classes.push('cell--pen');
  if (selected) classes.push('cell--selected');
  return (
    <button
      type="button"
      className={classes.join(' ')}
      aria-label={cellName(row, col, value, given)}
      aria-pressed={selected}
      onClick={() => onSelect(row, col)}
    >
      {value === 0 ? '' : value}
    </button>
  );
}

Cell.propTypes = {
  row: PropTypes.number.isRequired,
  col: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
  given: PropTypes.bool.isRequired,
  selected: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
};
