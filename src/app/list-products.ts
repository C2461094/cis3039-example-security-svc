import { Product } from '../domain/product';
import { ProductRepo } from '../domain/product-repo';
import type { AuthContext } from './auth-context';

export type ListProductsDeps = {
  productRepo: ProductRepo;
  authContext: AuthContext;
};

// DTO for listing products with optional price redaction
export type ProductListItem = {
  id: string;
  name: string;
  pricePence: number | null; // null when caller lacks read:prices scope
  description: string;
  updatedAt: Date;
};

export type ListProductsResult = {
  success: boolean;
  data?: ProductListItem[];
  error?: string;
};

/**
 * Create a use-case for listing products.
 * Prices are redacted (null) unless the caller has the 'read:prices' scope.
 * Usage:
 *   const result = await listProducts({ productRepo, authContext });
 */
export async function listProducts(
  deps: ListProductsDeps
): Promise<ListProductsResult> {
  const { productRepo, authContext } = deps;

  try {
    const products = await productRepo.list();

    // Check if caller has read:prices scope
    const canReadPrices =
      authContext.authenticated && authContext.scopes.includes('read:products');

    // Redact prices if the scope is missing
    const processedProducts: ProductListItem[] = products.map((product) => {
      if (canReadPrices) {
        return product;
      }
      // Return product with price redacted (null)
      return {
        ...product,
        pricePence: null,
      };
    });

    return { success: true, data: processedProducts };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
