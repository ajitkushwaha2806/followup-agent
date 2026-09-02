"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { emailService } from "@/services/frontend/emailService";

const STORAGE_KEY = "zomato_agent_gmail_user";

export function useGmailAuth() {
  const [clientId, setClientId] = useState(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""
  );
  const [user, setUser] = useState(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [sendSuccess, setSendSuccess] = useState(null);

  const tokenClientRef = useRef(null);

  useEffect(() => {
    if (!clientId) {
      emailService
        .getGoogleConfig()
        .then((res) => {
          if (res?.clientId) {
            setClientId(res.clientId);
          }
        })
        .catch((err) => console.error("Could not load Google client ID:", err));
    }
  }, [clientId]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
          setUser(parsed);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch { }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.google?.accounts?.oauth2) {
      setIsScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => setAuthError("Failed to load Google Identity Services SDK");
    document.body.appendChild(script);

    return () => {
    };
  }, []);

  const connectGmail = useCallback(
    (onSuccessCallback) => {
      setAuthError(null);

      if (!clientId) {
        setAuthError("Google Client ID is not configured. Please check your .env file.");
        return;
      }

      if (!window.google?.accounts?.oauth2) {
        setAuthError("Google Identity Services script is still loading. Please try again in a moment.");
        return;
      }

      setIsConnecting(true);

      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
          callback: async (tokenResponse) => {
            setIsConnecting(false);

            if (tokenResponse.error) {
              console.error("Google Auth Error:", tokenResponse.error);
              setAuthError(tokenResponse.error_description || tokenResponse.error);
              return;
            }

            const accessToken = tokenResponse.access_token;
            const expiresIn = tokenResponse.expires_in || 3599; // seconds
            const expiresAt = Date.now() + expiresIn * 1000;

            try {
              const profile = await emailService.getGoogleProfile(accessToken);
              const userData = {
                email: profile.email,
                name: profile.name,
                picture: profile.picture,
                accessToken,
                expiresAt,
              };

              setUser(userData);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));

              if (onSuccessCallback) {
                onSuccessCallback(userData);
              }
            } catch (profileErr) {
              console.warn("Could not fetch user profile, using basic token data:", profileErr);
              const fallbackUserData = {
                email: "Connected Gmail Account",
                accessToken,
                expiresAt,
              };
              setUser(fallbackUserData);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(fallbackUserData));
              if (onSuccessCallback) {
                onSuccessCallback(fallbackUserData);
              }
            }
          },
        });

        tokenClientRef.current = client;
        client.requestAccessToken({ prompt: "consent" });
      } catch (err) {
        setIsConnecting(false);
        console.error("Failed to init Google Token Client:", err);
        setAuthError(err.message || "Could not open Google Login popup");
      }
    },
    [clientId]
  );

  const disconnectGmail = useCallback(() => {
    if (user?.accessToken && window.google?.accounts?.oauth2) {
      try {
        window.google.accounts.oauth2.revoke(user.accessToken, () => { });
      } catch { }
    }
    setUser(null);
    setSendSuccess(null);
    localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const sendEmail = useCallback(
    async ({ to, cc, bcc, subject, body, from, attachments = [] }) => {
      setAuthError(null);
      setSendSuccess(null);

      if (!user?.accessToken) {
        connectGmail(async (connectedUser) => {
          await executeSend(connectedUser.accessToken, { to, cc, bcc, subject, body, from, attachments });
        });
        return;
      }

      await executeSend(user.accessToken, { to, cc, bcc, subject, body, from, attachments });
    },
    [user, connectGmail]
  );

  const executeSend = async (token, { to, cc, bcc, subject, body, from, attachments = [] }) => {
    setIsSending(true);
    try {
      const result = await emailService.sendViaGmail({
        accessToken: token,
        to,
        cc,
        bcc,
        subject,
        body,
        from: from || user?.email,
        attachments,
      });

      if (result.success) {
        const recipientsSummary = [
          to,
          cc ? `(Cc: ${Array.isArray(cc) ? cc.join(", ") : cc})` : "",
        ].filter(Boolean).join(" ");

        setSendSuccess({
          messageId: result.data?.id,
          sentTo: recipientsSummary,
          sentAt: new Date().toLocaleTimeString(),
        });
        return result;
      } else {
        throw new Error(result.message || "Failed to send email via Gmail");
      }
    } catch (err) {
      console.error("Gmail sending failed:", err);
      const msg = err.response?.data?.message || err.message || "Failed to send email via Gmail";
      setAuthError(msg);
      throw err;
    } finally {
      setIsSending(false);
    }
  };

  return {
    clientId,
    user,
    isConnected: Boolean(user?.accessToken),
    isScriptLoaded,
    isConnecting,
    isSending,
    authError,
    sendSuccess,
    connectGmail,
    disconnectGmail,
    sendEmail,
    clearStatus: () => {
      setAuthError(null);
      setSendSuccess(null);
    },
  };
}
