import { HelpCircle, X } from "lucide-react";
import { COOKIE_GUIDE_STEPS } from "../constants";

export default function CookieGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold">
            <HelpCircle className="w-5 h-5 text-red-600" />
            <span>How to extract your Zomato Merchant Cookie</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-300">
          {COOKIE_GUIDE_STEPS.map((stepItem) => (
            <div key={stepItem.step} className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-950 text-red-600 font-bold flex items-center justify-center flex-shrink-0">
                {stepItem.step}
              </div>
              <p>
                {stepItem.link ? (
                  <>
                    Open your browser and navigate to the{" "}
                    <a
                      href={stepItem.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-red-600 underline font-medium"
                    >
                      {stepItem.linkLabel}
                    </a>{" "}
                    and log in.
                  </>
                ) : (
                  stepItem.text
                )}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
