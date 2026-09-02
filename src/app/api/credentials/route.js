import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import Credential from "@/models/Credential";
import { validateRequiredFields } from "@/lib/helpers";

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

    const credential = await Credential.create({
      name: name.trim(),
      cookie: cookie.trim(),
      ...(status && { status }),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Credential created successfully",
        data: credential,
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
