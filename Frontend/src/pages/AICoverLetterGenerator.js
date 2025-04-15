import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { generateCoverLetter, analyzeJobDescription } from '../firebase/aiService';

const AICoverLetterGenerator = () => {
  const navigate = useNavigate();
  const [jobDescription, setJobDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [positionTitle, setPositionTitle] = useState('');
  const [keyPoints, setKeyPoints] = useState('');
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [tone, setTone] = useState('professional');
  const [jobAnalysis, setJobAnalysis] = useState(null);
  const [showJobAnalysis, setShowJobAnalysis] = useState(false);
  const [showCoverLetterPreview, setShowCoverLetterPreview] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);

  // Load user profile data when component mounts
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!auth.currentUser) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Format profile data for the AI service
          const formattedProfile = {
            personal: {
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              email: userData.email || auth.currentUser.email || '',
              phone: userData.phone || '',
              location: userData.location || '',
              profession: userData.profession || '',
            },
            education: userData.applicationProfile?.education || [],
            experience: userData.applicationProfile?.experience || [],
            skills: userData.skills || [],
          };
          
          setProfileData(formattedProfile);
        } else {
          setError('Profile data not found. Please complete your profile first.');
          setTimeout(() => {
            navigate('/profile');
          }, 3000);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleToneChange = (e) => {
    setTone(e.target.value);
  };

  const analyzeJob = async () => {
    if (!jobDescription) {
      setError('Please enter a job description.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const analysis = await analyzeJobDescription(jobDescription);
      setJobAnalysis(analysis);
      setShowJobAnalysis(true);
      
      // Try to extract company name and position title from job description
      if (!companyName && analysis.companyName) {
        setCompanyName(analysis.companyName);
      }
      
      if (!positionTitle && analysis.positionTitle) {
        setPositionTitle(analysis.positionTitle);
      }
      
      // Generate AI suggestions based on job analysis and user profile
      generateAiSuggestions(analysis);
    } catch (err) {
      console.error('Error analyzing job description:', err);
      setError('Failed to analyze job description.');
    } finally {
      setLoading(false);
    }
  };

  const generateAiSuggestions = (analysis) => {
    if (!analysis || !profileData) return;
    
    const suggestions = [];
    
    // Required skills gap analysis
    if (analysis.requiredSkills) {
      const userSkills = new Set(profileData.skills.map(s => s.toLowerCase()));
      const missingSkills = analysis.requiredSkills.filter(
        skill => !Array.from(userSkills).some(userSkill => 
          userSkill.includes(skill.toLowerCase())
        )
      );
      
      if (missingSkills.length > 0) {
        suggestions.push({
          type: 'warning',
          title: 'Missing Required Skills',
          content: `For your cover letter, address these required skills you're missing: ${missingSkills.join(', ')}. Explain how you're developing these skills or how your transferable skills apply.`
        });
      }
    }
    
    // Experience level check
    if (analysis.experienceLevel && profileData.experience.length > 0) {
      let totalYearsExperience = 0;
      
      profileData.experience.forEach(exp => {
        const startYear = new Date(exp.startDate).getFullYear();
        const endYear = exp.currentlyWorking 
          ? new Date().getFullYear() 
          : new Date(exp.endDate).getFullYear();
        
        totalYearsExperience += endYear - startYear;
      });
      
      const requiredYears = parseInt(analysis.experienceLevel.match(/\d+/)?.[0] || '0');
      
      if (requiredYears > totalYearsExperience) {
        suggestions.push({
          type: 'tip',
          title: 'Address Experience Gap',
          content: `In your cover letter, focus on quality of experience rather than quantity. Highlight transferable skills and quick learning ability.`
        });
      }
    }
    
    // Add positive suggestions
    suggestions.push({
      type: 'tip',
      title: 'Company Values Alignment',
      content: `Emphasize your alignment with these company values in your cover letter: ${analysis.companyValues?.slice(0, 3).join(', ') || 'innovation, excellence, collaboration'}`
    });
    
    setAiSuggestions(suggestions);
  };

  const handleGenerateCoverLetter = async () => {
    if (!jobDescription) {
      setError('Please enter a job description.');
      return;
    }

    if (!companyName) {
      setError('Please enter the company name.');
      return;
    }

    if (!positionTitle) {
      setError('Please enter the position title.');
      return;
    }

    if (!profileData) {
      setError('Profile data not available. Please complete your profile.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const keyPointsArray = keyPoints
        .split('\n')
        .map(point => point.trim())
        .filter(point => point.length > 0);
      
      console.log('Calling AI cover letter generation');
      
      // Extract relevant information from profile
      const { 
        personal = {}, 
        experience = [], 
        skills = [], 
      } = profileData;
      
      // Build the prompt for OpenAI
      let prompt = `Generate a tailored cover letter for the following individual applying for a ${positionTitle} position at ${companyName}:\n\n`;
      prompt += `JOB DESCRIPTION:\n${jobDescription}\n\n`;
      
      prompt += `PERSONAL INFORMATION:\n`;
      prompt += `Name: ${personal.firstName} ${personal.lastName}\n`;
      prompt += `Email: ${personal.email}\n`;
      prompt += `Phone: ${personal.phone}\n`;
      prompt += `Location: ${personal.location}\n`;
      prompt += `Profession: ${personal.profession}\n\n`;
      
      prompt += `RELEVANT EXPERIENCE:\n`;
      experience.slice(0, 3).forEach(exp => {
        prompt += `- ${exp.position} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})\n`;
        prompt += `  ${exp.description}\n`;
      });
      prompt += `\n`;
      
      prompt += `KEY SKILLS:\n${skills.join(', ')}\n\n`;
      
      if (keyPointsArray.length > 0) {
        prompt += `KEY POINTS TO EMPHASIZE:\n`;
        keyPointsArray.forEach(point => {
          prompt += `- ${point}\n`;
        });
        prompt += `\n`;
      }
      
      prompt += `Please generate a ${tone} cover letter that:\n`;
      prompt += `- Is COMPLETE and READY-TO-USE with NO PLACEHOLDERS\n`;
      prompt += `- Uses the proper business letter format with date and contact information\n`;
      prompt += `- Is addressed to the hiring manager at ${companyName}\n`;
      prompt += `- Begins with a compelling introduction that mentions the specific position\n`;
      prompt += `- Uses ONLY the actual details provided - no placeholders like "[specific example]"\n`;
      prompt += `- Highlights relevant experience and skills that directly match the ${positionTitle} position\n`;
      prompt += `- Uses specific examples from the person's experience\n`;
      prompt += `- Demonstrates enthusiasm for the role and company\n`;
      prompt += `- Addresses any potential gaps in experience with transferable skills\n`;
      prompt += `- Includes a strong closing paragraph with a clear call to action\n`;
      prompt += `- Is written in a ${tone} tone\n`;
      prompt += `- Is well-structured, concise, and free of clichés\n`;
      
      // Handle possible test data
      prompt += `\nIMPORTANT: If any information appears to be test data (like "Test" or placeholder text), please create appropriate professional content that would make sense for a real cover letter. For example, if the job title is "Test at Test", create a relevant job title and company that would match the target position.\n`;
      
      // Call OpenAI API directly here, bypassing the service that's trying to save to Firestore/Storage
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
      
      if (!apiKey) {
        setError('OpenAI API key is missing. Please check your environment variables.');
        setLoading(false);
        return;
      }
      
      const requestBody = {
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: 'You are a professional cover letter writer with expertise in creating compelling, tailored cover letters. Create a COMPLETE, READY-TO-USE cover letter with NO PLACEHOLDERS. Use the actual name and contact details provided. Do NOT include template language like "[Insert Company Name]" or "specific example". Format as a proper business letter with date, addresses, salutation, body paragraphs, closing, and signature. The letter should be highly personalized, mentioning specific experiences and skills from the person\'s background that directly relate to the job requirements. Make appropriate professional extrapolations when needed, but don\'t fabricate major achievements. Maintain a proper business letter format throughout.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1500,
        temperature: 0.5, // Lower temperature for more focused output
      };
      
      console.log('Calling OpenAI API directly');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        setError(`OpenAI API error: ${response.status}. Please try again.`);
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
        console.error('Unexpected OpenAI response format:', data);
        setError('The AI model did not return a valid response. Please try again.');
        setLoading(false);
        return;
      }
      
      const coverLetterContent = data.choices[0].message.content.trim();
      console.log('Cover letter content received, length:', coverLetterContent.length);
      
      // Immediately display the content to the user
      setGeneratedCoverLetter(coverLetterContent);
      setShowCoverLetterPreview(true);
      
      // Optional: Save to Firestore in the background without blocking the UI
      try {
        console.log('Attempting to save to Firestore in the background');
        generateCoverLetter(
          auth.currentUser.uid,
          profileData,
          jobDescription,
          {
            tone,
            companyName,
            positionTitle,
            keyPoints: keyPointsArray
          }
        ).then(result => {
          console.log('Background save to Firestore completed:', result);
        }).catch(err => {
          console.error('Background save to Firestore failed:', err);
        });
      } catch (saveError) {
        console.error('Error setting up background save:', saveError);
      }
    } catch (err) {
      console.error('Exception in handleGenerateCoverLetter:', err);
      setError(`An unexpected error occurred: ${err.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCoverLetter = () => {
    if (!generatedCoverLetter) return;
    
    // Create a Blob and generate a download link directly in the browser
    const element = document.createElement('a');
    const file = new Blob([generatedCoverLetter], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `AI_CoverLetter_${companyName}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">AI Cover Letter Generator</h1>
      <p className="text-gray-600 mb-8">
        Generate personalized cover letters using AI based on job descriptions and your profile
      </p>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!profileData && loading ? (
        <div className="text-center py-8">
          <div className="spinner"></div>
          <p className="mt-2">Loading your profile data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Job Details</h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Job Description</label>
              <textarea
                className="w-full h-40 p-2 border rounded"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste job description here..."
              ></textarea>
            </div>
            
            <button
              className="mb-4 btn btn-secondary"
              onClick={analyzeJob}
              disabled={loading || !jobDescription}
            >
              {loading ? 'Analyzing...' : 'Analyze Job Description'}
            </button>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Company Name</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Company name"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">Position Title</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={positionTitle}
                  onChange={(e) => setPositionTitle(e.target.value)}
                  placeholder="Position title"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Cover Letter Options</h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Tone</label>
              <select
                className="w-full p-2 border rounded"
                value={tone}
                onChange={handleToneChange}
              >
                <option value="professional">Professional</option>
                <option value="conversational">Conversational</option>
                <option value="enthusiastic">Enthusiastic</option>
                <option value="confident">Confident</option>
                <option value="formal">Formal</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Key Points to Emphasize (Optional)</label>
              <textarea
                className="w-full h-32 p-2 border rounded"
                value={keyPoints}
                onChange={(e) => setKeyPoints(e.target.value)}
                placeholder="Enter key points to emphasize (one per line)"
              ></textarea>
              <p className="text-sm text-gray-600 mt-1">
                Enter specific achievements, skills, or experiences you want to highlight
              </p>
            </div>
            
            <button
              className="mt-4 btn btn-primary w-full"
              onClick={handleGenerateCoverLetter}
              disabled={loading || !jobDescription || !companyName || !positionTitle}
            >
              {loading ? 'Generating...' : 'Generate AI Cover Letter'}
            </button>
          </div>
        </div>
      )}

      {/* Job Analysis Modal */}
      {showJobAnalysis && jobAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Job Analysis Results</h2>
                <button
                  onClick={() => setShowJobAnalysis(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold">Required Skills</h3>
                  <ul className="list-disc pl-5">
                    {jobAnalysis.requiredSkills?.map((skill, index) => (
                      <li key={index}>{skill}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-bold">Company Values</h3>
                  <ul className="list-disc pl-5">
                    {jobAnalysis.companyValues?.map((value, index) => (
                      <li key={index}>{value}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-bold">Key Responsibilities</h3>
                  <ul className="list-disc pl-5">
                    {jobAnalysis.keyResponsibilities?.map((resp, index) => (
                      <li key={index}>{resp}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {aiSuggestions.length > 0 && (
                <div className="mt-6 border-t pt-4">
                  <h3 className="font-bold mb-2">AI Cover Letter Suggestions</h3>
                  <div className="space-y-3">
                    {aiSuggestions.map((suggestion, index) => (
                      <div 
                        key={index} 
                        className={`p-3 rounded-lg ${
                          suggestion.type === 'warning' 
                            ? 'bg-yellow-100 border-l-4 border-yellow-500' 
                            : 'bg-blue-100 border-l-4 border-blue-500'
                        }`}
                      >
                        <h4 className="font-bold">{suggestion.title}</h4>
                        <p>{suggestion.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-6 flex justify-end">
                <button
                  className="btn btn-primary"
                  onClick={() => setShowJobAnalysis(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cover Letter Preview Modal */}
      {showCoverLetterPreview && generatedCoverLetter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">AI Generated Cover Letter</h2>
                <button
                  onClick={() => setShowCoverLetterPreview(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
              
              <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Cover Letter Details:</strong> This AI-generated cover letter is tailored specifically for 
                  <strong> {profileData?.personal?.firstName} {profileData?.personal?.lastName}</strong> 
                  applying for the <strong>{positionTitle}</strong> position at <strong>{companyName}</strong>,
                  using a <strong>{tone}</strong> tone. The content is optimized based on your experience, skills, 
                  and the specific job requirements.
                </p>
              </div>
              
              <div className="bg-white border border-gray-300 p-6 rounded shadow-sm whitespace-pre-wrap">
                <div className="cover-letter-view">
                  {/* Auto-format the cover letter text by parsing it */}
                  {generatedCoverLetter.split('\n').map((line, index) => {
                    // Check if it might be a date or address line (typically at the top)
                    if (index < 5 && (line.match(/\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4}/) || line.includes('@'))) {
                      return <p key={index} className="text-gray-700 mb-1">{line}</p>;
                    }
                    // Check if it might be a greeting/salutation
                    else if (line.trim().startsWith('Dear') || line.includes(',')) {
                      return <p key={index} className="font-medium mb-4 mt-4">{line}</p>;
                    }
                    // Check if it might be a closing (typically "Sincerely," etc.)
                    else if ((line.trim().endsWith(',') || line.trim().endsWith('yours')) && line.length < 30) {
                      return <p key={index} className="font-medium mt-4 mb-1">{line}</p>;
                    }
                    // Check if it's a signature
                    else if (index > generatedCoverLetter.split('\n').length - 4) {
                      return <p key={index} className="mb-1">{line}</p>;
                    }
                    // Regular paragraph
                    else if (line.trim().length > 0) {
                      return <p key={index} className="mb-4 text-justify">{line}</p>;
                    }
                    // Empty line
                    else {
                      return <p key={index} className="mb-2">&nbsp;</p>;
                    }
                  })}
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  className="btn btn-secondary"
                  onClick={handleDownloadCoverLetter}
                >
                  Download as Text
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCoverLetterPreview(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AICoverLetterGenerator; 