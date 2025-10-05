import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../../src/hooks/useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with default value when localStorage is empty', () => {
    (localStorage.getItem as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'));

    expect(result.current[0]).toBe('defaultValue');
    expect(localStorage.getItem).toHaveBeenCalledWith('testKey');
  });

  it('should initialize with stored value when localStorage has data', () => {
    (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify('storedValue'));

    const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'));

    expect(result.current[0]).toBe('storedValue');
  });

  it('should initialize with plain string when JSON parse fails', () => {
    (localStorage.getItem as jest.Mock).mockReturnValue('plainString');

    const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'));

    expect(result.current[0]).toBe('plainString');
  });

  it('should set value in localStorage', () => {
    (localStorage.getItem as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'));

    act(() => {
      result.current[1]('newValue');
    });

    expect(result.current[0]).toBe('newValue');
    expect(localStorage.setItem).toHaveBeenCalledWith('testKey', 'newValue');
  });

  it('should set object value as JSON string in localStorage', () => {
    (localStorage.getItem as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => useLocalStorage<{ name: string }>('testKey', { name: 'test' }));

    const newValue = { name: 'updated' };
    act(() => {
      result.current[1](newValue);
    });

    expect(result.current[0]).toEqual(newValue);
    expect(localStorage.setItem).toHaveBeenCalledWith('testKey', JSON.stringify(newValue));
  });

  it('should remove value from localStorage', () => {
    (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify('storedValue'));

    const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'));

    act(() => {
      result.current[2]();
    });

    expect(result.current[0]).toBe('defaultValue');
    expect(localStorage.removeItem).toHaveBeenCalledWith('testKey');
  });

  it('should handle localStorage errors gracefully', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    (localStorage.getItem as jest.Mock).mockImplementation(() => {
      throw new Error('Storage error');
    });

    const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'));

    expect(result.current[0]).toBe('defaultValue');
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should handle storage events', () => {
    (localStorage.getItem as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'));

    const storageEvent = new StorageEvent('storage', {
      key: 'testKey',
      newValue: JSON.stringify('updatedValue'),
    });

    act(() => {
      window.dispatchEvent(storageEvent);
    });

    expect(result.current[0]).toBe('updatedValue');
  });
});
