import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

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

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="mb-4">Cover Letter Generator</h2>
          <p className="text-gray-600 mb-6">
            Create personalized cover letters tailored to specific job descriptions.
          </p>
          <Link to="/cover-letter" className="btn btn-primary">
            Create Cover Letter
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="mb-4">Resume Tailoring</h2>
          <p className="text-gray-600 mb-6">
            Optimize your resume for specific job descriptions to increase your chances of getting interviews.
          </p>
          <Link to="/resume-tailoring" className="btn btn-primary">
            Tailor Resume
          </Link>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2>Recent Documents</h2>
        </div>

        {loading ? (
          <p>Loading documents...</p>
        ) : documents.length > 0 ? (
          <div className="divide-y">
            {documents.map((doc) => (
              <div key={doc.id} className="py-4 flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{doc.title}</h3>
                  <p className="text-sm text-gray-600">
                    {doc.type === 'cover-letter' ? 'Cover Letter' : 'Resume'} • Last edited{' '}
                    {new Date(doc.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Link
                    to={`/${doc.type}/${doc.id}`}
                    className="text-primary hover:underline"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">
            You haven't created any documents yet. Get started by creating a cover letter or tailoring your resume.
          </p>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 