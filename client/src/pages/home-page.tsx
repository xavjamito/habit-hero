import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Habit, Completion } from "@shared/schema";
import { Sidebar } from "@/components/ui/sidebar";
import BottomNavbar from "@/components/ui/bottom-navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import HabitCard from "@/components/habit-card";
import WeekOverview from "@/components/week-overview";
import StatCard from "@/components/stats-card";
import { Loader2, Search, Plus, CheckCircle, Zap, BarChart2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getGreeting, formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import CreateHabitDialog from "@/components/create-habit-dialog";

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "pending">("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // Fetch habits
  const {
    data: habits = [],
    isLoading: isLoadingHabits,
    error: habitsError,
  } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });
  
  // Fetch completions for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const {
    data: completions = [],
    isLoading: isLoadingCompletions,
    refetch: refetchCompletions,
  } = useQuery<Completion[]>({
    queryKey: ["/api/completions", { from: today.toISOString(), to: tomorrow.toISOString() }],
    refetchInterval: 3000, // Refetch every 3 seconds to ensure UI is up to date
    staleTime: 1000, // Data becomes stale after 1 second
  });
  
  // Filter habits based on search and completion status
  const filteredHabits = habits
    .filter((habit) => 
      habit.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (habit.description && habit.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .filter((habit) => {
      if (filterStatus === "all") return true;
      
      const isCompleted = completions.some(
        (completion) => completion.habitId === habit.id
      );
      
      return filterStatus === "completed" ? isCompleted : !isCompleted;
    });
  
  // Get completions for stats
  const completedToday = completions.length;
  const totalHabits = habits.length;
  
  // Handle create habit dialog
  const openCreateDialog = () => setShowCreateDialog(true);
  const closeCreateDialog = () => setShowCreateDialog(false);
  
  // Loading states
  const isLoading = isLoadingHabits || isLoadingCompletions;
  
  if (habitsError) {
    toast({
      title: "Failed to load habits",
      description: "Please try refreshing the page",
      variant: "destructive",
    });
  }

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
      {/* Sidebar (visible on md and larger) */}
      <Sidebar />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex justify-between items-center py-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center md:hidden">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold ml-2 md:hidden">HabitTrack</h1>
            </div>

            <div className="flex items-center">
              <div className="relative flex-1 max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="search"
                  name="search"
                  className="block w-full pl-10 pr-3 py-2"
                  placeholder="Search habits..."
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Button
                size="icon"
                onClick={openCreateDialog}
                className="ml-3 flex-shrink-0 bg-primary p-1 rounded-full text-white hover:bg-primary/90"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </header>
        
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:px-8 bg-background">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Welcome Section */}
              <motion.div 
                className="mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="text-2xl font-semibold text-foreground">
                  {getGreeting()}, {user?.name || user?.username} 👋
                </h1>
                <p className="text-muted-foreground mt-1">Track your progress and build better habits</p>
              </motion.div>
              
              {/* Week Overview */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <WeekOverview 
                  completions={completions}
                  habits={habits}
                />
              </motion.div>
              
              {/* Stats Cards */}
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <StatCard
                  icon={<CheckCircle className="h-6 w-6 text-secondary" />}
                  label="Completed Today"
                  value={`${completedToday}/${totalHabits}`}
                  bgColor="bg-green-100"
                  iconColor="text-secondary"
                />
                
                <StatCard
                  icon={<Zap className="h-6 w-6 text-accent" />}
                  label="Longest Streak"
                  value="14 days"
                  bgColor="bg-yellow-100"
                  iconColor="text-accent"
                />
                
                <StatCard
                  icon={<BarChart2 className="h-6 w-6 text-primary" />}
                  label="Weekly Completion"
                  value={totalHabits ? `${Math.round((completedToday / totalHabits) * 100)}%` : "0%"}
                  bgColor="bg-indigo-100"
                  iconColor="text-primary"
                />
              </motion.div>
              
              {/* Habits List */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Today's Habits</h2>
                  <div className="flex space-x-2">
                    <select
                      className="block pl-3 pr-10 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-primary focus:border-primary"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                    >
                      <option value="all">All Habits</option>
                      <option value="completed">Completed</option>
                      <option value="pending">In Progress</option>
                    </select>
                  </div>
                </div>
                
                {filteredHabits.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 rounded-full bg-primary bg-opacity-10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-lg font-medium mb-2">No habits found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm 
                        ? "Try using different search terms"
                        : filterStatus !== "all" 
                          ? `No ${filterStatus} habits found`
                          : "Start by creating your first habit"}
                    </p>
                    <Button onClick={openCreateDialog}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add a Habit
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredHabits.map((habit, index) => (
                      <motion.div
                        key={habit.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                          duration: 0.3, 
                          delay: 0.1 + (index * 0.05), 
                          ease: "easeOut" 
                        }}
                      >
                        <HabitCard
                          habit={habit}
                          isCompleted={completions.some(
                            (completion) => completion.habitId === habit.id
                          )}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      
      {/* Bottom Navbar (mobile only) */}
      <BottomNavbar currentPath="/" />
      
      {/* Create Habit Dialog */}
      <CreateHabitDialog open={showCreateDialog} onOpenChange={closeCreateDialog} />
    </div>
  );
}
