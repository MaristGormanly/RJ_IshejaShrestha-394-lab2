import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Button from '../components/Button';

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserDocuments = async () => {
      if (!auth.currentUser) return;

      try {
        const q = query(
          collection(db, 'documents'),
          where('userId', '==', auth.currentUser.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const docs = [];
        
        querySnapshot.forEach((doc) => {
          docs.push({ id: doc.id, ...doc.data() });
        });
        
        setDocuments(docs);
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDocuments();
  }, []);

  // Arrow icon for buttons
  const ArrowIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
    </svg>
  );

  // Document icon
  const DocumentIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
    </svg>
  );

  // Resume icon
  const ResumeIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path>
    </svg>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-16 text-center">
        <h1 className="text-5xl font-serif font-bold mb-4 text-navy">Craft Your <span className="text-gold">Professional</span> Story</h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Create personalized cover letters and resumes that help you stand out and land your dream job.
        </p>
        <div className="flex justify-center mb-8">
          <Button 
            color="primary" 
            size="lg" 
            icon={<ArrowIcon />} 
            iconPosition="right"
          >
            Get Started
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="card p-6 hover:border-gold transition-colors duration-300">
          <div className="flex justify-between mb-4">
            <h2 className="section-title">Cover Letter Creator</h2>
            <span className="text-navy">
              <DocumentIcon />
            </span>
          </div>
          <p className="text-gray-600 mb-6">
            Create personalized cover letters tailored to specific job descriptions. Stand out to employers with compelling, professional content.
          </p>
          <Link to="/cover-letter">
            <Button color="primary">Create Cover Letter</Button>
          </Link>
        </div>

        <div className="card p-6 hover:border-gold transition-colors duration-300">
          <div className="flex justify-between mb-4">
            <h2 className="section-title">Resume Tailoring</h2>
            <span className="text-navy">
              <ResumeIcon />
            </span>
          </div>
          <p className="text-gray-600 mb-6">
            Optimize your resume for specific job descriptions to increase your chances of getting interviews. Highlight your most relevant skills and experience.
          </p>
          <Link to="/resume-tailoring">
            <Button color="primary">Tailor Resume</Button>
          </Link>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="section-title">Recent Documents</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-10 h-10 border-4 border-navy border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : documents.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {documents.map((doc) => (
              <div key={doc.id} className="py-4 flex justify-between items-center hover:bg-offwhite px-4 rounded-md transition-colors">
                <div>
                  <h3 className="font-medium text-gray-800">{doc.title}</h3>
                  <p className="text-sm text-gray-600">
                    {doc.type === 'cover-letter' ? 'Cover Letter' : 'Resume'} • Last edited{' '}
                    {new Date(doc.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Link to={`/${doc.type}/${doc.id}`}>
                    <Button color="secondary" size="sm">Edit</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-offwhite rounded-md">
            <p className="text-gray-600 mb-4">
              You haven't created any documents yet.
            </p>
            <p className="text-navy mb-4">Start creating professional documents to advance your career.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 