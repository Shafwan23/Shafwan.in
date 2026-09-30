import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ANONYMOUS, cleanName, isOffensive, isReserved } from '../src/names.js';

const rejects = (raw) => assert.throws(() => cleanName(raw), (e) => e.status === 422 && e.code === 'name');

test('accepts ordinary names and tidies spacing', () => {
  assert.deepEqual(cleanName('  Shafwan   Ahmed '), { name: 'Shafwan Ahmed', key: 'shafwanahmed' });
  assert.equal(cleanName("D'Souza").name, "D'Souza");
  assert.equal(cleanName('Anne-Marie').name, 'Anne-Marie');
  assert.equal(cleanName('José').name, 'José');
});

test('empty, missing or "anonymous" means anonymous', () => {
  for (const raw of [null, undefined, '', '   ', 'anonymous', 'Anonymous']) {
    assert.deepEqual(cleanName(raw), { name: ANONYMOUS, key: null });
  }
});

test('enforces length limits', () => {
  rejects('A');
  rejects('Abcdefghijklmno'); // 15
  assert.equal(cleanName('Abcdefghijklmn').name.length, 14);
});

test('letters only: no digits, symbols, emoji or markup', () => {
  for (const raw of ['Neo99', 'x_x', 'hi!', '<b>hi</b>', 'ab😀', '.Leading', 'a@b.com']) rejects(raw);
  assert.throws(() => cleanName(42), (e) => e.status === 422);
});

test('rejects keyboard mash made of one letter', () => {
  rejects('Aaaaa');
  rejects('zzz');
});

test('blocks offensive words however they are dressed up', () => {
  for (const raw of ['fuck', 'FUCK', 'F U C K', 'F.U.C.K', 'fuuck', 'xfuckx', 'Bitch', 'b-i-t-c-h',
    'Chutiya', 'madarchod', 'Thevidiya', 'Pundai', 'asshole', 'dumb ass', 'Big Dick', 'MC', 'Nazi']) {
    rejects(raw);
  }
});

test('does not block real names that merely contain a short bad word', () => {
  for (const raw of ['Cassandra', 'Dickens', 'Hitchcock', 'Nazia', 'Fukuda', 'Sussex', 'Essex',
    'Bob', 'Anal Shah', 'Niger', 'Scott', 'Shital', 'Therese']) {
    assert.doesNotThrow(() => cleanName(raw), raw);
  }
});

test('letters that do not decompose to a-z are refused (no ßitch, Ðick, Þussy)', () => {
  for (const raw of ['ßitch', 'Ðick', 'Þussy', 'Æthel', 'Øystein', 'Straße']) rejects(raw);
  assert.equal(cleanName('Zoë').name, 'Zoë');
  assert.equal(cleanName('Çelik').name, 'Çelik');
});

test('whole-word terms split across words are still caught', () => {
  for (const raw of ['Big D ick', 'Mr Co ck', 'A S S', 'Sh it Head', 'Ch od']) rejects(raw);
});

test('"Anonymous." and friends are treated as anonymous, not a shared name', () => {
  for (const raw of ['Anonymous.', 'ANON-YMOUS', 'a.n.o.n.y.m.o.u.s']) {
    assert.deepEqual(cleanName(raw), { name: ANONYMOUS, key: null });
  }
});

test('isOffensive is exported for reuse', () => {
  assert.equal(isOffensive('good name'), false);
  assert.equal(isOffensive('shithead'), true);
});

test('the reserved name is refused in any spelling, with its own error code', () => {
  for (const raw of ['Sabeeha', 'SABEEHA', 'sa beeha', 'Sa-bee-ha', 'Sabeeeha', 'Sabeha', 'Sabeeha Khan', 'Miss Sabeeha']) {
    assert.throws(() => cleanName(raw), (e) => e.status === 422 && e.code === 'name_reserved', raw);
  }
  for (const raw of ['Sabeena', 'Sabina', 'Saba', 'Shafwan', 'Shafwan Ahmed']) assert.doesNotThrow(() => cleanName(raw), raw);
  assert.equal(isReserved('Sabeeha'), true);
  assert.equal(isReserved('Sabeena'), false);
});
