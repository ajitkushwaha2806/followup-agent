/**
 * Determines a user's access permissions based on Clerk publicMetadata.
 * 
 * Supported Clerk Metadata configurations:
 * 1. access: ["onboarding"] | ["restaurant"] | ["onboarding", "restaurant"] | ["all"]
 * 2. role: "onboarding" | "restaurant" | "admin" | "all"
 * 3. defaultPage: "onboarding" | "restaurant"
 */
export function getUserAccess(user) {
  if (!user) {
    return { hasOnboarding: true, hasRestaurant: true, accessType: "both" };
  }

  const meta = user.publicMetadata || {};
  const rawAccess = meta.access || meta.role || meta.permissions || meta.defaultPage;

  if (Array.isArray(rawAccess)) {
    const hasOnboarding = rawAccess.includes("onboarding") || rawAccess.includes("all") || rawAccess.includes("admin");
    const hasRestaurant = rawAccess.includes("restaurant") || rawAccess.includes("all") || rawAccess.includes("admin");

    if (hasRestaurant && !hasOnboarding) {
      return { hasOnboarding: false, hasRestaurant: true, accessType: "restaurant_only" };
    }
    if (hasOnboarding && !hasRestaurant) {
      return { hasOnboarding: true, hasRestaurant: false, accessType: "onboarding_only" };
    }
    return { hasOnboarding: true, hasRestaurant: true, accessType: "both" };
  }

  const str = String(rawAccess || "").toLowerCase().trim();

  if (str === "restaurant" || str === "restaurant_only" || str === "restaurant_manager") {
    return { hasOnboarding: false, hasRestaurant: true, accessType: "restaurant_only" };
  }

  if (str === "onboarding" || str === "onboarding_only") {
    return { hasOnboarding: true, hasRestaurant: false, accessType: "onboarding_only" };
  }

  // Default: Has access to both, default landing is "/"
  return { hasOnboarding: true, hasRestaurant: true, accessType: "both" };
}
