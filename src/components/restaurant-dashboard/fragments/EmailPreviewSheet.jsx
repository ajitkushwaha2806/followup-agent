"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { emailService } from "@/services/frontend/emailService";
import { useGmailAuth } from "@/hooks/useGmailAuth";
import {
  X,
  Sparkles,
  Copy,
  Check,
  Mail,
  RefreshCw,
  SlidersHorizontal,
  Building2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Download,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Rocket,
  Clock,
  Edit3,
  Eye,
  CheckCheck,
  Send,
  User,
  LogOut,
  Plus,
  Trash2,
  Paperclip,
  File,
  Image as ImageIcon,
  UploadCloud,
} from "lucide-react";

const PURPOSE_OPTIONS = [
  {
    value: "ONBOARDING_FOLLOWUP",
    label: "Onboarding Review",
    desc: "Target pending pipeline stages",
    icon: FileText,
  },
  {
    value: "DOCUMENT_CLARIFICATION",
    label: "Doc Verification",
    desc: "Expedite re-uploaded documents",
    icon: ShieldCheck,
  },
];

const SUGGESTED_RECIPIENTS = [
  "merchant@zomato.com",
  "newlistingrequest@zomato.com",
  "merchantonboarding@zomato.com",
];

export default function EmailPreviewSheet({ isOpen, onClose, restaurant, merchantUser }) {
  const [emailType, setEmailType] = useState("ONBOARDING_FOLLOWUP");
  const [customNotes, setCustomNotes] = useState("");
  const [showOptions, setShowOptions] = useState(false);

  const [toEmails, setToEmails] = useState(["merchantonboarding@zomato.com"]);
  const [ccEmails, setCcEmails] = useState([]);
  const [bccEmails, setBccEmails] = useState([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);

  const [toInput, setToInput] = useState("");
  const [ccInput, setCcInput] = useState("");
  const [bccInput, setBccInput] = useState("");

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedType, setCopiedType] = useState(null);
  const [viewMode, setViewMode] = useState("formatted");

  const fileInputRef = useRef(null);

  // Gmail OAuth hook
  const {
    user: gmailUser,
    isConnected: isGmailConnected,
    isConnecting: isGmailConnecting,
    isSending: isGmailSending,
    authError: gmailAuthError,
    sendSuccess: gmailSendSuccess,
    connectGmail,
    disconnectGmail,
    sendEmail: sendViaGmail,
    clearStatus: clearGmailStatus,
  } = useGmailAuth();

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      if (file.size > 20 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds the 20MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result;
        const formattedSize =
          file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round(file.size / 1024)} KB`;

        setAttachments((prev) => {
          // Avoid duplicate by name
          if (prev.some((a) => a.filename === file.name && a.size === file.size)) {
            return prev;
          }
          return [
            ...prev,
            {
              id: `${file.name}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              filename: file.name,
              mimeType: file.type || "application/octet-stream",
              size: file.size,
              sizeFormatted: formattedSize,
              content: base64,
            },
          ];
        });
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = "";
  };

  const removeAttachment = (id) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const addEmail = (type, emailToAdd) => {
    const trimmed = (emailToAdd || "").trim().replace(/[;,]$/, "");
    if (!trimmed) return;

    if (type === "to") {
      if (!toEmails.includes(trimmed)) {
        setToEmails((prev) => [...prev, trimmed]);
      }
      setToInput("");
    } else if (type === "cc") {
      if (!ccEmails.includes(trimmed)) {
        setCcEmails((prev) => [...prev, trimmed]);
      }
      setCcInput("");
    } else if (type === "bcc") {
      if (!bccEmails.includes(trimmed)) {
        setBccEmails((prev) => [...prev, trimmed]);
      }
      setBccInput("");
    }
  };

  const removeEmail = (type, emailToRemove) => {
    if (type === "to") {
      setToEmails((prev) => prev.filter((e) => e !== emailToRemove));
    } else if (type === "cc") {
      setCcEmails((prev) => prev.filter((e) => e !== emailToRemove));
    } else if (type === "bcc") {
      setBccEmails((prev) => prev.filter((e) => e !== emailToRemove));
    }
  };

  const handleKeyDownEmail = (e, type) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      const val = type === "to" ? toInput : type === "cc" ? ccInput : bccInput;
      addEmail(type, val);
    }
  };

  const handleGenerate = useCallback(
    async (overrideType = emailType, overrideNotes = customNotes) => {
      if (!restaurant) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await emailService.generateEmail({
          restaurant,
          merchantUser,
          tone: "Polite, professional, short, concise, and urgent escalation",
          emailType: overrideType,
          customNotes: overrideNotes,
        });

        if (response.success && response.email) {
          const generated = response.email;
          setSubject(generated.subject || "");
          setBody(generated.body || "");
          if (generated.recipientEmail && toEmails.length === 0) {
            setToEmails([generated.recipientEmail]);
          }
        } else {
          throw new Error(response.message || "Could not generate email");
        }
      } catch (err) {
        console.error("Failed to generate email:", err);
        setError(err.response?.data?.message || err.message || "Failed to generate email");
      } finally {
        setIsLoading(false);
      }
    },
    [restaurant, merchantUser, emailType, customNotes, toEmails.length]
  );

  useEffect(() => {
    if (isOpen && restaurant) {
      handleGenerate();
    } else if (!isOpen) {
      setCopiedType(null);
      setError(null);
      clearGmailStatus();
    }
  }, [isOpen, restaurant]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !restaurant) return null;

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleCopyFullEmail = () => {
    const headerLines = [
      `To: ${toEmails.join(", ")}`,
      ccEmails.length ? `Cc: ${ccEmails.join(", ")}` : "",
      bccEmails.length ? `Bcc: ${bccEmails.join(", ")}` : "",
      `Subject: ${subject}`,
    ]
      .filter(Boolean)
      .join("\n");

    const fullText = `${headerLines}\n\n${body}`;
    handleCopy(fullText, "all");
  };

  const handleDownloadTxt = () => {
    const headerLines = [
      `To: ${toEmails.join(", ")}`,
      ccEmails.length ? `Cc: ${ccEmails.join(", ")}` : "",
      bccEmails.length ? `Bcc: ${bccEmails.join(", ")}` : "",
      `Subject: ${subject}`,
      `Date: ${new Date().toLocaleString()}`,
      `Restaurant: ${restaurant.name} (ID: ${restaurant.resId})`,
    ]
      .filter(Boolean)
      .join("\n");

    const fullText = `${headerLines}\n\n-------------------------\n\n${body}`;
    const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Followup_Email_${restaurant.name.replace(/[^a-zA-Z0-9]/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSendGmailClick = async () => {
    const targetTo = toEmails.length > 0 ? toEmails : ["merchantonboarding@zomato.com"];
    try {
      await sendViaGmail({
        to: targetTo,
        cc: ccEmails,
        bcc: bccEmails,
        subject,
        body,
        from: gmailUser?.email,
        attachments,
      });
    } catch (err) { }
  };

  const mailtoParams = new URLSearchParams();
  if (ccEmails.length) mailtoParams.set("cc", ccEmails.join(","));
  if (bccEmails.length) mailtoParams.set("bcc", bccEmails.join(","));
  mailtoParams.set("subject", subject);
  mailtoParams.set("body", body);

  const mailtoUrl = `mailto:${encodeURIComponent(toEmails.join(","))}?${mailtoParams.toString()}`;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-950/65 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-2xl bg-zinc-50 dark:bg-zinc-950 shadow-2xl border-l border-zinc-200 dark:border-zinc-800/90 flex flex-col transform transition-transform duration-300 ease-out">
          {/* Header */}
          <div className="px-6 py-4.5 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-red-600/25">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                    AI Follow-up Email
                  </h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                    Live Assistant
                  </span>
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[220px]">
                    {restaurant.name}
                  </span>
                  {restaurant.resId && (
                    <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                      ID: {restaurant.resId}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close panel (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* Gmail Connected Account Bar */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                    />
                  </svg>
                </div>

                {isGmailConnected ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-zinc-500 dark:text-zinc-400">Connected:</span>
                    <strong className="text-zinc-900 dark:text-zinc-100 font-semibold truncate max-w-[220px]">
                      {gmailUser?.email}
                    </strong>
                  </div>
                ) : (
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">
                    Connect Gmail to send directly with 1-click
                  </div>
                )}
              </div>

              {isGmailConnected ? (
                <button
                  type="button"
                  onClick={disconnectGmail}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                  title="Disconnect Gmail Account"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Disconnect</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => connectGmail()}
                  disabled={isGmailConnecting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all cursor-pointer shadow-xs"
                >
                  {isGmailConnecting ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <span>Connect Gmail</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Gmail Send Success Alert */}
            {gmailSendSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-3 text-xs text-emerald-800 dark:text-emerald-200 animate-in fade-in slide-in-from-top-1 duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5 flex-1">
                  <p className="font-bold">Follow-up Email Sent Successfully!</p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    Delivered via Gmail to <strong>{gmailSendSuccess.sentTo}</strong> at{" "}
                    {gmailSendSuccess.sentAt}.
                  </p>
                </div>
              </div>
            )}

            {/* Gmail Auth / Send Error Alert */}
            {gmailAuthError && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                <div className="space-y-1 flex-1">
                  <p className="font-bold">Gmail Error</p>
                  <p>{gmailAuthError}</p>
                </div>
              </div>
            )}

            {/* AI Generator Controls Card */}
            <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 space-y-4">
                {/* Purpose Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 uppercase tracking-wider">
                      <span>Email Purpose</span>
                    </label>
                    <span className="text-[11px] text-zinc-400 font-medium">
                      Select objective
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PURPOSE_OPTIONS.map((item) => {
                      const IconComponent = item.icon;
                      const isSelected = emailType === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setEmailType(item.value)}
                          className={`p-3 rounded-2xl border text-left transition-all relative flex items-start gap-3 cursor-pointer ${
                            isSelected
                              ? "bg-red-50/60 dark:bg-red-950/30 border-red-500/80 text-zinc-900 dark:text-zinc-100 ring-1 ring-red-500/40 shadow-xs"
                              : "bg-zinc-50/50 dark:bg-zinc-900/60 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                              isSelected
                                ? "bg-red-600 text-white shadow-xs"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                            }`}
                          >
                            <IconComponent className="w-4 h-4" />
                          </div>

                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-xs font-bold ${
                                  isSelected
                                    ? "text-red-700 dark:text-red-400"
                                    : "text-zinc-800 dark:text-zinc-200"
                                }`}
                              >
                                {item.label}
                              </span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-red-600 dark:text-red-400 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-400 leading-snug line-clamp-1">
                              {item.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Collapsible Custom Instructions */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => setShowOptions(!showOptions)}
                    className="w-full py-2 flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-red-500" />
                      <span>Custom Instructions / Notes (Optional)</span>
                    </div>
                    {showOptions ? (
                      <ChevronUp className="w-4 h-4 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400" />
                    )}
                  </button>

                  {showOptions && (
                    <div className="pt-2 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <textarea
                        value={customNotes}
                        onChange={(e) => setCustomNotes(e.target.value)}
                        placeholder="e.g. Uploaded revised FSSAI certificate today morning. Please prioritize onboarding unblock..."
                        rows={2}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-xs transition-all"
                      />
                    </div>
                  )}
                </div>

                {/* Regenerate Action Button */}
                <button
                  type="button"
                  onClick={() => handleGenerate("Polite, professional, short, concise, and urgent escalation", emailType, customNotes)}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md shadow-red-600/20 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  <span>{isLoading ? "Generating with Bedrock AI..." : "Regenerate Tailored Email"}</span>
                </button>
              </div>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                <div className="space-y-1 flex-1">
                  <p className="font-bold">Email Generation Issue</p>
                  <p>{error}</p>
                  <button
                    onClick={() => handleGenerate()}
                    className="underline hover:text-rose-900 font-semibold cursor-pointer"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            {/* Loading State / Shimmer */}
            {isLoading ? (
              <div className="space-y-4 py-8">
                <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 animate-pulse shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-1/3" />
                  </div>
                  <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-3/4" />
                  <div className="space-y-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
                    <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-11/12" />
                    <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-4/5" />
                    <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
                    <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
                  </div>
                </div>
                <div className="text-center text-xs text-zinc-500 dark:text-zinc-400 font-medium flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin text-red-500" />
                  <span>Amazon Bedrock is crafting your executive follow-up...</span>
                </div>
              </div>
            ) : (
              /* Generated Email Envelope */
              <div className="space-y-4">
                {/* Email Viewer Card */}
                <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                  {/* Recipient & Subject Header Area */}
                  <div className="p-4 sm:p-5 bg-zinc-50/70 dark:bg-zinc-950/50 border-b border-zinc-200/80 dark:border-zinc-800/80 space-y-3">
                    {/* TO FIELD ROW */}
                    <div className="flex items-start gap-3 text-xs">
                      <span className="font-bold text-zinc-400 w-12 uppercase tracking-wider text-[10px] mt-1.5">
                        To:
                      </span>

                      <div className="flex-1 flex flex-wrap items-center gap-1.5">
                        {toEmails.map((email) => (
                          <span
                            key={email}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-mono text-xs text-zinc-800 dark:text-zinc-200 shadow-2xs group"
                          >
                            <Mail className="w-3 h-3 text-red-500 flex-shrink-0" />
                            <span className="truncate max-w-[240px]">{email}</span>
                            <button
                              type="button"
                              onClick={() => removeEmail("to", email)}
                              className="text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-0.5 rounded cursor-pointer"
                              title={`Remove ${email}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}

                        <input
                          type="email"
                          value={toInput}
                          onChange={(e) => setToInput(e.target.value)}
                          onKeyDown={(e) => handleKeyDownEmail(e, "to")}
                          onBlur={() => {
                            if (toInput) addEmail("to", toInput);
                          }}
                          placeholder={toEmails.length === 0 ? "Add recipient email..." : "+ Add..."}
                          className="min-w-[130px] flex-1 py-1 px-2 text-xs font-mono bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
                        />
                      </div>

                      {/* CC / BCC Toggles & Copy */}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <button
                          type="button"
                          onClick={() => setShowCc(!showCc)}
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                            showCc || ccEmails.length > 0
                              ? "bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400"
                              : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                          }`}
                        >
                          Cc
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowBcc(!showBcc)}
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                            showBcc || bccEmails.length > 0
                              ? "bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400"
                              : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                          }`}
                        >
                          Bcc
                        </button>
                        <button
                          onClick={() => handleCopy(toEmails.join(", "), "recipient")}
                          className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                          title="Copy TO recipients"
                        >
                          {copiedType === "recipient" ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* CC FIELD (Collapsible) */}
                    {(showCc || ccEmails.length > 0) && (
                      <div className="flex items-start gap-3 text-xs pt-2 border-t border-zinc-200/50 dark:border-zinc-800/50 animate-in fade-in duration-150">
                        <span className="font-bold text-zinc-400 w-12 uppercase tracking-wider text-[10px] mt-1.5">
                          Cc:
                        </span>
                        <div className="flex-1 flex flex-wrap items-center gap-1.5">
                          {ccEmails.map((email) => (
                            <span
                              key={email}
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-mono text-xs text-zinc-800 dark:text-zinc-200 shadow-2xs"
                            >
                              <span className="truncate max-w-[240px]">{email}</span>
                              <button
                                type="button"
                                onClick={() => removeEmail("cc", email)}
                                className="text-zinc-400 hover:text-red-500 transition-colors p-0.5 rounded cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                          <input
                            type="email"
                            value={ccInput}
                            onChange={(e) => setCcInput(e.target.value)}
                            onKeyDown={(e) => handleKeyDownEmail(e, "cc")}
                            onBlur={() => {
                              if (ccInput) addEmail("cc", ccInput);
                            }}
                            placeholder="Add Cc email..."
                            className="min-w-[130px] flex-1 py-0.5 px-2 text-xs font-mono bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* BCC FIELD (Collapsible) */}
                    {(showBcc || bccEmails.length > 0) && (
                      <div className="flex items-start gap-3 text-xs pt-2 border-t border-zinc-200/50 dark:border-zinc-800/50 animate-in fade-in duration-150">
                        <span className="font-bold text-zinc-400 w-12 uppercase tracking-wider text-[10px] mt-1.5">
                          Bcc:
                        </span>
                        <div className="flex-1 flex flex-wrap items-center gap-1.5">
                          {bccEmails.map((email) => (
                            <span
                              key={email}
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-mono text-xs text-zinc-800 dark:text-zinc-200 shadow-2xs"
                            >
                              <span className="truncate max-w-[240px]">{email}</span>
                              <button
                                type="button"
                                onClick={() => removeEmail("bcc", email)}
                                className="text-zinc-400 hover:text-red-500 transition-colors p-0.5 rounded cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                          <input
                            type="email"
                            value={bccInput}
                            onChange={(e) => setBccInput(e.target.value)}
                            onKeyDown={(e) => handleKeyDownEmail(e, "bcc")}
                            onBlur={() => {
                              if (bccInput) addEmail("bcc", bccInput);
                            }}
                            placeholder="Add Bcc email..."
                            className="min-w-[130px] flex-1 py-0.5 px-2 text-xs font-mono bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* Quick Preset Email Suggestions */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                        Presets:
                      </span>
                      {SUGGESTED_RECIPIENTS.map((preset) => {
                        const isAdded = toEmails.includes(preset) || ccEmails.includes(preset);
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              if (!toEmails.includes(preset)) {
                                setToEmails((prev) => [...prev, preset]);
                              }
                            }}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                              isAdded
                                ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 font-bold"
                                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                            }`}
                          >
                            <Plus className="w-2.5 h-2.5 opacity-70" />
                            <span>{preset}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Subject Field */}
                    <div className="flex items-start gap-3 text-xs pt-2.5 border-t border-zinc-200/60 dark:border-zinc-800/60">
                      <span className="font-bold text-zinc-400 w-12 uppercase tracking-wider text-[10px] mt-1.5">
                        Subject:
                      </span>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="w-full font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 bg-transparent focus:outline-none focus:ring-1 focus:ring-red-500 rounded-md p-1 -m-1"
                          placeholder="Email subject..."
                        />
                      </div>
                      <button
                        onClick={() => handleCopy(subject, "subject")}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Copy subject line"
                      >
                        {copiedType === "subject" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* View Mode Switcher */}
                  <div className="px-4 sm:px-5 py-2.5 bg-zinc-100/60 dark:bg-zinc-900/60 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-1 bg-zinc-200/80 dark:bg-zinc-800/80 p-0.5 rounded-xl text-xs font-semibold">
                      <button
                        onClick={() => setViewMode("formatted")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                          viewMode === "formatted"
                            ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-bold"
                            : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                        }`}
                      >
                        <Eye className="w-3 h-3" />
                        <span>Formatted</span>
                      </button>
                      <button
                        onClick={() => setViewMode("raw")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                          viewMode === "raw"
                            ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-bold"
                            : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                        }`}
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit Raw</span>
                      </button>
                    </div>

                    <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-medium">
                      <CheckCheck className="w-3 h-3 text-emerald-500" />
                      <span>Ready to send</span>
                    </span>
                  </div>

                  {/* Email Body */}
                  {viewMode === "formatted" ? (
                    <div className="p-5 sm:p-7 space-y-4">
                      <div className="text-xs sm:text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-line font-sans select-text">
                        {body}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2">
                      <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={14}
                        className="w-full p-4 text-xs font-mono leading-relaxed text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                      />
                    </div>
                  )}

                  {/* Document Attachments Section */}
                  <div className="px-5 py-3.5 bg-zinc-50/80 dark:bg-zinc-950/60 border-t border-zinc-200/70 dark:border-zinc-800/70 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Attached Documents & Screenshots
                        </span>
                        {attachments.length > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 font-bold text-[10px]">
                            {attachments.length}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3 h-3 text-red-500" />
                        <span>Attach Document</span>
                      </button>
                    </div>

                    {/* Hidden Native File Input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,application/pdf,.doc,.docx,.txt,.csv"
                    />

                    {/* Attachment Chips List */}
                    {attachments.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {attachments.map((file) => {
                          const isImg = file.mimeType.startsWith("image/");
                          return (
                            <div
                              key={file.id}
                              className="inline-flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs shadow-2xs group"
                            >
                              {isImg ? (
                                <ImageIcon className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                              ) : (
                                <File className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                              )}
                              <span className="font-mono text-zinc-800 dark:text-zinc-200 font-medium truncate max-w-[180px]">
                                {file.filename}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono">
                                ({file.sizeFormatted})
                              </span>
                              <button
                                type="button"
                                onClick={() => removeAttachment(file.id)}
                                className="p-0.5 rounded text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer ml-0.5"
                                title={`Remove ${file.filename}`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 hover:border-red-400 dark:hover:border-red-800 bg-white/50 dark:bg-zinc-900/40 text-center text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        <UploadCloud className="w-4 h-4 text-zinc-400" />
                        <span>Click to attach FSSAI certificate, GST document, or portal screenshot (PDF, PNG, JPG)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Floating Action Bar */}
          <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md sticky bottom-0 z-30 flex items-center justify-end gap-3 shadow-lg">
            {/* Direct Gmail Send Button */}
            <button
              type="button"
              onClick={handleSendGmailClick}
              disabled={isGmailSending || toEmails.length === 0}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-red-600/25 cursor-pointer"
            >
              {isGmailSending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending via Gmail...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{isGmailConnected ? "Send via Gmail" : "Connect & Send via Gmail"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
