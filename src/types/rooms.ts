export type Room = {
  id: string
  admin?: string
  name: string
  max: number
  players: Player[]
  state: RoomState
  private: boolean
  password?: string
  adminTurn: 'sleep' |'vote' | 'init' | 'none'
  votes: {
    wolfs: Record<string, string>
    witch?: string
    villagers: Record<string, string>
  }
};

export enum RoomState {
  LOBBY = 'lobby',
  STARTED = 'started',
  FINISHED = 'finished',
}

export type Player = {
  username: string
  picture?: string
  role: PlayerRole
  state: PlayerState
  messages: Message[]
  connected: boolean
  potion?: boolean
};

export enum PlayerState {
  WAITING_IN_LOBBY = 'waiting-in-lobby',
  AWAKE = 'awake',
  SLEEPING = 'sleeping',
  ROLE_BASED_ACTION = 'role-base-action',
  DEAD = 'dead',
  WINNER = 'winner',
  LOOSER = 'looser',
}

export enum PlayerRole {
  NONE = 'none',
  VILLAGER = 'villager',
  WOLF = 'wolf',
  SEER = 'seer',
  WITCH = 'witch',
}

export type Message = {
  id: string
  type: MessageType
  username?: string
  timestamp?: number
  payload?: Record<string, string>
  content: string
};

export enum MessageType {
  GENERAL = 'general',
  WOLF = 'wolf',
  SYSTEM_GENERAL = 'system-general',
  SYSTEM_SELF = 'system-self',
  SYSTEM_WOLF = 'system-wolf',
}

export type RoomResponse = Omit<Room, 'password'>;
export type RoomCreateBody = Pick<Room, 'name' | 'max' | 'password'>;
export type RoomGetOneBody = { id: string };
export type RoomGetManyBody = { limit?: number, page?: number };

export enum MessageEvents {
  INITIAL_ADMIN = 'initial-admin',
  NUMBER_OF_WOLFS = 'number-of-wolfs',
  WAITING_FOR_INITIAL_ACTION = 'waiting-for-initial-action',
  ADMIN_START_GAME = 'admin-start-game',
  ADMIN_LAUNCH_VOTES = 'admin-launch-votes',
  NEW_ADMIN = 'new-admin',
  VILLAGE_SLEEPING = 'village-sleeping',
  VILLAGE_WAKES_UP = 'village-wakes-up',
  SEER_WAKES_UP = 'seer-wakes-up',
  SEER_SELECT_CHOICE = 'seer-select-choice',
  SEER_RESULT = 'seer-result',
  SEER_SLEEPS = 'seer-sleeps',
  WOLFS_WAKES_UP = 'wolfs-wakes-up',
  WOLFS_SELECT_CHOICE = 'wolfs-select-choice',
  WOLF_SLEEPS = 'wolf-sleeps',
  WITCH_WAKES_UP = 'witch-wakes-up',
  WITCH_SELECT_CHOICE = 'witch-select-choice',
  WITCH_SLEEPS = 'witch-sleeps',
  PLAYER_DIED = 'player-died',
  WOLF_WIN = 'wolf-win',
  VILLAGE_WIN = 'village-win',
}

export type RoomEvents =
  'connect' |
  'disconnect' |
  'connect_error' |
  'admin-change' |
  'user-kicked' |
  'user-joined' |
  'user-leaved' |
  'new-message' |
  'game-started' |
  'your-turn' |
  'village-sleeps' |
  'village-awakes' |
  'village-vote' |
  'seer-wakes-up' |
  'seer-sleeps' |
  'wolfs-wakes-up' |
  'wolfs-sleeps' |
  'witch-wakes-up' |
  'witch-sleeps' |
  'game-ended';

export type RoomTurn =
  'put-to-sleep' |
  'launch-vote';

export type RoomActions =
  'kick-user' |
  'send-message' |
  'game-start' |
  'seer-vote' |
  'wolf-vote' |
  'witch-vote' |
  'put-village-to-sleep' |
  'user-vote' |
  'disconnecting';
