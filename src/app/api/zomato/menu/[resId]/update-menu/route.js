import Menu from "@/models/Menu";
import MenuSync from "@/models/MenuSync";
import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import { apiClient } from "@/lib/api/client";
import { buildZomatoMenuPayload } from "@/lib/payload/zomato/menu";

export const dynamic = "force-dynamic";

export async function POST(req, { params }) {
    try {
        await dbConnect();
        const { resId } = await params;

        let body = {};
        try {
            body = await req.json();
        } catch (e) { }

        const credentialId =
            body?.credentialId ||
            req?.nextUrl?.searchParams?.get("credentialId") ||
            null;

        if (!resId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Restaurant ID is required",
                },
                { status: 400 }
            );
        }

        const resMenu = await Menu.findOne({ resId, platform: 'zomato' });

        const menuInfo = await apiClient({
            baseURL: "https://www.zomato.com",
            credentialId,
            req,
            endpoint: "/php/online_ordering/menu_edit.php",
            method: "GET",
            params: {
                action: "get_menu_info",
                service_role: "DELIVERY_TAKEAWAY",
                res_id: resId,
            },
        });

        if (!menuInfo?.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: menuInfo?.message || "Failed to fetch menu info",
                },
                { status: menuInfo?.status || 500 }
            );
        }

        const menuVersion = menuInfo?.data?.menuVersion;

        if (!menuVersion) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Menu version not found",
                },
                { status: 400 }
            );
        }

        const result = await apiClient({
            baseURL: "https://www.zomato.com",
            credentialId,
            req,
            endpoint: "/php/online_ordering/menu_edit.php",
            method: "GET",
            params: {
                action: "get_content_menu",
                res_id: resId,
                service_role: "DELIVERY_TAKEAWAY",
            },
        });

        if (!result?.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: result?.message || "Failed to fetch content menu",
                },
                { status: result?.status || 500 }
            );
        }

        const menu = result?.data ?? null;

        const payload = {
            resId: String(resId),
            menuVersion,
            last_opened_catalogue: menu?.last_opened_catalogue || {},
            onHoldItems: menu?.onHoldItems || {},
            update_menu: buildZomatoMenuPayload(menu?.menuResponse, resMenu?.menu || []),
            menu: menu?.menuResponse,
        };

        // return NextResponse.json(
        //     {
        //         success: false,
        //         message: result?.message || "Failed to fetch content menu",
        //         data: payload,
        //     },
        //     { status: result?.status || 500 }
        // );

        const updatedMenu = await apiClient({
            baseURL: "https://www.zomato.com",
            credentialId,
            req,
            endpoint: "/php/online_ordering/menu_edit.php",
            method: "POST",
            params: {
                action: "update_content_menu",
                service_role: "DELIVERY_TAKEAWAY",
                res_id: resId,
            },
            data: {
                ...payload,
            },
        });

        if (!updatedMenu?.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: updatedMenu?.message || "Menu update failed on Zomato",
                },
                { status: updatedMenu?.status || 500 }
            );
        }

        try {
            await MenuSync.create({
                resId: String(resId),
                status: "completed",
                updated_menu: payload?.update_menu || {},
            });
        } catch (syncErr) {
            console.warn("[update-menu] MenuSync create warning:", syncErr.message);
        }

        return NextResponse.json(
            {
                success: true,
                message: "Menu updated and pushed to Zomato successfully",
                updated_menu: updatedMenu,
                data: payload?.update_menu,
                result: result?.data,
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("MENU_UPDATE_ERROR:", err);

        try {
            await MenuSync.create({
                resId: String(resId),
                status: "failed",
                updated_menu: {},
                error: err?.response?.data?.message || err?.message || "Internal Server Error",
            });
        } catch (syncErr) { }

        return NextResponse.json(
            {
                success: false,
                message:
                    err?.response?.data?.message ||
                    err?.message ||
                    "Internal Server Error",
            },
            { status: err?.response?.status || 500 }
        );
    }
}