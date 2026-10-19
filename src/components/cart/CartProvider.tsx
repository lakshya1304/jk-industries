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

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  isLoaded: boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (product: ProductDTO, packSize: PackSizeDTO, quantity?: number) => void;
  updateQuantity: (productId: string, packSizeId: string, quantity: number) => void;
  removeItem: (productId: string, packSizeId: string) => void;
  clearCart: () => void;
  toast: string | null;
  dismissToast: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const itemKey = (productId: string, packSizeId: string) => `${productId}::${packSizeId}`;

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
    (product: ProductDTO, packSize: PackSizeDTO, quantity = product.minOrderQty) => {
      const qty = Math.max(1, quantity);
      setItems((prev) => {
        const key = itemKey(product.id, packSize.id);
        const existing = prev.find((i) => itemKey(i.productId, i.packSizeId) === key);
        if (existing) {
          return prev.map((i) =>
            itemKey(i.productId, i.packSizeId) === key
              ? { ...i, quantity: i.quantity + qty }
              : i
          );
        }
        return [
          ...prev,
          {
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
          },
        ];
      });
      showToast(`Added ${product.name} (${packSize.label})`);
    },
    [showToast]
  );

  const updateQuantity = useCallback(
    (productId: string, packSizeId: string, quantity: number) => {
      setItems((prev) =>
        prev
          .map((i) =>
            i.productId === productId && i.packSizeId === packSizeId
              ? { ...i, quantity: Math.max(1, Math.min(10_000, quantity)) }
              : i
          )
      );
    },
    []
  );

  const removeItem = useCallback((productId: string, packSizeId: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.packSizeId === packSizeId))
    );
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
