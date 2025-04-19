import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Habit, Completion } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/ui/sidebar";
import BottomNavbar from "@/components/ui/bottom-navbar";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { format, isSameDay, startOfMonth, endOfMonth } from "date-fns";
import { motion } from "framer-motion";

export default function CalendarPage() {
  const { user } = useAuth();
  const [date, setDate] = useState<Date>(new Date());

  // Calculate month range
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);

  // Fetch habits
  const { data: habits = [], isLoading: isLoadingHabits } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  // Fetch completions for selected month
  const { data: completions = [], isLoading: isLoadingCompletions } = useQuery<
    Completion[]
  >({
    queryKey: [
      "/api/completions",
      { from: monthStart.toISOString(), to: monthEnd.toISOString() },
    ],
  });

  // Group completions by date
  const completionsByDate = completions.reduce<Record<string, Completion[]>>(
    (acc, completion) => {
      const dateStr = new Date(completion.date).toDateString();
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(completion);
      return acc;
    },
    {}
  );

  // Selected day completions
  const selectedDayCompletions = completions.filter((completion) =>
    isSameDay(new Date(completion.date), date)
  );

  const isLoading = isLoadingHabits || isLoadingCompletions;

  // Helper function to find habit name by ID
  const getHabitName = (habitId: number) => {
    const habit = habits.find((h) => h.id === habitId);
    return habit ? habit.name : "Unknown Habit";
  };

  // Helper function to calculate completion percentage for each day
  const getDayCompletionInfo = (day: Date) => {
    const dayStr = day?.toDateString();
    const dayCompletions = completionsByDate[dayStr] || [];
    const completedCount = dayCompletions.length;
    const percentage =
      habits.length > 0
        ? Math.round((completedCount / habits.length) * 100)
        : 0;

    return {
      completedCount,
      totalCount: habits.length,
      percentage,
    };
  };

  return (
    <div className='flex flex-col md:flex-row h-screen overflow-hidden'>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className='flex-1 flex flex-col overflow-hidden'>
        {/* Header */}
        <header className='bg-white shadow-sm z-10'>
          <div className='flex justify-between items-center py-4 px-4 sm:px-6 lg:px-8'>
            <h1 className='text-xl font-semibold flex items-center'>
              <CalendarIcon className='mr-2 h-5 w-5' />
              Calendar View
            </h1>
            <div className='text-sm text-muted-foreground'>
              {format(date, "MMMM yyyy")}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className='flex-1 overflow-y-auto p-4 sm:p-6 lg:px-8 bg-background'>
          {isLoading ? (
            <div className='flex justify-center items-center h-full'>
              <Loader2 className='h-8 w-8 animate-spin text-primary' />
            </div>
          ) : (
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              {/* Calendar View */}
              <motion.div
                className='lg:col-span-2'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Habit Calendar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode='single'
                      selected={date}
                      onSelect={(date) => date && setDate(date)}
                      className='rounded-md border'
                      components={{
                        DayContent: (props) => {
                          const day = props.date;
                          const { percentage, completedCount, totalCount } =
                            getDayCompletionInfo(day);

                          // Skip showing info for days without habits or outside current month
                          if (
                            totalCount === 0 ||
                            day?.getMonth() !== date.getMonth()
                          ) {
                            return <div>{format(day, "d")}</div>;
                          }

                          // Color based on completion percentage
                          let bgColorClass = "bg-gray-100";

                          if (completedCount > 0) {
                            if (percentage === 100) {
                              bgColorClass = "bg-green-100 text-green-800";
                            } else if (percentage >= 50) {
                              bgColorClass = "bg-yellow-100 text-yellow-800";
                            } else {
                              bgColorClass = "bg-orange-100 text-orange-800";
                            }
                          }

                          return (
                            <div className='flex flex-col items-center justify-center h-full w-full'>
                              <div>{format(day, "d")}</div>
                            </div>
                          );
                        },
                      }}
                    />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Selected Day Details */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>{format(date, "EEEE, MMMM d, yyyy")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {habits.length === 0 ? (
                      <div className='text-center py-6'>
                        <p className='text-muted-foreground mb-4'>
                          You haven't created any habits yet.
                        </p>
                        <Button>Create Habit</Button>
                      </div>
                    ) : selectedDayCompletions.length === 0 ? (
                      <div className='text-center py-6'>
                        <p className='text-muted-foreground'>
                          No completed habits on this day.
                        </p>
                      </div>
                    ) : (
                      <ul className='space-y-2'>
                        {selectedDayCompletions.map((completion) => (
                          <li
                            key={completion.id}
                            className='flex items-center p-3 bg-green-50 rounded-md'
                          >
                            <div className='h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3'>
                              <svg
                                xmlns='http://www.w3.org/2000/svg'
                                className='h-5 w-5 text-green-600'
                                viewBox='0 0 20 20'
                                fill='currentColor'
                              >
                                <path
                                  fillRule='evenodd'
                                  d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                                  clipRule='evenodd'
                                />
                              </svg>
                            </div>
                            <span className='font-medium'>
                              {getHabitName(Number(completion.habitId))}
                            </span>
                            <span className='ml-auto text-sm text-muted-foreground'>
                              {format(new Date(completion.date), "h:mm a")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className='mt-6 pt-4 border-t'>
                      <h3 className='font-medium mb-2'>Summary</h3>
                      <div className='grid grid-cols-2 gap-4'>
                        <div className='bg-gray-50 p-3 rounded-md'>
                          <p className='text-sm text-muted-foreground'>
                            Completion
                          </p>
                          <p className='text-2xl font-semibold'>
                            {habits.length > 0
                              ? `${Math.round(
                                  (selectedDayCompletions.length /
                                    habits.length) *
                                    100
                                )}%`
                              : "0%"}
                          </p>
                        </div>
                        <div className='bg-gray-50 p-3 rounded-md'>
                          <p className='text-sm text-muted-foreground'>
                            Completed
                          </p>
                          <p className='text-2xl font-semibold'>
                            {selectedDayCompletions.length}/{habits.length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navbar */}
      <BottomNavbar currentPath='/calendar' />
    </div>
  );
}
