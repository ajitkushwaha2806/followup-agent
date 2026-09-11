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

  // Load Google Client ID from backend if not provided in environment
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

  // Restore persistent user connection from localStorage without disconnecting on token expiry
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.email || parsed.accessToken)) {
          setUser(parsed);
        }
      }
    } catch { }
  }, []);

  // Load Google Identity Services SDK script
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

    return () => { };
  }, []);

  // Get a valid access token, seamlessly requesting/renewing if expired
  const getValidAccessToken = useCallback(
    async (interactive = true) => {
      // If cached token is still valid (with 2-minute safety buffer), use it
      if (
        user?.accessToken &&
        user.expiresAt &&
        Date.now() < user.expiresAt - 120 * 1000
      ) {
        return user.accessToken;
      }

      if (!clientId) {
        throw new Error("Google Client ID is not configured. Please check your settings.");
      }

      if (!window.google?.accounts?.oauth2) {
        throw new Error("Google Identity Services script is still loading. Please try again.");
      }

      return new Promise((resolve, reject) => {
        setIsConnecting(true);
        setAuthError(null);

        try {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope:
              "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
            callback: async (tokenResponse) => {
              setIsConnecting(false);

              if (tokenResponse.error) {
                console.error("Google Auth Error:", tokenResponse.error);
                const errMsg =
                  tokenResponse.error_description || tokenResponse.error;
                setAuthError(errMsg);
                reject(new Error(errMsg));
                return;
              }

              const accessToken = tokenResponse.access_token;
              const expiresIn = tokenResponse.expires_in || 3599; // seconds
              const expiresAt = Date.now() + expiresIn * 1000;

              try {
                let email = user?.email;
                let name = user?.name;
                let picture = user?.picture;

                // Fetch Google profile if not yet cached
                if (!email || email === "Connected Gmail Account") {
                  try {
                    const profile = await emailService.getGoogleProfile(accessToken);
                    email = profile.email;
                    name = profile.name;
                    picture = profile.picture;
                  } catch (profileErr) {
                    console.warn("Could not fetch user profile details:", profileErr);
                  }
                }

                const updatedUser = {
                  email: email || "Connected Gmail Account",
                  name: name || "",
                  picture: picture || null,
                  accessToken,
                  expiresAt,
                };

                setUser(updatedUser);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
                setAuthError(null);
                resolve(accessToken);
              } catch (profileErr) {
                const fallbackUserData = {
                  email: user?.email || "Connected Gmail Account",
                  accessToken,
                  expiresAt,
                };
                setUser(fallbackUserData);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(fallbackUserData));
                resolve(accessToken);
              }
            },
          });

          tokenClientRef.current = client;

          // Request access token
          // If we already know the user's email, hint it and avoid unnecessary re-prompting
          const requestConfig = {};
          if (user?.email && user.email !== "Connected Gmail Account") {
            requestConfig.hint = user.email;
          }

          if (!interactive) {
            requestConfig.prompt = "";
          } else if (user?.email) {
            requestConfig.prompt = "";
          } else {
            requestConfig.prompt = "select_account";
          }

          client.requestAccessToken(requestConfig);
        } catch (err) {
          setIsConnecting(false);
          console.error("Failed to init Google Token Client:", err);
          setAuthError(err.message || "Could not open Google Login popup");
          reject(err);
        }
      });
    },
    [clientId, user]
  );

  const connectGmail = useCallback(
    async (onSuccessCallback) => {
      setAuthError(null);
      try {
        const token = await getValidAccessToken(true);
        if (onSuccessCallback && token) {
          const stored = localStorage.getItem(STORAGE_KEY);
          onSuccessCallback(stored ? JSON.parse(stored) : { accessToken: token });
        }
      } catch (err) {
        console.error("connectGmail error:", err);
      }
    },
    [getValidAccessToken]
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

  const executeSend = useCallback(
    async (token, { to, cc, bcc, subject, body, from, attachments = [] }) => {
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
    },
    [user]
  );

  const sendEmail = useCallback(
    async ({ to, cc, bcc, subject, body, from, attachments = [] }) => {
      setAuthError(null);
      setSendSuccess(null);

      try {
        let token = await getValidAccessToken(true);
        if (!token) {
          throw new Error("Could not obtain a valid Gmail access token. Please connect Gmail.");
        }

        try {
          await executeSend(token, { to, cc, bcc, subject, body, from, attachments });
        } catch (sendErr) {
          // If 401 Unauthorized, token may have been revoked/expired mid-session; refresh token once and retry
          if (sendErr?.response?.status === 401) {
            console.warn("Gmail token returned 401, refreshing token and retrying...");
            if (user) {
              user.expiresAt = 0;
            }
            token = await getValidAccessToken(true);
            await executeSend(token, { to, cc, bcc, subject, body, from, attachments });
          } else {
            throw sendErr;
          }
        }
      } catch (err) {
        console.error("sendEmail error:", err);
      }
    },
    [getValidAccessToken, executeSend, user]
  );

  return {
    clientId,
    user,
    isConnected: Boolean(user?.email || user?.accessToken),
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

