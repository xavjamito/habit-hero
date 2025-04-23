import React from "react";
import {
  Search,
  ChevronLeft,
  Home,
  Plus,
  Trash,
  BookOpen,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

type Task = {
  id: string;
  title: string;
  completed: boolean;
  category: "reading" | "work" | "personal" | "meeting";
  color?: "blue" | "green" | "purple" | "orange";
};

type TasksProps = {
  title?: string;
  showBackButton?: boolean;
};

export function TaskList({
  title = "Daily progress",
  showBackButton = true,
}: TasksProps) {
  const [, navigate] = useLocation();
  const [filter, setFilter] = React.useState<"all" | "favorite">("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Mock tasks data
  const tasks: Task[] = [
    {
      id: "1",
      title: 'Read "The Lean Startup"',
      completed: false,
      category: "reading",
      color: "blue",
    },
    {
      id: "2",
      title: "Fix landing page",
      completed: false,
      category: "work",
      color: "green",
    },
    {
      id: "3",
      title: "Share prototype with team",
      completed: true,
      category: "meeting",
      color: "purple",
    },
    {
      id: "4",
      title: "Reply to Richard",
      completed: false,
      category: "personal",
      color: "orange",
    },
    {
      id: "5",
      title: "Finalize pitch deck",
      completed: true,
      category: "work",
      color: "purple",
    },
  ];

  // Filter tasks based on search and filter selection
  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get icon based on task category
  const getTaskIcon = (task: Task) => {
    const iconClass = "w-5 h-5 text-white";

    switch (task.category) {
      case "reading":
        return <BookOpen className={iconClass} />;
      case "work":
        return <CheckCircle className={iconClass} />;
      case "meeting":
        return <CheckCircle className={iconClass} />;
      case "personal":
        return <CheckCircle className={iconClass} />;
      default:
        return <CheckCircle className={iconClass} />;
    }
  };

  // Get background color based on task category/color
  const getTaskBgColor = (task: Task) => {
    switch (task.color) {
      case "blue":
        return "bg-blue-500";
      case "green":
        return "bg-green-500";
      case "purple":
        return "bg-purple-500";
      case "orange":
        return "bg-orange-500";
      default:
        return "bg-primary";
    }
  };

  return (
    <div className='h-full flex flex-col bg-card w-full max-w-md mx-auto rounded-xl overflow-hidden'>
      {/* Header */}
      <div className='px-4 py-3 flex items-center border-b border-border/10'>
        {showBackButton && (
          <Button
            variant='ghost'
            size='icon'
            className='mr-2'
            onClick={() => navigate("/")}
          >
            <ChevronLeft className='h-5 w-5' />
          </Button>
        )}
        <h1 className='text-lg font-semibold flex-1'>{title}</h1>
        <Button variant='ghost' size='icon'>
          <Search className='h-5 w-5' />
        </Button>
        <div className='w-8 h-8 rounded-full overflow-hidden'>
          <img
            src='https://api.dicebear.com/7.x/avataaars/svg?seed=John'
            alt='User avatar'
            className='w-full h-full object-cover'
          />
        </div>
      </div>

      {/* Search */}
      <div className='px-4 py-3'>
        <Input
          placeholder='Search'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='bg-secondary/50 border-0'
        />
      </div>

      {/* Filters */}
      <div className='px-4 py-2 flex space-x-2'>
        <Button
          variant={filter === "all" ? "default" : "ghost"}
          className={cn(
            "rounded-full px-4 text-sm",
            filter === "all" ? "" : "text-muted-foreground"
          )}
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        <Button
          variant={filter === "favorite" ? "default" : "ghost"}
          className={cn(
            "rounded-full px-4 text-sm",
            filter === "favorite" ? "" : "text-muted-foreground"
          )}
          onClick={() => setFilter("favorite")}
        >
          Favorite
        </Button>
      </div>

      {/* Task List */}
      <div className='px-4 py-2 flex-1 overflow-auto'>
        <div className='space-y-2'>
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className='p-4 bg-accent/30 rounded-xl flex items-center group hover:bg-accent/50 transition-colors'
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center mr-3",
                  getTaskBgColor(task)
                )}
              >
                {getTaskIcon(task)}
              </div>
              <div className='flex-1'>
                <h3 className='font-medium'>{task.title}</h3>
              </div>
              <Button
                variant='ghost'
                size='icon'
                className='opacity-0 group-hover:opacity-100 transition-opacity'
              >
                <ArrowRight className='h-4 w-4' />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className='px-4 py-3 flex justify-between border-t border-border/10'>
        <Button variant='ghost' size='icon'>
          <Home className='h-5 w-5' />
        </Button>
        <Button variant='default' size='icon' className='rounded-full'>
          <Plus className='h-5 w-5' />
        </Button>
        <Button variant='ghost' size='icon'>
          <Trash className='h-5 w-5' />
        </Button>
      </div>
    </div>
  );
}
