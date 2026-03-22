// src/activity-heatmap.js
// GitHub-style activity heatmap showing matches per day.
// Each column = one week (Sun → Sat, top to bottom). Color intensity = match count.
// Always shows ALL matches regardless of season, spanning from the earliest match to today.

import { allMatches } from './match-data-service.js';

const CELL_SIZE = 11;
const CELL_GAP = 5;
const TOTAL_CELL = CELL_SIZE + CELL_GAP;

// Color scale (0 matches → many matches), matching GitHub's dark-mode green palette
const COLOR_SCALE = [
    'var(--heatmap-empty, #292929)',   
    'var(--heatmap-l1, #033A16)',
    'var(--heatmap-l2, #196C2E)',  
    'var(--heatmap-l3, #2EA043)',
    'var(--heatmap-l4, #56D364)',
];

function getColor(count) {
    if (count === 0) return COLOR_SCALE[0];
    if (count < 4) return COLOR_SCALE[1];
    if (count < 8) return COLOR_SCALE[2];
    if (count < 12) return COLOR_SCALE[3];
    return COLOR_SCALE[4];
}

function buildDayCounts(matches) {
    const counts = {};
    for (const match of matches) {
        const ts = match.timestamp;
        if (!ts) continue;
        const d = new Date(ts);
        d.setHours(0, 0, 0, 0);
        const key = d.toISOString().slice(0, 10);
        counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
}

function getDateKey(date) {
    return date.toISOString().slice(0, 10);
}

/** Sunday = 0, Saturday = 6 (native JS day-of-week). */
function dayOfWeekSundayFirst(date) {
    return date.getDay();
}

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

function getMonthLabels(startDate, totalWeeks) {
    const labels = [];
    let lastMonth = -1;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let w = 0; w < totalWeeks; w++) {
        const weekStart = new Date(startDate);
        weekStart.setDate(weekStart.getDate() + w * 7);
        const month = weekStart.getMonth();
        if (month !== lastMonth) {
            labels.push({ week: w, label: monthNames[month] });
            lastMonth = month;
        }
    }
    return labels;
}

/**
 * Find the earliest match timestamp from the full (all-time) match list.
 */
function getEarliestMatchDate(matches) {
    let earliest = Infinity;
    for (const match of matches) {
        if (match.timestamp && match.timestamp < earliest) {
            earliest = match.timestamp;
        }
    }
    if (!Number.isFinite(earliest)) return null;
    const d = new Date(earliest);
    d.setHours(0, 0, 0, 0);
    return d;
}

export function renderActivityHeatmap(containerEl) {
    if (!containerEl) return;

    // Use ALL matches regardless of season
    const dayCounts = buildDayCounts(allMatches);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start date: align the earliest match to its containing Sunday
    const earliestMatch = getEarliestMatchDate(allMatches);
    let startDate;
    if (earliestMatch) {
        startDate = new Date(earliestMatch);
        startDate.setDate(startDate.getDate() - dayOfWeekSundayFirst(startDate));
    } else {
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 19 * 7);
    }

    const daysSinceStart = Math.round((today - startDate) / (24 * 60 * 60 * 1000));
    const totalWeeks = Math.floor(daysSinceStart / 7) + 1;

    const LABEL_WIDTH = 30; // px for the fixed day-label column
    const monthLabelHeight = 14;
    const gridWidth = totalWeeks * TOTAL_CELL;
    const gridHeight = monthLabelHeight + 7 * TOTAL_CELL;

    const monthLabels = getMonthLabels(startDate, totalWeeks);

    // --- Grid rects (no labelWidth offset — day labels live in a separate SVG) ---
    let rects = '';
    for (let w = 0; w < totalWeeks; w++) {
        for (let d = 0; d < 7; d++) {
            const cellDate = new Date(startDate);
            cellDate.setDate(cellDate.getDate() + w * 7 + d);
            if (cellDate > today) continue;
            const key = getDateKey(cellDate);
            const count = dayCounts[key] || 0;
            const x = w * TOTAL_CELL;
            const y = monthLabelHeight + d * TOTAL_CELL;
            const color = getColor(count);
            const dateStr = cellDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
            const title = `${dateStr}: ${count} match${count !== 1 ? 'es' : ''}`;
            rects += `<rect x="${x}" y="${y}" width="${CELL_SIZE}" height="${CELL_SIZE}" rx="2" ry="2" fill="${color}" data-count="${count}"><title>${title}</title></rect>`;
        }
    }

    // --- Fixed day labels (separate SVG, always visible) ---
    let dayLabelsHtml = '';
    DAY_LABELS.forEach((label, i) => {
        if (!label) return;
        const y = monthLabelHeight + i * TOTAL_CELL + CELL_SIZE - 1;
        dayLabelsHtml += `<text x="0" y="${y}" class="heatmap-label">${label}</text>`;
    });

    // --- Month labels (inside scrollable grid) ---
    let monthLabelsHtml = '';
    for (const { week, label } of monthLabels) {
        const x = week * TOTAL_CELL;
        monthLabelsHtml += `<text x="${x}" y="${monthLabelHeight - 3}" class="heatmap-label">${label}</text>`;
    }

    // --- Legend ---
    // const legendCells = [0, 1, 2, 3, 5];
    const legendWidth = COLOR_SCALE.length * TOTAL_CELL + 70;
    const legendHeight = TOTAL_CELL + 6;

    let legendInner = `<text x="0" y="${CELL_SIZE - 1}" class="heatmap-label">Less</text>`;
    const legendOffsetX = 28;
    COLOR_SCALE.forEach((color, i) => {
        const x = legendOffsetX + i * TOTAL_CELL;
        legendInner += `<rect x="${x}" y="0" width="${CELL_SIZE}" height="${CELL_SIZE}" rx="2" ry="2" fill="${color}"><title>${i}</title></rect>`;
    });
    legendInner += `<text x="${legendOffsetX + COLOR_SCALE.length * TOTAL_CELL + 4}" y="${CELL_SIZE - 1}" class="heatmap-label">More</text>`;

    containerEl.innerHTML = `
        <div class="activity-heatmap-body">
            <svg width="${LABEL_WIDTH}" height="${gridHeight}" viewBox="0 0 ${LABEL_WIDTH} ${gridHeight}" class="activity-heatmap-day-labels">
                ${dayLabelsHtml}
            </svg>
            <div class="activity-heatmap-scroll">
                <svg width="${gridWidth}" height="${gridHeight}" viewBox="0 0 ${gridWidth} ${gridHeight}" class="activity-heatmap-svg">
                    ${monthLabelsHtml}
                    ${rects}
                </svg>
            </div>
        </div>
        <div class="activity-heatmap-legend">
            <svg width="${legendWidth}" height="${legendHeight}" viewBox="0 0 ${legendWidth} ${legendHeight}" class="activity-heatmap-svg">
                ${legendInner}
            </svg>
        </div>`;

    // Scroll to the right (most recent) after layout
    const scrollEl = containerEl.querySelector('.activity-heatmap-scroll');
    if (scrollEl) {
        requestAnimationFrame(() => { scrollEl.scrollLeft = scrollEl.scrollWidth; });
    }
}

export function initializeActivityHeatmap() {
    const container = document.getElementById('activityHeatmap');
    if (!container) return;

    const update = () => renderActivityHeatmap(container);
    update();

    window.addEventListener('matches-updated', update);
    // No longer depends on season — but still re-render in case container needs refresh
    window.addEventListener('season-changed', update);
}
