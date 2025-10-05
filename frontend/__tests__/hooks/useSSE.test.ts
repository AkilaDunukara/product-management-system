import { renderHook, act } from '@testing-library/react';
import { useSSE } from '../../src/hooks/useSSE';
import * as api from '../../src/services/api';

jest.mock('../../src/services/api');

describe('useSSE', () => {
  let mockEventSource: any;

  beforeEach(() => {
    mockEventSource = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      close: jest.fn(),
      onmessage: null,
      onerror: null,
    };

    (api.createSSEConnection as jest.Mock).mockReturnValue(mockEventSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty notifications', () => {
    const { result } = renderHook(() => useSSE('seller-123'));

    expect(result.current.notifications).toEqual([]);
    expect(result.current.connected).toBe(true);
  });

  it('should not connect when sellerId is null', () => {
    const { result } = renderHook(() => useSSE(null));

    expect(result.current.connected).toBe(false);
    expect(api.createSSEConnection).not.toHaveBeenCalled();
  });

  it('should create SSE connection with sellerId', () => {
    renderHook(() => useSSE('seller-123'));

    expect(api.createSSEConnection).toHaveBeenCalledWith(
      'seller-123',
      expect.any(Function),
      expect.any(Function)
    );
  });

  it('should add notifications when messages are received', () => {
    const { result } = renderHook(() => useSSE('seller-123'));

    const handleMessage = (api.createSSEConnection as jest.Mock).mock.calls[0][1];

    act(() => {
      handleMessage({
        id: 1,
        type: 'ProductCreated',
        message: 'Product created',
        data: { productId: 1 },
        timestamp: Date.now(),
      });
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].message).toBe('Product created');
  });

  it('should limit notifications to maxNotifications', () => {
    const { result } = renderHook(() => useSSE('seller-123', { maxNotifications: 2 }));

    const handleMessage = (api.createSSEConnection as jest.Mock).mock.calls[0][1];

    act(() => {
      handleMessage({ id: 1, message: 'Message 1', timestamp: Date.now() });
      handleMessage({ id: 2, message: 'Message 2', timestamp: Date.now() });
      handleMessage({ id: 3, message: 'Message 3', timestamp: Date.now() });
    });

    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.notifications[0].message).toBe('Message 3');
    expect(result.current.notifications[1].message).toBe('Message 2');
  });

  it('should clear notifications', () => {
    const { result } = renderHook(() => useSSE('seller-123'));

    const handleMessage = (api.createSSEConnection as jest.Mock).mock.calls[0][1];

    act(() => {
      handleMessage({ id: 1, message: 'Message 1', timestamp: Date.now() });
    });

    expect(result.current.notifications).toHaveLength(1);

    act(() => {
      result.current.clearNotifications();
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('should handle SSE errors', () => {
    const onError = jest.fn();
    const { result } = renderHook(() => useSSE('seller-123', { onError }));

    const handleError = (api.createSSEConnection as jest.Mock).mock.calls[0][2];

    const error = new Event('error');
    act(() => {
      handleError(error);
    });

    expect(result.current.connected).toBe(false);
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('should close connection on unmount', () => {
    const { unmount } = renderHook(() => useSSE('seller-123'));

    unmount();

    expect(mockEventSource.close).toHaveBeenCalled();
  });

  it('should handle connection errors gracefully', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    (api.createSSEConnection as jest.Mock).mockImplementation(() => {
      throw new Error('Connection failed');
    });

    const { result } = renderHook(() => useSSE('seller-123'));

    expect(result.current.connected).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
