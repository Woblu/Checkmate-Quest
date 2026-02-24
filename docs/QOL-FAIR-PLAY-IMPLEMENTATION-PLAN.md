# QoL & Fair Play Implementation Plan

This document lists **every file to create or modify** for the Quality of Life and Fair Play feature suite. Use it as a checklist; implementation order is suggested at the end.

---

## 1. Anti-Cheat & Fair Play

### 1.1 Reports table (Prisma)

| Action | File | Notes |
|--------|------|--------|
| **Modify** | `prisma/schema.prisma` | Add `Report` model: `id`, `reporterId`, `targetId`, `gameId`, `reason` (String), `status` (enum PENDING/RESOLVED), `createdAt`. Add relations on `User` (reporter, target) and optional `Game`. Run `npx prisma migrate dev` after. |

### 1.2 Report API (Clerk-protected)

| Action | File | Notes |
|--------|------|--------|
| **Create** | `app/api/reports/route.ts` | POST: Clerk `auth()`, validate body (targetId, gameId, reason), create Report with status PENDING. Return 201 or 4xx. |

### 1.3 Tab-out tracker (online play client)

| Action | File | Notes |
|--------|------|--------|
| **Modify** | `app/play/[gameId]/PlayGameClient.tsx` | Add `visibilitychange` listener; count tab switches per “move window” (reset on `move_made`). If count > 3 during one turn, call a new API (e.g. POST `/api/games/[gameId]/flag`) or emit a socket event (e.g. `flag_for_review`). Prefer lightweight API so server can store a flag on the game or in a small “game_flags” store. |

### 1.4 Server-side move validation (already partially there)

| Action | File | Notes |
|--------|------|--------|
| **Modify** | `lib/socket-handler.js` | In `make_move` handler you already do `gs.chess.move({ from, to, promotion })` and reject if `!move`. Add explicit validation: ensure `from`/`to` are valid squares (e.g. regex /^[a-h][1-8]$/), optional `promotion` in `['q','r','b','n']`, and that the move is legal (chess.js already enforces this). Optionally log invalid attempts. No new file. |

### 1.5 Game flag API (for tab-out)

| Action | File | Notes |
|--------|------|--------|
| **Create** | `app/api/games/[gameId]/flag/route.ts` | POST: Clerk `auth()`, verify user is in the game, then either (a) write a “flagged for review” flag to DB (e.g. new `Game.flaggedForReview` boolean or a small `game_flags` table) or (b) create a Report with a synthetic reason like "Tab-out suspicion". Keep it simple; one of the two is enough. |

---

## 2. Board UX (CustomBoard)

| Action | File | Notes |
|--------|------|--------|
| **Modify** | `components/CustomBoard.tsx` | (1) **Coordinates**: Add optional prop `showCoordinates?: boolean` (default true). Render a-h below and 1-8 left (or right for black) using the board’s square size; use `customBoardStyle` or wrapper divs. react-chessboard may expose board dimensions or you pass `boardWidth`/`squareWidth`. (2) **Last move**: Add optional `lastMove?: { from: string; to: string }`. Use `customSquareStyles` (or equivalent) to set a distinct background for `lastMove.from` and `lastMove.to`. (3) **Two-click**: Add optional `onSquareClick?: (square: string) => void`. If provided, enable click-to-select then click-to-move; combine with existing `onPieceDrop` so both drag-and-drop and two-click work. May need internal state for `selectedSquare` and to call parent’s move handler on second click if move is legal. |

---

## 3. Advanced Analysis Sandbox (Review page)

### 3.1 Sandbox mode + what-if analysis

| Action | File | Notes |
|--------|------|--------|
| **Modify** | `app/play/review/[gameId]/ReviewClient.tsx` | Add “Sandbox Mode” toggle. When on: (1) Allow making moves on the board that update local state only (a `sandboxFen` or local Chess instance), not `currentPly` / saved history. (2) When sandbox FEN changes, call Stockfish (reuse or add a hook that takes FEN and returns evaluation) and update the eval bar. (3) Fetch ECO/opening name for current position (see 3.2). When toggle off, reset board to `displayFen` from the real game. |

### 3.2 ECO / Opening name for current position

| Action | File | Notes |
|--------|------|--------|
| **Create** | `app/api/openings/lookup/route.ts` | GET with query `fen` (or `uciMoves`). Use Prisma to find Opening + MoveNodes that match the position (e.g. build FEN from move tree or match FEN prefix). Return `{ ecoCode, name }` or null. Clerk auth optional for read-only. |
| **Modify** | `app/play/review/[gameId]/ReviewClient.tsx` | In sandbox (and optionally in normal mode), call lookup API with current FEN and display opening name in the sidebar. |

### 3.3 Stockfish for arbitrary FEN in review

| Action | File | Notes |
|--------|------|--------|
| **Modify** | `hooks/useStockfish.ts` | Ensure it can accept a FEN string and return evaluation for that position (not only for a move list). If it already does “analyze position”, use that; otherwise add a method like `getEvaluationForFen(fen)`. |
| **Modify** | `app/play/review/[gameId]/ReviewClient.tsx` | In sandbox mode, pass current sandbox FEN to Stockfish and show eval in the existing eval bar. |

---

## 4. Retention & Social (Daily Quests + Export)

### 4.1 Daily Quest schema and seed

| Action | File | Notes |
|--------|------|--------|
| **Modify** | `prisma/schema.prisma` | Add `DailyQuest` model: `id`, `title`, `goal` (String, e.g. "win_1_game", "solve_3_puzzles", "play_10_moves"), `rewardAmount` (Int). Add `UserDailyQuestProgress` (or reuse/extend `UserQuestProgress`): `userId`, `dailyQuestId`, `progress` (Int), `completed` (Boolean), `date` (Date, for “which day”). Relation: User has many progress; DailyQuest has many progress. Alternatively, keep using existing `Quest` and add a `type: DAILY` and a `goal` field if you prefer. |
| **Create** | `scripts/seed-daily-quests.ts` (optional) | Seed 3 daily quest definitions: Win 1 Game, Solve 3 Puzzles, Play 10 Moves. Run once or on deploy. |

### 4.2 Daily Quest logic and API

| Action | File | Notes |
|--------|------|--------|
| **Create** | `lib/daily-quests.ts` | Pure logic: given a user id and an event type (`game_won`, `puzzle_solved`, `moves_played` with count), update progress for today’s daily quests (fetch today’s quests, update or create UserDailyQuestProgress, award pawns if goal reached). |
| **Create** | `app/api/quests/daily/route.ts` | GET: Clerk `auth()`, return today’s daily quests and current user progress. |
| **Modify** | `lib/ranking.ts` or game result flow | After a game ends (win/loss/draw), call daily-quest progress update for “win 1 game” and “play N moves”. |
| **Modify** | Puzzle solve flow | Wherever you award pawns for a solved puzzle, also call daily-quest update for “solve 3 puzzles”. |
| **Modify** | Online + Bot move flow | When a move is made, increment “play 10 moves” (e.g. in socket-handler and in PlayBotClient result submission). |

### 4.3 Export PGN / FEN

| Action | File | Notes |
|--------|------|--------|
| **Modify** | `components/VictoryModal.tsx` | Add “Export PGN” and “Export FEN” buttons. PGN: build from game result (you may need to pass `moves` as SAN or UCI and convert; or pass a PGN string from parent). FEN: pass final FEN from parent. Buttons copy to clipboard or download a file; keep Tailwind theme. |
| **Modify** | `app/play/review/[gameId]/ReviewClient.tsx` | In the sidebar, add “Export PGN” and “Export FEN” (current position or full game). Build PGN from `uciMoves` + result; FEN = `displayFen`. Same UX as VictoryModal (copy or download). |

---

## 5. Chess Rules (3-fold & 50-move)

### 5.1 Server (online)

| Action | File | Notes |
|--------|------|--------|
| **Modify** | `lib/socket-handler.js` | You already call `gs.chess.isDraw()` after each move, which in chess.js includes 3-fold repetition and 50-move rule. Ensure you don’t short-circuit before that. Add a `claim_draw` event: on receipt, check `gs.chess.isDraw()` (or a dedicated check for 3-fold/50-move if you want to distinguish); if true, call `endGame(io, gameId, 'DRAW', 'claim')`. |

### 5.2 Client (online) – claim draw button

| Action | File | Notes |
|--------|------|--------|
| **Modify** | `app/play/[gameId]/PlayGameClient.tsx` | Add a “Claim draw” (or “Draw”) button in the game UI. On click, emit `claim_draw`. Optionally show a tooltip that it applies to 3-fold repetition or 50-move rule. |

### 5.3 Bot games

| Action | File | Notes |
|--------|------|--------|
| **Modify** | `app/play/bot/PlayBotClient.tsx` | After each move, check `game.isDraw()` (including 3-fold and 50-move). If true, end game as draw and show VictoryModal. Add a “Claim draw” button that checks the same and ends the game if applicable. |

---

## 6. PWA – Cache Stockfish worker

| Action | File | Notes |
|--------|------|--------|
| **Modify** | `next.config.js` | In `withPWA` / `workboxOptions`, add `runtimeCaching` or `additionalManifestEntries` so that `stockfish.js`, `stockfish.wasm`, and any worker entry (e.g. `swe-worker-*.js`) are cached. Exact config depends on `@ducanh2912/next-pwa`; often you add a rule for `/stockfish*` and `/swe-worker*` with CacheFirst or StaleWhileRevalidate so bot/puzzle work offline. |

---

## Summary: New files

| File | Purpose |
|------|--------|
| `app/api/reports/route.ts` | POST report (Clerk) |
| `app/api/games/[gameId]/flag/route.ts` | POST flag game for review (tab-out) |
| `app/api/openings/lookup/route.ts` | GET opening by FEN |
| `app/api/quests/daily/route.ts` | GET daily quests + progress |
| `lib/daily-quests.ts` | Daily quest progress logic |
| `scripts/seed-daily-quests.ts` | (Optional) seed daily quest definitions |

---

## Summary: Modified files

| File | Changes |
|------|--------|
| `prisma/schema.prisma` | Report model; DailyQuest + UserDailyQuestProgress (or extend Quest) |
| `lib/socket-handler.js` | Stricter move validation; claim_draw; ensure isDraw() covers 3-fold/50-move |
| `app/play/[gameId]/PlayGameClient.tsx` | Tab-out tracker; claim draw button |
| `components/CustomBoard.tsx` | Coordinates toggle; last-move highlight; two-click input |
| `app/play/review/[gameId]/ReviewClient.tsx` | Sandbox mode; eval for sandbox FEN; ECO display; Export PGN/FEN in sidebar |
| `hooks/useStockfish.ts` | Support getEvaluationForFen (if not already) |
| `components/VictoryModal.tsx` | Export PGN / FEN buttons |
| `app/play/bot/PlayBotClient.tsx` | 3-fold/50-move draw detection; claim draw button |
| `lib/ranking.ts` (or game end flow) | Call daily-quest update on game end |
| Puzzle solve flow | Call daily-quest update on puzzle solve |
| `next.config.js` | Cache Stockfish + worker in PWA |

---

## Suggested implementation order

1. **Prisma**: Report, DailyQuest, UserDailyQuestProgress (or extend Quest) → migrate.
2. **Board UX**: CustomBoard (coordinates, last move, two-click).
3. **Chess rules**: socket-handler (claim_draw, validation); PlayGameClient claim button; PlayBotClient draw detection + claim.
4. **Anti-cheat**: Reports API; game flag API; tab-out in PlayGameClient; socket move validation polish.
5. **Review sandbox**: useStockfish FEN support; ReviewClient sandbox toggle + eval + ECO lookup API + sidebar export.
6. **VictoryModal**: Export PGN/FEN.
7. **Daily quests**: lib/daily-quests.ts; GET daily API; wire into game end, puzzle solve, move count.
8. **PWA**: next.config.js cache Stockfish and worker.

This keeps schema and shared UI first, then game logic, then APIs and integrations.
