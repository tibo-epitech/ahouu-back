export * from './users';
export * from './rooms';

export type Collections = 'users' | 'rooms';

export type Config = {
  api: {
    url: string
  }
};
