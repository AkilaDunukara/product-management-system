import { ProductUpdatedEvent, Notification } from '../types';

export function handleProductUpdated(event: ProductUpdatedEvent): Notification {
  const { eventId, timestamp, data } = event;
  
  const changedFields = data.changes ? Object.keys(data.changes).join(', ') : 'fields';
  
  return {
    id: eventId,
    sellerId: data.sellerId,
    type: 'ProductUpdated',
    message: `Product updated: ${data.name} (${changedFields} changed)`,
    data: {
      productId: data.productId,
      name: data.name,
      category: data.category,
      price: data.price,
      quantity: data.quantity,
      changes: data.changes,
    },
    timestamp,
    read: false,
  };
}

