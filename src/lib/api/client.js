import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import dbConnect from "@/lib/dbConnect";
import Credential from "@/models/Credential";

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

    zomatoRequestQueue = nextInQueue.catch(() => { });
    return nextInQueue;
}

async function resolveCredentialCookie({ credentialId, req, headers }) {
    // 1. Direct header override (if explicit Zomato Cookie passed)
    if (headers?.Cookie || headers?.cookie) {
        return headers.Cookie || headers.cookie;
    }

    // 2. Custom x-zomato-cookie header from frontend
    const reqCookie = req?.headers?.get?.("x-zomato-cookie");
    if (reqCookie) return reqCookie;

    // 3. Resolve credential ID from args, request headers, or query params
    const resolvedId =
        credentialId ||
        req?.headers?.get?.("x-credential-id") ||
        (req?.nextUrl?.searchParams ? req.nextUrl.searchParams.get("credentialId") : null);

    try {
        await dbConnect();

        if (resolvedId) {
            const cred = await Credential.findById(resolvedId).lean();
            if (cred?.cookie) return cred.cookie;
        }

        // 4. Fallback: Find latest active credential from MongoDB
        const activeCred =
            (await Credential.findOne({
                type: "MENU_MANAGEMENT",
                status: "ACTIVE",
            }).sort({ updatedAt: -1 }).lean()) ||
            (await Credential.findOne({ status: "ACTIVE" }).sort({ updatedAt: -1 }).lean());

        if (activeCred?.cookie) return activeCred.cookie;
    } catch (e) {
        console.warn("[apiClient] Could not fetch credential cookie from DB:", e.message);
    }

    return "";
}

export async function apiClient({
    credentialId,
    req,
    baseURL,
    endpoint,
    method = "GET",
    data,
    params,
    headers = {},
    contentType,
}) {
    // Wait for slot in 2-second serialized queue before hitting Zomato API
    await scheduleZomatoRequest();

    const targetBaseURL =
        baseURL ||
        (endpoint?.startsWith("/php/")
            ? process.env.ZOMATO_API_BASE_URL || "https://www.zomato.com"
            : process.env.ZOMATO_API_BASE_URL_V2 || "https://api.zomato.com");

    const resolvedCookie = await resolveCredentialCookie({ credentialId, req, headers });

    const finalHeaders = {
        Accept: "application/json, text/plain, */*",
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
        "x-zomato-app-version": "2",
        "x-client-id": "zomato_web_merchant",
        "X-Requested-With": "XMLHttpRequest",
        Origin: "https://www.zomato.com",
        Referer: "https://www.zomato.com/",
        ...headers,
        ...(resolvedCookie && { Cookie: resolvedCookie }),
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
            baseURL: targetBaseURL,
            url: endpoint,
            method,
            data,
            params,
            headers: finalHeaders,
            ...(httpsAgent && {
                httpsAgent,
                httpAgent: httpsAgent,
                proxy: false,
            }),
        });

        return response;
    } catch (err) {
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