/** @jest-environment node */
import fs from 'node:fs';
import path from 'node:path';

// Worker-safe / DOM-free guard: non-test module files must not reference DOM, console, React or require().
const dir = __dirname;
const moduleFiles = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.js') && !f.endsWith('.test.js'));

const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

describe('sudoku module boundary', () => {
  test('module files were found', () => {
    expect(moduleFiles).toEqual(
      expect.arrayContaining(['config.js', 'errors.js', 'random.js', 'solver.js', 'generator.js', 'index.js']),
    );
  });

  test.each([
    ['window', /\bwindow\b/],
    ['document', /\bdocument\b/],
    ['console', /\bconsole\b/],
    ['require(', /\brequire\s*\(/],
    ['react', /react/i],
    ['jsx import', /from\s+['"][^'"]*\.jsx['"]/],
    ['package or bare import', /(?:from|import)\s*\(?\s*['"](?!\.{1,2}\/)[^'"]+['"]/],
    ['node built-in', /['"](?:node:[^'"]*|fs|path|os|crypto|util|child_process|http|https|stream|buffer|worker_threads)['"]/],
    ['localStorage', /\blocalStorage\b/],
    ['sessionStorage', /\bsessionStorage\b/],
    ['navigator', /\bnavigator\b/],
  ])('no %s in module code', (_name, pattern) => {
    moduleFiles.forEach((f) => {
      const src = stripComments(fs.readFileSync(path.join(dir, f), 'utf8'));
      expect([f, pattern.test(src)]).toEqual([f, false]);
    });
  });
});
