import { useState } from "react";
import { Habit, Completion } from "@shared/schema";
import {
  getWeekDays,
  formatWeekDay,
  formatDayNumber,
  isDateInArray,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { format, subWeeks, addWeeks, isSameDay, isToday } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface WeekOverviewProps {
  completions: Completion[];
  habits: Habit[];
}

export default function WeekOverview({
  completions,
  habits,
}: WeekOverviewProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Generate week days
  const weekDays = getWeekDays(currentWeek);

  // Check if a day is completed
  const isCompletedDay = (day: Date) => {
    const dayCompletions = completions.filter((c) =>
      isSameDay(new Date(c.date), day)
    );

    // Consider completed if at least one habit was completed
    return dayCompletions.length > 0;
  };

  // Navigation handlers
  const previousWeek = () => {
    setCurrentWeek((prev) => subWeeks(prev, 1));
  };

  const nextWeek = () => {
    setCurrentWeek((prev) => addWeeks(prev, 1));
  };

  // Calculate week range for display
  const weekStart = format(weekDays[0], "MMM d");
  const weekEnd = format(weekDays[weekDays.length - 1], "MMM d");

  return (
    <div className='bg-white rounded-lg shadow mb-6 overflow-hidden'>
      <div className='p-4 sm:p-6 border-b border-gray-200'>
        <div className='flex justify-between items-center'>
          <h2 className='text-lg font-semibold'>This Week</h2>
          <div className='flex space-x-2 items-center'>
            <Button
              variant='ghost'
              size='icon'
              onClick={previousWeek}
              className='text-muted-foreground'
            >
              <ChevronLeft className='h-5 w-5' />
            </Button>
            <span className='text-sm font-medium py-1'>
              {weekStart} - {weekEnd}
            </span>
            <Button
              variant='ghost'
              size='icon'
              onClick={nextWeek}
              className='text-muted-foreground'
              disabled={weekDays[weekDays.length - 1] >= new Date()}
            >
              <ChevronRight className='h-5 w-5' />
            </Button>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-7 bg-white shadow-sm'>
        {weekDays.map((day, index) => {
          const isSelected = isToday(day);

          return (
            <div
              key={index}
              className={`flex flex-col items-center py-3 border-r border-gray-100 last:border-r-0 ${
                isSelected ? "bg-primary bg-opacity-5" : ""
              }`}
            >
              <span
                className={`text-xs font-medium ${
                  isSelected ? "text-white" : "text-muted-foreground"
                }`}
              >
                {formatWeekDay(day)}
              </span>
              <span
                className={`mt-1 font-semibold ${
                  isSelected ? "text-white" : "text-foreground"
                }`}
              >
                {formatDayNumber(day)}
              </span>

              {/* Completion indicator */}
              {habits.length > 0 && (
                <div
                  className={`mt-1 w-1.5 h-1.5 rounded-full ${
                    isCompletedDay(day) ? "bg-secondary" : "bg-gray-200"
                  }`}
                ></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
