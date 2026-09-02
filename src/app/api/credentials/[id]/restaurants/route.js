import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import Credential from "@/models/Credential";
import { apiClient } from "@/lib/api/client";
import { ZOMATO_ENDPOINTS } from "@/services/zomato-endpoints";

export async function GET(req, { params }) {
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

    const requestedType = req?.nextUrl?.searchParams?.get("type");
    const type = requestedType === "live" ? "live" : "active-requests";

    const response = await apiClient({
      req,
      endpoint: ZOMATO_ENDPOINTS.GET_RESTAURANTS_LIST,
      method: "GET",
      headers: {
        Cookie: credential.cookie,
      },
      params: {
        type,
        country_id: 1,
        page: 1,
        page_size: 1000,
      },
    });

    const data = response?.data || response;

    return NextResponse.json({
      success: true,
      credential: {
        _id: credential._id,
        name: credential.name,
        status: credential.status,
      },
      type,
      data,
    });
  } catch (error) {
    console.error("Error fetching restaurants list for credential:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch outlets from Zomato",
      },
      { status: 500 }
    );
  }
}
