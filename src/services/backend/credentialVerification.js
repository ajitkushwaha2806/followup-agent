import { apiClient } from "@/lib/api/client";
import { ZOMATO_ENDPOINTS } from "@/services/zomato-endpoints";

/**
 * Verify a Zomato merchant cookie using the get-user-details endpoint.
 * @param {string} cookie - The raw cookie string.
 * @returns {Promise<{ isValid: boolean, status: "ACTIVE" | "EXPIRED", userData: any, name?: string, email?: string, userId?: string, error?: string }>}
 */
export async function verifyZomatoCookie(cookie) {
  if (!cookie || typeof cookie !== "string" || !cookie.trim()) {
    return {
      isValid: false,
      status: "EXPIRED",
      userData: null,
      error: "Cookie is empty or missing",
    };
  }

  const cleanCookie = cookie.trim();

  try {
    const response = await apiClient({
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
    console.warn("[verifyZomatoCookie] Verification failed:", err.message);
    return {
      isValid: false,
      status: "EXPIRED",
      userData: null,
      error: err.message || "Session verification failed (Unauthorized or Expired)",
    };
  }
}
