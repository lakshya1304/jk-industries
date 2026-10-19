"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect } from "react";
import { Check, ShoppingBag, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/Button";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { NoImage } from "@/components/ui/NoImage";
import { formatINR } from "@/lib/utils";
import { cartEnquiryMessage, waLink } from "@/lib/whatsapp";

export function CartDrawer({
  brandName,
  whatsappNumber,
}: {
  brandName: string;
  whatsappNumber: string;
}) {
  const {
    items,
    totalItems,
    subtotal,
    drawerOpen,
    openDrawer,
    closeDrawer,
    updateQuantity,
    removeItem,
    clearCart,
    toast,
    dismissToast,
  } = useCart();
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen, closeDrawer]);

  const cartLink = waLink(
    whatsappNumber,
    cartEnquiryMessage({ brandName, items })
  );

  return (
    <>
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-90 bg-navy-950/45 backdrop-blur-[3px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={closeDrawer}
              aria-hidden
            />
            <motion.aside
              key="drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Shopping cart"
              className="fixed inset-y-0 right-0 z-100 flex w-full max-w-[26rem] flex-col bg-white shadow-2xl"
              initial={reduced ? { opacity: 0 } : { x: "100%" }}
              animate={reduced ? { opacity: 1 } : { x: 0 }}
              exit={reduced ? { opacity: 0 } : { x: "100%" }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
              <header className="flex items-center justify-between border-b border-navy-900/8 px-5 py-4">
                <h2 className="text-base font-bold text-navy-900">
                  Your Cart{" "}
                  <span className="text-ink-mute">({totalItems} item{totalItems === 1 ? "" : "s"})</span>
                </h2>
                <button
                  type="button"
                  onClick={closeDrawer}
                  autoFocus
                  aria-label="Close cart"
                  className="grid size-9 place-items-center rounded-full text-navy-900/60 transition hover:bg-navy-900/5 hover:text-navy-900"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </header>

              {items.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                  <div className="grid size-20 place-items-center rounded-full bg-navy-50">
                    <ShoppingBag className="size-8 text-navy-600" aria-hidden />
                  </div>
                  <div>
                    <p className="font-bold text-navy-900">Your cart is empty</p>
                    <p className="mt-1 text-sm text-ink-mute">
                      Browse the catalogue and add products to request an order.
                    </p>
                  </div>
                  <Button href="/products" onClick={closeDrawer}>
                    Explore Products
                  </Button>
                </div>
              ) : (
                <>
                  <ul className="flex-1 divide-y divide-navy-900/6 overflow-y-auto px-5">
                    <AnimatePresence initial={false}>
                      {items.map((item) => {
                        const belowMoq = item.quantity < item.minOrderQty;
                        return (
                          <motion.li
                            key={`${item.productId}::${item.packSizeId}`}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0 }}
                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                            className="flex gap-3 py-4"
                          >
                            <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-navy-50">
                              {item.image ? (
                                <>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={item.image}
                                    alt=""
                                    className="size-full object-cover"
                                  />
                                </>
                              ) : (
                                <NoImage label={item.name} compact />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <Link
                                    href={`/products/${item.slug}`}
                                    onClick={closeDrawer}
                                    className="block truncate text-sm font-bold text-navy-900 hover:underline"
                                  >
                                    {item.name}
                                  </Link>
                                  <p className="mt-0.5 text-xs text-ink-mute">
                                    {item.packLabel} · {item.sku}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  aria-label={`Remove ${item.name} from cart`}
                                  onClick={() => removeItem(item.productId, item.packSizeId)}
                                  className="rounded-full p-1.5 text-ink-mute transition hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="size-4" aria-hidden />
                                </button>
                              </div>
                              <div className="mt-2.5 flex items-center justify-between gap-2">
                                <QuantityStepper
                                  size="sm"
                                  value={item.quantity}
                                  onChange={(q) => updateQuantity(item.productId, item.packSizeId, q)}
                                />
                                <span className="text-sm font-bold text-navy-900">
                                  {formatINR(item.mrp * item.quantity)}
                                </span>
                              </div>
                              {belowMoq ? (
                                <p className="mt-1.5 text-xs font-medium text-amber-700">
                                  Minimum order quantity: {item.minOrderQty}
                                </p>
                              ) : null}
                            </div>
                          </motion.li>
                        );
                      })}
                    </AnimatePresence>
                  </ul>

                  <footer className="space-y-3 border-t border-navy-900/8 bg-surface px-5 py-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-ink-soft">Estimated subtotal</span>
                      <span className="text-lg font-extrabold text-navy-900">
                        {formatINR(subtotal)}
                      </span>
                    </div>
                    <p className="text-xs text-ink-mute">
                      Prices shown at MRP. Wholesale pricing, taxes and shipping are confirmed
                      by JK Industries with your order.
                    </p>
                    <Button href="/cart" className="w-full" onClick={closeDrawer}>
                      Proceed to Order Request
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={closeDrawer}>
                        Continue Shopping
                      </Button>
                      <Button variant="whatsapp" href={cartLink} external>
                        WhatsApp Enquiry
                      </Button>
                    </div>
                    <button
                      type="button"
                      onClick={clearCart}
                      className="mx-auto block text-xs font-medium text-ink-mute underline-offset-2 transition hover:text-red-600 hover:underline"
                    >
                      Clear cart
                    </button>
                  </footer>
                </>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Lightweight add-to-cart toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            className="fixed bottom-5 left-1/2 z-110 flex -translate-x-1/2 items-center gap-3 rounded-full bg-navy-900 py-3 pr-3 pl-4 text-sm font-semibold text-white shadow-xl"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <Check className="size-4 text-fresh-500" aria-hidden />
            <span className="max-w-56 truncate">{toast}</span>
            <button
              type="button"
              onClick={() => {
                dismissToast();
                openDrawer();
              }}
              className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold transition hover:bg-white/20"
            >
              View cart
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
