import React, { useState, useEffect } from 'react';
import { Search, Eye, Trash2, Edit, FileText, Calendar, DollarSign, Hash } from 'lucide-react';
import { getAllDocuments } from '@/services/documentManager';

const DocumentViewer = () => {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('fecha'); 
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedDocument, setSelectedDocument] = useState(null);

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

  const DocumentDetailModal = ({ document, onClose }) => {
    if (!document) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Document Details</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            {Object.entries(document).map(([key, value]) => {
              if (key === 'id') return null;
              
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
                  <div className="text-gray-900 mt-1">{displayValue || 'N/A'}</div>
                </div>
              );
            })}
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
                <option value="Fecha">Document Date (Fecha)</option>
                <option value="created_at">Created Date</option>
                <option value="timestamp">Timestamp</option>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-900 truncate">
                        {doc['Folio fiscal'] || 'Unknown Folio'}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedDocument(doc)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(doc.fecha || doc.Fecha || doc.created_at || doc.timestamp)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-medium">{formatCurrency(doc.Total)}</span>
                    </div>

                    {doc['Método de pago'] && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Hash className="w-4 h-4" />
                        <span className="truncate">{doc['Método de pago']}</span>
                      </div>
                    )}

                    {doc['Domicilio fiscal'] && (
                      <div className="text-xs text-gray-500 mt-2 truncate">
                        {doc['Domicilio fiscal']}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        Date: {formatDate(doc.fecha || doc.Fecha || doc.created_at || doc.timestamp)}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setSelectedDocument(doc)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => console.log('Edit:', doc.id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => console.log('Delete:', doc.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
    </div>
  );
};

export default DocumentViewer;