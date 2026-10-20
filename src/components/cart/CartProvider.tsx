"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CartItem, PackSizeDTO, ProductDTO } from "@/lib/types";

const STORAGE_KEY = "sc-cart-v1";

/** What a normal add-to-cart needs; carton lines add the unit count. */
export type CartonOptions = { unitsPerCarton: number; unitWholesale: number };

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  isLoaded: boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  /**
   * Add a line. Passing `carton` records the line as a wholesale carton of
   * `unitsPerCarton` units, priced at the wholesale rate rather than MRP.
   */
  addItem: (
    product: ProductDTO,
    packSize: PackSizeDTO,
    quantity?: number,
    carton?: CartonOptions,
  ) => void;
  updateQuantity: (lineKey: string, quantity: number) => void;
  removeItem: (lineKey: string) => void;
  clearCart: () => void;
  toast: string | null;
  dismissToast: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

/**
 * Identity of a cart line.
 *
 * A carton of a pack and a single pack are different products to the buyer, so
 * they must not merge — the `:carton` suffix keeps them as separate lines even
 * though they share a pack size.
 */
export const lineKey = (item: Pick<CartItem, "productId" | "packSizeId" | "isCarton">) =>
  `${item.productId}::${item.packSizeId}${item.isCarton ? ":carton" : ""}`;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from localStorage after hydration.
  //
  // The server cannot read localStorage, so the client has to render the same
  // empty cart first and only adopt the stored items afterwards — otherwise
  // React reports a hydration mismatch. The read is therefore deferred into a
  // timer instead of running synchronously in the effect body (which would
  // cascade a re-render), and it merges with anything added in the meantime
  // rather than overwriting it.
  useEffect(() => {
    const timer = setTimeout(() => {
      let stored: CartItem[] = [];
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            stored = parsed.filter((i) => i && typeof i.productId === "string");
          }
        }
      } catch {
        /* corrupted storage — start fresh */
      }
      setItems((prev) => (prev.length > 0 ? prev : stored));
      setIsLoaded(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Persist on change (after hydration).
  useEffect(() => {
    if (!isLoaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage full or unavailable — cart still works in memory */
    }
  }, [items, isLoaded]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const addItem = useCallback(
    (
      product: ProductDTO,
      packSize: PackSizeDTO,
      quantity = product.minOrderQty,
      carton?: CartonOptions,
    ) => {
      const qty = Math.max(1, quantity);
      setItems((prev) => {
        const incoming: CartItem = {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          sku: product.sku,
          image: product.images[0] ?? "",
          packSizeId: packSize.id,
          packLabel: packSize.label,
          mrp: packSize.mrp,
          quantity: qty,
          minOrderQty: product.minOrderQty,
          ...(carton
            ? {
                isCarton: true,
                unitsPerCarton: carton.unitsPerCarton,
                // What one carton costs, so every display path (line total,
                // subtotal) works without knowing about cartons.
                mrp: carton.unitWholesale * carton.unitsPerCarton,
              }
            : {}),
        };
        const key = lineKey(incoming);
        const existing = prev.find((i) => lineKey(i) === key);
        if (existing) {
          return prev.map((i) =>
            lineKey(i) === key ? { ...i, quantity: i.quantity + qty } : i
          );
        }
        return [...prev, incoming];
      });
      showToast(
        carton
          ? `Added ${carton.unitsPerCarton} × ${packSize.label} carton of ${product.name}`
          : `Added ${product.name} (${packSize.label})`,
      );
    },
    [showToast]
  );

  const updateQuantity = useCallback((key: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) =>
        lineKey(i) === key
          ? { ...i, quantity: Math.max(1, Math.min(10_000, quantity)) }
          : i
      )
    );
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => lineKey(i) !== key));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce((sum, i) => sum + i.mrp * i.quantity, 0);
    return {
      items,
      totalItems,
      subtotal,
      isLoaded,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      toast,
      dismissToast: () => setToast(null),
    };
  }, [items, isLoaded, drawerOpen, addItem, updateQuantity, removeItem, clearCart, toast]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
