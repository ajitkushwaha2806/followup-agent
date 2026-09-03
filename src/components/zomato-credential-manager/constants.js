export const FILTER_STATUSES = [
  { id: "all", label: "All" },
  { id: "ACTIVE", label: "Active" },
  { id: "EXPIRED", label: "Expired" },
];

export const INITIAL_FORM_DATA = {
  name: "",
  cookie: "",
};

export const COOKIE_EDITOR_EXTENSION_URL =
  "https://chromewebstore.google.com/detail/cookie-editor/ookdjilphngeeeghgngjabigmpepanpl";

export const COOKIE_GUIDE_STEPS = [
  {
    step: 1,
    title: "Install Cookie-Editor Extension",
    text: "Install the Cookie-Editor extension from the Chrome Web Store for quick 1-click cookie export.",
    link: COOKIE_EDITOR_EXTENSION_URL,
    linkLabel: "Cookie-Editor Chrome Extension",
  },
  {
    step: 2,
    title: "Log in to Portal",
    text: "Open your browser, navigate to the Zomato Merchant Portal, and log in.",
    link: "https://www.zomato.com/merchant",
    linkLabel: "Zomato Merchant Portal",
  },
  {
    step: 3,
    title: "Export Cookie String",
    text: "Click the Cookie-Editor extension icon on your browser toolbar, click 'Export' -> 'Header String' (or copy the session cookie).",
  },
  {
    step: 4,
    title: "Paste & Save",
    text: "Paste the copied cookie header directly into the Zomato Merchant Cookie field and click Save.",
  },
];

