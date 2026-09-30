import test from 'node:test';
import assert from 'node:assert/strict';
import { specialName } from '../src/js/lab/special.js';

test('the reserved name is caught in any spelling, alone or inside a fuller name', () => {
  for (const raw of ['sabeeha', 'Sabeeha', 'SABEEHA', 'sa beeha', 'Sa-bee-ha', 'Sabeeeha', 'Sabeha', 'Sabeeha Khan', 'Miss Sabeeha', 'S.a.b.e.e.h.a', 'Sabéeha']) {
    assert.equal(specialName(raw), 'reserved', raw);
  }
});

test('the owner gets the wink, with or without a surname', () => {
  for (const raw of ['shafwan', 'SHAFWAN', 'Shafwan Ahmed', 'Mohammed Shafwan', 'Shaf wan', 'Shafwaan']) {
    assert.equal(specialName(raw), 'owner', raw);
  }
});

test('everyone else is ordinary', () => {
  for (const raw of ['Sabeena', 'Sabina', 'Saba', 'Shafwana', 'Shaf', 'Ada Lovelace', '', '   ', '...', null, undefined, 42]) {
    assert.equal(specialName(raw), null, String(raw));
  }
});
