import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types';

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [13, 'Age must be at least 13'],
      max: [120, 'Age must be less than 120']
    },
    nativeLanguage: {
      type: String,
      required: [true, 'Native language is required'],
      trim: true
    },
    englishProficiency: {
      type: String,
      required: [true, 'English proficiency level is required'],
      enum: ['Beginner', 'Intermediate', 'Upper Intermediate'],
      trim: true
    },
    streak: {
      type: Number,
      default: 0
    },
    lastOpened: {
      type: Date,
      default: Date.now
    },
    xpPoint: {
      type: Number,
      default: 0,
      min: [0, 'XP points cannot be negative']
    }
  },
  {
    timestamps: true,
  }
);

// Remove sensitive fields when converting to JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

export const User = mongoose.model<IUser>('User', userSchema); 