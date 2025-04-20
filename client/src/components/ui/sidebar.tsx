import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "./button";
import {
  Home,
  ListChecks,
  Calendar as CalendarIcon,
  BarChart2,
  LogOut,
} from "lucide-react";

const NavItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    title: "All Habits",
    href: "/habits",
    icon: ListChecks,
  },
  {
    title: "Calendar",
    href: "/calendar",
    icon: CalendarIcon,
  },
  {
    title: "Statistics",
    href: "/stats",
    icon: BarChart2,
  },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <aside className='hidden md:flex md:w-64 p-4 flex-col border-r border-border bg-white'>
      <div className='flex items-center px-2 py-4'>
        <div className='w-8 h-8 rounded-md bg-primary flex items-center justify-center'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='h-5 w-5 text-white'
            viewBox='0 0 20 20'
            fill='currentColor'
          >
            <path
              fillRule='evenodd'
              d='M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
              clipRule='evenodd'
            />
          </svg>
        </div>
        <h1 className='text-xl font-semibold ml-2'>HabitHero</h1>
      </div>

      <nav className='mt-8 flex-1'>
        <div className='space-y-1'>
          {NavItems.map((item) => {
            const isActive = location === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-primary bg-opacity-10 text-white"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <item.icon className='h-5 w-5 mr-3' />
                {item.title}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className='mt-auto'>
        <div className='px-2 py-2 mt-2 rounded-md bg-gray-50'>
          <div className='flex items-center'>
            <div className='h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center'>
              <span className='text-sm font-semibold'>
                {user?.name?.charAt(0) || user?.username?.charAt(0) || "U"}
              </span>
            </div>
            <div className='ml-3'>
              <p className='text-sm font-medium'>
                {user?.name || user?.username}
              </p>
              <p className='text-xs text-muted-foreground'>
                {user?.email || ""}
              </p>
            </div>
          </div>
          <Button
            variant='outline'
            size='sm'
            className='mt-2 w-full flex items-center justify-center'
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className='h-4 w-4 mr-2' />
            Sign Out
          </Button>
        </div>
      </div>
    </aside>
  );
}
