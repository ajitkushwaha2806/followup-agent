import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import Credential from "@/models/Credential";
import { validateRequiredFields } from "@/lib/helpers";
import { verifyZomatoCookie } from "@/services/backend/credentialVerification";

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const credential = await Credential.findById(id);
    if (!credential) {
      return NextResponse.json(
        {
          success: false,
          message: "Credential not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: credential,
    });
  } catch (error) {
    console.error("Error fetching credential:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch credential",
      },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    validateRequiredFields(body, ["name", "cookie"]);
    const { name, cookie, status } = body;

    const existing = await Credential.findById(id);
    const credentialType = body.type || existing?.type || "ONBOARDING";

    // Verify session cookie with appropriate endpoint for credential type
    const verification = await verifyZomatoCookie(cookie, credentialType);
    const finalStatus = verification.status;

    const updatedCredential = await Credential.findByIdAndUpdate(
      id,
      {
        $set: {
          name: name.trim(),
          cookie: cookie.trim(),
          status: finalStatus,
          ...(verification.email && { email: verification.email }),
          ...(verification.userId && { userId: verification.userId }),
          ...(verification.userData && { userDetails: verification.userData }),
          lastVerifiedAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedCredential) {
      return NextResponse.json(
        {
          success: false,
          message: "Credential not found",
        },
        { status: 404 }
      );
    }

    const successDetail = verification.isValid
      ? `Verified (${verification.name || verification.email || "Active User"}). Status: ACTIVE.`
      : `Verification failed: ${verification.error || "Session expired"}. Status: EXPIRED.`;

    return NextResponse.json({
      success: true,
      isValid: verification.isValid,
      status: finalStatus,
      message: `Credential updated successfully. ${successDetail}`,
      data: updatedCredential,
      user: verification.userData,
    });
  } catch (error) {
    console.error("Error updating credential:", error);
    const isValidationError = error.message?.startsWith("Missing required fields");
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update credential",
      },
      { status: isValidationError ? 400 : 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const deletedCredential = await Credential.findByIdAndDelete(id);
    if (!deletedCredential) {
      return NextResponse.json(
        {
          success: false,
          message: "Credential not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Credential deleted successfully",
      data: { id },
    });
  } catch (error) {
    console.error("Error deleting credential:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to delete credential",
      },
      { status: 500 }
    );
  }
}
