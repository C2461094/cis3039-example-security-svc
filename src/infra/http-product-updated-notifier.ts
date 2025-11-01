import type {
  ProductUpdatedNotifier,
  ProductUpdatedDto,
} from '../app/product-updated-notifier';

export type HttpProductUpdatedNotifierOptions = {
  baseUrl: string;
  fetch: typeof fetch;
  hostKey?: string;
};

export class HttpProductUpdatedNotifier implements ProductUpdatedNotifier {
  private baseUrl: string;
  private fetchFn: typeof fetch;
  private hostKey?: string;

  constructor(options: HttpProductUpdatedNotifierOptions) {
    this.baseUrl = options.baseUrl;
    this.fetchFn = options.fetch;
    this.hostKey = options.hostKey?.trim() ? options.hostKey : undefined;
  }

  async notifyProductUpdated(product: ProductUpdatedDto): Promise<void> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.hostKey) {
      headers['x-functions-key'] = this.hostKey;
    }

    await this.fetchFn(`${this.baseUrl}/integration/events/product-updated`, {
      method: 'POST',
      headers,
      body: JSON.stringify(product),
    });
  }
}
