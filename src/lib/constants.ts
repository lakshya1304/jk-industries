// Central maps for statuses used across the site and admin dashboard.

export const ORDER_STATUSES = [
  { value: "pending", label: "Pending Confirmation" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number]["value"];

export const ORDER_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  ORDER_STATUSES.map((s) => [s.value, s.label])
);

/**
 * The natural next step of the order workflow (null = terminal state).
 * pending → confirmed → processing → shipped → delivered.
 */
export const NEXT_ORDER_STATUS: Record<string, OrderStatus | null> = {
  pending: "confirmed",
  confirmed: "processing",
  processing: "shipped",
  shipped: "delivered",
  delivered: null,
  cancelled: null,
};

/** Primary button label for advancing an order from the given status. */
export function advanceActionLabel(status: string): string | null {
  const next = NEXT_ORDER_STATUS[status] ?? null;
  if (!next) return null;
  if (status === "pending") return "Accept order";
  return `Mark as ${ORDER_STATUS_LABELS[next] ?? next}`;
}

export const ENQUIRY_STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "resolved", label: "Resolved" },
] as const;

export const ENQUIRY_TYPES = [
  { value: "contact", label: "General Enquiry" },
  { value: "product", label: "Product Enquiry" },
  { value: "dealer", label: "Dealership Enquiry" },
  { value: "wholesale", label: "Wholesale / Bulk Supply" },
] as const;

export const ENQUIRY_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  ENQUIRY_TYPES.map((t) => [t.value, t.label])
);

export const ENQUIRY_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  ENQUIRY_STATUSES.map((s) => [s.value, s.label])
);

export const AVAILABILITY_LABELS: Record<string, string> = {
  in_stock: "In Stock",
  out_of_stock: "Out of Stock",
  on_request: "On Request",
};

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry",
];
