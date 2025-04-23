import React from "react";
import { useLocation } from "wouter";
import {
  Home,
  Calendar,
  BarChart2,
  Plus,
  LogOut,
  ListTodo,
  User,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCreateHabit } from "@/hooks/use-create-habit";
import { GlobalCreateHabitDialog } from "@/components/global-create-habit-dialog";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { open: openCreateHabitDialog } = useCreateHabit();

  // Active page determination
  const isActive = (path: string) => location === path;

  // Generate avatar URL from username if available
  const avatarUrl = user
    ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${
        user.username || user.email
      }`
    : "";

  return (
    <div className='min-h-screen flex bg-background text-foreground'>
      {/* Mobile navigation (bottom) */}
      <div className='fixed bottom-0 left-0 w-full md:hidden bg-card px-4 py-2 flex justify-around items-center z-10 border-t border-border/10'>
        <NavButton
          icon={<Home className='w-5 h-5' />}
          isActive={isActive("/")}
          onClick={() => navigate("/")}
        />
        <NavButton
          icon={<ListTodo className='w-5 h-5' />}
          isActive={isActive("/habits")}
          onClick={() => navigate("/habits")}
        />
        <NavButton
          icon={<Plus className='w-5 h-5' />}
          isActive={false}
          onClick={openCreateHabitDialog}
          primary
        />
        <NavButton
          icon={<BarChart2 className='w-5 h-5' />}
          isActive={isActive("/stats")}
          onClick={() => navigate("/stats")}
        />
        <NavButton
          icon={
            <div className='relative'>
              <User className='w-5 h-5' />
              {avatarUrl && isActive("/profile") && (
                <div className='absolute inset-0 rounded-full overflow-hidden'>
                  <img
                    src={avatarUrl}
                    alt='Profile'
                    className='w-full h-full object-cover'
                  />
                </div>
              )}
            </div>
          }
          isActive={isActive("/profile")}
          onClick={() => navigate("/profile")}
        />
      </div>

      {/* Desktop sidebar navigation */}
      <div className='hidden md:flex w-16 flex-col items-center pt-8 pb-4 border-r border-border/10'>
        <div className='w-10 h-10 rounded-xl bg-primary mb-8 flex items-center justify-center'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='h-6 w-6 text-primary-foreground'
            viewBox='0 0 20 20'
            fill='currentColor'
          >
            <path
              fillRule='evenodd'
              d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
              clipRule='evenodd'
            />
          </svg>
        </div>

        <div className='flex flex-col items-center space-y-6 flex-1'>
          <NavButton
            icon={<Home className='w-5 h-5' />}
            isActive={isActive("/")}
            onClick={() => navigate("/")}
          />
          <NavButton
            icon={<ListTodo className='w-5 h-5' />}
            isActive={isActive("/habits")}
            onClick={() => navigate("/habits")}
          />
          <NavButton
            icon={<Calendar className='w-5 h-5' />}
            isActive={isActive("/calendar")}
            onClick={() => navigate("/calendar")}
          />
          <NavButton
            icon={<BarChart2 className='w-5 h-5' />}
            isActive={isActive("/stats")}
            onClick={() => navigate("/stats")}
          />
          <NavButton
            icon={<Plus className='w-5 h-5' />}
            isActive={false}
            onClick={openCreateHabitDialog}
            primary
          />
        </div>

        <div className='mt-auto space-y-6'>
          <NavButton
            icon={
              <div className='relative'>
                {avatarUrl ? (
                  <div className='w-5 h-5 rounded-full overflow-hidden'>
                    <img
                      src={avatarUrl}
                      alt='Profile'
                      className='w-full h-full object-cover'
                    />
                  </div>
                ) : (
                  <User className='w-5 h-5' />
                )}
              </div>
            }
            isActive={isActive("/profile")}
            onClick={() => navigate("/profile")}
          />
          <NavButton
            icon={<LogOut className='w-5 h-5' />}
            isActive={false}
            onClick={() => navigate("/auth")}
          />
        </div>
      </div>

      {/* Main content */}
      <div className='flex-1 pb-20 md:pb-0 md:ml-0 overflow-hidden bg-background'>
        {children}
      </div>

      {/* Global Create Habit Dialog */}
      <GlobalCreateHabitDialog />
    </div>
  );
}

interface NavButtonProps {
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  primary?: boolean;
}

function NavButton({
  icon,
  isActive,
  onClick,
  primary = false,
}: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-xl transition-all duration-200 ${
        primary
          ? "bg-primary text-white shadow-md hover:shadow-lg hover:bg-primary/90"
          : isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/30 hover:text-accent-foreground"
      }`}
    >
      {icon}
    </button>
  );
}
