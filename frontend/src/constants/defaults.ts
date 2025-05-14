import { GameSettings } from '../types/index.js';

// Default game settings
export const DEFAULT_GAME_SETTINGS: GameSettings = {
  board_color: '#000000',
  paddle_color: '#FFFFFF',
  ball_color: '#FFFFFF',
  score_color: '#FFFFFF'
};

// Default achievements 
export const DEFAULT_ACHIEVEMENTS = [
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
    description: "Win 5 games in a row",
    icon: "fas fa-fire",
    completed: false
  },
  {
    id: 3,
    name: "Social Butterfly",
    description: "Add 5 friends",
    icon: "fas fa-users",
    completed: false
  },
  {
    id: 4,
    name: "Tournament Finalist",
    description: "Reach the finals in a tournament",
    icon: "fas fa-award",
    completed: false
  }
];

// User profile defaults
export const DEFAULT_COVER_PHOTO = "https://placehold.co/1200x300/7c00e3/ffffff?text=Game+Profile";
export const DEFAULT_AVATAR = "https://placehold.co/150x150/1d1f21/ffffff?text=Avatar";