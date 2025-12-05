export type Language = 'fr' | 'en' | 'zh';

export enum AppID {
  TYCOON = 'tycoon',
  DEFENSE = 'defense',
  INFO = 'info',
  TERMINAL = 'terminal',
  SNAKE = 'snake',
  MUSIC = 'music',
  SETTINGS = 'settings',
}

export interface WindowState {
  id: string;
  appId: AppID;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

export interface Translation {
  [key: string]: {
    fr: string;
    en: string;
    zh: string;
  };
}

export interface AppProps {
  lang: Language;
  closeWindow?: () => void;
  launchApp?: (appId: AppID) => void;
  // New props for Settings
  currentWallpaper?: string;
  setWallpaper?: (url: string) => void;
  resetSystem?: () => void;
}

export interface AppConfig {
  icon: any;
  title: {
    fr: string;
    en: string;
    zh: string;
  };
  defaultWidth: number;
  defaultHeight: number;
  hidden?: boolean;
}