import { LowStockWarningEvent, Notification } from '../types';

export function handleLowStock(event: LowStockWarningEvent): Notification {
  const { eventId, timestamp, data } = event;
  
  return {
    id: eventId,
    sellerId: data.sellerId,
    type: 'LowStockWarning',
    message: `Low stock alert: ${data.name} (${data.quantity} left)`,
    data: {
      productId: data.productId,
      name: data.name,
      category: data.category,
      quantity: data.quantity,
      threshold: data.threshold,
      price: data.price,
      previousQuantity: data.previousQuantity,
    },
    timestamp,
    read: false,
  };
}

