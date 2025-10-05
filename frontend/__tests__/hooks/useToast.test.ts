import { renderHook, act } from '@testing-library/react';
import { useToast } from '../../src/hooks/useToast';

jest.useFakeTimers();

describe('useToast', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should initialize with no toast', () => {
    const { result } = renderHook(() => useToast());

    expect(result.current.toast).toBeNull();
  });

  it('should show success toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Success message');
    });

    expect(result.current.toast).toEqual({
      message: 'Success message',
      type: 'success',
    });
  });

  it('should show error toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Error message', 'error');
    });

    expect(result.current.toast).toEqual({
      message: 'Error message',
      type: 'error',
    });
  });

  it('should show info toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Info message', 'info');
    });

    expect(result.current.toast).toEqual({
      message: 'Info message',
      type: 'info',
    });
  });

  it('should hide toast after duration', () => {
    const { result } = renderHook(() => useToast(1000));

    act(() => {
      result.current.showToast('Test message');
    });

    expect(result.current.toast).not.toBeNull();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.toast).toBeNull();
  });

  it('should hide toast manually', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Test message');
    });

    expect(result.current.toast).not.toBeNull();

    act(() => {
      result.current.hideToast();
    });

    expect(result.current.toast).toBeNull();
  });

  it('should use custom duration', () => {
    const { result } = renderHook(() => useToast(2000));

    act(() => {
      result.current.showToast('Test message');
    });

    expect(result.current.toast).not.toBeNull();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.toast).not.toBeNull();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.toast).toBeNull();
  });
});
