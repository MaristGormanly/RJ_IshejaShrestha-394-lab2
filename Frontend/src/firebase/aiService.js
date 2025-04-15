import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';
import { v4 as uuidv4 } from 'uuid';

// Function to call OpenAI API
const callOpenAI = async (prompt, model = 'gpt-4', maxTokens = 1000) => {
  try {
    // Get the OpenAI API key from environment variables
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key is missing. Please add REACT_APP_OPENAI_API_KEY to your environment variables.');
    }

    // Direct call to OpenAI API using chat completions endpoint
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a professional career advisor and resume writer.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw error;
  }
};

// Generate a resume based on user profile and job description
export const generateResume = async (userId, profileData, jobDescription, options = {}) => {
  try {
    const {
      tone = 'professional',
      format = 'standard',
      focus = 'skills',
    } = options;
    
    // Extract relevant information from profile
    const { 
      personal = {}, 
      education = [], 
      experience = [], 
      skills = [], 
      achievements = [],
      summary = '',
      certifications = [],
      languages = [],
      projects = []
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
    
    if (summary) {
      prompt += `PROFESSIONAL SUMMARY:\n${summary}\n\n`;
    }
    
    prompt += `EDUCATION:\n`;
    education.forEach(edu => {
      prompt += `- ${edu.degree} in ${edu.fieldOfStudy} from ${edu.institution} (${edu.startDate} - ${edu.endDate || 'Present'})\n`;
      if (edu.gpa) prompt += `  GPA: ${edu.gpa}\n`;
    });
    prompt += `\n`;
    
    prompt += `WORK EXPERIENCE:\n`;
    experience.forEach(exp => {
      prompt += `- ${exp.position} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})\n`;
      prompt += `  ${exp.description}\n`;
    });
    prompt += `\n`;
    
    prompt += `SKILLS:\n${skills.join(', ')}\n\n`;
    
    if (certifications.length > 0) {
      prompt += `CERTIFICATIONS:\n`;
      certifications.forEach(cert => {
        prompt += `- ${cert}\n`;
      });
      prompt += `\n`;
    }
    
    if (achievements.length > 0) {
      prompt += `ACHIEVEMENTS:\n`;
      achievements.forEach(achievement => {
        prompt += `- ${achievement}\n`;
      });
      prompt += `\n`;
    }
    
    if (languages.length > 0) {
      prompt += `LANGUAGES:\n${languages.join(', ')}\n\n`;
    }
    
    if (projects.length > 0) {
      prompt += `PROJECTS:\n`;
      projects.forEach(project => {
        prompt += `- ${project}\n`;
      });
      prompt += `\n`;
    }
    
    prompt += `Please generate a professional resume with the following specifications:\n`;
    prompt += `- Use a clean, industry-standard resume format similar to traditional ATS-friendly resumes\n`;
    prompt += `- Format the resume with clear section headers (e.g., EDUCATION, EXPERIENCE, SKILLS, etc.)\n`;
    prompt += `- Use bullet points for achievements and responsibilities\n`;
    prompt += `- Include the person's name at the top, followed by contact information (email, phone, location)\n`;
    prompt += `- Under each work experience, include 3-5 bullet points that quantify achievements when possible\n`;
    prompt += `- Format dates consistently (Month Year format is preferred)\n`;
    prompt += `- Organize skills into relevant categories if there are many\n`;
    prompt += `- Tone: ${tone}\n`;
    prompt += `- Focus on: ${focus}\n`;
    prompt += `- Tailor the content to highlight relevant skills and experience for the job description\n`;
    prompt += `- Use strong action verbs to begin bullet points\n`;
    prompt += `- Be specific and concise in descriptions\n`;
    prompt += `- Quantify achievements with numbers where possible (%, $, time saved, etc.)\n`;
    prompt += `- Ensure all bullet points are relevant to the target job\n`;
    prompt += `- Make the candidate look like an excellent match for the job description\n`;
    prompt += `- Order sections in the most appropriate way for this specific job\n`;
    prompt += `- Keep the entire resume to one page if possible, or two pages maximum\n`;
    prompt += `- Format the resume so it could be directly copied into a text editor and maintain clean formatting\n`;
    prompt += `- Use spacing and formatting that would translate well to a Word document or PDF\n`;
    prompt += `- Use Markdown formatting for section headers (e.g., ### EXPERIENCE)\n`;
    prompt += `- Use --- to create section dividers where appropriate\n\n`;
    
    prompt += `IMPORTANT FORMATTING INSTRUCTIONS:\n`;
    prompt += `- DO NOT include any commentary, notes, or explanations at the end of the resume\n`;
    prompt += `- DO NOT include phrases like "This resume is designed to..." or "Feel free to..."\n`;
    prompt += `- The output should ONLY be the resume itself, with no additional text or comments\n`;
    prompt += `- The resume is a finished product, not a draft or suggestion\n`;
    
    // Adding job description analysis request
    prompt += `IMPORTANT: Analyze the job description first, identify key requirements, skills, and qualifications, and ensure the resume highlights matching skills and experiences in a way that makes the candidate look well-qualified for the role.\n`;
    
    // Call OpenAI API
    const resumeContent = await callOpenAI(prompt, 'gpt-4', 2000);
    
    // Store the generated resume in Firestore
    const docId = uuidv4();
    const docRef = doc(db, 'ai-generated', docId);
    
    const docData = {
      id: docId,
      userId,
      type: 'resume',
      content: resumeContent,
      jobDescription,
      options,
      createdAt: serverTimestamp(),
    };
    
    await setDoc(docRef, docData);
    
    let downloadUrl = null;
    
    // Try to store in Firebase Storage, but continue even if it fails
    try {
      // Store in storage for downloading
      const storageRef = ref(storage, `ai-generated/${userId}/${docId}.txt`);
      await uploadString(storageRef, resumeContent);
      downloadUrl = await getDownloadURL(storageRef);
      
      // Update the document with the download URL
      await setDoc(docRef, { downloadUrl }, { merge: true });
    } catch (storageError) {
      console.error('Storage upload failed, but document was saved:', storageError);
      // Continue without the download URL
    }
    
    return {
      id: docId,
      content: resumeContent,
      downloadUrl
    };
  } catch (error) {
    console.error('Error generating resume:', error);
    throw error;
  }
};

// Generate a cover letter based on user profile and job description
export const generateCoverLetter = async (userId, profileData, jobDescription, options = {}) => {
  try {
    const {
      tone = 'professional',
      companyName = '',
      positionTitle = '',
      keyPoints = [],
    } = options;
    
    // Extract relevant information from profile
    const { 
      personal = {}, 
      experience = [], 
      skills = [],
      summary = '',
      achievements = [],
      certifications = [],
      projects = []
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
    
    if (summary) {
      prompt += `PROFESSIONAL SUMMARY:\n${summary}\n\n`;
    }
    
    prompt += `RELEVANT EXPERIENCE:\n`;
    experience.slice(0, 3).forEach(exp => {
      prompt += `- ${exp.position} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})\n`;
      prompt += `  ${exp.description}\n`;
    });
    prompt += `\n`;
    
    prompt += `KEY SKILLS:\n${skills.join(', ')}\n\n`;
    
    if (achievements.length > 0) {
      prompt += `KEY ACHIEVEMENTS:\n`;
      achievements.slice(0, 3).forEach(achievement => {
        prompt += `- ${achievement}\n`;
      });
      prompt += `\n`;
    }
    
    if (certifications.length > 0) {
      prompt += `RELEVANT CERTIFICATIONS:\n`;
      certifications.slice(0, 3).forEach(cert => {
        prompt += `- ${cert}\n`;
      });
      prompt += `\n`;
    }
    
    if (projects.length > 0) {
      prompt += `NOTABLE PROJECTS:\n`;
      projects.slice(0, 2).forEach(project => {
        prompt += `- ${project}\n`;
      });
      prompt += `\n`;
    }
    
    if (keyPoints.length > 0) {
      prompt += `KEY POINTS TO EMPHASIZE:\n`;
      keyPoints.forEach(point => {
        prompt += `- ${point}\n`;
      });
      prompt += `\n`;
    }
    
    prompt += `Please generate a ${tone} cover letter that:\n`;
    prompt += `- Is addressed to the hiring manager at ${companyName}\n`;
    prompt += `- Begins with a compelling introduction\n`;
    prompt += `- Highlights relevant experience and skills for the ${positionTitle} position\n`;
    prompt += `- Demonstrates enthusiasm for the role and company\n`;
    prompt += `- Includes a strong closing paragraph\n`;
    prompt += `- Is written in a ${tone} tone\n`;
    
    // Call OpenAI API
    const coverLetterContent = await callOpenAI(prompt, 'gpt-4', 1500);
    
    // Store the generated cover letter in Firestore
    const docId = uuidv4();
    const docRef = doc(db, 'ai-generated', docId);
    
    const docData = {
      id: docId,
      userId,
      type: 'cover-letter',
      content: coverLetterContent,
      jobDescription,
      companyName,
      positionTitle,
      options,
      createdAt: serverTimestamp(),
    };
    
    await setDoc(docRef, docData);
    
    let downloadUrl = null;
    
    // Try to store in Firebase Storage, but continue even if it fails
    try {
      // Store in storage for downloading
      const storageRef = ref(storage, `ai-generated/${userId}/${docId}.txt`);
      await uploadString(storageRef, coverLetterContent);
      downloadUrl = await getDownloadURL(storageRef);
      
      // Update the document with the download URL
      await setDoc(docRef, { downloadUrl }, { merge: true });
    } catch (storageError) {
      console.error('Storage upload failed, but document was saved:', storageError);
      // Continue without the download URL
    }
    
    return {
      id: docId,
      content: coverLetterContent,
      downloadUrl
    };
  } catch (error) {
    console.error('Error generating cover letter:', error);
    throw error;
  }
};

// Analyze a job description to extract key skills and requirements
export const analyzeJobDescription = async (jobDescription) => {
  try {
    const prompt = `Analyze the following job description and extract the following information:
1. Required skills
2. Preferred skills
3. Experience level
4. Key responsibilities
5. Company values
6. Industry-specific keywords

Job Description:
${jobDescription}

Please format your response as a JSON object with these 6 categories.`;
    
    const analysisText = await callOpenAI(prompt, 'gpt-4', 1000);
    let analysis;
    
    try {
      analysis = JSON.parse(analysisText);
    } catch (e) {
      // If OpenAI doesn't return proper JSON, attempt to parse it differently
      // or just return the raw text
      analysis = {
        rawText: analysisText,
        error: "Failed to parse as JSON"
      };
    }
    
    return analysis;
  } catch (error) {
    console.error('Error analyzing job description:', error);
    throw error;
  }
};

export default {
  generateResume,
  generateCoverLetter,
  analyzeJobDescription
}; 