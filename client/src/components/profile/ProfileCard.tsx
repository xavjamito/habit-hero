import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Home, Plus, Trash, Loader2 } from "lucide-react";

export function ProfileCard() {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!user) {
    return null;
  }

  // Generate avatar from username if not available
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;

  const handleLogout = () => {
    setIsLoggingOut(true);
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        // Will automatically redirect to auth page when user state changes
        setIsLoggingOut(false);
      },
      onError: () => {
        setIsLoggingOut(false);
      },
    });
  };

  return (
    <div className='h-full w-full max-w-md mx-auto flex flex-col items-center pt-8'>
      {/* Profile avatar and name */}
      <div className='flex flex-col items-center mb-8'>
        <div className='w-32 h-32 rounded-full overflow-hidden mb-4 border-2 border-border/20'>
          <img
            src={avatarUrl}
            alt={user.name || user.username}
            className='w-full h-full object-cover'
          />
        </div>
        <h1 className='text-3xl font-bold mb-1'>
          {user.name || user.username}
        </h1>
        <p className='text-muted-foreground text-sm'>{user.email}</p>
      </div>

      {/* Edit profile button */}
      <Button className='w-56 mb-8 rounded-full' variant='default'>
        Edit Profile
      </Button>

      {/* Settings cards */}
      <div className='w-full space-y-4'>
        <Card className='p-4 bg-card/50 backdrop-blur'>
          <h2 className='text-xl font-medium mb-4'>Notifications</h2>
          <div className='flex justify-between items-center'>
            <span className='text-sm'>Turn on Notifications</span>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>
        </Card>

        <Card className='p-4 bg-card/50 backdrop-blur'>
          <h2 className='text-xl font-medium mb-4'>Invite Link</h2>
          <Button className='w-full mb-2' variant='secondary'>
            Invite people
          </Button>
        </Card>

        <div className='pt-8'>
          <Button
            variant='ghost'
            className='text-muted-foreground w-full'
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Logging out...
              </>
            ) : (
              "Log out"
            )}
          </Button>
        </div>
      </div>

      {/* Desktop footer navigation (only shown on profile page) */}
      <div className='hidden md:flex mt-auto py-4 justify-center space-x-4'>
        <button className='p-2'>
          <Home className='w-5 h-5 text-muted-foreground' />
        </button>
        <button className='p-2 bg-primary text-white rounded-xl'>
          <Plus className='w-5 h-5' />
        </button>
        <button className='p-2'>
          <Trash className='w-5 h-5 text-muted-foreground' />
        </button>
      </div>
    </div>
  );
}
