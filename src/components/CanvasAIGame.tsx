import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Play, Trophy, Users } from 'lucide-react';

interface CanvasAIGameProps {
  onBackToSetup: () => void;
}

export const CanvasAIGame: React.FC<CanvasAIGameProps> = ({ onBackToSetup }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState({
    board: [] as number[][],
    gameActive: false,
    currentPlayer: 1,
    status: "Click 'Play' to start",
    scores: {
      human: 0,
      computer: 0,
      draws: 0
    }
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const statusDiv = statusRef.current;
    if (!canvas || !statusDiv) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Adjust canvas size for responsiveness
    const updateCanvasSize = () => {
      const maxWidth = Math.min(window.innerWidth * 0.9, 518); // 90% of viewport width, max 518px
      const cellSize = Math.floor(maxWidth / 7); // 7 columns
      canvas.width = cellSize * 7;
      canvas.height = cellSize * 6;
      return cellSize;
    };

    let cellSize = updateCanvasSize();

    // Handle window resize
    const handleResize = () => {
      cellSize = updateCanvasSize();
      drawBoard();
    };
    window.addEventListener('resize', handleResize);

    const rows = 6;
    const cols = 7;
    let board: number[][] = [];
    let gameActive = false;
    let currentPlayer = 1;
    let zobristKeys: number[][][] = [];
    const transpositionTable = new Map();
    let killerMoves: { [key: number]: number } = {};
    let historyTable: { [key: number]: number } = {};
    let lastDroppedDisc: { row: number; col: number; player: number } | null = null;
    let winningPositions: { row: number; col: number }[] = [];
    let jumpOffset = 0;
    let jumpDirection = 1;
    const jumpHeight = Math.min(15, cellSize * 0.2); // Scale jump height
    const jumpSpeed = 0.8;
    let scores = { human: 0, computer: 0, draws: 0 };
    let winCelebration: { winner: 'human' | 'computer' | null; startTime: number } | null = null;
    const celebrationDuration = 3000; // Celebration duration in ms
    const shakeAmplitude = Math.min(5, cellSize * 0.05); // Shake amplitude

    // Particle system for fireworks
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      alpha: number;
      size: number;
      life: number;
    }

    let particles: Particle[] = [];

    function createFirework() {
      const count = 20; // Number of particles per firework
      const centerX = Math.random() * canvas.width;
      const centerY = Math.random() * canvas.height * 0.5; // Upper half for visibility
      const colors = ['#ff0000', '#00ff00', '#ffff00', '#00ffff', '#ff00ff', '#ffffff'];
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const speed = Math.random() * 3 + 2; // Random speed between 2 and 5
        particles.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          size: Math.random() * 3 + 2, // Size between 2 and 5
          life: 1000 // Life in ms
        });
      }
    }

    function updateParticles() {
      particles = particles.filter(p => p.alpha > 0);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02; // Gravity effect
        p.alpha -= 0.01; // Fade out
        p.size = Math.max(0, p.size - 0.02); // Shrink slightly
      });
    }

    function drawParticles() {
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      });
      ctx.globalAlpha = 1; // Reset alpha
    }

    function initZobrist() {
      zobristKeys = [];
      for (let row = 0; row < rows; row++) {
        zobristKeys[row] = [];
        for (let col = 0; col < cols; col++) {
          zobristKeys[row][col] = [
            Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
            Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
            Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
          ];
        }
      }
    }

    function computeZobristHash(tempBoard: number[][]) {
      let hash = 0;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (tempBoard[row][col] !== 0) {
            hash ^= zobristKeys[row][col][tempBoard[row][col]];
          }
        }
      }
      return hash;
    }

    function initBoard() {
      board = Array(rows).fill(null).map(() => Array(cols).fill(0));
      transpositionTable.clear();
      killerMoves = {};
      historyTable = {};
      lastDroppedDisc = null;
      winningPositions = [];
      jumpOffset = 0;
      jumpDirection = 1;
      particles = [];
      winCelebration = null;
      currentPlayer = 1;
      initZobrist();
      setGameState({
        board: board.map(row => [...row]),
        gameActive: false,
        currentPlayer: 1,
        status: "Click 'Play' to start",
        scores
      });
    }

    function drawBoard() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'blue';
      ctx.fillRect(0, 0, cols * cellSize, rows * cellSize);
      
      // Draw board discs
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          ctx.beginPath();
          let offsetX = 0, offsetY = 0;
          
          // Apply shaking animation to last dropped disc if game is active
          if (lastDroppedDisc && lastDroppedDisc.row === row && lastDroppedDisc.col === col && gameActive) {
            const shakeSpeed = 0.2; // Speed of shaking
            offsetX = shakeAmplitude * Math.sin(performance.now() * shakeSpeed); // Horizontal shake
          }
          
          // Apply winning animation if applicable
          const isWinning = winningPositions.some(pos => pos.row === row && pos.col === col);
          if (isWinning && !gameActive) {
            offsetY += jumpOffset;
          }
          
          ctx.arc(
            col * cellSize + cellSize / 2 + offsetX, 
            row * cellSize + cellSize / 2 + offsetY, 
            cellSize / 2 - Math.min(4, cellSize * 0.05), 
            0, 
            2 * Math.PI
          );
          
          ctx.fillStyle = board[row][col] === 0 ? 'white' : board[row][col] === 1 ? 'red' : 'yellow';
          ctx.fill();
        }
      }
      
      // Handle winning animation and fireworks
      if (winningPositions.length > 0 && !gameActive && winCelebration) {
        jumpOffset += jumpDirection * jumpSpeed;
        if (jumpOffset >= jumpHeight) jumpDirection = -1;
        if (jumpOffset <= -jumpHeight) jumpDirection = 1;

        // Update and draw fireworks
        if (Math.random() < 0.1) createFirework(); // Randomly spawn fireworks
        updateParticles();
        drawParticles();

        // Draw win message
        const elapsed = performance.now() - winCelebration.startTime;
        if (elapsed < celebrationDuration) {
          ctx.font = `bold ${clamp(24, 5, 36)}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'white';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = 10;
          const scale = 1 + 0.1 * Math.sin((elapsed / celebrationDuration) * Math.PI * 2);
          ctx.save();
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.scale(scale, scale);
          ctx.fillText(
            winCelebration.winner === 'human' ? 'You Win!' : 'Computer Wins!',
            0,
            0
          );
          ctx.restore();
          ctx.shadowBlur = 0;
        } else {
          winCelebration = null; // End celebration
        }
      }

      // Clamp function for responsive font size
      function clamp(min: number, vw: number, max: number) {
        return Math.min(Math.max(min, (vw * canvas.width) / 100), max);
      }
    }

    function isValidMove(col: number) {
      return board[0][col] === 0;
    }

    function dropDisc(col: number, player: number) {
      for (let row = rows - 1; row >= 0; row--) {
        if (board[row][col] === 0) {
          board[row][col] = player;
          lastDroppedDisc = { row, col, player }; // Update last dropped disc
          return { success: true, row };
        }
      }
      return { success: false, row: -1 };
    }

    function checkWin(player: number, tempBoard = board) {
      const positions: { row: number; col: number }[] = [];
      
      // Horizontal
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col <= cols - 4; col++) {
          if ([0, 1, 2, 3].every(i => tempBoard[row][col + i] === player)) {
            for (let i = 0; i < 4; i++) positions.push({ row, col: col + i });
            return { won: true, positions };
          }
        }
      }
      
      // Vertical
      for (let col = 0; col < cols; col++) {
        for (let row = 0; row <= rows - 4; row++) {
          if ([0, 1, 2, 3].every(i => tempBoard[row + i][col] === player)) {
            for (let i = 0; i < 4; i++) positions.push({ row: row + i, col });
            return { won: true, positions };
          }
        }
      }
      
      // Diagonal (positive slope)
      for (let row = 0; row <= rows - 4; row++) {
        for (let col = 0; col <= cols - 4; col++) {
          if ([0, 1, 2, 3].every(i => tempBoard[row + i][col + i] === player)) {
            for (let i = 0; i < 4; i++) positions.push({ row: row + i, col: col + i });
            return { won: true, positions };
          }
        }
      }
      
      // Diagonal (negative slope)
      for (let row = 3; row < rows; row++) {
        for (let col = 0; col <= cols - 4; col++) {
          if ([0, 1, 2, 3].every(i => tempBoard[row - i][col + i] === player)) {
            for (let i = 0; i < 4; i++) positions.push({ row: row - i, col: col + i });
            return { won: true, positions };
          }
        }
      }
      
      return { won: false, positions: [] };
    }

    function checkThreeInRow(player: number, tempBoard: number[][]) {
      let threats: number[] = [];
      
      // Horizontal threats
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col <= cols - 4; col++) {
          let count = 0, emptyCol = -1;
          for (let i = 0; i < 4; i++) {
            if (tempBoard[row][col + i] === player) count++;
            else if (tempBoard[row][col + i] === 0) emptyCol = col + i;
          }
          if (count === 3 && emptyCol !== -1 && (row === rows - 1 || tempBoard[row + 1][emptyCol] !== 0)) {
            threats.push(emptyCol);
          }
        }
      }
      
      // Vertical threats
      for (let col = 0; col < cols; col++) {
        for (let row = 0; row <= rows - 4; row++) {
          let count = 0, emptyRow = -1;
          for (let i = 0; i < 4; i++) {
            if (tempBoard[row + i][col] === player) count++;
            else if (tempBoard[row + i][col] === 0) emptyRow = row + i;
          }
          if (count === 3 && emptyRow !== -1) threats.push(col);
        }
      }
      
      // Diagonal threats (positive slope)
      for (let row = 0; row <= rows - 4; row++) {
        for (let col = 0; col <= cols - 4; col++) {
          let count = 0, emptyCol = -1, emptyRow = -1;
          for (let i = 0; i < 4; i++) {
            if (tempBoard[row + i][col + i] === player) count++;
            else if (tempBoard[row + i][col + i] === 0) {
              emptyRow = row + i;
              emptyCol = col + i;
            }
          }
          if (count === 3 && emptyCol !== -1 && (emptyRow === rows - 1 || tempBoard[emptyRow + 1][emptyCol] !== 0)) {
            threats.push(emptyCol);
          }
        }
      }
      
      // Diagonal threats (negative slope)
      for (let row = 3; row < rows; row++) {
        for (let col = 0; col <= cols - 4; col++) {
          let count = 0, emptyCol = -1, emptyRow = -1;
          for (let i = 0; i < 4; i++) {
            if (tempBoard[row - i][col + i] === player) count++;
            else if (tempBoard[row - i][col + i] === 0) {
              emptyRow = row - i;
              emptyCol = col + i;
            }
          }
          if (count === 3 && emptyCol !== -1 && (emptyRow === rows - 1 || tempBoard[emptyRow + 1][emptyCol] !== 0)) {
            threats.push(emptyCol);
          }
        }
      }
      
      return threats;
    }

    function isBoardFull() {
      return board[0].every(cell => cell !== 0);
    }

    function simulateMove(tempBoard: number[][], col: number, player: number) {
      let newBoard = tempBoard.map(row => [...row]);
      for (let row = rows - 1; row >= 0; row--) {
        if (newBoard[row][col] === 0) {
          newBoard[row][col] = player;
          break;
        }
      }
      return newBoard;
    }

    function getValidColumns() {
      let valid: number[] = [];
      for (let col = 0; col < cols; col++) {
        if (isValidMove(col)) valid.push(col);
      }
      return valid;
    }

    function evaluateBoard(tempBoard: number[][]) {
      if (checkWin(2, tempBoard).won) return Infinity;
      if (checkWin(1, tempBoard).won) return -Infinity;
      
      let score = 0;
      
      for (let col = 0; col < cols; col++) {
        for (let row = rows - 1; row >= 0; row--) {
          if (tempBoard[row][col] !== 0) {
            if (tempBoard[row][col] === 2) {
              score += (col === 3 ? 100 : 50);
              score += (row % 2 === 1 ? 50 : 0);
            } else if (tempBoard[row][col] === 1) {
              score -= (col === 3 ? 100 : 50);
              score -= (row % 2 === 1 ? 50 : 0);
            }
            break;
          }
        }
      }
      
      const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
      let aiThreats = 0, humanThreats = 0;
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          for (let [dr, dc] of directions) {
            let aiCount = 0, humanCount = 0, emptyCount = 0, openEnds = 0, lineValid = true;
            
            for (let i = -1; i <= 4; i++) {
              const r = row + i * dr, c = col + i * dc;
              if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
              
              if (i === -1 || i === 4) {
                if (r >= 0 && r < rows && c >= 0 && c < cols && tempBoard[r][c] === 0) openEnds++;
                continue;
              }
              
              if (r < 0 || r >= rows || c < 0 || c >= cols) {
                lineValid = false;
                break;
              }
              
              if (tempBoard[r][c] === 2) aiCount++;
              else if (tempBoard[r][c] === 1) humanCount++;
              else emptyCount++;
            }
            
            if (!lineValid) continue;
            
            if (aiCount >= 2 && emptyCount >= 1 && openEnds > 0) aiThreats++;
            if (humanCount >= 2 && emptyCount >= 1 && openEnds > 0) humanThreats++;
            
            if (aiCount === 3 && emptyCount === 1 && openEnds > 0) score += 1000;
            if (humanCount === 3 && emptyCount === 1 && openEnds > 0) score -= 10000;
            if (aiCount === 2 && emptyCount === 2 && openEnds === 2) score += 200;
            if (humanCount === 2 && emptyCount === 2 && openEnds === 2) score -= 200;
            if (aiCount === 1 && emptyCount === 3 && openEnds === 2) score += 50;
            if (humanCount === 1 && emptyCount === 3 && openEnds === 2) score -= 50;
          }
        }
      }
      
      if (aiThreats >= 2) score += 5000;
      if (humanThreats >= 2) score -= 5000;
      
      return score;
    }

    function minimax(tempBoard: number[][], depth: number, isMaximizing: boolean, alpha: number, beta: number, currentDepth: number): number {
      const hash = computeZobristHash(tempBoard);
      
      if (transpositionTable.has(hash)) {
        const entry = transpositionTable.get(hash);
        if (entry.depth >= depth) return entry.score;
      }
      
      if (checkWin(2, tempBoard).won) return Infinity - currentDepth;
      if (checkWin(1, tempBoard).won) return -Infinity + currentDepth;
      if (getValidColumns().length === 0) return 0;
      
      if (depth === 0) {
        const score = evaluateBoard(tempBoard);
        transpositionTable.set(hash, { score, depth });
        return score;
      }
      
      if (isMaximizing) {
        let maxEval = -Infinity;
        for (let col of getValidColumns()) {
          let newBoard = simulateMove(tempBoard, col, 2);
          let evaluation = minimax(newBoard, depth - 1, false, alpha, beta, currentDepth + 1);
          if (evaluation > maxEval) {
            maxEval = evaluation;
            if (currentDepth === 0) {
              killerMoves[currentDepth] = col;
              historyTable[col] = (historyTable[col] || 0) + depth * depth;
            }
          }
          alpha = Math.max(alpha, evaluation);
          if (beta <= alpha) break;
        }
        transpositionTable.set(hash, { score: maxEval, depth });
        return maxEval;
      } else {
        let minEval = Infinity;
        for (let col of getValidColumns()) {
          let newBoard = simulateMove(tempBoard, col, 1);
          let evaluation = minimax(newBoard, depth - 1, true, alpha, beta, currentDepth + 1);
          if (evaluation < minEval) {
            minEval = evaluation;
            if (currentDepth === 0) {
              killerMoves[currentDepth] = col;
              historyTable[col] = (historyTable[col] || 0) + depth * depth;
            }
          }
          beta = Math.min(beta, evaluation);
          if (beta <= alpha) break;
        }
        transpositionTable.set(hash, { score: minEval, depth });
        return minEval;
      }
    }

    async function playAIMove() {
      if (!gameActive || currentPlayer !== 2) return;

      statusDiv.textContent = "Computer Thinking...";
      setGameState(prev => ({ ...prev, status: "Computer Thinking..." }));

      const validMoves = getValidColumns();
      if (validMoves.length === 0) {
        statusDiv.textContent = "It's a Draw! (No moves left)";
        setGameState(prev => ({ ...prev, status: "It's a Draw! (No moves left)", gameActive: false }));
        gameActive = false;
        scores.draws++;
        setGameState(prev => ({ ...prev, scores: { ...scores } }));
        return;
      }

      let bestMove: number | null = null;
      let bestScore = -Infinity;
      const startTime = performance.now();
      const maxTime = 1500;
      let depth = 1;

      // Edge case: Player stacking adjacent columns
      const discCount = board.flat().filter(cell => cell !== 0).length;
      if (discCount === 3 && board[5][2] === 1 && board[4][3] === 2 && board[5][3] === 1) {
        if (isValidMove(1)) bestMove = 1;
        else if (isValidMove(4)) bestMove = 4;
        else bestMove = validMoves[0];
      }

      // Check human threats (handle multiple threats)
      if (!bestMove) {
        const humanThreats = checkThreeInRow(1, board);
        if (humanThreats.length > 0) {
          for (let col of humanThreats) {
            if (isValidMove(col)) {
              const tempBoard = simulateMove(board, col, 2);
              const humanWinAfterBlock = checkWin(1, tempBoard).won;
              if (!humanWinAfterBlock) {
                bestMove = col;
                break;
              }
            }
          }
          if (!bestMove && humanThreats.length >= 2) {
            for (let col of validMoves) {
              const tempBoard = simulateMove(board, col, 2);
              if (!checkWin(1, tempBoard).won) {
                bestMove = col;
                break;
              }
            }
          }
        }
      }

      if (!bestMove) {
        await new Promise<void>(resolve => {
          const search = setInterval(() => {
            let currentBestMove: number | null = null;
            let currentBestScore = -Infinity;

            const sortedMoves = validMoves.sort((a, b) => {
              const scoreA = (historyTable[a] || 0) + (a === 3 ? 100 : 0);
              const scoreB = (historyTable[b] || 0) + (b === 3 ? 100 : 0);
              return scoreB - scoreA;
            });

            for (let col of sortedMoves) {
              let tempBoard = simulateMove(board, col, 2);
              let score = minimax(tempBoard, depth, false, -Infinity, Infinity, 1);
              if (score > currentBestScore) {
                currentBestScore = score;
                currentBestMove = col;
              }
            }

            if (currentBestScore > bestScore) {
              bestScore = currentBestScore;
              bestMove = currentBestMove;
            }

            depth++;

            if (performance.now() - startTime > maxTime || depth > 12 || bestScore === Infinity) {
              clearInterval(search);
              resolve();
            }
          }, 100);
        });
      }

      if (bestMove === null) {
        bestMove = validMoves[0];
      }

      if (bestMove !== null && isValidMove(bestMove)) {
        const result = dropDisc(bestMove, 2);
        if (result.success) {
          drawBoard();

          const winCheck = checkWin(2);
          if (winCheck.won) {
            winningPositions = winCheck.positions;
            scores.computer++;
            winCelebration = { winner: 'computer', startTime: performance.now() };
            statusDiv.textContent = "Computer Wins!";
            setGameState(prev => ({ ...prev, status: "Computer Wins!", gameActive: false, scores: { ...scores } }));
            gameActive = false;
            lastDroppedDisc = null; // Stop shaking on game end
          } else {
            const humanWinCheck = checkWin(1);
            if (humanWinCheck.won) {
              winningPositions = humanWinCheck.positions;
              scores.human++;
              winCelebration = { winner: 'human', startTime: performance.now() };
              statusDiv.textContent = "You Win!";
              setGameState(prev => ({ ...prev, status: "You Win!", gameActive: false, scores: { ...scores } }));
              gameActive = false;
              lastDroppedDisc = null; // Stop shaking on game end
            } else if (isBoardFull()) {
              scores.draws++;
              statusDiv.textContent = "It's a Draw!";
              setGameState(prev => ({ ...prev, status: "It's a Draw!", gameActive: false, scores: { ...scores } }));
              gameActive = false;
              lastDroppedDisc = null; // Stop shaking on game end
            } else {
              statusDiv.textContent = "Your Turn";
              setGameState(prev => ({ ...prev, status: "Your Turn", currentPlayer: 1 }));
              currentPlayer = 1;
            }
          }
        }
      }
    }

    function handleHumanMove(event: MouseEvent | TouchEvent) {
      if (!gameActive || currentPlayer !== 1) return;

      let clientX: number;
      if (event instanceof MouseEvent) {
        clientX = event.clientX;
      } else {
        event.preventDefault();
        clientX = event.touches[0].clientX;
      }

      const rect = canvas.getBoundingClientRect();
      const col = Math.floor((clientX - rect.left) / cellSize);
      
      if (isValidMove(col)) {
        const result = dropDisc(col, 1);
        if (result.success) {
          drawBoard();
          
          const winCheck = checkWin(1);
          if (winCheck.won) {
            winningPositions = winCheck.positions;
            scores.human++;
            winCelebration = { winner: 'human', startTime: performance.now() };
            statusDiv.textContent = "You Win!";
            setGameState(prev => ({ ...prev, status: "You Win!", gameActive: false, scores: { ...scores } }));
            gameActive = false;
            lastDroppedDisc = null; // Stop shaking on game end
          } else {
            const aiWinCheck = checkWin(2);
            if (aiWinCheck.won) {
              winningPositions = aiWinCheck.positions;
              scores.computer++;
              winCelebration = { winner: 'computer', startTime: performance.now() };
              statusDiv.textContent = "Computer Wins!";
              setGameState(prev => ({ ...prev, status: "Computer Wins!", gameActive: false, scores: { ...scores } }));
              gameActive = false;
              lastDroppedDisc = null; // Stop shaking on game end
            } else if (isBoardFull()) {
              scores.draws++;
              statusDiv.textContent = "It's a Draw!";
              setGameState(prev => ({ ...prev, status: "It's a Draw!", gameActive: false, scores: { ...scores } }));
              gameActive = false;
              lastDroppedDisc = null; // Stop shaking on game end
            } else {
              statusDiv.textContent = "Computer Thinking...";
              setGameState(prev => ({ ...prev, status: "Computer Thinking...", currentPlayer: 2 }));
              currentPlayer = 2;
              setTimeout(playAIMove, 0);
            }
          }
        }
      }
    }

    function startGame() {
      initBoard();
      drawBoard();
      gameActive = true;
      statusDiv.textContent = "Your Turn";
      setGameState(prev => ({ ...prev, status: "Your Turn", gameActive: true, currentPlayer: 1, scores }));
      currentPlayer = 1;
      canvas.onclick = handleHumanMove;
      canvas.ontouchstart = handleHumanMove;
    }

    function resetBoard() {
      initBoard();
      drawBoard();
      gameActive = true;
      statusDiv.textContent = "Your Turn";
      setGameState(prev => ({ ...prev, status: "Your Turn", gameActive: true, currentPlayer: 1, scores }));
      currentPlayer = 1;
      canvas.onclick = handleHumanMove;
      canvas.ontouchstart = handleHumanMove;
    }

    function newGame() {
      scores = { human: 0, computer: 0, draws: 0 };
      initBoard();
      drawBoard();
      gameActive = false;
      statusDiv.textContent = "Click 'Play' to start";
      setGameState(prev => ({ ...prev, status: "Click 'Play' to start", gameActive: false, currentPlayer: 1, scores }));
      currentPlayer = 1;
      canvas.onclick = null;
      canvas.ontouchstart = null;
    }

    // Initialize
    initBoard();
    drawBoard();
    
    // Animation loop
    const animationInterval = setInterval(drawBoard, 50);

    // Expose functions to window
    (window as any).startCanvasGame = startGame;
    (window as any).resetCanvasBoard = resetBoard;
    (window as any).newCanvasGame = newGame;

    return () => {
      clearInterval(animationInterval);
      canvas.onclick = null;
      canvas.ontouchstart = null;
      window.removeEventListener('resize', handleResize);
      delete (window as any).startCanvasGame;
      delete (window as any).resetCanvasBoard;
      delete (window as any).newCanvasGame;
    };
  }, []);

  const handleStartGame = () => {
    if ((window as any).startCanvasGame) {
      (window as any).startCanvasGame();
    }
  };

  const handleResetBoard = () => {
    if ((window as any).resetCanvasBoard) {
      (window as any).resetCanvasBoard();
    }
  };

  const handleNewGame = () => {
    if ((window as any).newCanvasGame) {
      (window as any).newCanvasGame();
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4"
         style={{
           background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96c93d)',
           backgroundSize: '400% 400%',
           animation: 'gradientAnimation 15s ease infinite',
           color: '#fff',
           overflow: 'auto'
         }}>
      
      <style jsx>{`
        @keyframes gradientAnimation {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* Responsive typography */
        h1 {
          font-size: clamp(1.5rem, 5vw, 2rem);
          margin-bottom: 0.5rem;
        }

        .status-text {
          font-size: clamp(1rem, 3vw, 1.25rem);
          margin-bottom: 0.5rem;
        }

        /* Button styles */
        .game-button {
          padding: 0.75rem 1.5rem;
          font-size: clamp(0.875rem, 2.5vw, 1rem);
          min-width: 100px;
          min-height: 44px;
          touch-action: manipulation;
        }

        .back-button {
          padding: 0.5rem 1rem;
          font-size: clamp(0.75rem, 2vw, 0.875rem);
          min-height: 36px;
        }

        .score-container {
          padding: 0.75rem;
          font-size: clamp(0.75rem, 2vw, 0.875rem);
        }

        .score-container .grid {
          gap: 0.5rem;
        }

        .score-container span {
          font-size: clamp(0.75rem, 2vw, 0.875rem);
        }

        .score-container .text-lg {
          font-size: clamp(1rem, 3vw, 1.25rem);
        }

        .canvas-container {
          max-width: 100%;
          overflow: hidden;
        }

        canvas {
          max-width: 100%;
          height: auto;
          touch-action: none;
        }

        @media (max-width: 640px) {
          .game-button {
            padding: 0.5rem 1rem;
            min-width: 80px;
          }

          .score-container .grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 0.25rem;
          }

          .score-container span {
            font-size: clamp(0.625rem, 1.5vw, 0.75rem);
          }

          .score-container .text-lg {
            font-size: clamp(0.875rem, 2.5vw, 1rem);
          }
        }

        @media (max-width: 480px) {
          h1 {
            font-size: clamp(1.25rem, 4vw, 1.5rem);
          }

          .status-text {
            font-size: clamp(0.875rem, 2.5vw, 1rem);
          }

          .game-button {
            padding: 0.5rem 0.75rem;
            min-width: 70px;
            font-size: clamp(0.75rem, 2vw, 0.875rem);
          }
        }
      `}</style>

      <button
        onClick={onBackToSetup}
        className="absolute top-4 left-4 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-md transition-all duration-200 flex items-center space-x-1 backdrop-blur-sm back-button"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      <h1 className="font-bold text-center" style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)' }}>
        Strike 4: Human vs AI
      </h1>
      
      <div className="bg-white/20 backdrop-blur-sm rounded-lg shadow-md score-container">
        <div className="grid grid-cols-3 text-center">
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 bg-red-500 rounded-full mb-1"></div>
            <span className="font-medium">You</span>
            <span className="text-lg font-bold">{gameState.scores.human}</span>
          </div>
          <div className="flex flex-col items-center">
            <Users className="w-4 h-4 mb-1" />
            <span className="font-medium">Draws</span>
            <span className="text-lg font-bold">{gameState.scores.draws}</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 bg-yellow-400 rounded-full mb-1"></div>
            <span className="font-medium">Computer</span>
            <span className="text-lg font-bold">{gameState.scores.computer}</span>
          </div>
        </div>
      </div>
      
      <div ref={statusRef} className="status-text font-bold text-center" style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)' }}>
        {gameState.status}
      </div>
      
      <div className="canvas-container">
        <canvas 
          ref={canvasRef}
          className="border-2 border-white rounded-md shadow-lg bg-gray-900"
        />
      </div>
      
      <div className="flex flex-wrap gap-2 justify-center">
        <button 
          onClick={handleStartGame}
          className="game-button font-bold cursor-pointer bg-green-500 hover:bg-green-600 text-white border-none rounded-md shadow-md transition-all duration-200 transform hover:scale-105 flex items-center space-x-1"
        >
          <Play className="w-4 h-4" />
          <span>Play</span>
        </button>
        
        <button 
          onClick={handleResetBoard}
          className="game-button font-bold cursor-pointer bg-blue-500 hover:bg-blue-600 text-white border-none rounded-md shadow-md transition-all duration-200 transform hover:scale-105 flex items-center space-x-1"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset</span>
        </button>
        
        <button 
          onClick={handleNewGame}
          className="game-button font-bold cursor-pointer bg-purple-500 hover:bg-purple-600 text-white border-none rounded-md shadow-md transition-all duration-200 transform hover:scale-105 flex items-center space-x-1"
        >
          <Trophy className="w-4 h-4" />
          <span>New Game</span>
        </button>
      </div>
    </div>
  );
};