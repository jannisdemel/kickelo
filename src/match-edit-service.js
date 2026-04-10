// src/match-edit-service.js
// Service for editing submitted matches with validation and audit trail.

import { db, doc, updateDoc } from './firebase-service.js';
import { serverTimestamp } from 'firebase/firestore';
import { MATCH_EDIT_WINDOW_MS, MAX_EDITABLE_MATCHES, MAX_GOALS } from './constants.js';
import { allMatches } from './match-data-service.js';
import { showToast } from './toast.js';
import { filterMatchesBySeason, getSelectedSeason } from './season-service.js';

/**
 * Check whether a match can be edited.
 * A match is editable if it's within the time window and among the N most recent.
 * @param {object} match - The match object (must have id and timestamp).
 * @returns {{ editable: boolean, reason?: string }}
 */
export function canEditMatch(match) {
    if (!match || !match.id) {
        return { editable: false, reason: 'Invalid match.' };
    }

    const now = Date.now();
    const matchTime = typeof match.timestamp === 'number' ? match.timestamp : 0;

    if (now - matchTime > MATCH_EDIT_WINDOW_MS) {
        const hoursAgo = Math.round((now - matchTime) / (60 * 60 * 1000));
        return { editable: false, reason: `Match is too old to edit (${hoursAgo}h ago). Edits are allowed within 24 hours.` };
    }

    // Check recency: match must be among the N most recent (allMatches is sorted newest-first)
    const season = getSelectedSeason();
    const seasonMatches = filterMatchesBySeason(allMatches, season);
    const recentIds = new Set(seasonMatches.slice(0, MAX_EDITABLE_MATCHES).map(m => m.id));
    if (!recentIds.has(match.id)) {
        return { editable: false, reason: `Only the ${MAX_EDITABLE_MATCHES} most recent matches can be edited.` };
    }

    return { editable: true };
}

/**
 * Build an edit history entry recording what changed.
 * @param {object} original - The original match data.
 * @param {object} updated - The new field values.
 * @returns {object} History entry with timestamp, changedFields, and before/after snapshots.
 */
export function buildEditHistoryEntry(original, updated) {
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

    return {
        editedAt: Date.now(),
        changedFields,
        before,
        after,
    };
}

/**
 * Validate edited match data.
 * @param {object} data - { teamA, teamB, goalsA, goalsB }
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateMatchEdit(data) {
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

/**
 * Save an edited match to Firestore.
 * @param {object} originalMatch - The full original match object.
 * @param {object} updates - The changed fields: { teamA?, teamB?, goalsA?, goalsB?, positionsConfirmed?, ranked? }
 * @returns {Promise<boolean>} true on success
 */
export async function saveMatchEdit(originalMatch, updates) {
    // Derive winner from goals
    const goalsA = updates.goalsA ?? originalMatch.goalsA;
    const goalsB = updates.goalsB ?? originalMatch.goalsB;
    const winner = goalsA > goalsB ? 'A' : 'B';

    const finalUpdates = {
        ...updates,
        goalsA,
        goalsB,
        winner,
    };

    // Validate
    const teamA = finalUpdates.teamA ?? originalMatch.teamA;
    const teamB = finalUpdates.teamB ?? originalMatch.teamB;
    const validation = validateMatchEdit({ teamA, teamB, goalsA, goalsB });
    if (!validation.valid) {
        showToast(validation.error, 'error');
        return false;
    }

    // Build history
    const historyEntry = buildEditHistoryEntry(originalMatch, finalUpdates);
    if (historyEntry.changedFields.length === 0) {
        showToast('No changes to save.', 'info');
        return false;
    }

    const existingHistory = Array.isArray(originalMatch.editHistory) ? originalMatch.editHistory : [];

    const matchDocRef = doc(db, 'matches', originalMatch.id);

    try {
        await updateDoc(matchDocRef, {
            teamA,
            teamB,
            winner,
            goalsA,
            goalsB,
            positionsConfirmed: finalUpdates.positionsConfirmed ?? originalMatch.positionsConfirmed ?? null,
            ranked: finalUpdates.ranked ?? originalMatch.ranked ?? true,
            editedAt: serverTimestamp(),
            editHistory: [...existingHistory, historyEntry],
        });
        showToast('Match updated! Stats will refresh automatically.', 'success');
        return true;
    } catch (error) {
        console.error('Error updating match:', error);
        showToast('Failed to update match. Check the console for details.', 'error');
        return false;
    }
}
