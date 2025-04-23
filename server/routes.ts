import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertHabitSchema, insertCompletionSchema } from "@shared/schema";
import prisma from "./prisma";

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
      // Get the data from the request body
      const { name, description, color, favorite } = req.body;
      
      // Create a habit object with required fields
      const habitData = {
        name,
        userId: req.user.id,
        description: description || null,
        color: color || "#8b5cf6",
        isFavorite: favorite || false
      };
      
      console.log('Creating habit with data:', JSON.stringify(habitData));
      
      const habit = await storage.createHabit(habitData);
      res.status(201).json(habit);
    } catch (error) {
      console.error("Error creating habit:", error);
      res.status(400).json({ error: "Invalid habit data" });
    }
  });
  
  app.put("/api/habits/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const habitId = req.params.id;
    const habit = await storage.getHabit(habitId);
    
    if (!habit) {
      return res.status(404).json({ error: "Habit not found" });
    }
    
    if (habit.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: "Not authorized to update this habit" });
    }
    
    try {
      // Only extract valid fields
      const { name, description, color, favorite } = req.body;
      const updatedData: Partial<Omit<typeof habit, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> = {};
      
      if (name !== undefined) updatedData.name = name;
      if (description !== undefined) updatedData.description = description;
      if (color !== undefined) updatedData.color = color;
      if (favorite !== undefined) updatedData.isFavorite = favorite;
      
      console.log(`Updating habit ${habitId} with data:`, JSON.stringify(updatedData));
      
      const updatedHabit = await storage.updateHabit(habitId, updatedData);
      
      if (!updatedHabit) {
        return res.status(500).json({ error: "Failed to update habit" });
      }
      
      res.json(updatedHabit);
    } catch (error) {
      console.error("Error updating habit:", error);
      res.status(400).json({ error: "Invalid habit data" });
    }
  });
  
  app.delete("/api/habits/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const habitId = req.params.id;
    const habit = await storage.getHabit(habitId);
    
    if (!habit) {
      return res.status(404).json({ error: "Habit not found" });
    }
    
    if (habit.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: "Not authorized to delete this habit" });
    }
    
    const success = await storage.deleteHabit(habitId);
    
    if (success) {
      res.sendStatus(204);
    } else {
      res.status(500).json({ error: "Failed to delete habit" });
    }
  });
  
  // Add a special route for toggling favorite status
  app.patch("/api/habits/:id/favorite", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const habitId = req.params.id;
    console.log(`Favorite toggle request for habit ID: ${habitId}`);
    
    try {
      const habit = await storage.getHabit(habitId);
      
      if (!habit) {
        console.error(`Error: Habit with ID ${habitId} not found`);
        return res.status(404).json({ error: "Habit not found" });
      }
      
      console.log(`Found habit: ${habit.name}, current favorite status: ${habit.isFavorite}`);
      console.log(`User ID from habit: ${habit.userId}, User ID from request: ${req.user.id}`);
      
      if (habit.userId.toString() !== req.user.id.toString()) {
        console.error(`Authorization error: Habit belongs to user ${habit.userId}, but request is from user ${req.user.id}`);
        return res.status(403).json({ error: "Not authorized to update this habit" });
      }
      
      // Toggle the favorite status
      const updatedData = {
        isFavorite: !habit.isFavorite
      };
      
      console.log(`Toggling favorite status to: ${updatedData.isFavorite}`);
      
      const updatedHabit = await storage.updateHabit(habitId, updatedData);
      
      if (!updatedHabit) {
        console.error(`Error: Failed to update habit with ID ${habitId}`);
        return res.status(500).json({ error: "Failed to update favorite status" });
      }
      
      console.log(`Successfully updated habit: ${updatedHabit.name}, new favorite status: ${updatedHabit.isFavorite}`);
      res.json(updatedHabit);
    } catch (error) {
      console.error("Error updating habit favorite status:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error details:", errorMessage);
      res.status(500).json({ error: `Failed to update favorite status: ${errorMessage}` });
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
      
      console.log(`Attempting to create completion for habit ID: ${habitId}`);
      
      if (!habitId) {
        console.error("Error: Missing habitId in request");
        return res.status(400).json({ error: "Missing habitId in request" });
      }
      
      // Verify the habit belongs to the user
      const habit = await storage.getHabit(habitId);
      
      // Check if habit exists before comparing userIds
      if (!habit) {
        console.error(`Error getting habit: Habit with ID ${habitId} not found`);
        return res.status(404).json({ error: "Habit not found" });
      }
      
      console.log(`Found habit: ${habit.name}, owned by userId: ${habit.userId}`);
      console.log(`Current user ID: ${req.user.id}`);
      
      if (habit.userId.toString() !== req.user.id.toString()) {
        console.error(`Authorization error: Habit belongs to user ${habit.userId}, but request is from user ${req.user.id}`);
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const completionDate = date ? new Date(date) : new Date();
      
      // Check if completion already exists for this habit and date
      const existingCompletion = await storage.getCompletionByHabitAndDate(habitId, completionDate);
      
      // If we found an existing completion, return it with a 409 status
      // This is not an error condition - just indicating it already exists
      if (existingCompletion) {
        console.log(`Completion already exists for habit ${habitId} on ${completionDate.toDateString()}, returning it`);
        // Return the existing completion with 409 status
        return res.status(409).json(existingCompletion);
      }
      
      // Ensure date is present to avoid TypeScript errors
      const completionData = {
        habitId,
        userId: req.user.id,
        date: completionDate
      };
      
      console.log(`Creating completion for habit ${habitId} on ${completionDate.toDateString()}`);
      const completion = await storage.createCompletion(completionData);
      console.log(`Successfully created completion: ${completion.id}`);
      res.status(201).json(completion);
    } catch (error) {
      console.error("Error creating completion:", error);
      res.status(400).json({ error: "Invalid completion data" });
    }
  });
  
  app.delete("/api/completions/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const completionId = req.params.id;
      console.log(`Delete completion request for ID: ${completionId}`);
      
      // Get completions for the user
      const userCompletions = await storage.getCompletions(req.user.id);
      
      // Find the specific completion
      const completion = userCompletions.find(c => c.id.toString() === completionId);
      
      if (!completion) {
        console.log(`Completion not found: ${completionId}`);
        return res.status(404).json({ error: "Completion not found" });
      }
      
      // At this point we know the user owns the completion since we filtered by user ID
      const success = await storage.deleteCompletion(completionId);
      
      if (success) {
        console.log(`Successfully deleted completion: ${completionId}`);
        res.sendStatus(204);
      } else {
        console.error(`Failed to delete completion: ${completionId}`);
        res.status(500).json({ error: "Failed to delete completion" });
      }
    } catch (error) {
      console.error("Error deleting completion:", error);
      res.status(500).json({ error: "Failed to delete completion" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
