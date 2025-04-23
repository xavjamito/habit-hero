import { AppLayout } from "@/components/layout/AppLayout";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { HabitList } from "@/components/tasks/HabitList";
import { useState, useEffect } from "react";
import { Bell, Calendar, Settings, Home, BarChart2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Habit, Completion } from "@shared/schema";

export default function HomePage() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<
    "dashboard" | "profile" | "tasks"
  >("dashboard");
  const [isMobile, setIsMobile] = useState(false);

  // Check if viewing on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check initially
    checkMobile();

    // Add resize listener
    window.addEventListener("resize", checkMobile);

    // Remove listener on cleanup
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Set initial view to habits list on mobile
  useEffect(() => {
    if (isMobile && activeView === "dashboard") {
      setActiveView("tasks");
    }
  }, [isMobile, activeView]);

  // Fetch habits and completions data for the dashboard
  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  // Get today's completions
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: completions = [] } = useQuery<Completion[]>({
    queryKey: [
      "/api/completions",
      { from: today.toISOString(), to: tomorrow.toISOString() },
    ],
  });

  // Calculate completion rate for today
  const completedCount = completions.length;
  const totalCount = habits.length;
  const completionRate =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const remainingCount = totalCount - completedCount;

  // Generate avatar URL from username if available
  const avatarUrl = user
    ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${
        user.username || user.email
      }`
    : "";

  // Render main content based on active view
  const renderMainContent = () => {
    switch (activeView) {
      case "profile":
        return <ProfileCard />;
      case "tasks":
        return <HabitList showBackButton={!isMobile} title='Your Habits' />;
      default:
        return (
          <div className='h-full flex flex-col'>
            {/* Header with profile info */}
            <div className='px-6 pt-8 pb-4'>
              <div className='flex justify-between items-center mb-6'>
                <div>
                  <h1 className='text-2xl font-bold'>Welcome back</h1>
                  <p className='text-muted-foreground'>
                    {user?.name || user?.username || user?.email}
                  </p>
                </div>
                <div className='flex items-center space-x-2'>
                  <Button variant='ghost' size='icon'>
                    <Bell className='h-5 w-5' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => navigate("/calendar")}
                  >
                    <Calendar className='h-5 w-5' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => setActiveView("profile")}
                  >
                    <div className='w-8 h-8 rounded-full overflow-hidden'>
                      <img
                        src={avatarUrl}
                        alt='Profile'
                        className='w-full h-full object-cover'
                      />
                    </div>
                  </Button>
                </div>
              </div>
            </div>

            {/* Dashboard Content */}
            <div className='px-6 py-4 flex-1'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Summary Card */}
                <div className='bg-card p-4 rounded-xl'>
                  <h2 className='text-lg font-medium mb-3'>Today's Progress</h2>
                  <div className='mb-4'>
                    <div className='flex justify-between text-sm mb-1'>
                      <span>Completed</span>
                      <span>
                        {completedCount}/{totalCount} habits
                      </span>
                    </div>
                    <div className='w-full h-2 bg-secondary rounded-full overflow-hidden'>
                      <div
                        className='bg-primary h-full transition-all duration-500 ease-in-out'
                        style={{ width: `${completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-muted-foreground text-sm'>
                      {remainingCount} habits remaining
                    </span>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-primary'
                      onClick={() => setActiveView("tasks")}
                    >
                      View all
                    </Button>
                  </div>
                </div>

                {/* Habits Card */}
                <div className='bg-card p-4 rounded-xl'>
                  <h2 className='text-lg font-medium mb-3'>Habit Streaks</h2>
                  {habits.length === 0 ? (
                    <div className='text-center py-6'>
                      <p className='text-muted-foreground mb-4'>
                        You haven't created any habits yet.
                      </p>
                      <Button onClick={() => setActiveView("tasks")}>
                        <Plus className='h-4 w-4 mr-2' />
                        Create Habit
                      </Button>
                    </div>
                  ) : (
                    <div className='space-y-3'>
                      {habits.slice(0, 2).map((habit) => (
                        <div key={habit.id} className='flex items-center'>
                          <div
                            className='w-8 h-8 rounded-xl mr-3 flex items-center justify-center'
                            style={{
                              backgroundColor: habit.color || "#8b5cf6",
                            }}
                          >
                            <svg
                              className='w-5 h-5 text-white'
                              fill='currentColor'
                              viewBox='0 0 20 20'
                            >
                              <path d='M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z'></path>
                            </svg>
                          </div>
                          <div className='flex-1'>
                            <h3 className='font-medium'>{habit.name}</h3>
                            <div className='text-muted-foreground text-sm'>
                              Started{" "}
                              {new Date(habit.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}

                      {habits.length > 2 && (
                        <Button
                          variant='outline'
                          className='w-full mt-2'
                          onClick={() => navigate("/habits")}
                        >
                          View all habits
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  const navigate = (path: string) => {
    window.location.href = path;
  };

  return (
    <AppLayout>
      <div className='flex flex-col md:flex-row h-screen'>
        <div className='flex-1 overflow-auto'>{renderMainContent()}</div>

        {/* Right panel - tasks list only on desktop and when not in tasks view */}
        {!isMobile && activeView !== "tasks" && (
          <div className='hidden md:block w-[380px] p-4'>
            <HabitList showBackButton={false} />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
