import {
  ProductUpdatedNotifier,
  ProductUpdatedDto,
} from './product-updated-notifier';
import { Product, createProduct, CreateProductParams } from '../domain/product';
import { ProductRepo } from '../domain/product-repo';

export type UpsertProductDeps = {
  productRepo: ProductRepo;
  now: () => Date;
  productUpdatedNotifier: ProductUpdatedNotifier;
};

export type UpsertProductCommand = {
  id: string;
  name: string;
  pricePence: number;
  description: string;
};

export type UpsertProductResult = {
  success: boolean;
  data?: Product;
  error?: string;
};

/**
 * Create a use-case for upserting a product.
 * This will create a new product or update an existing one.
 * Usage:
 *   const result = await upsertProduct({ productRepo, now: () => new Date() }, productData);
 */
export async function upsertProduct(
  deps: UpsertProductDeps,
  command: UpsertProductCommand
): Promise<UpsertProductResult> {
  const { productRepo, now } = deps;

  try {
    // Validate and create the product entity
    const product = createProduct({
      ...command,
      updatedAt: now(),
    });

    // Save (upsert) the product
    const savedProduct = await productRepo.save(product);

    // Notify about the product update
    const dto: ProductUpdatedDto = {
      id: savedProduct.id,
      name: savedProduct.name,
      pricePence: savedProduct.pricePence,
      description: savedProduct.description,
      updatedAt: savedProduct.updatedAt.toISOString(),
    };
    await deps.productUpdatedNotifier.notifyProductUpdated(dto);

    return { success: true, data: savedProduct };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
