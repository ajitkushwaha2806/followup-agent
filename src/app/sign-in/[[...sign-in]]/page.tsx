import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 py-12 px-4 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-red-600/30">
          F
        </div>
        <div>
          <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xl tracking-tight">
            Followup<span className="text-red-600">Agent</span>
          </span>
          <span className="ml-2 text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
            Merchant Ops
          </span>
        </div>
      </div>

      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto w-full max-w-md",
            card: "shadow-xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900",
            primaryButton: "bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-md shadow-red-600/20",
          },
        }}
      />
    </main>
  );
}
