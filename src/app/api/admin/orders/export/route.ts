import ExcelJS from "exceljs";
import { getAdminApiSession, unauthorizedResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

/**
 * GET /api/admin/orders/export — download every order request as an .xlsx workbook.
 *
 * The workbook contains:
 *   1. "Orders"   — one row per request, with money columns typed as currency
 *   2. "Items"    — one row per order line, for pivoting
 *   3. "Summary"  — totals per status, so the file stands alone
 *
 * `?status=` narrows every sheet to a single status. Rows are written with real
 * number formats rather than pre-formatted strings, so Excel can sum and sort
 * them directly.
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

  const wb = new ExcelJS.Workbook();
  wb.creator = "JK Industries — Super Cleaner";
  wb.created = new Date();

  // ---------------------------------------------------------------- Orders
  const ordersSheet = wb.addWorksheet("Orders", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  ordersSheet.columns = [
    { header: "Reference", key: "reference", width: 20 },
    { header: "Received", key: "createdAt", width: 20 },
    { header: "Status", key: "status", width: 20 },
    { header: "Customer", key: "customerName", width: 22 },
    { header: "Business", key: "businessName", width: 22 },
    { header: "Mobile", key: "mobile", width: 16 },
    { header: "Email", key: "email", width: 26 },
    { header: "GSTIN", key: "gstin", width: 18 },
    { header: "Address", key: "address", width: 34 },
    { header: "City", key: "city", width: 16 },
    { header: "State", key: "state", width: 16 },
    { header: "Pincode", key: "pincode", width: 12 },
    { header: "Lines", key: "lines", width: 8 },
    { header: "Total qty", key: "itemCount", width: 11 },
    { header: "Estimated subtotal", key: "subtotal", width: 18 },
    { header: "Customer note", key: "notes", width: 30 },
    { header: "Internal notes", key: "internalNotes", width: 30 },
  ];

  for (const o of orders) {
    ordersSheet.addRow({
      reference: o.reference,
      createdAt: o.createdAt,
      status: ORDER_STATUS_LABELS[o.status] ?? o.status,
      customerName: o.customerName,
      businessName: o.businessName ?? "",
      mobile: o.mobile,
      email: o.email ?? "",
      gstin: o.gstin ?? "",
      address: o.address,
      city: o.city,
      state: o.state,
      pincode: o.pincode,
      lines: o.items.length,
      itemCount: o.itemCount,
      subtotal: o.subtotal,
      notes: o.notes ?? "",
      internalNotes: o.internalNotes ?? "",
    });
  }

  // ---------------------------------------------------------------- Items
  const itemsSheet = wb.addWorksheet("Items", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  itemsSheet.columns = [
    { header: "Reference", key: "reference", width: 20 },
    { header: "Received", key: "createdAt", width: 20 },
    { header: "Status", key: "status", width: 20 },
    { header: "Product", key: "productName", width: 30 },
    { header: "SKU", key: "sku", width: 16 },
    { header: "Pack", key: "packLabel", width: 14 },
    { header: "Unit MRP", key: "unitMrp", width: 12 },
    { header: "Quantity", key: "quantity", width: 11 },
    { header: "Line total", key: "lineTotal", width: 14 },
  ];

  for (const o of orders) {
    for (const it of o.items) {
      itemsSheet.addRow({
        reference: o.reference,
        createdAt: o.createdAt,
        status: ORDER_STATUS_LABELS[o.status] ?? o.status,
        productName: it.productName,
        sku: it.sku,
        packLabel: it.packLabel,
        unitMrp: it.unitMrp,
        quantity: it.quantity,
        lineTotal: it.lineTotal,
      });
    }
  }

  // ---------------------------------------------------------------- Summary
  const summarySheet = wb.addWorksheet("Summary");
  summarySheet.columns = [
    { header: "Status", key: "status", width: 24 },
    { header: "Requests", key: "requests", width: 12 },
    { header: "Total qty", key: "units", width: 12 },
    { header: "Estimated value", key: "value", width: 18 },
  ];

  const byStatus = new Map<string, { requests: number; units: number; value: number }>();
  for (const o of orders) {
    const e = byStatus.get(o.status) ?? { requests: 0, units: 0, value: 0 };
    e.requests += 1;
    e.units += o.itemCount;
    e.value += o.subtotal;
    byStatus.set(o.status, e);
  }
  for (const [key, e] of byStatus) {
    summarySheet.addRow({ status: ORDER_STATUS_LABELS[key] ?? key, ...e });
  }
  const totalRow = summarySheet.addRow({
    status: "All orders",
    requests: orders.length,
    units: orders.reduce((s, o) => s + o.itemCount, 0),
    value: orders.reduce((s, o) => s + o.subtotal, 0),
  });
  totalRow.font = { bold: true };

  // ---------------------------------------------------------------- styling
  for (const sheet of [ordersSheet, itemsSheet, summarySheet]) {
    const header = sheet.getRow(1);
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B1F3A" } };
    header.alignment = { vertical: "middle" };
    header.height = 22;
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: sheet.columnCount },
    };
  }

  ordersSheet.getColumn("subtotal").numFmt = '"₹"#,##0.00';
  ordersSheet.getColumn("createdAt").numFmt = "dd-mmm-yyyy hh:mm";
  itemsSheet.getColumn("unitMrp").numFmt = '"₹"#,##0.00';
  itemsSheet.getColumn("lineTotal").numFmt = '"₹"#,##0.00';
  itemsSheet.getColumn("createdAt").numFmt = "dd-mmm-yyyy hh:mm";
  summarySheet.getColumn("value").numFmt = '"₹"#,##0.00';

  // ---------------------------------------------------------------- output
  const buffer = await wb.xlsx.writeBuffer();

  const filename = `jk-industries-orders-${new Date().toISOString().slice(0, 10)}${
    status ? `-${status}` : ""
  }.xlsx`;

  return new Response(buffer as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
