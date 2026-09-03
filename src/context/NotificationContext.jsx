"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle2, CircleAlert, Info, TriangleAlert, X } from "lucide-react";

const NotificationContext = createContext(null);

const variants = {
  success: {
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
    iconClass: "text-emerald-600",
    progress: "bg-emerald-500",
  },
  error: {
    icon: CircleAlert,
    className: "border-red-200 bg-red-50 text-red-900",
    iconClass: "text-red-600",
    progress: "bg-red-500",
  },
  warning: {
    icon: TriangleAlert,
    className: "border-yellow-200 bg-yellow-50 text-yellow-900",
    iconClass: "text-yellow-600",
    progress: "bg-yellow-500",
  },
  info: {
    icon: Info,
    className: "border-sky-200 bg-sky-50 text-sky-900",
    iconClass: "text-sky-600",
    progress: "bg-sky-500",
  },
};

export function NotificationProvider({ children }) {
  const [notification, setNotification] = useState({
    visible: false,
    type: "info",
    message: "",
    title: "",
    duration: 4000,
  });

  const hide = useCallback(() => {
    setNotification((prev) => ({ ...prev, visible: false }));
  }, []);

  const show = useCallback((type, message, options = {}) => {
    const duration = options?.duration !== undefined ? options.duration : 4000;
    setNotification({
      visible: true,
      type: type || "info",
      message: typeof message === "string" ? message : JSON.stringify(message),
      title: options?.title || "",
      duration,
    });
  }, []);

  useEffect(() => {
    if (!notification.visible || !notification.duration) return;
    const timer = setTimeout(() => {
      hide();
    }, notification.duration);
    return () => clearTimeout(timer);
  }, [notification.visible, notification.duration, hide]);

  const notify = {
    success: (message, options) => show("success", message, options),
    error: (message, options) => show("error", message, options),
    info: (message, options) => show("info", message, options),
    warning: (message, options) => show("warning", message, options),
    hide,
  };

  const config = variants[notification.type] || variants.info;
  const Icon = config.icon;

  return (
    <NotificationContext.Provider value={notify}>
      {children}
      {notification.visible && (
        <div
          className={`fixed inset-x-0 top-0 z-[9999] border-b backdrop-blur-sm shadow-md transition-all duration-300 ${config.className}`}
        >
          <div className="relative mx-auto flex h-14 max-w-screen-2xl items-center gap-3 px-6">
            <Icon className={`h-5 w-5 shrink-0 ${config.iconClass}`} />

            <div className="min-w-0 flex-1">
              {notification.title && (
                <p className="font-semibold text-xs leading-none mb-0.5">
                  {notification.title}
                </p>
              )}
              <p className="truncate text-sm font-medium leading-5">
                {notification.message}
              </p>
            </div>

            <button
              type="button"
              onClick={hide}
              className="rounded-lg p-1.5 transition hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    return {
      success: (msg) => console.log("[Success]", msg),
      error: (msg) => console.error("[Error]", msg),
      info: (msg) => console.log("[Info]", msg),
      warning: (msg) => console.warn("[Warning]", msg),
      hide: () => {},
    };
  }
  return context;
}

export default useNotification;
