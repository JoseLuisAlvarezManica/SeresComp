import React from 'react';
import { useState } from 'react';
import {createDocument} from '../services/documentManager';

export const Scanner = () => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editableData, setEditableData] = useState({});

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
      initializeEditableData(data);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const initializeEditableData = (data) => {
    const editable = {};
    
    if (data.labels) {
      Object.entries(data.labels).forEach(([key, label]) => {
        if (key !== 'TabladeCompra') {
          editable[key] = typeof label.value === 'string' || typeof label.value === 'number' 
            ? String(label.value || '') 
            : '';
        }
      });
    }
    
    if (data.tables && data.tables.length > 0) {
      editable.TabladeCompra = data.tables[0].data.map(row => [...row]);
    }
    
    setEditableData(editable);
  };

  const handleFieldChange = (fieldName, value) => {
    setEditableData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleTableCellChange = (rowIndex, colIndex, value) => {
    setEditableData(prev => ({
      ...prev,
      TabladeCompra: prev.TabladeCompra.map((row, rIdx) => 
        rIdx === rowIndex 
          ? row.map((cell, cIdx) => cIdx === colIndex ? value : cell)
          : row
      )
    }));
  };

  const addTableRow = () => {
    setEditableData(prev => {
      if (!prev.TabladeCompra || prev.TabladeCompra.length === 0) {
        return prev;
      }
      
      const columnCount = prev.TabladeCompra[0].length;
      const newRow = Array(columnCount).fill('');
      
      return {
        ...prev,
        TabladeCompra: [...prev.TabladeCompra, newRow]
      };
    });
  };

  const removeTableRow = (rowIndex) => {
    setEditableData(prev => {
      if (!prev.TabladeCompra || prev.TabladeCompra.length <= 1) {
        return prev;
      }
      
      return {
        ...prev,
        TabladeCompra: prev.TabladeCompra.filter((_, index) => index !== rowIndex)
      };
    });
  };

  const addTableColumn = () => {
    setEditableData(prev => {
      if (!prev.TabladeCompra || prev.TabladeCompra.length === 0) {
        return prev;
      }
      
      return {
        ...prev,
        TabladeCompra: prev.TabladeCompra.map((row, index) => [
          ...row,
          index === 0 ? 'New Column' : ''
        ])
      };
    });
  };

  const removeTableColumn = (colIndex) => {
    setEditableData(prev => {
      if (!prev.TabladeCompra || prev.TabladeCompra.length === 0 || prev.TabladeCompra[0].length <= 1) {
        return prev;
      }
      
      return {
        ...prev,
        TabladeCompra: prev.TabladeCompra.map(row => 
          row.filter((_, index) => index !== colIndex)
        )
      };
    });
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

  const getConfidenceColor = (confidence) => {
    if (!confidence) return 'text-gray-900';
    return confidence < 0.5 ? 'text-red-600' : 'text-gray-900';
  };

  const renderEditableField = (fieldName, label) => {
    const confidence = label.confidence || 0;
    const textColor = getConfidenceColor(confidence);
    
    return (
      <div key={fieldName} className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium text-sm text-gray-700">{fieldName}</span>
          {label.type && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {label.type}
            </span>
          )}
          {confidence > 0 && (
            <span className={`text-xs ${confidence < 0.5 ? 'text-red-600' : 'text-gray-500'}`}>
              {(confidence * 100).toFixed(1)}%
            </span>
          )}
        </div>
        <input
          type="text"
          value={editableData[fieldName] || ''}
          onChange={(e) => handleFieldChange(fieldName, e.target.value)}
          className={`w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${textColor}`}
          placeholder={`Enter ${fieldName}`}
        />
      </div>
    );
  };

  const renderTabladeCompra = () => {
    if (!editableData.TabladeCompra || !Array.isArray(editableData.TabladeCompra)) {
      return null;
    }

    const tableData = editableData.TabladeCompra;
    const confidence = result.labels?.TabladeCompra?.confidence || 0;
    
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-blue-900">
              Tabla de Compra (Purchase Table)
            </h3>
            {confidence > 0 && (
              <span className={`text-xs ${confidence < 0.5 ? 'text-red-600' : 'text-gray-500'}`}>
                {(confidence * 100).toFixed(1)}%
              </span>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={addTableRow}
              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
              title="Add Row"
            >
              + Row
            </button>
            <button
              onClick={addTableColumn}
              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
              title="Add Column"
            >
              + Column
            </button>
          </div>
        </div>
        
        <div className="pt-4">
            <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
                <tbody>
                {tableData.map((row, rowIndex) => (
                    <tr key={rowIndex} className={`border-b border-gray-300 ${rowIndex === 0 ? 'bg-gray-100' : 'bg-white'}`}>
                    {rowIndex > 0 && (
                        <td className="border-r border-gray-300 last:border-r-0 p-0 relative min-w-[120px]">
                        <button
                            onClick={() => removeTableRow(rowIndex)}
                            className="w-full h-full text-red-600 hover:bg-red-100 rounded text-xs"
                            title="Delete Row"
                        >
                            ×
                        </button>
                        </td>
                    )}
                    {rowIndex === 0 && (
                        <td className="border-r border-gray-300 p-1 w-8 bg-gray-100">
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            #
                        </div>
                        </td>
                    )}
                    
                    {row.map((cell, colIndex) => (
                        <td key={colIndex} className="border-r border-gray-300 last:border-r-0 p-1 relative">
                        {rowIndex === 0 && (
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
                            <button
                                onClick={() => removeTableColumn(colIndex)}
                                className="w-5 h-5 bg-red-600 text-white rounded-full text-xs hover:bg-red-700 transition-colors"
                                title="Delete Column"
                            >
                                ×
                            </button>
                            </div>
                        )}
                        
                        {rowIndex === 0 ? (
                            <input
                            type="text"
                            value={cell}
                            onChange={(e) => handleTableCellChange(rowIndex, colIndex, e.target.value)}
                            className="w-full p-2 border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-sm text-gray-700"
                            placeholder="Column Header"
                            />
                        ) : (
                            <input
                            type="text"
                            value={cell}
                            onChange={(e) => handleTableCellChange(rowIndex, colIndex, e.target.value)}
                            className={`w-full p-2 border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm ${getConfidenceColor(confidence)}`}
                            />
                        )}
                        </td>
                    ))}
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </div>
      </div>
    );
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
                  Overall Confidence: {(result.confidence * 100).toFixed(1)}%
                </span>
              )}
            </div>

            {renderTabladeCompra()}

            {result.labels && Object.keys(result.labels).length > 0 && (
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  Extracted Fields ({Object.keys(result.labels).filter(key => key !== 'TabladeCompra').length})
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {Object.entries(result.labels)
                    .filter(([key]) => key !== 'TabladeCompra')
                    .map(([key, label]) => renderEditableField(key, label))}
                </div>
              </div>
            )}

            {(!result.labels || Object.keys(result.labels).length === 0) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                  No fields were extracted from this document.
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => {
                  const dataStr = JSON.stringify(editableData, null, 2);
                  const dataBlob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'extracted_data.json';
                  link.click();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Exportar información
              </button>
              <button
                onClick={async () => {
                try{
                  const dataStr = JSON.stringify(editableData, null, 2);
                  const data = JSON.parse(dataStr);
                  await createDocument(data);
                  alert("Data uploaded successfully!");
                }catch (error) {
                    console.error("Error uploading data: ", error);
                    alert("Error uploading data.");        
                }}}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Subir a base de datos
              </button>
            </div>
            

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
export default Scanner;