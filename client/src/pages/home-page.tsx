import { AppLayout } from "@/components/layout/AppLayout";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { TaskList } from "@/components/tasks/TaskList";
import { useState } from "react";
import { Bell, Calendar, Settings, Home, BarChart2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<
    "dashboard" | "profile" | "tasks"
  >("dashboard");

  // Generate avatar URL from username if available
  const avatarUrl = user
    ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
    : "";

  // Render main content based on active view
  const renderMainContent = () => {
    switch (activeView) {
      case "profile":
        return <ProfileCard />;
      case "tasks":
        return <TaskList showBackButton={false} />;
      default:
        return (
          <div className='h-full flex flex-col'>
            {/* Header with profile info */}
            <div className='px-6 pt-8 pb-4'>
              <div className='flex justify-between items-center mb-6'>
                <div>
                  <h1 className='text-2xl font-bold'>Welcome back</h1>
                  <p className='text-muted-foreground'>
                    {user?.name || user?.username}
                  </p>
                </div>
                <div className='flex items-center space-x-2'>
                  <Button variant='ghost' size='icon'>
                    <Bell className='h-5 w-5' />
                  </Button>
                  <Button variant='ghost' size='icon'>
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
                      <span>3/5 tasks</span>
                    </div>
                    <div className='w-full h-2 bg-secondary rounded-full overflow-hidden'>
                      <div className='bg-primary h-full w-3/5'></div>
                    </div>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-muted-foreground text-sm'>
                      2 tasks remaining
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
                  <div className='space-y-3'>
                    <div className='flex items-center'>
                      <div className='w-8 h-8 rounded-xl bg-blue-500 mr-3 flex items-center justify-center'>
                        <svg
                          className='w-5 h-5 text-white'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path d='M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z'></path>
                        </svg>
                      </div>
                      <div className='flex-1'>
                        <h3 className='font-medium'>Daily Writing</h3>
                        <div className='text-muted-foreground text-sm'>
                          15 day streak
                        </div>
                      </div>
                    </div>
                    <div className='flex items-center'>
                      <div className='w-8 h-8 rounded-xl bg-green-500 mr-3 flex items-center justify-center'>
                        <svg
                          className='w-5 h-5 text-white'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path
                            fillRule='evenodd'
                            d='M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z'
                            clipRule='evenodd'
                          ></path>
                        </svg>
                      </div>
                      <div className='flex-1'>
                        <h3 className='font-medium'>Meditation</h3>
                        <div className='text-muted-foreground text-sm'>
                          8 day streak
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <AppLayout>
      <div className='flex flex-col md:flex-row h-screen'>
        <div className='flex-1 overflow-auto'>{renderMainContent()}</div>

        {/* Right panel - tasks list only on desktop */}
        <div className='hidden md:block w-[380px] p-4'>
          <TaskList showBackButton={false} />
        </div>
      </div>
    </AppLayout>
  );
}
