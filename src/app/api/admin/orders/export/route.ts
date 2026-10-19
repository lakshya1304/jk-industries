import { getAdminApiSession, unauthorizedResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

/**
 * GET /api/admin/orders/export — download every order request as a CSV file.
 *
 * The file is written with a UTF-8 BOM so Excel opens Indian currency and
 * non-ASCII characters correctly. `?status=` narrows the export to one status.
 */
export async function GET(request: Request) {
  const session = await getAdminApiSession();
  if (!session) return unauthorizedResponse();

  const status = new URL(request.url).searchParams.get("status") ?? "";

  const orders = await prisma.order.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  const header = [
    "Reference",
    "Received",
    "Status",
    "Customer",
    "Business",
    "Mobile",
    "Email",
    "GSTIN",
    "Address",
    "City",
    "State",
    "Pincode",
    "Items",
    "Total qty",
    "Estimated subtotal (INR)",
    "Item details",
    "Customer note",
    "Internal notes",
  ];

  const rows = orders.map((o) => [
    o.reference,
    o.createdAt.toISOString(),
    ORDER_STATUS_LABELS[o.status] ?? o.status,
    o.customerName,
    o.businessName ?? "",
    o.mobile,
    o.email ?? "",
    o.gstin ?? "",
    o.address,
    o.city,
    o.state,
    o.pincode,
    String(o.items.length),
    String(o.itemCount),
    String(o.subtotal),
    o.items
      .map((i) => `${i.productName} (${i.packLabel}) x${i.quantity} = ${i.lineTotal}`)
      .join(" | "),
    o.notes ?? "",
    o.internalNotes ?? "",
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map(escapeCell).join(","))
    .join("\r\n");

  const filename = `jk-industries-orders-${new Date().toISOString().slice(0, 10)}${
    status ? `-${status}` : ""
  }.csv`;

  return new Response(`\uFEFF${csv}`, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

function escapeCell(value: string) {
  const needsQuotes = /[",\r\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}
