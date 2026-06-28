import test from 'node:test';
import assert from 'node:assert/strict';
import { convertMathJsonToAst, astToLatex } from './mathUtils.js';

test('parses arithmetic and renders it as latex', () => {
  const ast = convertMathJsonToAst(['Add', ['Number', 5], ['Number', 3]]);
  assert.equal(ast.type, 'binaryOp');
  assert.equal(ast.op, '+');
  assert.equal(astToLatex([ast]), '5 + 3');
});

test('parses fractions from math-json', () => {
  const ast = convertMathJsonToAst(['Divide', ['Number', 1], ['Number', 2]]);
  assert.equal(ast.type, 'fraction');
  assert.equal(astToLatex([ast]), '\\frac{1}{2}');
});
