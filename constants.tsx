import React from 'react';
import { AppID, Translation, AppConfig } from './types';
import { TrendingUp, ShieldAlert, BookOpen, Terminal, Ghost, Music, Settings } from 'lucide-react';

export const APP_CONFIG: Record<AppID, AppConfig> = {
  [AppID.TYCOON]: {
    icon: <TrendingUp className="w-full h-full text-nird-green" />,
    title: { fr: 'NIRD Tycoon', en: 'NIRD Tycoon', zh: 'NIRD 大亨' },
    defaultWidth: 800,
    defaultHeight: 600,
  },
  [AppID.DEFENSE]: {
    icon: <ShieldAlert className="w-full h-full text-red-500" />,
    title: { fr: 'Tower Defense', en: 'Tower Defense', zh: '塔防' },
    defaultWidth: 1000,
    defaultHeight: 800,
  },
  [AppID.INFO]: {
    icon: <BookOpen className="w-full h-full text-blue-400" />,
    title: { fr: 'Info NIRD', en: 'Info NIRD', zh: 'NIRD 信息' },
    defaultWidth: 700,
    defaultHeight: 500,
  },
  [AppID.TERMINAL]: {
    icon: <Terminal className="w-full h-full text-gray-300" />,
    title: { fr: 'Terminal', en: 'Terminal', zh: '终端' },
    defaultWidth: 600,
    defaultHeight: 400,
  },
  [AppID.SNAKE]: {
    icon: <Ghost className="w-full h-full text-purple-400" />,
    title: { fr: 'Hidden Snake', en: 'Hidden Snake', zh: '贪吃蛇' },
    defaultWidth: 500,
    defaultHeight: 500,
    hidden: true,
  },
  [AppID.MUSIC]: {
    icon: <Music className="w-full h-full text-pink-400" />,
    title: { fr: 'NIRD Beats', en: 'NIRD Beats', zh: 'NIRD 音乐' },
    defaultWidth: 400,
    defaultHeight: 300,
  },
  [AppID.SETTINGS]: {
    icon: <Settings className="w-full h-full text-slate-200" />,
    title: { fr: 'Paramètres', en: 'Settings', zh: '设置' },
    defaultWidth: 600,
    defaultHeight: 500,
  },
};

export const TRANSLATIONS: Translation = {
  // OS
  'os.booting': { fr: 'Initialisation du noyau NIRD...', en: 'Initializing NIRD Kernel...', zh: '正在初始化 NIRD 内核...' },
  'os.start': { fr: 'Démarrer', en: 'Start', zh: '开始' },
  'os.shutdown': { fr: 'Éteindre', en: 'Shutdown', zh: '关机' },
  
  // Info App
  'info.tab1': { fr: 'Le Problème', en: 'The Problem', zh: '问题' },
  'info.tab2': { fr: 'La Solution', en: 'The Solution', zh: '解决方案' },
  'info.tab3': { fr: 'Agir', en: 'Act Now', zh: '行动' },
  'info.p1.title': { fr: 'La fin de Windows 10', en: 'Windows 10 EOL', zh: 'Windows 10 终止支持' },
  'info.p1.content': { 
    fr: 'L\'obsolescence programmée menace des millions de PC scolaires. La dépendance aux géants du web crée des déchets électroniques massifs.', 
    en: 'Planned obsolescence threatens millions of school PCs. Big Tech dependency creates massive e-waste.', 
    zh: '计划报废威胁着数百万台学校电脑。对大型科技公司的依赖造成了巨大的电子垃圾。' 
  },
  'info.p2.title': { fr: 'NIRD: Inclusif, Responsable, Durable', en: 'NIRD: Inclusive, Responsible, Sustainable', zh: 'NIRD: 包容、负责、可持续' },
  'info.p2.content': { 
    fr: 'Comme le village d\'Astérix, nous résistons ! NIRD est un OS léger basé sur Linux qui redonne vie au vieux matériel.', 
    en: 'Like the Asterix village, we resist! NIRD is a lightweight Linux-based OS that revives old hardware.', 
    zh: '就像阿斯特里克斯村一样，我们在抵抗！NIRD 是一个基于 Linux 的轻量级操作系统，可以让旧硬件重获新生。' 
  },
  
  // Tycoon
  'tycoon.budget': { fr: 'Budget', en: 'Budget', zh: '预算' },
  'tycoon.autonomy': { fr: 'Autonomie', en: 'Autonomy', zh: '自主权' },
  'tycoon.upgrade': { fr: 'Améliorer le Matériel', en: 'Upgrade Hardware', zh: '升级硬件' },
  'tycoon.event': { fr: 'ALERTE BIG TECH', en: 'BIG TECH ALERT', zh: '大型科技警报' },
  
  // Defense
  'defense.wave': { fr: 'Vague', en: 'Wave', zh: '波次' },
  'defense.lives': { fr: 'Vies', en: 'Lives', zh: '生命' },
  'defense.money': { fr: 'Crédits', en: 'Credits', zh: '积分' },
  'defense.start': { fr: 'Lancer la Vague', en: 'Start Wave', zh: '开始波次' },
  'defense.gameover': { fr: 'ÉCHEC DE LA SÉCURITÉ', en: 'SECURITY BREACH', zh: '安全漏洞' },
  'defense.win': { fr: 'SYSTÈME SÉCURISÉ', en: 'SYSTEM SECURED', zh: '系统安全' },
  'defense.subtitle': { fr: 'Défendez les données des étudiants !', en: 'Defend Student Data from Big Tech!', zh: '保护学生数据免受大型科技公司侵害！' },
  'defense.tux': { fr: 'Tourelle Tux', en: 'Tux Turret', zh: 'Tux 炮塔' },
  'defense.firewall': { fr: 'Pare-feu', en: 'Firewall', zh: '防火墙' },
  'defense.recycler': { fr: 'Recycleur', en: 'Recycler', zh: '回收站' },

  // Terminal
  'term.welcome': { fr: 'Bienvenue sur NIRD OS v1.0. Tapez "help" pour l\'aide.', en: 'Welcome to NIRD OS v1.0. Type "help".', zh: '欢迎使用 NIRD OS v1.0。输入 "help"。' },
  'term.prompt': { fr: 'utilisateur@nird-ecole:~$', en: 'user@nird-school:~$', zh: '用户@nird-school:~$' },

  // Music
  'music.nowplaying': { fr: 'En lecture :', en: 'Now Playing:', zh: '正在播放：' },
  'music.playlist': { fr: 'Liste de lecture', en: 'Playlist', zh: '播放列表' },

  // Settings
  'settings.wallpaper': { fr: 'Fond d\'écran', en: 'Wallpaper', zh: '壁纸' },
  'settings.system': { fr: 'Système', en: 'System', zh: '系统' },
  'settings.reset': { fr: 'Réinitialisation d\'usine', en: 'Factory Reset', zh: '恢复出厂设置' },
  'settings.resetdesc': { fr: 'Attention: Ceci effacera toute la progression.', en: 'Warning: This will wipe all progress.', zh: '警告：这将清除所有进度。' },
  'settings.matrix': { fr: 'Matrice', en: 'The Matrix', zh: '黑客帝国' },
  'settings.forest': { fr: 'Forêt Numérique', en: 'Digital Forest', zh: '数字森林' },
  'settings.school': { fr: 'Lycée (Réel)', en: 'Real School', zh: '真实学校' },
};

export const MUSIC_TRACKS = [
  {
    title: "Cyber City",
    artist: "NIRD Beats",
    src: "https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3", // Royalty Free Synthwave
  },
  {
    title: "Pixel Forest",
    artist: "Retro Chip",
    src: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3", // 8-bit style
  },
  {
    title: "Resistance Radio",
    artist: "Lo-Fi Underground",
    src: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3", // Chill Lo-fi
  }
];

export const WALLPAPERS = [
  { id: 'matrix', name: 'settings.matrix', url: 'url("https://media.giphy.com/media/u4MK5pGSX0wuk/giphy.gif")' }, // Matrix rain
  { id: 'forest', name: 'settings.forest', url: 'url("https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1920&auto=format&fit=crop")' }, // Dark Forest
  { id: 'school', name: 'settings.school', url: 'url("https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1920&auto=format&fit=crop")' }, // School Hallway
];