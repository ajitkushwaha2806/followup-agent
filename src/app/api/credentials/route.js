import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import Credential from "@/models/Credential";
import { validateRequiredFields } from "@/lib/helpers";
import { verifyZomatoCookie } from "@/services/backend/credentialVerification";

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "ALL";
    const typeParam = (searchParams.get("type") || "ONBOARDING").toUpperCase();

    const filter = {};

    if (typeParam === "MENU_MANAGEMENT") {
      filter.type = "MENU_MANAGEMENT";
    } else {
      filter.type = { $in: ["ONBOARDING", null, undefined] };
    }

    if (status && status.toUpperCase() !== "ALL") {
      filter.status = status.toUpperCase();
    }

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { name: regex },
        { email: regex },
        { userId: regex },
      ];
    }

    const skip = (page - 1) * limit;

    const baseTypeFilter = typeParam === "MENU_MANAGEMENT" 
      ? { type: "MENU_MANAGEMENT" } 
      : { type: { $in: ["ONBOARDING", null, undefined] } };

    const [credentials, totalFiltered, statsTotal, statsActive, statsExpired] =
      await Promise.all([
        Credential.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Credential.countDocuments(filter),
        Credential.countDocuments(baseTypeFilter),
        Credential.countDocuments({ ...baseTypeFilter, status: "ACTIVE" }),
        Credential.countDocuments({ ...baseTypeFilter, status: "EXPIRED" }),
      ]);

    const totalPages = Math.ceil(totalFiltered / limit) || 1;

    return NextResponse.json({
      success: true,
      data: credentials,
      count: credentials.length,
      pagination: {
        total: totalFiltered,
        page,
        totalPages,
        limit,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      },
      stats: {
        total: statsTotal,
        active: statsActive,
        expired: statsExpired,
      },
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

    const { name, cookie, type = "ONBOARDING" } = body;
    const credentialType = type.toUpperCase() === "MENU_MANAGEMENT" ? "MENU_MANAGEMENT" : "ONBOARDING";

    // Verify session cookie with appropriate endpoint for credential type
    const verification = await verifyZomatoCookie(cookie, credentialType);

    const finalStatus = verification.status;

    const credential = await Credential.create({
      name: name.trim(),
      cookie: cookie.trim(),
      status: finalStatus,
      type: credentialType,
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
