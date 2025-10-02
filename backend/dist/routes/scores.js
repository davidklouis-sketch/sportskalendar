"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoresRouter = void 0;
const express_1 = require("express");
exports.scoresRouter = (0, express_1.Router)();
// Simple in-memory mock of live scores by sport
const mockScores = {
    F1: [{ event: 'Grand Prix X', position: 1, driver: 'Max Verstappen', lap: 42, totalLaps: 58 }],
    NFL: [{ event: 'Team A vs Team B', score: '21-17', quarter: 3, time: '07:32' }],
    Fußball: [{ event: 'FC Muster vs SV Beispiel', score: '2:1', minute: 68 }],
};
exports.scoresRouter.get('/', (_req, res) => {
    res.json(mockScores);
});
exports.scoresRouter.get('/:sport', (req, res) => {
    const sport = req.params.sport;
    const data = mockScores[sport];
    if (!data)
        return res.status(404).json({ error: 'Unknown sport' });
    res.json(data);
});
//# sourceMappingURL=scores.js.map