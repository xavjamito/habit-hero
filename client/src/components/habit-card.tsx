import { useState } from "react";
import { Habit, Completion } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";

interface HabitCardProps {
  habit: Habit;
  isCompleted: boolean;
}

export default function HabitCard({ habit, isCompleted }: HabitCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch completions for this habit
  const { data: habitCompletions = [] } = useQuery<Completion[]>({
    queryKey: ["/api/completions"],
    select: (data) => data.filter((c) => c.habitId === habit.id),
  });
  
  // Calculate streak
  // This is a simplified version - a real app would have more complex streak logic
  const calculateStreak = () => {
    const sortedCompletions = [...habitCompletions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    if (sortedCompletions.length === 0) return 0;
    
    // Simple streak counting logic
    // In a real app, we'd check for consecutive days
    return sortedCompletions.length;
  };
  
  const streak = calculateStreak();
  
  // Toggle completion mutation
  const toggleCompletion = useMutation({
    mutationFn: async () => {
      if (isCompleted) {
        try {
          // Find the completion ID for today
          const today = new Date();
          const todayStr = today.toDateString();
          
          console.log("Finding completion for today:", todayStr);
          console.log("Available completions:", habitCompletions);
          
          const completion = habitCompletions.find(c => {
            const completionDate = new Date(c.date);
            const dateStr = completionDate.toDateString();
            console.log(`Comparing ${dateStr} with ${todayStr}, habitId: ${c.habitId}, matching habit: ${c.habitId.toString() === habit.id.toString()}`);
            return dateStr === todayStr && c.habitId.toString() === habit.id.toString();
          });
          
          console.log("Found completion:", completion);
          
          if (completion) {
            console.log("Deleting completion:", completion.id);
            await apiRequest("DELETE", `/api/completions/${completion.id}`);
            return { wasCompleted: true };
          } else {
            console.log("No completion found to delete");
            // Instead of throwing an error, we'll just return that it was already uncompleted
            return { wasCompleted: false };
          }
        } catch (error) {
          console.error("Error deleting completion:", error);
          // If there was an error but it was a 404, that means the completion was already deleted
          // We'll treat this as a success
          if (error.message && error.message.includes("404")) {
            return { wasCompleted: false };
          }
          throw error;
        }
      } else {
        // Create new completion
        console.log("Creating new completion for habit:", habit.id);
        const response = await apiRequest("POST", "/api/completions", {
          habitId: habit.id,
          date: new Date(),
        });
        return { wasCompleted: false, newCompletion: await response.json() };
      }
    },
    onSuccess: (result) => {
      // Invalidate completions query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/completions"] });
      
      toast({
        title: result.wasCompleted ? "Habit unmarked" : "Habit completed!",
        description: result.wasCompleted 
          ? "You've unmarked this habit for today." 
          : "Great job! Keep up the good work!",
      });
    },
    onError: (error) => {
      console.error("Error toggling completion:", error);
      toast({
        title: "Error",
        description: `Failed to ${isCompleted ? "unmark" : "complete"} habit: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Delete habit mutation
  const deleteHabit = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/habits/${habit.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      toast({
        title: "Habit deleted",
        description: "The habit has been successfully removed",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete habit: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Weekly progress
  // Get the last 7 days of completions for UI display
  const weeklyProgress = [...Array(7)].map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + i);
    
    return habitCompletions.some(
      (c) => new Date(c.date).toDateString() === date.toDateString()
    );
  });
  
  // Calculate completion percentage
  const completionPercentage = Math.round(
    (weeklyProgress.filter(Boolean).length / 7) * 100
  );
  
  // Animation for check mark
  const checkVariants = {
    checked: {
      pathLength: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    unchecked: {
      pathLength: 0
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 transition-all hover:translate-y-[-2px] duration-300">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center">
            <button 
              className={`h-6 w-6 rounded-full border-2 flex items-center justify-center mr-3 transition-colors ${
                isCompleted ? "border-secondary" : "border-gray-300 hover:border-secondary"
              }`}
              onClick={() => toggleCompletion.mutate()}
              disabled={toggleCompletion.isPending}
            >
              {isCompleted && (
                <motion.svg 
                  className="h-4 w-4 text-secondary"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  initial="unchecked"
                  animate="checked"
                >
                  <motion.path
                    d="M5 12L10 17L20 7"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    variants={checkVariants}
                  />
                </motion.svg>
              )}
            </button>
            <div>
              <h3 className="font-medium text-foreground">{habit.name}</h3>
              <p className="text-sm text-muted-foreground">{habit.description || "No description"}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="flex items-center mr-3">
            <span className={`text-sm font-medium ${streak > 0 ? "text-accent" : "text-muted-foreground"}`}>
              {streak > 0 ? `${streak} day streak` : "No streak yet"}
            </span>
            <div className={`ml-1.5 ${streak > 0 ? "text-accent" : "text-destructive"}`}>
              {streak > 0 ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => deleteHabit.mutate()}
                className="text-destructive"
              >
                Delete Habit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="mt-3">
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className="bg-secondary h-1.5 rounded-full" 
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        <div className="mt-1 grid grid-cols-7 gap-0.5">
          {weeklyProgress.map((isCompleted, index) => (
            <div 
              key={index}
              className={`h-1.5 rounded-sm ${isCompleted ? 'bg-secondary' : 'bg-gray-200'}`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
