import { IStorage } from './storage';
import prisma from './prisma';
import session from 'express-session';
import { type User, type Habit, type Completion } from '@shared/schema';
import connectMongo from 'connect-mongo';

const MongoStore = connectMongo;

export class PrismaStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    console.log("PrismaStorage constructor - DATABASE_URL:", process.env.DATABASE_URL ? "exists" : "missing");
    if (process.env.DATABASE_URL) {
      console.log("MongoDB URL (first 20 chars):", process.env.DATABASE_URL.substring(0, 20) + "...");
    }
    
    this.sessionStore = new MongoStore({
      mongoUrl: process.env.DATABASE_URL,
      collectionName: 'sessions',
    });
    
    console.log("MongoDB session store initialized");
  }

  // User operations
  async getUser(id: number | string): Promise<User | undefined> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: id.toString() },
      });
      return user ?? undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const user = await prisma.user.findUnique({
        where: { username },
      });
      return user ?? undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      return user ?? undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      console.log('PrismaStorage: Creating user with data:', { 
        ...userData, 
        password: '[REDACTED]' 
      });
      
      // Ensure username exists (required by Prisma)
      // If no username is provided, generate one from the email
      const dataWithUsername = {
        ...userData,
        username: userData.username || `user_${userData.email.split('@')[0]}_${Math.floor(Math.random() * 10000)}`
      };
      
      const newUser = await prisma.user.create({
        data: dataWithUsername,
      });
      console.log('PrismaStorage: User created successfully with ID:', newUser.id);
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      // If we get a connection error, throw it so our fallback can handle it
      throw error;
    }
  }

  // Habit operations
  async getHabits(userId: number | string): Promise<Habit[]> {
    try {
      console.log('PrismaStorage: Getting habits for userId:', userId.toString());
      
      // For MongoDB, we need to use string comparison for userId
      const habits = await prisma.habit.findMany({
        where: { 
          userId: userId.toString() 
        },
        orderBy: { createdAt: 'desc' },
      });
      
      console.log(`PrismaStorage: Found ${habits.length} habits for user ${userId}`);
      return habits;
    } catch (error) {
      console.error('Error getting habits:', error);
      return [];
    }
  }

  async getHabit(id: number | string): Promise<Habit | undefined> {
    try {
      console.log(`PrismaStorage: Getting habit with ID: ${id}`);
      
      if (!id) {
        console.error('Error getting habit: ID is undefined or null');
        return undefined;
      }
      
      const habit = await prisma.habit.findUnique({
        where: { id: id.toString() },
      });
      
      if (!habit) {
        console.log(`PrismaStorage: No habit found with ID: ${id}`);
        return undefined;
      }
      
      console.log(`PrismaStorage: Found habit: ${habit.name}`);
      return habit;
    } catch (error) {
      console.error(`Error getting habit with ID ${id}:`, error);
      return undefined;
    }
  }

  async createHabit(habitData: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>): Promise<Habit> {
    try {
      return await prisma.habit.create({
        data: {
          ...habitData,
          userId: habitData.userId.toString(),
        },
      });
    } catch (error) {
      console.error('Error creating habit:', error);
      throw error;
    }
  }

  async updateHabit(
    id: number | string, 
    habitUpdate: Partial<Omit<Habit, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<Habit | undefined> {
    try {
      console.log(`PrismaStorage: Updating habit with ID: ${id}`);
      console.log(`Update data:`, JSON.stringify(habitUpdate));
      
      return await prisma.habit.update({
        where: { id: id.toString() },
        data: habitUpdate,
      });
    } catch (error) {
      console.error('Error updating habit:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return undefined;
    }
  }

  async deleteHabit(id: number | string): Promise<boolean> {
    try {
      await prisma.habit.delete({
        where: { id: id.toString() },
      });
      return true;
    } catch (error) {
      console.error('Error deleting habit:', error);
      return false;
    }
  }

  // Completion operations
  async getCompletions(
    userId: number | string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<Completion[]> {
    try {
      const where: any = { userId: userId.toString() };
      
      if (fromDate || toDate) {
        where.date = {};
        if (fromDate) where.date.gte = fromDate;
        if (toDate) where.date.lte = toDate;
      }

      return await prisma.completion.findMany({
        where,
        orderBy: { date: 'desc' },
      });
    } catch (error) {
      console.error('Error getting completions:', error);
      return [];
    }
  }

  async getCompletionByHabitAndDate(
    habitId: number | string,
    date: Date
  ): Promise<Completion | undefined> {
    try {
      // Create start and end of the day for date comparison
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const completion = await prisma.completion.findFirst({
        where: {
          habitId: habitId.toString(),
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });
      
      return completion ?? undefined;
    } catch (error) {
      console.error('Error getting completion by habit and date:', error);
      return undefined;
    }
  }

  async createCompletion(
    completionData: Omit<Completion, 'id' | 'createdAt'>
  ): Promise<Completion> {
    try {
      return await prisma.completion.create({
        data: {
          ...completionData,
          habitId: completionData.habitId.toString(),
          userId: completionData.userId.toString(),
        },
      });
    } catch (error) {
      console.error('Error creating completion:', error);
      throw error;
    }
  }

  async deleteCompletion(id: number | string): Promise<boolean> {
    try {
      await prisma.completion.delete({
        where: { id: id.toString() },
      });
      return true;
    } catch (error) {
      console.error('Error deleting completion:', error);
      return false;
    }
  }
}