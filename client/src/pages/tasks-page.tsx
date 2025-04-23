import { AppLayout } from "@/components/layout/AppLayout";
import { HabitList } from "../components/tasks/HabitList";

export default function TasksPage() {
  return (
    <AppLayout>
      <div className='h-screen w-full max-w-xl mx-auto p-4'>
        <HabitList title='All Tasks' />
      </div>
    </AppLayout>
  );
}
