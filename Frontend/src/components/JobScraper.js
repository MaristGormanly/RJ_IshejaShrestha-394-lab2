import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase/config';

const JobScraper = () => {
  const [urls, setUrls] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const urlList = urls.split('\n').filter(url => url.trim() !== '');
    const functions = getFunctions();
    const scrapeJob = httpsCallable(functions, 'scrapeJob');
    
    try {
      const promises = urlList.map(async (url) => {
        const result = await scrapeJob({ url });
        return result.data;
      });
      
      const results = await Promise.all(promises);
      
      // Save successful results to Firestore
      const successfulResults = results.filter(result => result.success);
      for (const result of successfulResults) {
        await addDoc(collection(db, 'jobs'), {
          ...result.data,
          createdAt: new Date(),
          status: 'pending'
        });
      }
      
      setResults(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Job Scraper</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="urls" className="block text-sm font-medium text-gray-700">
            Job URLs (one per line)
          </label>
          <textarea
            id="urls"
            rows={5}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            placeholder="Paste job URLs here, one per line"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Scrape Jobs'}
        </button>
      </form>
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
          Error: {error}
        </div>
      )}
      
      {results.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Results</h3>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-md ${
                  result.success ? 'bg-green-100' : 'bg-red-100'
                }`}
              >
                <h4 className="font-medium">
                  {result.success ? 'Success' : 'Error'}
                </h4>
                {result.success ? (
                  <pre className="mt-2 text-sm overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                ) : (
                  <p className="mt-2 text-sm">{result.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobScraper; 