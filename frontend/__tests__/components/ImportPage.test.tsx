import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImportPage from '../../src/components/ImportPage';
import { productService } from '../../src/services/api';
import * as hooks from '../../src/hooks';

jest.mock('../../src/services/api');
jest.mock('../../src/hooks');
jest.mock('../../src/components/Toast', () => {
  return function MockToast({ message }: any) {
    return <div data-testid="toast">{message}</div>;
  };
});

describe('ImportPage', () => {
  const mockUseToast = {
    toast: null,
    showToast: jest.fn(),
    hideToast: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (hooks.useToast as jest.Mock).mockReturnValue(mockUseToast);
  });

  it('should render import page', () => {
    render(<ImportPage />);

    expect(screen.getByText('Import Products from CSV')).toBeInTheDocument();
    expect(screen.getByText('CSV Format Requirements:')).toBeInTheDocument();
  });

  it('should render CSV format instructions', () => {
    render(<ImportPage />);

    expect(screen.getByText(/Maximum file size/i)).toBeInTheDocument();
    expect(screen.getByText(/Maximum rows/i)).toBeInTheDocument();
    expect(screen.getByText(/Required columns/i)).toBeInTheDocument();
  });

  it('should handle file selection', () => {
    render(<ImportPage />);

    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    const input = document.getElementById('file-input') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText(/test.csv/)).toBeInTheDocument();
  });

  it('should validate CSV file extension', () => {
    render(<ImportPage />);

    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const input = document.getElementById('file-input') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    expect(mockUseToast.showToast).toHaveBeenCalledWith('Please select a CSV file', 'error');
  });

  it('should validate file size', () => {
    render(<ImportPage />);

    const largeContent = 'x'.repeat(11 * 1024 * 1024);
    const file = new File([largeContent], 'large.csv', { type: 'text/csv' });
    Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 });

    const input = document.getElementById('file-input') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(mockUseToast.showToast).toHaveBeenCalledWith(
      expect.stringContaining('File size must be less than'),
      'error'
    );
  });

  it('should show upload button when file is selected', () => {
    render(<ImportPage />);

    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    const input = document.getElementById('file-input') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText('Upload and Import')).toBeInTheDocument();
  });

  it('should upload file successfully', async () => {
    (productService.importProducts as jest.Mock).mockResolvedValue({
      data: {
        message: 'Import started',
        import_id: 'import-123',
        status: 'processing',
      },
    });

    render(<ImportPage />);

    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    const input = document.getElementById('file-input') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    const uploadButton = screen.getByText('Upload and Import');
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(productService.importProducts).toHaveBeenCalledWith(file, expect.any(Function));
      expect(mockUseToast.showToast).toHaveBeenCalledWith('Import started successfully');
    });

    expect(screen.getByText('✅ Import Started')).toBeInTheDocument();
    expect(screen.getByText('Import started')).toBeInTheDocument();
    expect(screen.getByText('Import ID: import-123')).toBeInTheDocument();
  });

  it('should handle upload errors', async () => {
    (productService.importProducts as jest.Mock).mockRejectedValue({
      response: { data: { message: 'Upload failed' } },
    });

    render(<ImportPage />);

    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    const input = document.getElementById('file-input') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    const uploadButton = screen.getByText('Upload and Import');
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText('❌ Import Failed')).toBeInTheDocument();
      expect(mockUseToast.showToast).toHaveBeenCalledWith(
        expect.stringContaining('Import failed'),
        'error'
      );
    });
  });

  it('should show upload progress', async () => {
    let progressCallback: ((percent: number) => void) | undefined;

    (productService.importProducts as jest.Mock).mockImplementation((file, onProgress) => {
      progressCallback = onProgress;
      return new Promise(resolve => {
        setTimeout(() => {
          if (progressCallback) progressCallback(50);
          resolve({
            data: {
              message: 'Import started',
              import_id: 'import-123',
              status: 'processing',
            },
          });
        }, 100);
      });
    });

    render(<ImportPage />);

    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    const input = document.getElementById('file-input') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    const uploadButton = screen.getByText('Upload and Import');
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText(/Uploading/)).toBeInTheDocument();
    });
  });

  it('should handle drag and drop', () => {
    render(<ImportPage />);

    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    const dropArea = document.querySelector('.file-upload-area');

    fireEvent.drop(dropArea!, {
      dataTransfer: {
        files: [file],
      },
    });

    expect(screen.getByText(/test.csv/)).toBeInTheDocument();
  });

  it('should prevent default on drag over', () => {
    render(<ImportPage />);

    const dropArea = document.querySelector('.file-upload-area');
    
    fireEvent.dragOver(dropArea!);

    expect(dropArea).toBeInTheDocument();
  });

  it('should show error when uploading without file', () => {
    render(<ImportPage />);

    const uploadButton = screen.queryByText('Upload and Import');
    expect(uploadButton).not.toBeInTheDocument();
  });

  it('should clear file after successful upload', async () => {
    (productService.importProducts as jest.Mock).mockResolvedValue({
      data: {
        message: 'Import started',
        import_id: 'import-123',
        status: 'processing',
      },
    });

    render(<ImportPage />);

    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    const input = document.getElementById('file-input') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByText(/test.csv/)).toBeInTheDocument();

    const uploadButton = screen.getByText('Upload and Import');
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText('✅ Import Started')).toBeInTheDocument();
    });

    expect(screen.queryByText(/test.csv/)).not.toBeInTheDocument();
  });
});
