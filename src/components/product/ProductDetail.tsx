import Link from "next/link";
import { ChevronRight, MessageCircle } from "lucide-react";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/products";
import { getSettings } from "@/lib/settings";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductPurchase } from "@/components/product/ProductPurchase";
import { AvailabilityBadge } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";
import { productEnquiryMessage, waLink } from "@/lib/whatsapp";

export async function ProductDetail({ slug }: { slug: string }) {
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const settings = await getSettings();

  const waHref = waLink(
    settings.whatsappNumber,
    productEnquiryMessage({ brandName: settings.brandName, product })
  );

  return (
    <article>
      {/* breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-sm text-ink-mute">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="font-medium transition-colors hover:text-navy-900">
              Home
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="size-3.5" />
          </li>
          <li>
            <Link href="/products" className="font-medium transition-colors hover:text-navy-900">
              All Products
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="size-3.5" />
          </li>
          <li aria-current="page" className="font-semibold text-navy-900">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <ProductGallery images={product.images} name={product.name} />
        </Reveal>

        <Reveal delay={0.1}>
          <div className="flex flex-wrap items-center gap-2.5">
            <AvailabilityBadge availability={product.availability} />
            <span className="text-xs font-semibold tracking-wide text-ink-mute uppercase">
              SKU {product.sku}
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-navy-900 md:text-4xl">
            {product.name}
          </h1>

          <p className="mt-4 leading-relaxed text-ink-soft">
            {product.description || "Contact us for product details."}
          </p>

          <div className="mt-6">
            <ProductPurchase
              product={product}
              options={{
                showMRP: settings.showMRP,
                showWholesale: settings.showWholesalePrice,
                whatsappNumber: settings.whatsappNumber,
                brandName: settings.brandName,
              }}
            />
          </div>

          <div className="mt-8 space-y-6">
            {product.usage && (
              <section>
                <h2 className="text-base font-bold text-navy-900">How to use</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{product.usage}</p>
              </section>
            )}
            <section>
              <h2 className="text-base font-bold text-navy-900">Good to know</h2>
              <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm text-ink-soft">
                <li>MRP is inclusive of applicable taxes unless stated otherwise.</li>
                <li>Wholesale and bulk pricing is shared on enquiry and confirmed with your order.</li>
                <li>
                  {product.unitsPerCarton
                    ? `Packed ${product.unitsPerCarton} units per carton for bulk supply.`
                    : "Carton quantities available on request."}
                </li>
              </ul>
            </section>
          </div>

          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-full border border-navy-900/15 bg-white px-6 text-sm font-bold text-navy-900 transition-colors duration-200 hover:border-navy-900/40 hover:bg-navy-50"
          >
            <MessageCircle className="size-4.5 text-[#128C4A]" aria-hidden />
            Ask about this product on WhatsApp
          </a>
        </Reveal>
      </div>
    </article>
  );
}
