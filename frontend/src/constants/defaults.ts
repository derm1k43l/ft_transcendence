import { Achievement, GameSettings, UserStats } from '../types/index.js';

// Default game settings
export const DEFAULT_GAME_SETTINGS: GameSettings = {
  board_color: '#000000',
  paddle_color: '#FFFFFF',
  ball_color: '#FFFFFF',
  score_color: '#FFFFFF'
};

// Default achievements 
export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 1,
    name: "First Victory",
    description: "Win your first game",
    icon: "fas fa-trophy",
    completed: false
  },
  {
    id: 2,
    name: "On Fire",
    description: "Win 3 games in a row",
    icon: "fas fa-fire",
    completed: false
  },
  {
    id: 3,
    name: "Social Butterfly",
    description: "Add 3 friends",
    icon: "fas fa-users",
    completed: false
  },
];

// Default user stats 
export const DEFAULT_STATS: UserStats = {
    played: 0,
    wins: 0,
    losses: 0,
    winrate: 0,
    rank: 'Bronze',
    level: 1,
  };

// User profile defaults
export const DEFAULT_COVER_PHOTO = "https://placehold.co/1200x300/7c00e3/ffffff?text=Game+Profile";
export const DEFAULT_AVATAR = "https://placehold.co/150x150/1d1f21/ffffff?text=Avatar";
