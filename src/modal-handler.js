import { db, collection, doc, getDoc, setDoc, query, orderBy, getDocs } from './firebase-service.js';
import { backdrop, modal, modalBody, activeTitle, showInactiveToggleModal, btnSave, btnCancel } from './dom-elements.js';
import { getRecentActivePlayers } from './match-data-service.js';

const sessionDocRef = doc(db, 'meta', 'session'); // This ref should probably be here
let showInactivePlayersInModal = false;

function updateInactiveToggleAppearance() {
    if (!showInactiveToggleModal) return;
    if (showInactivePlayersInModal) {
        showInactiveToggleModal.textContent = 'Hide inactive';
        showInactiveToggleModal.style.backgroundColor = 'var(--hover-color)';
        showInactiveToggleModal.style.color = 'var(--text-color-primary)';
        showInactiveToggleModal.style.borderColor = 'var(--gray-light)';
    } else {
        showInactiveToggleModal.textContent = 'Show inactive';
        showInactiveToggleModal.style.backgroundColor = 'var(--card-background-color)';
        showInactiveToggleModal.style.color = 'var(--text-color-secondary)';
        showInactiveToggleModal.style.borderColor = 'var(--border-color)';
    }
}

function renderPlayerTiles(players, selectedPlayers, recentActivePlayers, onSelectionChange) {
    modalBody.innerHTML = '';

    const activeSet = new Set(recentActivePlayers);
    const visiblePlayers = showInactivePlayersInModal
        ? players
        : players.filter((name) => {
            return activeSet.has(name);
        });

    if (visiblePlayers.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.textContent = showInactivePlayersInModal
            ? 'No players found.'
            : 'No active players found.';
        emptyState.style.color = 'var(--text-color-secondary)';
        modalBody.appendChild(emptyState);
        return;
    }

    const setTileSelected = (tile, isSelected) => {
        tile.classList.toggle('selected', isSelected);
        tile.setAttribute('aria-pressed', String(isSelected));
    };

    const toggleSelected = (name, tile) => {
        if (selectedPlayers.has(name)) {
            selectedPlayers.delete(name);
            setTileSelected(tile, false);
        } else {
            selectedPlayers.add(name);
            setTileSelected(tile, true);
        }
        onSelectionChange();
    };

    visiblePlayers.forEach(name => {
        const row = document.createElement('div');
        row.className = 'player-tile-row';

        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'player-tile';
        tile.textContent = name;
        tile.setAttribute('data-player', name);
        tile.classList.toggle('inactive', !activeSet.has(name));
        tile.setAttribute('role', 'button');
        tile.setAttribute('tabindex', '0');
        setTileSelected(tile, selectedPlayers.has(name));

        // --- Interaction: mouse click toggles, touch swipe selects/deselects ---
        // CSS has touch-action: pan-y on .player-tile, so:
        //   vertical drag → browser scrolls, fires pointercancel
        //   horizontal drag → we get pointermove events
        const SWIPE_THRESHOLD = 24;
        let startX = 0;
        let ptrType = '';
        let ptrActive = false;
        let didSwipe = false;
        let lastDx = 0;

        tile.addEventListener('pointerdown', (event) => {
            if (!event.isPrimary) return;
            startX = event.clientX;
            ptrType = event.pointerType;
            ptrActive = true;
            didSwipe = false;
            lastDx = 0;
        });

        tile.addEventListener('pointermove', (event) => {
            if (!ptrActive || ptrType === 'mouse') return;

            const dx = event.clientX - startX;
            lastDx = dx;
            const isSelected = selectedPlayers.has(name);

            // Live-drag the tile under the finger
            tile.style.transition = 'background-color 80ms ease';
            tile.style.transform = isSelected
                ? `translateX(calc(50% + ${dx}px))`
                : `translateX(${dx}px)`;

            // Color hint once past threshold
            if (dx > SWIPE_THRESHOLD && !isSelected) {
                tile.style.backgroundColor = 'var(--dark-blue)';
            } else if (dx < -SWIPE_THRESHOLD && isSelected) {
                tile.style.backgroundColor = '#3a3a3a';
            } else {
                tile.style.backgroundColor = '';
            }

            if (Math.abs(dx) > SWIPE_THRESHOLD) {
                didSwipe = true;
            }
        });

        const endPointer = () => {
            if (!ptrActive) return;
            ptrActive = false;

            if (ptrType === 'mouse') {
                // Mouse: precise click → toggle
                toggleSelected(name, tile);
                return;
            }

            // Touch: evaluate swipe direction
            const isSelected = selectedPlayers.has(name);

            if (didSwipe && lastDx > SWIPE_THRESHOLD && !isSelected) {
                // Swipe right on unselected → select
                selectedPlayers.add(name);
                setTileSelected(tile, true);
                onSelectionChange();
            } else if (didSwipe && lastDx < -SWIPE_THRESHOLD && isSelected) {
                // Swipe left on selected → deselect
                selectedPlayers.delete(name);
                setTileSelected(tile, false);
                onSelectionChange();
            }

            // Animate back to class-driven resting position
            tile.style.backgroundColor = '';
            requestAnimationFrame(() => {
                tile.style.transition = '';
                tile.style.transform = '';
            });
        };

        tile.addEventListener('pointerup', endPointer);
        tile.addEventListener('pointercancel', () => {
            // Browser took over (vertical scroll) — snap back instantly
            ptrActive = false;
            tile.style.transition = 'none';
            tile.style.transform = '';
            tile.style.backgroundColor = '';
            requestAnimationFrame(() => { tile.style.transition = ''; });
        });

        tile.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleSelected(name, tile);
            }
        });

        row.appendChild(tile);
        modalBody.appendChild(row);
    });
}

// Function to open modal and load checkboxes
export async function showPlayerModal(triggerPairingCallback = null) {
    backdrop.style.display = 'flex';
    modal.style.display = 'none'; // Hide modal body for now to prevent flickering
    modalBody.innerHTML = ''; // Clear previous content

    const MIN_ACTIVE_PLAYERS = 4;
    let selectedPlayers = new Set();

    const updateConfirmState = () => {
        if (!btnSave) return;
        const shouldDisable = selectedPlayers.size < MIN_ACTIVE_PLAYERS;
        btnSave.disabled = shouldDisable;
        btnSave.setAttribute('aria-disabled', String(shouldDisable));
    };

    const updateActiveCount = () => {
        if (!activeTitle) return;
        activeTitle.textContent = `Select Players (${selectedPlayers.size})`;
        updateConfirmState();
    };

    const getSelectedPlayers = () => {
        return Array.from(selectedPlayers);
    };

    // Load all players
    const playersColRef = collection(db, 'players');
    const snapshot = await getDocs(query(playersColRef, orderBy('name')));
    const players = snapshot.docs.map(d => d.data().name);

    // Load saved active list
    const docSnap = await getDoc(sessionDocRef);
    const active = docSnap.exists() && docSnap.data().activePlayers || [];
    selectedPlayers = new Set(active);
    const recentActivePlayers = getRecentActivePlayers();

    const renderWithSelection = () => {
        renderPlayerTiles(players, selectedPlayers, recentActivePlayers, updateActiveCount);
        updateActiveCount();
    };

    renderWithSelection();
    updateConfirmState();

    if (showInactiveToggleModal) {
        updateInactiveToggleAppearance();
        showInactiveToggleModal.onclick = () => {
            showInactivePlayersInModal = !showInactivePlayersInModal;
            updateInactiveToggleAppearance();
            renderWithSelection();
        };
    }

    // Attach handler
    btnSave.onclick = async () => {
        if (btnSave.disabled) {
            return;
        }
        const checked = getSelectedPlayers();
        await setDoc(sessionDocRef, { activePlayers: checked });
        backdrop.style.display = 'none';
        if (triggerPairingCallback) {
            await triggerPairingCallback(); // Call the callback after saving
        }
    };

    btnCancel.addEventListener('click', () => {
        backdrop.style.display = 'none';
    });

    // Show modal body after content is loaded
    modal.style.display = '';
}