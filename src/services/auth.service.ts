import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { IUserInput, ILoginInput, IAuthResponse, IUser } from '../types';
import { AppError } from '../utils/appError';

export class AuthService {
  private static generateToken(userId: string, email: string): string {
    return jwt.sign(
      { userId, email },
      process.env.JWT_ACCESS_SECRET!
      // No expiration set
    );
  }

  static async register(userData: IUserInput): Promise<IAuthResponse> {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await User.create({
      ...userData,
      password: hashedPassword,
    }) as IUser;

    const token = this.generateToken(user._id.toString(), user.email);

    const userResponse = user.toObject();
    delete userResponse.password;

    return {
      user: userResponse,
      token
    };
  }

  static async login(loginData: ILoginInput): Promise<IAuthResponse> {
    const user = await User.findOne({ email: loginData.email }) as IUser;
    
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
    
    if (!isPasswordValid) {
      throw new AppError('Incorrect password. Please try again.', 401);
    }

    const token = this.generateToken(user._id.toString(), user.email);

    const userResponse = user.toObject();
    delete userResponse.password;

    return {
      user: userResponse,
      token
    };
  }

  static async logout(userId: string): Promise<void> {
    // Since we're not using refresh tokens anymore, 
    // logout is just a client-side operation
    return;
  }
} 