import React, { useState, useEffect } from 'react';

const AIResumeGenerator = ({ currentUser }) => {
  const [resumes, setResumes] = useState([]);
  const [error, setError] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeContent, setResumeContent] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState(null);

  useEffect(() => {
    if (currentUser) {
      fetchResumes();
    }
  }, [currentUser]);

  const fetchResumes = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/resumes', {
        headers: {
          'Authorization': `Bearer ${currentUser.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch resumes');
      }

      const data = await response.json();
      setResumes(data);
      setError('');
    } catch (err) {
      console.error('Error fetching resumes:', err);
      setError('Failed to load resumes. Please try again later.');
    }
  };

  const handleResumeSelect = async (resumeId) => {
    try {
      setSelectedResumeId(resumeId);
      const response = await fetch(`http://localhost:5000/api/resumes/${resumeId}/content`, {
        headers: {
          'Authorization': `Bearer ${currentUser.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch resume content');
      }

      const data = await response.json();
      setResumeContent(data.content);
      setError('');
    } catch (err) {
      console.error('Error fetching resume content:', err);
      setError('Failed to load resume content. Please try again later.');
      setResumeContent('');
      setSelectedResumeId(null);
    }
  };

  const handleGenerate = async () => {
    if (!resumeContent || !jobDescription) {
      setError('Please select a resume and enter a job description.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({
          resumeContent,
          jobDescription
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate resume');
      }

      const data = await response.json();
      setGeneratedContent(data.generatedResume);
      setError('');
    } catch (err) {
      console.error('Error generating resume:', err);
      setError('Failed to generate resume. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">AI Resume Generator</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Select a Resume</h2>
        {resumes.length === 0 ? (
          <p>No resumes available. Please upload a resume first.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumes.map((resume) => (
              <div
                key={resume._id}
                onClick={() => handleResumeSelect(resume._id)}
                className={`p-4 border rounded cursor-pointer hover:bg-gray-50 ${
                  selectedResumeId === resume._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <h3 className="font-medium">{resume.name}</h3>
                <p className="text-sm text-gray-500">
                  Last modified: {new Date(resume.updatedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Job Description</h2>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          className="w-full h-40 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Paste the job description here..."
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || !resumeContent || !jobDescription}
        className={`px-6 py-2 rounded font-medium ${
          loading || !resumeContent || !jobDescription
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {loading ? 'Generating...' : 'Generate Tailored Resume'}
      </button>

      {generatedContent && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Generated Resume</h2>
          <div className="p-4 border rounded bg-white">
            <pre className="whitespace-pre-wrap">{generatedContent}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIResumeGenerator; 