import { NextResponse } from "next/server";
import { apiClient } from "@/lib/api/client";
import { ZOMATO_ENDPOINTS } from "@/services/zomato-endpoints";

export const GET = async (req) => {
    try {
        const restaurants = await apiClient({
            req,
            endpoint: ZOMATO_ENDPOINTS.GET_RESTAURANTS_LIST,
            method: "GET",
            params: {
                country_id: 1,
                page: 1,
                page_size: 1000,
            },
        });

        return NextResponse.json(
            {
                success: true,
                data: restaurants,
            },
            { status: 200 }
        );
    } catch (err) {
        return NextResponse.json(
            {
                success: false,
                message: err.message || "Failed to fetch restaurants from Zomato",
            },
            { status: 500 }
        );
    }
};