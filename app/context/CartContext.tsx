"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  source: "STORE" | "VENDING";
  sourceId: string;
  sourceModel: "Store" | "VendingMachine";
  image?: string;
  emoji?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  totals: {
    totalPrice: number;
    totalItems: number;
  };
  selectedHostel: string;
  setSelectedHostel: (hostel: string) => void;
  roomNumber: string;
  setRoomNumber: (room: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [selectedHostel, setSelectedHostel] = useState<string>("");
  const [roomNumber, setRoomNumber] = useState<string>("");

  useEffect(() => {
    setIsClient(true);
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  useEffect(() => {
    if (!isClient) return;
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems, isClient]);

  useEffect(() => {
    if (!isClient) return;

    async function loadAddress() {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          // Basic token decode to get ID
          const base64Url = token.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            window
              .atob(base64)
              .split("")
              .map(function (c) {
                return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
              })
              .join("")
          );
          const user = JSON.parse(jsonPayload);
          const userId = user.userId || user.id;

          if (userId) {
            // Dynamic import to avoid server interactions in client context if problematic,
            // but actually we are just calling a server action.
            // Next.js handles this fine usually.
            const { getUserAddress } = await import(
              "@/app/actions/user-actions"
            );
            const userData = await getUserAddress(userId);
            if (userData) {
              if (userData.roomNumber) setRoomNumber(userData.roomNumber);
              if (userData.address) setSelectedHostel(userData.address);
            }
          }
        } catch (e) {
          console.error("Failed to load address", e);
        }
      }
    }
    loadAddress();
  }, [isClient]);

  const addToCart = (item: CartItem) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (i) => i.productId === item.productId && i.sourceId === item.sourceId
      );
      if (existing) {
        toast.success("Updated quantity in cart");
        return prev.map((i) =>
          i.productId === item.productId && i.sourceId === item.sourceId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      toast.success("Added to cart");
      return [...prev, item];
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem("cart");
  };

  const getCartTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        totals: {
          totalPrice: cartItems.reduce(
            (total, item) => total + item.price * item.quantity,
            0
          ),
          totalItems: cartItems.reduce(
            (count, item) => count + item.quantity,
            0
          ),
        },
        selectedHostel,
        setSelectedHostel,
        roomNumber,
        setRoomNumber,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
