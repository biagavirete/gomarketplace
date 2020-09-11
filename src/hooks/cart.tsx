import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (storagedProducts) {
        setProducts([...JSON.parse(storagedProducts)]);
      }
    }

    loadProducts();
  }, []);

  const findProduct = useCallback(
    (id: string): number => {
      return products.findIndex(item => item.id === id);
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const productIndex = findProduct(product.id);
      const newProducts = [...products];

      if (productIndex > -1) {
        newProducts[productIndex].quantity += 1;
      } else {
        newProducts.push({ ...product, quantity: 1 });
      }
      setProducts(newProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProducts),
      );
    },
    [products, findProduct],
  );

  const increment = useCallback(
    async id => {
      const productIndex = findProduct(id);
      const newProducts = [...products];

      if (productIndex > -1) {
        newProducts[productIndex].quantity += 1;
      }
      setProducts(newProducts);
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProducts),
      );
    },
    [products, findProduct],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = findProduct(id);
      const newProducts = [...products];

      if (productIndex > -1 && newProducts[productIndex].quantity > 1) {
        newProducts[productIndex].quantity -= 1;
      } else {
        newProducts.filter(product => product.id !== id);
        setProducts(newProducts);
        await AsyncStorage.removeItem('@GoMarketplace:products');
      }
      setProducts(newProducts);
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProducts),
      );
    },
    [products, findProduct],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
