import React, { useState, useEffect } from 'react';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

const CoverLetterGenerator = () => {
  const [activeTab, setActiveTab] = useState('generator');
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [positionTitle, setPositionTitle] = useState('');
  const [keySkills, setKeySkills] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState('');
  
  // New state variables
  const [savedCoverLetters, setSavedCoverLetters] = useState([]);
  const [showResumeTextModal, setShowResumeTextModal] = useState(false);
  const [showJobDescriptionModal, setShowJobDescriptionModal] = useState(false);
  const [showJobUrlModal, setShowJobUrlModal] = useState(false);
  const [selectedSavedCoverLetter, setSelectedSavedCoverLetter] = useState(null);
  const [showSavedCoverLettersModal, setShowSavedCoverLettersModal] = useState(false);
  const [coverLetterTitle, setCoverLetterTitle] = useState('');
  const [showSaveTitleModal, setShowSaveTitleModal] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [aiResponse, setAiResponse] = useState(null);
  const [isEditingCoverLetter, setIsEditingCoverLetter] = useState(false);
  const [editedCoverLetter, setEditedCoverLetter] = useState('');
  const [aiToneStyle, setAiToneStyle] = useState('professional');
  const [aiCoverLetter, setAiCoverLetter] = useState(null);

  useEffect(() => {
    if (auth.currentUser) {
      fetchSavedCoverLetters();
    }
  }, []);

  const fetchSavedCoverLetters = async () => {
    try {
      const q = query(
        collection(db, 'documents'), 
        where('userId', '==', auth.currentUser.uid),
        where('type', '==', 'cover-letter')
      );
      
      const querySnapshot = await getDocs(q);
      const coverLetters = [];
      
      querySnapshot.forEach((doc) => {
        coverLetters.push(doc.data());
      });
      
      setSavedCoverLetters(coverLetters);
    } catch (error) {
      console.error('Error fetching saved cover letters:', error);
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
    
    // Try to extract company name and position from the URL or description
    if (jobUrl.includes('linkedin.com')) {
      const urlParts = jobUrl.split('/');
      // This is a simplified example
      const companyIndex = urlParts.indexOf('company');
      if (companyIndex !== -1 && companyIndex + 1 < urlParts.length) {
        setCompanyName(urlParts[companyIndex + 1].replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase()));
      }
    }
  };

  const handleSavedCoverLetterSelect = (coverLetter) => {
    setSelectedSavedCoverLetter(coverLetter);
    setGeneratedCoverLetter(coverLetter.coverLetter || '');
    setCompanyName(coverLetter.companyName || '');
    setPositionTitle(coverLetter.positionTitle || '');
    setKeySkills(coverLetter.keySkills || '');
    setJobDescription(coverLetter.jobDescription || '');
    setShowSavedCoverLettersModal(false);
  };

  const handleSaveCoverLetter = () => {
    if (!generatedCoverLetter) return;
    setCoverLetterTitle(`Cover Letter - ${companyName} (${positionTitle})`);
    setShowSaveTitleModal(true);
  };

  const handleSaveCoverLetterSubmit = async (e) => {
    e.preventDefault();
    
    if (!auth.currentUser || !generatedCoverLetter) return;
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
        type: 'cover-letter',
        title: coverLetterTitle || `Cover Letter - ${companyName} (${positionTitle})`,
        companyName,
        positionTitle,
        keySkills,
        jobDescription,
        resumeUrl,
        resumeText,
        coverLetter: generatedCoverLetter,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tone: aiToneStyle
      });
      
      // Refresh saved cover letters
      fetchSavedCoverLetters();
      setShowSaveTitleModal(false);
      alert('Cover letter saved successfully!');
      
    } catch (error) {
      console.error('Error saving cover letter:', error);
      alert('Error saving cover letter. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startEditingCoverLetter = () => {
    setEditedCoverLetter(generatedCoverLetter);
    setIsEditingCoverLetter(true);
  };

  const saveEditedCoverLetter = () => {
    setGeneratedCoverLetter(editedCoverLetter);
    setIsEditingCoverLetter(false);
  };

  const cancelEditingCoverLetter = () => {
    setIsEditingCoverLetter(false);
  };

  const callAIService = async (resumeText, jobDescription, companyName, positionTitle, keySkills, tone) => {
    // In a production environment, this would be a call to an actual AI service
    // For example, OpenAI API or a custom backend service that processes the data
    
    setLoading(true);
    setGenerateError(null);
    
    try {
      // Simulating an API call
      // In a real implementation, you would use fetch or axios to call your AI service
      // Example:
      // const response = await fetch('https://your-ai-endpoint.com/generate-cover-letter', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ 
      //     resumeText, 
      //     jobDescription, 
      //     companyName,
      //     positionTitle,
      //     keySkills,
      //     tone
      //   })
      // });
      // const data = await response.json();
      
      // For this example, we'll simulate a response after a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a more realistic cover letter based on inputs
      const coverLetterText = generateCoverLetterText(resumeText, jobDescription, companyName, positionTitle, keySkills, tone);
      
      // Mock AI response
      const mockAiResponse = {
        coverLetter: coverLetterText,
        keyPoints: [
          'Addressed specific requirements from job description',
          'Highlighted relevant skills and experience',
          'Customized to company culture and values',
          'Used professional and persuasive language',
          'Included a clear call to action'
        ],
        matchScore: Math.floor(Math.random() * 16) + 85, // Random score between 85-100
        improvedAreas: [
          'Added specific achievements with measurable results',
          'Highlighted relevant skills mentioned in job posting',
          'Strengthened opening paragraph to grab attention',
          'Personalized content to show interest in company'
        ]
      };
      
      return mockAiResponse;
    } catch (error) {
      console.error('Error calling AI service:', error);
      throw new Error('Failed to generate cover letter with AI. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateCoverLetterText = (resumeText, jobDescription, companyName, positionTitle, keySkills, tone) => {
    // In a real implementation, this would be part of the AI response
    // Here we're creating a more sophisticated placeholder using the inputs
    
    let opening, body, closing;
    const skillsArray = keySkills.split(',').map(skill => skill.trim());
    const company = companyName || '[Company Name]';
    const position = positionTitle || '[Position Title]';
    
    // Different tones for the cover letter
    switch(tone) {
      case 'enthusiastic':
        opening = `Dear Hiring Manager,

I am thrilled to apply for the ${position} position at ${company}! With my background in ${skillsArray[0] || 'relevant skills'} and passion for ${skillsArray[1] || 'this field'}, I'm excited about the opportunity to contribute to your innovative team.`;
        
        body = `After reviewing the job description, I'm confident that my experience aligns perfectly with your needs. In my previous role, I successfully implemented ${skillsArray[0] || 'relevant projects'} that resulted in significant improvements in team productivity and business outcomes.

My expertise in ${skillsArray.slice(0, 3).join(', ') || 'various areas'} has prepared me to excel in this role. I'm particularly drawn to ${company}'s commitment to ${jobDescription.includes('innovation') ? 'innovation' : 'excellence'} and am excited to bring my unique perspective to your team.`;
        
        closing = `I would love the opportunity to discuss how my background, enthusiasm, and skills would benefit ${company}. Thank you for considering my application, and I look forward to the possibility of working together!

Eagerly,
[Your Name]`;
        break;
        
      case 'creative':
        opening = `Dear ${company} Team,

When I discovered the ${position} opening at ${company}, I knew it was the perfect opportunity to blend my experience in ${skillsArray[0] || 'relevant skills'} with my passion for creative problem-solving in ${skillsArray[1] || 'this industry'}.`;
        
        body = `My journey has taken me through various challenges that have sharpened my abilities in ${skillsArray.join(', ') || 'multiple areas'}. One project I'm particularly proud of involved developing a unique approach to ${jobDescription.includes('customer') ? 'customer engagement' : 'problem solving'} that resulted in unexpected positive outcomes.

What draws me to ${company} is your distinctive approach to ${jobDescription.includes('innovation') ? 'innovation' : 'your industry'}. I'm excited about the possibility of bringing my creative thinking and ${skillsArray[0] || 'key skills'} to contribute to your vision.`;
        
        closing = `I'd be delighted to share more about how my unconventional perspective and targeted expertise could add a fresh dimension to your team. Thank you for considering my application.

Imaginatively yours,
[Your Name]`;
        break;
        
      case 'professional':
      default:
        opening = `Dear Hiring Manager,

I am writing to express my interest in the ${position} position at ${company}, as advertised. With a strong background in ${skillsArray[0] || 'relevant skills'} and experience in ${skillsArray[1] || 'related areas'}, I am confident in my ability to make a valuable contribution to your organization.`;
        
        body = `My professional experience has equipped me with the skills necessary to excel in this role. Throughout my career, I have demonstrated expertise in ${skillsArray.join(', ') || 'various areas'} and have consistently delivered results.

In my previous position, I successfully ${jobDescription.includes('team') ? 'led teams and projects' : 'managed key responsibilities'} that directly relate to the qualifications outlined in your job description. I am particularly attracted to ${company}'s reputation for ${jobDescription.includes('innovation') ? 'innovation' : 'excellence'} and am eager to bring my skills to your team.`;
        
        closing = `I welcome the opportunity to discuss how my qualifications align with your needs for this position. Thank you for your consideration, and I look forward to the possibility of working with ${company}.

Sincerely,
[Your Name]`;
        break;
    }
    
    return `${opening}

${body}

${closing}`;
  };

  const generateCoverLetter = async () => {
    if (!auth.currentUser) return;
    
    if (!resumeText && !resumeFile && !selectedSavedCoverLetter) {
      setGenerateError('Please provide a resume by uploading a file, entering text, or selecting a saved resume.');
      return;
    }
    
    if (!jobDescription) {
      setGenerateError('Please provide a job description.');
      return;
    }
    
    if (!companyName || !positionTitle) {
      setGenerateError('Please provide the company name and position title.');
      return;
    }
    
    setLoading(true);
    setGenerateError(null);
    
    try {
      // Get the resume text content
      const resumeContent = resumeText;
      
      // Call the AI service to generate cover letter
      const aiResult = await callAIService(
        resumeContent, 
        jobDescription, 
        companyName, 
        positionTitle, 
        keySkills,
        aiToneStyle
      );
      
      // Update state with AI generation results
      setGeneratedCoverLetter(aiResult.coverLetter);
      setAiResponse(aiResult);
      setAiCoverLetter(aiResult);
      
      // Save to Firestore automatically
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
        resumeText: resumeContent,
        coverLetter: aiResult.coverLetter,
        aiResponse: aiResult,
        tone: aiToneStyle,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      // Refresh saved cover letters
      fetchSavedCoverLetters();
      
    } catch (error) {
      console.error('Error generating cover letter:', error);
      setGenerateError(error.message || 'Failed to generate cover letter. Please try again.');
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
            <h2 className="text-xl font-bold">Resume</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Upload your resume or enter it manually
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
            {savedCoverLetters.length > 0 && (
              <button 
                onClick={() => setShowSavedCoverLettersModal(true)}
                className="w-full btn btn-outline text-left"
              >
                Use Saved Cover Letter
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
            {selectedSavedCoverLetter && (
              <div className="text-sm text-gray-600 mt-2">
                Using saved cover letter: {selectedSavedCoverLetter.title}
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
            Paste the job description to personalize your cover letter
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
        <h2 className="text-xl font-bold mb-4">Job Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="companyName">
              Company Name
            </label>
            <input
              id="companyName"
              type="text"
              className="form-input w-full p-2 border border-gray-300 rounded-md"
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
              className="form-input w-full p-2 border border-gray-300 rounded-md"
              placeholder="Enter job position"
              value={positionTitle}
              onChange={(e) => setPositionTitle(e.target.value)}
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="keySkills">
            Key Skills (separate with commas)
          </label>
          <input
            id="keySkills"
            type="text"
            className="form-input w-full p-2 border border-gray-300 rounded-md"
            placeholder="Project management, communication, leadership"
            value={keySkills}
            onChange={(e) => setKeySkills(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-bold mb-4">AI Writing Style</h2>
        <p className="text-gray-600 mb-4">
          Choose the tone and style for your AI-generated cover letter
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            className={`border rounded-md p-4 cursor-pointer hover:border-primary transition-colors duration-200 ${aiToneStyle === 'professional' ? 'border-primary bg-primary bg-opacity-5' : 'border-gray-300'}`}
            onClick={() => setAiToneStyle('professional')}
          >
            <div className="flex items-center mb-2">
              <div className={`w-4 h-4 rounded-full mr-2 ${aiToneStyle === 'professional' ? 'bg-primary' : 'bg-gray-300'}`}></div>
              <h3 className="font-medium">Professional</h3>
            </div>
            <p className="text-sm text-gray-600">
              Formal and traditional approach suitable for most industries
            </p>
          </div>
          
          <div 
            className={`border rounded-md p-4 cursor-pointer hover:border-primary transition-colors duration-200 ${aiToneStyle === 'enthusiastic' ? 'border-primary bg-primary bg-opacity-5' : 'border-gray-300'}`}
            onClick={() => setAiToneStyle('enthusiastic')}
          >
            <div className="flex items-center mb-2">
              <div className={`w-4 h-4 rounded-full mr-2 ${aiToneStyle === 'enthusiastic' ? 'bg-primary' : 'bg-gray-300'}`}></div>
              <h3 className="font-medium">Enthusiastic</h3>
            </div>
            <p className="text-sm text-gray-600">
              Energetic and passionate tone showing strong interest in the role
            </p>
          </div>
          
          <div 
            className={`border rounded-md p-4 cursor-pointer hover:border-primary transition-colors duration-200 ${aiToneStyle === 'creative' ? 'border-primary bg-primary bg-opacity-5' : 'border-gray-300'}`}
            onClick={() => setAiToneStyle('creative')}
          >
            <div className="flex items-center mb-2">
              <div className={`w-4 h-4 rounded-full mr-2 ${aiToneStyle === 'creative' ? 'bg-primary' : 'bg-gray-300'}`}></div>
              <h3 className="font-medium">Creative</h3>
            </div>
            <p className="text-sm text-gray-600">
              Distinctive and original style for creative fields and startups
            </p>
          </div>
        </div>
      </div>

      <div className="text-center mb-8">
        <button 
          onClick={generateCoverLetter}
          className="btn btn-primary px-8"
          disabled={loading || !jobDescription || !companyName || !positionTitle}
        >
          {loading ? 'Generating...' : 'Generate Cover Letter'}
        </button>
        
        {generateError && (
          <div className="mt-4 text-red-500">
            {generateError}
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
            Generating cover letter with AI - this may take a moment...
          </div>
          <p className="text-gray-500 mt-2">
            We're analyzing your resume and the job description to create a personalized cover letter.
          </p>
        </div>
      )}

      {generatedCoverLetter && (
        <>
          <div className="bg-primary bg-opacity-10 border border-primary p-6 rounded-lg mb-8">
            <div className="flex items-start">
              <div className="mr-4 bg-primary rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">AI-Generated Cover Letter</h2>
                <p className="text-gray-700 mb-4">
                  Our AI has analyzed your resume and the job description to create a personalized cover letter.
                </p>
                {aiResponse && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-3 rounded-md shadow-sm">
                      <div className="flex items-center text-primary mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Match Score</span>
                      </div>
                      <p className="text-sm">{aiResponse.matchScore}% match with job requirements</p>
                    </div>
                    <div className="bg-white p-3 rounded-md shadow-sm">
                      <div className="flex items-center text-primary mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Writing Style</span>
                      </div>
                      <p className="text-sm capitalize">{aiToneStyle}</p>
                    </div>
                    <div className="bg-white p-3 rounded-md shadow-sm">
                      <div className="flex items-center text-primary mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                        <span className="font-medium">Key Points</span>
                      </div>
                      <p className="text-sm">{aiResponse.keyPoints.length} points highlighted</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {aiResponse && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h2 className="text-xl font-bold mb-4">Key Improvements</h2>
              <p className="text-gray-600 mb-4">
                The AI made the following improvements to your cover letter:
              </p>
              <div className="space-y-3">
                {aiResponse.improvedAreas.map((improvement, index) => (
                  <div key={index} className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-gray-700">{improvement}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Your Cover Letter</h2>
              <div className="flex items-center">
                <span className="text-xs text-gray-500 mr-2 italic">
                  Style: <span className="font-medium capitalize">{aiToneStyle}</span>
                </span>
                {!isEditingCoverLetter && (
                  <button 
                    onClick={startEditingCoverLetter}
                    className="text-primary font-medium text-sm flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit
                  </button>
                )}
              </div>
            </div>
          <p className="text-gray-600 mb-4">
              {isEditingCoverLetter 
                ? "Edit your cover letter to make additional changes" 
                : "Review and personalize your AI-generated cover letter"}
          </p>
            
            {isEditingCoverLetter ? (
              <div>
          <textarea
            className="w-full h-64 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={editedCoverLetter}
                  onChange={(e) => setEditedCoverLetter(e.target.value)}
          ></textarea>
                <div className="flex justify-end space-x-4 mt-4">
                  <button 
                    className="btn btn-secondary"
                    onClick={cancelEditingCoverLetter}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={saveEditedCoverLetter}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="border border-gray-300 rounded-md p-4 whitespace-pre-line h-64 overflow-y-auto">
                  {generatedCoverLetter}
                </div>
          <div className="flex justify-end space-x-4 mt-4">
            <button className="btn btn-secondary">
              Download as PDF
            </button>
                  <button className="btn btn-secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCoverLetter);
                      alert('Copied to clipboard!');
                    }}
                  >
              Copy to Clipboard
            </button>
                  <button 
                    className="btn btn-primary"
                    onClick={handleSaveCoverLetter}
                  >
              Save to Account
            </button>
                </div>
              </>
            )}
          </div>
        </>
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

      {/* Saved Cover Letters Modal */}
      {showSavedCoverLettersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Saved Cover Letters</h2>
            {savedCoverLetters.length === 0 ? (
              <p className="text-gray-600">No saved cover letters found</p>
            ) : (
              <div className="divide-y">
                {savedCoverLetters.map((coverLetter) => (
                  <div 
                    key={coverLetter.id} 
                    className="py-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleSavedCoverLetterSelect(coverLetter)}
                  >
                    <h3 className="font-medium">{coverLetter.title}</h3>
                    <div className="text-gray-600 text-sm flex items-center justify-between">
                      <span>
                        Created on: {new Date(coverLetter.createdAt).toLocaleDateString()}
                      </span>
                      {coverLetter.tone && (
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs capitalize">
                          {coverLetter.tone}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-4">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowSavedCoverLettersModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Cover Letter Title Modal */}
      {showSaveTitleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Save Cover Letter</h2>
            <form onSubmit={handleSaveCoverLetterSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Cover Letter Title
                </label>
                <input
                  type="text"
                  value={coverLetterTitle}
                  onChange={(e) => setCoverLetterTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-4"
                  placeholder="Enter a title for your cover letter"
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
                  {loading ? 'Saving...' : 'Save Cover Letter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoverLetterGenerator; 