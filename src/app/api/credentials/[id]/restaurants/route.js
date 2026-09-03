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

    const isMenuManagement = credential.type === "MENU_MANAGEMENT";

    if (isMenuManagement) {
      const response = await apiClient({
        req,
        baseURL: process.env.ZOMATO_API_BASE_URL_V2 || "https://api.zomato.com",
        endpoint: "/merchant-gw/web/restaurant/get-all-minimal-lite",
        method: "GET",
        headers: {
          Cookie: credential.cookie,
        },
      });

      const raw = response?.data || response;
      const rawList = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.entities)
          ? raw.entities
          : Array.isArray(raw?.restaurants)
            ? raw.restaurants
            : Array.isArray(raw?.data)
              ? raw.data
              : Array.isArray(response?.entities)
                ? response.entities
                : [];

      const restaurants = rawList.map((r) => ({
        resId: String(r.id || r.res_id || r.resId || ""),
        name: r.name || r.res_name || "Restaurant",
        resAddress: r.subzone || r.address || r.res_address || r.city || "",
        thumbnail: r.thumbnail || null,
        resListingStatus: r.delivery_status === 1 ? "LIVE" : r.status || "ACTIVE",
        ...r,
      }));

      return NextResponse.json({
        success: true,
        credential: {
          _id: credential._id,
          name: credential.name,
          status: credential.status,
          type: credential.type,
        },
        data: {
          restaurants,
        },
        raw: response,
      });
    }

    const requestedType = req?.nextUrl?.searchParams?.get("type") || "active-requests";
    const type = requestedType;

    const response = await apiClient({
      req,
      baseURL: process.env.ZOMATO_API_BASE_URL_V2,
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
        type: credential.type,
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
