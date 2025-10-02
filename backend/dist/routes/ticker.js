"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tickerRouter = void 0;
const express_1 = require("express");
exports.tickerRouter = (0, express_1.Router)();
// SSE stream that aggregates from our Highlights API (F1/NFL) and Scores API
exports.tickerRouter.get('/stream', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();
    const base = `${req.protocol}://${req.get('host')}`;
    const sentIds = new Set();
    let windowStart = Date.now();
    const send = (event) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
    };
    async function fetchHighlights(sport) {
        try {
            const r = await fetch(`${base}/api/highlights?sport=${sport}`);
            const data = await r.json();
            const items = (Array.isArray(data) ? data : data.items);
            for (const it of items.slice(0, 5)) {
                const id = `${sport}:${it.id || it.title}`;
                if (sentIds.has(id))
                    continue;
                sentIds.add(id);
                let source = null;
                try {
                    const host = new URL(it.url).hostname;
                    if (/youtube\.com|youtu\.be/.test(host))
                        source = 'YouTube';
                    else
                        source = host;
                }
                catch {
                    source = null;
                }
                send({ type: 'highlight', message: `${sport}: ${it.title}`, ts: Date.now(), url: it.url ?? null, source });
            }
        }
        catch {
            // ignore
        }
    }
    async function fetchScores() {
        try {
            const r = await fetch(`${base}/api/scores`);
            const data = await r.json();
            const lines = [];
            if (data?.F1?.length) {
                const f1 = data.F1[0];
                lines.push(`F1 ${f1.event}: P${f1.position} – Lap ${f1.lap}/${f1.totalLaps}`);
            }
            if (data?.NFL?.length) {
                const nfl = data.NFL[0];
                lines.push(`NFL ${nfl.event}: ${nfl.score} – Q${nfl.quarter} ${nfl.time}`);
            }
            if (data?.Fußball?.length) {
                const fb = data['Fußball'][0];
                lines.push(`Fußball ${fb.event}: ${fb.score} – ${fb.minute}'`);
            }
            for (const m of lines) {
                const id = `score:${m}`;
                if (sentIds.has(id))
                    continue;
                sentIds.add(id);
                send({ type: 'score', message: m, ts: Date.now(), source: 'Live' });
            }
        }
        catch {
            // ignore
        }
    }
    const pump = async () => {
        await Promise.all([fetchHighlights('F1'), fetchHighlights('NFL'), fetchScores()]);
        // Refresh the collection window every 2 minutes: allow items erneut zu kommen
        if (Date.now() - windowStart >= 120000) {
            sentIds.clear();
            windowStart = Date.now();
        }
        else if (sentIds.size > 500) {
            // safety: cap memory within window
            const cut = Array.from(sentIds).slice(-250);
            sentIds.clear();
            for (const id of cut)
                sentIds.add(id);
        }
    };
    // initial
    pump();
    const interval = setInterval(pump, 7000);
    const heartbeat = setInterval(() => {
        try {
            res.write(`: keep-alive\n\n`);
        }
        catch { }
    }, 15000);
    req.on('close', () => {
        clearInterval(interval);
        clearInterval(heartbeat);
        res.end();
    });
});
//# sourceMappingURL=ticker.js.map