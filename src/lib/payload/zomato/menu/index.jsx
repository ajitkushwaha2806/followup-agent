export const buildZomatoMenuPayload = (liveMenuResponse, dbMenu = []) => {
    if (!liveMenuResponse) return {};

    // Deep clone liveMenuResponse so all structures, IDs, and metadata remain 100% identical
    const updated = JSON.parse(JSON.stringify(liveMenuResponse));

    // Build lookup map of dbMenu items by catalogueId / id
    const dbItemsMap = new Map();
    (dbMenu || []).forEach((cat) => {
        (cat.sub_category || []).forEach((sub) => {
            (sub.items || []).forEach((item) => {
                if (item.id) {
                    dbItemsMap.set(String(item.id), item);
                }
            });
        });
    });

    (updated.catalogueWrappers || []).forEach((wrapper) => {
        const catId = String(wrapper.catalogue?.catalogueId);
        const dbItem = dbItemsMap.get(catId);
        if (!dbItem) return;

        const hasDbVariants = Array.isArray(dbItem.variants) && dbItem.variants.length > 0;

        // 1. In-place update of Property Name and Option Names if modified
        if (hasDbVariants && Array.isArray(wrapper.cataloguePropertyWrappers)) {
            wrapper.cataloguePropertyWrappers.forEach((propWrapper, pIdx) => {
                const dbGroup = dbItem.variants[pIdx] || dbItem.variants[0];
                if (!dbGroup) return;

                // Update Property Name (e.g. "Size", "Quantity")
                if (dbGroup.property_name && propWrapper.catalogueProperty) {
                    propWrapper.catalogueProperty.name = dbGroup.property_name;
                }

                // Map db options by option_id / propertyValueId / variant_id / index
                const dbOptions = dbGroup.options || [];
                const dbOptByValId = new Map();
                dbOptions.forEach((opt, oIdx) => {
                    if (opt.propertyValueId) dbOptByValId.set(String(opt.propertyValueId), opt);
                    if (opt.option_id) dbOptByValId.set(String(opt.option_id), opt);
                    if (opt.variant_id) dbOptByValId.set(String(opt.variant_id), opt);
                });

                // Update option names in cataloguePropertyValues
                if (Array.isArray(propWrapper.cataloguePropertyValues)) {
                    propWrapper.cataloguePropertyValues.forEach((cpv, cpvIdx) => {
                        const matched =
                            dbOptByValId.get(String(cpv.propertyValueId)) ||
                            dbOptions[cpvIdx];
                        if (matched && matched.option_name) {
                            cpv.value = matched.option_name;
                        }
                    });
                }

                // Update option names in catalogueProperty.propertyValues if present
                if (Array.isArray(propWrapper.catalogueProperty?.propertyValues)) {
                    propWrapper.catalogueProperty.propertyValues.forEach((pv, pvIdx) => {
                        const matched =
                            dbOptByValId.get(String(pv.propertyValueId)) ||
                            dbOptions[pvIdx];
                        if (matched && matched.option_name) {
                            pv.value = matched.option_name;
                        }
                    });
                }
            });
        }

        // 2. In-place price replacement in variantWrappers
        const dbOptionsMap = new Map();
        if (hasDbVariants) {
            dbItem.variants.forEach((group) => {
                (group.options || []).forEach((opt) => {
                    if (opt.variant_id) dbOptionsMap.set(String(opt.variant_id), opt);
                    if (opt.propertyValueId) dbOptionsMap.set(String(opt.propertyValueId), opt);
                    if (opt.option_id) dbOptionsMap.set(String(opt.option_id), opt);
                    if (opt.option_name) dbOptionsMap.set(opt.option_name.toLowerCase().trim(), opt);
                });
            });
        }

        (wrapper.variantWrappers || []).forEach((vWrapper, vIdx) => {
            const vId = String(vWrapper.variant?.variantId || "");
            const propValId = String(vWrapper.variantPropertyValues?.[0]?.propertyValueId || "");

            let targetPrice = null;

            if (hasDbVariants) {
                const matchedOption =
                    dbOptionsMap.get(vId) ||
                    dbOptionsMap.get(propValId) ||
                    (dbItem.variants[0]?.options ? dbItem.variants[0].options[vIdx] : null);

                if (
                    matchedOption &&
                    matchedOption.price !== undefined &&
                    matchedOption.price !== null &&
                    matchedOption.price !== ""
                ) {
                    targetPrice = Number(matchedOption.price);
                }
            }

            // Fallback to base_price if no variant price found
            if (
                targetPrice === null &&
                dbItem.base_price !== undefined &&
                dbItem.base_price !== null &&
                dbItem.base_price !== ""
            ) {
                targetPrice = Number(dbItem.base_price);
            }

            if (targetPrice !== null && !isNaN(targetPrice)) {
                (vWrapper.variantPrices || []).forEach((vp) => {
                    vp.price = targetPrice;
                    vp.basePrice = targetPrice;
                    if (vp.maxAllowedPrice !== undefined) {
                        vp.maxAllowedPrice = Math.max(Number(vp.maxAllowedPrice) || 0, targetPrice + 50);
                    }
                });
            }
        });
    });

    return updated;
};