import { AppLayout } from "@/components/layout/AppLayout";
import { TaskList } from "@/components/tasks/TaskList";

export default function TasksPage() {
  return (
    <AppLayout>
      <div className='h-screen w-full max-w-xl mx-auto p-4'>
        <TaskList title='All Tasks' />
      </div>
    </AppLayout>
  );
}
