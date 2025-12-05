import React, { useState, useEffect, useCallback } from 'react';
import { AppProps } from '../../types';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 1, y: 0 };

const SnakeApp: React.FC<AppProps> = () => {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 15, y: 15 });
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  const moveSnake = useCallback(() => {
    if (gameOver || !gameStarted) return;

    setSnake((prev) => {
      const newHead = { x: prev[0].x + direction.x, y: prev[0].y + direction.y };

      // Check collision with walls
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        setGameOver(true);
        return prev;
      }

      // Check collision with self
      if (prev.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        return prev;
      }

      const newSnake = [newHead, ...prev];

      // Check food
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 1);
        setFood({
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE),
        });
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameOver, gameStarted]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted) return;
      
      switch (e.key) {
        case 'ArrowUp':
          if (direction.y === 0) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          if (direction.y === 0) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          if (direction.x === 0) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          if (direction.x === 0) setDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, gameStarted]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const interval = setInterval(moveSnake, 150);
    return () => clearInterval(interval);
  }, [moveSnake, gameStarted, gameOver]);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
  };

  return (
    <div className="h-full bg-nird-dark flex flex-col items-center justify-center p-4">
      <div className="mb-4 text-nird-green font-mono">
        SCORE: {score} | PACKETS CONSUMED
      </div>
      <div 
        className="relative bg-black border-2 border-nird-green"
        style={{ width: '300px', height: '300px' }}
      >
        {/* Start Screen Overlay */}
        {!gameStarted && !gameOver && (
           <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20">
               <h2 className="text-nird-green font-bold text-xl mb-4">HIDDEN PROTOCOL</h2>
               <button 
                 onClick={startGame}
                 className="px-6 py-2 bg-nird-green text-black font-bold font-mono hover:bg-green-400"
               >
                 INITIATE LINK
               </button>
           </div>
        )}

        {/* Game Over Overlay */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20">
            <div className="text-red-500 font-bold mb-4">CONNECTION LOST</div>
            <button 
                 onClick={startGame}
                 className="px-4 py-2 border border-red-500 text-red-500 font-bold font-mono hover:bg-red-500/10"
               >
                 RECONNECT
            </button>
          </div>
        )}

        {/* Snake */}
        {snake.map((segment, i) => (
          <div
            key={i}
            className="absolute bg-nird-green"
            style={{
              width: '15px',
              height: '15px',
              left: `${segment.x * 15}px`,
              top: `${segment.y * 15}px`,
              opacity: i === 0 ? 1 : 0.7,
            }}
          />
        ))}
        {/* Food */}
        <div
          className="absolute bg-white animate-pulse"
          style={{
            width: '15px',
            height: '15px',
            left: `${food.x * 15}px`,
            top: `${food.y * 15}px`,
            borderRadius: '50%'
          }}
        />
      </div>
      <div className="mt-4 text-xs text-gray-500 font-mono">Use Arrow Keys to Navigate Data Stream</div>
    </div>
  );
};

export default SnakeApp;