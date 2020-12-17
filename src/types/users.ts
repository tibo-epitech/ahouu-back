export type User = {
  id: string
  email: string
  username: string
  picture?: string
  rooms: string[]
  password: string
  token: string
};

export type UserResponse = Omit<User, 'password'>;

export type UserRegisterBody = Pick<User, 'email' | 'username' | 'password' | 'picture'>;
export type UserUpdateBody = Pick<User, 'email' | 'username' | 'password' | 'picture'>;
export type UserSingInBody = Pick<User, 'email' | 'password'>;
