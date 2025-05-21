import { Achievement, GameSettings, UserProfile, UserStats } from '../types/index.js';

// Default game settings
export const DEFAULT_GAME_SETTINGS: GameSettings = {
  board_color: '#000000',
  paddle_color: '#FFFFFF',
  ball_color: '#FFFFFF',
  score_color: '#FFFFFF',
  powerup: false,
};

// Default achievements 
export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 1,
    name: "First Victory",
    description: "Win your first game",
    icon: "fas fa-trophy",
    completed: false,
    translations: {
      spanish: {
        description: "Gana tu primera partida"
      },
      german: {
        description: "Gewinne dein erstes Spiel"
      }
    }
  },
  {
    id: 2,
    name: "On Fire",
    description: "Win 3 games in a row",
    icon: "fas fa-fire",
    completed: false,
    translations: {
      spanish: {
        description: "Gana 3 partidas seguidas"
      },
      german: {
        description: "Gewinne 3 Spiele in Folge"
      }
    }
  },
  {
    id: 3,
    name: "Social Butterfly",
    description: "Add 3 friends",
    icon: "fas fa-users",
    completed: false,
    translations: {
      spanish: {
        description: "Agrega 3 amigos"
      },
      german: {
        description: "Füge 3 Freunde hinzu"
      }
    }
  },
];


// NULL_USER to be used for default initialization
export const NULL_USER: UserProfile = {
  id: -1,
  username: 'NULL_USER',
  password: undefined,
  display_name: 'NULL_USER',
  email: undefined,
  bio: undefined,
  avatar_url: undefined,
  cover_photo_url: undefined,
  join_date: undefined,
  has_two_factor_auth: undefined,
  stats: undefined,
  match_history: undefined,
  achievements: undefined,
  friends: undefined,
  friend_requests: undefined,
  game_settings: undefined,
  notifications: undefined,
  status: 'offline',
  last_active: '',
};

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
