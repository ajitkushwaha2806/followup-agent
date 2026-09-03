import dbConnect from "@/lib/dbConnect";
import Menu from "@/models/Menu";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { resId } = await params;

    if (!resId) {
      return NextResponse.json(
        { success: false, message: "Restaurant ID is required" },
        { status: 400 }
      );
    }

    const menu = await Menu.findOne({ resId, platform: "zomato" }).lean();

    return NextResponse.json({
      success: true,
      data: menu,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch menu" },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const { resId } = await params;
    const body = await req.json();

    if (!resId) {
      return NextResponse.json(
        { success: false, message: "Restaurant ID is required" },
        { status: 400 }
      );
    }

    const updatedMenu = await Menu.findOneAndUpdate(
      { resId, platform: "zomato" },
      {
        $set: {
          menu: body.menu,
          rawCatalogue: body.rawCatalogue,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after", upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "Menu and prices saved successfully",
      data: updatedMenu,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to save menu changes" },
      { status: 500 }
    );
  }
}
