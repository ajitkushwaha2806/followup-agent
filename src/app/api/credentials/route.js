import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import Credential from "@/models/Credential";
import { validateRequiredFields } from "@/lib/helpers";
import { verifyZomatoCookie } from "@/services/backend/credentialVerification";

export async function GET() {
  try {
    await dbConnect();
    const credentials = await Credential.find({}).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: credentials.length,
      data: credentials,
    });
  } catch (error) {
    console.error("Error fetching credentials:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch credentials",
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    validateRequiredFields(body, ["name", "cookie"]);

    const { name, cookie, status } = body;

    // Verify session cookie with Zomato GET_USER_DETAILS
    const verification = await verifyZomatoCookie(cookie);

    const finalStatus = verification.status;

    const credential = await Credential.create({
      name: name.trim(),
      cookie: cookie.trim(),
      status: finalStatus,
      ...(verification.email && { email: verification.email }),
      ...(verification.userId && { userId: verification.userId }),
      ...(verification.userData && { userDetails: verification.userData }),
      lastVerifiedAt: new Date(),
    });

    const successDetail = verification.isValid
      ? `Verified (${verification.name || verification.email || "Active User"}). Status: ACTIVE.`
      : `Saved, but verification failed: ${verification.error || "Session expired"}. Status: EXPIRED.`;

    return NextResponse.json(
      {
        success: true,
        isValid: verification.isValid,
        status: finalStatus,
        message: `Credential created successfully. ${successDetail}`,
        data: credential,
        user: verification.userData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating credential:", error);
    const isValidationError = error.message?.startsWith("Missing required fields");
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create credential",
      },
      { status: isValidationError ? 400 : 500 }
    );
  }
}
