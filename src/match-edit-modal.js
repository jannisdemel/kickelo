// src/match-edit-modal.js
// Modal UI for editing a submitted match.

import { allPlayers } from './player-data-service.js';
import { canEditMatch, saveMatchEdit } from './match-edit-service.js';
import { MAX_GOALS } from './constants.js';
import { showConfirm } from './toast.js';

let currentModal = null;

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Build a player <select> dropdown pre-filled with the given value.
 * @param {string} selectedValue - Current player name.
 * @param {string} placeholder - Placeholder text.
 * @param {string} cssClass - Extra CSS class for team color.
 * @returns {HTMLSelectElement}
 */
function buildPlayerSelect(selectedValue, placeholder, cssClass) {
    const select = document.createElement('select');
    select.className = `edit-modal-select ${cssClass}`;

    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = placeholder;
    select.appendChild(defaultOpt);

    const players = allPlayers.map(p => p.id).sort();
    for (const name of players) {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
    }

    select.value = selectedValue || '';
    return select;
}

/**
 * Build a goals <select> dropdown pre-filled with the given value.
 * @param {number} selectedValue - Current goals count.
 * @param {string} cssClass - Extra CSS class for team color.
 * @returns {HTMLSelectElement}
 */
function buildGoalsSelect(selectedValue, cssClass) {
    const select = document.createElement('select');
    select.className = `edit-modal-select edit-modal-goals ${cssClass}`;

    for (let i = 0; i <= MAX_GOALS; i++) {
        const opt = document.createElement('option');
        opt.value = String(i);
        opt.textContent = String(i);
        select.appendChild(opt);
    }

    select.value = String(selectedValue ?? 0);
    return select;
}

/**
 * Build the change summary element that updates live as the user edits.
 */
function buildChangeSummary(original, getEdited) {
    const container = document.createElement('div');
    container.className = 'edit-modal-changes';

    function update() {
        const edited = getEdited();
        const changes = [];

        if (JSON.stringify(edited.teamA) !== JSON.stringify(original.teamA)) {
            changes.push(`Team Red: ${original.teamA.join(' & ')} → ${edited.teamA.join(' & ')}`);
        }
        if (JSON.stringify(edited.teamB) !== JSON.stringify(original.teamB)) {
            changes.push(`Team Blue: ${original.teamB.join(' & ')} → ${edited.teamB.join(' & ')}`);
        }
        if (edited.goalsA !== original.goalsA || edited.goalsB !== original.goalsB) {
            const origWG = original.winner === 'A' ? original.goalsA : original.goalsB;
            const origLG = original.winner === 'A' ? original.goalsB : original.goalsA;
            const newWinner = edited.goalsA > edited.goalsB ? 'A' : 'B';
            const newWG = newWinner === 'A' ? edited.goalsA : edited.goalsB;
            const newLG = newWinner === 'A' ? edited.goalsB : edited.goalsA;
            changes.push(`Score: ${origWG}:${origLG} → ${newWG}:${newLG}`);
        } else {
            const editedWinner = edited.goalsA > edited.goalsB ? 'A' : (edited.goalsA < edited.goalsB ? 'B' : null);
            if (editedWinner && editedWinner !== original.winner) {
                const winTeam = editedWinner === 'A' ? 'Red' : 'Blue';
                changes.push(`Winner: ${original.winner === 'A' ? 'Red' : 'Blue'} → ${winTeam}`);
            }
        }
        if (edited.ranked !== (original.ranked ?? true)) {
            changes.push(`Ranked: ${original.ranked ?? true ? 'Yes' : 'No'} → ${edited.ranked ? 'Yes' : 'No'}`);
        }

        if (changes.length === 0) {
            container.innerHTML = '<span class="edit-modal-no-changes">No changes</span>';
        } else {
            container.innerHTML = changes.map(c => `<div class="edit-modal-change-item">• ${escapeHtml(c)}</div>`).join('');
        }
    }

    return { element: container, update };
}

/**
 * Open the edit modal for a given match.
 * @param {object} match - The match object from allMatches.
 */
export function openEditModal(match) {
    if (currentModal) {
        closeEditModal();
    }

    const editCheck = canEditMatch(match);
    if (!editCheck.editable) {
        return;
    }

    const is2v2 = match.teamA.length === 2;

    // Build backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'confirm-backdrop edit-modal-backdrop';

    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog edit-modal-dialog';

    // Title
    const title = document.createElement('div');
    title.className = 'edit-modal-title';
    title.textContent = 'Edit Match';
    dialog.appendChild(title);

    // Scrollable body
    const scrollBody = document.createElement('div');
    scrollBody.className = 'confirm-scroll-body';

    // Original match reference
    const originalRef = document.createElement('div');
    originalRef.className = 'edit-modal-original';
    const teamANames = match.teamA.map(p => `<span style="color: #ce848c;">${escapeHtml(p)}</span>`).join(' & ');
    const teamBNames = match.teamB.map(p => `<span style="color: #6cabc2;">${escapeHtml(p)}</span>`).join(' & ');
    const winnerNames = match.winner === 'A' ? teamANames : teamBNames;
    const loserNames = match.winner === 'A' ? teamBNames : teamANames;
    const wGoals = match.winner === 'A' ? match.goalsA : match.goalsB;
    const lGoals = match.winner === 'A' ? match.goalsB : match.goalsA;
    originalRef.innerHTML = `<span class="edit-modal-original-label">Original:</span> ${winnerNames} ${wGoals}:${lGoals} ${loserNames}`;
    scrollBody.appendChild(originalRef);

    // --- Team A (Red) ---
    const teamASection = document.createElement('div');
    teamASection.className = 'edit-modal-team edit-modal-team-red';

    const teamALabel = document.createElement('div');
    teamALabel.className = 'edit-modal-team-label';
    teamALabel.textContent = 'Team Red';
    teamASection.appendChild(teamALabel);

    const teamA1Select = buildPlayerSelect(match.teamA[0], 'Red defense', 'edit-red');
    teamASection.appendChild(teamA1Select);
    let teamA2Select = null;
    if (is2v2) {
        teamA2Select = buildPlayerSelect(match.teamA[1], 'Red offense', 'edit-red');
        teamASection.appendChild(teamA2Select);
    }
    scrollBody.appendChild(teamASection);

    // --- Score ---
    const scoreSection = document.createElement('div');
    scoreSection.className = 'edit-modal-score';

    const goalsASelect = buildGoalsSelect(match.goalsA, 'edit-red');
    const goalsBSelect = buildGoalsSelect(match.goalsB, 'edit-blue');
    const scoreSeparator = document.createElement('span');
    scoreSeparator.className = 'edit-modal-score-sep';
    scoreSeparator.textContent = ':';

    scoreSection.appendChild(goalsASelect);
    scoreSection.appendChild(scoreSeparator);
    scoreSection.appendChild(goalsBSelect);
    scrollBody.appendChild(scoreSection);

    // --- Team B (Blue) ---
    const teamBSection = document.createElement('div');
    teamBSection.className = 'edit-modal-team edit-modal-team-blue';

    const teamBLabel = document.createElement('div');
    teamBLabel.className = 'edit-modal-team-label';
    teamBLabel.textContent = 'Team Blue';
    teamBSection.appendChild(teamBLabel);

    const teamB1Select = buildPlayerSelect(match.teamB[0], 'Blue defense', 'edit-blue');
    teamBSection.appendChild(teamB1Select);
    let teamB2Select = null;
    if (is2v2) {
        teamB2Select = buildPlayerSelect(match.teamB[1], 'Blue offense', 'edit-blue');
        teamBSection.appendChild(teamB2Select);
    }
    scrollBody.appendChild(teamBSection);

    // --- Ranked checkbox ---
    const rankedRow = document.createElement('div');
    rankedRow.className = 'edit-modal-option-row';
    const rankedLabel = document.createElement('label');
    const rankedCheckbox = document.createElement('input');
    rankedCheckbox.type = 'checkbox';
    rankedCheckbox.checked = match.ranked ?? true;
    rankedLabel.appendChild(rankedCheckbox);
    rankedLabel.appendChild(document.createTextNode(' Ranked match'));
    rankedRow.appendChild(rankedLabel);
    scrollBody.appendChild(rankedRow);

    // --- Quick actions ---
    const quickActions = document.createElement('div');
    quickActions.className = 'edit-modal-quick-actions';

    const swapTeamsBtn = document.createElement('button');
    swapTeamsBtn.className = 'confirm-btn confirm-btn-cancel';
    swapTeamsBtn.textContent = '⇆ Swap Teams';
    swapTeamsBtn.type = 'button';
    swapTeamsBtn.addEventListener('click', () => {
        // Swap player selections
        const tmpA1 = teamA1Select.value;
        const tmpA2 = teamA2Select?.value;
        const tmpB1 = teamB1Select.value;
        const tmpB2 = teamB2Select?.value;
        teamA1Select.value = tmpB1;
        teamB1Select.value = tmpA1;
        if (is2v2) {
            teamA2Select.value = tmpB2;
            teamB2Select.value = tmpA2;
        }
        // Swap goals
        const tmpGA = goalsASelect.value;
        goalsASelect.value = goalsBSelect.value;
        goalsBSelect.value = tmpGA;
        changeSummary.update();
    });
    quickActions.appendChild(swapTeamsBtn);

    const swapWinnerBtn = document.createElement('button');
    swapWinnerBtn.className = 'confirm-btn confirm-btn-cancel';
    swapWinnerBtn.textContent = '↕ Swap Score';
    swapWinnerBtn.type = 'button';
    swapWinnerBtn.addEventListener('click', () => {
        const tmpGA = goalsASelect.value;
        goalsASelect.value = goalsBSelect.value;
        goalsBSelect.value = tmpGA;
        changeSummary.update();
    });
    quickActions.appendChild(swapWinnerBtn);

    scrollBody.appendChild(quickActions);

    // --- Change summary ---
    function getEditedValues() {
        const teamA = [teamA1Select.value].concat(teamA2Select ? [teamA2Select.value] : []).filter(Boolean);
        const teamB = [teamB1Select.value].concat(teamB2Select ? [teamB2Select.value] : []).filter(Boolean);
        return {
            teamA: teamA.length > 0 ? teamA : match.teamA,
            teamB: teamB.length > 0 ? teamB : match.teamB,
            goalsA: parseInt(goalsASelect.value, 10),
            goalsB: parseInt(goalsBSelect.value, 10),
            ranked: rankedCheckbox.checked,
        };
    }

    const changeSummary = buildChangeSummary(match, getEditedValues);
    scrollBody.appendChild(changeSummary.element);
    changeSummary.update();

    dialog.appendChild(scrollBody);

    // Wire up live change detection on all inputs
    const allInputs = [teamA1Select, teamA2Select, teamB1Select, teamB2Select, goalsASelect, goalsBSelect, rankedCheckbox].filter(Boolean);
    allInputs.forEach(input => {
        input.addEventListener('change', changeSummary.update);
    });

    // Auto-set other goals to MAX when one changes (same behavior as main form)
    goalsASelect.addEventListener('change', () => {
        if (goalsASelect.value !== String(MAX_GOALS)) {
            goalsBSelect.value = String(MAX_GOALS);
        }
        changeSummary.update();
    });
    goalsBSelect.addEventListener('change', () => {
        if (goalsBSelect.value !== String(MAX_GOALS)) {
            goalsASelect.value = String(MAX_GOALS);
        }
        changeSummary.update();
    });

    // --- Buttons ---
    const btnRow = document.createElement('div');
    btnRow.className = 'confirm-buttons';

    const btnCancel = document.createElement('button');
    btnCancel.className = 'confirm-btn confirm-btn-cancel';
    btnCancel.textContent = 'Cancel';
    btnCancel.type = 'button';

    const btnSave = document.createElement('button');
    btnSave.className = 'confirm-btn confirm-btn-ok';
    btnSave.textContent = 'Save Changes';
    btnSave.type = 'button';

    btnRow.appendChild(btnCancel);
    btnRow.appendChild(btnSave);
    dialog.appendChild(btnRow);

    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);
    currentModal = backdrop;

    // Animate in
    requestAnimationFrame(() => backdrop.classList.add('confirm-visible'));

    // Event handlers
    btnCancel.addEventListener('click', closeEditModal);
    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeEditModal();
    });

    btnSave.addEventListener('click', async () => {
        const edited = getEditedValues();
        const isRanked = match.ranked ?? true;
        if (isRanked && edited.ranked) {
            const proceed = await showConfirm(
                'Editing this ranked match will trigger Elo recalculation for all affected players.\n\nContinue?',
                { confirmLabel: 'Save', cancelLabel: 'Go back', type: 'warning' }
            );
            if (!proceed) return;
        }

        btnSave.disabled = true;
        btnSave.textContent = 'Saving…';

        const success = await saveMatchEdit(match, edited);
        if (success) {
            closeEditModal();
        } else {
            btnSave.disabled = false;
            btnSave.textContent = 'Save Changes';
        }
    });

    // Focus save button
    requestAnimationFrame(() => btnSave.focus());
}

function closeEditModal() {
    if (!currentModal) return;
    currentModal.classList.remove('confirm-visible');
    const modal = currentModal;
    currentModal = null;
    modal.addEventListener('transitionend', () => modal.remove(), { once: true });
    setTimeout(() => modal.remove(), 350);
}
