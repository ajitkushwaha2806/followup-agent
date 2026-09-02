import ZomatoCredentialsManager from "@/components/zomato-credential-manager";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950">
      <nav className="sticky top-0 z-30 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-red-600/30">
              F
            </div>
            <div>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 text-lg tracking-tight">
                Followup<span className="text-red-600">Agent</span>
              </span>
              <span className="ml-2 text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                Merchant Ops
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              API Server Online
            </span>
          </div>
        </div>
      </nav>

      <main>
        <ZomatoCredentialsManager />
      </main>
    </div>
  );
}
