import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductDetail } from "@/components/product/ProductDetail";
import { ProductDetailSkeleton } from "@/components/product/ProductDetailSkeleton";
import { getProductBySlug } from "@/lib/products";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description:
      product.description ||
      `${product.name} (SKU ${product.sku}) from Super Cleaner — pack sizes and pricing on request.`,
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 180),
      images: product.images[0] ? [product.images[0]] : undefined,
    },
  };
}

export default function ProductPage({ params }: { params: Params }) {
  return (
    <div className="container-page pt-24 pb-20 md:pt-28">
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetailLoader params={params} />
      </Suspense>
    </div>
  );
}

async function ProductDetailLoader({ params }: { params: Params }) {
  const { slug } = await params;
  return <ProductDetail slug={slug} />;
}
