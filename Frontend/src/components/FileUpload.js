import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Assuming you have an auth context
import { getApiUrl } from '../services/api';

const FileUpload = ({ onUploadSuccess, onUploadError, title, type }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { currentUser } = useAuth();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      onUploadError('Please select a file');
      return;
    }

    if (!currentUser) {
      onUploadError('Please log in to upload files');
      return;
    }

    setLoading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', currentUser.uid);
    formData.append('title', title || file.name);
    formData.append('type', type || 'resume');

    try {
      const response = await fetch(getApiUrl('/api/upload'), {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include credentials for CORS
        headers: {
          'Authorization': `Bearer ${await currentUser.getIdToken()}` // Add Firebase token for auth
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      onUploadSuccess(data);
      setFile(null);
      setProgress(100);
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError(error.message || 'File upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleUpload} className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <input
            type="file"
            onChange={handleFileChange}
            accept=".txt,.pdf,.doc,.docx"
            className="w-full"
          />
          <p className="mt-2 text-sm text-gray-500">
            Supported formats: TXT, PDF, DOC, DOCX (Max 5MB)
          </p>
        </div>
        
        {loading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}

        <button
          type="submit"
          disabled={!file || loading}
          className={`w-full py-2 px-4 rounded-md text-white ${
            !file || loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Uploading...' : 'Upload File'}
        </button>
      </form>
    </div>
  );
};

export default FileUpload; 