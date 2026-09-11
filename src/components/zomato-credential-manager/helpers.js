export function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function maskCookie(cookie = "") {
  if (!cookie) return "";
  if (cookie.length <= 10) return "••••••••••••";
  return `${cookie.slice(0, 10)}••••••••••••••••••••••••`;
}

export function filterCredentials(credentials = [], searchQuery = "", statusFilter = "all") {
  const query = searchQuery.trim().toLowerCase();

  return credentials.filter((item) => {
    const matchesQuery =
      !query ||
      item.name?.toLowerCase().includes(query) ||
      item.cookie?.toLowerCase().includes(query);

    if (!matchesQuery) return false;

    if (statusFilter === "ACTIVE") return item.status === "ACTIVE";
    if (statusFilter === "EXPIRED") return item.status === "EXPIRED";

    return true;
  });
}

export function getCredentialStats(credentials = []) {
  const total = credentials.length;
  const active = credentials.filter((c) => c.status === "ACTIVE").length;
  const expired = credentials.filter((c) => c.status === "EXPIRED").length;

  return { total, active, expired };
}

export function checkIfNeedsAttention(restaurant) {
  if (!restaurant) return false;
  const status = (restaurant.resListingStatus || "").toUpperCase();

  // If already live or fully approved, doesn't need follow-up attention
  if (status === "LIVE" || status === "APPROVED" || status === "READY TO GO LIVE") {
    return false;
  }

  const steps = restaurant.steps || [];
  const pendingSteps = steps.filter((s) => s.status !== "APPROVED");
  if (pendingSteps.length === 0 && steps.length > 0) {
    return false;
  }

  let latestDate = null;

  // Check restaurant level dates
  if (restaurant.updated_at || restaurant.updatedAt) {
    const d = new Date(restaurant.updated_at || restaurant.updatedAt);
    if (!isNaN(d.getTime())) latestDate = d;
  }

  // Check step level dates
  for (const step of steps) {
    if (step.updated_at || step.updatedAt) {
      const d = new Date(step.updated_at || step.updatedAt);
      if (!isNaN(d.getTime())) {
        if (!latestDate || d > latestDate) {
          latestDate = d;
        }
      }
    }
  }

  // If no date at all, assume it needs attention if pending
  if (!latestDate) return true;

  const hoursDiff = (Date.now() - latestDate.getTime()) / (1000 * 60 * 60);
  return hoursDiff >= 36;
}

export function getRestaurantLastUpdated(restaurant) {
  if (!restaurant) return null;
  const steps = restaurant.steps || [];
  const pendingSteps = steps.filter((s) => s.status !== "APPROVED");
  const currentPendingStep = pendingSteps[0];

  // Try current pending step updated time first
  if (currentPendingStep?.updated_at) return currentPendingStep.updated_at;
  if (currentPendingStep?.updatedAt) return currentPendingStep.updatedAt;

  // Try top-level restaurant timestamp
  if (restaurant.updated_at) return restaurant.updated_at;
  if (restaurant.updatedAt) return restaurant.updatedAt;

  // Search across steps for the most recent updated time
  let latestDate = null;
  let latestStr = null;

  for (const step of steps) {
    const raw = step.updated_at || step.updatedAt;
    if (raw) {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        if (!latestDate || d > latestDate) {
          latestDate = d;
          latestStr = raw;
        }
      } else if (!latestStr) {
        latestStr = raw;
      }
    }
  }

  return latestStr;
}

export function getRestaurantListingStatus(restaurant) {
  if (!restaurant) return "UNDER REVIEW";

  const raw = String(restaurant.resListingStatus || restaurant.status || "")
    .toUpperCase()
    .replace(/_/g, " ")
    .trim();

  const steps = restaurant.steps || [];
  const pendingSteps = steps.filter((s) => s.status !== "APPROVED");
  const approvedSteps = steps.filter((s) => s.status === "APPROVED");

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



