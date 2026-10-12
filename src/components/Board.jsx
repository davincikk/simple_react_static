import PropTypes from 'prop-types';
import Cell from './Cell';
import { groupIntoBoxes } from '../game/board';

export default function Board({ size, boxRows, boxCols, cells, selected = null, onSelect }) {
  const boxes = groupIntoBoxes(cells, boxRows, boxCols);
  return (
    <div role="group" aria-label={`Sudoku board, ${size}x${size}`} className={`board board--${size}`}>
      {boxes.map((box, index) => (
        <div
          key={index}
          role="group"
          aria-label={`Box ${index + 1}`}
          className={`box box--${boxRows}x${boxCols}`}
        >
          {box.map((cell) => (
            <Cell
              key={`${cell.row}-${cell.col}`}
              row={cell.row}
              col={cell.col}
              value={cell.value}
              given={cell.given}
              selected={Boolean(selected) && selected.row === cell.row && selected.col === cell.col}
              onSelect={onSelect}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

Board.propTypes = {
  size: PropTypes.number.isRequired,
  boxRows: PropTypes.number.isRequired,
  boxCols: PropTypes.number.isRequired,
  cells: PropTypes.arrayOf(
    PropTypes.arrayOf(
      PropTypes.shape({
        row: PropTypes.number.isRequired,
        col: PropTypes.number.isRequired,
        value: PropTypes.number.isRequired,
        given: PropTypes.bool.isRequired,
      })
    )
  ).isRequired,
  selected: PropTypes.shape({ row: PropTypes.number, col: PropTypes.number }),
  onSelect: PropTypes.func.isRequired,
};
