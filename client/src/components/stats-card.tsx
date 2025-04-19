import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  bgColor: string;
  iconColor: string;
}

export default function StatCard({
  icon,
  label,
  value,
  bgColor,
  iconColor
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className={cn("p-3 rounded-full mr-4", bgColor)}>
              {icon}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-2xl font-semibold">{value}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
