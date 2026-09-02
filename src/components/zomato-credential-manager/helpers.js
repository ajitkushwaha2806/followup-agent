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
