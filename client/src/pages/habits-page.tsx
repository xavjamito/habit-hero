import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Habit, Completion } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/ui/sidebar";
import BottomNavbar from "@/components/ui/bottom-navbar";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { motion } from "framer-motion";

export default function HabitsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // Fetch habits
  const {
    data: habits = [],
    isLoading: isLoadingHabits,
  } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });
  
  // Fetch all completions
  const {
    data: completions = [],
    isLoading: isLoadingCompletions,
  } = useQuery<Completion[]>({
    queryKey: ["/api/completions"],
  });
  
  const isLoading = isLoadingHabits || isLoadingCompletions;
  
  // Filter habits based on search
  const filteredHabits = habits.filter((habit) =>
    habit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (habit.description && habit.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Group habits by creation date (for "Recently Added" tab)
  const recentlyAddedHabits = [...filteredHabits].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  // Calculate completion percentage for sorting
  const getCompletionPercentage = (habitId: number) => {
    const habitCompletions = completions.filter(c => c.habitId === habitId);
    
    if (habitCompletions.length === 0) return 0;
    
    // Use the last 7 days as the denominator
    const today = new Date();
    let count = 0;
    
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toDateString();
      
      if (habitCompletions.some(c => new Date(c.date).toDateString() === dateStr)) {
        count++;
      }
    }
    
    return (count / 7) * 100;
  };
  
  // Sort by completion percentage (for "Most Consistent" tab)
  const mostConsistentHabits = [...filteredHabits].sort(
    (a, b) => getCompletionPercentage(b.id) - getCompletionPercentage(a.id)
  );
  
  // Delete habit handler
  const deleteHabit = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/habits/${id}`);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      toast({
        title: "Habit deleted",
        description: "The habit has been successfully deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the habit",
        variant: "destructive",
      });
    }
  };
  
  // Dialog handlers
  const openCreateDialog = () => setShowCreateDialog(true);
  const closeCreateDialog = () => setShowCreateDialog(false);
  
  // Render habit list with different sorting
  const renderHabitList = (habits: Habit[]) => {
    if (habits.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            {searchTerm ? "No habits match your search criteria" : "No habits found"}
          </p>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add a Habit
          </Button>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {habits.map((habit, index) => {
          const habitCompletions = completions.filter(c => c.habitId === habit.id);
          const completionPercentage = getCompletionPercentage(habit.id);
          
          return (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * index }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div 
                        className="h-12 w-12 rounded-full flex items-center justify-center mt-1" 
                        style={{ backgroundColor: habit.color }}
                      >
                        <span className="text-white font-semibold text-lg">
                          {habit.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-lg">{habit.name}</h3>
                        {habit.description && (
                          <p className="text-muted-foreground text-sm">{habit.description}</p>
                        )}
                        
                        <div className="flex items-center mt-2 space-x-3">
                          <Badge variant="outline">
                            Created {formatDate(new Date(habit.createdAt))}
                          </Badge>
                          
                          <Badge 
                            variant={completionPercentage >= 70 ? "success" : 
                                    completionPercentage >= 30 ? "warning" : "outline"}
                          >
                            {Math.round(completionPercentage)}% consistent
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="icon">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon"
                        onClick={() => deleteHabit(habit.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-secondary h-1.5 rounded-full" 
                        style={{ width: `${completionPercentage}%` }}
                      ></div>
                    </div>
                    <div className="mt-1 grid grid-cols-7 gap-0.5">
                      {Array.from({ length: 7 }).map((_, i) => {
                        const date = new Date();
                        date.setDate(date.getDate() - 6 + i);
                        const isCompleted = habitCompletions.some(
                          c => new Date(c.date).toDateString() === date.toDateString()
                        );
                        
                        return (
                          <div 
                            key={i}
                            className={`h-1.5 rounded-sm ${isCompleted ? 'bg-secondary' : 'bg-gray-200'}`}
                          ></div>
                        );
                      })}
                    </div>
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
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <div className="flex justify-between items-center py-4 px-4 sm:px-6 lg:px-8">
            <h1 className="text-xl font-semibold">All Habits</h1>
            
            <div className="flex items-center">
              <div className="relative max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  className="pl-10"
                  placeholder="Search habits..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Button
                size="icon"
                onClick={openCreateDialog}
                className="ml-3 bg-primary text-white"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:px-8 bg-background">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Habits</TabsTrigger>
                <TabsTrigger value="recent">Recently Added</TabsTrigger>
                <TabsTrigger value="consistent">Most Consistent</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                {renderHabitList(filteredHabits)}
              </TabsContent>
              
              <TabsContent value="recent">
                {renderHabitList(recentlyAddedHabits)}
              </TabsContent>
              
              <TabsContent value="consistent">
                {renderHabitList(mostConsistentHabits)}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
      
      <BottomNavbar currentPath="/habits" />
      
      <CreateHabitDialog open={showCreateDialog} onOpenChange={closeCreateDialog} />
    </div>
  );
}
