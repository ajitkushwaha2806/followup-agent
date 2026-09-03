import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import Credential from "@/models/Credential";
import { verifyZomatoCookie } from "@/services/backend/credentialVerification";

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

    const verification = await verifyZomatoCookie(credential.cookie);

    const updated = await Credential.findByIdAndUpdate(
      id,
      {
        status: verification.status,
        ...(verification.email && { email: verification.email }),
        ...(verification.userId && { userId: verification.userId }),
        ...(verification.userData && { userDetails: verification.userData }),
        lastVerifiedAt: new Date(),
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      isValid: verification.isValid,
      status: updated.status,
      message: verification.isValid
        ? `Session verified (${verification.name || verification.email || "Active User"}). Status is ACTIVE.`
        : `Verification failed: ${verification.error || "Session expired"}. Status is EXPIRED.`,
      data: updated,
      user: verification.userData,
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
