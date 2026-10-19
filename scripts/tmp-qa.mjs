// Temp QA helper: read one active product + pack from the live DB.
const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();

const p = await prisma.product.findFirst({
  where: { active: true },
  include: { packSizes: { where: { active: true } } },
});
const orders = await prisma.order.count();
const enquiries = await prisma.enquiry.count();
console.log(JSON.stringify({ productId: p?.id, name: p?.name, packId: p?.packSizes[0]?.id, mrp: p?.packSizes[0]?.mrp, orders, enquiries }, null, 2));
await prisma.$disconnect();
