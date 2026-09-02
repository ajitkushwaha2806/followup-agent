import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import Credential from "@/models/Credential";
import { validateRequiredFields } from "@/lib/helpers";

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

    const updatedCredential = await Credential.findByIdAndUpdate(
      id,
      {
        $set: {
          name: name.trim(),
          cookie: cookie.trim(),
          ...(status && { status }),
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

    return NextResponse.json({
      success: true,
      message: "Credential updated successfully",
      data: updatedCredential,
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
