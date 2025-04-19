import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Habit } from "@shared/schema";
import { z } from "zod";
import {
  apiRequest,
  queryClient,
  useMutationWithInvalidation,
} from "@/lib/queryClient";
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

// Schema for editing a habit
const habitEditSchema = z.object({
  name: z.string().min(1, "Habit name is required"),
  description: z.string().optional(),
  color: z.string().optional(),
});

type HabitEditValues = z.infer<typeof habitEditSchema>;

// Predefined colors for habit
const habitColors = [
  "#8b5cf6", // purple
  "#10b981", // green
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#ef4444", // red
  "#64748b", // slate
];

interface EditHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit: Habit | null;
}

export default function EditHabitDialog({
  open,
  onOpenChange,
  habit,
}: EditHabitDialogProps) {
  const { toast } = useToast();
  const [selectedColor, setSelectedColor] = useState(habitColors[0]);

  // Form setup
  const form = useForm<HabitEditValues>({
    resolver: zodResolver(habitEditSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "",
    },
  });

  // Update form when habit changes
  useEffect(() => {
    if (habit) {
      form.reset({
        name: habit.name,
        description: habit.description || "",
        color: habit.color || habitColors[0],
      });
      setSelectedColor(habit.color || habitColors[0]);
    }
  }, [habit, form]);

  // Edit habit mutation
  const editHabit = useMutationWithInvalidation<Habit, void>(
    async () => {
      if (!habit) throw new Error("No habit selected for editing");

      const habitData = {
        ...form.getValues(),
        color: selectedColor,
      };

      const res = await apiRequest("PUT", `/api/habits/${habit.id}`, habitData);
      return await res.json();
    },
    ["/api/habits"],
    {
      // Directly update the habits cache
      updateCache: (updatedHabit, queryKey) => {
        if (queryKey === "/api/habits") {
          // Get current habits from cache
          const currentHabits =
            queryClient.getQueryData<Habit[]>([queryKey]) || [];

          // Replace the updated habit in the list
          const updatedHabits = currentHabits.map((h) =>
            h.id === updatedHabit.id ? updatedHabit : h
          );

          queryClient.setQueryData([queryKey], updatedHabits);
        }
      },
      onSuccess: () => {
        // Reset form and close dialog
        form.reset();
        onOpenChange(false);

        toast({
          title: "Habit updated",
          description: "Your habit has been updated successfully",
        });
      },
      onError: (error: Error) => {
        toast({
          title: "Failed to update habit",
          description: error.message || "Please try again later",
          variant: "destructive",
        });
      },
    }
  );

  // Form submission handler
  const onSubmit = (values: HabitEditValues) => {
    editHabit.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-lg font-semibold'>
            Edit Habit
          </DialogTitle>
          <DialogDescription>Update your habit details</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Habit Name</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g. Morning Meditation' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='e.g. 10 minutes of mindfulness'
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='space-y-2'>
              <FormLabel>Color</FormLabel>
              <div className='flex gap-2'>
                {habitColors.map((color) => (
                  <motion.button
                    key={color}
                    type='button'
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

            <DialogFooter className='mt-6'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={editHabit.isPending}>
                {editHabit.isPending ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
