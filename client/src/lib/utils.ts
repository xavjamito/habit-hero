import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, startOfWeek, addDays, isSameDay, isToday } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date to display in a readable format
export function formatDate(date: Date): string {
  return format(date, "MMM d, yyyy");
}

// Get dates for a week starting from a given date
export function getWeekDays(date: Date = new Date()): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Start week on Monday
  return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
}

// Check if a date exists in a list of dates
export function isDateInArray(date: Date, dateArray: Date[]): boolean {
  return dateArray.some(d => isSameDay(d, date));
}

// Calculate streak based on array of completion dates
export function calculateStreak(completions: Date[]): number {
  if (!completions.length) return 0;
  
  // Sort completions in descending order (newest first)
  const sortedCompletions = [...completions].sort((a, b) => b.getTime() - a.getTime());
  
  let streak = 0;
  let currentDate = new Date();
  
  // If today is not completed, check if yesterday was
  if (!isDateInArray(currentDate, sortedCompletions)) {
    currentDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() - 1);
  }
  
  // Start from the current date and go backwards
  while (isDateInArray(currentDate, sortedCompletions)) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }
  
  return streak;
}

// Create a short greeting based on time of day
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// Generate a color for a habit that contrasts with its background
export function getContrastColor(backgroundColor: string): string {
  // Convert hex to RGB
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(6, 2), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black for bright colors, white for dark ones
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

// Calculate completion percentage for a habit
export function calculateCompletionPercentage(
  completions: Date[],
  days: number = 7
): number {
  if (days <= 0) return 0;
  
  const today = new Date();
  let dayCount = 0;
  
  // Count completions within the specified number of days
  for (let i = 0; i < days; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    
    if (isDateInArray(checkDate, completions)) {
      dayCount++;
    }
  }
  
  return Math.round((dayCount / days) * 100);
}

// Format date to display in weekly view (Mon, Tue, etc.)
export function formatWeekDay(date: Date): string {
  return format(date, "EEE");
}

// Format date to just get the day number
export function formatDayNumber(date: Date): string {
  return format(date, "d");
}
