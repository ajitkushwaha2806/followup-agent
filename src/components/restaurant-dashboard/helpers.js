export function filterRestaurants(restaurants = [], searchQuery = "", statusFilter = "ALL") {
  const query = searchQuery.trim().toLowerCase();

  return restaurants.filter((item) => {
    const matchesQuery =
      !query ||
      item.name?.toLowerCase().includes(query) ||
      String(item.resId || "").includes(query) ||
      item.resAddress?.toLowerCase().includes(query) ||
      item.kitchenType?.toLowerCase().includes(query);

    if (!matchesQuery) return false;

    if (statusFilter !== "ALL") {
      const itemStatus = (item.resListingStatus || "").toUpperCase();
      return itemStatus === statusFilter.toUpperCase();
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
