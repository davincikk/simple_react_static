/**
 * Pure keyboard/pad input mapping. No React. Inputs are guard inputs for applyCellInput:
 * { type: 'digit' | 'note', value } or { type: 'erase' }.
 */

const NON_TEXT_INPUT_TYPES = ['radio', 'checkbox', 'button', 'submit', 'reset'];

export function digitInput(value, mode) {
  return mode === 'pencil' ? { type: 'note', value } : { type: 'digit', value };
}

export function keyToInput(key, size, mode) {
  if (key === 'Delete' || key === 'Backspace') return { type: 'erase' };
  if (typeof key === 'string' && /^[1-9]$/.test(key) && Number(key) <= size) {
    return digitInput(Number(key), mode);
  }
  return null;
}

function isTextEntry(target) {
  if (!target) return false;
  if (target.isContentEditable) return true;
  const tag = typeof target.tagName === 'string' ? target.tagName.toUpperCase() : '';
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag === 'INPUT') {
    const type = typeof target.type === 'string' ? target.type.toLowerCase() : 'text';
    return !NON_TEXT_INPUT_TYPES.includes(type);
  }
  return false;
}

export function shouldIgnoreKeyEvent(event) {
  if (event.defaultPrevented || event.isComposing) return true;
  if (event.ctrlKey || event.metaKey || event.altKey) return true;
  return isTextEntry(event.target);
}
