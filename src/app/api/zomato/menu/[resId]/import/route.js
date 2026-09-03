import Menu from "@/models/Menu";
import Credential from "@/models/Credential";
import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import { apiClient } from "@/lib/api/client";

export const dynamic = "force-dynamic";

const getDeliveryPrice = (variantPrices = []) => {
    const match =
        variantPrices.find(
            (p) => p?.service?.toLowerCase() === "delivery"
        ) || variantPrices[0];

    return match?.price ?? match?.basePrice ?? 0;
};

const buildCatalogueLookup = (catalogueWrappers = []) => {
    const map = new Map();

    catalogueWrappers.forEach((wrapper) => {
        const catalogueId = wrapper?.catalogue?.catalogueId;
        if (catalogueId) map.set(catalogueId, wrapper);
    });

    return map;
};

const getBasePrice = (variantWrappers = []) => {
    const prices = variantWrappers
        .map((vw) => getDeliveryPrice(vw?.variantPrices))
        .filter((p) => typeof p === "number" && p > 0);

    if (prices.length === 0) {
        return 0;
    }

    return Math.min(...prices);
};

const parseItemVariants = (catalogueWrapper, variantPriceModeration = {}) => {
    const propertyWrappers = catalogueWrapper?.cataloguePropertyWrappers || [];
    const variantWrappers = catalogueWrapper?.variantWrappers || [];

    if (propertyWrappers.length === 0) return [];
    const propertyValueToVariant = new Map();

    variantWrappers.forEach((variantWrapper) => {
        const variantId = variantWrapper?.variant?.variantId || "";
        const price = getDeliveryPrice(variantWrapper?.variantPrices);

        let under_review_price = null;
        let is_under_review = false;
        let under_review_status = null;

        (variantWrapper?.variantPrices || []).forEach((vp) => {
            const vpId = String(vp?.id || "");
            const vId = String(vp?.variantId || variantId || "");
            const mod = variantPriceModeration[vpId] || variantPriceModeration[vId];
            if (mod && (mod.status === "STATUS_IN_REVIEW" || mod.status === "IN_REVIEW")) {
                under_review_price = mod.price;
                is_under_review = true;
                under_review_status = mod.status;
            }
        });

        (variantWrapper?.variantPropertyValues || []).forEach((vpv) => {
            if (vpv?.propertyValueId) {
                propertyValueToVariant.set(vpv.propertyValueId, {
                    variantId,
                    price,
                    under_review_price,
                    is_under_review,
                    under_review_status,
                });
            }
        });
    });

    return propertyWrappers
        .map((propertyWrapper) => {
            const property = propertyWrapper?.catalogueProperty;
            if (!property) return null;

            const values =
                propertyWrapper?.cataloguePropertyValues ||
                property?.propertyValues ||
                [];

            return {
                property_name: property?.name || "",
                property_id: property?.propertyId || "",
                options: values
                    .map((value) => {
                        const matched =
                            propertyValueToVariant.get(value?.propertyValueId) || {};

                        return {
                            option_name: value?.value || "",
                            option_id: value?.propertyValueId || "",
                            variant_id: matched?.variantId || "",
                            price: matched?.price || 0,
                            under_review_price: matched?.under_review_price ?? null,
                            is_under_review: Boolean(matched?.is_under_review),
                            under_review_status: matched?.under_review_status ?? null,
                        };
                    })
                    .sort((a, b) => a.price - b.price)
                    .map((opt, i) => {
                        opt.is_default = i === 0;
                        return opt;
                    }),
            };
        })
        .filter(Boolean);
};

const buildItem = (catalogueWrapper, variantPriceModeration = {}) => {
    const catalogue = catalogueWrapper?.catalogue || {};
    let base_price = getBasePrice(catalogueWrapper?.variantWrappers);
    const parsedVariants = parseItemVariants(catalogueWrapper, variantPriceModeration);

    let under_review_price = null;
    let is_under_review = false;
    let under_review_status = null;

    (catalogueWrapper?.variantWrappers || []).forEach((vw) => {
        (vw?.variantPrices || []).forEach((vp) => {
            const vpId = String(vp?.id || "");
            const vId = String(vp?.variantId || vw?.variant?.variantId || "");
            const mod = variantPriceModeration[vpId] || variantPriceModeration[vId];
            if (mod && (mod.status === "STATUS_IN_REVIEW" || mod.status === "IN_REVIEW")) {
                under_review_price = mod.price;
                is_under_review = true;
                under_review_status = mod.status;
            }
        });
    });

    if (parsedVariants && parsedVariants.length > 0) {
        let lowestPrice = Infinity;
        parsedVariants.forEach((v) => {
            v.options?.forEach((opt) => {
                if (opt.price > 0 && opt.price < lowestPrice) {
                    lowestPrice = opt.price;
                }
            });
        });
        if (lowestPrice !== Infinity) {
            base_price = lowestPrice;
        }

        parsedVariants.sort((a, b) => {
            const minA = a.options?.[0]?.price || 0;
            const minB = b.options?.[0]?.price || 0;
            return minA - minB;
        });
    }

    return {
        id: catalogue?.catalogueId || "",
        name: catalogue?.name || "",
        base_price,
        under_review_price,
        is_under_review,
        under_review_status,
        variants: parsedVariants || [],
    };
};

export const parseZomatoCatalogueMenu = (data) => {
    const categoryWrappers = data?.categoryWrappers || [];
    const catalogueWrappers = data?.catalogueWrappers || [];
    const catalogueLookup = buildCatalogueLookup(catalogueWrappers);

    const moderationData = data?.moderationData || data?.menuResponse?.moderationData || {};
    const variantPriceModeration = moderationData?.variantPriceModeration || {};

    return categoryWrappers.map((categoryWrapper) => {
        const category = categoryWrapper?.category || {};
        const subCategoryWrappers = categoryWrapper?.subCategoryWrappers || [];

        return {
            id: category?.categoryId || "",
            name: category?.name || "",
            sub_category: subCategoryWrappers.map((subWrapper) => {
                const subCategory = subWrapper?.subCategory || {};
                const entities = subWrapper?.subCategoryEntities || [];

                const items = entities
                    .filter((entity) => entity?.entityType === "catalogue")
                    .map((entity) => catalogueLookup.get(entity?.entityId))
                    .filter(Boolean)
                    .map((cw) => buildItem(cw, variantPriceModeration));

                return {
                    id: subCategory?.subCategoryId || "",
                    name: subCategory?.name?.trim() || "",
                    items,
                };
            }),
        };
    });
};

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const { resId } = await params;

        if (!resId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Restaurant ID is required",
                },
                { status: 400 }
            );
        }

        const credentialId = req?.nextUrl?.searchParams?.get("credentialId");
        let credential = null;
        if (credentialId) {
            credential = await Credential.findById(credentialId);
        }
        if (!credential) {
            credential = await Credential.findOne({
                type: "MENU_MANAGEMENT",
                status: "ACTIVE",
            }).sort({ updatedAt: -1 });
        }
        if (!credential) {
            credential = await Credential.findOne({ status: "ACTIVE" }).sort({ updatedAt: -1 });
        }

        if (!credential?.cookie) {
            return NextResponse.json(
                {
                    success: false,
                    message: "No active merchant credential found with valid cookie. Please update your session cookie.",
                },
                { status: 401 }
            );
        }

        const result = await apiClient({
            req,
            baseURL: process.env.ZOMATO_API_BASE_URL || "https://zomato.com",
            endpoint: "/php/online_ordering/menu_edit",
            method: "GET",
            headers: {
                Cookie: credential.cookie,
            },
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
                    message: result?.message || "Failed to fetch menu",
                },
                { status: result?.status || 500 }
            );
        }

        const menu =
            result?.data?.data?.menuResponse ??
            result?.data?.menuResponse ??
            null;

        const parsedMenu = parseZomatoCatalogueMenu(menu);

        const savedMenu = await Menu.findOneAndUpdate(
            { resId, platform: "zomato" },
            {
                $set: {
                    resId,
                    platform: "zomato",
                    menu: parsedMenu,
                },
            },
            { returnDocument: "after", upsert: true }
        );

        return NextResponse.json(
            {
                success: true,
                message: "Menu imported successfully",
                data: savedMenu,
            },
            { status: 200 }
        );
    } catch (err) {
        return NextResponse.json(
            {
                success: false,
                message: err?.message || "Internal Server Error",
            },
            { status: 500 }
        );
    }
}