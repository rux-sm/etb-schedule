(function (global) {
  function createPicrossController(options) {
    const { dom, openModalA11y, closeModalA11y } = options || {};

    const PICROSS_PUZZLES =
      Array.isArray(global.PICROSS_PUZZLES) && global.PICROSS_PUZZLES.length
        ? global.PICROSS_PUZZLES
        : [];
    const PICROSS_PUZZLES_5X5 = PICROSS_PUZZLES.filter((puzzle) => {
      const rows = puzzle?.solution?.length || 0;
      const cols = puzzle?.solution?.[0]?.length || 0;
      const size = Number(puzzle?.size) || 0;
      return size === 5 || (rows === 5 && cols === 5);
    });
    const PICROSS_PUZZLES_10X10 = PICROSS_PUZZLES.filter((puzzle) => {
      const rows = puzzle?.solution?.length || 0;
      const cols = puzzle?.solution?.[0]?.length || 0;
      const size = Number(puzzle?.size) || 0;
      return size === 10 || (rows === 10 && cols === 10);
    });

    let picrossPlayerGrid = [];
    let picrossMarksGrid = [];
    let picrossPuzzleIndex = 0;
    let picrossMode = "daily";
    let picrossDailyStageSize = 5;
    let picrossRuleSet = "normal";
    let picrossStartTimeMs = 0;
    let picrossPenaltyMs = 0;
    let picrossMistakeCount = 0;
    let picrossHintsUsed = 0;
    let picrossDragActive = false;
    let picrossDragPointerId = null;
    let picrossDragAction = null;
    let picrossIgnoreClick = false;
    let picrossDragVisitedCells = new Set();
    let picrossTimerIntervalId = null;
    let picrossIsWon = false;

    const PICROSS_DAILY_STAGE_COMPLETED_KEY_PREFIX = "picross_daily_stage_completed_";
    const PICROSS_DAILY_RECORD_KEY_PREFIX = "picross_daily_record_";
    const PICROSS_NORMAL_PENALTY_SECONDS = [5, 10, 15];
    const PICROSS_HINT_PENALTY_SECONDS = 45;

    function getCurrentPicrossPuzzle() {
      return PICROSS_PUZZLES[picrossPuzzleIndex] || PICROSS_PUZZLES[0];
    }

    function getCurrentPicrossSolution() {
      const puzzle = getCurrentPicrossPuzzle();
      return puzzle ? puzzle.solution : [];
    }

    function getPicrossTodayKey() {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }

    function getPicrossDailyIndex(dateKey, puzzlePool) {
      if (!puzzlePool.length) return 0;
      let hash = 0;
      for (let i = 0; i < dateKey.length; i += 1) {
        hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
      }
      return hash % puzzlePool.length;
    }

    function getPicrossDailyPoolForSize(size) {
      if (size === 5) return PICROSS_PUZZLES_5X5;
      if (size === 10) return PICROSS_PUZZLES_10X10;
      return [];
    }

    function getPicrossDailyStageCompletionKey(size) {
      return `${PICROSS_DAILY_STAGE_COMPLETED_KEY_PREFIX}${getPicrossTodayKey()}_${size}`;
    }

    function getPicrossDailyRecordKey(dateKey, size) {
      return `${PICROSS_DAILY_RECORD_KEY_PREFIX}${dateKey}_${size}`;
    }

    function isPicrossDailyStageCompleted(size) {
      const key = getPicrossDailyStageCompletionKey(size);
      try {
        return localStorage.getItem(key) === "1";
      } catch {
        return false;
      }
    }

    function markPicrossDailyStageCompleted(size) {
      const key = getPicrossDailyStageCompletionKey(size);
      try {
        localStorage.setItem(key, "1");
      } catch {}
    }

    function readPicrossDailyRecord(dateKey, size) {
      try {
        const raw = localStorage.getItem(getPicrossDailyRecordKey(dateKey, size));
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    }

    function savePicrossDailyRecord(size, totalMs, grade) {
      const dateKey = getPicrossTodayKey();
      const key = getPicrossDailyRecordKey(dateKey, size);
      const nextRecord = {
        size,
        totalMs,
        grade,
        ruleSet: picrossRuleSet,
        hintsUsed: picrossHintsUsed,
      };

      try {
        const existing = readPicrossDailyRecord(dateKey, size);
        if (existing) return;
        localStorage.setItem(key, JSON.stringify(nextRecord));
      } catch {}
    }

    function setCurrentPuzzleById(puzzleId) {
      const idx = PICROSS_PUZZLES.findIndex((puzzle) => puzzle.id === puzzleId);
      if (idx >= 0) picrossPuzzleIndex = idx;
    }

    function selectDailyPuzzleForSize(size) {
      const pool = getPicrossDailyPoolForSize(size);
      if (!pool.length) {
        if (PICROSS_PUZZLES.length) picrossPuzzleIndex = 0;
        return;
      }

      const dateKey = `${getPicrossTodayKey()}-${size}`;
      const dailyIndex = getPicrossDailyIndex(dateKey, pool);
      const puzzle = pool[dailyIndex];
      if (!puzzle) return;
      setCurrentPuzzleById(puzzle.id);
    }

    function getPicrossCellSize(rows, cols) {
      const largestDimension = Math.max(rows, cols);
      if (largestDimension <= 5) return 34;
      if (largestDimension <= 10) return 28;
      return 24;
    }

    function formatPicrossTime(totalMs) {
      const totalSeconds = Math.max(0, Math.floor(totalMs / 1000));
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    function getPicrossElapsedMs() {
      if (!picrossStartTimeMs) return picrossPenaltyMs;
      return Math.max(0, Date.now() - picrossStartTimeMs) + picrossPenaltyMs;
    }

    function getPicrossGrade(totalMs) {
      const solution = getCurrentPicrossSolution();
      const size = Math.max(solution.length || 0, solution[0]?.length || 0);
      const totalSeconds = Math.floor(totalMs / 1000);
      let grade = "C";

      if (size <= 5) {
        if (totalSeconds <= 30) grade = "S";
        else if (totalSeconds <= 60) grade = "A";
        else if (totalSeconds <= 120) grade = "B";
      } else {
        if (totalSeconds <= 120) grade = "S";
        else if (totalSeconds <= 240) grade = "A";
        else if (totalSeconds <= 420) grade = "B";
      }

      if (picrossHintsUsed > 0 && (grade === "S" || grade === "A")) return "B";
      return grade;
    }

    function updatePicrossTimerDisplay() {
      const elapsedMs = getPicrossElapsedMs();
      if (dom.picrossTimer) {
        dom.picrossTimer.textContent = formatPicrossTime(elapsedMs);
      }
      if (dom.picrossGrade) {
        dom.picrossGrade.textContent = `Grade ${getPicrossGrade(elapsedMs)}`;
      }
    }

    function stopPicrossTimer() {
      if (picrossTimerIntervalId) {
        clearInterval(picrossTimerIntervalId);
        picrossTimerIntervalId = null;
      }
    }

    function startPicrossTimer() {
      stopPicrossTimer();
      picrossStartTimeMs = Date.now();
      updatePicrossTimerDisplay();
      picrossTimerIntervalId = window.setInterval(updatePicrossTimerDisplay, 1000);
    }

    function resetPicrossRunState() {
      picrossPenaltyMs = 0;
      picrossMistakeCount = 0;
      picrossHintsUsed = 0;
      updatePicrossTimerDisplay();
    }

    function syncPicrossRuleButtons() {
      dom.picrossNormalModeBtn?.classList.toggle("is-active", picrossRuleSet === "normal");
      dom.picrossFreeModeBtn?.classList.toggle("is-active", picrossRuleSet === "free");
    }

    function renderPicrossDailyProgress() {
      if (!dom.picrossDailyProgress) return;
      const isFiveComplete = isPicrossDailyStageCompleted(5);
      const isTenComplete = isPicrossDailyStageCompleted(10);
      const currentStage = picrossMode === "daily" ? picrossDailyStageSize : null;

      dom.picrossDailyProgress.innerHTML = [
        `<button type="button" data-stage="5" class="picross-progress-chip${isFiveComplete ? " is-complete" : ""}${currentStage === 5 ? " is-current" : ""}">5x5 ${isFiveComplete ? "Complete" : "Pending"}</button>`,
        `<button type="button" data-stage="10" ${!isFiveComplete ? "disabled" : ""} class="picross-progress-chip${isTenComplete ? " is-complete" : ""}${currentStage === 10 ? " is-current" : ""}">10x10 ${isTenComplete ? "Complete" : isFiveComplete ? "Unlocked" : "Locked"}</button>`,
      ].join("");
    }

    function renderPicrossTodaySummary() {
      if (!dom.picrossTodaySummary) return;

      const todayKey = getPicrossTodayKey();
      const record5 = readPicrossDailyRecord(todayKey, 5);
      const record10 = readPicrossDailyRecord(todayKey, 10);

      const summary5 = record5
        ? `5x5 ${record5.grade} ${formatPicrossTime(Number(record5.totalMs) || 0)}`
        : "5x5 --";
      const summary10 = record10
        ? `10x10 ${record10.grade} ${formatPicrossTime(Number(record10.totalMs) || 0)}`
        : "10x10 --";

      dom.picrossTodaySummary.textContent = `Today: ${summary5} | ${summary10}`;
    }

    function syncPicrossBoardSizing(rows, cols) {
      if (!dom.picrossGrid) return;
      const board = dom.picrossGrid.closest(".picross-board");
      if (!board) return;
      board.style.setProperty("--picross-cell-size", `${getPicrossCellSize(rows, cols)}px`);
    }

    function setPicrossPuzzleMeta() {
      if (!dom.picrossPuzzleMeta) return;
      const puzzle = getCurrentPicrossPuzzle();
      if (!puzzle) {
        dom.picrossPuzzleMeta.textContent = "";
        return;
      }
      if (picrossMode === "daily") {
        dom.picrossPuzzleMeta.textContent = `Daily ${getPicrossTodayKey()} - ${picrossDailyStageSize}x${picrossDailyStageSize} - ${puzzle.name}`;
        return;
      }
      dom.picrossPuzzleMeta.textContent = `Free Play ${picrossPuzzleIndex + 1}/${PICROSS_PUZZLES.length}: ${puzzle.name}`;
    }

    function getPicrossPenaltySecondsForMistake() {
      const penaltyIndex = Math.min(picrossMistakeCount, PICROSS_NORMAL_PENALTY_SECONDS.length - 1);
      return PICROSS_NORMAL_PENALTY_SECONDS[penaltyIndex];
    }

    function showPicrossMistake(target) {
      if (!(target instanceof HTMLElement)) return;
      target.classList.add("is-mistake");
      window.setTimeout(() => target.classList.remove("is-mistake"), 220);
    }

    function getPicrossCellCoords(target) {
      if (!(target instanceof HTMLElement)) return null;
      const r = Number(target.dataset.row);
      const c = Number(target.dataset.col);
      if (!Number.isFinite(r) || !Number.isFinite(c)) return null;
      return { r, c };
    }

    function getPicrossCellKey(r, c) {
      return `${r}:${c}`;
    }

    function stopPicrossDrag() {
      picrossDragActive = false;
      picrossDragPointerId = null;
      picrossDragAction = null;
      picrossDragVisitedCells.clear();
    }

    function getPicrossCellElementFromPoint(clientX, clientY) {
      const pointTarget = document.elementFromPoint(clientX, clientY);
      if (!(pointTarget instanceof HTMLElement)) return null;
      return pointTarget.closest(".picross-cell");
    }

    function getPicrossCellElement(row, col) {
      if (!dom.picrossGrid) return null;
      return dom.picrossGrid.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    function applyPicrossNormalMistake(target) {
      const penaltySeconds = getPicrossPenaltySecondsForMistake();
      picrossMistakeCount += 1;
      picrossPenaltyMs += penaltySeconds * 1000;
      updatePicrossTimerDisplay();
      showPicrossMistake(target);
      updatePicrossStatus(`Mistake. +${penaltySeconds}s penalty.`, false);
    }

    function applyPicrossCellAction(target, action) {
      if (picrossIsWon) return false;
      const coords = getPicrossCellCoords(target);
      if (!coords) return false;

      const { r, c } = coords;
      const solution = getCurrentPicrossSolution();
      if (!solution[r] || typeof solution[r][c] !== "number") return false;

      if (action === "fill") {
        if (picrossPlayerGrid[r][c] === 1) return false;
        if (picrossRuleSet === "normal" && solution[r][c] !== 1) {
          applyPicrossNormalMistake(target);
          return false;
        }

        picrossPlayerGrid[r][c] = 1;
        picrossMarksGrid[r][c] = 0;
      } else if (action === "erase") {
        if (picrossPlayerGrid[r][c] === 0) return false;
        picrossPlayerGrid[r][c] = 0;
      } else {
        return false;
      }

      target.classList.toggle("is-filled", picrossPlayerGrid[r][c] === 1);
      target.classList.toggle("is-marked", picrossMarksGrid[r][c] === 1);
      target.textContent = picrossMarksGrid[r][c] === 1 ? "X" : "";

      updatePicrossClueCompletion();

      if (checkPicrossWin()) {
        finalizePicrossSolve();
        return true;
      }

      updatePicrossStatus("", false);
      return true;
    }

    function togglePicrossMark(target) {
      if (picrossIsWon) return false;
      const coords = getPicrossCellCoords(target);
      if (!coords) return false;

      const { r, c } = coords;
      if (picrossPlayerGrid[r][c] === 1) {
        picrossPlayerGrid[r][c] = 0;
      }

      picrossMarksGrid[r][c] = picrossMarksGrid[r][c] ? 0 : 1;
      target.classList.toggle("is-filled", picrossPlayerGrid[r][c] === 1);
      target.classList.toggle("is-marked", picrossMarksGrid[r][c] === 1);
      target.textContent = picrossMarksGrid[r][c] === 1 ? "X" : "";
      updatePicrossClueCompletion();
      updatePicrossStatus("", false);

      if (checkPicrossWin()) {
        finalizePicrossSolve();
        return true;
      }

      return true;
    }

    function markPicrossKeyboardHandled(target) {
      if (!(target instanceof HTMLElement)) return;
      target.dataset.keyboardHandled = "1";
      window.setTimeout(() => {
        if (target.dataset.keyboardHandled === "1") {
          delete target.dataset.keyboardHandled;
        }
      }, 0);
    }

    function handlePicrossCellKeyDown(event) {
      const target = event.currentTarget;
      if (!(target instanceof HTMLElement)) return;

      const coords = getPicrossCellCoords(target);
      if (!coords) return;

      const solution = getCurrentPicrossSolution();
      const maxRow = Math.max(0, solution.length - 1);
      const maxCol = Math.max(0, (solution[0]?.length || 1) - 1);
      let nextRow = coords.r;
      let nextCol = coords.c;

      if (event.key === "ArrowUp") nextRow = Math.max(0, coords.r - 1);
      else if (event.key === "ArrowDown") nextRow = Math.min(maxRow, coords.r + 1);
      else if (event.key === "ArrowLeft") nextCol = Math.max(0, coords.c - 1);
      else if (event.key === "ArrowRight") nextCol = Math.min(maxCol, coords.c + 1);
      else if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        markPicrossKeyboardHandled(target);
        const action = picrossPlayerGrid[coords.r][coords.c] === 1 ? "erase" : "fill";
        applyPicrossCellAction(target, action);
        return;
      } else if (event.key.toLowerCase() === "x") {
        event.preventDefault();
        togglePicrossMark(target);
        return;
      } else {
        return;
      }

      event.preventDefault();
      const nextCell = getPicrossCellElement(nextRow, nextCol);
      if (nextCell instanceof HTMLElement) nextCell.focus();
    }

    function handlePicrossCellKeyUp(event) {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
      }
    }

    function makePicrossGrid(solution, fillValue) {
      return Array.from({ length: solution.length }, () =>
        Array.from({ length: solution[0].length }, () => fillValue),
      );
    }

    function picrossLineClues(line) {
      const clues = [];
      let run = 0;

      line.forEach((cell) => {
        if (cell === 1) {
          run += 1;
          return;
        }
        if (run > 0) {
          clues.push(run);
          run = 0;
        }
      });

      if (run > 0) clues.push(run);
      return clues.length ? clues : [0];
    }

    function renderPicrossClues() {
      if (!dom.picrossCluesTop || !dom.picrossCluesLeft) return;

      const solution = getCurrentPicrossSolution();
      if (!solution.length || !solution[0] || !solution[0].length) return;

      const rows = solution.length;
      const cols = solution[0].length;

      dom.picrossCluesTop.style.gridTemplateColumns = `repeat(${cols}, var(--picross-cell-size))`;
      dom.picrossCluesLeft.style.gridTemplateRows = `repeat(${rows}, var(--picross-cell-size))`;

      dom.picrossCluesTop.innerHTML = "";
      for (let c = 0; c < cols; c += 1) {
        const col = solution.map((row) => row[c]);
        const clue = document.createElement("div");
        clue.className = "picross-clue";
        clue.textContent = picrossLineClues(col).join("\n");
        clue.style.whiteSpace = "pre-line";
        dom.picrossCluesTop.appendChild(clue);
      }

      dom.picrossCluesLeft.innerHTML = "";
      for (let r = 0; r < rows; r += 1) {
        const clue = document.createElement("div");
        clue.className = "picross-clue";
        clue.textContent = picrossLineClues(solution[r]).join(" ");
        dom.picrossCluesLeft.appendChild(clue);
      }
    }

    function updatePicrossStatus(message, isWin) {
      if (!dom.picrossStatus) return;
      dom.picrossStatus.textContent = message;
      dom.picrossStatus.classList.toggle("is-win", !!isWin);
    }

    function checkPicrossWin() {
      const solution = getCurrentPicrossSolution();
      for (let r = 0; r < solution.length; r += 1) {
        for (let c = 0; c < solution[r].length; c += 1) {
          if (picrossPlayerGrid[r][c] !== solution[r][c]) return false;
        }
      }
      return true;
    }

    function isPicrossLineSolved(lineA, lineB) {
      if (!lineA || !lineB || lineA.length !== lineB.length) return false;
      for (let i = 0; i < lineA.length; i += 1) {
        if (lineA[i] !== lineB[i]) return false;
      }
      return true;
    }

    function updatePicrossClueCompletion() {
      const solution = getCurrentPicrossSolution();
      if (!solution.length || !solution[0] || !solution[0].length) return;

      const rowClues = dom.picrossCluesLeft?.children || [];
      const colClues = dom.picrossCluesTop?.children || [];

      for (let r = 0; r < solution.length; r += 1) {
        const isSolved = isPicrossLineSolved(picrossPlayerGrid[r], solution[r]);
        rowClues[r]?.classList.toggle("is-complete", isSolved);
      }

      for (let c = 0; c < solution[0].length; c += 1) {
        const playerCol = picrossPlayerGrid.map((row) => row[c]);
        const solutionCol = solution.map((row) => row[c]);
        const isSolved = isPicrossLineSolved(playerCol, solutionCol);
        colClues[c]?.classList.toggle("is-complete", isSolved);
      }
    }

    function syncPicrossGridFromState() {
      const cells = dom.picrossGrid?.children || [];
      for (let i = 0; i < cells.length; i += 1) {
        const cell = cells[i];
        if (!(cell instanceof HTMLElement)) continue;
        const r = Number(cell.dataset.row);
        const c = Number(cell.dataset.col);
        const isFilled = picrossPlayerGrid[r]?.[c] === 1;
        const isMarked = picrossMarksGrid[r]?.[c] === 1;
        cell.classList.toggle("is-filled", isFilled);
        cell.classList.toggle("is-marked", isMarked);
        cell.textContent = isMarked ? "X" : "";
      }
    }

    function loadDailyStage(size) {
      picrossDailyStageSize = size;
      selectDailyPuzzleForSize(picrossDailyStageSize);
      if (dom.picrossNextStageBtn) dom.picrossNextStageBtn.hidden = true;
      initGame();
    }

    function finalizePicrossSolve() {
      stopPicrossTimer();
      picrossIsWon = true;
      const totalMs = getPicrossElapsedMs();
      const finalTime = formatPicrossTime(totalMs);
      const finalGrade = getPicrossGrade(totalMs);

      if (picrossMode === "daily") {
        markPicrossDailyStageCompleted(picrossDailyStageSize);
        savePicrossDailyRecord(picrossDailyStageSize, totalMs, finalGrade);
        renderPicrossDailyProgress();
        renderPicrossTodaySummary();

        if (picrossDailyStageSize === 5) {
          updatePicrossStatus(
            `5x5 solved in ${finalTime}. Grade ${finalGrade}.`,
            true,
          );
          if (dom.picrossNextStageBtn) dom.picrossNextStageBtn.hidden = false;
          return;
        }

        updatePicrossStatus(
          `Daily 10x10 solved in ${finalTime}. Grade ${finalGrade}. Replay anytime.`,
          true,
        );
        return;
      }

      updatePicrossStatus(`Puzzle solved in ${finalTime}. Grade ${finalGrade}.`, true);
    }

    function revealPicrossRow(rowIndex, solution) {
      for (let c = 0; c < solution[rowIndex].length; c += 1) {
        picrossPlayerGrid[rowIndex][c] = solution[rowIndex][c];
        picrossMarksGrid[rowIndex][c] = 0;
      }
    }

    function revealPicrossColumn(colIndex, solution) {
      for (let r = 0; r < solution.length; r += 1) {
        picrossPlayerGrid[r][colIndex] = solution[r][colIndex];
        picrossMarksGrid[r][colIndex] = 0;
      }
    }

    function getRandomPicrossItem(values) {
      if (!values.length) return null;
      const idx = Math.floor(Math.random() * values.length);
      return values[idx];
    }

    function applyPicrossHint() {
      const solution = getCurrentPicrossSolution();
      if (!solution.length || !solution[0] || !solution[0].length) return;

      const unsolvedRows = solution
        .map((row, index) => ({ row, index }))
        .filter(({ row, index }) => !isPicrossLineSolved(picrossPlayerGrid[index], row))
        .map(({ index }) => index);
      const unsolvedCols = solution[0]
        .map((_, index) => index)
        .filter((index) => {
          const playerCol = picrossPlayerGrid.map((row) => row[index]);
          const solutionCol = solution.map((row) => row[index]);
          return !isPicrossLineSolved(playerCol, solutionCol);
        });

      if (!unsolvedRows.length && !unsolvedCols.length) {
        updatePicrossStatus(
          "No hint available. Puzzle is already complete or fully revealed.",
          false,
        );
        return;
      }

      picrossHintsUsed += 1;
      picrossPenaltyMs += PICROSS_HINT_PENALTY_SECONDS * 1000;
      updatePicrossTimerDisplay();

      const rowIndex = getRandomPicrossItem(unsolvedRows);
      const colIndex = getRandomPicrossItem(unsolvedCols);

      if (rowIndex !== null) revealPicrossRow(rowIndex, solution);
      if (colIndex !== null) revealPicrossColumn(colIndex, solution);

      syncPicrossGridFromState();
      updatePicrossClueCompletion();

      const rowText = rowIndex !== null ? `row ${rowIndex + 1}` : "";
      const colText = colIndex !== null ? `column ${colIndex + 1}` : "";
      const joinText = rowText && colText ? " and " : "";
      updatePicrossStatus(
        `Hint used. +${PICROSS_HINT_PENALTY_SECONDS}s penalty. Revealed ${rowText}${joinText}${colText}.`,
        false,
      );

      if (checkPicrossWin()) {
        finalizePicrossSolve();
      }
    }

    function handlePicrossCellPointerDown(event) {
      if (!event.isPrimary || event.button !== 0) return;
      const target = event.currentTarget;
      if (!(target instanceof HTMLElement)) return;

      const coords = getPicrossCellCoords(target);
      if (!coords) return;

      event.preventDefault();
      picrossIgnoreClick = true;
      picrossDragActive = true;
      picrossDragPointerId = event.pointerId;
      picrossDragAction = picrossPlayerGrid[coords.r][coords.c] === 1 ? "erase" : "fill";
      picrossDragVisitedCells = new Set([getPicrossCellKey(coords.r, coords.c)]);
      target.setPointerCapture?.(event.pointerId);
      applyPicrossCellAction(target, picrossDragAction);
    }

    function handlePicrossPointerMove(event) {
      if (!picrossDragActive || picrossDragAction === null) return;
      if (!event.isPrimary || event.pointerId !== picrossDragPointerId) return;
      if ((event.buttons & 1) !== 1 && event.pointerType !== "touch") {
        stopPicrossDrag();
        return;
      }

      const target = getPicrossCellElementFromPoint(event.clientX, event.clientY);
      if (!(target instanceof HTMLElement)) return;

      const coords = getPicrossCellCoords(target);
      if (!coords) return;

      const cellKey = getPicrossCellKey(coords.r, coords.c);
      if (picrossDragVisitedCells.has(cellKey)) return;
      picrossDragVisitedCells.add(cellKey);
      applyPicrossCellAction(target, picrossDragAction);
    }

    function handlePicrossPointerEnd(event) {
      if (!picrossDragActive) return;
      if (event.isPrimary && event.pointerId === picrossDragPointerId) {
        stopPicrossDrag();
      }
    }

    function handlePicrossCellClick(event) {
      if (picrossIgnoreClick) {
        picrossIgnoreClick = false;
        return;
      }

      const target = event.currentTarget;
      if (!(target instanceof HTMLElement)) return;
      if (target.dataset.keyboardHandled === "1") {
        delete target.dataset.keyboardHandled;
        return;
      }
      const coords = getPicrossCellCoords(target);
      if (!coords) return;

      const action = picrossPlayerGrid[coords.r][coords.c] === 1 ? "erase" : "fill";
      applyPicrossCellAction(target, action);
    }

    function handlePicrossCellMark(event) {
      event.preventDefault();
      const target = event.currentTarget;
      if (!(target instanceof HTMLElement)) return;
      togglePicrossMark(target);
    }

    function renderPicrossGrid() {
      if (!dom.picrossGrid) return;

      const solution = getCurrentPicrossSolution();
      if (!solution.length || !solution[0] || !solution[0].length) return;

      const rows = solution.length;
      const cols = solution[0].length;

      syncPicrossBoardSizing(rows, cols);
      dom.picrossGrid.style.gridTemplateColumns = `repeat(${cols}, var(--picross-cell-size))`;
      dom.picrossGrid.style.gridTemplateRows = `repeat(${rows}, var(--picross-cell-size))`;
      dom.picrossGrid.innerHTML = "";

      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          const cell = document.createElement("button");
          cell.type = "button";
          cell.className = "picross-cell";
          cell.dataset.row = String(r);
          cell.dataset.col = String(c);
          cell.setAttribute("role", "gridcell");
          cell.setAttribute("aria-label", `Row ${r + 1}, Column ${c + 1}`);
          cell.addEventListener("pointerdown", handlePicrossCellPointerDown);
          cell.addEventListener("keydown", handlePicrossCellKeyDown);
          cell.addEventListener("keyup", handlePicrossCellKeyUp);
          cell.addEventListener("click", handlePicrossCellClick);
          cell.addEventListener("contextmenu", handlePicrossCellMark);
          dom.picrossGrid.appendChild(cell);
        }
      }
    }

    function initGame() {
      const solution = getCurrentPicrossSolution();
      if (!solution.length || !solution[0] || !solution[0].length) return;

      stopPicrossTimer();
      stopPicrossDrag();
      picrossIsWon = false;
      picrossPlayerGrid = makePicrossGrid(solution, 0);
      picrossMarksGrid = makePicrossGrid(solution, 0);
      resetPicrossRunState();
      syncPicrossRuleButtons();
      setPicrossPuzzleMeta();
      renderPicrossDailyProgress();
      renderPicrossTodaySummary();
      renderPicrossClues();
      renderPicrossGrid();
      updatePicrossClueCompletion();
      startPicrossTimer();

      if (picrossMode === "daily") {
        if (isPicrossDailyStageCompleted(picrossDailyStageSize)) {
          if (picrossDailyStageSize === 10) {
            updatePicrossStatus("Already solved today's 10x10. Replay anytime.", true);
            return;
          }

          updatePicrossStatus("Already solved today's 5x5. Daily 10x10 unlocked.", true);
          return;
        }

        if (picrossDailyStageSize === 5) {
          updatePicrossStatus("Solve today's 5x5 to unlock the daily 10x10.", false);
          return;
        }

        updatePicrossStatus("Daily 10x10 unlocked. Good luck.", false);
        return;
      }

      updatePicrossStatus("", false);
    }

    function nextPuzzle() {
      picrossMode = "free-play";
      picrossPuzzleIndex = (picrossPuzzleIndex + 1) % PICROSS_PUZZLES.length;
      initGame();
    }

    function setRuleSet(ruleSet) {
      picrossRuleSet = ruleSet === "free" ? "free" : "normal";
      syncPicrossRuleButtons();
      initGame();
    }

    function openDailyPuzzle() {
      picrossMode = "daily";
      picrossDailyStageSize = isPicrossDailyStageCompleted(5) ? 10 : 5;
      selectDailyPuzzleForSize(picrossDailyStageSize);
      initGame();
    }

    function openModal() {
      openDailyPuzzle();
      openModalA11y(dom.picrossModal, dom.picrossResetBtn);
    }

    function closeModal() {
      stopPicrossTimer();
      stopPicrossDrag();
      closeModalA11y(dom.picrossModal);
    }

    document.addEventListener("pointermove", handlePicrossPointerMove);
    document.addEventListener("pointerup", handlePicrossPointerEnd);
    document.addEventListener("pointercancel", handlePicrossPointerEnd);
    dom.picrossHintBtn?.addEventListener("click", applyPicrossHint);
    dom.picrossNormalModeBtn?.addEventListener("click", () => setRuleSet("normal"));
    dom.picrossFreeModeBtn?.addEventListener("click", () => setRuleSet("free"));

    dom.picrossNextStageBtn?.addEventListener("click", () => {
      loadDailyStage(10);
    });

    dom.picrossDailyProgress?.addEventListener("click", (event) => {
      const btn = event.target.closest("button[data-stage]");
      if (!btn || btn.disabled) return;
      const size = Number(btn.dataset.stage);
      if (size && size !== picrossDailyStageSize) {
        loadDailyStage(size);
      }
    });

    return {
      initGame,
      nextPuzzle,
      openDailyPuzzle,
      openModal,
      closeModal,
    };
  }

  global.createPicrossController = createPicrossController;
})(window);
