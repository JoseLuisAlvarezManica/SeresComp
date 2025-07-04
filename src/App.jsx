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

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h1 className="text-xl font-bold mb-4">Upload Document</h1>
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
          className="mb-4 w-full border border-gray-300 p-2 rounded"
        />
        <button
          type="submit"
          disabled={!file || loading}
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Analyze Document'}
        </button>
        {error && <p className="text-red-600 mt-2">{error}</p>}
        {result && (
          <pre className="mt-4 bg-gray-100 p-4 text-xs overflow-auto max-h-60">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </form>
    </div>
  );
}