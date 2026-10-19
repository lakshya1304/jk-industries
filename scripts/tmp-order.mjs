// Temp test helper: create a real order through the public API.
const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();

const product = await prisma.product.findFirst({
  where: { active: true },
  include: { packSizes: { where: { active: true } } },
});
if (!product || !product.packSizes.length) throw new Error("no active product/pack");
const pack = product.packSizes[0];

const res = await fetch("http://localhost:3000/api/orders", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    items: [{ productId: product.id, packSizeId: pack.id, quantity: Math.max(pack.minOrderQty ?? 1, 2) }],
    customerName: "Rahul Test",
    businessName: "Test Traders",
    mobile: "9876543210",
    email: "rahul.test@example.com",
    gstin: "",
    address: "12, Test Market Road",
    city: "Indore",
    state: "Madhya Pradesh",
    pincode: "452001",
    notes: "Please call before dispatch",
    clientToken: `tmp-${Date.now()}`,
  }),
});
const body = await res.json().catch(() => ({}));
console.log(res.status, JSON.stringify(body, null, 2));
await prisma.$disconnect();
