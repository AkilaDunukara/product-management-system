import { ProductCreatedEvent, Notification } from '../types';

export function handleProductCreated(event: ProductCreatedEvent): Notification {
  const { eventId, timestamp, data } = event;
  
  return {
    id: eventId,
    sellerId: data.sellerId,
    type: 'ProductCreated',
    message: `New product created: ${data.name}`,
    data: {
      productId: data.productId,
      name: data.name,
      category: data.category,
      price: data.price,
      quantity: data.quantity,
    },
    timestamp,
    read: false,
  };
}

