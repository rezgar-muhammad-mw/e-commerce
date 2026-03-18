export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    PROFILE: '/api/auth/profile',
  },
  PRODUCTS: {
    BASE: '/api/products',
    BY_ID: (id: number) => `/api/products/${id}`,
  },
  CATEGORIES: {
    BASE: '/api/categories',
    BY_ID: (id: number) => `/api/categories/${id}`,
  },
  CART: {
    BASE: '/api/cart',
    ADD_ITEM: '/api/cart/items',
    UPDATE_ITEM: (id: number) => `/api/cart/items/${id}`,
    REMOVE_ITEM: (id: number) => `/api/cart/items/${id}`,
  },
  WISHLIST: {
    BASE: '/api/wishlist',
    ITEMS: '/api/wishlist/items',
    ITEM: (id: number) => `/api/wishlist/items/${id}`,
  },
} as const;
