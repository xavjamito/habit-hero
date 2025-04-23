import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Drizzle schema definitions (for PostgreSQL, not used in MongoDB)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  password: true,
  name: true,
  email: true,
});

// Modified User type to work with both MongoDB and PostgreSQL
export type User = {
  id: string | number;
  username?: string;
  password: string;
  name: string | null;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type InsertUser = z.infer<typeof insertUserSchema>;

// Drizzle schema definitions (for PostgreSQL)
export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").notNull().default("#8b5cf6"),
  favorite: boolean("favorite").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertHabitSchema = createInsertSchema(habits).pick({
  userId: true,
  name: true,
  description: true,
  color: true,
  favorite: true,
});

// Modified Habit type to work with both MongoDB and PostgreSQL
export type Habit = {
  id: string | number;
  userId: string | number;
  name: string;
  description: string | null;
  color: string | null;
  isFavorite: boolean;
  favorite?: boolean; // Alias for compatibility with current code
  createdAt: Date;
  updatedAt?: Date;
};

export type InsertHabit = z.infer<typeof insertHabitSchema>;

// Drizzle schema definitions (for PostgreSQL)
export const completions = pgTable("completions", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").notNull(),
  userId: integer("user_id").notNull(),
  date: timestamp("date").defaultNow().notNull(),
});

export const insertCompletionSchema = createInsertSchema(completions).pick({
  habitId: true,
  userId: true,
  date: true,
});

// Modified Completion type to work with both MongoDB and PostgreSQL
export type Completion = {
  id: string | number;
  habitId: string | number;
  userId: string | number;
  date: Date;
  createdAt?: Date;
};

export type InsertCompletion = z.infer<typeof insertCompletionSchema>;
