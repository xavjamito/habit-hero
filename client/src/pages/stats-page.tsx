import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Habit, Completion } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  BarChart2,
  TrendingUp,
  Calendar,
  Activity,
} from "lucide-react";
import { calculateCompletionPercentage, calculateStreak } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  subMonths,
  startOfMonth,
  addDays,
  isSameDay,
} from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

export default function StatsPage() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("week");

  // Get date ranges
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const monthStart = startOfMonth(today);
  const lastMonth = startOfMonth(subMonths(today, 1));

  // Fetch habits
  const { data: habits = [], isLoading: isLoadingHabits } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  // Fetch completions
  const { data: completions = [], isLoading: isLoadingCompletions } = useQuery<
    Completion[]
  >({
    queryKey: ["/api/completions"],
  });

  const isLoading = isLoadingHabits || isLoadingCompletions;

  // Process data for charts
  const getWeeklyData = () => {
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return days.map((day) => {
      const dayCompletions = completions.filter((c) =>
        isSameDay(new Date(c.date), day)
      );

      return {
        name: format(day, "EEE"),
        completed: dayCompletions.length,
        total: habits.length,
        date: day,
      };
    });
  };

  const getMonthlyData = () => {
    // Group by weeks in the month
    const weeks = [];
    let currentWeekStart = monthStart;

    while (currentWeekStart <= today) {
      const weekEnd = addDays(currentWeekStart, 6);
      const weekCompletions = completions.filter((c) => {
        const date = new Date(c.date);
        return date >= currentWeekStart && date <= weekEnd;
      });

      weeks.push({
        name: `Week ${weeks.length + 1}`,
        completed: weekCompletions.length,
        total: habits.length * 7, // total possible completions for the week
        date: currentWeekStart,
      });

      currentWeekStart = addDays(weekEnd, 1);
    }

    return weeks;
  };

  // Get habit completion data
  const getHabitCompletionData = () => {
    return habits.map((habit) => {
      const habitCompletions = completions.filter(
        (c) => c.habitId === habit.id
      );
      const percentage = calculateCompletionPercentage(
        habitCompletions.map((c) => new Date(c.date))
      );

      return {
        name: habit.name,
        value: percentage,
        color: habit.color,
      };
    });
  };

  // Prepare streak data
  const getStreakData = () => {
    return habits
      .map((habit) => {
        const habitCompletions = completions
          .filter((c) => c.habitId === habit.id)
          .map((c) => new Date(c.date));

        const streak = calculateStreak(habitCompletions);

        return {
          name: habit.name,
          streak,
          color: habit.color,
        };
      })
      .sort((a, b) => b.streak - a.streak);
  };

  // Calculate overall stats
  const totalCompletions = completions.length;
  const totalPossibleCompletions = habits.length * 7; // Last 7 days
  const overallCompletionRate =
    totalPossibleCompletions > 0
      ? Math.round((totalCompletions / totalPossibleCompletions) * 100)
      : 0;

  const longestStreak =
    habits.length > 0 ? Math.max(...getStreakData().map((d) => d.streak)) : 0;

  const weeklyData = getWeeklyData();
  const monthlyData = getMonthlyData();
  const habitCompletionData = getHabitCompletionData();
  const streakData = getStreakData();

  // Helper function to get chart data based on selected time range
  const getChartData = () => {
    return timeRange === "week" ? weeklyData : monthlyData;
  };

  // Most consistent habit
  const mostConsistentHabit =
    habitCompletionData.length > 0
      ? habitCompletionData.reduce((prev, current) =>
          prev.value > current.value ? prev : current
        )
      : null;

  return (
    <AppLayout>
      <div className='flex-1 flex flex-col overflow-hidden'>
        <header className='shadow-sm z-10'>
          <div className='flex justify-between items-center py-4 px-4 sm:px-6 lg:px-8'>
            <h1 className='text-xl font-semibold flex items-center'>
              <BarChart2 className='h-5 w-5 mr-2' />
              Statistics
            </h1>

            <Select defaultValue='week' onValueChange={setTimeRange}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Select time period' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='week'>Last 7 days</SelectItem>
                <SelectItem value='month'>This month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </header>

        <div className='flex-1 overflow-y-auto p-4 sm:p-6 lg:px-8 bg-background'>
          {isLoading ? (
            <div className='flex justify-center items-center h-full'>
              <Loader2 className='h-8 w-8 animate-spin text-primary' />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <motion.div
                className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Completion Rate
                    </CardTitle>
                    <Activity className='h-4 w-4 text-muted-foreground' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>
                      {overallCompletionRate}%
                    </div>
                    <p className='text-xs text-muted-foreground'>
                      {totalCompletions} of {totalPossibleCompletions} habits
                      completed
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className='flex flex-row items-center justify-between pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Longest Streak
                    </CardTitle>
                    <TrendingUp className='h-4 w-4 text-muted-foreground' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>
                      {longestStreak} days
                    </div>
                    <p className='text-xs text-muted-foreground'>
                      {mostConsistentHabit?.name || "No habits tracked yet"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className='flex flex-row items-center justify-between pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Active Habits
                    </CardTitle>
                    <Calendar className='h-4 w-4 text-muted-foreground' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>{habits.length}</div>
                    <p className='text-xs text-muted-foreground'>
                      {habits.length > 0
                        ? "Currently tracking"
                        : "No habits added yet"}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Charts */}
              <Tabs defaultValue='overview' className='space-y-4'>
                <TabsList>
                  <TabsTrigger value='overview'>Overview</TabsTrigger>
                  <TabsTrigger value='habits'>Habits</TabsTrigger>
                  <TabsTrigger value='streaks'>Streaks</TabsTrigger>
                </TabsList>

                <TabsContent value='overview' className='space-y-4'>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>
                          Habit Completion{" "}
                          {timeRange === "week" ? "This Week" : "This Month"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='pt-2'>
                        <div className='h-80'>
                          <ResponsiveContainer width='100%' height='100%'>
                            <BarChart
                              data={getChartData()}
                              margin={{
                                top: 10,
                                right: 30,
                                left: 0,
                                bottom: 0,
                              }}
                            >
                              <CartesianGrid
                                strokeDasharray='3 3'
                                vertical={false}
                              />
                              <XAxis dataKey='name' />
                              <YAxis />
                              <Tooltip
                                formatter={(value, name) => [
                                  value,
                                  name === "completed" ? "Completed" : "Total",
                                ]}
                                labelFormatter={(label) => `${label}`}
                              />
                              <Bar
                                dataKey='completed'
                                fill='hsl(var(--primary))'
                                radius={[4, 4, 0, 0]}
                              />
                              <Bar
                                dataKey='total'
                                fill='hsl(var(--muted))'
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                <TabsContent value='habits' className='space-y-4'>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>Habit Completion Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='h-80 flex items-center justify-center'>
                          {habitCompletionData.length === 0 ? (
                            <p className='text-muted-foreground'>
                              No habit data to display
                            </p>
                          ) : (
                            <ResponsiveContainer width='100%' height='100%'>
                              <PieChart>
                                <Pie
                                  data={habitCompletionData}
                                  cx='50%'
                                  cy='50%'
                                  labelLine={false}
                                  label={({ name, percent }) =>
                                    `${name}: ${(percent * 100).toFixed(0)}%`
                                  }
                                  outerRadius={80}
                                  fill='#8884d8'
                                  dataKey='value'
                                >
                                  {habitCompletionData.map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={entry.color || "#6E56CF"}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip
                                  formatter={(value) => [
                                    `${value}%`,
                                    "Completion Rate",
                                  ]}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                <TabsContent value='streaks' className='space-y-4'>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>Current Streaks</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='h-80'>
                          {streakData.length === 0 ? (
                            <div className='h-full flex items-center justify-center'>
                              <p className='text-muted-foreground'>
                                No streak data to display
                              </p>
                            </div>
                          ) : (
                            <ResponsiveContainer width='100%' height='100%'>
                              <BarChart
                                layout='vertical'
                                data={streakData}
                                margin={{
                                  top: 10,
                                  right: 30,
                                  left: 100,
                                  bottom: 0,
                                }}
                              >
                                <CartesianGrid
                                  strokeDasharray='3 3'
                                  horizontal={true}
                                  vertical={false}
                                />
                                <XAxis type='number' />
                                <YAxis
                                  type='category'
                                  dataKey='name'
                                  width={80}
                                />
                                <Tooltip
                                  formatter={(value) => [
                                    `${value} days`,
                                    "Current Streak",
                                  ]}
                                />
                                <Bar dataKey='streak' radius={[0, 4, 4, 0]}>
                                  {streakData.map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={entry.color || "#6E56CF"}
                                    />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
