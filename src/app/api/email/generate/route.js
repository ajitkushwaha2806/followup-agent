import { NextResponse } from "next/server";
import { generateFollowupEmail } from "@/services/backend/ai.service";

export async function POST(req) {
  try {
    const body = await req.json();
    const { restaurant, merchantUser, emailType, tone, customNotes } = body || {};

    if (!restaurant || !restaurant.name) {
      return NextResponse.json(
        {
          success: false,
          message: "Restaurant details (at minimum restaurant.name) are required to generate an email.",
        },
        { status: 400 }
      );
    }
 
    const emailResult = await generateFollowupEmail({
      restaurant,
      merchantUser,
      emailType,
      tone,
      customNotes,
    });

    return NextResponse.json(
      {
        success: true,
        email: emailResult,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in /api/email/generate route:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to generate email content",
      },
      { status: 500 }
    );
  }
}
