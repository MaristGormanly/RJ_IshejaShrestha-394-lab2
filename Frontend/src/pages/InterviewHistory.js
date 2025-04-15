import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import Button from '../components/Button';

const InterviewHistory = () => {
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState([]);
  const [expandedSession, setExpandedSession] = useState(null);

  useEffect(() => {
    const fetchInterviewHistory = async () => {
      if (!auth.currentUser) return;
      
      try {
        const q = query(
          collection(db, 'interviewFeedback'),
          where('userId', '==', auth.currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const interviewData = [];
        
        querySnapshot.forEach((doc) => {
          interviewData.push({ id: doc.id, ...doc.data() });
        });
        
        setInterviews(interviewData);
      } catch (error) {
        console.error('Error fetching interview history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInterviewHistory();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-blue-600';
    if (score >= 4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score) => {
    if (score >= 8) return 'bg-green-100';
    if (score >= 6) return 'bg-blue-100';
    if (score >= 4) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-navy">Interview History</h1>
          <Link to="/interview-coach">
            <Button color="primary">New Interview</Button>
          </Link>
        </div>
        <p className="text-gray-600">
          Review your past interview sessions and feedback to track your progress.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-navy font-medium">Loading interview history...</p>
        </div>
      ) : interviews.length > 0 ? (
        <div className="space-y-6">
          {interviews.map((interview) => (
            <div 
              key={interview.id} 
              className="bg-white shadow-md rounded-lg overflow-hidden"
            >
              <div 
                className="p-6 cursor-pointer"
                onClick={() => setExpandedSession(expandedSession === interview.id ? null : interview.id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-navy">{interview.jobTitle}</h2>
                    <p className="text-gray-600">{interview.industry} • {formatDate(interview.createdAt)}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${getScoreBackground(interview.feedback.overallScore)}`}>
                      <span className={getScoreColor(interview.feedback.overallScore)}>{interview.feedback.overallScore}</span>
                    </div>
                    <svg 
                      className={`w-6 h-6 text-gray-500 transform transition-transform ${expandedSession === interview.id ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
              </div>
              
              {expandedSession === interview.id && (
                <div className="p-6 border-t border-gray-100 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="font-semibold text-navy mb-3">Strengths</h3>
                      <ul className="list-disc pl-5 space-y-1 text-gray-700">
                        {interview.feedback.strengths.slice(0, 3).map((strength, idx) => (
                          <li key={idx}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-navy mb-3">Areas for Improvement</h3>
                      <ul className="list-disc pl-5 space-y-1 text-gray-700">
                        {interview.feedback.areasForImprovement.slice(0, 3).map((area, idx) => (
                          <li key={idx}>{area}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-navy mb-3">Skill Assessment</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    {Object.entries(interview.feedback.skillScores).map(([skill, score]) => (
                      <div key={skill} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getScoreBackground(score)} mr-2`}>
                          <span className={`text-sm font-bold ${getScoreColor(score)}`}>{score}</span>
                        </div>
                        <span className="text-gray-700 text-sm">{skill}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-end">
                    <Link 
                      to={`/interview-sessions/${interview.sessionId}`} 
                      className="inline-flex items-center text-primary hover:underline"
                    >
                      <span>View full details</span>
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                      </svg>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <div className="mx-auto w-24 h-24 text-gray-300 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-navy mb-2">No Interview History Yet</h2>
          <p className="text-gray-600 mb-6">
            You haven't completed any interviews yet. Practice makes perfect!
          </p>
          <Link to="/interview-coach">
            <Button color="primary">Start Your First Interview</Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default InterviewHistory; 