import { FileText } from "lucide-react";
import { STEP_STATUS_STYLES } from "../constants";

export default function StepPipeline({ steps = [] }) {
  if (!steps || steps.length === 0) return null;

  const approvedCount = steps.filter((s) => s.status === "APPROVED").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Onboarding Stages ({approvedCount}/{steps.length} Approved)
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {steps.map((step, idx) => {
          const config = STEP_STATUS_STYLES[step.status] || {
            card: "bg-zinc-700 text-white border-zinc-600",
            badge: "bg-white/20 text-white border-white/30",
            dot: "bg-white",
            title: "text-white font-bold",
            desc: "text-zinc-200",
            iconBg: "bg-white text-zinc-700",
            time: "text-zinc-300",
            label: step.status,
          };

          return (
            <div
              key={step.slug || idx}
              className={`relative flex flex-col justify-between p-4 rounded-2xl transition-all duration-200 hover:scale-[1.02] ${config.card}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden p-1.5 shadow-sm ${config.iconBg}`}
                  >
                    {step.icon?.url ? (
                      <img
                        src={step.icon.url}
                        alt={step.title}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${config.badge}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                    <span>{step.message?.[0] || config.label}</span>
                  </span>
                </div>

                <h5 className={`text-sm leading-snug ${config.title}`}>
                  {step.title}
                </h5>
                <p className={`text-xs mt-1.5 line-clamp-2 leading-relaxed ${config.desc}`}>
                  {step.description}
                </p>
              </div>

              <div className={`pt-3 mt-3 border-t border-white/20 text-[10px] space-y-0.5 ${config.time}`}>
                {step.updated_at && (
                  <p>
                    <span className="font-medium opacity-90">Updated:</span> {step.updated_at}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
