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
        
        if (process.env.NODE_ENV !== 'development') {
          try {
            // Call OpenAI API to generate interview questions
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
                    content: 'You are an expert interviewer. Generate interview questions with their associated skills to evaluate.'
                  },
                  {
                    role: 'user',
                    content: `Create ${numQuestions} ${interviewData.interviewType} interview questions for a ${interviewData.experienceLevel} level ${interviewData.jobTitle} position in the ${interviewData.industry} industry. Focus on evaluating these skills: ${interviewData.targetSkills.join(', ')}. The questions should be at ${interviewData.preferences.questionDifficulty} difficulty level. Format your response as a JSON object with a "questions" array. Each question should have an "id" (numeric), "question" (string), and "skill" (one of the specified skills).`
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
    
    // Get appropriate questions based on interview type
    const relevantQuestions = questionsByType[interviewType] || questionsByType.behavioral;
    
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
      
      // Enhanced default feedback structure
      let feedback = {
        overallScore: 6, // Starting with a tougher baseline score
        skillScores: {},
        strengths: [
          "You completed the interview and addressed all questions"
        ],
        areasForImprovement: [
          "Your answers need to be more specific and detailed",
          "Provide more concrete examples to support your claims",
          "Structure your responses using the STAR method for clarity"
        ],
        suggestions: [
          "Practice more concise and focused responses to common questions",
          "Research the specific requirements of your target role",
          "Record yourself and listen to identify verbal tics or filler words"
        ],
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
      
      // Add more critical skill scores
      interviewData.targetSkills.forEach(skill => {
        feedback.skillScores[skill] = Math.min(7, Math.floor(Math.random() * 4) + 4); // More challenging scores between 4-7
      });
      
      // Add time-based critique if interview was too short
      if (totalInterviewTime < interviewData.preferences.interviewDuration * 0.6) {
        feedback.areasForImprovement.unshift("Your interview was much shorter than expected, suggesting your answers lacked sufficient detail");
        feedback.suggestions.unshift("Aim to spend more time elaborating on key points and providing evidence for your claims");
      }
      
      // Add critique for very short answers
      if (shortAnswers > userAnswers.length * 0.3) {
        feedback.areasForImprovement.push("Several of your answers were too brief and lacked necessary detail");
        feedback.suggestions.push("For each point you make, back it up with a specific example");
      }
      
      // Try to get real feedback from OpenAI if not in development
      if (process.env.NODE_ENV !== 'development' && userAnswers.length > 0) {
        try {
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
                  content: `Analyze these interview answers for a ${interviewData.jobTitle} position (${interviewData.experienceLevel} level) and provide detailed, critical feedback focused on these skills: ${interviewData.targetSkills.join(', ')}. 
                  
The interview was expected to take ${interviewData.preferences.interviewDuration} minutes but actually took ${totalInterviewTime.toFixed(1)} minutes.
The average answer took ${averageAnswerTime.toFixed(1)} seconds.
${shortAnswers} answers were very brief (under 30 words).
${longAnswers} answers were overly long (over 200 words).

Interview content:
${userAnswers.map(a => `Q: ${a.question}\nA: ${a.answer}\nSkill: ${a.skill}\nDuration: ${a.duration} seconds\nWord count: ${a.wordCount}`).join('\n\n')}

Be honest and direct about weaknesses. Don't sugarcoat your critique. Return a JSON object with these fields: 
"overallScore" (1-10, be strict and realistic),
"skillScores" (object mapping each skill to a score 1-10),
"strengths" (array of specific strengths, limit to 2-3 if few strengths exist),
"areasForImprovement" (array of clear weaknesses, be specific and direct), 
"suggestions" (array of actionable recommendations for improvement), and 
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