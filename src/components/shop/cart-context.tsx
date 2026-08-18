'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AutoPart, CartItem } from '@/types/part';
import type { Rates } from '@/lib/shop/pricing';

/**
 * Корзина покупателя. Переживает перезагрузку через localStorage — это единственное,
 * что мы там храним: каталог приходит с сервера.
 *
 * Позиции ключуются по `id` — это штрихкод донора, уникальный у всех 967 записей.
 *
 * Ни слаг, ни партномер для этого не годятся. Слаг уникален только внутри своей марки
 * и модели: `naruzhnyy-levyy-2015` носят 12 разных товаров, и корзина по такому ключу
 * складывала Chevrolet Cruze с Honda Accord в одну позицию, а «удалить» стирало обе.
 * Партномера нет у 472 товаров.
 */
const STORAGE_KEY = 'koreaparts_cart';

interface CartContextValue {
  /**
   * Курсы ЦБ на момент рендера страницы. Приходят из `[lang]/layout.tsx`, а не запросом
   * из браузера: без курса корзина не может показать даже рублёвую цену — она считается
   * из вон, — и цифры пришлось бы дорисовывать после загрузки, уже на глазах покупателя.
   */
  rates: Rates;
  items: CartItem[];
  count: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (part: AutoPart) => void;
  updateQuantity: (id: string, delta: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children, rates }: { children: React.ReactNode; rates: Rates }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Читаем после монтирования: на сервере localStorage нет, иначе разъедется гидратация.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch {
      // повреждённая корзина — не повод падать
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // приватный режим браузера
    }
  }, [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      rates,
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      add: (part) => {
        setItems((prev) => {
          const existing = prev.find((item) => item.part.id === part.id);
          if (existing) {
            return prev.map((item) =>
              item.part.id === part.id ? { ...item, quantity: item.quantity + 1 } : item,
            );
          }
          return [...prev, { part, quantity: 1 }];
        });
        setIsOpen(true);
      },
      updateQuantity: (id, delta) => {
        setItems((prev) =>
          prev
            .map((item) => (item.part.id === id ? { ...item, quantity: item.quantity + delta } : item))
            .filter((item) => item.quantity > 0),
        );
      },
      remove: (id) => setItems((prev) => prev.filter((item) => item.part.id !== id)),
      clear: () => setItems([]),
    }),
    [items, isOpen, rates],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart вызван вне CartProvider');
  return context;
}
