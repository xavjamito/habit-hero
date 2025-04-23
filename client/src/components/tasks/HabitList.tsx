import React, { useState } from "react";
import {
  Search,
  ChevronLeft,
  Home,
  Plus,
  Trash,
  BookOpen,
  ArrowRight,
  CheckCircle,
  Edit2,
  Loader2,
  AlertTriangle,
  Star,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Habit, Completion } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useCreateHabit } from "@/hooks/use-create-habit";
import {
  apiRequest,
  queryClient,
  useMutationWithInvalidation,
} from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type HabitListProps = {
  title?: string;
  showBackButton?: boolean;
};

export function HabitList({
  title = "Daily progress",
  showBackButton = true,
}: HabitListProps) {
  const [, navigate] = useLocation();
  const [filter, setFilter] = React.useState<"all" | "favorite">("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<number | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { open: openCreateHabitDialog } = useCreateHabit();

  // Fetch habits
  const { data: habits = [], isLoading: isLoadingHabits } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  // Fetch completions (today's completions)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: completions = [], isLoading: isLoadingCompletions } = useQuery<
    Completion[]
  >({
    queryKey: [
      "/api/completions",
      { from: today.toISOString(), to: tomorrow.toISOString() },
    ],
  });

  const isLoading = isLoadingHabits || isLoadingCompletions;

  // Filter habits based on search and filter type
  const filteredHabits = habits
    .filter(
      (habit) =>
        habit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (habit.description &&
          habit.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    // Apply the favorite filter
    .filter(
      (habit) => filter === "all" || (filter === "favorite" && habit.isFavorite)
    );

  // Toggle completion mutation
  const toggleCompletionMutation = useMutationWithInvalidation<
    any,
    { habitId: number }
  >(
    async ({ habitId }) => {
      // Check if habit is already completed today
      const existingCompletion = completions.find(
        (c) => Number(c.habitId) === Number(habitId)
      );

      if (existingCompletion) {
        // Delete the completion if it exists
        await apiRequest("DELETE", `/api/completions/${existingCompletion.id}`);
        return null;
      } else {
        // Create a new completion
        const data = {
          habitId: Number(habitId),
          date: new Date().toISOString(),
          // Remove the userId from here, it will be set by the server
        };
        const response = await apiRequest("POST", "/api/completions", data);
        return await response.json();
      }
    },
    ["/api/completions"],
    {
      // Update the cache with the toggled completion
      updateCache: (result, queryKey) => {
        if (queryKey === "/api/completions") {
          // Get current completions from cache
          const currentCompletions =
            queryClient.getQueryData<Completion[]>([queryKey]) || [];

          if (result === null) {
            // Completion was deleted
            queryClient.setQueryData(
              [queryKey],
              currentCompletions.filter(
                (c) => c.habitId !== toggleCompletionMutation.variables?.habitId
              )
            );
          } else {
            // Completion was added
            queryClient.setQueryData(
              [queryKey],
              [...currentCompletions, result]
            );
          }
        }
      },
      onSuccess: () => {
        toast({
          title: "Habit updated",
          description: "Your habit completion status has been updated",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to update habit completion status",
          variant: "destructive",
        });
      },
    }
  );

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutationWithInvalidation<
    any,
    { habitId: number | string }
  >(
    async ({ habitId }) => {
      console.log(`Sending favorite toggle request for habit: ${habitId}`);
      try {
        const response = await apiRequest(
          "PATCH",
          `/api/habits/${habitId}/favorite`,
          {}
        );

        console.log(`Favorite toggle response status: ${response.status}`);
        const data = await response.json();
        console.log(`Favorite toggle response data:`, data);
        return data;
      } catch (error) {
        console.error(`Error in favorite toggle request:`, error);
        // Don't throw the error so we don't show a toast
        return null;
      }
    },
    ["/api/habits"],
    {
      // Update the cache with the toggled favorite
      updateCache: (updatedHabit, queryKey) => {
        // Only update cache if we got a valid response
        if (!updatedHabit) return;

        if (queryKey === "/api/habits") {
          // Get current habits from cache
          const currentHabits =
            queryClient.getQueryData<Habit[]>([queryKey]) || [];

          // Replace the habit with the updated one
          queryClient.setQueryData(
            [queryKey],
            currentHabits.map((habit) =>
              habit.id === updatedHabit.id ? updatedHabit : habit
            )
          );
        }
      },
      onSuccess: (data) => {
        if (!data) return;

        toast({
          title: data.isFavorite
            ? "Added to favorites"
            : "Removed from favorites",
          description: data.isFavorite
            ? `${data.name} has been added to your favorites`
            : `${data.name} has been removed from your favorites`,
        });
      },
      onError: (error) => {
        // Don't show errors for favorite toggle failures
        console.error("Favorite toggle mutation error:", error);
      },
    }
  );

  // Delete habit mutation
  const deleteHabitMutation = useMutationWithInvalidation<void, number>(
    async (id) => {
      await apiRequest("DELETE", `/api/habits/${id}`);
    },
    ["/api/habits", "/api/completions"],
    {
      // Directly update the cache for deleted habits
      updateCache: (_, queryKey) => {
        if (queryKey === "/api/habits") {
          // Get current habits from cache
          const currentHabits =
            queryClient.getQueryData<Habit[]>([queryKey]) || [];
          // Remove the deleted habit
          queryClient.setQueryData(
            [queryKey],
            currentHabits.filter(
              (habit) => habit.id !== deleteHabitMutation.variables
            )
          );
        } else if (queryKey === "/api/completions") {
          // Get current completions from cache
          const currentCompletions =
            queryClient.getQueryData<Completion[]>([queryKey]) || [];
          // Remove completions for the deleted habit
          queryClient.setQueryData(
            [queryKey],
            currentCompletions.filter(
              (completion) =>
                completion.habitId !== deleteHabitMutation.variables
            )
          );
        }
      },
      onSuccess: () => {
        toast({
          title: "Habit deleted",
          description: "The habit has been successfully deleted",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to delete the habit",
          variant: "destructive",
        });
      },
    }
  );

  // Function to check if a habit is completed today
  const isHabitCompletedToday = (habitId: number): boolean => {
    return completions.some(
      (completion) => Number(completion.habitId) === Number(habitId)
    );
  };

  // Get icon based on habit
  const getHabitIcon = (habit: Habit) => {
    const iconClass = "w-5 h-5 text-white";
    return <CheckCircle className={iconClass} />;
  };

  // Function to view habit details
  const viewHabitDetails = (habitId: number) => {
    navigate(`/habits?id=${habitId}`);
  };

  // Function to toggle favorite status
  const toggleFavorite = (habitId: number | string) => {
    toggleFavoriteMutation.mutate({ habitId });
  };

  // Function to open delete confirmation
  const confirmDeleteHabit = (id: number) => {
    setHabitToDelete(id);
    setShowDeleteDialog(true);
  };

  // Function to delete a habit after confirmation
  const deleteHabit = () => {
    if (habitToDelete !== null) {
      deleteHabitMutation.mutate(habitToDelete);
      setShowDeleteDialog(false);
      setHabitToDelete(null);
    }
  };

  // Toggle habit completion
  const toggleHabitCompletion = (habitId: number) => {
    toggleCompletionMutation.mutate({ habitId });
  };

  return (
    <div className='h-full flex flex-col bg-card w-full max-w-md mx-auto rounded-xl overflow-hidden'>
      {/* Header */}
      <div className='px-4 py-3 flex items-center border-b border-border/10'>
        {showBackButton && (
          <Button
            variant='ghost'
            size='icon'
            className='mr-2'
            onClick={() => navigate("/")}
          >
            <ChevronLeft className='h-5 w-5' />
          </Button>
        )}
        <h1 className='text-lg font-semibold flex-1'>{title}</h1>
        <Button variant='ghost' size='icon'>
          <Search className='h-5 w-5' />
        </Button>
        <div className='w-8 h-8 rounded-full overflow-hidden'>
          <img
            src={
              user
                ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${
                    user.username || user.email
                  }`
                : ""
            }
            alt='User avatar'
            className='w-full h-full object-cover'
          />
        </div>
      </div>

      {/* Search */}
      <div className='px-4 py-3'>
        <Input
          placeholder='Search habits'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='bg-secondary/50 border-0'
        />
      </div>

      {/* Filters */}
      <div className='px-4 py-2 flex space-x-2'>
        <Button
          variant={filter === "all" ? "default" : "ghost"}
          className={cn(
            "rounded-full px-4 text-sm",
            filter === "all" ? "" : "text-muted-foreground"
          )}
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        <Button
          variant={filter === "favorite" ? "default" : "ghost"}
          className={cn(
            "rounded-full px-4 text-sm",
            filter === "favorite" ? "" : "text-muted-foreground"
          )}
          onClick={() => setFilter("favorite")}
        >
          Favorite
        </Button>
      </div>

      {/* Habit List */}
      <div className='px-4 py-2 flex-1 overflow-auto'>
        {isLoading ? (
          <div className='flex justify-center items-center h-32'>
            <Loader2 className='h-8 w-8 animate-spin text-primary' />
          </div>
        ) : filteredHabits.length === 0 ? (
          <div className='text-center py-8'>
            <p className='text-muted-foreground mb-4'>
              {searchQuery
                ? "No habits match your search criteria"
                : filter === "favorite"
                ? "No favorite habits found"
                : "No habits found"}
            </p>
            <Button onClick={openCreateHabitDialog}>
              <Plus className='h-4 w-4 mr-2' />
              Add a Habit
            </Button>
          </div>
        ) : (
          <div className='space-y-2'>
            {filteredHabits.map((habit) => {
              const isCompleted = isHabitCompletedToday(Number(habit.id));

              return (
                <div
                  key={habit.id}
                  className='p-4 bg-accent/30 rounded-xl flex items-center group hover:bg-accent/50 transition-colors'
                >
                  <button
                    onClick={() => toggleHabitCompletion(Number(habit.id))}
                    className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center mr-3 transition-colors",
                      isCompleted ? "bg-green-500" : "bg-primary"
                    )}
                    style={{
                      backgroundColor: isCompleted
                        ? "#10b981"
                        : habit.color || "#8b5cf6",
                    }}
                  >
                    {getHabitIcon(habit)}
                  </button>
                  <div className='flex-1'>
                    <div className='flex items-center'>
                      <h3
                        className={cn(
                          "font-medium transition-all",
                          isCompleted && "line-through text-muted-foreground"
                        )}
                      >
                        {habit.name}
                      </h3>
                      {habit.isFavorite && (
                        <Star className='h-4 w-4 ml-2 text-yellow-400 fill-yellow-400' />
                      )}
                    </div>
                    {habit.description && (
                      <p className='text-muted-foreground text-sm'>
                        {habit.description}
                      </p>
                    )}
                  </div>
                  <div className='flex space-x-1'>
                    <Button
                      variant='ghost'
                      size='icon'
                      className={cn(
                        "opacity-0 group-hover:opacity-100 transition-opacity",
                        habit.isFavorite && "text-yellow-400"
                      )}
                      onClick={() => toggleFavorite(habit.id)}
                    >
                      <Star
                        className={cn(
                          "h-4 w-4",
                          habit.isFavorite && "fill-yellow-400"
                        )}
                      />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='opacity-0 group-hover:opacity-100 transition-opacity'
                      onClick={() => viewHabitDetails(Number(habit.id))}
                    >
                      <ArrowRight className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='opacity-0 group-hover:opacity-100 transition-opacity text-destructive'
                      onClick={() => confirmDeleteHabit(Number(habit.id))}
                    >
                      <Trash className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className='px-4 py-3 flex justify-between border-t border-border/10'>
        <Button variant='ghost' size='icon'>
          <Home className='h-5 w-5' />
        </Button>
        <Button
          variant='default'
          size='icon'
          className='rounded-full'
          onClick={openCreateHabitDialog}
        >
          <Plus className='h-5 w-5' />
        </Button>
        <Button variant='ghost' size='icon'>
          <Trash className='h-5 w-5' />
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center'>
              <AlertTriangle className='h-5 w-5 text-destructive mr-2' />
              Delete Habit
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this habit? This action cannot be
              undone. All completion history will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setHabitToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteHabit}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
