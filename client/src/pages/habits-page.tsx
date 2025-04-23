import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Habit, Completion } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Plus, Edit2, Trash2 } from "lucide-react";
import CreateHabitDialog from "@/components/create-habit-dialog";
import EditHabitDialog from "@/components/edit-habit-dialog";
import {
  apiRequest,
  queryClient,
  useMutationWithInvalidation,
} from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { motion } from "framer-motion";

export default function HabitsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  // Fetch habits
  const { data: habits = [], isLoading: isLoadingHabits } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  // Fetch all completions
  const { data: completions = [], isLoading: isLoadingCompletions } = useQuery<
    Completion[]
  >({
    queryKey: ["/api/completions"],
  });

  const isLoading = isLoadingHabits || isLoadingCompletions;

  // Filter habits based on search
  const filteredHabits = habits.filter(
    (habit) =>
      habit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (habit.description &&
        habit.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group habits by creation date (for "Recently Added" tab)
  const recentlyAddedHabits = [...filteredHabits].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Calculate completion percentage for sorting - improved implementation
  const getCompletionPercentage = (habitId: number | string) => {
    const habitCompletions = completions.filter((c) => c.habitId === habitId);

    // If no completions, return 0
    if (habitCompletions.length === 0) return 0;

    // Calculate completion rate for the last 7 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Track completed days
    let completedDays = 0;

    // Check each of the last 7 days
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      checkDate.setHours(0, 0, 0, 0);

      // Check if any completion exists for this date
      const hasCompletion = habitCompletions.some((completion) => {
        const completionDate = new Date(completion.date);
        completionDate.setHours(0, 0, 0, 0);
        return completionDate.getTime() === checkDate.getTime();
      });

      if (hasCompletion) {
        completedDays++;
      }
    }

    // Return percentage of days completed
    return (completedDays / 7) * 100;
  };

  // Sort by completion percentage (for "Most Consistent" tab)
  const mostConsistentHabits = [...filteredHabits].sort(
    (a, b) => getCompletionPercentage(b.id) - getCompletionPercentage(a.id)
  );

  // Delete habit handler using the mutation utility
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

  // Function to call the mutation
  const deleteHabit = (id: number) => {
    deleteHabitMutation.mutate(id);
  };

  // Function to open edit dialog
  const openEditDialog = (habit: Habit) => {
    setSelectedHabit(habit);
    setShowEditDialog(true);
  };

  // Function to close edit dialog
  const closeEditDialog = () => {
    setShowEditDialog(false);
    setSelectedHabit(null);
  };

  // Render habit list with different sorting
  const renderHabitList = (habits: Habit[]) => {
    if (habits.length === 0) {
      return (
        <div className='text-center py-8'>
          <p className='text-muted-foreground mb-4'>
            {searchTerm
              ? "No habits match your search criteria"
              : "No habits found"}
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className='h-4 w-4 mr-2' />
            Add a Habit
          </Button>
        </div>
      );
    }

    return (
      <div className='space-y-4'>
        {habits.map((habit, index) => {
          const habitCompletions = completions.filter(
            (c) => c.habitId === habit.id
          );
          const completionPercentage = getCompletionPercentage(habit.id);

          return (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * index }}
            >
              <Card>
                <CardContent className='p-4'>
                  <div className='flex items-start justify-between'>
                    <div className='flex items-start space-x-4'>
                      <div
                        className='h-12 w-12 rounded-full flex items-center justify-center mt-1'
                        style={{ backgroundColor: habit.color || "#8b5cf6" }}
                      >
                        <span className='text-white font-semibold text-lg'>
                          {habit.name.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      <div>
                        <h3 className='font-medium text-lg'>{habit.name}</h3>
                        {habit.description && (
                          <p className='text-muted-foreground text-sm'>
                            {habit.description}
                          </p>
                        )}

                        <div className='flex items-center mt-2 space-x-3'>
                          <Badge variant='outline'>
                            Created {formatDate(new Date(habit.createdAt))}
                          </Badge>

                          <Badge
                            variant={
                              completionPercentage >= 70
                                ? "secondary"
                                : completionPercentage >= 30
                                ? "default"
                                : "outline"
                            }
                          >
                            {Math.round(completionPercentage)}% consistent
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className='flex space-x-2'>
                      <Button
                        variant='outline'
                        size='icon'
                        onClick={() => openEditDialog(habit)}
                      >
                        <Edit2 className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='destructive'
                        size='icon'
                        onClick={() => deleteHabit(Number(habit.id))}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>

                  <div className='mt-4'>
                    <div className='w-full bg-gray-200 rounded-full h-2.5 overflow-hidden shadow-inner'>
                      <div
                        className='h-2.5 rounded-full transition-all duration-500 ease-in-out bg-primary'
                        style={{ width: `${completionPercentage}%` }}
                      ></div>
                    </div>
                    {/* <div className='mt-2 grid grid-cols-7 gap-1'>
                      {Array.from({ length: 7 }).map((_, i) => {
                        const date = new Date();
                        date.setDate(date.getDate() - 6 + i);
                        date.setHours(0, 0, 0, 0);

                        const isCompleted = habitCompletions.some((c) => {
                          const completionDate = new Date(c.date);
                          completionDate.setHours(0, 0, 0, 0);
                          return completionDate.getTime() === date.getTime();
                        });

                        return (
                          <div
                            key={i}
                            className={`h-5 rounded-md flex items-center justify-center transition-all duration-300 ${
                              isCompleted
                                ? "bg-primary shadow-sm border border-primary/70"
                                : "bg-gray-100 border border-gray-300 hover:bg-gray-200"
                            }`}
                            title={date.toLocaleDateString()}
                          >
                            {isCompleted && (
                              <div className='w-1.5 h-1.5 bg-white rounded-full'></div>
                            )}
                          </div>
                        );
                      })}
                    </div> */}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <AppLayout>
      <div className='h-full flex flex-col overflow-hidden'>
        <header className='shadow-sm z-10'>
          <div className='flex justify-between items-center py-4 px-4 sm:px-6 lg:px-8'>
            <h1 className='text-xl font-semibold'>All Habits</h1>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className='h-4 w-4 mr-2' />
              New Habit
            </Button>
          </div>
          <div className='px-4 sm:px-6 lg:px-8 pb-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                className='pl-10'
                placeholder='Search habits...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        <div className='flex-1 overflow-y-auto p-4 sm:px-6 lg:px-8'>
          {isLoading ? (
            <div className='flex justify-center items-center h-full'>
              <Loader2 className='h-8 w-8 animate-spin text-primary' />
            </div>
          ) : (
            <Tabs defaultValue='all'>
              <TabsList className='mb-4'>
                <TabsTrigger value='all'>All Habits</TabsTrigger>
                <TabsTrigger value='recent'>Recently Added</TabsTrigger>
                <TabsTrigger value='consistent'>Most Consistent</TabsTrigger>
              </TabsList>

              <TabsContent value='all'>
                {renderHabitList(filteredHabits)}
              </TabsContent>

              <TabsContent value='recent'>
                {renderHabitList(recentlyAddedHabits)}
              </TabsContent>

              <TabsContent value='consistent'>
                {renderHabitList(mostConsistentHabits)}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      <CreateHabitDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      <EditHabitDialog
        open={showEditDialog}
        onOpenChange={(open) => {
          setShowEditDialog(open);
          if (!open) {
            setSelectedHabit(null);
          }
        }}
        habit={selectedHabit}
      />
    </AppLayout>
  );
}
