import "server-only";
import { prisma } from "@/lib/prisma";
import type { EnquiryInput } from "@/lib/validation";

/** Persist a customer enquiry (contact, product, dealer or wholesale). */
export async function createEnquiry(input: EnquiryInput) {
  return prisma.enquiry.create({
    data: {
      type: input.type,
      name: input.name,
      businessName: input.businessName ?? null,
      mobile: input.mobile,
      email: input.email ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      productSku: input.productSku ?? null,
      productName: input.productName ?? null,
      message: input.message,
    },
  });
}
