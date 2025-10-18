import mongoose, { Schema, Model, Document } from 'mongoose';

export interface UserProfile {
  age?: number;
  height?: number;
  weight?: number;
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  goals?: string[];
}

export interface UserSubscription {
  plan: 'free' | 'foundations' | 'advanced' | 'custom';
  status: 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trialing';
  startDate?: Date | null;
  endDate?: Date | null;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
}

export interface UserStats {
  totalWorkouts: number;
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate?: Date | null;
}

export interface IUser extends Document {
  name: string;
  email: string;
  avatar?: string;
  role: 'customer' | 'admin';
  isActive: boolean;
  subscription: UserSubscription;
  profile: UserProfile;
  stats: UserStats;
  assignedPrograms?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
  email: { type: String, required: true, lowercase: true, trim: true },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  isActive: { type: Boolean, default: true },
  subscription: {
    plan: { type: String, enum: ['free', 'foundations', 'advanced', 'custom'], default: 'free' },
    status: { type: String, enum: ['active', 'inactive', 'cancelled', 'past_due', 'trialing'], default: 'inactive' },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    currentPeriodStart: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null },
    cancelAtPeriodEnd: { type: Boolean, default: false }
  },
  profile: {
    age: { type: Number, min: 13, max: 100 },
    height: { type: Number, min: 100, max: 250 },
    weight: { type: Number, min: 30, max: 300 },
    fitnessLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    goals: [{ type: String }]
  },
  stats: {
    totalWorkouts: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastWorkoutDate: { type: Date, default: null }
  },
  assignedPrograms: [{ type: Schema.Types.ObjectId, ref: 'Program' }]
}, { timestamps: true });

UserSchema.index({ email: 1 });
UserSchema.index({ createdAt: -1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;


