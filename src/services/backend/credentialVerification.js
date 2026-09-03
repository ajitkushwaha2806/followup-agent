import { apiClient } from "@/lib/api/client";
import { ZOMATO_ENDPOINTS } from "@/services/zomato-endpoints";

export async function verifyZomatoCookie(cookie, type = "ONBOARDING") {
  if (!cookie || typeof cookie !== "string" || !cookie.trim()) {
    return {
      isValid: false,
      status: "EXPIRED",
      userData: null,
      error: "Cookie is empty or missing",
    };
  }

  const cleanCookie = cookie.trim();
  const isMenuType = String(type || "").toUpperCase() === "MENU_MANAGEMENT";

  if (isMenuType) {
    try {
      const response = await apiClient({
        baseURL: process.env.ZOMATO_API_BASE_URL || "https://zomato.com",
        endpoint: ZOMATO_ENDPOINTS.CHECK_AUTH || "restaurant-onboard-diy/check-auth",
        method: "GET",
        headers: {
          Cookie: cleanCookie,
        },
      });

      const data = response?.data || response;

      const isValidAuth = Boolean(
        data &&
        (data.status === "success" ||
          data.success === true ||
          data.is_logged_in === true ||
          data.isLoggedIn === true ||
          data.authenticated === true ||
          data.user ||
          data.user_id ||
          data.userId ||
          data.id ||
          response?.status === "success" ||
          response?.status === 200 ||
          response?.code === 200)
      );

      if (isValidAuth) {
        const name =
          data?.name ||
          data?.user?.name ||
          data?.username ||
          data?.owner_name ||
          null;

        const email =
          data?.email ||
          data?.user?.email ||
          data?.user_email ||
          null;

        const userId =
          data?.user_id ||
          data?.userId ||
          data?.id ||
          data?.user?.id ||
          data?.user?.user_id ||
          null;

        return {
          isValid: true,
          status: "ACTIVE",
          userData: data,
          name: name ? String(name).trim() : null,
          email: email ? String(email).trim().toLowerCase() : null,
          userId: userId ? String(userId).trim() : null,
          error: null,
        };
      }

      return {
        isValid: false,
        status: "EXPIRED",
        userData: data,
        error: response?.message || data?.message || "Invalid or expired session cookie",
      };
    } catch (err) {
      console.warn("[verifyZomatoCookie:MENU] Check auth failed:", err.message);
      return {
        isValid: false,
        status: "EXPIRED",
        userData: null,
        error: err.message || "Menu management session expired or unauthorized",
      };
    }
  }

  // Default: ONBOARDING verification via GET_USER_DETAILS
  try {
    const response = await apiClient({
      baseURL: process.env.ZOMATO_API_BASE_URL_V2 || "https://api.zomato.com",
      endpoint: ZOMATO_ENDPOINTS.GET_USER_DETAILS,
      method: "GET",
      headers: {
        Cookie: cleanCookie,
      },
    });

    const data = response?.data || response;

    // Check if the response contains valid user or entity information
    const isValidUser = Boolean(
      data &&
      (data.user_id ||
        data.userId ||
        data.id ||
        data.name ||
        data.email ||
        data.mobile ||
        data.phone ||
        data.user?.user_id ||
        data.user?.id ||
        data.user?.name ||
        data.user?.email ||
        data.entities ||
        data.restaurants ||
        data.status === "success" ||
        response?.status === "success" ||
        response?.status === 200 ||
        response?.code === 200)
    );

    if (isValidUser) {
      const email =
        data.email ||
        data.user?.email ||
        data.user_email ||
        null;

      const name =
        data.name ||
        data.user?.name ||
        data.username ||
        data.owner_name ||
        null;

      const userId =
        data.user_id ||
        data.userId ||
        data.id ||
        data.user?.id ||
        data.user?.user_id ||
        null;

      return {
        isValid: true,
        status: "ACTIVE",
        userData: data,
        name: name ? String(name).trim() : null,
        email: email ? String(email).trim().toLowerCase() : null,
        userId: userId ? String(userId).trim() : null,
        error: null,
      };
    }

    return {
      isValid: false,
      status: "EXPIRED",
      userData: data,
      error: response?.message || "Invalid or unauthorized session cookie",
    };
  } catch (err) {
    console.warn("[verifyZomatoCookie:ONBOARDING] Verification failed:", err.message);
    return {
      isValid: false,
      status: "EXPIRED",
      userData: null,
      error: err.message || "Session verification failed (Unauthorized or Expired)",
    };
  }
}

