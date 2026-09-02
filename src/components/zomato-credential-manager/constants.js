export const FILTER_STATUSES = [
  { id: "all", label: "All" },
  { id: "ACTIVE", label: "Active" },
  { id: "EXPIRED", label: "Expired" },
];

export const INITIAL_FORM_DATA = {
  name: "",
  cookie: "",
};

export const COOKIE_GUIDE_STEPS = [
  {
    step: 1,
    title: "Log in to Portal",
    text: "Open your browser and navigate to the Zomato Merchant Portal and log in.",
    link: "https://www.zomato.com/merchant",
    linkLabel: "Zomato Merchant Portal",
  },
  {
    step: 2,
    title: "Open Developer Tools",
    text: "Press F12 or right-click anywhere on the page and select Inspect.",
  },
  {
    step: 3,
    title: "Inspect Network Requests",
    text: "Go to the Network tab, refresh the page, select any request (e.g., restaurants-listing), and copy the Cookie header under Request Headers.",
  },
  {
    step: 4,
    title: "Paste & Save",
    text: "Paste the copied cookie header directly into the Zomato Merchant Cookie field.",
  },
];
