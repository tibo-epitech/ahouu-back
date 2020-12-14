export * from './users';
export * from './rooms';

export enum Collections {
  USERS = 'users',
  ROOMS = 'rooms',
}

export type Config = {
  api: {
    url: string
  }
};
