import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import RestaurantMenuManager from "@/components/restaurant-menu-manager";
import { getUserAccess } from "@/lib/auth/access";

export const metadata = {
  title: "Restaurant Menu & Pricing Manager | Zomato Ops",
  description: "Manage restaurant credentials, import menus, and control item pricing.",
};

export default async function Home() {
  const user = await currentUser();
  const { hasOnboarding, hasRestaurant } = getUserAccess(user);

  // If user only has access to onboarding, navigate immediately to /onboarding
  if (hasOnboarding && !hasRestaurant) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950">
      <main>
        <RestaurantMenuManager />
      </main>
    </div>
  );
}
