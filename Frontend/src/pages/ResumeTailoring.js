import React, { useState, useEffect } from 'react';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

const ResumeTailoring = () => {
  const [activeTab, setActiveTab] = useState('tailoring');
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [skillsMatch, setSkillsMatch] = useState(65);
  const [missingSkills, setMissingSkills] = useState([
    'Project management',
    'Data analysis',
    'SQL',
    'Tableau',
    'Leadership'
  ]);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState([
    {
      title: 'Add project management experience',
      description: 'Highlight your experience with Agile methodologies'
    },
    {
      title: 'Emphasize data analysis skills',
      description: 'Include specific tools like Tableau and SQL'
    },
    {
      title: 'Reorder work experience',
      description: 'Place most relevant experience first'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [tailoredResume, setTailoredResume] = useState('');
  const [savedResumes, setSavedResumes] = useState([]);
  const [showResumeTextModal, setShowResumeTextModal] = useState(false);
  const [showJobDescriptionModal, setShowJobDescriptionModal] = useState(false);
  const [showJobUrlModal, setShowJobUrlModal] = useState(false);
  const [selectedSavedResume, setSelectedSavedResume] = useState(null);
  const [showSavedResumesModal, setShowSavedResumesModal] = useState(false);
  const [resumeTitle, setResumeTitle] = useState('');
  const [showSaveTitleModal, setShowSaveTitleModal] = useState(false);
  const [analyzeError, setAnalyzeError] = useState(null);
  const [aiResponse, setAiResponse] = useState(null);
  const [resumeView, setResumeView] = useState('tailored');
  const [isEditingResume, setIsEditingResume] = useState(false);
  const [editedResume, setEditedResume] = useState('');
  const [aiOptimizationLevel, setAiOptimizationLevel] = useState('balanced');
  const [keyChanges, setKeyChanges] = useState([]);

  useEffect(() => {
    if (auth.currentUser) {
      fetchSavedResumes();
    }
  }, []);

  const fetchSavedResumes = async () => {
    try {
      const q = query(
        collection(db, 'documents'), 
        where('userId', '==', auth.currentUser.uid),
        where('type', '==', 'resume')
      );
      
      const querySnapshot = await getDocs(q);
      const resumes = [];
      
      querySnapshot.forEach((doc) => {
        resumes.push(doc.data());
      });
      
      setSavedResumes(resumes);
    } catch (error) {
      console.error('Error fetching saved resumes:', error);
    }
  };

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
      
      // If it's a text file, read contents
      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => {
          setResumeText(e.target.result);
        };
        reader.readAsText(file);
      }
    }
  };

  const handlePasteResumeText = () => {
    setShowResumeTextModal(true);
  };

  const handlePasteJobURL = () => {
    setShowJobUrlModal(true);
  };

  const handleEnterJobManually = () => {
    setShowJobDescriptionModal(true);
  };

  const handleResumeTextSubmit = (e) => {
    e.preventDefault();
    setShowResumeTextModal(false);
  };

  const handleJobDescriptionSubmit = (e) => {
    e.preventDefault();
    setShowJobDescriptionModal(false);
  };

  const handleJobUrlSubmit = async (e) => {
    e.preventDefault();
    setShowJobUrlModal(false);
    
    // In a real implementation, you would make an API call to scrape the job description
    // For this example, we'll just set a placeholder
    setJobDescription(`This is a placeholder for a job description scraped from: ${jobUrl}`);
  };

  const handleSavedResumeSelect = (resume) => {
    setSelectedSavedResume(resume);
    setResumeText(resume.resumeText || '');
    setShowSavedResumesModal(false);
  };

  const callAIService = async (resumeText, jobDescription) => {
    // In a production environment, this would be a call to an actual AI service
    // For example, OpenAI API or a custom backend service that processes the data
    
    setLoading(true);
    setAnalyzeError(null);
    
    try {
      // Simulating an API call
      // In a real implementation, you would use fetch or axios to call your AI service
      // Example:
      // const response = await fetch('https://your-api-endpoint.com/analyze', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ resumeText, jobDescription, optimizationLevel: aiOptimizationLevel })
      // });
      // const data = await response.json();
      
      // For this example, we'll simulate a response after a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock AI response
      const mockAiResponse = {
        skillsMatch: Math.floor(Math.random() * 31) + 55, // Random score between 55-85
        missingSkills: [
          'Project management',
          'Data analysis',
          'SQL',
          'Tableau',
          'Leadership'
        ],
        optimizationSuggestions: [
          {
            title: 'Add project management experience',
            description: 'Highlight your experience with Agile methodologies'
          },
          {
            title: 'Emphasize data analysis skills',
            description: 'Include specific tools like Tableau and SQL'
          },
          {
            title: 'Reorder work experience',
            description: 'Place most relevant experience first'
          }
        ],
        tailoredResume: generateTailoredResume(resumeText, jobDescription),
        keyChanges: [
          'Added relevant keywords from job description',
          'Highlighted project management skills',
          'Restructured experience section to prioritize relevant roles',
          'Removed irrelevant experience',
          'Formatted skills section to match job requirements'
        ]
      };
      
      // Set key changes for displaying what the AI modified
      setKeyChanges(mockAiResponse.keyChanges);
      
      return mockAiResponse;
    } catch (error) {
      console.error('Error calling AI service:', error);
      throw new Error('Failed to analyze resume with AI. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateTailoredResume = (resumeText, jobDescription) => {
    // In a real implementation, this would be part of the AI response
    // Here we're just returning a placeholder tailored resume
    
    // Extract keywords from job description for demonstration
    const keywords = jobDescription.toLowerCase().match(/\b(\w+)\b/g);
    const importantKeywords = keywords
      ? Array.from(new Set(keywords.filter(word => 
          word.length > 3 && 
          !['with', 'from', 'have', 'that', 'this', 'will', 'your'].includes(word)
        ))).slice(0, 5)
      : ['skills', 'experience', 'management', 'leadership', 'technical'];
    
    // Create a mocked tailored resume that mentions these keywords
    return `
JOHN DOE
jdoe@email.com | (555) 123-4567 | linkedin.com/in/johndoe

PROFESSIONAL SUMMARY
Results-driven professional with 5+ years of experience in ${importantKeywords[0] || 'project management'} and cross-functional team leadership. Proven track record in delivering complex ${importantKeywords[1] || 'projects'} on time and within budget while maintaining high quality standards.

SKILLS
- ${importantKeywords[0]?.charAt(0).toUpperCase() + importantKeywords[0]?.slice(1) || 'Project Management'}: Agile, Scrum, Kanban, JIRA
- Technical: ${importantKeywords[2] || 'SQL'}, ${importantKeywords[3] || 'Tableau'}, Excel, PowerPoint
- ${importantKeywords[4]?.charAt(0).toUpperCase() + importantKeywords[4]?.slice(1) || 'Leadership'}: Team building, stakeholder management, conflict resolution

EXPERIENCE
Senior ${importantKeywords[0]?.charAt(0).toUpperCase() + importantKeywords[0]?.slice(1) || 'Project'} Manager | ABC Company | Jan 2020 - Present
- Led cross-functional teams of 10+ members to deliver ${importantKeywords[1] || 'projects'} 15% ahead of schedule
- Implemented Agile methodologies resulting in 30% efficiency improvement
- Utilized ${importantKeywords[2] || 'data analysis'} techniques to identify and resolve bottlenecks

${importantKeywords[4]?.charAt(0).toUpperCase() + importantKeywords[4]?.slice(1) || 'Project'} Coordinator | XYZ Inc. | Mar 2018 - Dec 2019
- Assisted in managing project timelines and resource allocation
- Collaborated with stakeholders to define requirements
- Developed expertise in ${importantKeywords[3] || 'technical tools'} to improve team productivity

EDUCATION
MBA, Business Administration | State University | 2018
BS, Computer Science | Tech University | 2016
    `;
  };

  const analyzeResume = async () => {
    if (!auth.currentUser) return;
    
    if (!resumeText && !resumeFile && !selectedSavedResume) {
      setAnalyzeError('Please provide a resume by uploading a file, entering text, or selecting a saved resume.');
      return;
    }
    
    if (!jobDescription) {
      setAnalyzeError('Please provide a job description.');
      return;
    }
    
    setLoading(true);
    setAnalyzeError(null);
    
    try {
      // Get the resume text content - either from input, file, or saved resume
      const resumeContent = selectedSavedResume 
        ? selectedSavedResume.resumeText 
        : resumeText;
      
      // Call the AI service to analyze the resume against the job description
      const aiResult = await callAIService(resumeContent, jobDescription);
      
      // Update state with AI analysis results
      setSkillsMatch(aiResult.skillsMatch);
      setMissingSkills(aiResult.missingSkills);
      setOptimizationSuggestions(aiResult.optimizationSuggestions);
      setTailoredResume(aiResult.tailoredResume);
      setAiResponse(aiResult);
      
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
        type: 'resume',
        title: `Tailored Resume - ${new Date().toLocaleDateString()}`,
        jobDescription,
        resumeUrl,
        resumeText: resumeContent,
        tailoredResume: aiResult.tailoredResume,
        skillsMatch: aiResult.skillsMatch,
        missingSkills: aiResult.missingSkills,
        optimizationSuggestions: aiResult.optimizationSuggestions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      // Refresh saved resumes
      fetchSavedResumes();
      
    } catch (error) {
      console.error('Error analyzing resume:', error);
      setAnalyzeError(error.message || 'Failed to analyze resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResume = () => {
    if (!tailoredResume) return;
    setShowSaveTitleModal(true);
  };

  const handleSaveResumeSubmit = async (e) => {
    e.preventDefault();
    
    if (!auth.currentUser || !tailoredResume) return;
    setLoading(true);
    
    try {
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
        type: 'resume',
        title: resumeTitle || `Tailored Resume - ${new Date().toLocaleDateString()}`,
        jobDescription,
        resumeUrl,
        resumeText: tailoredResume,
        skillsMatch,
        missingSkills,
        optimizationSuggestions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      // Refresh saved resumes
      fetchSavedResumes();
      setShowSaveTitleModal(false);
      alert('Resume saved successfully!');
      
    } catch (error) {
      console.error('Error saving resume:', error);
      alert('Error saving resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleResumeView = () => {
    setResumeView(resumeView === 'tailored' ? 'original' : 'tailored');
  };

  const startEditingResume = () => {
    setEditedResume(tailoredResume);
    setIsEditingResume(true);
  };

  const saveEditedResume = () => {
    setTailoredResume(editedResume);
    setIsEditingResume(false);
  };

  const cancelEditingResume = () => {
    setIsEditingResume(false);
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
            <h2 className="text-xl font-bold">Resume</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Upload your current resume or enter it manually
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
              Enter Manually
            </button>
            {savedResumes.length > 0 && (
              <button 
                onClick={() => setShowSavedResumesModal(true)}
                className="w-full btn btn-outline text-left"
              >
                Use Saved Resume
              </button>
            )}
            {resumeFile && (
              <div className="text-sm text-gray-600 mt-2">
                File selected: {resumeFile.name}
              </div>
            )}
            {resumeText && !resumeFile && (
              <div className="text-sm text-gray-600 mt-2">
                Resume text entered manually
              </div>
            )}
            {selectedSavedResume && (
              <div className="text-sm text-gray-600 mt-2">
                Using saved resume: {selectedSavedResume.title}
              </div>
            )}
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
            {jobUrl && (
              <div className="text-sm text-gray-600 mt-2">
                URL: {jobUrl}
              </div>
            )}
            {jobDescription && (
              <div className="text-sm text-gray-600 mt-2">
                Job description entered
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-bold mb-4">AI Optimization Settings</h2>
        <p className="text-gray-600 mb-4">
          Choose how aggressively the AI should optimize your resume for this job
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div 
            className={`border rounded-md p-4 cursor-pointer hover:border-primary transition-colors duration-200 ${aiOptimizationLevel === 'conservative' ? 'border-primary bg-primary bg-opacity-5' : 'border-gray-300'}`}
            onClick={() => setAiOptimizationLevel('conservative')}
          >
            <div className="flex items-center mb-2">
              <div className={`w-4 h-4 rounded-full mr-2 ${aiOptimizationLevel === 'conservative' ? 'bg-primary' : 'bg-gray-300'}`}></div>
              <h3 className="font-medium">Conservative</h3>
            </div>
            <p className="text-sm text-gray-600">
              Makes minimal changes to maintain most of your original resume
            </p>
          </div>
          
          <div 
            className={`border rounded-md p-4 cursor-pointer hover:border-primary transition-colors duration-200 ${aiOptimizationLevel === 'balanced' ? 'border-primary bg-primary bg-opacity-5' : 'border-gray-300'}`}
            onClick={() => setAiOptimizationLevel('balanced')}
          >
            <div className="flex items-center mb-2">
              <div className={`w-4 h-4 rounded-full mr-2 ${aiOptimizationLevel === 'balanced' ? 'bg-primary' : 'bg-gray-300'}`}></div>
              <h3 className="font-medium">Balanced</h3>
            </div>
            <p className="text-sm text-gray-600">
              Balanced approach that optimizes your resume while preserving your style
            </p>
          </div>
          
          <div 
            className={`border rounded-md p-4 cursor-pointer hover:border-primary transition-colors duration-200 ${aiOptimizationLevel === 'aggressive' ? 'border-primary bg-primary bg-opacity-5' : 'border-gray-300'}`}
            onClick={() => setAiOptimizationLevel('aggressive')}
          >
            <div className="flex items-center mb-2">
              <div className={`w-4 h-4 rounded-full mr-2 ${aiOptimizationLevel === 'aggressive' ? 'bg-primary' : 'bg-gray-300'}`}></div>
              <h3 className="font-medium">Aggressive</h3>
            </div>
            <p className="text-sm text-gray-600">
              Maximizes optimization for this specific job, may significantly alter content
            </p>
          </div>
        </div>
      </div>

      <div className="text-center mb-8">
        <button 
          onClick={analyzeResume}
          className="btn btn-primary px-8"
          disabled={loading || (!resumeFile && !resumeText && !selectedSavedResume) || !jobDescription}
        >
          {loading ? 'Analyzing...' : 'Analyze Resume'}
        </button>
        
        {analyzeError && (
          <div className="mt-4 text-red-500">
            {analyzeError}
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm rounded-md text-white bg-primary">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Analyzing resume with AI - this may take a moment...
          </div>
          <p className="text-gray-500 mt-2">
            We're comparing your resume to the job description and generating tailored content.
          </p>
        </div>
      )}

      {/* Resume Text Modal */}
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

      {/* Job Description Modal */}
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

      {/* Job URL Modal */}
      {showJobUrlModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
            <h2 className="text-2xl font-bold mb-4">Paste Job URL</h2>
            <form onSubmit={handleJobUrlSubmit}>
              <input
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-4 mb-4"
                placeholder="https://example.com/job-posting"
                required
              />
              <p className="text-gray-600 mb-4">
                We'll extract the job description from this URL
              </p>
              <div className="flex justify-end gap-4">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowJobUrlModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  Extract Job Description
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Saved Resumes Modal */}
      {showSavedResumesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Saved Resumes</h2>
            {savedResumes.length === 0 ? (
              <p className="text-gray-600">No saved resumes found</p>
            ) : (
              <div className="divide-y">
                {savedResumes.map((resume) => (
                  <div 
                    key={resume.id} 
                    className="py-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleSavedResumeSelect(resume)}
                  >
                    <h3 className="font-medium">{resume.title}</h3>
                    <p className="text-gray-600 text-sm">
                      Created on: {new Date(resume.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-4">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowSavedResumesModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {tailoredResume && (
        <>
          <div className="bg-primary bg-opacity-10 border border-primary p-6 rounded-lg mb-8">
            <div className="flex items-start">
              <div className="mr-4 bg-primary rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">AI-Powered Resume Analysis</h2>
                <p className="text-gray-700 mb-4">
                  Our AI has analyzed your resume against the job description and created a tailored version that highlights relevant skills and experience.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <div className="flex items-center text-primary mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Skills Match</span>
                    </div>
                    <p className="text-sm">{skillsMatch}% match with job requirements</p>
                  </div>
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <div className="flex items-center text-primary mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Missing Skills</span>
                    </div>
                    <p className="text-sm">{missingSkills.length} skills identified</p>
                  </div>
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <div className="flex items-center text-primary mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                      <span className="font-medium">Optimization</span>
                    </div>
                    <p className="text-sm">{optimizationSuggestions.length} suggestions provided</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${
                  skillsMatch >= 80 ? 'bg-green-100 text-green-600' : 
                  skillsMatch >= 60 ? 'bg-yellow-100 text-yellow-600' : 
                  'bg-red-100 text-red-600'
                } text-2xl font-bold`}>
                  {skillsMatch}%
                </div>
              </div>
              <p className="text-gray-600 text-center">
                Your resume matches {skillsMatch}% of required skills
              </p>
              <button className="w-full mt-4 text-primary font-medium">
                View Details
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <span className="text-green-500 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </span>
                <h2 className="text-xl font-bold">AI Changes</h2>
              </div>
              <p className="text-gray-600 mb-4">
                The AI made the following changes to optimize your resume:
              </p>
              <ul className="space-y-2">
                {keyChanges.map((change, index) => (
                  <li key={index} className="flex items-center text-gray-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    {change}
                  </li>
                ))}
              </ul>
              <div className="mt-4 text-right">
                <span className="text-xs text-gray-500">
                  Optimization level: <span className="font-medium capitalize">{aiOptimizationLevel}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <span className="text-red-500 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </span>
                <h2 className="text-xl font-bold">Missing Skills</h2>
              </div>
              <button className="text-primary text-sm font-medium">
                Add to Resume
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              The following skills were mentioned in the job description but not found in your resume:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
              {missingSkills.map((skill, index) => (
                <div key={index} className="flex items-center bg-red-50 rounded-md p-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  <span className="text-gray-700">{skill}</span>
                </div>
              ))}
            </div>
            <p className="text-gray-500 text-sm">
              Consider adding these skills to your resume if you have relevant experience.
            </p>
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
                  <button className="ml-auto text-gray-400 hover:text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{resumeView === 'tailored' ? 'AI-Tailored Resume Preview' : 'Original Resume'}</h2>
              <div className="flex items-center">
                <button 
                  onClick={toggleResumeView}
                  className="text-primary font-medium flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  {resumeView === 'tailored' ? 'View Original' : 'View Tailored'}
                </button>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              {resumeView === 'tailored' 
                ? (isEditingResume 
                  ? "Edit your tailored resume to make additional changes" 
                  : "Review and edit your AI-optimized resume")
                : "This is your original resume before AI optimization"
              }
            </p>
            {isEditingResume ? (
              <div>
                <textarea
                  value={editedResume}
                  onChange={(e) => setEditedResume(e.target.value)}
                  className="border border-gray-300 rounded-md p-4 font-mono text-sm whitespace-pre-line h-96 w-full mb-4"
                ></textarea>
                <div className="flex justify-end space-x-4">
                  <button 
                    className="btn btn-secondary"
                    onClick={cancelEditingResume}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={saveEditedResume}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="border border-gray-300 rounded-md p-4 font-mono text-sm whitespace-pre-line h-96 overflow-y-auto">
                  {resumeView === 'tailored' ? tailoredResume : resumeText}
                </div>
                <div className="flex justify-between mt-4">
                  {resumeView === 'tailored' && (
                    <button 
                      className="btn btn-outline"
                      onClick={startEditingResume}
                    >
                      Edit Manually
                    </button>
                  )}
                  <div className="flex space-x-4 ml-auto">
                    <button className="btn btn-secondary">
                      Download as PDF
                    </button>
                    <button className="btn btn-secondary">
                      Copy to Clipboard
                    </button>
                    <button 
                      className="btn btn-primary"
                      onClick={handleSaveResume}
                    >
                      Save to Account
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Save Resume Title Modal */}
      {showSaveTitleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Save Resume</h2>
            <form onSubmit={handleSaveResumeSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Resume Title
                </label>
                <input
                  type="text"
                  value={resumeTitle}
                  onChange={(e) => setResumeTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-4"
                  placeholder="Enter a title for your resume"
                />
              </div>
              <div className="flex justify-end gap-4">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowSaveTitleModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Resume'}
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