import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Home, ListChecks, Calendar, BarChart2, User } from "lucide-react";

interface BottomNavbarProps {
  currentPath: string;
}

export default function BottomNavbar({ currentPath }: BottomNavbarProps) {
  const navItems = [
    {
      icon: Home,
      label: "Home",
      href: "/",
    },
    {
      icon: ListChecks,
      label: "Habits",
      href: "/habits",
    },
    {
      icon: Calendar,
      label: "Calendar",
      href: "/calendar",
    },
    {
      icon: BarChart2,
      label: "Stats",
      href: "/stats",
    },
  ];

  return (
    <nav className="bg-white border-t border-border md:hidden">
      <div className="grid h-full grid-cols-4">
        {navItems.map((item) => (
          <Link href={item.href} key={item.href}>
            <a className={cn(
              "flex flex-col items-center justify-center py-3",
              currentPath === item.href
                ? "text-primary"
                : "text-muted-foreground"
            )}>
              <item.icon className="h-6 w-6" />
              <span className="text-xs">{item.label}</span>
            </a>
          </Link>
        ))}
      </div>
    </nav>
  );
}
