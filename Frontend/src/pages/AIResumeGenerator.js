import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { auth, db, storage, createDirectDownloadUrl } from '../firebase/config';
import { generateResume, analyzeJobDescription } from '../firebase/aiService';
import { ref, getBytes, getDownloadURL } from 'firebase/storage';
import DocumentHandler from '../components/DocumentHandler';
// Import libraries for parsing PDF and Word documents
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set the worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const AIResumeGenerator = () => {
  const navigate = useNavigate();
  const [jobDescription, setJobDescription] = useState('');
  const [generatedResume, setGeneratedResume] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [options, setOptions] = useState({
    tone: 'professional',
    format: 'standard',
    focus: 'skills',
  });
  const [jobAnalysis, setJobAnalysis] = useState(null);
  const [showJobAnalysis, setShowJobAnalysis] = useState(false);
  const [showResumePreview, setShowResumePreview] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  
  // New state for saved resumes
  const [savedResumes, setSavedResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [selectedResumeContent, setSelectedResumeContent] = useState('');
  const [isFetchingResumes, setIsFetchingResumes] = useState(false);

  // Add a new state for file processing
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Add state for document handling
  const [documentToLoad, setDocumentToLoad] = useState(null);

  // When generatedResume is updated, also create a formatted version for display
  useEffect(() => {
    if (generatedResume) {
      // Process the generated resume text to apply formatting
      parseResumeForDisplay(generatedResume);
    }
  }, [generatedResume]);

  // State to hold the formatted resume HTML
  const [formattedResumeHtml, setFormattedResumeHtml] = useState('');

  // Parse the raw resume text and convert to formatted HTML
  const parseResumeForDisplay = (rawText) => {
    // Filter out any AI commentary at the end
    const lines = removeAICommentary(rawText.split('\n'));
    
    let html = '<div class="resume-preview bg-white">';
    
    // Track the current section we're in
    let currentSection = '';
    let inList = false;
    
    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (line === '') {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        continue;
      }
      
      // Check if this is a horizontal divider
      if (line.startsWith('---')) {
        html += '<hr class="my-3 border-gray-300" />';
        continue;
      }
      
      // Check if this is the name (first line)
      if (i === 0) {
        html += `<h1 class="text-center text-2xl font-bold text-gray-800 mb-2">${line}</h1>`;
        continue;
      }
      
      // Check for contact info (typically lines 2-4)
      if (i > 0 && i < 5 && (line.includes('@') || line.includes('Phone') || line.includes('NY') || line.includes('Address'))) {
        html += `<p class="text-center text-gray-600 mb-1">${line}</p>`;
        continue;
      }
      
      // Check for section headers (### or ALL CAPS with colon)
      if (line.startsWith('###') || (line.toUpperCase() === line && line.length > 0 && line.endsWith(':'))) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        
        // Extract section name
        currentSection = line.replace('###', '').replace(':', '').trim();
        
        html += `<div class="mt-4 mb-2">
          <h2 class="text-lg font-bold text-gray-800 border-b border-gray-300 pb-1">${currentSection}</h2>
        </div>`;
        continue;
      }
      
      // Check for subsection headers (usually bold text)
      if (line.startsWith('**') && line.endsWith('**')) {
        const boldText = line.replace(/\*\*/g, '');
        html += `<h3 class="font-bold text-gray-700 mt-3 mb-1">${boldText}</h3>`;
        continue;
      }
      
      // Check for location/date lines that often follow subsection headers
      if (i > 0 && lines[i-1].startsWith('**') && (line.includes(',') || line.includes('-'))) {
        html += `<p class="text-sm text-gray-600 italic mb-2">${line}</p>`;
        continue;
      }
      
      // Check for bullet points
      if (line.startsWith('-') || line.startsWith('•')) {
        if (!inList) {
          html += '<ul class="list-disc pl-5 my-2">';
          inList = true;
        }
        
        const bulletText = line.substring(1).trim();
        html += `<li class="mb-1 text-gray-700">${bulletText}</li>`;
        continue;
      }
      
      // Regular paragraph text
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      
      html += `<p class="mb-2 text-gray-700">${line}</p>`;
    }
    
    // Close any open lists
    if (inList) {
      html += '</ul>';
    }
    
    html += '</div>';
    
    setFormattedResumeHtml(html);
  };

  // Render the formatted resume content in the preview
  const renderFormattedResume = () => {
    if (formattedResumeHtml) {
      return <div dangerouslySetInnerHTML={{ __html: formattedResumeHtml }} className="p-6 print:p-0 max-w-3xl mx-auto" />;
    }
    
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Resume preview not available</p>
      </div>
    );
  };

  // Load user profile data and saved resumes when component mounts
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
        
        // Fetch structured resume data
        const resumeDataRef = doc(db, 'resumeData', auth.currentUser.uid);
        const resumeDataDoc = await getDoc(resumeDataRef);
        const resumeData = resumeDataDoc.exists() ? resumeDataDoc.data() : {};
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Format profile data for the AI service
          const formattedProfile = {
            personal: {
              firstName: userData.firstName || userData.applicationProfile?.firstName || '',
              lastName: userData.lastName || userData.applicationProfile?.lastName || '',
              email: userData.email || auth.currentUser.email || '',
              phone: userData.phone || '',
              location: userData.location || '',
              profession: userData.profession || '',
            },
            education: userData.applicationProfile?.education || [],
            experience: userData.applicationProfile?.experience || [],
            skills: resumeData.skills ? resumeData.skills.split(',').map(skill => skill.trim()) : [],
            summary: resumeData.summary || '',
            certifications: resumeData.certifications ? resumeData.certifications.split('\n').map(cert => cert.trim()).filter(Boolean) : [],
            achievements: resumeData.achievements ? resumeData.achievements.split('\n').map(achievement => achievement.trim()).filter(Boolean) : [],
            languages: resumeData.languages ? resumeData.languages.split(',').map(lang => lang.trim()) : [],
            projects: resumeData.projects ? resumeData.projects.split('\n\n').map(project => project.trim()).filter(Boolean) : [],
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
    fetchSavedResumes();
  }, [navigate]);

  // Function to fetch saved resumes
  const fetchSavedResumes = async () => {
    if (!auth.currentUser) return;
    
    try {
      setIsFetchingResumes(true);
      
      console.log(`Fetching resumes for user ID: ${auth.currentUser.uid}`);
      
      // Query the 'documents' collection for resumes
      const q = query(
        collection(db, 'documents'),
        where('userId', '==', auth.currentUser.uid),
        where('type', '==', 'resume')
      );
      
      console.log('Executing Firestore query for saved resumes');
      const querySnapshot = await getDocs(q);
      
      console.log(`Query returned ${querySnapshot.size} documents`);
      const resumes = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`Processing document: ${doc.id}`, {
          id: data.id,
          title: data.title,
          fileType: data.fileType,
          hasFileUrl: !!data.fileUrl,
          fileName: data.fileName,
          storagePath: data.storagePath || 'no-storage-path',
          createdAt: data.createdAt
        });
        resumes.push(data);
      });
      
      console.log(`Processed ${resumes.length} saved resumes`);
      console.log('Resume URLs:', resumes.map(r => ({ id: r.id, fileUrl: r.fileUrl ? 'exists' : 'missing' })));
      
      setSavedResumes(resumes);
    } catch (err) {
      console.error('Error fetching saved resumes:', err);
    } finally {
      setIsFetchingResumes(false);
    }
  };

  // Function to get a download URL with token for Firebase Storage
  const getDownloadUrlWithToken = async (path) => {
    try {
      // Validate path
      if (!path || path === 'undefined' || path.includes('undefined')) {
        throw new Error(`Invalid path: ${path}`);
      }
      
      // Create a reference to the file
      const fileRef = ref(storage, path);
      
      try {
        // First attempt: Try to get bytes directly (best for CORS avoidance)
        console.log(`Attempting to get bytes directly for: ${path}`);
        const fileBytes = await getBytes(fileRef);
        // If successful, return null since we'll use the bytes directly
        console.log(`Successfully got bytes directly for: ${path}`);
        return null;
      } catch (bytesError) {
        console.warn(`Failed to get bytes directly, trying alternative methods: ${bytesError.message}`);
        
        // Second attempt: Use our proxy service
        try {
          console.log(`Getting download URL for: ${path}`);
          // Get the Firebase download URL
          const directUrl = createDirectDownloadUrl(path);
          
          // Convert to proxy URL
          const proxyUrl = `/firebase-storage-proxy/v0/b/${storage.app.options.storageBucket}/o/${encodeURIComponent(path)}?alt=media`;
          console.log(`Generated proxy URL: ${proxyUrl}`);
          return proxyUrl;
        } catch (proxyError) {
          console.error(`Error creating proxy URL: ${proxyError.message}`);
          
          // Third attempt: Try the standard Firebase URL as last resort
          const url = await getDownloadURL(fileRef);
          console.log(`Got standard Firebase URL as fallback: ${url}`);
          return url;
        }
      }
    } catch (error) {
      // Handle specific Firebase Storage errors
      if (error.code === 'storage/object-not-found') {
        console.error(`File not found at path ${path}`);
      } else if (error.code === 'storage/unauthorized') {
        console.error(`No permission to access file at ${path}`);
      } else if (error.code === 'storage/canceled') {
        console.error(`Operation canceled for ${path}`);
      } else if (error.code === 'storage/unknown') {
        console.error(`Unknown error occurred for ${path}: ${error.message}`);
      } else {
        console.error(`Error getting download URL for ${path}:`, error);
      }
      throw error;
    }
  };

  // Helper function to convert Firebase Storage URLs to use our proxy
  const convertToProxyUrl = (url) => {
    if (!url) return url;
    
    try {
      // Extract the path and query parameters from the Firebase Storage URL
      const firebaseStoragePrefix = 'https://firebasestorage.googleapis.com/';
      if (!url.startsWith(firebaseStoragePrefix)) return url;
      
      const pathAndParams = url.substring(firebaseStoragePrefix.length);
      return `/firebase-storage-proxy/${pathAndParams}`;
    } catch (error) {
      console.error('Error converting URL to proxy format:', error);
      return url; // Return original URL on error
    }
  };

  // Function to fetch resume content with better error handling
  const fetchResumeContent = async (resumeId) => {
    if (!resumeId) {
      console.log('No resume ID provided');
      setSelectedResumeContent('');
      return;
    }
    
    console.log(`Attempting to fetch resume with ID: ${resumeId}`);
    console.log('Available saved resumes:', savedResumes.map(r => ({ id: r.id, title: r.title, fileUrl: !!r.fileUrl })));
    
    setIsProcessingFile(true);
    setError(null);
    try {
      // First, find the resume in our local state
      const selectedResume = savedResumes.find(resume => resume.id === resumeId);
      
      if (!selectedResume) {
        console.error(`Resume with ID ${resumeId} not found in savedResumes array`);
        setError('Resume not found. Please try another resume.');
        return;
      }
      
      // Add detailed logging of the resume data
      console.log('Selected Resume Data:', {
        id: selectedResume.id,
        fileName: selectedResume.fileName,
        fileType: selectedResume.fileType,
        fileUrl: selectedResume.fileUrl,
        storagePath: selectedResume.storagePath,
        filePath: selectedResume.filePath,
        createdAt: selectedResume.createdAt,
        userId: selectedResume.userId
      });
      
      let content = '';
      
      // Skip the fileUrl approach completely and go straight to storage
      console.log('Using Storage API approach for file retrieval');
      
      if (!selectedResume.fileName) {
        throw new Error('No filename available for this document. Cannot fetch from storage.');
      }
      
      // Try various possible storage paths
      const possiblePaths = [
        selectedResume.storagePath, // First try the storagePath if it exists
        `documents/${auth.currentUser.uid}/${selectedResume.id}_${selectedResume.fileName}`,
        `documents/${auth.currentUser.uid}/${selectedResume.fileName}`,
        `documents/${auth.currentUser.uid}/${selectedResume.id}`,
        `documents/${auth.currentUser.uid}/${resumeId}_${selectedResume.fileName}`,
        `documents/${auth.currentUser.uid}/${resumeId}`,
        // Remove the 'resumes' paths since we're not using that structure
        `${selectedResume.filePath}`, // Some implementations use filePath instead
        // Try without the user ID (in case storage rules allow public access)
        `documents/${selectedResume.fileName}`,
        `documents/${selectedResume.id}_${selectedResume.fileName}`,
      ];
      
      let success = false;
      let arrayBuffer = null;
      
      // Try each path with exponential backoff
      for (let i = 0; i < possiblePaths.length; i++) {
        if (!possiblePaths[i] || possiblePaths[i] === 'undefined') continue;
        
        try {
          // Wait between attempts
          if (i > 0) {
            const backoffTime = 300 * Math.pow(1.5, i);
            console.log(`Waiting ${backoffTime}ms before trying next path...`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
          }
          
          const path = possiblePaths[i];
          console.log(`Trying path ${i+1}: ${path}`);
          
          try {
            // Try direct Storage API first (less prone to CORS issues)
            console.log(`Trying direct Storage API for path: ${path}`);
            try {
              const storageRef = ref(storage, path);
              const fileBytes = await getBytes(storageRef);
              arrayBuffer = fileBytes.buffer;
              success = true;
              console.log(`Successfully fetched file from path (direct): ${path}`);
              break;
            } catch (bytesError) {
              console.warn(`Failed to get bytes for ${path}: ${bytesError.message}`);
              
              // If direct access failed, use our enhanced getDownloadUrlWithToken
              const url = await getDownloadUrlWithToken(path);
              
              // If url is null, that means we already got the bytes directly
              if (url === null) {
                continue;
              }
              
              // Add cache busting parameter
              const urlWithCacheBust = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
              console.log(`Fetching with URL: ${urlWithCacheBust}`);
              
              // Set up a timeout for the fetch operation
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 seconds timeout
              
              try {
                const response = await fetch(urlWithCacheBust, {
                  method: 'GET',
                  cache: 'no-store', // Completely bypass cache
                  credentials: 'omit', // Don't send cookies
                  redirect: 'follow',
                  referrerPolicy: 'no-referrer',
                  headers: {
                    'Accept': '*/*',
                    'Cache-Control': 'no-cache'
                  },
                  signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                  arrayBuffer = await response.arrayBuffer();
                  success = true;
                  console.log(`Successfully fetched file from URL: ${path}`);
                  break;
                } else {
                  console.warn(`Failed to fetch from URL: ${response.status} ${response.statusText}`);
                  throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
                }
              } catch (fetchError) {
                clearTimeout(timeoutId);
                console.warn(`Fetch error: ${fetchError.message}`);
                
                // Try the fallback approach using iframe hack for docx files
                if (path.toLowerCase().endsWith('.docx') || 
                    selectedResume.fileType?.includes('word')) {
                  
                  console.log('Attempting fallback approach for Word document');
                  
                  // Create a minimal text representation based on available metadata
                  let fallbackContent = 
                    `${selectedResume.title || 'Resume'}\n\n` +
                    `This is a simplified text extraction from your Word document.\n\n` + 
                    `The file could not be processed due to browser security restrictions.\n\n` +
                    `We recommend uploading a plain text (.txt) version of your resume for best results.\n\n` +
                    `Filename: ${selectedResume.fileName || 'Unknown'}\n` +
                    `Type: ${selectedResume.fileType || 'Word Document'}\n` +
                    `Upload date: ${selectedResume.createdAt ? new Date(selectedResume.createdAt).toLocaleString() : 'Unknown'}\n\n` +
                    `Please use the content from this document as additional context for your AI-generated resume.`;
                  
                  content = fallbackContent;
                  success = true;
                  setError("Limited extraction: Using basic document information only. For better results, upload a text (.txt) version.");
                  setIsProcessingFile(false);
                  setSelectedResumeContent(content);
                  return;
                }
              }
            }
          } catch (pathError) {
            console.warn(`Error trying path ${possiblePaths[i]}: ${pathError.message}`);
            // Continue to next path
          }
        } catch (error) {
          console.error(`Unexpected error with path ${possiblePaths[i]}:`, error);
        }
      }
      
      // If all storage access attempts failed but we have a fileUrl, try a last resort approach
      if (!success && !arrayBuffer && selectedResume.fileUrl) {
        try {
          console.log("All storage attempts failed. Trying manual extraction from fileUrl metadata...");
          
          // Use the filename extension to guess the file type
          const filename = selectedResume.fileName || '';
          const fileExtension = filename.toLowerCase().split('.').pop();
          
          // For docx files, try to generate sample content based on resume title and metadata
          if (fileExtension === 'docx' || selectedResume.fileType?.includes('word')) {
            console.log("Generating fallback content for Word document");
            
            // Create a minimal text representation based on available metadata
            let fallbackContent = 
              `${selectedResume.title || 'Resume'}\n\n` +
              `This is a simplified text extraction from your Word document.\n\n` + 
              `The original document could not be processed due to technical limitations.\n\n` +
              `We recommend uploading a plain text (.txt) version of your resume for best results.\n\n` +
              `Filename: ${selectedResume.fileName || 'Unknown'}\n` +
              `Type: ${selectedResume.fileType || 'Word Document'}\n` +
              `Upload date: ${selectedResume.createdAt ? new Date(selectedResume.createdAt).toLocaleString() : 'Unknown'}\n\n` +
              `Please use the content from this document as additional context for your AI-generated resume.`;
            
            content = fallbackContent;
            success = true;
            // Clear the error since we've generated fallback content
            setError("Limited extraction: Using basic document information only. For better results, upload a text (.txt) version.");
          }
          // Similarly for PDF
          else if (fileExtension === 'pdf' || selectedResume.fileType?.includes('pdf')) {
            console.log("Generating fallback content for PDF document");
            
            let fallbackContent = 
              `${selectedResume.title || 'Resume'}\n\n` +
              `This is a simplified text extraction from your PDF document.\n\n` + 
              `The original document could not be processed due to technical limitations.\n\n` +
              `We recommend uploading a plain text (.txt) version of your resume for best results.\n\n` +
              `Filename: ${selectedResume.fileName || 'Unknown'}\n` +
              `Type: ${selectedResume.fileType || 'PDF Document'}\n` +
              `Upload date: ${selectedResume.createdAt ? new Date(selectedResume.createdAt).toLocaleString() : 'Unknown'}\n\n` +
              `Please use the content from this document as additional context for your AI-generated resume.`;
            
            content = fallbackContent;
            success = true;
            // Clear the error since we've generated fallback content
            setError("Limited extraction: Using basic document information only. For better results, upload a text (.txt) version.");
          }
        } catch (fallbackError) {
          console.error("Error generating fallback content:", fallbackError);
        }
      }
      
      if (!success || !arrayBuffer) {
        throw new Error('Could not access the resume file. Try uploading it again or select a different resume.');
      }
      
      // Process based on file type
      if (selectedResume.fileType === 'text/plain' || selectedResume.fileName.toLowerCase().endsWith('.txt')) {
        // For text files
        const decoder = new TextDecoder('utf-8');
        content = decoder.decode(arrayBuffer);
        console.log('Text content loaded successfully');
      }
      else if (selectedResume.fileType === 'application/pdf' || selectedResume.fileName.toLowerCase().endsWith('.pdf')) {
        // For PDF files
        content = await extractTextFromPdf(arrayBuffer);
      }
      else if (selectedResume.fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
              selectedResume.fileName.toLowerCase().endsWith('.docx')) {
        // For Word files
        content = await extractTextFromWord(arrayBuffer);
      }
      else {
        throw new Error(`Unsupported file type: ${selectedResume.fileType}`);
      }
      
      if (!content || content.trim() === '') {
        throw new Error('No text content could be extracted from the file.');
      }
      
      // Set the extracted text content
      setSelectedResumeContent(content);
      console.log(`Resume content loaded successfully. Length: ${content.length} characters`);
    } catch (err) {
      console.error('Error fetching resume content:', err);
      setError(`Error loading resume content: ${err.message}`);
      setSelectedResumeContent('');
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Helper function to process file content based on file type
  const processFileContent = async (resume, response) => {
    // Get the response data based on file type
    if (resume.fileType === 'text/plain' || resume.fileName?.toLowerCase().endsWith('.txt')) {
      // For text files - simple text extraction
      const text = await response.text();
      console.log('Text resume loaded successfully');
      return text;
    } 
    else if (resume.fileType === 'application/pdf' || resume.fileName?.toLowerCase().endsWith('.pdf')) {
      // For PDF files - use PDF.js to extract text
      const arrayBuffer = await response.arrayBuffer();
      return await extractTextFromPdf(arrayBuffer);
    } 
    else if (resume.fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
            resume.fileName?.toLowerCase().endsWith('.docx')) {
      // For Word (.docx) files - use Mammoth.js to extract text
      const arrayBuffer = await response.arrayBuffer();
      return await extractTextFromWord(arrayBuffer);
    }
    else {
      // Unsupported file type
      throw new Error(`Unsupported file type: ${resume.fileType}. Only text (.txt), PDF (.pdf), and Word (.docx) files are supported.`);
    }
  };

  // Helper function to extract text from PDF
  const extractTextFromPdf = async (arrayBuffer) => {
    try {
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      console.log(`PDF loaded with ${pdf.numPages} pages`);
      
      // Extract text from each page
      let pdfText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        pdfText += pageText + '\n\n';
      }
      
      const finalText = pdfText.trim();
      console.log('PDF text extracted successfully');
      return finalText;
    } catch (pdfError) {
      console.error('Error parsing PDF:', pdfError);
      throw new Error(`Could not parse PDF file: ${pdfError.message}`);
    }
  };

  // Helper function to extract text from Word document
  const extractTextFromWord = async (arrayBuffer) => {
    try {
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value.trim();
      console.log('Word document text extracted successfully');
      return text;
    } catch (wordError) {
      console.error('Error parsing Word document:', wordError);
      throw new Error(`Could not parse Word document: ${wordError.message}`);
    }
  };

  // Update handler for selecting a resume
  const handleResumeSelect = (e) => {
    const resumeId = e.target.value;
    setSelectedResumeId(resumeId);
    
    if (!resumeId) {
      setSelectedResumeContent('');
      setError(null);
      return;
    }
    
    setIsProcessingFile(true);
    setError(null);
    
    // Find the selected resume in our local state
    const selectedResume = savedResumes.find(resume => resume.id === resumeId);
    
    if (!selectedResume) {
      setError('Resume not found. Please try another resume.');
      setIsProcessingFile(false);
      return;
    }
    
    // For text files, use direct content extraction
    if (selectedResume.fileType === 'text/plain' || 
        (selectedResume.fileName && selectedResume.fileName.toLowerCase().endsWith('.txt'))) {
      // Text files are easier to handle, use the regular fetch method
      fetchResumeContent(resumeId);
    }
    // For Word or PDF files, use our DocumentHandler component
    else if (selectedResume.fileType?.includes('word') || 
        selectedResume.fileType?.includes('pdf') || 
        (selectedResume.fileName && (
          selectedResume.fileName.toLowerCase().endsWith('.docx') || 
          selectedResume.fileName.toLowerCase().endsWith('.pdf')
        ))) {
      
      // Find the best storage path
      let storagePath = selectedResume.storagePath;
      
      // If no storage path is available, generate the most likely one
      if (!storagePath) {
        storagePath = `documents/${auth.currentUser.uid}/${selectedResume.id}_${selectedResume.fileName}`;
      }
      
      console.log(`Using DocumentHandler for file: ${selectedResume.fileName}, path: ${storagePath}`);
      
      // Use the DocumentHandler component
      setDocumentToLoad(storagePath);
    }
    // For other file types, use the regular method
    else {
      fetchResumeContent(resumeId);
    }
  };

  const handleToneChange = (e) => {
    setOptions({ ...options, tone: e.target.value });
  };

  const handleFormatChange = (e) => {
    setOptions({ ...options, format: e.target.value });
  };

  const handleFocusChange = (e) => {
    setOptions({ ...options, focus: e.target.value });
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
          content: `Your profile is missing these required skills: ${missingSkills.join(', ')}. Consider adding relevant experience or training.`
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
          type: 'warning',
          title: 'Experience Gap',
          content: `The job requires ${requiredYears} years of experience, but your profile shows approximately ${totalYearsExperience} years. Highlight your most relevant accomplishments.`
        });
      }
    }
    
    // Add positive suggestions too
    suggestions.push({
      type: 'tip',
      title: 'Highlight These Keywords',
      content: `These keywords from the job description should be emphasized in your resume: ${analysis.industrySpecificKeywords?.slice(0, 5).join(', ') || 'N/A'}`
    });
    
    setAiSuggestions(suggestions);
  };

  const handleGenerateResume = async () => {
    if (!jobDescription) {
      setError('Please enter a job description.');
      return;
    }

    if (!profileData) {
      setError('Profile data not available. Please complete your profile.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Calling AI resume generation');
      
      // Extract relevant information from profile
      const { 
        personal = {}, 
        education = [], 
        experience = [], 
        skills = [], 
        achievements = [] 
      } = profileData;
      
      // Build the prompt for OpenAI
      let prompt = `Generate a tailored resume for the following individual applying for this job description:\n\n`;
      prompt += `JOB DESCRIPTION:\n${jobDescription}\n\n`;
      prompt += `PERSONAL INFORMATION:\n`;
      prompt += `Name: ${personal.firstName} ${personal.lastName}\n`;
      prompt += `Email: ${personal.email}\n`;
      prompt += `Phone: ${personal.phone}\n`;
      prompt += `Location: ${personal.location}\n`;
      prompt += `Profession: ${personal.profession}\n\n`;
      
      prompt += `EDUCATION:\n`;
      education.forEach(edu => {
        prompt += `- ${edu.degree} in ${edu.fieldOfStudy} from ${edu.institution} (${edu.startDate} - ${edu.endDate || 'Present'})\n`;
      });
      prompt += `\n`;
      
      prompt += `WORK EXPERIENCE:\n`;
      experience.forEach(exp => {
        prompt += `- ${exp.position} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})\n`;
        prompt += `  ${exp.description}\n`;
      });
      prompt += `\n`;
      
      prompt += `SKILLS:\n${skills.join(', ')}\n\n`;
      
      prompt += `ACHIEVEMENTS:\n`;
      achievements.forEach(achievement => {
        prompt += `- ${achievement}\n`;
      });
      prompt += `\n`;
      
      // If a saved resume was selected, add its content to the prompt
      if (selectedResumeContent) {
        prompt += `EXISTING RESUME CONTENT:\n${selectedResumeContent}\n\n`;
        prompt += `Please use the existing resume content above as additional context to understand the applicant's background, achievements, and writing style. Incorporate relevant details from it to enhance the new resume.\n\n`;
      }
      
      prompt += `Please generate a professional resume with the following specifications:\n`;
      prompt += `- Tone: ${options.tone}\n`;
      prompt += `- Format: ${options.format}\n`;
      prompt += `- Focus on: ${options.focus}\n`;
      prompt += `- Create a COMPLETE and READY-TO-USE resume with NO PLACEHOLDERS\n`;
      prompt += `- Use the person's actual name and contact details at the top\n`;
      prompt += `- Include ONLY standard resume sections (Contact Info, Summary/Objective, Experience, Education, Skills, Achievements)\n`;
      prompt += `- Do NOT include any sections from the job description like "What You Bring" or "Compensation"\n`;
      prompt += `- Tailor the content to highlight relevant skills and experience for the job description\n`;
      prompt += `- Organize in a clear, professional format with appropriate sections\n`;
      prompt += `- Use bullet points for experience and achievements\n`;
      prompt += `- Quantify achievements where possible\n`;
      prompt += `- Make sure to highlight skills and experiences that directly match the job requirements\n`;
      
      // Handle possible test data
      prompt += `\nIMPORTANT: If any information appears to be test data (like "Test" or placeholder text), please create appropriate professional content that would make sense for a real resume. For example, if the job title is "Test at Test", create a relevant job title and company that would match the target position.\n`;
      
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
            content: selectedResumeContent 
              ? 'You are a professional resume writer with expertise in creating ATS-friendly, professional resumes. Your job is to create a complete, ready-to-use resume that is highly personalized based on the individual\'s skills and experience. You will be provided with both their profile information AND an existing resume. Extract valuable details from the existing resume that may not be in the profile, such as specific achievements, metrics, project details, and professional writing style. Blend this information with the profile data to create a comprehensive, tailored resume that matches the job description. Maintain the professional tone and specific accomplishments from their existing resume, while reorganizing and emphasizing the most relevant experiences for the target position. Format the resume professionally with standard resume sections only.'
              : 'You are a professional resume writer with expertise in creating ATS-friendly, professional resumes. Your job is to create a complete, ready-to-use resume that is highly personalized based on the individual\'s skills and experience. Do NOT include placeholders like "[Your Name]" or "[Brief description]" - use the actual data provided or make appropriate professional extrapolations. Do NOT include sections from the job description such as "What You Bring" or "Compensation". Format the resume professionally with standard resume sections only (Contact, Summary/Objective, Experience, Education, Skills, etc.). Use the person\'s actual name and contact details at the top. Focus on highlighting achievements and responsibilities relevant to the target job.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
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
      
      const resumeContent = data.choices[0].message.content.trim();
      console.log('Resume content received, length:', resumeContent.length);
      
      // Immediately display the content to the user
      setGeneratedResume(resumeContent);
      setShowResumePreview(true);
      
      // Optional: Save to Firestore in the background without blocking the UI
      try {
        console.log('Attempting to save to Firestore in the background');
        generateResume(auth.currentUser.uid, profileData, jobDescription, options)
          .then(result => {
            console.log('Background save to Firestore completed:', result);
          })
          .catch(err => {
            console.error('Background save to Firestore failed:', err);
          });
      } catch (saveError) {
        console.error('Error setting up background save:', saveError);
      }
    } catch (err) {
      console.error('Exception in handleGenerateResume:', err);
      setError(`An unexpected error occurred: ${err.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadResume = () => {
    if (!generatedResume) return;
    
    // Create a Blob and download as text file
    const element = document.createElement("a");
    const file = new Blob([generatedResume], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `AI_Resume_${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  // New function to download as Word document
  const handleDownloadWord = async () => {
    if (!generatedResume) return;
    
    try {
      setLoading(true);
      
      // Import libraries dynamically to reduce initial load time
      const docx = await import('docx');
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;
      
      // Parse the resume content
      const lines = generatedResume.split('\n');
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: parseResumeToDocx(lines, docx)
          }
        ]
      });
      
      // Create and download the docx file
      const blob = await Packer.toBlob(doc);
      const element = document.createElement("a");
      element.href = URL.createObjectURL(blob);
      element.download = `AI_Resume_${new Date().toISOString().split("T")[0]}.docx`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error('Error generating Word document:', error);
      setError('Failed to generate Word document. Please try downloading as text instead.');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to parse resume text into docx format
  const parseResumeToDocx = (lines, docx) => {
    const { Paragraph, TextRun, HeadingLevel } = docx;
    const children = [];
    
    let inBulletSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (line === '') {
        children.push(new Paragraph({}));
        continue;
      }
      
      // Detect headers (all caps or ending with a colon)
      if (line.toUpperCase() === line && line.length > 0) {
        // Add header
        children.push(
          new Paragraph({
            text: line,
            heading: HeadingLevel.HEADING_2,
            thematicBreak: true, // Add a horizontal line under headers
            spacing: {
              before: 240,
              after: 120
            }
          })
        );
        inBulletSection = false;
      }
      // Check if this is a bullet point
      else if (line.startsWith('•') || line.startsWith('-')) {
        children.push(
          new Paragraph({
            text: line.substring(1).trim(),
            bullet: {
              level: 0
            },
            spacing: {
              before: 60,
              after: 60
            }
          })
        );
        inBulletSection = true;
      }
      // Regular text
      else {
        const paragraph = new Paragraph({
          children: [
            new TextRun({
              text: line,
              bold: i < 4, // Make the first few lines (usually name and contact) bold
            })
          ],
          spacing: {
            before: 60,
            after: 60
          }
        });
        children.push(paragraph);
        inBulletSection = false;
      }
    }
    
    return children;
  };
  
  // New function to download as PDF
  const handleDownloadPDF = async () => {
    if (!generatedResume) return;
    
    try {
      setLoading(true);
      
      // Import libraries dynamically
      const jsPDF = (await import('jspdf')).default;
      
      // Create new PDF document - using A4 size
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Set fonts
      doc.setFont("helvetica", "normal");
      
      // Define constants for formatting
      const margin = 20; // margin in mm
      const pageWidth = 210; // A4 width
      const contentWidth = pageWidth - (margin * 2);
      
      // Process the resume content
      const lines = generatedResume.split('\n');
      
      // Set initial y position
      let y = margin;
      
      // Filter out any AI commentary at the end
      const filteredLines = removeAICommentary(lines);
      
      // Track if we're in a section
      let currentSection = '';
      
      // Process each line
      for (let i = 0; i < filteredLines.length; i++) {
        const line = filteredLines[i].trim();
        
        // Skip empty lines
        if (line === '') {
          y += 2;
          continue;
        }
        
        // Check if this is a name (first line)
        if (i === 0) {
          doc.setFontSize(16);
          doc.setFont("helvetica", "bold");
          doc.text(line, pageWidth / 2, y, { align: 'center' });
          y += 8;
          continue;
        }
        
        // Check for contact info section (typically lines 2-4)
        if (i > 0 && i < 5 && (line.includes('@') || line.includes('Phone') || line.includes('NY') || line.includes('New York'))) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.text(line, pageWidth / 2, y, { align: 'center' });
          y += 5;
          continue;
        }
        
        // Check for section dividers (lines with multiple dashes)
        if (line.startsWith('---')) {
          doc.setDrawColor(0);
          doc.setLineWidth(0.5);
          doc.line(margin, y, pageWidth - margin, y);
          y += 5;
          continue;
        }
        
        // Check for section headers (lines starting with ###)
        if (line.startsWith('###') || (line.toUpperCase() === line && line.length > 0 && line.endsWith(':'))) {
          // Extract section name
          currentSection = line.replace('###', '').replace(':', '').trim();
          
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          
          // Add some space before sections (except the first one)
          if (i > 5) y += 3;
          
          if (line.startsWith('###')) {
            doc.text(line.replace('###', '').trim(), margin, y);
          } else {
            doc.text(line, margin, y);
          }
          
          y += 5;
          
          // Add a light horizontal line under each section header
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.2);
          doc.line(margin, y, pageWidth - margin, y);
          
          y += 5;
          continue;
        }
        
        // Check for subsection headers (usually bold text or followed by location/date)
        if (line.startsWith('**') && line.endsWith('**')) {
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(line.replace(/\*\*/g, ''), margin, y);
          y += 5;
          continue;
        }
        
        // Check for bullet points
        if (line.startsWith('-') || line.startsWith('•')) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          
          // Handle text wrapping for bullet points
          const bulletText = line.substring(1).trim();
          const textX = margin + 5; // indent bullet points
          
          doc.text('•', margin, y);
          
          // Calculate available width for text after bullet
          const availableWidth = contentWidth - 5;
          
          // Get array of lines after wrapping text
          const wrappedText = doc.splitTextToSize(bulletText, availableWidth);
          
          // Print each line
          for (let j = 0; j < wrappedText.length; j++) {
            doc.text(wrappedText[j], textX, y);
            y += 5;
            
            // Check if we need a new page
            if (y > 280) {
              doc.addPage();
              y = margin;
            }
          }
          
          continue;
        }
        
        // Regular text - handle with proper text wrapping
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        // Wrap text to fit within margins
        const wrappedText = doc.splitTextToSize(line, contentWidth);
        
        // Print each line
        for (let j = 0; j < wrappedText.length; j++) {
          doc.text(wrappedText[j], margin, y);
          y += 5;
          
          // Check if we need a new page
          if (y > 280) {
            doc.addPage();
            y = margin;
          }
        }
      }
      
      // Save the PDF
      doc.save(`AI_Resume_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF. Please try downloading as text instead.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to remove AI commentary at the end of the resume
  const removeAICommentary = (lines) => {
    // Look for typical AI commentary markers
    const commentaryMarkers = [
      "This resume is designed to",
      "Feel free to",
      "I've tailored this resume",
      "This format highlights",
      "I've focused on"
    ];
    
    // Find the index where commentary starts
    let commentaryIndex = lines.length;
    
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (commentaryMarkers.some(marker => line.includes(marker))) {
        commentaryIndex = i;
        // Check if there's an empty line before the commentary
        if (i > 0 && lines[i-1].trim() === '') {
          commentaryIndex = i - 1;
        }
        break;
      }
    }
    
    // Return only the lines before the commentary
    return lines.slice(0, commentaryIndex);
  };

  // Handle printing the resume
  const handlePrintResume = () => {
    // Open a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Add necessary styles for printing
    printWindow.document.write(`
      <html>
        <head>
          <title>Resume - ${profileData?.personal?.firstName || ''} ${profileData?.personal?.lastName || ''}</title>
          <style>
            body {
              font-family: Arial, Helvetica, sans-serif;
              color: #333;
              line-height: 1.5;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 {
              text-align: center;
              font-size: 24px;
              margin-bottom: 8px;
            }
            .contact-info {
              text-align: center;
              font-size: 14px;
              margin-bottom: 20px;
              color: #555;
            }
            h2 {
              font-size: 16px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
              margin-top: 20px;
              margin-bottom: 10px;
            }
            h3 {
              font-size: 15px;
              margin-bottom: 5px;
              margin-top: 15px;
            }
            ul {
              margin-top: 5px;
              margin-bottom: 15px;
              padding-left: 25px;
            }
            li {
              margin-bottom: 5px;
            }
            p {
              margin: 5px 0;
            }
            hr {
              border: none;
              border-top: 1px solid #eee;
              margin: 15px 0;
            }
            @media print {
              body {
                padding: 0;
                font-size: 12px;
              }
              h1 {
                font-size: 18px;
              }
              h2 {
                font-size: 14px;
              }
              h3 {
                font-size: 13px;
              }
            }
          </style>
        </head>
        <body>
          ${formattedResumeHtml}
        </body>
      </html>
    `);
    
    // Wait for content to load, then print
    printWindow.document.close();
    printWindow.onload = function() {
      printWindow.focus();
      printWindow.print();
    };
  };

  const handleRefreshResumes = () => {
    fetchSavedResumes();
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* DocumentHandler component for CORS issues */}
      {documentToLoad && (
        <DocumentHandler 
          storagePath={documentToLoad}
          onLoaded={(url) => {
            console.log(`Document loaded successfully from: ${url}`);
            setDocumentToLoad(null);
            
            // Create fallback content since we can't directly access the file content
            const selectedResume = savedResumes.find(resume => resume.id === selectedResumeId);
            if (selectedResume) {
              // Check if it's a Word document
              const isWordDoc = selectedResume.fileType?.includes('word') || 
                               (selectedResume.fileName && selectedResume.fileName.toLowerCase().endsWith('.docx'));
              
              // Create a more helpful message with download instructions
              const fallbackContent = 
                `${selectedResume.title || 'Resume'}\n\n` +
                `This is a simplified representation of your document.\n\n` + 
                `Due to security restrictions, we cannot automatically extract content from your ${isWordDoc ? 'Word document' : 'document'}.\n\n` + 
                `You have two options:\n` +
                `1. Download your document using this link: ${url}\n` +
                `2. Copy and paste the content from your ${isWordDoc ? 'Word document' : 'document'} directly into the job description text area instead of selecting it here.\n` +
                `3. For best results, upload a plain text (.txt) version of your resume.\n\n` +
                `Filename: ${selectedResume.fileName || 'Unknown'}\n` +
                `Type: ${selectedResume.fileType || 'Document'}\n` +
                `Upload date: ${selectedResume.createdAt ? new Date(selectedResume.createdAt).toLocaleString() : 'Unknown'}\n\n` +
                `The AI will still use the basic information from this document to help generate your resume.`;
              
              setSelectedResumeContent(fallbackContent);
              
              // Set a more helpful error message
              const errorMessage = isWordDoc 
                ? "Limited access: Word documents cannot be automatically processed due to security restrictions. Consider downloading and copying the content, or uploading a text (.txt) version." 
                : "Limited access: Document content cannot be automatically extracted. Consider downloading and copying the content, or uploading a text (.txt) version.";
              
              setError(errorMessage);
              setIsProcessingFile(false);
            }
          }}
          onError={(error) => {
            console.error(`Error loading document: ${error.message}`);
            setDocumentToLoad(null);
            
            // Check if it might be an authentication error (403)
            const is403Error = error.message?.includes('403') || 
                             error.message?.includes('access') || 
                             error.message?.includes('permission') ||
                             error.message?.includes('denied');
            
            // Set a more specific error message
            setError(is403Error 
              ? "Access denied: You don't have permission to access this file. Please try uploading it again or use a text version." 
              : `Error loading document: ${error.message}`);
              
            setIsProcessingFile(false);
          }}
        />
      )}
      
      <h1 className="text-3xl font-bold mb-4">AI Resume Generator</h1>
      <p className="text-gray-600 mb-8">
        Generate tailored resumes using AI based on job descriptions and your profile information
      </p>

      {/* Informative tip box about using existing resumes */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-md">
        <h3 className="font-bold text-gray-800 mb-1">Enhanced with Your Existing Resume</h3>
        <p className="text-gray-700 mb-0">
          For best results, upload a resume to your profile and select it below. The AI will 
          incorporate specific details, achievements, and formatting from your existing resume 
          to create a more personalized and detailed result. 
        </p>
        <p className="text-gray-600 text-sm mt-2 mb-0">
          <strong>Tip:</strong> While we support text (.txt), PDF (.pdf), and Word (.docx) files, 
          plain text (.txt) files provide the most reliable results. If you experience issues with PDF or Word files, 
          try saving your resume as a text file instead.
        </p>
      </div>

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
          {/* Add Saved Resume Selection UI */}
          {savedResumes.length > 0 && (
            <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md mb-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Use Existing Resume</h2>
                <button 
                  onClick={handleRefreshResumes}
                  className="flex items-center p-2 text-sm text-blue-600 hover:text-blue-800"
                  disabled={isFetchingResumes}
                >
                  <svg 
                    className={`w-4 h-4 mr-1 ${isFetchingResumes ? 'animate-spin' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  {isFetchingResumes ? 'Refreshing...' : 'Refresh List'}
                </button>
              </div>
              <p className="text-gray-600 mb-4">
                Select one of your saved resumes to enhance the AI generation. The AI will use your existing resume content as additional context.
              </p>
              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="w-full md:w-2/3">
                  <select
                    className="w-full p-3 border rounded"
                    value={selectedResumeId}
                    onChange={handleResumeSelect}
                    disabled={isFetchingResumes}
                  >
                    <option value="">-- Select a saved resume --</option>
                    {savedResumes.map(resume => {
                      // Check if the file type is supported
                      const isTextFile = resume.fileType === 'text/plain';
                      const isPdfFile = resume.fileType === 'application/pdf' || 
                                       (resume.fileName && resume.fileName.toLowerCase().endsWith('.pdf'));
                      const isWordFile = resume.fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                                        (resume.fileName && resume.fileName.toLowerCase().endsWith('.docx'));
                      const isSupported = isTextFile || isPdfFile || isWordFile;
                      
                      // Determine file type label
                      let fileTypeLabel = '';
                      if (isTextFile) fileTypeLabel = '📄 TXT';
                      else if (isPdfFile) fileTypeLabel = '📕 PDF';
                      else if (isWordFile) fileTypeLabel = '📘 DOCX';
                      else fileTypeLabel = '❓ Unknown';
                      
                      return (
                        <option 
                          key={resume.id} 
                          value={resume.id}
                          disabled={!isSupported}
                        >
                          {resume.title} {fileTypeLabel ? `(${fileTypeLabel})` : ''} {!isSupported ? '(Unsupported)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="w-full md:w-1/3 flex gap-2">
                  {isProcessingFile ? (
                    <div className="p-3 bg-yellow-50 text-yellow-800 rounded flex items-center flex-grow">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing file... This may take a moment
                    </div>
                  ) : error && selectedResumeId ? (
                    <div className="flex flex-grow gap-2 items-start">
                      <div className="p-3 bg-red-100 text-red-800 rounded flex-grow">
                        <div className="font-bold mb-1">Error:</div>
                        <p className="text-sm">{
                          error.includes('CORS') || error.includes('cross-origin') ? 
                            'Cross-origin error. The file cannot be accessed directly.' :
                          error.includes('storage/retry-limit-exceeded') || error.includes('timeout') ? 
                            'File access timed out. Try a different resume or upload it again.' :
                          error.includes('storage/object-not-found') ?
                            'File not found in storage. Try uploading it again.' :
                            error.includes('Could not access') ?
                              'Could not access the file. Please try uploading it again.' :
                              error
                        }</p>
                        <div className="mt-2 flex justify-end">
                          <button
                            className="text-xs text-blue-700 underline"
                            onClick={() => navigate('/profile')}
                          >
                            Go to Profile to Upload Again
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button 
                          className="p-2 text-blue-600 hover:text-blue-800 rounded border border-blue-300"
                          onClick={() => fetchResumeContent(selectedResumeId)}
                          title="Try loading again"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                          </svg>
                        </button>
                        <button 
                          className="p-2 text-gray-600 hover:text-red-600 rounded border border-gray-300"
                          onClick={() => {
                            setSelectedResumeId('');
                            setSelectedResumeContent('');
                            setError(null);
                          }}
                          title="Clear selection"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : selectedResumeContent ? (
                    <>
                      <div className={`p-3 ${
                        error && (error.includes("Limited") || error.includes("access")) 
                          ? "bg-yellow-100 text-yellow-800" 
                          : "bg-green-100 text-green-800"
                      } rounded flex-grow`}>
                        {error && (error.includes("Limited") || error.includes("access")) ? (
                          <div className="flex items-center">
                            <span className="font-bold mr-1">⚠️</span> 
                            <span>Limited access ({(selectedResumeContent.length / 1000).toFixed(1)}KB)</span>
                            
                            {/* Add download link if the content mentions a URL */}
                            {selectedResumeContent.includes("http") && (
                              <a 
                                href={selectedResumeContent.match(/(https?:\/\/[^\s]+)/g)?.[0]}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-blue-600 hover:text-blue-800 text-xs p-1 border border-blue-300 rounded"
                                title="Download document"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                </svg>
                              </a>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold">✓</span> Resume loaded ({(selectedResumeContent.length / 1000).toFixed(1)}KB)
                          </div>
                        )}
                      </div>
                      <button 
                        className="p-2 text-gray-600 hover:text-red-600 rounded border border-gray-300"
                        onClick={() => {
                          setSelectedResumeId('');
                          setSelectedResumeContent('');
                        }}
                        title="Clear selection"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </>
                  ) : (
                    <div className="p-3 bg-gray-100 text-gray-600 rounded flex-grow">
                      <p>Select a resume file (.txt, .pdf, or .docx)</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Job Description</h2>
            <p className="text-gray-600 mb-4">
              Paste the job description to tailor your resume
            </p>
            
            {/* Display a helpful message if the selected resume has limited access */}
            {error && (error.includes("Limited") || error.includes("access")) && selectedResumeContent && (
              <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-md">
                <h3 className="font-bold text-blue-800 mb-2">Limited Access to Selected Resume</h3>
                <p className="text-sm text-blue-800 mb-2">
                  Due to security restrictions, we can't directly extract content from your selected document.
                </p>
                <div className="text-sm">
                  <strong>Options:</strong>
                  <ol className="list-decimal ml-6 mb-2">
                    <li className="mb-1">
                      <a 
                        href={selectedResumeContent.match(/(https?:\/\/[^\s]+)/g)?.[0]} 
                        className="text-blue-600 hover:text-blue-800 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Download your document
                      </a> and copy-paste its content below.
                    </li>
                    <li className="mb-1">
                      Go to your <a href="/profile" className="text-blue-600 hover:text-blue-800 underline">Profile</a> and upload a text (.txt) version of your resume.
                    </li>
                    <li>
                      Continue with limited information (less personalized results).
                    </li>
                  </ol>
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <label className="block text-gray-700 font-bold mb-2" htmlFor="jobDescription">
                Job Description
              </label>
              <div className="flex flex-col gap-2">
                <textarea
                  id="jobDescription"
                  className="p-3 border rounded w-full h-48"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here to help the AI tailor your resume for this specific position"
                />
                {jobDescription && (
                  <div className="flex justify-end">
                    <button
                      className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                      onClick={() => setJobDescription('')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                      Clear All
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <button
              className="mt-4 btn btn-secondary"
              onClick={analyzeJob}
              disabled={loading || !jobDescription}
            >
              {loading ? 'Analyzing...' : 'Analyze Job Description'}
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">AI Resume Options</h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Resume Tone</label>
              <select
                className="w-full p-2 border rounded"
                value={options.tone}
                onChange={handleToneChange}
              >
                <option value="professional">Professional</option>
                <option value="conversational">Conversational</option>
                <option value="confident">Confident</option>
                <option value="technical">Technical</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Resume Format</label>
              <select
                className="w-full p-2 border rounded"
                value={options.format}
                onChange={handleFormatChange}
              >
                <option value="standard">Standard</option>
                <option value="functional">Functional</option>
                <option value="chronological">Chronological</option>
                <option value="combination">Combination</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Resume Focus</label>
              <select
                className="w-full p-2 border rounded"
                value={options.focus}
                onChange={handleFocusChange}
              >
                <option value="skills">Skills</option>
                <option value="experience">Experience</option>
                <option value="achievements">Achievements</option>
                <option value="education">Education</option>
              </select>
            </div>
            
            <button
              className="mt-4 btn btn-primary w-full"
              onClick={handleGenerateResume}
              disabled={loading || !jobDescription}
            >
              {loading ? 'Generating...' : 'Generate AI Resume'}
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
                  <h3 className="font-bold">Preferred Skills</h3>
                  <ul className="list-disc pl-5">
                    {jobAnalysis.preferredSkills?.map((skill, index) => (
                      <li key={index}>{skill}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-bold">Experience Level</h3>
                  <p>{jobAnalysis.experienceLevel || 'Not specified'}</p>
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
                  <h3 className="font-bold mb-2">AI Suggestions</h3>
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

      {/* Resume Preview Modal */}
      {showResumePreview && generatedResume && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">AI Generated Resume</h2>
                <button
                  onClick={() => setShowResumePreview(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
              
              <div className="overflow-auto">
                {renderFormattedResume()}
              </div>
              
              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <button
                  className="btn btn-secondary"
                  onClick={handleDownloadResume}
                >
                  Download as Text
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleDownloadWord}
                >
                  Download as Word
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleDownloadPDF}
                >
                  Download as PDF
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handlePrintResume}
                >
                  Print Resume
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowResumePreview(false)}
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

export default AIResumeGenerator; 