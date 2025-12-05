import React, { useState, useEffect, useCallback } from 'react';
import { AppProps } from '../../types';
import { GameState, Upgrade, LogEntry, Language, UpgradeEffect, GameEvent, ZoneId, LocalizedString } from '../../types';
import { 
    Euro, Shield, Leaf, AlertTriangle, TrendingDown, TrendingUp, AlertOctagon, RefreshCw,
    Briefcase, Monitor, Server, Wrench, CheckCircle2, Play, Pause, Globe, AlertCircle
} from 'lucide-react';

// --- CONSTANTS FROM TYCOON ---
const TICK_RATE_MS = 1000;
const EVENT_CHANCE = 0.05;
const OBSOLESCENCE_INTERVAL = 10;
const CARBON_PENALTY_THRESHOLD = 800;
const TECH_DEBT_PENALTY_THRESHOLD = 50;
const ECO_TAX_AMOUNT = 5;
const GREEN_BONUS_THRESHOLD = 100;
const GREEN_BONUS_AMOUNT = 2;

const INITIAL_STATE: GameState = {
  day: 1,
  budget: 1000,
  autonomy: 10,
  carbon: 500,
  techDebt: 20,
  paused: true,
  gameOver: false,
  victory: false,
  activeEvent: null,
  logs: [],
  upgrades: [],
  hasBailoutTriggered: false
};

interface ZoneData {
    id: ZoneId;
    name: LocalizedString;
    description: LocalizedString;
    icon: string;
}

const ZONES: ZoneData[] = [
  { 
    id: 'ADMIN', 
    name: { fr: 'Administration', en: 'Administration', zh: '管理' }, 
    description: { fr: 'Gestion des politiques et licences.', en: 'Policy and license management.', zh: '政策和许可证管理' }, 
    icon: 'Briefcase' 
  },
  { 
    id: 'LAB', 
    name: { fr: 'Salle Informatique', en: 'Computer Lab', zh: '计算机实验室' }, 
    description: { fr: 'Le front de la bataille OS.', en: 'The OS battlefront.', zh: '操作系统战线' }, 
    icon: 'Monitor' 
  },
  { 
    id: 'SERVER', 
    name: { fr: 'Salle Serveur', en: 'Server Room', zh: '服务器机房' }, 
    description: { fr: 'Cloud vs Local.', en: 'Cloud vs Local.', zh: '云端 vs 本地' }, 
    icon: 'Server' 
  },
  { 
    id: 'REPAIR', 
    name: { fr: 'Repair Café', en: 'Repair Café', zh: '维修咖啡馆' }, 
    description: { fr: 'Maintenance et recyclage.', en: 'Maintenance and recycling.', zh: '维护和回收' }, 
    icon: 'Wrench' 
  },
];

const UPGRADE_LIST: Upgrade[] = [
  {
    id: 'policy_foss',
    name: { fr: 'Politique Logiciel Libre', en: 'FOSS Policy', zh: '自由开源软件政策' },
    description: { fr: 'Priorité aux logiciels open-source pour réduire la dette.', en: 'Prioritize open-source software to reduce debt.', zh: '优先使用开源软件以减少债务' },
    zone: 'ADMIN',
    cost: 160,
    effect: { techDebtPerTick: -0.1, autonomyPerTick: 0.1 },
    purchased: false,
  },
  {
    id: 'grant_green_tech',
    name: { fr: 'Subvention Green Tech', en: 'Green Tech Grant', zh: '绿色科技补助' },
    description: { fr: 'Recevez des fonds pour vos initiatives écolos.', en: 'Receive funds for your eco-initiatives.', zh: '为您的环保举措获得资金' },
    zone: 'ADMIN',
    cost: 50,
    effect: { budgetPerTick: 4 },
    purchased: false,
  },
  {
    id: 'install_party',
    name: { fr: 'Linux Install Party', en: 'Linux Install Party', zh: 'Linux 安装派对' },
    description: { fr: 'Les élèves installent Linux sur les vieux PC.', en: 'Students install Linux on old PCs.', zh: '学生在旧电脑上安装 Linux' },
    zone: 'LAB',
    cost: 80,
    effect: { autonomyPerTick: 0.5, carbonPerTick: -2 },
    purchased: false,
  },
  {
    id: 'libreoffice_migration',
    name: { fr: 'Migration LibreOffice', en: 'LibreOffice Migration', zh: 'LibreOffice 迁移' },
    description: { fr: 'Abandon de la suite Office propriétaire.', en: 'Ditch the proprietary Office suite.', zh: '放弃专有的 Office 套件' },
    zone: 'LAB',
    cost: 300,
    effect: { budgetPerTick: 6, autonomyImmediate: 10 },
    purchased: false,
  },
  {
    id: 'local_nas',
    name: { fr: 'NAS Local (NextCloud)', en: 'Local NAS (NextCloud)', zh: '本地 NAS (NextCloud)' },
    description: { fr: 'Quittez le Cloud payant. Stockez localement.', en: 'Leave the paid Cloud. Store locally.', zh: '离开付费云端。本地存储。' },
    zone: 'SERVER',
    cost: 800,
    effect: { budgetPerTick: 12, autonomyPerTick: 0.5, carbonPerTick: 1 },
    purchased: false,
  },
  {
    id: 'green_hosting',
    name: { fr: 'Refroidissement Passif', en: 'Passive Cooling', zh: '被动冷却' },
    description: { fr: 'Ouvrez les fenêtres de la salle serveur !', en: 'Open the server room windows!', zh: '打开服务器机房的窗户！' },
    zone: 'SERVER',
    cost: 150,
    effect: { carbonPerTick: -5 },
    purchased: false,
  },
  {
    id: 'soldering_station',
    name: { fr: 'Station de Soudure', en: 'Soldering Station', zh: '焊接站' },
    description: { fr: 'Réparez les condensateurs au lieu de jeter.', en: 'Repair capacitors instead of trashing.', zh: '修理电容器而不是扔掉。' },
    zone: 'REPAIR',
    cost: 400,
    effect: { techDebtPerTick: -0.5, budgetPerTick: 2 },
    purchased: false,
  },
  {
    id: 'spare_parts',
    name: { fr: 'Stock de Pièces', en: 'Spare Parts Stock', zh: '备件库存' },
    description: { fr: 'Réduit massivement le coût des pannes.', en: 'Massively reduces breakdown costs.', zh: '大幅降低故障成本。' },
    zone: 'REPAIR',
    cost: 250,
    effect: { autonomyPerTick: 0.2 },
    purchased: false,
  }
];

const RANDOM_EVENTS: GameEvent[] = [
  {
    id: 'audit_microsoft',
    title: { fr: 'Audit de Licences', en: 'License Audit', zh: '许可证审计' },
    description: { fr: 'Big Tech envoie ses avocats vérifier vos licences Windows.', en: 'Big Tech sends lawyers to check your Windows licenses.', zh: '大型科技公司派律师检查您的 Windows 许可证。' },
    choices: [
      { text: { fr: 'Payer la conformité (-400€)', en: 'Pay for compliance (-400€)', zh: '支付合规费用 (-400€)' }, cost: 400, effect: { budget: 0, autonomy: 0, carbon: 0, techDebt: 0 } },
      { text: { fr: 'Ignorer & Cacher (Gratuit)', en: 'Ignore & Hide (Free)', zh: '忽略并隐藏 (免费)' }, cost: 0, effect: { budget: 0, autonomy: -5, carbon: 0, techDebt: 20 } },
    ]
  },
  {
    id: 'printer_fail',
    title: { fr: 'Obsolescence Imprimante', en: 'Printer Obsolescence', zh: '打印机报废' },
    description: { fr: 'Le driver propriétaire ne supporte plus votre OS.', en: 'The proprietary driver no longer supports your OS.', zh: '专有驱动程序不再支持您的操作系统。' },
    choices: [
      { text: { fr: 'Acheter neuf (-300€)', en: 'Buy new (-300€)', zh: '购买新的 (-300€)' }, cost: 300, effect: { budget: 0, autonomy: -2, carbon: 10, techDebt: 5 } },
      { text: { fr: 'Hacker le driver (Gratuit)', en: 'Hack driver (Free)', zh: '破解驱动程序 (免费)' }, cost: 0, effect: { budget: 0, autonomy: 2, carbon: 5, techDebt: 15 } },
    ]
  },
  {
    id: 'heatwave',
    title: { fr: 'Canicule Serveur', en: 'Server Heatwave', zh: '服务器热浪' },
    description: { fr: 'La clim lâche. Le Cloud surchauffe.', en: 'AC fails. The Cloud is overheating.', zh: '空调故障。云端过热。' },
    choices: [
      { text: { fr: 'Payer surcoût énergie (-150€)', en: 'Pay energy surge (-150€)', zh: '支付能源激增 (-150€)' }, cost: 150, effect: { budget: 0, autonomy: 0, carbon: 20, techDebt: 0 } },
      { text: { fr: 'Fermer le lycée (Gratuit)', en: 'Close School (Free)', zh: '关闭学校 (免费)' }, cost: 0, effect: { budget: -120, autonomy: 0, carbon: -10, techDebt: 0 } },
    ]
  },
  {
    id: 'cloud_credits',
    title: { fr: 'Le Piège "Gratuit"', en: 'The "Free" Trap', zh: '"免费"陷阱' },
    description: { fr: 'Un GAFAM offre des crédits Cloud "gratuits" aux étudiants.', en: 'A Big Tech offers "free" Cloud credits to students.', zh: '大型科技公司向学生提供"免费"云积分。' },
    choices: [
      { text: { fr: 'Accepter (Autonomie -20)', en: 'Accept (Autonomy -20)', zh: '接受 (自主权 -20)' }, cost: 0, effect: { budget: 100, autonomy: -20, carbon: 0, techDebt: 10 } },
      { text: { fr: 'Refuser', en: 'Refuse', zh: '拒绝' }, cost: 0, effect: { budget: 0, autonomy: 5, carbon: 0, techDebt: 0 } },
    ]
  }
];

const UI_TRANSLATIONS = {
  fr: {
    day: "JOUR",
    budget: "Budget",
    autonomy: "Autonomie",
    carbon: "Carbone",
    techDebt: "Dette Tech",
    availableUpgrades: "Améliorations Disponibles",
    noUpgrades: "Aucune amélioration disponible.",
    buy: "Acheter",
    active: "ACTIVÉ",
    alertTitle: "Alerte Big Tech",
    systemLogs: "Journal Système",
    pause: "Pause",
    resume: "Reprendre",
    restart: "Recommencer",
    gameOver: "GAME OVER",
    victory: "VICTOIRE !",
    gameOverDesc: "Votre budget est épuisé. Big Tech a racheté le lycée pour en faire un datacenter.",
    victoryDesc: "100% Autonome ! Le lycée est un modèle NIRD. Les élèves compilent leur propre noyau Linux.",
    retry: "Réessayer",
    playAgain: "Rejouer",
    welcome: "Bienvenue au Lycée. La résistance commence !",
    budgetExhausted: "BUDGET ÉPUISÉ. FAILLITE.",
    autonomyReached: "AUTONOMIE 100% ATTEINTE ! VICTOIRE NIRD !",
    purchase: "Achat",
    eventResolved: "Événement résolu",
    mainTitle: "RÉSISTANCE LYCÉE",
    ecoTax: "ÉCO-TAXE",
    maintenanceHell: "ENFER MAINTENANCE",
    licenseDrain: "TAXE GAFAM",
    greenBonus: "BONUS VERT",
    multiplier: "Coût x2",
    bailout: "SOLDE BAS : L'Association des Parents fait un don d'urgence (+500€) !"
  },
  en: {
    day: "DAY",
    budget: "Budget",
    autonomy: "Autonomy",
    carbon: "Carbon",
    techDebt: "Tech Debt",
    availableUpgrades: "Available Upgrades",
    noUpgrades: "No upgrades available.",
    buy: "Buy",
    active: "ACTIVE",
    alertTitle: "Big Tech Alert",
    systemLogs: "System Logs",
    pause: "Pause",
    resume: "Resume",
    restart: "Restart",
    gameOver: "GAME OVER",
    victory: "VICTORY!",
    gameOverDesc: "Budget exhausted. Big Tech bought the school to turn it into a datacenter.",
    victoryDesc: "100% Autonomous! The school is a NIRD model. Students are compiling their own Linux kernel.",
    retry: "Retry",
    playAgain: "Play Again",
    welcome: "Welcome to the School. The resistance begins!",
    budgetExhausted: "BUDGET EXHAUSTED. BANKRUPTCY.",
    autonomyReached: "100% AUTONOMY REACHED! NIRD VICTORY!",
    purchase: "Purchase",
    eventResolved: "Event resolved",
    mainTitle: "RESISTANCE HIGH SCHOOL",
    ecoTax: "ECO-TAX",
    maintenanceHell: "MAINT. HELL",
    licenseDrain: "BIG TECH TAX",
    greenBonus: "GREEN BONUS",
    multiplier: "Cost x2",
    bailout: "LOW FUNDS: Parents Association sends emergency donation (+500€)!"
  },
  zh: {
    day: "天数",
    budget: "预算",
    autonomy: "自主权",
    carbon: "碳排放",
    techDebt: "技术债务",
    availableUpgrades: "可用升级",
    noUpgrades: "暂无可用升级。",
    buy: "购买",
    active: "已激活",
    alertTitle: "大型科技警报",
    systemLogs: "系统日志",
    pause: "暂停",
    resume: "继续",
    restart: "重新开始",
    gameOver: "游戏结束",
    victory: "胜利！",
    gameOverDesc: "预算耗尽。大型科技公司买下了学校，将其变成了数据中心。",
    victoryDesc: "100% 自主！学校是 NIRD 的典范。学生们正在编译自己的 Linux 内核。",
    retry: "重试",
    playAgain: "再玩一次",
    welcome: "欢迎来到学校。抵抗开始了！",
    budgetExhausted: "预算耗尽。破产。",
    autonomyReached: "达到 100% 自主权！NIRD 胜利！",
    purchase: "购买",
    eventResolved: "事件已解决",
    mainTitle: "抵抗高中",
    ecoTax: "生态税",
    maintenanceHell: "维护地狱",
    licenseDrain: "大型科技税",
    greenBonus: "绿色奖金",
    multiplier: "成本 x2",
    bailout: "资金不足：家长协会发送紧急捐款 (+500€)！"
  }
};

const TycoonApp: React.FC<AppProps> = ({ lang }) => {
  // --- STATE ---
  // Map 'zh' to 'en' for UI_TRANSLATIONS if zh is not fully supported in keys or just use as is if we added zh
  // Since I added zh to UI_TRANSLATIONS above, we can cast safely if we ensure types match
  const currentLang = lang; 
  const t = UI_TRANSLATIONS[currentLang];

  const [gameState, setGameState] = useState<GameState>({
    ...INITIAL_STATE,
    upgrades: UPGRADE_LIST.map(u => ({ ...u, purchased: false }))
  });

  // --- DERIVED STATE ---
  const costMultiplier = gameState.techDebt > TECH_DEBT_PENALTY_THRESHOLD ? 2 : 1;

  // --- INITIAL LOG ---
  useEffect(() => {
      if (gameState.logs.length === 0) {
        setGameState(prev => ({
            ...prev,
            logs: [{ id: 0, day: 1, message: t.welcome, type: 'info' }]
        }));
      }
  }, []); // Only once

  // --- GAME LOOP ---
  const calculateEffects = useCallback(() => {
    let budgetDelta = -5;
    let autonomyDelta = 0;
    let carbonDelta = 5;
    let techDebtDelta = 0.05;

    gameState.upgrades.filter(u => u.purchased).forEach(u => {
      if (u.effect.budgetPerTick) budgetDelta += u.effect.budgetPerTick;
      if (u.effect.autonomyPerTick) autonomyDelta += u.effect.autonomyPerTick;
      if (u.effect.carbonPerTick) carbonDelta += u.effect.carbonPerTick;
      if (u.effect.techDebtPerTick) techDebtDelta += u.effect.techDebtPerTick;
    });

    const hasNas = gameState.upgrades.find(u => u.id === 'local_nas')?.purchased;
    if (!hasNas) {
      budgetDelta -= 5;
    }

    const licenseDrain = Math.floor((100 - gameState.autonomy) / 10);
    budgetDelta -= licenseDrain;

    if (gameState.carbon > CARBON_PENALTY_THRESHOLD) {
        budgetDelta -= ECO_TAX_AMOUNT;
    }

    if (gameState.carbon < GREEN_BONUS_THRESHOLD) {
        budgetDelta += GREEN_BONUS_AMOUNT;
    }

    if (gameState.techDebt > TECH_DEBT_PENALTY_THRESHOLD) {
      autonomyDelta -= 0.1;
    }

    return { budget: budgetDelta, autonomy: autonomyDelta, carbon: carbonDelta, techDebt: techDebtDelta, licenseDrain };
  }, [gameState.upgrades, gameState.techDebt, gameState.carbon, gameState.autonomy]);

  const handleTick = useCallback(() => {
    if (gameState.paused || gameState.gameOver || gameState.victory || gameState.activeEvent) return;

    setGameState(prev => {
      const effects = calculateEffects();

      let newBudget = prev.budget + effects.budget;
      let newAutonomy = Math.min(100, Math.max(0, prev.autonomy + effects.autonomy));
      let newCarbon = Math.max(0, prev.carbon + effects.carbon);
      let newTechDebt = Math.max(0, prev.techDebt + effects.techDebt);

      let newLogs = prev.logs;
      let hasBailoutTriggered = prev.hasBailoutTriggered;

      if (newBudget < 100 && !hasBailoutTriggered && newBudget > 0) {
        newBudget += 500;
        hasBailoutTriggered = true;
        newLogs = [...newLogs, { id: Date.now(), day: prev.day, message: t.bailout, type: 'success' }];
      }

      // Obsolescence
      if (prev.day % OBSOLESCENCE_INTERVAL === 0) {
        if (Math.random() * 100 < newTechDebt) {
          const repairCost = 50;
          const hasRepairShop = prev.upgrades.find(u => u.id === 'spare_parts')?.purchased;
          if (hasRepairShop) {
             newBudget -= (repairCost / 5); 
          } else {
             newBudget -= repairCost;
          }
        }
      }

      // Event
      let nextEvent = null;
      if (Math.random() < EVENT_CHANCE) {
        const availableEvents = RANDOM_EVENTS; 
        const randomIdx = Math.floor(Math.random() * availableEvents.length);
        nextEvent = availableEvents[randomIdx];
      }

      const isVictory = newAutonomy >= 100;
      const isGameOver = newBudget <= 0;

      if (isGameOver) {
        newLogs = [...newLogs, { id: Date.now(), day: prev.day, message: t.budgetExhausted, type: 'danger' }];
      } else if (isVictory) {
        newLogs = [...newLogs, { id: Date.now(), day: prev.day, message: t.autonomyReached, type: 'success' }];
      }

      return {
        ...prev,
        day: prev.day + 1,
        budget: newBudget,
        autonomy: newAutonomy,
        carbon: newCarbon,
        techDebt: newTechDebt,
        gameOver: isGameOver,
        victory: isVictory,
        paused: isGameOver || isVictory || !!nextEvent,
        activeEvent: nextEvent,
        logs: newLogs,
        hasBailoutTriggered
      };
    });
  }, [calculateEffects, gameState.paused, gameState.gameOver, gameState.victory, gameState.activeEvent, t]);

  useEffect(() => {
    const timer = setInterval(handleTick, TICK_RATE_MS);
    return () => clearInterval(timer);
  }, [handleTick]);

  // --- ACTIONS ---
  const buyUpgrade = (upgrade: Upgrade) => {
    const effectiveCost = upgrade.cost * costMultiplier;
    if (gameState.budget < effectiveCost) return;

    setGameState(prev => ({
      ...prev,
      budget: prev.budget - effectiveCost,
      autonomy: Math.min(100, prev.autonomy + (upgrade.effect.autonomyImmediate || 0)),
      techDebt: Math.max(0, prev.techDebt + (upgrade.effect.techDebtImmediate || 0)),
      upgrades: prev.upgrades.map(u => u.id === upgrade.id ? { ...u, purchased: true } : u),
      logs: [...prev.logs, { id: Date.now(), day: prev.day, message: `${t.purchase}: ${upgrade.name[currentLang]} (-${effectiveCost}€)`, type: 'success' }]
    }));
  };

  const handleEventChoice = (cost: number, choiceIndex: number) => {
    if (!gameState.activeEvent) return;
    const choice = gameState.activeEvent.choices[choiceIndex];
    const effects = choice.effect;

    setGameState(prev => ({
      ...prev,
      budget: prev.budget - cost + (effects.budget || 0),
      autonomy: Math.min(100, Math.max(0, prev.autonomy + (effects.autonomy || 0))),
      carbon: Math.max(0, prev.carbon + (effects.carbon || 0)),
      techDebt: Math.max(0, prev.techDebt + (effects.techDebt || 0)),
      activeEvent: null,
      paused: false,
      logs: [...prev.logs, { id: Date.now(), day: prev.day, message: `${t.eventResolved} : ${choice.text[currentLang]}`, type: 'warning' }]
    }));
  };

  const togglePause = () => setGameState(prev => ({ ...prev, paused: !prev.paused }));

  const restartGame = () => {
    setGameState({
      ...INITIAL_STATE,
      logs: [{ id: Date.now(), day: 1, message: t.welcome, type: 'info' }],
      upgrades: UPGRADE_LIST.map(u => ({ ...u, purchased: false }))
    });
  };

  // --- RENDER HELPERS ---
  const getZoneIcon = (iconName: string) => {
    switch(iconName) {
      case 'Briefcase': return <Briefcase className="w-8 h-8 text-purple-400" />;
      case 'Monitor': return <Monitor className="w-8 h-8 text-blue-400" />;
      case 'Server': return <Server className="w-8 h-8 text-emerald-400" />;
      case 'Wrench': return <Wrench className="w-8 h-8 text-orange-400" />;
      default: return <Monitor className="w-8 h-8 text-gray-400" />;
    }
  };

  const isEcoTax = gameState.carbon > CARBON_PENALTY_THRESHOLD;
  const isMaintenanceHell = gameState.techDebt > TECH_DEBT_PENALTY_THRESHOLD;
  const isGreenBonus = gameState.carbon < GREEN_BONUS_THRESHOLD;
  const licenseDrain = Math.floor((100 - gameState.autonomy) / 10);
  const isHighDrain = licenseDrain > 10;

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100 font-sans overflow-hidden">
      
      {/* TOP BAR (Resources) */}
      <div className="sticky top-0 z-10 bg-gray-800 p-2 border-b border-gray-700 shadow-lg flex flex-wrap gap-2 items-center justify-between shrink-0">
         
         {/* Stats */}
         <div className="flex flex-wrap gap-2">
             <div className="flex items-center gap-2 bg-gray-900 px-3 py-1 rounded border border-gray-600">
                <span className="text-yellow-400 text-xs font-bold">{t.day}</span>
                <span className="text-xl font-bold">{gameState.day}</span>
             </div>

             <div className={`flex items-center gap-2 bg-gray-900 px-3 py-1 rounded border ${isHighDrain ? 'border-red-500' : 'border-gray-600'}`}>
                 <Euro size={16} className="text-yellow-500" />
                 <div className="flex flex-col leading-none">
                    <span className="text-[10px] text-gray-400 uppercase">{t.budget}</span>
                    <span className={`font-bold ${isHighDrain ? 'text-red-400' : 'text-white'}`}>{Math.floor(gameState.budget)}€</span>
                 </div>
             </div>

             <div className="flex items-center gap-2 bg-gray-900 px-3 py-1 rounded border border-gray-600">
                 <Shield size={16} className="text-emerald-500" />
                 <div className="flex flex-col leading-none">
                    <span className="text-[10px] text-gray-400 uppercase">{t.autonomy}</span>
                    <span className="font-bold text-white">{Math.floor(gameState.autonomy)}%</span>
                 </div>
             </div>

             <div className="hidden md:flex items-center gap-2 bg-gray-900 px-3 py-1 rounded border border-gray-600">
                 <Leaf size={16} className={isEcoTax ? "text-red-500" : "text-blue-500"} />
                 <div className="flex flex-col leading-none">
                    <span className="text-[10px] text-gray-400 uppercase">{t.carbon}</span>
                    <span className="font-bold text-white">{Math.floor(gameState.carbon)}</span>
                 </div>
             </div>

             <div className="hidden md:flex items-center gap-2 bg-gray-900 px-3 py-1 rounded border border-gray-600">
                 <AlertTriangle size={16} className={isMaintenanceHell ? "text-red-500" : "text-orange-500"} />
                 <div className="flex flex-col leading-none">
                    <span className="text-[10px] text-gray-400 uppercase">{t.techDebt}</span>
                    <span className="font-bold text-white">{Math.floor(gameState.techDebt)}</span>
                 </div>
             </div>
         </div>

         {/* Controls */}
         <div className="flex gap-2">
            <button 
                onClick={togglePause} 
                disabled={gameState.gameOver || gameState.victory}
                className={`flex items-center gap-1 px-3 py-1 rounded font-bold text-sm transition-colors ${gameState.paused ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-yellow-600 hover:bg-yellow-500'}`}
            >
                {gameState.paused ? <Play size={14} /> : <Pause size={14} />}
                <span className="hidden sm:inline">{gameState.paused ? t.resume : t.pause}</span>
            </button>
            {(gameState.gameOver || gameState.victory) && (
                <button onClick={restartGame} className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded font-bold text-sm">
                    <RefreshCw size={14} /> {t.restart}
                </button>
            )}
         </div>
      </div>
      
      {/* Status Alerts Bar */}
      {(isEcoTax || isMaintenanceHell || isGreenBonus || licenseDrain > 0) && (
          <div className="bg-gray-900/50 p-1 flex flex-wrap gap-2 justify-center text-[10px] border-b border-gray-700 shrink-0">
               {licenseDrain > 0 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-red-900/30 border border-red-800 rounded text-red-300">
                        <RefreshCw size={10} className="animate-spin-slow" />
                        {t.licenseDrain} (-{licenseDrain}€/s)
                    </div>
                )}
                {isEcoTax && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-red-900/40 border border-red-700 rounded text-red-300 animate-pulse">
                        <TrendingDown size={10} />
                        {t.ecoTax} (-5€/s)
                    </div>
                )}
                {isMaintenanceHell && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-900/40 border border-orange-700 rounded text-orange-300 animate-pulse">
                        <AlertOctagon size={10} />
                        {t.maintenanceHell} ({t.multiplier})
                    </div>
                )}
                {isGreenBonus && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-900/40 border border-emerald-700 rounded text-emerald-300">
                        <TrendingUp size={10} />
                        {t.greenBonus} (+2€/s)
                    </div>
                )}
          </div>
      )}

      {/* MAIN CONTENT GRID */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 overflow-hidden">
          
          {/* LEFT: ZONES & UPGRADES */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto min-h-0">
             {ZONES.map(zone => {
                const myUpgrades = gameState.upgrades.filter(u => u.zone === zone.id);
                
                return (
                    <div key={zone.id} className="bg-gray-800 rounded-xl border border-gray-700 flex flex-col shadow-md hover:shadow-xl transition-shadow">
                         <div className="p-3 bg-gray-900/50 border-b border-gray-700 flex items-center gap-3">
                            <div className="p-2 bg-gray-800 rounded-lg border border-gray-600">
                                {getZoneIcon(zone.icon)}
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-white">{zone.name[currentLang]}</h3>
                                <p className="text-[10px] text-gray-400 leading-tight">{zone.description[currentLang]}</p>
                            </div>
                        </div>
                        
                        <div className="p-3 space-y-2">
                            {myUpgrades.map(upgrade => {
                                const effectiveCost = upgrade.cost * costMultiplier;
                                const isAffordable = gameState.budget >= effectiveCost;
                                
                                return (
                                    <div key={upgrade.id} className={`p-2 rounded border ${upgrade.purchased ? 'bg-emerald-900/20 border-emerald-800/50' : 'bg-gray-700/30 border-gray-600'}`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-xs font-bold ${upgrade.purchased ? 'text-emerald-400' : 'text-gray-200'}`}>
                                                {upgrade.name[currentLang]}
                                            </span>
                                            {upgrade.purchased && <CheckCircle2 size={14} className="text-emerald-500" />}
                                        </div>
                                        <p className="text-[10px] text-gray-400 mb-2">{upgrade.description[currentLang]}</p>
                                        
                                        {!upgrade.purchased && (
                                            <button 
                                                onClick={() => buyUpgrade(upgrade)}
                                                disabled={!isAffordable}
                                                className={`w-full py-1 px-2 rounded text-[10px] font-bold flex justify-between items-center ${
                                                    isAffordable 
                                                    ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                                                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                                }`}
                                            >
                                                <span>{t.buy}</span>
                                                <span className={costMultiplier > 1 ? 'text-red-200' : ''}>{effectiveCost}€</span>
                                            </button>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )
             })}
          </div>

          {/* RIGHT: LOGS (Desktop) */}
          <div className="hidden md:flex flex-col w-64 bg-black/50 rounded-xl border border-gray-700 overflow-hidden shrink-0">
              <div className="p-2 bg-gray-800 border-b border-gray-700 text-xs font-mono text-gray-400 uppercase">
                  {t.systemLogs}
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-[10px]">
                  {gameState.logs.map((log) => (
                     <div key={log.id} className="flex gap-2">
                        <span className="text-gray-600 shrink-0">[{String(log.day).padStart(3, '0')}]</span>
                        <span className={
                            log.type === 'success' ? 'text-emerald-400' :
                            log.type === 'danger' ? 'text-red-400' :
                            log.type === 'warning' ? 'text-yellow-400' : 'text-gray-400'
                        }>{log.message}</span>
                     </div>
                  ))}
              </div>
          </div>
      </div>

      {/* MODALS / OVERLAYS */}
      
      {/* Event Modal */}
      {gameState.activeEvent && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-gray-900 border-2 border-red-600 rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95">
                 <div className="bg-red-600 p-3 flex items-center gap-2">
                     <AlertTriangle className="text-white animate-pulse" />
                     <h2 className="font-bold text-white uppercase">{t.alertTitle}</h2>
                 </div>
                 <div className="p-6">
                     <h3 className="text-xl font-bold text-red-500 mb-2">{gameState.activeEvent.title[currentLang]}</h3>
                     <p className="text-gray-300 mb-6 text-sm">{gameState.activeEvent.description[currentLang]}</p>
                     <div className="space-y-3">
                         {gameState.activeEvent.choices.map((choice, idx) => (
                             <button 
                                key={idx}
                                onClick={() => handleEventChoice(choice.cost, idx)}
                                className="w-full text-left p-3 bg-gray-800 border border-gray-600 rounded hover:border-red-500 hover:bg-gray-750 transition-all group"
                             >
                                 <div className="flex justify-between font-bold text-sm mb-1 text-white group-hover:text-red-400">
                                     <span>{choice.text[currentLang]}</span>
                                     {choice.cost > 0 && <span className="text-red-500">-{choice.cost}€</span>}
                                 </div>
                                 {/* Effects Preview */}
                                 <div className="flex gap-2 text-[10px]">
                                     {choice.effect.budget !== 0 && <span className={choice.effect.budget > 0 ? "text-emerald-400" : "text-red-400"}>Budget {choice.effect.budget > 0 ? '+' : ''}{choice.effect.budget}</span>}
                                     {choice.effect.autonomy !== 0 && <span className={choice.effect.autonomy > 0 ? "text-emerald-400" : "text-red-400"}>Autonomy {choice.effect.autonomy > 0 ? '+' : ''}{choice.effect.autonomy}</span>}
                                 </div>
                             </button>
                         ))}
                     </div>
                 </div>
             </div>
          </div>
      )}

      {/* Game Over / Victory */}
      {(gameState.gameOver || gameState.victory) && (
          <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center text-center p-8 animate-in fade-in">
              <h1 className={`text-4xl font-bold mb-4 ${gameState.victory ? 'text-emerald-400' : 'text-red-500'}`}>
                  {gameState.victory ? t.victory : t.gameOver}
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-md">
                  {gameState.victory ? t.victoryDesc : t.gameOverDesc}
              </p>
              <button 
                onClick={restartGame}
                className={`px-8 py-3 rounded-full font-bold text-lg flex items-center gap-2 hover:scale-105 transition-transform ${
                    gameState.victory ? 'bg-emerald-500 text-white' : 'bg-white text-black'
                }`}
              >
                  <RefreshCw /> {t.playAgain}
              </button>
          </div>
      )}

    </div>
  );
};

export default TycoonApp;