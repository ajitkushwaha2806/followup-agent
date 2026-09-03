import { HelpCircle, X, ExternalLink } from "lucide-react";
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

        <div className="space-y-3.5 text-xs text-zinc-600 dark:text-zinc-300">
          {COOKIE_GUIDE_STEPS.map((stepItem) => (
            <div key={stepItem.step} className="flex gap-3 items-start p-2.5 rounded-xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
              <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-950 text-red-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                {stepItem.step}
              </div>
              <div className="space-y-1 min-w-0">
                <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {stepItem.title}
                </div>
                <p className="leading-relaxed">
                  {stepItem.link ? (
                    <>
                      {stepItem.text}{" "}
                      <a
                        href={stepItem.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                      >
                        <span>{stepItem.linkLabel}</span>
                        <ExternalLink className="w-3 h-3 inline" />
                      </a>
                    </>
                  ) : (
                    stepItem.text
                  )}
                </p>
              </div>
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
