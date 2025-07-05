import React, { useState, useEffect } from 'react';
import { Search, Eye, Trash2, Edit, FileText, Calendar, DollarSign, Hash, ShoppingCart } from 'lucide-react';
import { getAllDocuments, deleteDocument } from '@/services/documentManager';

const DocumentViewer = () => {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('fecha');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchTerm, sortBy, sortOrder]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await getAllDocuments();
      console.log('Loaded documents:', docs);
      if (docs.length > 0) {
        console.log('First document fields:', Object.keys(docs[0]));
        console.log('First document:', docs[0]);
      }
      setDocuments(docs);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId, folio) => {
    try {
      setError(null);
      await deleteDocument(documentId);
      
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      setDeleteConfirmation(null);
      
      console.log(`Document ${folio} deleted successfully`);
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document');
    }
  };

  const filterDocuments = () => {
    let filtered = [...documents];

    if (searchTerm) {
      filtered = filtered.filter(doc => 
        Object.values(doc).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'fecha' || sortBy === 'Fecha') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      }
      else if (aValue && typeof aValue === 'object' && aValue.seconds) {
        aValue = aValue.seconds;
      }
      if (bValue && typeof bValue === 'object' && bValue.seconds) {
        bValue = bValue.seconds;
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
      }
      if (typeof bValue === 'string') {
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredDocuments(filtered);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    let date;
    if (typeof timestamp === 'object' && timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      return 'N/A';
    }
    
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    const num = parseFloat(amount.toString().replace(/[^\d.-]/g, ''));
    return isNaN(num) ? amount : `$${num.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  };

  const parseTabladeCompra = (document) => {
    if (document.TabladeCompra_json) {
      try {
        return JSON.parse(document.TabladeCompra_json);
      } catch (error) {
        console.error('Error parsing TabladeCompra_json:', error);
        return [];
      }
    }
    return [];
  };

  const DeleteConfirmationModal = ({ document, onConfirm, onCancel }) => {
    if (!document) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="flex items-center mb-4">
            <Trash2 className="w-6 h-6 text-red-600 mr-3" />
            <h2 className="text-xl font-bold text-gray-900">Delete Document</h2>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-700 mb-2">
              Are you sure you want to delete this document?
            </p>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Folio:</span> {document['Folio fiscal'] || 'Unknown'}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Date:</span> {formatDate(document.fecha || document.created_at)}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Total:</span> {formatCurrency(document.Total)}
              </p>
            </div>
            <p className="text-red-600 text-sm mt-2">
              This action cannot be undone.
            </p>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(document.id, document['Folio fiscal'])}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  const TabladeCompraTable = ({ document }) => {
    const tableData = parseTabladeCompra(document);
    
    if (tableData.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          <ShoppingCart className="mx-auto h-8 w-8 mb-2" />
          <p>No purchase table data available</p>
        </div>
      );
    }

    const headers = tableData[0];
    const rows = tableData.slice(1);

    const isNumericColumn = (columnIndex) => {
      const header = headers[columnIndex]?.toLowerCase();
      return header === 'p/u' || header === 'importe' || header === 'cantidad';
    };

    const formatTableCurrency = (value) => {
      const cleanValue = value.replace(/,/g, '');
      if (!isNaN(cleanValue) && cleanValue !== '') {
        return new Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency: 'MXN'
        }).format(parseFloat(cleanValue));
      }
      return value;
    };

    return (
      <div className="mt-4">
        <div className="flex items-center mb-3">
          <ShoppingCart className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Tabla de Compra</h3>
        </div>
        
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                {headers.map((header, index) => (
                  <th
                    key={index}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={`px-4 py-3 text-sm ${
                        isNumericColumn(cellIndex)
                          ? 'text-right font-medium text-gray-900'
                          : 'text-gray-900'
                      }`}
                    >
                      {isNumericColumn(cellIndex) && 
                       (headers[cellIndex].toLowerCase() === 'p/u' || 
                        headers[cellIndex].toLowerCase() === 'importe')
                        ? formatTableCurrency(cell)
                        : cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary for TabladeCompra */}
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Total Items:</span>
              <span className="ml-2 text-gray-900">{rows.length}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Total Quantity:</span>
              <span className="ml-2 text-gray-900">
                {rows.reduce((sum, row) => {
                  const qty = parseInt(row[0]?.replace(/,/g, '') || 0);
                  return sum + qty;
                }, 0)}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Total Amount:</span>
              <span className="ml-2 text-gray-900 font-medium">
                {formatTableCurrency(
                  rows.reduce((sum, row) => {
                    const amount = parseFloat(row[5]?.replace(/,/g, '') || 0);
                    return sum + amount;
                  }, 0).toString()
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DocumentDetailModal = ({ document, onClose }) => {
    if (!document) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Document Details</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            {document.TabladeCompra_json && (
              <TabladeCompraTable document={document} />
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(document).map(([key, value]) => {
                if (key === 'id' || key === 'TabladeCompra_json') return null;
                
                let displayValue = value;
                if (key.toLowerCase().includes('fecha') || key.includes('_at') || key.includes('_time')) {
                  displayValue = formatDate(value);
                } else if (key.toLowerCase().includes('total') || key.toLowerCase().includes('iva')) {
                  displayValue = formatCurrency(value);
                } else if (typeof value === 'object') {
                  displayValue = JSON.stringify(value, null, 2);
                }

                return (
                  <div key={key} className="border-b pb-2">
                    <div className="font-medium text-gray-700 text-sm">{key}</div>
                    <div className="text-gray-900 mt-1 break-words">{displayValue || 'N/A'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Document Library</h1>
            <button
              onClick={loadDocuments}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="fecha">Document Date (fecha)</option>
                <option value="created_at">Created Date</option>
                <option value="Folio fiscal">Folio</option>
                <option value="Total">Total</option>
              </select>
              
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Showing {filteredDocuments.length} of {documents.length} documents
            </p>
          </div>

          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'No documents found matching your search.' : 'No documents available.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Folio Fiscal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Items
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDocuments.map((doc) => {
                    const tabladeCompra = parseTabladeCompra(doc);
                    const itemCount = tabladeCompra.length > 0 ? tabladeCompra.length - 1 : 0;
                    
                    return (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 text-blue-600 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {doc['Folio fiscal'] || 'Unknown Folio'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            {formatDate(doc.fecha || doc.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <DollarSign className="w-4 h-4 text-green-600 mr-2" />
                            <span className="font-medium">{formatCurrency(doc.Total)}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 truncate max-w-xs">
                            {doc['Domicilio fiscal'] || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <ShoppingCart className="w-4 h-4 text-gray-400 mr-2" />
                            <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setSelectedDocument(doc)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmation(doc)}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedDocument && (
        <DocumentDetailModal
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}

      {deleteConfirmation && (
        <DeleteConfirmationModal
          document={deleteConfirmation}
          onConfirm={handleDeleteDocument}
          onCancel={() => setDeleteConfirmation(null)}
        />
      )}
    </div>
  );
};

export default DocumentViewer;