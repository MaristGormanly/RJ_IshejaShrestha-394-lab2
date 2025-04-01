import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

const ResumeTailoring = () => {
  const [activeTab, setActiveTab] = useState('tailoring');
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
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

  const analyzeResume = async () => {
    if (!auth.currentUser) return;
    
    setLoading(true);
    
    try {
      // In a real implementation, this would call an API to analyze the resume
      // For this example, we're using placeholder data
      
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
        resumeText,
        skillsMatch,
        missingSkills,
        optimizationSuggestions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      setTailoredResume(`
JOHN DOE
jdoe@email.com | (555) 123-4567 | linkedin.com/in/johndoe

PROFESSIONAL SUMMARY
Results-driven project manager with 5+ years of experience in Agile methodologies and cross-functional team leadership. Proven track record in delivering complex projects on time and within budget while maintaining high quality standards.

SKILLS
- Project Management: Agile, Scrum, Kanban, JIRA
- Technical: SQL, Tableau, Excel, PowerPoint
- Leadership: Team building, stakeholder management, conflict resolution

EXPERIENCE
Senior Project Manager | ABC Company | Jan 2020 - Present
- Led cross-functional teams of 10+ members to deliver projects 15% ahead of schedule
- Implemented Agile methodologies resulting in 30% efficiency improvement
- Utilized data analysis techniques to identify and resolve bottlenecks

Project Coordinator | XYZ Inc. | Mar 2018 - Dec 2019
- Assisted in managing project timelines and resource allocation
- Collaborated with stakeholders to define project requirements
- Organized team meetings and documented action items

EDUCATION
MBA, Business Administration | State University | 2018
BS, Computer Science | Tech University | 2016
      `);
      
    } catch (error) {
      console.error('Error analyzing resume:', error);
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
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Analyze Resume'}
        </button>
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
              <button className="w-full mt-4 text-primary font-medium">
                View Details
              </button>
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
              <button className="w-full mt-4 text-primary font-medium">
                See Recommendations
              </button>
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
            <h2 className="text-xl font-bold mb-4">Tailored Resume Preview</h2>
            <p className="text-gray-600 mb-4">
              Edit your optimized resume
            </p>
            <div className="border border-gray-300 rounded-md p-4 font-mono text-sm whitespace-pre-line h-96 overflow-y-auto">
              {tailoredResume}
            </div>
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
        </>
      )}
    </div>
  );
};

export default ResumeTailoring; 