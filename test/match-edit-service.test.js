// test/match-edit-service.test.js
// Tests for match edit service validation and history building.
// These test the pure logic functions without needing Firebase.

import { MATCH_EDIT_WINDOW_MS, MAX_EDITABLE_MATCHES, MAX_GOALS } from '../src/constants.js';

// ---------- Inline implementations (to avoid Firebase imports) ----------
// We re-implement the pure functions here to test the logic independently
// of the Firebase-dependent module.

function validateMatchEdit(data) {
    const { teamA, teamB, goalsA, goalsB } = data;

    if (!Array.isArray(teamA) || teamA.length === 0 || !Array.isArray(teamB) || teamB.length === 0) {
        return { valid: false, error: 'Each team must have at least one player.' };
    }
    if (teamA.length !== teamB.length) {
        return { valid: false, error: 'Both teams must have the same number of players (1v1 or 2v2).' };
    }
    const allPlayers = [...teamA, ...teamB];
    if (new Set(allPlayers).size < allPlayers.length) {
        return { valid: false, error: 'A player cannot play on both teams.' };
    }
    if (typeof goalsA !== 'number' || typeof goalsB !== 'number') {
        return { valid: false, error: 'Goals must be valid numbers.' };
    }
    if (goalsA === goalsB) {
        return { valid: false, error: 'Cannot submit a tie.' };
    }
    if (goalsA > MAX_GOALS || goalsB > MAX_GOALS) {
        return { valid: false, error: `Goals cannot exceed ${MAX_GOALS}.` };
    }
    if (!(goalsA === MAX_GOALS && goalsB < MAX_GOALS) && !(goalsB === MAX_GOALS && goalsA < MAX_GOALS)) {
        return { valid: false, error: `One team must have exactly ${MAX_GOALS} goals, the other less.` };
    }

    return { valid: true };
}

function buildEditHistoryEntry(original, updated) {
    const changedFields = [];
    const before = {};
    const after = {};
    const trackableFields = ['teamA', 'teamB', 'winner', 'goalsA', 'goalsB', 'positionsConfirmed', 'ranked'];

    for (const field of trackableFields) {
        const origVal = original[field];
        const newVal = updated[field];
        if (newVal === undefined) continue;
        const changed = Array.isArray(origVal)
            ? JSON.stringify(origVal) !== JSON.stringify(newVal)
            : origVal !== newVal;
        if (changed) {
            changedFields.push(field);
            before[field] = origVal;
            after[field] = newVal;
        }
    }

    return { editedAt: Date.now(), changedFields, before, after };
}

function canEditMatch(match, allMatches) {
    if (!match || !match.id) {
        return { editable: false, reason: 'Invalid match.' };
    }
    const now = Date.now();
    const matchTime = typeof match.timestamp === 'number' ? match.timestamp : 0;
    if (now - matchTime > MATCH_EDIT_WINDOW_MS) {
        return { editable: false, reason: 'Match is too old to edit.' };
    }
    const recentIds = new Set(allMatches.slice(0, MAX_EDITABLE_MATCHES).map(m => m.id));
    if (!recentIds.has(match.id)) {
        return { editable: false, reason: `Only the ${MAX_EDITABLE_MATCHES} most recent matches can be edited.` };
    }
    return { editable: true };
}

// ---------- Test helpers ----------
let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (!condition) {
        console.error(`  ✗ FAIL: ${message}`);
        failed++;
    } else {
        console.log(`  ✓ ${message}`);
        passed++;
    }
}

function assertDeepEqual(a, b, message) {
    assert(JSON.stringify(a) === JSON.stringify(b), message);
}

// ---------- Tests ----------
console.log('\n=== Testing validateMatchEdit ===\n');

// Valid cases
assert(validateMatchEdit({ teamA: ['Alice'], teamB: ['Bob'], goalsA: 5, goalsB: 3 }).valid, 'Valid 1v1 match');
assert(validateMatchEdit({ teamA: ['Alice', 'Bob'], teamB: ['Charlie', 'David'], goalsA: 5, goalsB: 4 }).valid, 'Valid 2v2 match');
assert(validateMatchEdit({ teamA: ['Alice'], teamB: ['Bob'], goalsA: 2, goalsB: 5 }).valid, 'Valid 1v1 match (team B wins)');

// Invalid cases
assert(!validateMatchEdit({ teamA: [], teamB: ['Bob'], goalsA: 5, goalsB: 3 }).valid, 'Reject empty team A');
assert(!validateMatchEdit({ teamA: ['Alice'], teamB: [], goalsA: 5, goalsB: 3 }).valid, 'Reject empty team B');
assert(!validateMatchEdit({ teamA: ['Alice', 'Bob'], teamB: ['Charlie'], goalsA: 5, goalsB: 3 }).valid, 'Reject mismatched team sizes');
assert(!validateMatchEdit({ teamA: ['Alice'], teamB: ['Alice'], goalsA: 5, goalsB: 3 }).valid, 'Reject same player on both teams');
assert(!validateMatchEdit({ teamA: ['Alice', 'Bob'], teamB: ['Alice', 'Charlie'], goalsA: 5, goalsB: 3 }).valid, 'Reject player on both teams (2v2)');
assert(!validateMatchEdit({ teamA: ['Alice'], teamB: ['Bob'], goalsA: 3, goalsB: 3 }).valid, 'Reject tie');
assert(!validateMatchEdit({ teamA: ['Alice'], teamB: ['Bob'], goalsA: 6, goalsB: 3 }).valid, 'Reject goals exceeding MAX_GOALS');
assert(!validateMatchEdit({ teamA: ['Alice'], teamB: ['Bob'], goalsA: 4, goalsB: 3 }).valid, 'Reject no team at MAX_GOALS');
assert(!validateMatchEdit({ teamA: ['Alice'], teamB: ['Bob'], goalsA: 'five', goalsB: 3 }).valid, 'Reject non-numeric goals');

console.log('\n=== Testing buildEditHistoryEntry ===\n');

const original = {
    teamA: ['Alice', 'Bob'],
    teamB: ['Charlie', 'David'],
    winner: 'A',
    goalsA: 5,
    goalsB: 3,
    ranked: true,
    positionsConfirmed: true,
};

// No changes
{
    const entry = buildEditHistoryEntry(original, { ...original });
    assert(entry.changedFields.length === 0, 'No changes detected when nothing changed');
}

// Swap winner
{
    const entry = buildEditHistoryEntry(original, { ...original, winner: 'B', goalsA: 3, goalsB: 5 });
    assert(entry.changedFields.includes('winner'), 'Detects winner change');
    assert(entry.changedFields.includes('goalsA'), 'Detects goalsA change');
    assert(entry.changedFields.includes('goalsB'), 'Detects goalsB change');
    assertDeepEqual(entry.before.winner, 'A', 'Records original winner');
    assertDeepEqual(entry.after.winner, 'B', 'Records new winner');
}

// Swap teams
{
    const entry = buildEditHistoryEntry(original, { ...original, teamA: ['Charlie', 'David'], teamB: ['Alice', 'Bob'] });
    assert(entry.changedFields.includes('teamA'), 'Detects teamA change');
    assert(entry.changedFields.includes('teamB'), 'Detects teamB change');
    assertDeepEqual(entry.before.teamA, ['Alice', 'Bob'], 'Records original teamA');
    assertDeepEqual(entry.after.teamA, ['Charlie', 'David'], 'Records new teamA');
}

// Change ranked
{
    const entry = buildEditHistoryEntry(original, { ...original, ranked: false });
    assert(entry.changedFields.includes('ranked'), 'Detects ranked change');
    assert(entry.changedFields.length === 1, 'Only ranked changed');
}

console.log('\n=== Testing canEditMatch ===\n');

const now = Date.now();
const oneHour = 60 * 60 * 1000;

const recentMatches = [];
for (let i = 0; i < 15; i++) {
    recentMatches.push({ id: `match${i}`, timestamp: now - i * oneHour });
}

// Editable: recent and within time window
assert(canEditMatch(recentMatches[0], recentMatches).editable, 'Most recent match is editable');
assert(canEditMatch(recentMatches[9], recentMatches).editable, `Match #${MAX_EDITABLE_MATCHES} is editable`);

// Not editable: too far down the list
assert(!canEditMatch(recentMatches[10], recentMatches).editable, `Match #${MAX_EDITABLE_MATCHES + 1} is not editable (too far back)`);

// Not editable: too old
const oldMatch = { id: 'old', timestamp: now - 25 * oneHour };
assert(!canEditMatch(oldMatch, [oldMatch, ...recentMatches]).editable, 'Match older than 24h is not editable');

// Not editable: invalid match
assert(!canEditMatch(null, recentMatches).editable, 'Null match is not editable');
assert(!canEditMatch({}, recentMatches).editable, 'Match without id is not editable');

// ---------- Summary ----------
console.log(`\n${'='.repeat(40)}`);
if (failed === 0) {
    console.log(`=== All ${passed} Tests Passed ✓ ===`);
} else {
    console.log(`=== ${failed} FAILED, ${passed} passed ===`);
    process.exit(1);
}
