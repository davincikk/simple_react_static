import { digitInput, keyToInput, shouldIgnoreKeyEvent } from './input';

describe('digitInput', () => {
  it('maps pen mode to a digit and pencil mode to a note', () => {
    expect(digitInput(3, 'pen')).toEqual({ type: 'digit', value: 3 });
    expect(digitInput(3, 'pencil')).toEqual({ type: 'note', value: 3 });
    expect(digitInput(3, undefined)).toEqual({ type: 'digit', value: 3 });
  });
});

describe('keyToInput', () => {
  it('maps digits 1..N', () => {
    expect(keyToInput('3', 4, 'pen')).toEqual({ type: 'digit', value: 3 });
    expect(keyToInput('6', 6, 'pen')).toEqual({ type: 'digit', value: 6 });
    expect(keyToInput('9', 9, 'pen')).toEqual({ type: 'digit', value: 9 });
    expect(keyToInput('3', 4, 'pencil')).toEqual({ type: 'note', value: 3 });
  });

  it.each(['Delete', 'Backspace'])('maps %s to erase in both modes', (key) => {
    expect(keyToInput(key, 4, 'pen')).toEqual({ type: 'erase' });
    expect(keyToInput(key, 4, 'pencil')).toEqual({ type: 'erase' });
  });

  it.each(['0', '7', '9', 'a', 'x', 'ArrowUp', 'Enter', ' ', 'Tab', '10', '', undefined])(
    'returns null for %p on a 6x6 grid',
    (key) => {
      expect(keyToInput(key, 6, 'pen')).toBeNull();
    }
  );
});

describe('shouldIgnoreKeyEvent', () => {
  const ev = (over = {}, target = { tagName: 'BUTTON' }) => ({ target, ...over });

  it.each([['ctrlKey'], ['metaKey'], ['altKey'], ['isComposing'], ['defaultPrevented']])(
    'ignores events with %s',
    (flag) => {
      expect(shouldIgnoreKeyEvent(ev({ [flag]: true }))).toBe(true);
    }
  );

  it.each([
    [{ tagName: 'INPUT', type: 'text' }],
    [{ tagName: 'INPUT', type: 'number' }],
    [{ tagName: 'INPUT' }],
    [{ tagName: 'TEXTAREA' }],
    [{ tagName: 'SELECT' }],
    [{ tagName: 'DIV', isContentEditable: true }],
  ])('ignores text-entry target %j', (target) => {
    expect(shouldIgnoreKeyEvent(ev({}, target))).toBe(true);
  });

  it.each([
    [{ tagName: 'BUTTON' }],
    [{ tagName: 'INPUT', type: 'radio' }],
    [{ tagName: 'INPUT', type: 'checkbox' }],
    [{ tagName: 'DIV' }],
    [{}],
    [null],
  ])('does not ignore target %j', (target) => {
    expect(shouldIgnoreKeyEvent(ev({}, target))).toBe(false);
  });
});
