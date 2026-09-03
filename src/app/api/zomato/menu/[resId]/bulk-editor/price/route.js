import dbConnect from "@/lib/dbConnect";
import Menu from "@/models/Menu";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function applyRounding(price, mode) {
  if (mode === "none") return Math.round(price);
  if (mode === "nearest9") {
    const rounded = Math.round(price);
    const remainder = rounded % 10;
    if (remainder === 9) return rounded;
    if (remainder === 0) return rounded - 1;
    return rounded + (9 - remainder);
  }
  if (mode === "next9") {
    const rounded = Math.ceil(price);
    const remainder = rounded % 10;
    if (remainder === 9) return rounded;
    return rounded + (9 - remainder);
  }
  return Math.round(price);
}

export async function POST(req, { params }) {
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

    const { action, mode, value, roundMode = "nearest9", target = "all", menu } = body;

    // If whole updated menu array is sent directly:
    if (Array.isArray(menu)) {
      const updatedMenuDoc = await Menu.findOneAndUpdate(
        { resId, platform: "zomato" },
        {
          $set: {
            menu: menu,
            updatedAt: new Date(),
          },
        },
        { returnDocument: "after", upsert: true }
      );

      return NextResponse.json({
        success: true,
        message: "Pricing updated and saved in DB successfully",
        data: updatedMenuDoc,
      });
    }

    // Otherwise apply mathematical bulk rule to DB document:
    const menuDoc = await Menu.findOne({ resId, platform: "zomato" });
    if (!menuDoc || !menuDoc.menu) {
      return NextResponse.json(
        { success: false, message: "No menu found for this restaurant in DB" },
        { status: 404 }
      );
    }

    const numVal = Number(value);
    if (!numVal || numVal <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid pricing value" },
        { status: 400 }
      );
    }

    const currentMenu = JSON.parse(JSON.stringify(menuDoc.menu));
    let itemsUpdated = 0;

    currentMenu.forEach((cat, cIdx) => {
      if (target !== "all" && cat.id !== target && String(cIdx) !== target) {
        return;
      }

      (cat.sub_category || []).forEach((sub) => {
        (sub.items || []).forEach((item) => {
          const currentBase = Number(item.base_price) || 0;
          const diff = mode === "percentage" ? (currentBase * numVal) / 100 : numVal;
          let newBase = action === "increase" ? currentBase + diff : currentBase - diff;
          if (newBase < 0) newBase = 0;
          item.base_price = applyRounding(newBase, roundMode);
          itemsUpdated++;

          (item.variants || []).forEach((g) => {
            (g.options || []).forEach((opt) => {
              const curOptPrice = Number(opt.price) || 0;
              const optDiff = mode === "percentage" ? (curOptPrice * numVal) / 100 : numVal;
              let newOptPrice = action === "increase" ? curOptPrice + optDiff : curOptPrice - optDiff;
              if (newOptPrice < 0) newOptPrice = 0;
              opt.price = applyRounding(newOptPrice, roundMode);
            });
          });
        });
      });
    });

    menuDoc.menu = currentMenu;
    menuDoc.updatedAt = new Date();
    await menuDoc.save();

    return NextResponse.json({
      success: true,
      message: `Updated ${itemsUpdated} items in database successfully`,
      data: menuDoc,
      itemsUpdated,
    });
  } catch (error) {
    console.error("[bulk-editor/price] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update pricing in database" },
      { status: 500 }
    );
  }
}
