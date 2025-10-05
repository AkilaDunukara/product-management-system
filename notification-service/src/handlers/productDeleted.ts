import { ProductDeletedEvent, Notification } from '../types';

export function handleProductDeleted(event: ProductDeletedEvent): Notification {
  const { eventId, timestamp, data } = event;
  
  return {
    id: eventId,
    sellerId: data.sellerId,
    type: 'ProductDeleted',
    message: `Product deleted: ${data.name}`,
    data: {
      productId: data.productId,
      name: data.name,
      category: data.category,
      deletedAt: data.deletedAt,
    },
    timestamp,
    read: false,
  };
}

