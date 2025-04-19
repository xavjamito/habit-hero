import { useState } from "react";
import { Habit, Completion } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  apiRequest,
  queryClient,
  useMutationWithInvalidation,
} from "@/lib/queryClient";
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

  // Calculate the weekly progress (for the last 7 days)
  const weeklyProgress = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      return date;
    });

    return last7Days.map((date) => {
      const isCompleted = habitCompletions.some((completion) => {
        const completionDate = new Date(completion.date);
        completionDate.setHours(0, 0, 0, 0);
        return completionDate.getTime() === date.getTime();
      });

      return {
        date,
        isCompleted,
      };
    });
  })();

  // Calculate completion percentage based on weekly progress
  const completionPercentage = Math.round(
    (weeklyProgress.filter((day) => day.isCompleted).length / 7) * 100
  );

  // Calculate streak
  const calculateStreak = () => {
    // Sort completions by date in descending order (newest first)
    const sortedCompletions = [...habitCompletions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    if (sortedCompletions.length === 0) return 0;

    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if there's a completion for today
    const todayCompleted = sortedCompletions.some((completion) => {
      const completionDate = new Date(completion.date);
      completionDate.setHours(0, 0, 0, 0);
      return completionDate.getTime() === today.getTime();
    });

    if (!todayCompleted) {
      // Check if there's a completion for yesterday to continue the streak
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const yesterdayCompleted = sortedCompletions.some((completion) => {
        const completionDate = new Date(completion.date);
        completionDate.setHours(0, 0, 0, 0);
        return completionDate.getTime() === yesterday.getTime();
      });

      if (!yesterdayCompleted) return 0; // Break streak if neither today nor yesterday completed
    }

    // Calculate consecutive days
    for (let i = 0; i < 365; i++) {
      // Cap at 365 days to prevent infinite loop
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      checkDate.setHours(0, 0, 0, 0);

      const hasCompletion = sortedCompletions.some((completion) => {
        const completionDate = new Date(completion.date);
        completionDate.setHours(0, 0, 0, 0);
        return completionDate.getTime() === checkDate.getTime();
      });

      if (hasCompletion) {
        currentStreak++;
      } else {
        break; // Break the streak when we find a day without completion
      }
    }

    return currentStreak;
  };

  const currentStreak = calculateStreak();

  // Toggle completion mutation
  const toggleCompletion = useMutationWithInvalidation<any, void>(
    async () => {
      try {
        if (isCompleted) {
          // Find the completion ID for today
          const today = new Date();
          const todayStr = today.toDateString();

          const completion = habitCompletions.find((c) => {
            const completionDate = new Date(c.date);
            const dateStr = completionDate.toDateString();
            return (
              dateStr === todayStr &&
              c.habitId.toString() === habit.id.toString()
            );
          });

          if (completion) {
            await apiRequest("DELETE", `/api/completions/${completion.id}`);
            return {
              wasCompleted: true,
              completionId: completion.id,
              habitId: habit.id,
            };
          } else {
            return { wasCompleted: false };
          }
        } else {
          // Create new completion
          const response = await apiRequest("POST", "/api/completions", {
            habitId: habit.id,
            date: new Date(),
          });

          if (response.status === 409) {
            return { wasCompleted: false, alreadyCompleted: true };
          }

          const newCompletion = await response.json();
          return { wasCompleted: false, newCompletion, habitId: habit.id };
        }
      } catch (error: any) {
        console.error("Error in toggle completion:", error);
        throw error;
      }
    },
    ["/api/completions"],
    {
      // Directly update the completions cache
      updateCache: (result, queryKey) => {
        if (queryKey === "/api/completions") {
          // Get current completions from cache
          const completions =
            queryClient.getQueryData<Completion[]>([queryKey]) || [];

          if (result.wasCompleted && result.completionId) {
            // If we deleted a completion, remove it from cache
            queryClient.setQueryData(
              [queryKey],
              completions.filter((c) => c.id !== result.completionId)
            );
          } else if (result.newCompletion) {
            // If we added a completion, add it to cache
            queryClient.setQueryData(
              [queryKey],
              [...completions, result.newCompletion]
            );
          }
        }
      },
      onSuccess: (result) => {
        if (!result.alreadyCompleted) {
          toast({
            title: result.wasCompleted ? "Habit unmarked" : "Habit completed!",
            description: result.wasCompleted
              ? "You've unmarked this habit for today."
              : "Great job! Keep up the good work!",
          });
        }
      },
      onError: (error: any) => {
        console.error("Error toggling completion:", error);
        let errorMessage = error.message;

        // Check for specific error codes
        if (errorMessage && errorMessage.includes("409")) {
          errorMessage = "This habit is already completed for today.";
        }

        toast({
          title: "Error",
          description: `Failed to ${
            isCompleted ? "unmark" : "complete"
          } habit: ${errorMessage}`,
          variant: "destructive",
        });
      },
    }
  );

  // Delete habit mutation
  const deleteHabit = useMutationWithInvalidation<any, void>(
    async () => {
      await apiRequest("DELETE", `/api/habits/${habit.id}`);
    },
    ["/api/habits", "/api/completions"],
    {
      onSuccess: () => {
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
    }
  );

  // Animation for check mark
  const checkVariants = {
    checked: {
      pathLength: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
    unchecked: {
      pathLength: 0,
    },
  };

  return (
    <div className='bg-white rounded-lg shadow p-4 transition-all hover:translate-y-[-2px] duration-300'>
      <div className='flex justify-between items-start'>
        <div className='flex-1'>
          <div className='flex items-center'>
            <button
              className={`h-6 w-6 rounded-full border-2 flex items-center justify-center mr-3 transition-colors ${
                isCompleted
                  ? "border-secondary bg-green-500"
                  : "border-gray-300 hover:border-secondary"
              }`}
              onClick={() => toggleCompletion.mutate()}
              disabled={toggleCompletion.isPending}
            >
              {isCompleted && (
                <motion.svg
                  className='h-4 w-4 text-secondary'
                  viewBox='0 0 24 24'
                  fill='currentColor'
                  xmlns='http://www.w3.org/2000/svg'
                  initial='unchecked'
                  animate='checked'
                >
                  <motion.path
                    d='M5 12L10 17L20 7'
                    stroke='currentColor'
                    strokeWidth='3'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    variants={checkVariants}
                  />
                </motion.svg>
              )}
            </button>
            <div>
              <h3 className='font-medium text-foreground'>{habit.name}</h3>
              <p className='text-sm text-muted-foreground'>
                {habit.description || "No description"}
              </p>
            </div>
          </div>
        </div>

        <div className='flex items-center'>
          <div className='flex items-center mr-3'>
            <span
              className={`text-sm font-medium ${
                currentStreak > 0 ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {currentStreak > 0
                ? `${currentStreak} day streak`
                : "No streak yet"}
            </span>
            <div
              className={`ml-1.5 ${
                currentStreak > 0 ? "text-accent" : "text-destructive"
              }`}
            >
              {currentStreak > 0 ? (
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-4 w-4'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
                  />
                </svg>
              ) : (
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-4 w-4'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M13 17h8m0 0V9m0 8l-8-8-4 4-6-6'
                  />
                </svg>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='text-muted-foreground hover:text-foreground'
              >
                <MoreVertical className='h-5 w-5' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem
                onClick={() => deleteHabit.mutate()}
                className='text-destructive'
              >
                Delete Habit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className='mt-3'>
        <div className='w-full bg-gray-200 rounded-full h-2.5 overflow-hidden shadow-inner'>
          <div
            className='h-2.5 rounded-full transition-all duration-500 ease-in-out bg-primary'
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        {/* <div className='mt-2 grid grid-cols-7 gap-1'>
          {weeklyProgress.map((day, index) => (
            <div
              key={index}
              className={`h-5 rounded-md flex items-center justify-center transition-all duration-300 ${
                day.isCompleted
                  ? "bg-primary shadow-sm border border-primary/70"
                  : "bg-gray-100 border border-gray-300 hover:bg-gray-200"
              }`}
              title={day.date.toLocaleDateString()}
            >
              {day.isCompleted && (
                <div className='w-1.5 h-1.5 bg-white rounded-full'></div>
              )}
            </div>
          ))}
        </div> */}
      </div>
    </div>
  );
}
