import ZomatoCredentialsManager from "@/components/zomato-credential-manager";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950">
      <main>
        <ZomatoCredentialsManager />
      </main>
    </div>
  );
}
