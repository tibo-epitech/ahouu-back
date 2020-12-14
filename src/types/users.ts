export type User = {
  id: string
  email: string
  username: string
  picture?: string
  rooms: string[]
  password: string
  token: string
};

export type UserResponse = Omit<User, 'password'>
