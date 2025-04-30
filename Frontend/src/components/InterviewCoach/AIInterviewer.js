import React, { useState, useEffect, useRef } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import Button from '../Button';

const AIInterviewer = ({ interviewData, onComplete }) => {
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [avatar, setAvatar] = useState({
    expression: 'neutral', // neutral, smile, thinking
    speaking: false
  });
  
  // Add timing metrics
  const [answerTimes, setAnswerTimes] = useState([]);
  const [currentAnswerStartTime, setCurrentAnswerStartTime] = useState(null);
  const [interviewStartTime, setInterviewStartTime] = useState(null);
  const [interviewEndTime, setInterviewEndTime] = useState(null);
  
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  
  // Initialize the interview
  useEffect(() => {
    const generateInterviewQuestions = async () => {
      try {
        setIsLoading(true);
        // Create a unique session ID
        const newSessionId = `session_${Date.now()}_${auth.currentUser.uid}`;
        setSessionId(newSessionId);
        
        // Define the number of questions based on interview duration
        const numQuestions = Math.max(3, Math.floor(interviewData.preferences.interviewDuration / 5));
        
        // First pass: Generate role-specific context and question categories
        const contextResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are an industry expert who deeply understands different professional roles and what makes a candidate successful. You will provide context for generating challenging and realistic interview questions.'
              },
              {
                role: 'user',
                content: `I need contextual information for interviewing a ${interviewData.experienceLevel} level ${interviewData.jobTitle} in the ${interviewData.industry} industry. 
                
What are:
1. The 3-5 most important technical skills for this role
2. The 3-5 most important soft skills for this role
3. The 3 most challenging aspects of this role
4. The 3 most common pitfalls for candidates interviewing for this role
5. 3-4 categories of questions that would best evaluate a candidate for this role

Format your response as a JSON object with these 5 keys.`
              }
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' }
          })
        });
        
        let roleContext = {};
        if (contextResponse.ok) {
          const contextData = await contextResponse.json();
          roleContext = JSON.parse(contextData.choices[0].message.content);
        }
        
        // Generate sample questions directly to avoid API issues
        const sampleQuestions = generateSampleQuestions(
          interviewData.jobTitle,
          interviewData.industry,
          interviewData.interviewType,
          interviewData.targetSkills,
          numQuestions
        );
        
        // If not in development, try the API call
        let generatedQuestions = sampleQuestions;
        
        try {
          // Second pass: Generate specific questions based on the context and the user's requirements
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: 'gpt-3.5-turbo',
              messages: [
                {
                  role: 'system',
                  content: `You are an expert interviewer who creates challenging, realistic, and role-specific questions. Your questions should deeply probe a candidate's knowledge and experience, requiring thoughtful and detailed responses.`
                },
                {
                  role: 'user',
                  content: `Create ${numQuestions} ${interviewData.interviewType} interview questions for a ${interviewData.experienceLevel} level ${interviewData.jobTitle} position in the ${interviewData.industry} industry. 
                  
Focus on evaluating these skills specified by the user: ${interviewData.targetSkills.join(', ')}.
The questions should be at ${interviewData.preferences.questionDifficulty} difficulty level.

Use this additional context for the role:
${JSON.stringify(roleContext, null, 2)}

Requirements:
1. Make questions specific to the role and industry, not generic
2. Include questions that test technical knowledge appropriate for the role
3. Include questions that assess problem-solving in relevant scenarios
4. Make the questions challenging enough to distinguish strong candidates
5. Avoid yes/no questions - require detailed explanations
6. For technical roles, include specific technical questions related to the field
7. For management roles, include questions about leadership challenges
8. For creative roles, include questions that evaluate innovative thinking

Format your response as a JSON object with a "questions" array. Each question should have an "id" (numeric), "question" (string), and "skill" (one of the specified skills).`
                }
              ],
              temperature: 0.7,
              response_format: { type: 'json_object' }
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            const parsedContent = JSON.parse(data.choices[0].message.content);
            if (parsedContent.questions && Array.isArray(parsedContent.questions) && parsedContent.questions.length > 0) {
              generatedQuestions = parsedContent.questions;
            }
          }
        } catch (apiError) {
          console.warn('Error using OpenAI API, falling back to sample questions:', apiError);
          // Continue with sample questions if API fails
        }
        
        // Save the session and questions to Firestore
        const sessionDoc = {
          userId: auth.currentUser.uid,
          jobTitle: interviewData.jobTitle,
          industry: interviewData.industry,
          experienceLevel: interviewData.experienceLevel,
          interviewType: interviewData.interviewType,
          targetSkills: interviewData.targetSkills,
          preferences: interviewData.preferences,
          questions: generatedQuestions,
          answers: [],
          createdAt: serverTimestamp(),
          status: 'in-progress'
        };
        
        await setDoc(doc(db, 'interviewSessions', newSessionId), sessionDoc);
        
        setQuestions(generatedQuestions);
        setCurrentQuestion(generatedQuestions[0]);
        setIsLoading(false);
      } catch (err) {
        console.error('Error generating questions:', err);
        setError('Failed to generate interview questions. Please try again.');
        setIsLoading(false);
      }
    };

    generateInterviewQuestions();
    
    // Initialize Web Speech API if available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        setTranscript(finalTranscript || interimTranscript);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      setError('Speech recognition is not supported in your browser.');
    }
    
    // Initialize audio context for avatar animation
    if ('AudioContext' in window) {
      audioContextRef.current = new AudioContext();
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [interviewData]);

  // Generate sample questions to use as fallback
  const generateSampleQuestions = (jobTitle, industry, interviewType, skills, numQuestions) => {
    // Enhanced role-specific fallback questions
    const roleSpecificQuestions = {
      // Software Development roles
      'software developer': [
        "Walk me through your process for debugging a complex issue in a production environment.",
        "Explain how you would design a scalable architecture for a high-traffic web application.",
        "Describe a time when you had to optimize performance in an application. What approaches did you take?",
        "How do you stay updated with the latest programming languages and frameworks?",
        "Explain your approach to testing code and ensuring quality.",
        "How would you refactor legacy code while minimizing disruption?",
        "Describe a time when you had to make technical decisions that balanced speed of delivery with code quality."
      ],
      'frontend developer': [
        "Describe your experience with state management in modern frontend frameworks.",
        "How do you approach making web applications accessible?",
        "Walk me through your process for optimizing the performance of a slow-loading web page.",
        "How do you ensure cross-browser compatibility in your projects?",
        "Explain your approach to responsive design and mobile-first development.",
        "Describe a challenging UI component you built and how you approached it.",
        "How do you debug rendering performance issues in a web application?"
      ],
      'backend developer': [
        "Describe your experience designing and implementing APIs.",
        "How do you approach database schema design for scalability?",
        "Explain how you would handle high-traffic loads on a backend service.",
        "Walk me through how you would implement authentication and authorization in a web service.",
        "Describe your experience with microservices architecture.",
        "How do you ensure the security of backend systems you develop?",
        "Explain your approach to optimizing database queries for performance."
      ],
      
      // Product Management roles
      'product manager': [
        "Describe your process for prioritizing features in a product roadmap.",
        "How do you gather and incorporate user feedback into product decisions?",
        "Tell me about a time when you had to make a difficult decision between competing product priorities.",
        "How do you measure the success of a product feature after launch?",
        "Describe a time when you had to convince stakeholders to pursue a particular product direction.",
        "How do you balance technical constraints with business goals when planning a product?",
        "Walk me through how you would validate a new product idea before committing resources to it."
      ],
      
      // Marketing roles
      'marketing manager': [
        "Describe your approach to developing a comprehensive marketing strategy for a new product.",
        "How do you measure and analyze the effectiveness of marketing campaigns?",
        "Tell me about a marketing campaign you led that didn't meet expectations. What did you learn?",
        "How do you identify and target specific customer segments?",
        "Describe your experience with digital marketing channels and how you optimize them.",
        "How do you approach content marketing to drive engagement and conversions?",
        "Explain how you would allocate a marketing budget across different channels and initiatives."
      ],
      
      // Design roles
      'ux designer': [
        "Walk me through your design process from requirements gathering to final deliverables.",
        "How do you advocate for the user when facing business or technical constraints?",
        "Describe a situation where you had to redesign an existing product feature based on user feedback.",
        "How do you approach user research and incorporate findings into your designs?",
        "Tell me about a time when you had to make design compromises. How did you handle it?",
        "How do you ensure your designs are accessible to all users?",
        "Describe how you collaborate with developers to ensure your designs are implemented correctly."
      ],
      
      // Data Science roles
      'data scientist': [
        "Explain your approach to cleaning and preprocessing messy data sets.",
        "How do you evaluate the performance of a machine learning model?",
        "Describe a challenging data science project you worked on and how you approached it.",
        "How do you communicate complex analytical findings to non-technical stakeholders?",
        "Explain how you would handle a classification problem with highly imbalanced classes.",
        "Describe your experience with feature engineering and selection.",
        "How do you ensure that your data analysis is free from bias?"
      ],
      
      // Leadership roles
      'manager': [
        "Describe your approach to managing a team through a difficult organizational change.",
        "How do you handle performance issues with team members?",
        "Tell me about a time when you had to make an unpopular decision as a leader.",
        "How do you foster a culture of innovation and continuous improvement in your team?",
        "Describe your approach to delegating tasks and responsibilities.",
        "How do you handle conflicts between team members?",
        "Explain your process for setting goals and measuring performance for your team."
      ]
    };

    // Generic questions by interview type
    const questionsByType = {
      behavioral: [
        "Tell me about a time when you faced a challenging situation at work and how you overcame it.",
        "Describe a situation where you had to work with a difficult team member. How did you handle it?",
        "Give an example of a goal you set for yourself and how you achieved it.",
        "Tell me about a time you had to learn something quickly. What approach did you take?",
        "Describe a situation where you had to make an important decision with limited information.",
        "Tell me about a time when you failed. How did you handle it?",
        "Give an example of how you've handled criticism of your work.",
        "Describe a situation where you had to persuade someone to see things your way."
      ],
      technical: [
        `What specific ${jobTitle} skills do you think are most important for success in this role?`,
        `How do you stay updated with the latest trends and technologies in ${industry}?`,
        `Describe a complex technical problem you've solved. What was your approach?`,
        `How would you explain a complex ${jobTitle} concept to someone with no technical background?`,
        `What technical tools or software are you most proficient with, and how have you used them?`,
        `Tell me about a project where you had to learn a new technology quickly.`,
        `How do you ensure quality in your technical work?`,
        `Describe your experience with [relevant technology/methodology].`
      ],
      situational: [
        `If assigned to multiple projects with competing deadlines, how would you prioritize your work?`,
        `How would you handle a situation where you disagree with your manager's decision?`,
        `If you noticed a colleague was struggling with their workload, what would you do?`,
        `Imagine you discovered a flaw in your team's process that no one else has noticed. How would you address it?`,
        `How would you handle a situation where client expectations exceed what can realistically be delivered?`,
        `What would you do if you were assigned a task but weren't given clear instructions?`,
        `How would you react if your carefully planned project suddenly changed direction?`,
        `If you had to implement an unpopular change, how would you get buy-in from your team?`
      ],
      case: [
        `Our company is facing [common industry challenge]. How would you approach solving this problem?`,
        `We need to reduce costs by 15% while maintaining quality. What strategies would you implement?`,
        `How would you develop a new market strategy for our main product?`,
        `We're launching a new service in an already crowded market. How would you help us stand out?`,
        `What metrics would you track to measure success in this role?`,
        `How would you improve our customer retention rate?`,
        `If our main competitor lowered their prices significantly, how should we respond?`,
        `How would you reorganize our team structure to improve efficiency?`
      ],
      panel: [
        "What unique skills or perspectives would you bring to our team?",
        "Where do you see yourself professionally in five years?",
        "What do you consider your greatest professional achievement and why?",
        "What attracted you to this role and our company specifically?",
        "How would your previous colleagues describe your work style?",
        "What type of work environment brings out your best performance?",
        "What leadership style do you respond to best?",
        "How do you handle pressure or stressful situations?"
      ]
    };
    
    // Get appropriate questions based on role and interview type
    const lowercaseJobTitle = jobTitle.toLowerCase();
    const roleQuestions = [];
    
    // Find the most relevant role
    for (const role in roleSpecificQuestions) {
      if (lowercaseJobTitle.includes(role) || role.includes(lowercaseJobTitle)) {
        roleQuestions.push(...roleSpecificQuestions[role]);
        break;
      }
    }
    
    // If no specific role found, find by industry
    if (roleQuestions.length === 0) {
      if (industry.toLowerCase().includes('tech') || industry.toLowerCase().includes('software')) {
        roleQuestions.push(...roleSpecificQuestions['software developer']);
      } else if (industry.toLowerCase().includes('market')) {
        roleQuestions.push(...roleSpecificQuestions['marketing manager']);
      } else if (industry.toLowerCase().includes('design')) {
        roleQuestions.push(...roleSpecificQuestions['ux designer']);
      } else {
        // Default to manager for any other industry
        roleQuestions.push(...roleSpecificQuestions['manager']);
      }
    }
    
    // Add interview type questions to the mix
    const relevantQuestions = [
      ...roleQuestions,
      ...(questionsByType[interviewType] || questionsByType.behavioral)
    ];
    
    // Generate the questions array
    const result = [];
    const usedIndices = new Set();
    
    for (let i = 0; i < numQuestions && i < skills.length * 2; i++) {
      // Try to evenly distribute skills across questions
      const skillIndex = i % skills.length;
      const skill = skills[skillIndex];
      
      // Find an unused question index
      let questionIndex;
      do {
        questionIndex = Math.floor(Math.random() * relevantQuestions.length);
      } while (usedIndices.has(questionIndex) && usedIndices.size < relevantQuestions.length);
      
      // If all questions are used, just reuse them
      usedIndices.add(questionIndex);
      
      result.push({
        id: i + 1,
        question: relevantQuestions[questionIndex],
        skill: skill
      });
    }
    
    return result;
  };

  const startSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
      if (!currentAnswerStartTime) {
        setCurrentAnswerStartTime(Date.now());
      }
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const startInterview = () => {
    setIsInterviewActive(true);
    setInterviewStartTime(Date.now());
    speakQuestion(currentQuestion.question);
  };

  const speakQuestion = async (text) => {
    setAvatar(prev => ({ ...prev, speaking: true, expression: 'neutral' }));
    
    // Using Web Speech API for text-to-speech
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice (optional)
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => voice.lang === 'en-US');
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utterance.onend = () => {
        setAvatar(prev => ({ ...prev, speaking: false }));
        startSpeechRecognition();
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback if speech synthesis is not available
      setAvatar(prev => ({ ...prev, speaking: false }));
      startSpeechRecognition();
    }
  };

  const handleNextQuestion = async () => {
    // Record answer time
    const answerEndTime = Date.now();
    const answerDuration = currentAnswerStartTime ? (answerEndTime - currentAnswerStartTime) / 1000 : 0; // in seconds
    const updatedAnswerTimes = [...answerTimes, answerDuration];
    setAnswerTimes(updatedAnswerTimes);
    setCurrentAnswerStartTime(null);
    
    // Save current answer
    if (transcript.trim()) {
      const currentAnswer = {
        questionId: currentQuestion.id,
        question: currentQuestion.question,
        answer: transcript,
        skill: currentQuestion.skill,
        duration: answerDuration, // Add duration to the answer data
        wordCount: transcript.trim().split(/\s+/).length // Add word count
      };
      
      const updatedAnswers = [...userAnswers, currentAnswer];
      setUserAnswers(updatedAnswers);
      
      // Update the session in Firestore
      try {
        await setDoc(doc(db, 'interviewSessions', sessionId), {
          answers: updatedAnswers,
          lastUpdatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.error('Error saving answer:', err);
      }
    }
    
    stopSpeechRecognition();
    setTranscript('');
    
    // Check if interview is complete
    if (questionIndex >= questions.length - 1) {
      setInterviewEndTime(Date.now());
      completeInterview();
    } else {
      // Move to next question
      setQuestionIndex(questionIndex + 1);
      setCurrentQuestion(questions[questionIndex + 1]);
      setAvatar(prev => ({ ...prev, expression: 'thinking' }));
      
      // Wait a moment before asking the next question
      setTimeout(() => {
        speakQuestion(questions[questionIndex + 1].question);
      }, 1500);
    }
  };

  const completeInterview = async () => {
    stopSpeechRecognition();
    setIsInterviewActive(false);
    
    // Calculate interview metrics
    const totalInterviewTime = interviewEndTime ? (interviewEndTime - interviewStartTime) / 1000 / 60 : 0; // in minutes
    const averageAnswerTime = answerTimes.length > 0 ? answerTimes.reduce((sum, time) => sum + time, 0) / answerTimes.length : 0;
    const shortAnswers = userAnswers.filter(a => a.wordCount < 30).length;
    const longAnswers = userAnswers.filter(a => a.wordCount > 200).length;
    
    // Generate feedback from OpenAI
    try {
      setIsLoading(true);
      
      // First pass: Analyze each answer (even without API)
      const answerAnalysis = userAnswers.map(answer => {
        const wordCount = answer.wordCount;
        const duration = answer.duration;
        const hasDetails = wordCount > 50;
        const isStructured = answer.answer.split('.').length > 2; // Simple check for multiple sentences
        const mentionsExamples = answer.answer.toLowerCase().includes('example') || 
                                answer.answer.toLowerCase().includes('instance') ||
                                answer.answer.toLowerCase().includes('time when');
        
        const keyPhrases = [
          // Generic professional phrases
          'team', 'collaborate', 'challenge', 'solution', 'improve', 'develop', 'strategy', 'result',
          'success', 'learn', 'innovation', 'quality', 'problem', 'skill', 'experience',
          // Role-specific keywords based on job title
          ...extractRoleKeywords(interviewData.jobTitle, interviewData.industry)
        ];
        
        // Count how many key phrases are used
        const keyPhraseCount = keyPhrases.filter(phrase => 
          answer.answer.toLowerCase().includes(phrase.toLowerCase())
        ).length;
        
        // Simple quality score calculation
        const qualityScore = Math.min(10, Math.max(1, Math.floor(
          (hasDetails ? 2 : 0) + 
          (isStructured ? 2 : 0) + 
          (mentionsExamples ? 2 : 0) + 
          (Math.min(4, keyPhraseCount / 2)) +
          (wordCount > 30 && wordCount < 200 ? 2 : 0)
        )));
        
        return {
          questionId: answer.questionId,
          question: answer.question,
          skill: answer.skill,
          wordCount: wordCount,
          duration: duration,
          qualityScore: qualityScore,
          strengths: [
            ...(hasDetails ? ["Provided sufficient detail"] : []),
            ...(isStructured ? ["Had good structure"] : []),
            ...(mentionsExamples ? ["Used specific examples"] : []),
            ...(keyPhraseCount > 3 ? ["Used relevant professional terminology"] : []),
            ...(wordCount >= 100 && wordCount <= 180 ? ["Good answer length"] : [])
          ],
          weaknesses: [
            ...(!hasDetails ? ["Lacked necessary details"] : []),
            ...(!isStructured ? ["Answer was not well structured"] : []),
            ...(!mentionsExamples ? ["Did not provide concrete examples"] : []),
            ...(keyPhraseCount < 2 ? ["Did not use relevant professional terminology"] : []),
            ...(wordCount < 30 ? ["Answer was too brief"] : []),
            ...(wordCount > 200 ? ["Answer was excessively long"] : []),
            ...(duration < 15 ? ["Responded too quickly without sufficient thought"] : []),
            ...(duration > 180 ? ["Took too long to articulate response"] : [])
          ],
          demonstratesSkill: qualityScore >= 6
        };
      });
      
      // Second pass: Generate comprehensive feedback based on the analysis
      const skillScoresMap = {};
      interviewData.targetSkills.forEach(skill => {
        const relevantAnswers = answerAnalysis.filter(a => a.skill === skill);
        const avgScore = relevantAnswers.length > 0 
          ? relevantAnswers.reduce((sum, a) => sum + a.qualityScore, 0) / relevantAnswers.length
          : 5; // Default score
        skillScoresMap[skill] = Math.round(avgScore);
      });
      
      // Calculate overall score based on skill scores and metrics
      const skillScoresAvg = Object.values(skillScoresMap).reduce((sum, score) => sum + score, 0) / 
                         Object.values(skillScoresMap).length;
      
      // Adjust score based on interview metrics
      const timingPenalty = totalInterviewTime < interviewData.preferences.interviewDuration * 0.6 ? -1 : 
                           totalInterviewTime > interviewData.preferences.interviewDuration * 1.4 ? -0.5 : 0;
      
      const shortAnswerPenalty = shortAnswers > userAnswers.length * 0.3 ? -1 : 0;
      
      const overallScore = Math.max(1, Math.min(10, Math.round(skillScoresAvg + timingPenalty + shortAnswerPenalty)));
      
      // Identify common strengths and weaknesses
      const allStrengths = answerAnalysis.flatMap(a => a.strengths);
      const strengthsFrequency = {};
      allStrengths.forEach(s => {
        strengthsFrequency[s] = (strengthsFrequency[s] || 0) + 1;
      });
      
      const allWeaknesses = answerAnalysis.flatMap(a => a.weaknesses);
      const weaknessesFrequency = {};
      allWeaknesses.forEach(w => {
        weaknessesFrequency[w] = (weaknessesFrequency[w] || 0) + 1;
      });
      
      // Select top strengths and weaknesses
      const topStrengths = Object.entries(strengthsFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([strength]) => strength);
      
      const topWeaknesses = Object.entries(weaknessesFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([weakness]) => weakness);
      
      // Generate suggestions based on weaknesses
      const generalSuggestions = [
        "Practice more concise and focused responses to common questions",
        "Research the specific requirements of your target role",
        "Record yourself and listen to identify verbal tics or filler words"
      ];
      
      const weaknessSuggestions = {
        "Lacked necessary details": "For each answer, include at least one specific detail or metric that demonstrates your impact",
        "Answer was not well structured": "Structure your answers using the STAR method (Situation, Task, Action, Result)",
        "Did not provide concrete examples": "Prepare 5-7 strong examples from your experience that can be adapted to different questions",
        "Did not use relevant professional terminology": `Research and use industry-specific terminology for ${interviewData.industry} roles`,
        "Answer was too brief": "Aim for 60-90 second responses that include context, actions, and results",
        "Answer was excessively long": "Practice timing your responses and focus on the most relevant aspects of your experience",
        "Responded too quickly without sufficient thought": "Take a moment to gather your thoughts before answering challenging questions",
        "Took too long to articulate response": "Prepare and practice concise explanations of complex topics in advance"
      };
      
      const customSuggestions = topWeaknesses.map(weakness => 
        weaknessSuggestions[weakness] || `Work on improving areas where you showed weakness: ${weakness}`
      );
      
      // Generate role-specific advice
      const roleSpecificAdvice = generateRoleSpecificAdvice(
        interviewData.jobTitle, 
        interviewData.industry, 
        interviewData.experienceLevel,
        skillScoresMap
      );
      
      // Enhanced default feedback structure with personalized insights
      let feedback = {
        overallScore,
        skillScores: skillScoresMap,
        strengths: topStrengths.length > 0 ? topStrengths : ["You completed the interview and addressed all questions"],
        areasForImprovement: topWeaknesses.length > 0 ? topWeaknesses : [
          "Your answers need to be more specific and detailed",
          "Provide more concrete examples to support your claims",
          "Structure your responses using the STAR method for clarity"
        ],
        suggestions: [...customSuggestions, ...generalSuggestions].slice(0, 5),
        roleSpecificAdvice,
        interviewMetrics: {
          totalDuration: totalInterviewTime.toFixed(1), // in minutes
          expectedDuration: interviewData.preferences.interviewDuration,
          averageAnswerTime: averageAnswerTime.toFixed(1), // in seconds
          shortAnswers: shortAnswers,
          longAnswers: longAnswers,
          totalQuestions: questions.length,
          answeredQuestions: userAnswers.length
        },
        timeAssessment: assessInterviewTime(totalInterviewTime, interviewData.preferences.interviewDuration, averageAnswerTime)
      };
      
      // Try to get real feedback from OpenAI if not in development
      if (process.env.NODE_ENV !== 'development' && userAnswers.length > 0) {
        try {
          // First pass: Analyze the content of the answers
          const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: 'gpt-3.5-turbo',
              messages: [
                {
                  role: 'system',
                  content: `You are an expert at analyzing interview responses for ${interviewData.industry} roles. Provide a detailed analysis of each answer, focusing on substance, relevance, and depth.`
                },
                {
                  role: 'user',
                  content: `Analyze these interview responses for a ${interviewData.jobTitle} position (${interviewData.experienceLevel} level).
                  
For each answer, provide:
1. A concise evaluation of answer quality (1-10 scale)
2. The key strengths of the answer
3. The key weaknesses of the answer
4. Whether the answer demonstrates the skill it was intended to assess

Interview content:
${userAnswers.map(a => `Q: ${a.question}\nA: ${a.answer}\nSkill: ${a.skill}\nDuration: ${a.duration} seconds\nWord count: ${a.wordCount}`).join('\n\n')}

Format your response as a JSON object with an "answerAnalysis" array containing one object per answer.`
                }
              ],
              temperature: 0.7,
              response_format: { type: 'json_object' }
            })
          });
          
          let aiAnswerAnalysis = [];
          if (analysisResponse.ok) {
            const analysisData = await analysisResponse.json();
            const parsedAnalysis = JSON.parse(analysisData.choices[0].message.content);
            if (parsedAnalysis.answerAnalysis && Array.isArray(parsedAnalysis.answerAnalysis)) {
              aiAnswerAnalysis = parsedAnalysis.answerAnalysis;
            }
          }

          // Second pass: Generate comprehensive feedback based on the analysis
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: 'gpt-3.5-turbo',
              messages: [
                {
                  role: 'system',
                  content: `You are a strict and critical interview coach for ${interviewData.industry} industry positions. Your job is to provide honest, direct feedback that helps candidates grow, not to make them feel good. Be rigorous in your assessment and point out weaknesses clearly. Be specific about where they need to improve.`
                },
                {
                  role: 'user',
                  content: `Based on this detailed analysis of interview answers for a ${interviewData.jobTitle} position (${interviewData.experienceLevel} level), provide comprehensive feedback focused on these skills: ${interviewData.targetSkills.join(', ')}.
                  
The interview was expected to take ${interviewData.preferences.interviewDuration} minutes but actually took ${totalInterviewTime.toFixed(1)} minutes.
The average answer took ${averageAnswerTime.toFixed(1)} seconds.
${shortAnswers} answers were very brief (under 30 words).
${longAnswers} answers were overly long (over 200 words).

Here's the detailed analysis of each answer:
${JSON.stringify(aiAnswerAnalysis, null, 2)}

Provide feedback that is:
1. Specific to the ${interviewData.jobTitle} role in the ${interviewData.industry} industry
2. Customized for someone at the ${interviewData.experienceLevel} experience level
3. Honest about strengths and weaknesses, with a focus on improvement
4. Actionable with clear next steps
5. Based on industry expectations for this role

Return a JSON object with these fields: 
"overallScore" (1-10, be strict and realistic),
"skillScores" (object mapping each skill to a score 1-10),
"strengths" (array of specific strengths, limit to 2-3 if few strengths exist),
"areasForImprovement" (array of clear weaknesses, be specific and direct), 
"suggestions" (array of actionable recommendations for improvement),
"roleSpecificAdvice" (specific advice for advancing in this particular role), and
"timeAssessment" (specific critique of interview timing and answer length).`
                }
              ],
              temperature: 0.7,
              response_format: { type: 'json_object' }
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            const parsedFeedback = JSON.parse(data.choices[0].message.content);
            if (parsedFeedback.overallScore && parsedFeedback.skillScores) {
              // Integrate the API feedback with our metrics
              parsedFeedback.interviewMetrics = feedback.interviewMetrics;
              
              // If the API didn't provide a time assessment, use ours
              if (!parsedFeedback.timeAssessment) {
                parsedFeedback.timeAssessment = feedback.timeAssessment;
              }
              
              feedback = parsedFeedback;
            }
          }
        } catch (apiError) {
          console.warn('Error generating feedback from API, using default feedback:', apiError);
          // Continue with default feedback if API fails
        }
      }
      
      // Save feedback to Firestore
      await setDoc(doc(db, 'interviewSessions', sessionId), {
        status: 'completed',
        feedback,
        completedAt: serverTimestamp(),
        interviewDuration: totalInterviewTime,
        expectedDuration: interviewData.preferences.interviewDuration,
        averageAnswerTime: averageAnswerTime
      }, { merge: true });
      
      // Save to user's interview history
      await setDoc(doc(db, 'interviewFeedback', sessionId), {
        userId: auth.currentUser.uid,
        sessionId,
        jobTitle: interviewData.jobTitle,
        industry: interviewData.industry,
        feedback,
        createdAt: serverTimestamp(),
        interviewDuration: totalInterviewTime,
        expectedDuration: interviewData.preferences.interviewDuration
      });
      
      setIsLoading(false);
      
      // Pass feedback to parent component
      onComplete({
        sessionId,
        questions,
        answers: userAnswers,
        jobTitle: interviewData.jobTitle,
        interviewDuration: totalInterviewTime,
        expectedDuration: interviewData.preferences.interviewDuration,
        averageAnswerTime: averageAnswerTime
      }, feedback);
    } catch (err) {
      console.error('Error generating feedback:', err);
      setError('Failed to generate feedback. Please try again.');
      setIsLoading(false);
    }
  };

  // Function to assess interview timing
  const assessInterviewTime = (actual, expected, avgAnswerTime) => {
    let assessment = "";
    
    // If interview was too short
    if (actual < expected * 0.6) {
      assessment = `Your interview lasted only ${actual.toFixed(1)} minutes when it should have been closer to ${expected} minutes. This suggests your answers were too brief and lacked sufficient detail. In a real interview, this could indicate to the interviewer that you haven't prepared adequately or don't have enough relevant experience to discuss.`;
    } 
    // If interview was about right length
    else if (actual >= expected * 0.8 && actual <= expected * 1.2) {
      assessment = `Your interview timing was appropriate at ${actual.toFixed(1)} minutes for a ${expected}-minute interview.`;
    }
    // If interview was too long
    else if (actual > expected * 1.2) {
      assessment = `Your interview ran longer than expected at ${actual.toFixed(1)} minutes. While thorough answers are good, being overly verbose can indicate poor communication skills. Practice being more concise while still conveying all key points.`;
    }
    
    // Add assessment of average answer time
    if (avgAnswerTime < 20) {
      assessment += ` Your average answer was only ${avgAnswerTime.toFixed(1)} seconds, which is too brief. Aim for 60-90 seconds per answer to provide sufficient detail.`;
    } else if (avgAnswerTime > 180) {
      assessment += ` Your average answer was ${avgAnswerTime.toFixed(1)} seconds, which is too long. Practice being more concise and focused.`;
    }
    
    return assessment;
  };

  // Helper function to extract relevant keywords for a specific role
  const extractRoleKeywords = (jobTitle, industry) => {
    const title = jobTitle.toLowerCase();
    const ind = industry.toLowerCase();
    
    // Generic professional keywords first
    const keywords = ['communicate', 'stakeholder', 'manage', 'lead', 'execute'];
    
    // Software Development
    if (title.includes('developer') || title.includes('engineer') || title.includes('programmer') || 
        ind.includes('software') || ind.includes('tech')) {
      return [...keywords, 'code', 'algorithm', 'test', 'debug', 'architecture', 'api', 'framework', 
              'scalable', 'optimize', 'git', 'agile', 'sprint', 'technical', 'solution'];
    }
    
    // Product Management
    if (title.includes('product') || title.includes('pm')) {
      return [...keywords, 'roadmap', 'user', 'customer', 'feature', 'prioritize', 'sprint', 
              'backlog', 'vision', 'requirement', 'metric', 'kpi', 'data-driven', 'mvp'];
    }
    
    // Marketing
    if (title.includes('market') || ind.includes('market')) {
      return [...keywords, 'brand', 'campaign', 'roi', 'segment', 'channel', 'conversion', 
              'content', 'digital', 'social media', 'analytics', 'target', 'audience'];
    }
    
    // Design
    if (title.includes('design') || title.includes('ux') || title.includes('ui')) {
      return [...keywords, 'user', 'wireframe', 'prototype', 'usability', 'research', 
              'interface', 'experience', 'journey', 'persona', 'accessibility'];
    }
    
    // Data Science
    if (title.includes('data') || title.includes('analyst') || title.includes('scientist')) {
      return [...keywords, 'model', 'algorithm', 'analysis', 'visualization', 'statistics', 
              'machine learning', 'python', 'sql', 'regression', 'dataset', 'hypothesis'];
    }
    
    // Leadership/Management
    if (title.includes('manager') || title.includes('director') || title.includes('lead')) {
      return [...keywords, 'team', 'strategy', 'kpi', 'goal', 'mentor', 'delegate', 
              'budget', 'vision', 'process', 'performance', 'resource', 'growth'];
    }
    
    return keywords; // Return generic keywords if no specific match
  };
  
  // Helper function to generate role-specific advice based on job title and industry
  const generateRoleSpecificAdvice = (jobTitle, industry, experienceLevel, skillScores) => {
    const title = jobTitle.toLowerCase();
    const ind = industry.toLowerCase();
    const level = experienceLevel.toLowerCase();
    
    // Identify the weakest and strongest skills
    const skillEntries = Object.entries(skillScores);
    const weakestSkill = skillEntries.sort((a, b) => a[1] - b[1])[0]?.[0];
    const strongestSkill = skillEntries.sort((a, b) => b[1] - a[1])[0]?.[0];
    
    let advice = '';
    
    // Software Development
    if (title.includes('developer') || title.includes('engineer') || title.includes('programmer') || 
        ind.includes('software') || ind.includes('tech')) {
      
      advice = `As a ${experienceLevel} ${jobTitle}, focus on building a strong portfolio of work that demonstrates your technical abilities. `;
      
      if (level.includes('entry') || level.includes('junior')) {
        advice += `Contribute to open source projects to gain practical experience. Focus on mastering fundamental algorithms and data structures, and become proficient with at least one major framework. Your strongest skill appears to be ${strongestSkill}, while you should work more on ${weakestSkill}.`;
      } else if (level.includes('mid') || level.includes('senior')) {
        advice += `Work on architecting complete solutions and mentoring junior team members. Make sure you can clearly articulate technical decisions and trade-offs. Consider specializing in high-demand areas like cloud infrastructure, security, or performance optimization. Continue building on your strength in ${strongestSkill}, while addressing gaps in ${weakestSkill}.`;
      }
    }
    
    // Product Management
    else if (title.includes('product') || title.includes('pm')) {
      advice = `For a ${experienceLevel} Product Manager in ${industry}, success depends on balancing user needs with business objectives. `;
      
      if (level.includes('entry') || level.includes('junior')) {
        advice += `Build expertise in user research methods and develop strong analytical skills for data-driven decision making. Learn to write clear, detailed user stories and requirements. You demonstrate good ${strongestSkill}, but need to improve your ${weakestSkill}.`;
      } else if (level.includes('mid') || level.includes('senior')) {
        advice += `Focus on developing strategic product vision and strengthening cross-functional leadership. Work on quantifying product impact through key metrics and demonstrate your ability to prioritize features based on business value. Continue leveraging your strong ${strongestSkill}, while working on your ${weakestSkill} to become a more well-rounded product leader.`;
      }
    }
    
    // Marketing
    else if (title.includes('market') || ind.includes('market')) {
      advice = `As a ${experienceLevel} marketing professional, staying current with digital trends is essential. `;
      
      if (level.includes('entry') || level.includes('junior')) {
        advice += `Develop skills across various marketing channels and learn to analyze campaign metrics. Build a portfolio of marketing materials and campaigns you've contributed to. Your ${strongestSkill} is a good foundation, but you should focus more on developing your ${weakestSkill}.`;
      } else if (level.includes('mid') || level.includes('senior')) {
        advice += `Demonstrate your ability to develop comprehensive marketing strategies and show measurable results from past campaigns. Be prepared to discuss ROI and how you've optimized marketing spend. Your strength in ${strongestSkill} is valuable, but improving your ${weakestSkill} will make you more effective.`;
      }
    }
    
    // Design
    else if (title.includes('design') || title.includes('ux') || title.includes('ui')) {
      advice = `For a ${experienceLevel} designer, balancing creativity with business requirements is key. `;
      
      if (level.includes('entry') || level.includes('junior')) {
        advice += `Build a diverse portfolio that showcases your design process, not just final outputs. Learn the fundamentals of user research and usability testing. Your ${strongestSkill} shows promise, but you need considerable improvement in ${weakestSkill}.`;
      } else if (level.includes('mid') || level.includes('senior')) {
        advice += `Focus on how your design decisions impact business metrics and user satisfaction. Be prepared to lead design reviews and justify your choices with research and data. Continue leveraging your excellent ${strongestSkill}, while addressing your weakness in ${weakestSkill}.`;
      }
    }
    
    // Default for other roles
    else {
      advice = `For advancing in your ${jobTitle} career in the ${industry} industry, focus on building both technical expertise and soft skills. `;
      
      if (level.includes('entry') || level.includes('junior')) {
        advice += `Seek mentorship from more experienced professionals and take on projects that stretch your abilities. Your ${strongestSkill} is a good start, but work on improving your ${weakestSkill}.`;
      } else if (level.includes('mid') || level.includes('senior')) {
        advice += `Look for opportunities to lead initiatives and demonstrate strategic thinking. Quantify your achievements with specific metrics where possible. Your strength in ${strongestSkill} is valuable, but addressing your ${weakestSkill} will make you more effective.`;
      }
    }
    
    return advice;
  };

  const renderAvatar = () => {
    let expressionClass = 'neutral';
    if (avatar.expression === 'smile') expressionClass = 'smile';
    if (avatar.expression === 'thinking') expressionClass = 'thinking';
    
    return (
      <div className={`w-48 h-48 mx-auto mb-4 rounded-full relative overflow-hidden bg-blue-100 ${expressionClass}`}>
        {/* This is a placeholder for the avatar - you would replace with actual avatar implementation */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-6xl">
            {avatar.expression === 'neutral' && '😊'}
            {avatar.expression === 'smile' && '😄'}
            {avatar.expression === 'thinking' && '🤔'}
          </div>
          {avatar.speaking && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-3 bg-blue-500 rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-4 bg-blue-500 rounded-full animate-pulse delay-150"></div>
                <div className="w-2 h-3 bg-blue-500 rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-navy font-medium">Preparing your interview...</p>
        <p className="text-gray-500 text-sm">This may take a moment.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 text-red-500 mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-red-500 font-medium mb-4">{error}</p>
        <Button color="primary" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {!isInterviewActive ? (
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-navy mb-6">Ready to Start Your Interview</h2>
          <p className="text-gray-600 mb-8">
            Your virtual interviewer is ready. You'll be asked {questions.length} questions about {interviewData.jobTitle}.
            Speak clearly and take your time answering each question.
          </p>
          
          <div className="bg-offwhite p-4 rounded-lg mb-8">
            <h3 className="font-semibold text-navy mb-2">Interview Details:</h3>
            <ul className="text-gray-600 text-sm">
              <li><span className="font-medium">Position:</span> {interviewData.jobTitle}</li>
              <li><span className="font-medium">Industry:</span> {interviewData.industry}</li>
              <li><span className="font-medium">Experience Level:</span> {interviewData.experienceLevel}</li>
              <li><span className="font-medium">Interview Type:</span> {interviewData.interviewType}</li>
              <li><span className="font-medium">Duration:</span> ~{interviewData.preferences.interviewDuration} minutes</li>
            </ul>
          </div>
          
          <Button color="primary" onClick={startInterview}>
            Start Interview
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            Make sure your microphone is working and you're in a quiet environment.
          </p>
        </div>
      ) : (
        <div>
          <div className="text-center mb-6">
            <div className="mb-4">
              {renderAvatar()}
            </div>
            
            <div className="p-4 bg-white shadow-md rounded-lg">
              <h3 className="font-semibold text-navy mb-2">Question {questionIndex + 1} of {questions.length}</h3>
              <p className="text-gray-800 text-lg">{currentQuestion.question}</p>
              <p className="text-sm text-gray-500 mt-1">Skill: {currentQuestion.skill}</p>
            </div>
          </div>
          
          <div className="mb-8">
            <div className={`p-4 rounded-lg min-h-[100px] ${isListening ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Your Answer:</span>
                {isListening && (
                  <span className="text-xs py-1 px-2 bg-green-100 text-green-800 rounded-full flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                    Listening...
                  </span>
                )}
              </div>
              <p className="text-gray-700">{transcript || <span className="text-gray-400">Speak your answer...</span>}</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              {isListening ? (
                <Button 
                  color="secondary" 
                  onClick={stopSpeechRecognition}
                >
                  Pause Microphone
                </Button>
              ) : (
                <Button 
                  color="primary" 
                  onClick={startSpeechRecognition}
                >
                  Resume Microphone
                </Button>
              )}
            </div>
            
            <Button 
              color="primary" 
              onClick={handleNextQuestion}
            >
              {questionIndex < questions.length - 1 ? 'Next Question' : 'Complete Interview'}
            </Button>
          </div>
          
          <div className="mt-8 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Progress: {((questionIndex + 1) / questions.length * 100).toFixed(0)}%</span>
              <span>Questions remaining: {questions.length - (questionIndex + 1)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-primary h-2 rounded-full" 
                style={{ width: `${((questionIndex + 1) / questions.length * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInterviewer; 