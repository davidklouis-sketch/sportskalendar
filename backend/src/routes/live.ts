import { Router } from 'express';

export const liveRouter = Router();

type RankEntry = {
  position: number;
  name: string;
  meta?: string;
  points?: number;
  // F1 specifics
  lap?: number;
  totalLaps?: number;
  gapSec?: number; // gap to leader
  // Soccer specifics
  score?: string;
  minute?: number;
  league?: string;
  // NFL specifics
  quarter?: number;
  clock?: string; // mm:ss
};

let liveF1: RankEntry[] = [
  { position: 1, name: 'Max Verstappen', meta: 'Red Bull', lap: 42, totalLaps: 58, gapSec: 0 },
  { position: 2, name: 'Lando Norris', meta: 'McLaren', lap: 42, totalLaps: 58, gapSec: 1.2 },
  { position: 3, name: 'Charles Leclerc', meta: 'Ferrari', lap: 42, totalLaps: 58, gapSec: 2.7 },
  { position: 4, name: 'Oscar Piastri', meta: 'McLaren', lap: 42, totalLaps: 58, gapSec: 3.1 },
  { position: 5, name: 'Lewis Hamilton', meta: 'Mercedes', lap: 42, totalLaps: 58, gapSec: 4.0 },
  { position: 6, name: 'George Russell', meta: 'Mercedes', lap: 42, totalLaps: 58, gapSec: 5.4 },
  { position: 7, name: 'Carlos Sainz', meta: 'Ferrari', lap: 42, totalLaps: 58, gapSec: 6.2 },
  { position: 8, name: 'Sergio Pérez', meta: 'Red Bull', lap: 42, totalLaps: 58, gapSec: 7.7 },
  { position: 9, name: 'Fernando Alonso', meta: 'Aston Martin', lap: 42, totalLaps: 58, gapSec: 9.3 },
  { position: 10, name: 'Nico Hülkenberg', meta: 'Sauber', lap: 42, totalLaps: 58, gapSec: 11.0 },
];

let liveNFL: RankEntry[] = [
  { position: 1, name: 'Kansas City Chiefs', score: '21-17', quarter: 3, clock: '07:32' },
  { position: 2, name: 'San Francisco 49ers', score: '17-10', quarter: 2, clock: '02:11' },
  { position: 3, name: 'Buffalo Bills', score: '14-14', quarter: 3, clock: '10:04' },
  { position: 4, name: 'Baltimore Ravens', score: '10-7', quarter: 2, clock: '05:28' },
  { position: 5, name: 'Philadelphia Eagles', score: '3-0', quarter: 1, clock: '09:51' },
  { position: 6, name: 'Dallas Cowboys', score: '7-3', quarter: 2, clock: '11:20' },
  { position: 7, name: 'Miami Dolphins', score: '0-0', quarter: 1, clock: '12:34' },
  { position: 8, name: 'Detroit Lions', score: '10-14', quarter: 3, clock: '08:17' },
  { position: 9, name: 'Cincinnati Bengals', score: '6-3', quarter: 2, clock: '00:48' },
  { position: 10, name: 'Green Bay Packers', score: '13-17', quarter: 3, clock: '04:03' },
];

let liveSoccer: RankEntry[] = [
  { position: 1, name: 'Manchester City', league: 'Premier League', score: '2:1', minute: 68 },
  { position: 2, name: 'Real Madrid', league: 'La Liga', score: '1:0', minute: 73 },
  { position: 3, name: 'Bayern München', league: 'Bundesliga', score: '3:2', minute: 55 },
  { position: 4, name: 'Arsenal', league: 'Premier League', score: '0:0', minute: 38 },
  { position: 5, name: 'Barcelona', league: 'La Liga', score: '1:1', minute: 81 },
  { position: 6, name: 'PSG', league: 'Ligue 1', score: '4:1', minute: 90 },
  { position: 7, name: 'Liverpool', league: 'Premier League', score: '2:2', minute: 62 },
  { position: 8, name: 'Inter', league: 'Serie A', score: '0:1', minute: 70 },
  { position: 9, name: 'Juventus', league: 'Serie A', score: '1:2', minute: 77 },
  { position: 10, name: 'Atlético', league: 'La Liga', score: '0:0', minute: 44 },
];

function randomShuffleStep(list: RankEntry[]) {
  // simulate live movement by swapping adjacent entries sometimes
  const idx = Math.max(1, Math.floor(Math.random() * (list.length - 1))); // 1..n-1
  if (Math.random() < 0.5) {
    const prev = list[idx - 1];
    const curr = list[idx];
    if (prev && curr) {
      list[idx - 1] = curr;
      list[idx] = prev;
    }
  }
  list.forEach((e, i) => (e.position = i + 1));
}

setInterval(() => {
  randomShuffleStep(liveF1);
  randomShuffleStep(liveNFL);
  randomShuffleStep(liveSoccer);
  // simulate lap/minute/clock progression
  liveF1.forEach((e) => {
    if (typeof e.lap === 'number' && typeof e.totalLaps === 'number') {
      if (Math.random() < 0.3 && e.lap! < e.totalLaps!) e.lap = (e.lap || 0) + 1;
      if (typeof e.gapSec === 'number' && e.position > 1) e.gapSec = Math.max(0, (e.gapSec || 0) + (Math.random() * 0.6 - 0.3));
    }
  });
  liveSoccer.forEach((e) => {
    if (typeof e.minute === 'number' && e.minute < 90) e.minute += Math.random() < 0.5 ? 1 : 0;
  });
  liveNFL.forEach((e) => {
    if (typeof e.clock === 'string') {
      const parts = e.clock.split(':');
      const m = Number(parts?.[0] ?? 0);
      const s = Number(parts?.[1] ?? 0);
      let total = m * 60 + s - (Math.random() < 0.7 ? 5 : 0);
      if (total <= 0) { e.quarter = Math.min(4, (e.quarter || 1) + 1); total = 15 * 60; }
      const mm = Math.floor(total / 60).toString().padStart(2, '0');
      const ss = Math.floor(total % 60).toString().padStart(2, '0');
      e.clock = `${mm}:${ss}`;
    }
  });
}, 5000);

liveRouter.get('/f1', (_req, res) => {
  const entries = liveF1.map((e) => ({
    ...e,
    info: `Lap ${e.lap}/${e.totalLaps}${e.position > 1 && typeof e.gapSec === 'number' ? ` · +${e.gapSec.toFixed(1)}s` : ''}`,
  }));
  res.json({ entries });
});

liveRouter.get('/nfl', (_req, res) => {
  const entries = liveNFL.map((e) => ({
    ...e,
    info: `${e.score || ''}${e.quarter ? ` · Q${e.quarter}` : ''}${e.clock ? ` ${e.clock}` : ''}`.trim(),
  }));
  res.json({ entries });
});

liveRouter.get('/soccer', (_req, res) => {
  const entries = liveSoccer.map((e) => ({
    ...e,
    info: `${e.score || ''}${typeof e.minute === 'number' ? ` · ${e.minute}'` : ''}${e.league ? ` · ${e.league}` : ''}`.trim(),
  }));
  res.json({ entries });
});


