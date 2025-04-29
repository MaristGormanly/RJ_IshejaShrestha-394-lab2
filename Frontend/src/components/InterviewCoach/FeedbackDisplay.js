import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../Button';

const FeedbackDisplay = ({ feedback, session, onStartNew }) => {
  const [activeSection, setActiveSection] = useState('summary');
  
  if (!feedback || !session) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-navy font-medium">Loading feedback...</p>
      </div>
    );
  }

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

  const getOverallFeedbackMessage = (score) => {
    if (score >= 9) return "Outstanding performance";
    if (score >= 8) return "Excellent performance";
    if (score >= 7) return "Good performance with room for improvement";
    if (score >= 6) return "Adequate performance with notable weaknesses";
    if (score >= 5) return "Below average performance";
    if (score >= 4) return "Poor performance requiring significant improvement";
    return "Critical issues requiring immediate attention";
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold ${getScoreBackground(feedback.overallScore)}`}>
            <span className={getScoreColor(feedback.overallScore)}>{feedback.overallScore}</span>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-navy">Interview Assessment</h2>
        <p className={`text-lg font-medium ${getScoreColor(feedback.overallScore)}`}>
          {getOverallFeedbackMessage(feedback.overallScore)}
        </p>
        <p className="text-gray-600 mt-2">
          For position: <span className="font-semibold">{session.jobTitle}</span>
        </p>
      </div>

      <div className="card p-4 bg-gray-50 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-navy mb-2">Interview Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded shadow-sm">
            <div className="text-sm text-gray-500">Duration</div>
            <div className="text-lg font-medium">
              {feedback.interviewMetrics?.totalDuration || session.interviewDuration?.toFixed(1) || "N/A"} min
              <span className="text-xs text-gray-500 ml-1">/ {feedback.interviewMetrics?.expectedDuration || session.expectedDuration || "N/A"} min</span>
            </div>
          </div>
          <div className="bg-white p-3 rounded shadow-sm">
            <div className="text-sm text-gray-500">Avg Answer Time</div>
            <div className="text-lg font-medium">
              {feedback.interviewMetrics?.averageAnswerTime || session.averageAnswerTime?.toFixed(1) || "N/A"} sec
            </div>
          </div>
          <div className="bg-white p-3 rounded shadow-sm">
            <div className="text-sm text-gray-500">Short Answers</div>
            <div className="text-lg font-medium">
              {feedback.interviewMetrics?.shortAnswers || "N/A"}
              <span className="text-xs text-gray-500 ml-1">/ {feedback.interviewMetrics?.totalQuestions || session.answers?.length || "N/A"}</span>
            </div>
          </div>
          <div className="bg-white p-3 rounded shadow-sm">
            <div className="text-sm text-gray-500">Long Answers</div>
            <div className="text-lg font-medium">
              {feedback.interviewMetrics?.longAnswers || "N/A"}
              <span className="text-xs text-gray-500 ml-1">/ {feedback.interviewMetrics?.totalQuestions || session.answers?.length || "N/A"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium ${activeSection === 'summary' 
            ? 'text-primary border-b-2 border-primary' 
            : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveSection('summary')}
        >
          Summary
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeSection === 'skills' 
            ? 'text-primary border-b-2 border-primary' 
            : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveSection('skills')}
        >
          Skills Assessment
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeSection === 'roleAdvice' 
            ? 'text-primary border-b-2 border-primary' 
            : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveSection('roleAdvice')}
        >
          Role Advice
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeSection === 'timing' 
            ? 'text-primary border-b-2 border-primary' 
            : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveSection('timing')}
        >
          Timing Analysis
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeSection === 'answers' 
            ? 'text-primary border-b-2 border-primary' 
            : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveSection('answers')}
        >
          Your Answers
        </button>
      </div>

      {/* Summary section */}
      {activeSection === 'summary' && (
        <div>
          <div className="card p-6 bg-white shadow-sm rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-navy mb-4">Strengths</h3>
            {feedback.strengths && feedback.strengths.length > 0 ? (
              <ul className="list-disc pl-5 space-y-2">
                {feedback.strengths.map((strength, index) => (
                  <li key={index} className="text-gray-700">{strength}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No significant strengths were identified.</p>
            )}
          </div>

          <div className="card p-6 bg-white shadow-sm rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-navy mb-4">Areas for Improvement</h3>
            <ul className="list-disc pl-5 space-y-2">
              {feedback.areasForImprovement.map((area, index) => (
                <li key={index} className="text-gray-700">{area}</li>
              ))}
            </ul>
          </div>

          <div className="card p-6 bg-white shadow-sm rounded-lg">
            <h3 className="text-lg font-semibold text-navy mb-4">Suggestions</h3>
            <ul className="list-disc pl-5 space-y-2">
              {feedback.suggestions.map((suggestion, index) => (
                <li key={index} className="text-gray-700">{suggestion}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Skills Assessment */}
      {activeSection === 'skills' && (
        <div className="space-y-4">
          {Object.entries(feedback.skillScores).map(([skill, score]) => (
            <div key={skill} className="card p-4 bg-white shadow-sm rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-navy">{skill}</h3>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getScoreBackground(score)}`}>
                  <span className={`font-bold ${getScoreColor(score)}`}>{score}</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${score >= 8 ? 'bg-green-500' : score >= 6 ? 'bg-blue-500' : score >= 4 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                    style={{ width: `${score * 10}%` }}
                  ></div>
                </div>
              </div>
              <div className="mt-2">
                <div className="text-xs text-gray-500 flex justify-between">
                  <span>Needs Improvement (1-3)</span>
                  <span>Average (4-6)</span>
                  <span>Good (7-8)</span>
                  <span>Excellent (9-10)</span>
                </div>
              </div>
            </div>
          ))}
          
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-md font-semibold text-navy mb-2">Understanding Your Scores</h3>
            <p className="text-sm text-gray-700 mb-3">
              Our assessment is designed to be rigorous to help you improve. Scores of 7 or higher indicate strong performance.
              Most candidates score between 4-6 on their first attempts.
            </p>
            <div className="text-sm text-gray-700">
              <span className="font-medium">1-3:</span> Critical issues requiring immediate attention<br />
              <span className="font-medium">4-6:</span> Areas needing significant improvement<br />
              <span className="font-medium">7-8:</span> Good performance with minor issues<br />
              <span className="font-medium">9-10:</span> Outstanding, professional-level performance
            </div>
          </div>
        </div>
      )}

      {/* Role-specific Advice */}
      {activeSection === 'roleAdvice' && (
        <div className="space-y-6">
          <div className="card p-6 bg-white shadow-sm rounded-lg">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-primary bg-opacity-10 flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-navy">Career Advice for {session.jobTitle}</h3>
            </div>
            
            {feedback.roleSpecificAdvice ? (
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-navy mb-2">Role-Specific Advice</h4>
                <p className="text-gray-700 whitespace-pre-line">{feedback.roleSpecificAdvice}</p>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-navy mb-2">General Career Development</h4>
                <p className="text-gray-700">
                  To advance in your {session.jobTitle} career, focus on developing both technical skills and soft skills.
                  Seek out projects that stretch your abilities and demonstrate your potential for growth.
                </p>
              </div>
            )}
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-navy mb-2">Industry Insights</h4>
              <p className="text-gray-700 mb-3">
                Based on your interview performance, here are some industry-specific insights that may help you prepare for future interviews in this field:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li>Keep up with the latest trends and technologies in {session.industry} to demonstrate industry awareness</li>
                <li>Prepare specific examples that showcase your problem-solving abilities in relevant scenarios</li>
                <li>Practice explaining complex concepts in simple terms to demonstrate communication skills</li>
                <li>Research common challenges in the industry and prepare thoughtful perspectives on them</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Timing Analysis */}
      {activeSection === 'timing' && (
        <div className="space-y-6">
          <div className="card p-6 bg-white shadow-sm rounded-lg">
            <h3 className="text-lg font-semibold text-navy mb-4">Time Assessment</h3>
            <p className="text-gray-700 mb-4">{feedback.timeAssessment}</p>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-navy mb-2">Interview Duration</h4>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block text-blue-600">
                      {feedback.interviewMetrics?.totalDuration || session.interviewDuration?.toFixed(1) || "0"} minutes
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold inline-block text-gray-600">
                      Expected: {feedback.interviewMetrics?.expectedDuration || session.expectedDuration || "15"} minutes
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-2 text-xs flex rounded bg-gray-200">
                  <div 
                    style={{ 
                      width: `${Math.min(100, ((feedback.interviewMetrics?.totalDuration || session.interviewDuration || 0) / 
                      (feedback.interviewMetrics?.expectedDuration || session.expectedDuration || 15)) * 100)}%` 
                    }} 
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                  ></div>
                </div>
                <div className="flex text-xs justify-between text-gray-500">
                  <span>Too Short</span>
                  <span>Good Duration</span>
                  <span>Too Long</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-navy mb-2">Answer Length Distribution</h4>
              <div className="grid grid-cols-3 gap-4 mb-2">
                <div className="bg-red-50 p-3 rounded text-center">
                  <div className="text-sm text-gray-600">Short Answers</div>
                  <div className="text-xl font-bold text-red-500">
                    {feedback.interviewMetrics?.shortAnswers || 0}
                  </div>
                  <div className="text-xs text-gray-500">Under 30 words</div>
                </div>
                <div className="bg-green-50 p-3 rounded text-center">
                  <div className="text-sm text-gray-600">Good Length</div>
                  <div className="text-xl font-bold text-green-500">
                    {(feedback.interviewMetrics?.answeredQuestions || session.answers?.length || 0) - 
                     (feedback.interviewMetrics?.shortAnswers || 0) - 
                     (feedback.interviewMetrics?.longAnswers || 0)}
                  </div>
                  <div className="text-xs text-gray-500">30-200 words</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded text-center">
                  <div className="text-sm text-gray-600">Long Answers</div>
                  <div className="text-xl font-bold text-yellow-500">
                    {feedback.interviewMetrics?.longAnswers || 0}
                  </div>
                  <div className="text-xs text-gray-500">Over 200 words</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-3">
                Ideal answers are typically 60-90 seconds in length (roughly 150-225 words). 
                Very short answers may not provide enough detail, while very long answers might indicate rambling.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Your Answers */}
      {activeSection === 'answers' && (
        <div className="space-y-6">
          {session.answers && session.answers.map((answer, index) => (
            <div key={index} className="card p-6 bg-white shadow-sm rounded-lg border-l-4 border-navy">
              <div className="mb-3">
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary bg-primary bg-opacity-10 mr-2">
                  Question {index + 1}
                </span>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-gray-600 bg-gray-100">
                  Skill: {answer.skill}
                </span>
                {answer.duration && (
                  <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ml-2 
                    ${answer.duration < 20 ? 'bg-red-100 text-red-600' : 
                      answer.duration > 180 ? 'bg-yellow-100 text-yellow-600' : 
                      'bg-green-100 text-green-600'}`}>
                    {answer.duration.toFixed(0)}s
                  </span>
                )}
                {answer.wordCount && (
                  <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ml-2 
                    ${answer.wordCount < 30 ? 'bg-red-100 text-red-600' : 
                      answer.wordCount > 200 ? 'bg-yellow-100 text-yellow-600' : 
                      'bg-green-100 text-green-600'}`}>
                    {answer.wordCount} words
                  </span>
                )}
              </div>
              <p className="font-medium text-navy mb-3">{answer.question}</p>
              <div className="pl-4 border-l border-gray-300">
                <p className="text-gray-700">{answer.answer}</p>
              </div>
              {(answer.wordCount < 30 || answer.duration < 20) && (
                <div className="mt-3 p-2 bg-red-50 text-red-700 text-sm rounded">
                  <strong>Note:</strong> This answer is too brief. Consider providing more details and examples.
                </div>
              )}
              {(answer.wordCount > 200 || answer.duration > 180) && (
                <div className="mt-3 p-2 bg-yellow-50 text-yellow-700 text-sm rounded">
                  <strong>Note:</strong> This answer is quite lengthy. Practice being more concise while keeping key points.
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between mt-10 pt-6 border-t border-gray-200">
        <Link to="/interview-history">
          <Button color="secondary">
            View History
          </Button>
        </Link>
        <Button color="primary" onClick={onStartNew}>
          Start New Interview
        </Button>
      </div>
    </div>
  );
};

export default FeedbackDisplay; 