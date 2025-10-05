import React, { useState, ChangeEvent, DragEvent } from 'react';
import { productService } from '../services/api';
import Toast from './Toast';
import { useToast } from '../hooks';
import { env } from '../config/env';

interface ImportResult {
  success: boolean;
  message: string;
  import_id?: string;
}

const ImportPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  
  const { toast, showToast } = useToast();

  const maxFileSizeBytes = env.upload.maxFileSizeMB * 1024 * 1024;

  const validateFile = (selectedFile: File): boolean => {
    if (!selectedFile.name.endsWith('.csv')) {
      showToast('Please select a CSV file', 'error');
      return false;
    }
    if (selectedFile.size > maxFileSizeBytes) {
      showToast(`File size must be less than ${env.upload.maxFileSizeMB}MB`, 'error');
      return false;
    }
    return true;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async (): Promise<void> => {
    if (!file) {
      showToast('Please select a file', 'error');
      return;
    }

    setUploading(true);
    setProgress(0);
    setResult(null);

    try {
      const response = await productService.importProducts(file, (progressPercent) => {
        setProgress(progressPercent);
      });

      setResult({
        success: true,
        message: response.data.message,
        import_id: response.data.import_id
      });
      showToast('Import started successfully');
      setFile(null);
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      setResult({
        success: false,
        message: errorMessage
      });
      showToast('Import failed: ' + errorMessage, 'error');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && validateFile(droppedFile)) {
      setFile(droppedFile);
      setResult(null);
    }
  };

  return (
    <div className="import-page">
      <h1>Import Products from CSV</h1>
      
      <div className="import-instructions">
        <h3>CSV Format Requirements:</h3>
        <ul>
          <li>Maximum file size: {env.upload.maxFileSizeMB}MB</li>
          <li>Maximum rows: {env.upload.maxCsvRows.toLocaleString()}</li>
          <li>Required columns: name, description, price, quantity, category</li>
        </ul>
        <div className="csv-example">
          <strong>Example:</strong>
          <pre>
name,description,price,quantity,category{'\n'}
iPhone 15,Latest smartphone,999.99,100,Electronics{'\n'}
MacBook Pro,16-inch laptop,2499.99,50,Electronics
          </pre>
        </div>
      </div>

      <div
        className="file-upload-area"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="file-upload-content">
          <div className="upload-icon">📁</div>
          <p>Drag and drop your CSV file here, or</p>
          <label htmlFor="file-input" className="btn btn-primary">
            Choose File
          </label>
          <input
            id="file-input"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          {file && (
            <div className="selected-file">
              <strong>Selected:</strong> {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </div>
          )}
        </div>
      </div>

      {file && !uploading && (
        <button className="btn btn-primary btn-upload" onClick={handleUpload}>
          Upload and Import
        </button>
      )}

      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="progress-text">Uploading... {progress}%</p>
        </div>
      )}

      {result && (
        <div className={`import-result ${result.success ? 'success' : 'error'}`}>
          <h3>{result.success ? '✅ Import Started' : '❌ Import Failed'}</h3>
          <p>{result.message}</p>
          {result.import_id && (
            <p className="import-id">Import ID: {result.import_id}</p>
          )}
          {result.success && (
            <p className="result-note">
              The import is processing in the background. 
              You'll receive real-time notifications as products are created.
            </p>
          )}
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
};

export default ImportPage;