import React, { useState } from 'react';

const ResumeTailoring = () => {
  const [activeTab, setActiveTab] = useState('tailoring');
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [skillsMatch, setSkillsMatch] = useState(0);
  const [missingSkills, setMissingSkills] = useState([]);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tailoredResume, setTailoredResume] = useState('');
  const [showResumeTextModal, setShowResumeTextModal] = useState(false);
  const [showJobDescriptionModal, setShowJobDescriptionModal] = useState(false);

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
      // Read the file content
      const reader = new FileReader();
      reader.onload = (e) => {
        setResumeText(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handlePasteResumeText = () => {
    setShowResumeTextModal(true);
  };

  const handlePasteJobURL = () => {
    setShowJobDescriptionModal(true);
  };

  const handleEnterJobManually = () => {
    setShowJobDescriptionModal(true);
  };

  const handleResumeTextSubmit = (e) => {
    e.preventDefault();
    if (resumeText.trim()) {
      setShowResumeTextModal(false);
    } else {
      alert('Please enter your resume text');
    }
  };

  const handleJobDescriptionSubmit = (e) => {
    e.preventDefault();
    if (jobDescription.trim()) {
      setShowJobDescriptionModal(false);
    } else {
      alert('Please enter the job description');
    }
  };

  const analyzeResume = async () => {
    // Validate inputs
    if (!resumeText.trim() && !resumeFile) {
      alert('Please upload a resume or enter resume text');
      return;
    }
    
    if (!jobDescription.trim()) {
      alert('Please enter a job description');
      return;
    }
    
    setLoading(true);
    
    try {
      // Basic analysis of job description
      const jobKeywords = jobDescription.toLowerCase().split(/[\s,]+/);
      const resumeKeywords = resumeText.toLowerCase().split(/[\s,]+/);
      
      // Calculate skills match percentage
      const matchingKeywords = jobKeywords.filter(keyword => 
        resumeKeywords.includes(keyword) && keyword.length > 3
      );
      const matchPercentage = Math.round((matchingKeywords.length / jobKeywords.length) * 100);
      
      // Generate missing skills based on job description
      const commonSkills = ['project management', 'communication', 'leadership', 'teamwork', 'problem solving'];
      const missingSkillsList = commonSkills.filter(skill => 
        !resumeKeywords.includes(skill) && jobKeywords.includes(skill)
      );
      
      // Generate optimization suggestions
      const suggestions = [
        {
          title: 'Add missing skills',
          description: `Consider adding experience with: ${missingSkillsList.join(', ')}`
        },
        {
          title: 'Highlight relevant experience',
          description: 'Reorder your work experience to put the most relevant positions first'
        },
        {
          title: 'Quantify achievements',
          description: 'Add specific numbers and metrics to your accomplishments'
        }
      ];
      
      // Update state with analysis results
      setSkillsMatch(matchPercentage);
      setMissingSkills(missingSkillsList);
      setOptimizationSuggestions(suggestions);
      
      // Generate tailored resume
      setTailoredResume(generateTailoredResume(resumeText, jobDescription, matchPercentage));
      
    } catch (error) {
      console.error('Error analyzing resume:', error);
      alert(`Error analyzing resume: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateTailoredResume = (resumeText, jobDescription, matchPercentage) => {
    const jobKeywords = jobDescription.toLowerCase().split(/[\s,]+/);
    const resumeLines = resumeText.split('\n');
    
    // Reorder sections based on relevance to job
    const sections = {
      summary: [],
      skills: [],
      experience: [],
      education: []
    };
    
    resumeLines.forEach(line => {
      if (line.toLowerCase().includes('summary') || line.toLowerCase().includes('objective')) {
        sections.summary.push(line);
      } else if (line.toLowerCase().includes('skill')) {
        sections.skills.push(line);
      } else if (line.toLowerCase().includes('experience') || line.toLowerCase().includes('work')) {
        sections.experience.push(line);
      } else if (line.toLowerCase().includes('education')) {
        sections.education.push(line);
      }
    });
    
    // Generate tailored resume text
    let tailoredText = '';
    
    // Add summary/objective first
    tailoredText += sections.summary.join('\n') + '\n\n';
    
    // Add skills section with job-relevant skills first
    tailoredText += 'SKILLS\n';
    const skills = sections.skills.join('\n');
    tailoredText += skills + '\n\n';
    
    // Add experience section
    tailoredText += 'EXPERIENCE\n';
    tailoredText += sections.experience.join('\n') + '\n\n';
    
    // Add education section
    tailoredText += 'EDUCATION\n';
    tailoredText += sections.education.join('\n');
    
    return tailoredText;
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

      <h1 className="text-3xl font-bold mb-4">Tailor Your Resume</h1>
      <p className="text-gray-600 mb-8">
        Optimize your resume for specific job descriptions to increase your chances of getting interviews
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
            Upload your current resume in PDF, DOCX, or TXT format
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
            Paste the job description to tailor your resume
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

      <div className="text-center mb-8">
        <button 
          onClick={analyzeResume}
          className="btn btn-primary px-8"
          disabled={loading || (!resumeText.trim() && !resumeFile) || !jobDescription.trim()}
        >
          {loading ? 'Analyzing...' : 'Analyze Resume'}
        </button>
        {(!resumeText.trim() && !resumeFile) && (
          <p className="text-red-500 mt-2">Please upload a resume or enter resume text</p>
        )}
        {!jobDescription.trim() && (
          <p className="text-red-500 mt-2">Please enter a job description</p>
        )}
      </div>

      {tailoredResume && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <span className="text-primary mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </span>
                <h2 className="text-xl font-bold">Skills Match</h2>
              </div>
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 text-2xl font-bold">
                  {skillsMatch}%
                </div>
              </div>
              <p className="text-gray-600 text-center">
                Your resume matches {skillsMatch}% of required skills
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <span className="text-red-500 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </span>
                <h2 className="text-xl font-bold">Missing Skills</h2>
              </div>
              <ul className="space-y-2">
                {missingSkills.map((skill, index) => (
                  <li key={index} className="flex items-center text-gray-600">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-bold mb-4">Resume Optimization</h2>
            <p className="text-gray-600 mb-6">
              Suggested changes to improve your resume for this position
            </p>
            
            <div className="space-y-4">
              {optimizationSuggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start border-l-4 border-primary pl-4 py-2">
                  <div className="mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">{suggestion.title}</h3>
                    <p className="text-gray-600 text-sm">{suggestion.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-bold mb-4">Tailored Resume Preview</h2>
            <p className="text-gray-600 mb-4">
              Your optimized resume
            </p>
            <div className="border border-gray-300 rounded-md p-4 font-mono text-sm whitespace-pre-line h-96 overflow-y-auto">
              {tailoredResume}
            </div>
          </div>
        </>
      )}

      {showResumeTextModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Enter Resume Text</h2>
            <form onSubmit={handleResumeTextSubmit}>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                className="w-full h-64 border border-gray-300 rounded-md p-4 mb-4"
                placeholder="Paste or type your resume text here..."
              ></textarea>
              <div className="flex justify-end gap-4">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowResumeTextModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showJobDescriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Enter Job Description</h2>
            <form onSubmit={handleJobDescriptionSubmit}>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full h-64 border border-gray-300 rounded-md p-4 mb-4"
                placeholder="Paste or type the job description here..."
              ></textarea>
              <div className="flex justify-end gap-4">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowJobDescriptionModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeTailoring; 