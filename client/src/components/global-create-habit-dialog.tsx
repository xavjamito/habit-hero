import { useCreateHabit } from "@/hooks/use-create-habit";
import CreateHabitDialog from "@/components/create-habit-dialog";

/**
 * A global version of the CreateHabitDialog that can be controlled
 * from anywhere in the app using the useCreateHabit hook.
 */
export function GlobalCreateHabitDialog() {
  const { isOpen, close } = useCreateHabit();

  return (
    <CreateHabitDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    />
  );
}
