export interface IUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'admin';
  createdAt: string;
}

export interface IAuthResponse {
  accessToken: string;
  user: IUser;
}
