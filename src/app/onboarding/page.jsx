import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ZomatoCredentialsManager from "@/components/zomato-credential-manager";
import { getUserAccess } from "@/lib/auth/access";

export const metadata = {
  title: "Onboarding Tracker | Zomato Ops",
  description: "Track merchant onboarding stages, verification progress, and follow-up emails.",
};

export default async function OnboardingPage() {
  const user = await currentUser();
  const { hasOnboarding, hasRestaurant } = getUserAccess(user);

  // If user only has access to restaurant, redirect to /
  if (!hasOnboarding && hasRestaurant) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950">
      <main>
        <ZomatoCredentialsManager />
      </main>
    </div>
  );
}
