const test = require('node:test');
const assert = require('node:assert/strict');
const { splitDurationByStudyDay } = require('../src/utils/studyDay');

test('keeps a duration within one study day together', () => {
    assert.deepEqual(
        splitDurationByStudyDay('2026-09-25T20:05:00.000Z', '2026-09-25T20:10:00.000Z'),
        [{ studyDay: '2026-09-25', seconds: 300 }]
    );
});

test('splits a duration at the 20:00 UTC study-day boundary', () => {
    assert.deepEqual(
        splitDurationByStudyDay('2026-09-25T19:50:00.000Z', '2026-09-25T20:10:00.000Z'),
        [
            { studyDay: '2026-09-24', seconds: 600 },
            { studyDay: '2026-09-25', seconds: 600 }
        ]
    );
});

test('does not create a zero-length portion at an exact boundary', () => {
    assert.deepEqual(
        splitDurationByStudyDay('2026-09-25T20:00:00.000Z', '2026-09-25T20:01:00.000Z'),
        [{ studyDay: '2026-09-25', seconds: 60 }]
    );
});

test('returns no portions for invalid or reversed intervals', () => {
    assert.deepEqual(splitDurationByStudyDay('invalid', '2026-09-25T20:01:00.000Z'), []);
    assert.deepEqual(splitDurationByStudyDay('2026-09-25T20:01:00.000Z', '2026-09-25T20:00:00.000Z'), []);
});