import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertHabitSchema } from "@shared/schema";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Extend the schema for the form
const habitFormSchema = insertHabitSchema.omit({ userId: true }).extend({
  name: z.string().min(1, "Habit name is required"),
  // Color will be handled through state, keeping it optional in the form
  color: z.string().optional(),
});

type HabitFormValues = z.infer<typeof habitFormSchema>;

// Predefined colors for habit
const habitColors = [
  "#8b5cf6", // primary (default)
  "#10b981", // secondary
  "#f59e0b", // accent
  "#3b82f6", // info
  "#ef4444", // danger
  "#64748b", // gray
];

interface CreateHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateHabitDialog({
  open,
  onOpenChange,
}: CreateHabitDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedColor, setSelectedColor] = useState(habitColors[0]);
  const [repeatOption, setRepeatOption] = useState<string>("everyday");
  const [enableReminders, setEnableReminders] = useState(false);

  // Form setup
  const form = useForm<HabitFormValues>({
    resolver: zodResolver(habitFormSchema),
    defaultValues: {
      name: "",
      description: "",
      color: selectedColor,
    },
  });

  // Create habit mutation
  const createHabit = useMutation({
    mutationFn: async (values: HabitFormValues) => {
      if (!user) throw new Error("User not authenticated");

      // Add the user ID and selected color
      const habitData = {
        ...values,
        userId: user.id,
        color: selectedColor,
      };

      const res = await apiRequest("POST", "/api/habits", habitData);
      return await res.json();
    },
    onSuccess: () => {
      // Reset form and close dialog
      form.reset();
      // Invalidate habits query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      onOpenChange(false);
      
      toast({
        title: "Habit created",
        description: "Your new habit has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create habit",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: HabitFormValues) => {
    createHabit.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Add New Habit</DialogTitle>
          <DialogDescription>
            Create a new habit to track your progress
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Habit Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Morning Meditation" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. 10 minutes of mindfulness" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
              <FormLabel>Repeat</FormLabel>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={repeatOption === "everyday" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRepeatOption("everyday")}
                  className="rounded-full"
                >
                  Every day
                </Button>
                <Button
                  type="button"
                  variant={repeatOption === "weekdays" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRepeatOption("weekdays")}
                  className="rounded-full"
                >
                  Weekdays
                </Button>
                <Button
                  type="button"
                  variant={repeatOption === "weekends" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRepeatOption("weekends")}
                  className="rounded-full"
                >
                  Weekends
                </Button>
                <Button
                  type="button"
                  variant={repeatOption === "custom" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRepeatOption("custom")}
                  className="rounded-full"
                >
                  Custom
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <FormLabel>Color</FormLabel>
              <div className="flex gap-2">
                {habitColors.map((color) => (
                  <motion.button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full ${
                      selectedColor === color ? "ring-2 ring-offset-2" : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  />
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <FormLabel>Reminders</FormLabel>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="reminder-toggle"
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  checked={enableReminders}
                  onChange={(e) => setEnableReminders(e.target.checked)}
                />
                <label
                  htmlFor="reminder-toggle"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Enable reminders
                </label>
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createHabit.isPending}
              >
                {createHabit.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Add Habit"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
