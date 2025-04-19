import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertHabitSchema, insertCompletionSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Habit Routes
  app.get("/api/habits", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const habits = await storage.getHabits(req.user.id);
    res.json(habits);
  });
  
  app.post("/api/habits", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const habitData = insertHabitSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const habit = await storage.createHabit(habitData);
      res.status(201).json(habit);
    } catch (error) {
      res.status(400).json({ error: "Invalid habit data" });
    }
  });
  
  app.put("/api/habits/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const habitId = parseInt(req.params.id);
    const habit = await storage.getHabit(habitId);
    
    if (!habit) {
      return res.status(404).json({ error: "Habit not found" });
    }
    
    if (habit.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to update this habit" });
    }
    
    try {
      // Only extract valid fields
      const { name, description, color } = req.body;
      const updatedData: Partial<typeof req.body> = {};
      
      if (name !== undefined) updatedData.name = name;
      if (description !== undefined) updatedData.description = description;
      if (color !== undefined) updatedData.color = color;
      
      const updatedHabit = await storage.updateHabit(habitId, updatedData);
      res.json(updatedHabit);
    } catch (error) {
      res.status(400).json({ error: "Invalid habit data" });
    }
  });
  
  app.delete("/api/habits/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const habitId = parseInt(req.params.id);
    const habit = await storage.getHabit(habitId);
    
    if (!habit) {
      return res.status(404).json({ error: "Habit not found" });
    }
    
    if (habit.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to delete this habit" });
    }
    
    const success = await storage.deleteHabit(habitId);
    
    if (success) {
      res.sendStatus(204);
    } else {
      res.status(500).json({ error: "Failed to delete habit" });
    }
  });
  
  // Completion Routes
  app.get("/api/completions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const { from, to } = req.query;
    let fromDate: Date | undefined;
    let toDate: Date | undefined;
    
    if (from && typeof from === 'string') {
      fromDate = new Date(from);
    }
    
    if (to && typeof to === 'string') {
      toDate = new Date(to);
    }
    
    const completions = await storage.getCompletions(req.user.id, fromDate, toDate);
    res.json(completions);
  });
  
  app.post("/api/completions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { habitId, date } = req.body;
      
      // Verify the habit belongs to the user
      const habit = await storage.getHabit(habitId);
      if (!habit || habit.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const completionDate = date ? new Date(date) : new Date();
      
      // Check if completion already exists for this habit and date
      const existingCompletion = await storage.getCompletionByHabitAndDate(habitId, completionDate);
      if (existingCompletion) {
        return res.status(409).json({ error: "Completion already exists for this date" });
      }
      
      const completionData = insertCompletionSchema.parse({
        habitId,
        userId: req.user.id,
        date: completionDate
      });
      
      const completion = await storage.createCompletion(completionData);
      res.status(201).json(completion);
    } catch (error) {
      res.status(400).json({ error: "Invalid completion data" });
    }
  });
  
  app.delete("/api/completions/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const completionId = parseInt(req.params.id);
    const completion = Array.from(storage['completions'].values()).find(c => c.id === completionId);
    
    if (!completion) {
      return res.status(404).json({ error: "Completion not found" });
    }
    
    if (completion.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to delete this completion" });
    }
    
    const success = await storage.deleteCompletion(completionId);
    
    if (success) {
      res.sendStatus(204);
    } else {
      res.status(500).json({ error: "Failed to delete completion" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
