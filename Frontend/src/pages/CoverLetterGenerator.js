import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

const CoverLetterGenerator = () => {
  const [activeTab, setActiveTab] = useState('generator');
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [positionTitle, setPositionTitle] = useState('');
  const [keySkills, setKeySkills] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState('');

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
    }
  };

  const handlePasteResumeText = () => {
    // Logic to handle pasting resume text will be implemented here
  };

  const handlePasteJobURL = () => {
    // Logic to scrape job description from URL will be implemented here
  };

  const handleEnterJobManually = () => {
    // Logic to enter job description manually will be implemented here
  };

  const generateCoverLetter = async () => {
    if (!auth.currentUser) return;
    
    setLoading(true);
    
    try {
      // In a real implementation, this would call an API to generate the cover letter
      // For now, let's create a placeholder letter
      const generatedLetter = `Dear Hiring Manager,

I am writing to express my interest in the [${positionTitle}] role at [${companyName}]. With my background in [relevant experience] and skills in [${keySkills}], I believe I would be a valuable addition to your team.

[Middle paragraphs will be generated based on your resume and the job description]

Thank you for considering my application. I look forward to the opportunity to discuss how my skills and experience align with your needs.

Sincerely,
[Your Name]`;

      setGeneratedCoverLetter(generatedLetter);
      
      // Save to Firestore
      const documentId = uuidv4();
      let resumeUrl = '';
      
      if (resumeFile) {
        const storageRef = ref(storage, `resumes/${auth.currentUser.uid}/${resumeFile.name}`);
        await uploadBytes(storageRef, resumeFile);
        resumeUrl = await getDownloadURL(storageRef);
      }
      
      await setDoc(doc(db, 'documents', documentId), {
        id: documentId,
        userId: auth.currentUser.uid,
        type: 'cover-letter',
        title: `Cover Letter - ${companyName} (${positionTitle})`,
        companyName,
        positionTitle,
        keySkills,
        jobDescription,
        resumeUrl,
        resumeText,
        coverLetter: generatedLetter,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
    } catch (error) {
      console.error('Error generating cover letter:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex border-b mb-6">
        <button
          className={`py-2 px-4 ${
            activeTab === 'generator'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('generator')}
        >
          Cover Letter Generator
        </button>
        <button
          className={`py-2 px-4 ${
            activeTab === 'tailoring'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('tailoring')}
        >
          Resume Tailoring
        </button>
      </div>

      <h1 className="text-3xl font-bold mb-4">Generate Your Cover Letter</h1>
      <p className="text-gray-600 mb-8">
        Upload your resume and job description to create a personalized cover letter
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <span className="text-primary mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            <h2 className="text-xl font-bold">Upload Resume</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Upload your resume in PDF, DOCX, or TXT format
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => document.getElementById('resumeFile').click()} 
              className="w-full btn btn-primary text-left flex items-center"
            >
              <span className="mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </span>
              Upload File
            </button>
            <input 
              id="resumeFile" 
              type="file" 
              accept=".pdf,.docx,.txt" 
              className="hidden" 
              onChange={handleResumeUpload} 
            />
            <button 
              onClick={handlePasteResumeText}
              className="w-full btn btn-secondary text-left"
            >
              Paste Text
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <span className="text-primary mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            <h2 className="text-xl font-bold">Job Description</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Paste the job description to tailor your cover letter
          </p>
          <div className="space-y-3">
            <button 
              onClick={handlePasteJobURL}
              className="w-full btn btn-primary text-left"
            >
              Paste URL
            </button>
            <button 
              onClick={handleEnterJobManually}
              className="w-full btn btn-secondary text-left"
            >
              Enter Manually
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-bold mb-4">Job Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="companyName">
              Company Name
            </label>
            <input
              id="companyName"
              type="text"
              className="form-input"
              placeholder="Enter company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="positionTitle">
              Position Title
            </label>
            <input
              id="positionTitle"
              type="text"
              className="form-input"
              placeholder="Enter job position"
              value={positionTitle}
              onChange={(e) => setPositionTitle(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="keySkills">
            Key Skills (separate with commas)
          </label>
          <input
            id="keySkills"
            type="text"
            className="form-input"
            placeholder="Project management, communication, leadership"
            value={keySkills}
            onChange={(e) => setKeySkills(e.target.value)}
          />
        </div>
      </div>

      <div className="text-center mb-8">
        <button 
          onClick={generateCoverLetter}
          className="btn btn-primary px-8"
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Cover Letter'}
        </button>
      </div>

      {generatedCoverLetter && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-bold mb-4">Your Cover Letter</h2>
          <p className="text-gray-600 mb-4">
            Edit your generated cover letter
          </p>
          <textarea
            className="w-full h-64 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            value={generatedCoverLetter}
            onChange={(e) => setGeneratedCoverLetter(e.target.value)}
          ></textarea>
          <div className="flex justify-end space-x-4 mt-4">
            <button className="btn btn-secondary">
              Download as PDF
            </button>
            <button className="btn btn-secondary">
              Copy to Clipboard
            </button>
            <button className="btn btn-primary">
              Save to Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoverLetterGenerator; 