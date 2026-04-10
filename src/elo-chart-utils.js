/**
 * Utility functions for enhanced ELO chart rendering.
 * Computes moving averages (SMA + EMA), Bollinger bands, day boundaries,
 * trend segments, and opponent strength overlays.
 */

/**
 * Compute Simple Moving Average over an array of numbers.
 * Returns an array of the same length (first `window-1` entries are null).
 */
export function computeSMA(values, window) {
    const result = new Array(values.length).fill(null);
    for (let i = window - 1; i < values.length; i++) {
        let sum = 0;
        for (let j = i - window + 1; j <= i; j++) sum += values[j];
        result[i] = sum / window;
    }
    return result;
}

/**
 * Compute Exponential Moving Average.
 * Unlike SMA, EMA reacts faster to recent changes and doesn't lag as much.
 * The first value seeds the EMA; all subsequent values are valid (no nulls).
 *
 * @param {number[]} values
 * @param {number} span - Number of periods (similar to SMA window). Higher = smoother.
 * @returns {number[]} Same length, all entries are numbers.
 */
export function computeEMA(values, span) {
    if (values.length === 0) return [];
    const k = 2 / (span + 1); // smoothing factor
    const result = [values[0]];
    for (let i = 1; i < values.length; i++) {
        result.push(values[i] * k + result[i - 1] * (1 - k));
    }
    return result;
}

/**
 * Compute rolling standard deviation over a window.
 * Returns an array of the same length (first `window-1` entries are null).
 */
export function computeRollingStdDev(values, window) {
    const result = new Array(values.length).fill(null);
    for (let i = window - 1; i < values.length; i++) {
        let sum = 0;
        for (let j = i - window + 1; j <= i; j++) sum += values[j];
        const mean = sum / window;
        let sqSum = 0;
        for (let j = i - window + 1; j <= i; j++) sqSum += (values[j] - mean) ** 2;
        result[i] = Math.sqrt(sqSum / window);
    }
    return result;
}

/**
 * Compute Bollinger Bands: { upper, lower } arrays.
 * Accepts EMA values (no nulls) or SMA values (with nulls).
 * @param {number[]} ma - Moving average values
 * @param {number[]} stddev - Rolling stddev values (may contain nulls)
 * @param {number} multiplier - Band width multiplier (default 2)
 */
export function computeBollingerBands(ma, stddev, multiplier = 2) {
    const upper = [];
    const lower = [];
    for (let i = 0; i < ma.length; i++) {
        if (ma[i] == null || stddev[i] == null) {
            upper.push(null);
            lower.push(null);
        } else {
            upper.push(ma[i] + multiplier * stddev[i]);
            lower.push(ma[i] - multiplier * stddev[i]);
        }
    }
    return { upper, lower };
}

/**
 * Find indices where the calendar day changes between consecutive data points.
 * Returns an array of indices (the first point of each new day).
 */
export function findDayBoundaries(timestamps) {
    const boundaries = [];
    for (let i = 1; i < timestamps.length; i++) {
        const prevDay = new Date(timestamps[i - 1]).toDateString();
        const currDay = new Date(timestamps[i]).toDateString();
        if (prevDay !== currDay) {
            boundaries.push(i);
        }
    }
    return boundaries;
}

/**
 * Build Chart.js annotation objects for day-boundary vertical lines (no labels).
 */
export function buildDayBoundaryAnnotations(boundaries) {
    const annotations = {};
    boundaries.forEach((idx, i) => {
        annotations[`dayLine${i}`] = {
            type: 'line',
            xMin: idx,
            xMax: idx,
            borderColor: 'rgba(255, 255, 255, 0.10)',
            borderWidth: 1,
            borderDash: [4, 4],
        };
    });
    return annotations;
}

/**
 * Detect trend segments using EMA crossover (MACD-style).
 *
 * A fast EMA and slow EMA are computed on the values. When fast > slow the
 * trend is "up"; when fast < slow the trend is "down". Contiguous same-direction
 * runs are merged into segments and short/flat ones discarded. This approach
 * produces longer, more meaningful trends than per-point sliding-window slope
 * classification, and the direction is inherently consistent with the visual.
 *
 * @param {number[]} values - ELO values
 * @param {number} fastSpan - Fast EMA span (default 6)
 * @param {number} slowSpan - Slow EMA span (default 14)
 * @param {number} minLength - Minimum segment length to keep (default 5)
 * @returns {Array<{startIdx: number, endIdx: number, direction: 'up'|'down', slope: number}>}
 */
export function detectTrends(values, fastSpan = 6, slowSpan = 14, minLength = 5) {
    if (values.length < slowSpan + 2) return [];

    const fast = computeEMA(values, fastSpan);
    const slow = computeEMA(values, slowSpan);

    // Build segments of contiguous same-direction runs
    const segments = [];
    let segStart = 0;
    let segDir = fast[0] >= slow[0] ? 'up' : 'down';

    for (let i = 1; i < values.length; i++) {
        const dir = fast[i] >= slow[i] ? 'up' : 'down';
        if (dir !== segDir) {
            if (i - segStart >= minLength) {
                segments.push({ startIdx: segStart, endIdx: i - 1, direction: segDir, slope: 0 });
            }
            segStart = i;
            segDir = dir;
        }
    }
    // Close last segment
    if (values.length - segStart >= minLength) {
        segments.push({ startIdx: segStart, endIdx: values.length - 1, direction: segDir, slope: 0 });
    }

    // Discard segments where the net ELO movement is negligible
    return segments.filter(s => {
        const totalChange = Math.abs(values[s.endIdx] - values[s.startIdx]);
        const len = s.endIdx - s.startIdx;
        return len > 0 && totalChange / len >= 0.15;
    });
}

/**
 * Build Chart.js box annotations to highlight trend regions.
 */
export function buildTrendAnnotations(trends) {
    const annotations = {};
    trends.forEach((trend, i) => {
        annotations[`trend${i}`] = {
            type: 'box',
            xMin: trend.startIdx,
            xMax: trend.endIdx,
            backgroundColor: trend.direction === 'up'
                ? 'rgba(76, 175, 80, 0.06)'
                : 'rgba(244, 67, 54, 0.06)',
            borderWidth: 0,
        };
    });
    return annotations;
}

/**
 * Build a single merged trend-line dataset from multiple trend segments.
 * Creates line segments with gaps (null) between non-contiguous trends.
 *
 * Returns { data, directions } where:
 *   data: array suitable for Chart.js (same length as values)
 *   directions: parallel array of 'up'|'down'|null per index
 *
 * The trend direction is corrected from the actual regression slope so that
 * annotation box colours and trend-line segment colours can never disagree.
 */
export function buildTrendLineData(values, trends) {
    const data = new Array(values.length).fill(null);
    const directions = new Array(values.length).fill(null);

    for (let ti = 0; ti < trends.length; ti++) {
        const trend = trends[ti];
        const n = trend.endIdx - trend.startIdx + 1;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (let i = 0; i < n; i++) {
            const x = trend.startIdx + i;
            const y = values[x];
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumX2 += x * x;
        }
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Correct the direction from the actual regression slope
        trend.direction = slope >= 0 ? 'up' : 'down';

        // If previous trend is adjacent, insert null gap to prevent Chart.js
        // from drawing a connecting segment across trend boundaries.
        if (ti > 0) {
            const prev = trends[ti - 1];
            if (prev.endIdx >= trend.startIdx - 1) {
                data[trend.startIdx] = null;
                directions[trend.startIdx] = null;
            }
        }

        const startFill = (ti > 0 && trends[ti - 1].endIdx >= trend.startIdx - 1)
            ? trend.startIdx + 1 : trend.startIdx;
        for (let i = startFill; i <= trend.endIdx; i++) {
            data[i] = slope * i + intercept;
            directions[i] = trend.direction;
        }
    }
    return { data, directions };
}

/**
 * Aggregate per-match trajectory into daily "candle" data for candlestick-style rendering.
 * Each candle has: { date, dateStr, open, close, high, low, gain }.
 * `open` = ELO at start of day (before first match), `close` = ELO after last match.
 *
 * @param {Array<{elo: number, timestamp: number}>} trajectory - Full trajectory data
 * @returns {Array<{date: Date, dateStr: string, open: number, close: number, high: number, low: number, gain: boolean}>}
 */
export function aggregateDailyCandles(trajectory) {
    if (!trajectory || trajectory.length === 0) return [];

    const dayMap = new Map(); // dateStr -> { points: [...] }
    for (const pt of trajectory) {
        const d = new Date(pt.timestamp);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!dayMap.has(key)) dayMap.set(key, []);
        dayMap.get(key).push(pt);
    }

    const candles = [];
    let prevClose = null;
    for (const [dateStr, points] of dayMap) {
        const elos = points.map(p => p.elo);
        const open = prevClose !== null ? prevClose : elos[0];
        const close = elos[elos.length - 1];
        const allElos = [open, ...elos];
        const high = Math.max(...allElos);
        const low = Math.min(...allElos);
        candles.push({
            date: new Date(points[0].timestamp),
            dateStr,
            open,
            close,
            high,
            low,
            gain: close >= open,
        });
        prevClose = close;
    }
    return candles;
}

/**
 * Given daily candles, compute an EMA on close values.
 * Returns array of same length as candles.
 */
export function candleCloseEMA(candles, span) {
    return computeEMA(candles.map(c => c.close), span);
}

/**
 * Detect trends on daily candle close values.
 * Re-uses detectTrends (EMA crossover) with appropriate defaults for daily granularity.
 */
export function detectCandleTrends(candles, fastSpan, slowSpan, minLength) {
    const closes = candles.map(c => c.close);
    return detectTrends(closes, fastSpan, slowSpan, minLength);
}

/**
 * Compute Bollinger bands on daily candle close values.
 */
export function candleBollingerBands(candles, span, multiplier = 1.5) {
    const closes = candles.map(c => c.close);
    const ema = computeEMA(closes, span);
    const stddev = computeRollingStdDev(closes, Math.max(2, span));
    return computeBollingerBands(ema, stddev, multiplier);
}
