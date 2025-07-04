import { useState } from 'react';

export default function App() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    if (!file) {
      setError('Please select a file first');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log('Uploading file:', file.name, 'Size:', file.size);
      
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      console.log('Response status:', res.status);
      console.log('Response data:', data);
      
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      setResult(data);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 4 * 1024 * 1024) {
        setError('File size must be less than 4MB');
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'application/pdf'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Please select a valid image file (JPEG, PNG, GIF, BMP, TIFF) or PDF');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };

  const renderFieldValue = (value) => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    
    if (typeof value === 'string' || typeof value === 'number') {
      return value;
    }
    
    if (Array.isArray(value)) {
      return (
        <div className="space-y-1">
          {value.map((item, index) => (
            <div key={index} className="text-sm bg-gray-100 p-2 rounded">
              {typeof item === 'object' ? JSON.stringify(item) : item}
            </div>
          ))}
        </div>
      );
    }
    
    if (typeof value === 'object') {
      return (
        <div className="text-sm bg-gray-100 p-2 rounded max-h-20 overflow-y-auto">
          <pre>{JSON.stringify(value, null, 2)}</pre>
        </div>
      );
    }
    
    return String(value);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl">
        <h1 className="text-2xl font-bold mb-6 text-center">Document Analysis</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Document
            </label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {file && (
              <p className="text-sm text-gray-600 mt-2">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={!file || loading}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Analyzing Document...' : 'Analyze Document'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 font-medium">Error:</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Document Analysis</h2>
              {result.confidence && (
                <span className="text-sm text-gray-600">
                  Confidence: {(result.confidence * 100).toFixed(1)}%
                </span>
              )}
            </div>

            {result.labels && Object.keys(result.labels).length > 0 && (
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  Extracted Fields ({Object.keys(result.labels).length})
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {Object.entries(result.labels).map(([key, label]) => (
                    <div key={key} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm text-gray-700">{key}</span>
                        {label.type && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {label.type}
                          </span>
                        )}
                        {label.confidence && (
                          <span className="text-xs text-gray-500">
                            {(label.confidence * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <div className="text-gray-900">
                        {renderFieldValue(label.value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.tables && result.tables.length > 0 && (
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  Tables ({result.tables.length})
                </h3>
                {result.tables.map((table, tableIndex) => (
                  <div key={tableIndex} className="mb-6 last:mb-0">
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="font-medium text-sm text-gray-700">
                        Table {tableIndex + 1} ({table.rows} rows × {table.columns} columns)
                      </h4>
                      {table.caption && (
                        <span className="text-xs text-gray-500">- {table.caption}</span>
                      )}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-gray-200 text-sm">
                        <tbody>
                          {table.data.map((row, rowIndex) => (
                            <tr key={rowIndex} className={`border-b border-gray-200 ${rowIndex === 0 ? 'bg-gray-50 font-medium' : ''}`}>
                              {row.map((cell, colIndex) => (
                                <td 
                                  key={colIndex} 
                                  className="px-3 py-2 border-r border-gray-200 last:border-r-0"
                                >
                                  {cell || ''}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Special handling for TabladeCompra if it contains data */}
            {result.labels && result.labels.TabladeCompra && result.labels.TabladeCompra.value && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-3">
                  Tabla de Compra (Purchase Table)
                </h3>
                <div className="text-green-800">
                  {renderFieldValue(result.labels.TabladeCompra.value)}
                </div>
              </div>
            )}

            {(!result.labels || Object.keys(result.labels).length === 0) && 
             (!result.tables || result.tables.length === 0) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                  No labels or tables were extracted from this document.
                </p>
              </div>
            )}

            <details className="bg-gray-50 rounded-lg p-4">
              <summary className="cursor-pointer font-medium text-gray-700">
                Raw Response (for debugging)
              </summary>
              <pre className="mt-3 text-xs overflow-auto max-h-60 bg-white p-3 rounded border">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}