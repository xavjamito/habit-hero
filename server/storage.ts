import { users, type User, type InsertUser, habits, type Habit, type InsertHabit, completions, type Completion, type InsertCompletion } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { PrismaStorage } from './prisma-storage';

const MemoryStore = createMemoryStore(session);

// modify the interface with any CRUD methods
// you might need

// Updated IStorage interface to work with both PostgreSQL and MongoDB types
export interface IStorage {
  getUser(id: number | string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Habits
  getHabits(userId: number | string): Promise<Habit[]>;
  getHabit(id: number | string): Promise<Habit | undefined>;
  createHabit(habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>): Promise<Habit>;
  updateHabit(id: number | string, habit: Partial<Omit<Habit, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<Habit | undefined>;
  deleteHabit(id: number | string): Promise<boolean>;
  
  // Completions
  getCompletions(userId: number | string, fromDate?: Date, toDate?: Date): Promise<Completion[]>;
  getCompletionByHabitAndDate(habitId: number | string, date: Date): Promise<Completion | undefined>;
  createCompletion(completion: Omit<Completion, 'id' | 'createdAt'>): Promise<Completion>;
  deleteCompletion(id: number | string): Promise<boolean>;
  
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private habits: Map<number, Habit>;
  private completions: Map<number, Completion>;
  sessionStore: session.Store;
  userIdCounter: number;
  habitIdCounter: number;
  completionIdCounter: number;

  constructor() {
    this.users = new Map();
    this.habits = new Map();
    this.completions = new Map();
    this.userIdCounter = 1;
    this.habitIdCounter = 1;
    this.completionIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Habits
  async getHabits(userId: number): Promise<Habit[]> {
    return Array.from(this.habits.values()).filter(
      (habit) => habit.userId === userId,
    );
  }
  
  async getHabit(id: number): Promise<Habit | undefined> {
    return this.habits.get(id);
  }
  
  async createHabit(insertHabit: InsertHabit): Promise<Habit> {
    const id = this.habitIdCounter++;
    const createdAt = new Date();
    const habit: Habit = {
      ...insertHabit,
      id,
      createdAt,
      description: insertHabit.description || null,
      color: insertHabit.color || "#8b5cf6"
    };
    this.habits.set(id, habit);
    return habit;
  }
  
  async updateHabit(id: number, habitUpdate: Partial<InsertHabit>): Promise<Habit | undefined> {
    const habit = this.habits.get(id);
    if (!habit) return undefined;
    
    const updatedHabit: Habit = { ...habit, ...habitUpdate };
    this.habits.set(id, updatedHabit);
    return updatedHabit;
  }
  
  async deleteHabit(id: number): Promise<boolean> {
    return this.habits.delete(id);
  }
  
  // Completions
  async getCompletions(userId: number, fromDate?: Date, toDate?: Date): Promise<Completion[]> {
    let completions = Array.from(this.completions.values()).filter(
      (completion) => completion.userId === userId,
    );
    
    if (fromDate) {
      completions = completions.filter(completion => {
        const completionDate = new Date(completion.date);
        return completionDate >= fromDate;
      });
    }
    
    if (toDate) {
      completions = completions.filter(completion => {
        const completionDate = new Date(completion.date);
        return completionDate <= toDate;
      });
    }
    
    return completions;
  }
  
  async getCompletionByHabitAndDate(habitId: number, date: Date): Promise<Completion | undefined> {
    const dateString = date.toDateString();
    return Array.from(this.completions.values()).find(
      (completion) => {
        return completion.habitId === habitId && new Date(completion.date).toDateString() === dateString;
      }
    );
  }
  
  async createCompletion(insertCompletion: InsertCompletion): Promise<Completion> {
    const id = this.completionIdCounter++;
    
    // Ensure date is always present
    const date = insertCompletion.date || new Date();
    
    const completion: Completion = { 
      ...insertCompletion, 
      id,
      date
    };
    
    this.completions.set(id, completion);
    return completion;
  }
  
  async deleteCompletion(id: number): Promise<boolean> {
    return this.completions.delete(id);
  }
}

// You can swap between in-memory storage or database storage here
// Use MemStorage for development and testing
// Use PrismaStorage for production with MongoDB

// Function to create the appropriate storage based on environment
function createStorage(): IStorage {
  try {
    // If the DATABASE_URL is available and valid, use PrismaStorage
    if (process.env.DATABASE_URL) {
      console.log("Using PrismaStorage with MongoDB");
      return new PrismaStorage();
    } else {
      console.log("DATABASE_URL not available, falling back to MemStorage");
      return new MemStorage();
    }
  } catch (error) {
    console.error("Error initializing PrismaStorage:", error);
    console.log("Falling back to MemStorage");
    return new MemStorage();
  }
}

export const storage = createStorage();
