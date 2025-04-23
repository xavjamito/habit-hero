import { AppLayout } from "@/components/layout/AppLayout";
import { ProfileCard } from "@/components/profile/ProfileCard";

export default function ProfilePage() {
  return (
    <AppLayout>
      <div className='flex flex-col md:flex-row h-screen'>
        <div className='flex-1 p-4 md:p-0 overflow-auto'>
          <ProfileCard />
        </div>
      </div>
    </AppLayout>
  );
}
