import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";

function parseProxyEntry(entry) {
    if (!entry) return null;
    const trimmed = entry.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return trimmed;
    }

    // Format: IP:PORT:USER:PASS
    const parts = trimmed.split(":");
    if (parts.length === 4) {
        const [ip, port, user, pass] = parts;
        return `http://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${ip}:${port}`;
    }

    // Format: IP:PORT
    if (parts.length === 2) {
        return `http://${parts[0]}:${parts[1]}`;
    }

    return trimmed;
}

function getProxyList() {
    const rawList = process.env.WEBSHARE_PROXIES || "";
    const entries = rawList
        .split(/[,\n]/)
        .map(parseProxyEntry)
        .filter(Boolean);

    const singleProxy = parseProxyEntry(process.env.WEBSHARE_PROXY_URL || process.env.PROXY_URL);
    if (singleProxy && !entries.includes(singleProxy)) {
        entries.unshift(singleProxy);
    }

    return entries;
}

let currentProxyIndex = 0;

function getNextProxyAgent() {
    const proxies = getProxyList();
    if (proxies.length === 0) return null;

    const proxyUrl = proxies[currentProxyIndex % proxies.length];
    currentProxyIndex = (currentProxyIndex + 1) % proxies.length;

    try {
        return new HttpsProxyAgent(proxyUrl);
    } catch (err) {
        console.error("[apiClient] Invalid proxy URL:", proxyUrl, err.message);
        return null;
    }
}

// Global serialized rate-limiter: enforces minimum 2000ms (2s) between Zomato API requests
let lastZomatoRequestTime = 0;
let zomatoRequestQueue = Promise.resolve();
const ZOMATO_MIN_INTERVAL_MS = 2000;

function scheduleZomatoRequest() {
    const nextInQueue = zomatoRequestQueue.then(async () => {
        const now = Date.now();
        const elapsed = now - lastZomatoRequestTime;
        if (elapsed < ZOMATO_MIN_INTERVAL_MS) {
            const delay = ZOMATO_MIN_INTERVAL_MS - elapsed;
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
        lastZomatoRequestTime = Date.now();
    });

    zomatoRequestQueue = nextInQueue.catch(() => {});
    return nextInQueue;
}

export async function apiClient({
    req,
    baseURL = process.env.ZOMATO_API_BASE_URL_V2,
    endpoint,
    method = "GET",
    data,
    params,
    headers = {},
    contentType,
}) {
    // Wait for slot in 2-second serialized queue before hitting Zomato API
    await scheduleZomatoRequest();
    const cookie = req?.headers?.get("x-zomato-cookie") ?? "";

    const finalHeaders = {
        Accept: "application/json, text/plain, */*",
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137 Safari/537.36",
        "x-zomato-app-version": "2",
        "x-client-id": "zomato_web_merchant",
        ...(cookie && { Cookie: cookie }),
        ...headers,
    };

    if (!(data instanceof FormData) && !headers["content-type"] && !headers["Content-Type"]) {
        finalHeaders["Content-Type"] =
            contentType === "form"
                ? "application/x-www-form-urlencoded"
                : "application/json";
    }

    const httpsAgent = getNextProxyAgent();

    try {
        const { data: response } = await axios.request({
            baseURL,
            url: endpoint,
            method,
            data,
            params,
            headers: finalHeaders,
            timeout: 30000,
            ...(httpsAgent && {
                httpsAgent,
                httpAgent: httpsAgent,
                proxy: false,
            }),
        });

        return response;
    } catch (err) {
        // If proxy failed due to network / 407 error, retry once with another proxy or directly
        if (httpsAgent) {
            console.warn(
                `[apiClient] Proxy attempt failed (${err.message}). Retrying request...`
            );
            const fallbackAgent = getNextProxyAgent();
            try {
                const { data: retryResponse } = await axios.request({
                    baseURL,
                    url: endpoint,
                    method,
                    data,
                    params,
                    headers: finalHeaders,
                    timeout: 30000,
                    ...(fallbackAgent && {
                        httpsAgent: fallbackAgent,
                        httpAgent: fallbackAgent,
                        proxy: false,
                    }),
                });
                return retryResponse;
            } catch (retryErr) {
                if (axios.isAxiosError(retryErr)) {
                    throw new Error(
                        retryErr.response?.data?.message ||
                        retryErr.response?.data?.error ||
                        retryErr.response?.statusText ||
                        retryErr.message
                    );
                }
                throw retryErr;
            }
        }

        if (axios.isAxiosError(err)) {
            const errorMsg =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.response?.statusText ||
                err.message;
            throw new Error(errorMsg);
        }

        throw err;
    }
}