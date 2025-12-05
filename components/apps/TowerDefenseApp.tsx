import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, Coins, Shield, Cpu, Recycle, Play, 
  Eye, Trash2, Lock, Globe, Database, Server
} from 'lucide-react';
import { AppProps } from '../../types';

// --- TYPES ---

export type Coordinate = {
  x: number;
  y: number;
};

export enum EnemyType {
  TRACKER = 'TRACKER',
  BLOATWARE = 'BLOATWARE',
  LICENSE_BOSS = 'LICENSE_BOSS',
}

export enum TowerType {
  TUX_TURRET = 'TUX_TURRET',
  FIREWALL = 'FIREWALL',
  RECYCLER = 'RECYCLER',
}

export interface Enemy {
  id: string;
  type: EnemyType;
  pathIndex: number; // Current index in the path array
  progress: number; // 0.0 to 1.0 between current node and next node
  x: number; // Interpolated X
  y: number; // Interpolated Y
  hp: number;
  maxHp: number;
  speed: number;
  frozenFactor: number; // 1.0 = normal, 0.5 = slowed
}

export interface Tower {
  id: string;
  type: TowerType;
  x: number;
  y: number;
  cooldown: number;
  lastGeneratedTime?: number; // For Recycler
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  targetId: string;
  damage: number;
  speed: number;
  type: 'bullet' | 'slow';
  explodeRadius?: number; // If > 0, deals AOE damage
}

export interface WaveConfig {
  count: number;
  interval: number; // Frames between spawns
  enemies: EnemyType[];
}

export interface Translations {
  title: string;
  subtitle: string;
  lives: string;
  points: string;
  wave: string;
  startWave: string;
  gameOver: string;
  victory: string;
  restart: string;
  towers: {
    [key in TowerType]: {
      name: string;
      desc: string;
    };
  };
}

// --- CONSTANTS ---

// 10x10 Grid Path (0-9)
// Starts at (0,0), ends at (9,9)
export const PATH_COORDINATES: Coordinate[] = [
  { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }, 
  { x: 2, y: 2 }, { x: 1, y: 2 }, { x: 0, y: 2 }, { x: 0, y: 3 }, 
  { x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, 
  { x: 4, y: 4 }, { x: 4, y: 3 }, { x: 4, y: 2 }, { x: 4, y: 1 }, 
  { x: 5, y: 1 }, { x: 6, y: 1 }, { x: 6, y: 2 }, { x: 6, y: 3 }, 
  { x: 6, y: 4 }, { x: 6, y: 5 }, { x: 5, y: 5 }, { x: 4, y: 5 }, 
  { x: 3, y: 5 }, { x: 2, y: 5 }, { x: 2, y: 6 }, { x: 2, y: 7 }, 
  { x: 3, y: 7 }, { x: 4, y: 7 }, { x: 5, y: 7 }, { x: 6, y: 7 }, 
  { x: 7, y: 7 }, { x: 8, y: 7 }, { x: 8, y: 6 }, { x: 8, y: 5 }, 
  { x: 8, y: 4 }, { x: 9, y: 4 }, { x: 9, y: 5 }, { x: 9, y: 6 }, 
  { x: 9, y: 7 }, { x: 9, y: 8 }, { x: 9, y: 9 }
];

// Difficulty Adjustment: "Heavy" Style
// Enemies are slower but much tankier. Money is scarce.
export const ENEMY_STATS: Record<EnemyType, { hp: number; speed: number; reward: number }> = {
  [EnemyType.TRACKER]: { 
    hp: 140,      // Previously 60. Harder to kill.
    speed: 0.03,  // Slower (was 0.05).
    reward: 5     // Low reward
  }, 
  [EnemyType.BLOATWARE]: { 
    hp: 800,      // Previously 300. A real tank.
    speed: 0.015, // Very slow (was 0.02).
    reward: 15 
  }, 
  [EnemyType.LICENSE_BOSS]: { 
    hp: 6000,     // Previously 2500. A monster.
    speed: 0.01,  // Crawling doom (was 0.015).
    reward: 150 
  }, 
};

export const TOWER_STATS: Record<TowerType, { cost: number; range: number; damage: number; fireRate: number; explodeRadius?: number }> = {
  // FAST, LOW DAMAGE (Machine Gun)
  // Good for Trackers, weak against Armor (High HP)
  [TowerType.TUX_TURRET]: { 
    cost: 60, 
    range: 3.0, 
    damage: 12, // Reduced from 15. Needs volume of fire.
    fireRate: 8 
  }, 
  
  // SLOW, HIGH DAMAGE + AOE (Cannon/Bomb)
  // Essential for Bloatware and Bosses
  [TowerType.FIREWALL]: { 
    cost: 150, 
    range: 3.5, 
    damage: 120, // Increased from 80. Hits hard.
    fireRate: 55, // Slightly slower fire rate.
    explodeRadius: 2.0 
  },
  
  // ECONOMY
  [TowerType.RECYCLER]: { 
    cost: 250, 
    range: 0, 
    damage: 0, 
    fireRate: 180 
  }, 
};

export const WAVES: WaveConfig[] = [
  // Intervals increased (slower spawns) to match slower enemies, but counts increased.
  
  // Wave 1: Intro - Slow stream
  { count: 6, interval: 70, enemies: Array(6).fill(EnemyType.TRACKER) },
  
  // Wave 2: The Line - A steady stream
  { count: 12, interval: 60, enemies: Array(12).fill(EnemyType.TRACKER) },
  
  // Wave 3: First Tank
  { count: 10, interval: 50, enemies: [...Array(8).fill(EnemyType.TRACKER), EnemyType.BLOATWARE, EnemyType.BLOATWARE] },
  
  // Wave 4: Armor Division
  { count: 6, interval: 80, enemies: Array(6).fill(EnemyType.BLOATWARE) },
  
  // Wave 5: Escalation
  { count: 20, interval: 40, enemies: [...Array(15).fill(EnemyType.TRACKER), ...Array(5).fill(EnemyType.BLOATWARE)] },
  
  // Wave 6: Density Test (Slightly faster spawn, but slow enemies)
  { count: 30, interval: 35, enemies: Array(30).fill(EnemyType.TRACKER) },
  
  // Wave 7: Heavy Tanks
  { count: 10, interval: 90, enemies: Array(10).fill(EnemyType.BLOATWARE) },
  
  // Wave 8: Mixed Horde
  { count: 30, interval: 40, enemies: [...Array(15).fill(EnemyType.TRACKER), ...Array(15).fill(EnemyType.BLOATWARE)] },
  
  // Wave 9: Endurance
  { count: 50, interval: 25, enemies: Array(50).fill(EnemyType.TRACKER) },
  
  // Wave 10: BOSS - The CEO
  { count: 1, interval: 100, enemies: [EnemyType.LICENSE_BOSS] },
  
  // Wave 11: Aftermath (Recovery?)
  { count: 40, interval: 30, enemies: Array(40).fill(EnemyType.TRACKER) },
  
  // Wave 12: Wall of Flesh
  { count: 15, interval: 70, enemies: Array(15).fill(EnemyType.BLOATWARE) },
  
  // Wave 13: Large Mixed Horde
  { count: 60, interval: 25, enemies: [...Array(40).fill(EnemyType.TRACKER), ...Array(20).fill(EnemyType.BLOATWARE)] },
  
  // Wave 14: Twin Bosses (Very slow spawn between them)
  { count: 2, interval: 300, enemies: [EnemyType.LICENSE_BOSS, EnemyType.LICENSE_BOSS] },
  
  // Wave 15: Constant Pressure
  { count: 80, interval: 20, enemies: Array(80).fill(EnemyType.TRACKER) },
  
  // Wave 16: Ironclad Convoy
  { count: 25, interval: 60, enemies: Array(25).fill(EnemyType.BLOATWARE) },
  
  // Wave 17: Relentless
  { count: 80, interval: 20, enemies: [...Array(50).fill(EnemyType.TRACKER), ...Array(30).fill(EnemyType.BLOATWARE)] },
  
  // Wave 18: Board of Directors (3 Bosses)
  { count: 3, interval: 250, enemies: Array(3).fill(EnemyType.LICENSE_BOSS) },
  
  // Wave 19: The Flood
  { count: 120, interval: 15, enemies: Array(120).fill(EnemyType.TRACKER) },
  
  // Wave 20: Final Exam (Bosses tanking for other units)
  { count: 20, interval: 80, enemies: [
    EnemyType.LICENSE_BOSS, EnemyType.LICENSE_BOSS, 
    ...Array(8).fill(EnemyType.BLOATWARE), 
    EnemyType.LICENSE_BOSS, EnemyType.LICENSE_BOSS,
    ...Array(8).fill(EnemyType.BLOATWARE)
  ]},
];

export const I18N: Record<string, Translations> = {
  fr: {
    title: "La Bataille du Lycée",
    subtitle: "Défendez les Données Élèves contre la Big Tech !",
    lives: "Vies",
    points: "LibrePoints",
    wave: "Vague",
    startWave: "Lancer la Vague",
    gameOver: "L'école est privatisée... (Échec)",
    victory: "Village Indépendant ! (Victoire)",
    restart: "Recommencer",
    towers: {
      [TowerType.TUX_TURRET]: { name: "Tourelle Linux", desc: "Rapide / Dégâts Faibles" },
      [TowerType.FIREWALL]: { name: "Pare-Feu", desc: "Lent / Dégâts Lourds / Zone" },
      [TowerType.RECYCLER]: { name: "Atelier Récup'", desc: "Génère des fonds (+20)" },
    },
  },
  en: {
    title: "NIRD Tower Defense",
    subtitle: "Defend Student Data from Big Tech!",
    lives: "Lives",
    points: "LibrePoints",
    wave: "Wave",
    startWave: "Start Wave",
    gameOver: "School Privatized... (Game Over)",
    victory: "Independent Village! (Victory)",
    restart: "Restart",
    towers: {
      [TowerType.TUX_TURRET]: { name: "Tux Turret", desc: "Fast Fire / Low Dmg" },
      [TowerType.FIREWALL]: { name: "Firewall", desc: "Slow / Heavy Dmg / AOE" },
      [TowerType.RECYCLER]: { name: "Recycler", desc: "Generates Funds (+20)" },
    },
  },
  zh: {
    title: "NIRD 塔防",
    subtitle: "保护学生数据，抵御科技巨头！",
    lives: "生命",
    points: "积分",
    wave: "波次",
    startWave: "开始波次",
    gameOver: "学校私有化... (游戏结束)",
    victory: "独立村庄！ (胜利)",
    restart: "重新开始",
    towers: {
      [TowerType.TUX_TURRET]: { name: "Linux 炮塔", desc: "攻速快 / 伤害低" },
      [TowerType.FIREWALL]: { name: "防火墙", desc: "攻速慢 / 重型伤害 / 范围" },
      [TowerType.RECYCLER]: { name: "回收站", desc: "生产资金 (+20)" },
    },
  },
};

// --- COMPONENT ---

// Helper to check if a coordinate is on the path
const isPath = (x: number, y: number) => {
  return PATH_COORDINATES.some(coord => coord.x === x && coord.y === y);
};

// Helper for distance
const getDistance = (a: {x: number, y: number}, b: {x: number, y: number}) => {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
};

const TowerDefenseApp: React.FC<AppProps> = ({ lang }) => {
  // --- React State (For Rendering) ---
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [wave, setWave] = useState(0);
  const [lives, setLives] = useState(10);
  const [money, setMoney] = useState(150); // Lower starting money for difficulty
  const [selectedTower, setSelectedTower] = useState<TowerType | null>(null);
  
  // Game Entities State (Synced from Refs)
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);

  // --- Game Logic Refs (Source of Truth) ---
  const enemiesRef = useRef<Enemy[]>([]);
  const towersRef = useRef<Tower[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const moneyRef = useRef(150);
  const livesRef = useRef(10);
  
  // Loop Control Refs
  const lastTimeRef = useRef<number>(0);
  const waveActiveRef = useRef(false);
  const waveFrameCounter = useRef(0);
  const enemiesToSpawn = useRef<EnemyType[]>([]);
  
  // Handlers
  const handleRestart = () => {
    // Reset React State
    setGameState('idle');
    setWave(0);
    setLives(10);
    setMoney(150);
    setEnemies([]);
    setTowers([]);
    setProjectiles([]);
    setSelectedTower(null);

    // Reset Refs
    enemiesRef.current = [];
    towersRef.current = [];
    projectilesRef.current = [];
    moneyRef.current = 150;
    livesRef.current = 10;
    waveActiveRef.current = false;
    enemiesToSpawn.current = [];
  };

  const startNextWave = () => {
    if (wave >= WAVES.length) return;
    
    // Setup wave
    const currentWaveConfig = WAVES[wave];
    enemiesToSpawn.current = [...currentWaveConfig.enemies];
    waveFrameCounter.current = 0;
    waveActiveRef.current = true;
    
    setGameState('playing');
    setWave(w => w + 1);
  };

  const handleGridClick = (x: number, y: number) => {
    if (gameState !== 'playing' && gameState !== 'idle') return;
    if (!selectedTower) return;
    if (isPath(x, y)) return;
    
    // Check if tower exists
    if (towersRef.current.some(t => t.x === x && t.y === y)) return;

    const cost = TOWER_STATS[selectedTower].cost;
    if (moneyRef.current >= cost) {
      moneyRef.current -= cost;
      setMoney(moneyRef.current); // Sync immediately for UI responsiveness

      const newTower: Tower = { 
        id: Math.random().toString(36).substr(2, 9), 
        type: selectedTower, 
        x, 
        y, 
        cooldown: 0,
        lastGeneratedTime: 0
      };

      towersRef.current.push(newTower);
      setTowers([...towersRef.current]);
      
      setSelectedTower(null); // Deselect after placement
    }
  };

  // --- Unified Game Loop ---
  useEffect(() => {
    let animationFrameId: number;

    const gameLoop = (timestamp: number) => {
      if (gameState === 'playing') {
        // Calculate delta (clamped to avoid huge jumps)
        const delta = timestamp - lastTimeRef.current;
        const dt = Math.min(delta, 50); // Cap at 50ms
        
        // --- 1. WAVE SPAWNING ---
        if (waveActiveRef.current) {
          waveFrameCounter.current++;
          const currentWaveIdx = wave - 1; 
          const waveConfig = WAVES[currentWaveIdx];
          
          if (enemiesToSpawn.current.length > 0) {
             if (waveFrameCounter.current >= waveConfig.interval) {
                const type = enemiesToSpawn.current.shift()!;
                const stats = ENEMY_STATS[type];
                const newEnemy: Enemy = {
                  id: Math.random().toString(36).substr(2, 9),
                  type,
                  pathIndex: 0,
                  progress: 0,
                  x: PATH_COORDINATES[0].x,
                  y: PATH_COORDINATES[0].y,
                  hp: stats.hp,
                  maxHp: stats.hp,
                  speed: stats.speed,
                  frozenFactor: 1.0
                };
                enemiesRef.current.push(newEnemy);
                waveFrameCounter.current = 0;
             }
          } else if (enemiesRef.current.length === 0 && enemiesToSpawn.current.length === 0) {
             // Wave Complete
             if (wave === WAVES.length) {
               setGameState('won');
             }
             waveActiveRef.current = false;
          }
        }

        // --- 2. MOVE ENEMIES ---
        let damageTaken = 0;
        
        enemiesRef.current = enemiesRef.current.map(enemy => {
            // Recover from freeze slowly
            let newFrozenFactor = Math.min(1.0, enemy.frozenFactor + 0.005);
            let currentSpeed = enemy.speed * enemy.frozenFactor;

            // Move
            let newProgress = enemy.progress + currentSpeed;
            let newPathIndex = enemy.pathIndex;
            
            if (newProgress >= 1.0) {
              newProgress = 0;
              newPathIndex++;
            }

            // Check if reached end
            if (newPathIndex >= PATH_COORDINATES.length - 1) {
              damageTaken++;
              return null; // Will be filtered out
            }

            // Interpolate position
            const currentObj = PATH_COORDINATES[newPathIndex];
            const nextObj = PATH_COORDINATES[newPathIndex + 1];
            const newX = currentObj.x + (nextObj.x - currentObj.x) * newProgress;
            const newY = currentObj.y + (nextObj.y - currentObj.y) * newProgress;

            return {
              ...enemy,
              pathIndex: newPathIndex,
              progress: newProgress,
              x: newX,
              y: newY,
              frozenFactor: newFrozenFactor
            };
        }).filter(Boolean) as Enemy[];

        if (damageTaken > 0) {
            livesRef.current -= damageTaken;
            if (livesRef.current <= 0) setGameState('lost');
        }

        // --- 3. TOWERS ACT ---
        let moneyEarned = 0;
        
        towersRef.current.forEach(tower => {
             const stats = TOWER_STATS[tower.type];
             
             // Cooldown management
             if (tower.cooldown > 0) {
                 tower.cooldown--;
                 return;
             }

             // Recycler Logic
             if (tower.type === TowerType.RECYCLER) {
                moneyEarned += 20; // Increased amount, but slower rate
                tower.cooldown = stats.fireRate;
                return;
             }

             // Combat Logic: Find Target
             // We use enemiesRef.current directly
             const target = enemiesRef.current.find(e => getDistance(tower, e) <= stats.range);
             
             if (target) {
                 // Spawn Projectile
                 projectilesRef.current.push({
                     id: Math.random().toString(36).substr(2, 9),
                     x: tower.x,
                     y: tower.y,
                     targetId: target.id,
                     damage: stats.damage,
                     speed: 0.3, // Projectile speed
                     type: tower.type === TowerType.FIREWALL ? 'slow' : 'bullet',
                     explodeRadius: stats.explodeRadius // Pass explosion radius
                 });
                 tower.cooldown = stats.fireRate;
             }
        });

        // --- 4. MOVE PROJECTILES & COLLISION ---
        projectilesRef.current = projectilesRef.current.map(p => {
            // Find target (even if it moved slightly)
            const target = enemiesRef.current.find(e => e.id === p.targetId);
            
            // If target dead/gone, remove projectile?
            // Optional: for homing projectiles, we remove them.
            if (!target) return null;

            const dist = getDistance(p, target);
            if (dist < 0.5) {
                // HIT!
                
                // 1. Direct Hit / Splash Logic
                if (p.explodeRadius && p.explodeRadius > 0) {
                    // AOE DAMAGE
                    enemiesRef.current.forEach(e => {
                        if (getDistance(e, target) <= (p.explodeRadius || 1)) {
                            e.hp -= p.damage;
                            if (p.type === 'slow') {
                                e.frozenFactor = 0.5; // Slow down
                            }
                        }
                    });
                } else {
                    // SINGLE TARGET
                    target.hp -= p.damage;
                }
                
                return null; // Remove projectile
            } else {
                // Move projectile
                const dx = target.x - p.x;
                const dy = target.y - p.y;
                const angle = Math.atan2(dy, dx);
                return {
                    ...p,
                    x: p.x + Math.cos(angle) * p.speed,
                    y: p.y + Math.sin(angle) * p.speed
                };
            }
        }).filter(Boolean) as Projectile[];

        // --- 5. CLEANUP DEAD ENEMIES & APPLY REWARDS ---
        // We do this after projectiles to ensure rewards are claimed
        enemiesRef.current = enemiesRef.current.filter(e => {
            if (e.hp <= 0) {
                moneyEarned += ENEMY_STATS[e.type].reward;
                return false;
            }
            return true;
        });

        if (moneyEarned > 0) {
            moneyRef.current += moneyEarned;
        }

        // --- 6. SYNC TO STATE (RENDER) ---
        // To save performance, we could debounce this, but 60fps React is usually fine for this amount of objects
        setEnemies([...enemiesRef.current]);
        setTowers([...towersRef.current]); // needed if cooldowns change visually, or Recycler
        setProjectiles([...projectilesRef.current]);
        setMoney(moneyRef.current);
        setLives(livesRef.current);

      }
      
      lastTimeRef.current = timestamp;
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, wave]); // Dependencies that restart the loop

  // --- Rendering Helpers ---
  const t = I18N[lang];
  
  const renderGridCell = (i: number) => {
    const x = i % 10;
    const y = Math.floor(i / 10);
    const isPathCell = isPath(x, y);
    // Use state 'towers' for rendering
    const hasTower = towers.find(t => t.x === x && t.y === y);

    let content = null;
    if (hasTower) {
        if (hasTower.type === TowerType.TUX_TURRET) content = <Cpu className="w-7 h-7 text-cyan-300 animate-pulse" />;
        if (hasTower.type === TowerType.FIREWALL) content = <Shield className="w-7 h-7 text-orange-400" />;
        if (hasTower.type === TowerType.RECYCLER) content = <Recycle className="w-7 h-7 text-green-400" />;
    } else if (selectedTower && !isPathCell) {
        // Ghost tower
        if (x === mousePos.current.x && y === mousePos.current.y) {
           content = <div className="w-4 h-4 rounded-full bg-white/30" />
        }
    }

    // Start/End Labels
    const isStart = x === PATH_COORDINATES[0].x && y === PATH_COORDINATES[0].y;
    const isEnd = x === PATH_COORDINATES[PATH_COORDINATES.length-1].x && y === PATH_COORDINATES[PATH_COORDINATES.length-1].y;

    return (
      <div 
        key={i}
        onClick={() => handleGridClick(x, y)}
        onMouseEnter={() => mousePos.current = {x, y}}
        className={`
          w-full h-full border border-slate-700/50 relative flex items-center justify-center
          transition-colors duration-200
          ${isPathCell ? 'bg-slate-800 shadow-inner' : 'bg-emerald-900/20 hover:bg-emerald-800/30 cursor-pointer'}
          ${hasTower ? 'ring-1 ring-white/20 shadow-lg' : ''}
        `}
      >
        {isStart && <Server className="absolute opacity-30 text-red-500 w-8 h-8" />}
        {isEnd && <Database className="absolute opacity-30 text-blue-500 w-8 h-8" />}
        {content}
      </div>
    );
  };
  
  const mousePos = useRef({x: -1, y: -1});

  return (
    <div className="h-full flex flex-col items-center bg-slate-900 text-slate-50 font-sans selection:bg-emerald-500 overflow-hidden">
      
      {/* --- HEADER --- */}
      <header className="w-full p-4 flex justify-between items-center bg-slate-800/50 backdrop-blur-md border-b border-slate-700 shadow-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 p-2 rounded-lg shadow-lg shadow-emerald-500/20">
            <Cpu className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight md:text-xl text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              {t.title}
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">{t.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm font-bold">
            <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-700">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                <span className={lives < 3 ? "text-rose-500 animate-pulse" : "text-slate-200"}>{lives}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-700">
                <Coins className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-amber-400">{money}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-700">
                <span className="text-slate-400 uppercase text-xs tracking-wider">{t.wave}</span>
                <span className="text-white">{wave} / {WAVES.length}</span>
            </div>
        </div>
      </header>

      {/* --- GAME AREA --- */}
      <main className="flex-1 w-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
        
        {/* The Grid Container */}
        <div className="relative aspect-square h-full max-h-[500px] shadow-2xl shadow-black/50 rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
            {/* 1. Grid Cells */}
            <div className="absolute inset-0 grid grid-cols-10 grid-rows-10">
                {Array.from({ length: 100 }).map((_, i) => renderGridCell(i))}
            </div>

            {/* 2. Enemies Layer */}
            <div className="absolute inset-0 pointer-events-none">
                {enemies.map(enemy => (
                    <div 
                        key={enemy.id}
                        className="absolute w-[10%] h-[10%] flex items-center justify-center transition-transform will-change-transform"
                        style={{ 
                            left: `${enemy.x * 10}%`, 
                            top: `${enemy.y * 10}%`,
                        }}
                    >
                        <div className="relative">
                            {/* Health Bar */}
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full ${enemy.type === EnemyType.LICENSE_BOSS ? 'bg-purple-500' : 'bg-rose-500'}`} 
                                    style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                                />
                            </div>
                            
                            {/* Icon */}
                            <div className={`
                                p-1.5 rounded-full shadow-lg transition-all duration-200
                                ${enemy.type === EnemyType.TRACKER ? 'bg-orange-500/20 text-orange-400' : ''}
                                ${enemy.type === EnemyType.BLOATWARE ? 'bg-purple-500/20 text-purple-400' : ''}
                                ${enemy.type === EnemyType.LICENSE_BOSS ? 'bg-red-600 text-white scale-125' : ''}
                                ${enemy.frozenFactor < 1 ? 'ring-2 ring-blue-400 scale-90 opacity-80' : ''}
                            `}>
                                {enemy.type === EnemyType.TRACKER && <Eye className="w-5 h-5" />}
                                {enemy.type === EnemyType.BLOATWARE && <Trash2 className="w-6 h-6" />}
                                {enemy.type === EnemyType.LICENSE_BOSS && <Lock className="w-7 h-7" />}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 3. Projectiles Layer */}
            <div className="absolute inset-0 pointer-events-none">
                {projectiles.map(p => (
                    <div 
                        key={p.id}
                        className={`absolute rounded-full shadow-sm transition-all
                            ${p.type === 'slow' 
                                ? 'bg-blue-400/80 shadow-[0_0_10px_rgba(96,165,250,0.8)] w-4 h-4'  // Larger AOE projectile
                                : 'bg-orange-400 shadow-orange-400/50 w-2 h-2'} // Standard Bullet
                        `}
                        style={{ 
                            left: `calc(${p.x * 10}% + ${p.type === 'slow' ? '3%' : '4%'})`, 
                            top: `calc(${p.y * 10}% + ${p.type === 'slow' ? '3%' : '4%'})`,
                        }}
                    />
                ))}
            </div>
            
            {/* 4. Overlays (Game Over / Victory) */}
            {(gameState === 'lost' || gameState === 'won') && (
                <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 animate-in fade-in zoom-in duration-300">
                    <h2 className={`text-3xl md:text-4xl font-black mb-2 ${gameState === 'won' ? 'text-emerald-400' : 'text-rose-500'}`}>
                        {gameState === 'won' ? t.victory : t.gameOver}
                    </h2>
                    <p className="text-slate-300 mb-8 max-w-xs mx-auto">
                        {gameState === 'won' 
                            ? "Open Source triumphs! The students control their own data now." 
                            : "Big Tech has taken over. Please verify your identity to continue."}
                    </p>
                    <button 
                        onClick={handleRestart}
                        className="px-8 py-3 bg-white text-slate-900 font-bold rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-2"
                    >
                        <Recycle className="w-5 h-5" />
                        {t.restart}
                    </button>
                </div>
            )}
        </div>

      </main>

      {/* --- CONTROLS --- */}
      <footer className="w-full p-4 bg-slate-900 sticky bottom-0 z-10 border-t border-slate-800 shrink-0">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
             
             {/* Towers Selection */}
             <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 justify-center">
                 {[TowerType.TUX_TURRET, TowerType.FIREWALL, TowerType.RECYCLER].map((type) => {
                     const stat = TOWER_STATS[type];
                     const info = t.towers[type];
                     const isSelected = selectedTower === type;
                     const canAfford = money >= stat.cost;
                     
                     return (
                         <button
                            key={type}
                            onClick={() => canAfford && setSelectedTower(type)}
                            disabled={!canAfford}
                            className={`
                                flex flex-col items-center p-3 rounded-xl border-2 transition-all min-w-[100px] relative group
                                ${isSelected 
                                    ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                                    : 'bg-slate-800 border-slate-700 hover:border-slate-500'}
                                ${!canAfford ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer active:scale-95'}
                            `}
                         >
                            <div className="mb-2">
                                {type === TowerType.TUX_TURRET && <Cpu className={`w-6 h-6 ${isSelected ? 'text-emerald-400' : 'text-cyan-300'}`} />}
                                {type === TowerType.FIREWALL && <Shield className={`w-6 h-6 ${isSelected ? 'text-emerald-400' : 'text-orange-400'}`} />}
                                {type === TowerType.RECYCLER && <Recycle className={`w-6 h-6 ${isSelected ? 'text-emerald-400' : 'text-green-400'}`} />}
                            </div>
                            <span className="text-xs font-bold text-slate-200">{info.name}</span>
                            <div className="flex items-center gap-1 mt-1">
                                <Coins className="w-3 h-3 text-amber-400" />
                                <span className="text-xs font-mono text-amber-400">{stat.cost}</span>
                            </div>
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 bg-slate-900 text-slate-300 text-[10px] px-2 py-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                {info.desc}
                            </div>
                         </button>
                     )
                 })}
             </div>

             {/* Start Button */}
             <button
                onClick={startNextWave}
                disabled={waveActiveRef.current || wave >= WAVES.length || gameState === 'lost'}
                className={`
                    w-full md:w-auto px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg
                    ${(waveActiveRef.current || wave >= WAVES.length)
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:brightness-110 active:scale-95 hover:shadow-emerald-500/20'
                    }
                `}
             >
                {waveActiveRef.current 
                    ? <span className="animate-pulse">Wave In Progress...</span> 
                    : <>
                        <Play className="w-5 h-5 fill-current" />
                        {t.startWave}
                      </>
                }
             </button>
          </div>
      </footer>
    </div>
  );
};

export default TowerDefenseApp;