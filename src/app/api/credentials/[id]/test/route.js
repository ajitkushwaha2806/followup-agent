import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import Credential from "@/models/Credential";
import { apiClient } from "@/lib/api/client";
import { ZOMATO_ENDPOINTS } from "@/services/zomato-endpoints";

export async function POST(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const credential = await Credential.findById(id);
    if (!credential) {
      return NextResponse.json(
        { success: false, message: "Credential not found" },
        { status: 404 }
      );
    }

    let isValid = false;
    let errorDetail = null;
    let userData = null;

    try {
      const response = await apiClient({
        endpoint: ZOMATO_ENDPOINTS.GET_USER_DETAILS,
        method: "GET",
        headers: {
          Cookie: credential.cookie,
        },
      });

      const user = response?.data || response;
      if (user && (user.user_id || user.name || user.email)) {
        isValid = true;
        userData = user;
      } else {
        isValid = false;
        errorDetail = "Invalid user details received";
      }
    } catch (err) {
      errorDetail = err.message || "Unauthorized (401) or expired session";
    }

    const updated = await Credential.findByIdAndUpdate(
      id,
      {
        status: isValid ? "ACTIVE" : "EXPIRED",
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      isValid,
      status: updated.status,
      message: isValid
        ? `Session verified (${userData?.name || "Active User"}). Status is ACTIVE.`
        : `Verification failed: ${errorDetail}. Status is EXPIRED.`,
      data: updated,
      user: userData,
    });
  } catch (error) {
    console.error("Error testing credential:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to test credential",
      },
      { status: 500 }
    );
  }
}
