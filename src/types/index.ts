import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  profilePhoto?: string;
  age: number;
  nativeLanguage: string;
  englishProficiency: string;
  streak: number;
  lastOpened: Date;
  xpPoint: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserInput {
  name: string;
  email: string;
  password: string;
  profilePhoto?: string;
  age: number;
  nativeLanguage: string;
  englishProficiency: string;
}

export interface ILoginInput {
  email: string;
  password: string;
}

export interface IAuthResponse {
  user: Omit<IUser, 'password'>;
  token: string;
}

export interface IJwtPayload {
  userId: string;
  email: string;
} 