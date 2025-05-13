import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import InterviewSurvey from '../components/InterviewCoach/InterviewSurvey';
import AIInterviewer from '../components/InterviewCoach/AIInterviewer';
import FeedbackDisplay from '../components/InterviewCoach/FeedbackDisplay';

const InterviewCoach = () => {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [stage, setStage] = useState('survey'); // 'survey', 'interview', 'feedback'
  const [interviewData, setInterviewData] = useState({
    jobTitle: '',
    industry: '',
    experienceLevel: 'entry',
    interviewType: 'behavioral',
    targetSkills: [],
    preferences: {
      interviewDuration: 15,
      questionDifficulty: 'medium',
      voicePreference: null,
    }
  });
  const [interviewSession, setInterviewSession] = useState(null);
  const [interviewFeedback, setInterviewFeedback] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!auth.currentUser) return;
      
      try {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
        
        // Check if user has existing interview preferences
        const prefDocRef = doc(db, 'userInterviewPreferences', auth.currentUser.uid);
        const prefDoc = await getDoc(prefDocRef);
        
        if (prefDoc.exists()) {
          setInterviewData(prevData => ({
            ...prevData,
            ...prefDoc.data()
          }));
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const saveInterviewPreferences = async () => {
    if (!auth.currentUser) return;
    
    try {
      const prefDocRef = doc(db, 'userInterviewPreferences', auth.currentUser.uid);
      // Make sure the entire interviewData object is saved including voice preference
      await setDoc(prefDocRef, {
        jobTitle: interviewData.jobTitle,
        industry: interviewData.industry,
        experienceLevel: interviewData.experienceLevel,
        interviewType: interviewData.interviewType,
        targetSkills: interviewData.targetSkills,
        preferences: {
          interviewDuration: interviewData.preferences.interviewDuration,
          questionDifficulty: interviewData.preferences.questionDifficulty,
          voicePreference: interviewData.preferences.voicePreference,
        }
      }, { merge: true });
    } catch (error) {
      console.error('Error saving interview preferences:', error);
    }
  };

  const handleSurveySubmit = async (surveyData) => {
    setInterviewData(prevData => ({
      ...prevData,
      ...surveyData
    }));
    
    await saveInterviewPreferences();
    setStage('interview');
  };

  const handleInterviewComplete = (sessionData, feedback) => {
    setInterviewSession(sessionData);
    setInterviewFeedback(feedback);
    setStage('feedback');
  };

  const startNewInterview = () => {
    setStage('survey');
    setInterviewSession(null);
    setInterviewFeedback(null);
  };

  // AIIcon for the section
  const AIIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
    </svg>
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-navy border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-navy font-serif">Loading interview coach...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-navy">AI Interview Coach</h1>
          {stage === 'survey' && (
            <Link to="/interview-history" className="text-navy hover:text-primary">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>View Interview History</span>
              </div>
            </Link>
          )}
          <span className="text-primary">
            <AIIcon />
          </span>
        </div>
        <p className="text-gray-600">
          Practice your interview skills with our AI-powered interview coach. Get personalized feedback and improve your chances of landing your dream job.
        </p>
      </div>

      <div className="card p-6 bg-white shadow-md rounded-lg mb-8">
        {stage === 'survey' && (
          <InterviewSurvey 
            initialData={interviewData} 
            onSubmit={handleSurveySubmit} 
          />
        )}

        {stage === 'interview' && (
          <AIInterviewer 
            interviewData={interviewData}
            onComplete={handleInterviewComplete}
          />
        )}

        {stage === 'feedback' && (
          <FeedbackDisplay 
            feedback={interviewFeedback} 
            session={interviewSession}
            onStartNew={startNewInterview}
          />
        )}
      </div>
    </div>
  );
};

export default InterviewCoach; 