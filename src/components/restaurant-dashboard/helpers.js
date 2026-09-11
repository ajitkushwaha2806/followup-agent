export function getRestaurantListingStatus(restaurant) {
  if (!restaurant) return "UNDER REVIEW";

  const raw = String(restaurant.resListingStatus || restaurant.status || "")
    .toUpperCase()
    .replace(/_/g, " ")
    .trim();

  const steps = restaurant.steps || [];
  const pendingSteps = steps.filter((s) => s.status !== "APPROVED");

  if (
    raw.includes("READY") ||
    raw.includes("LIVE") ||
    raw.includes("APPROVED") ||
    (steps.length > 0 && pendingSteps.length === 0)
  ) {
    if (raw.includes("READY") || (steps.length > 0 && pendingSteps.length === 0)) return "READY TO GO LIVE";
    if (raw.includes("LIVE")) return "LIVE";
    return "APPROVED";
  }

  if (raw.includes("REJECT")) return "REJECTED";
  if (raw.includes("PROGRESS")) return "IN PROGRESS";
  if (raw.includes("REVIEW")) return "UNDER REVIEW";

  return raw || "UNDER REVIEW";
}

export function filterRestaurants(restaurants = [], searchQuery = "", statusFilter = "ALL") {
  const query = searchQuery.trim().toLowerCase();

  return restaurants.filter((item) => {
    const matchesQuery =
      !query ||
      item.name?.toLowerCase().includes(query) ||
      String(item.resId || "").toLowerCase().includes(query) ||
      item.resAddress?.toLowerCase().includes(query) ||
      item.address?.toLowerCase().includes(query) ||
      item.subzone?.toLowerCase().includes(query) ||
      item.city?.toLowerCase().includes(query) ||
      item.kitchenType?.toLowerCase().includes(query) ||
      item.steps?.some(
        (s) =>
          s.title?.toLowerCase().includes(query) ||
          s.message?.some((m) => m?.toLowerCase().includes(query))
      );

    if (!matchesQuery) return false;

    if (statusFilter && statusFilter.toUpperCase() !== "ALL") {
      const itemStatus = getRestaurantListingStatus(item);
      const targetStatus = statusFilter.toUpperCase().replace(/_/g, " ").trim();

      const isReadyToGoLive =
        itemStatus === "READY TO GO LIVE" ||
        itemStatus === "LIVE" ||
        itemStatus === "APPROVED" ||
        (item.steps?.length > 0 && item.steps.every((s) => s.status === "APPROVED")) ||
        String(item.resListingStatus || "").toUpperCase().includes("READY");

      if (targetStatus === "READY TO GO LIVE") {
        return isReadyToGoLive;
      }
      if (targetStatus === "APPROVED") {
        return (
          itemStatus === "APPROVED" ||
          itemStatus === "READY TO GO LIVE" ||
          itemStatus === "LIVE" ||
          (item.steps?.length > 0 && item.steps.every((s) => s.status === "APPROVED"))
        );
      }
      if (targetStatus === "UNDER REVIEW") {
        return !isReadyToGoLive && (itemStatus === "UNDER REVIEW" || itemStatus.includes("REVIEW"));
      }
      if (targetStatus === "IN PROGRESS") {
        return !isReadyToGoLive && (itemStatus === "IN PROGRESS" || itemStatus.includes("PROGRESS"));
      }
      if (targetStatus === "REJECTED") {
        return itemStatus === "REJECTED" || itemStatus.includes("REJECT");
      }
      return itemStatus === targetStatus;
    }

    return true;
  });
}

export function calculateDashboardStats(data) {
  const restaurants = data?.restaurants || [];
  const activeRequestsCount = data?.activeRequestsCount ?? 0;
  const liveRestaurantsCount = data?.liveRestaurantsCount ?? 0;
  const underReviewCount = restaurants.filter(
    (r) => (r.resListingStatus || "").toUpperCase() === "UNDER REVIEW"
  ).length;

  return {
    totalOutlets: restaurants.length,
    activeRequestsCount,
    liveRestaurantsCount,
    underReviewCount,
  };
}
