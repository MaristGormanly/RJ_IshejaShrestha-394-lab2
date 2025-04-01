import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, setDoc, deleteDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { getAuth, updateProfile, updateEmail } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  const [profile, setProfile] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    location: '',
    profession: ''
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [savedDocuments, setSavedDocuments] = useState([]);
  const [updateMessage, setUpdateMessage] = useState({ type: '', message: '' });
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documentUpload, setDocumentUpload] = useState({
    file: null,
    title: '',
    type: 'resume',
    description: ''
  });
  const [applicationProfile, setApplicationProfile] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    middleName: '',
    
    // Education
    education: [{
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      currentlyStudying: false,
      gpa: ''
    }],
    
    // Work Experience
    experience: [{
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      currentlyWorking: false,
      description: ''
    }],
    
    // Self Identification & Demographics
    gender: '',
    ethnicity: '',
    veteranStatus: '',
    disabilityStatus: '',
    
    // Company Affiliation
    previouslyEmployed: false,
    relativeAtCompany: false,
    referredBy: ''
  });

  useEffect(() => {
    if (user) {
      // Get additional user data from Firestore if available
      const fetchUserData = async () => {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setProfile({
              name: user.displayName || '',
              email: user.email || '',
              phone: userData.phone || '',
              location: userData.location || '',
              profession: userData.profession || ''
            });
            
            // Load application profile data if it exists
            if (userData.applicationProfile) {
              setApplicationProfile(userData.applicationProfile);
            }
          } else {
            // Create an empty user document for new users
            const newUserData = {
              name: user.displayName || '',
              email: user.email || '',
              phone: '',
              location: '',
              profession: '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            
            // Only create the user document if the user is confirmed to exist in auth
            if (user.uid) {
              try {
                await setDoc(userDocRef, newUserData);
                setProfile({
                  name: user.displayName || '',
                  email: user.email || '',
                  phone: '',
                  location: '',
                  profession: ''
                });
              } catch (createError) {
                console.error('Error creating new user document:', createError);
              }
            }
          }
          
          // Fetch saved documents
          fetchSavedDocuments();
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchUserData();
    }
  }, [user]);

  const fetchSavedDocuments = async () => {
    if (!user) return;
    
    try {
      const q = query(
        collection(db, 'documents'),
        where('userId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const documents = [];
      
      querySnapshot.forEach((doc) => {
        documents.push(doc.data());
      });
      
      setSavedDocuments(documents);
    } catch (error) {
      console.error('Error fetching saved documents:', error);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    if (!user) return;
    setUpdating(true);
    setUpdateMessage({ type: '', message: '' });
    
    try {
      // Update display name in Firebase Auth
      if (profile.name !== user.displayName) {
        await updateProfile(user, { displayName: profile.name });
      }
      
      // Update email in Firebase Auth if changed
      if (profile.email !== user.email) {
        await updateEmail(user, profile.email);
      }
      
      // Check if the user document already exists
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      const userData = {
        phone: profile.phone,
        location: profile.location,
        profession: profile.profession,
        updatedAt: new Date().toISOString()
      };
      
      // If document exists, update it, otherwise create it
      if (userDoc.exists()) {
        await updateDoc(userDocRef, userData);
      } else {
        // For new users, create a new document with additional fields
        await setDoc(userDocRef, {
          ...userData,
          email: profile.email,
          name: profile.name,
          createdAt: new Date().toISOString(),
        });
      }
      
      setUpdateMessage({ 
        type: 'success', 
        message: 'Profile updated successfully!' 
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      setUpdateMessage({ 
        type: 'error', 
        message: `Error updating profile: ${error.message}` 
      });
    } finally {
      setUpdating(false);
    }
  };

  // Application Profile Handlers
  const handleApplicationProfileChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setApplicationProfile(prev => ({
      ...prev,
      [name]: newValue
    }));
  };
  
  const handleEducationChange = (index, field, value) => {
    const updatedEducation = [...applicationProfile.education];
    updatedEducation[index] = {
      ...updatedEducation[index],
      [field]: value
    };
    
    setApplicationProfile(prev => ({
      ...prev,
      education: updatedEducation
    }));
  };
  
  const handleExperienceChange = (index, field, value) => {
    const updatedExperience = [...applicationProfile.experience];
    updatedExperience[index] = {
      ...updatedExperience[index],
      [field]: value
    };
    
    setApplicationProfile(prev => ({
      ...prev,
      experience: updatedExperience
    }));
  };
  
  const handleAddEducation = () => {
    setApplicationProfile(prev => ({
      ...prev,
      education: [
        ...prev.education,
        {
          institution: '',
          degree: '',
          fieldOfStudy: '',
          startDate: '',
          endDate: '',
          currentlyStudying: false,
          gpa: ''
        }
      ]
    }));
  };
  
  const handleRemoveEducation = (index) => {
    const updatedEducation = [...applicationProfile.education];
    updatedEducation.splice(index, 1);
    
    setApplicationProfile(prev => ({
      ...prev,
      education: updatedEducation
    }));
  };
  
  const handleAddExperience = () => {
    setApplicationProfile(prev => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          company: '',
          position: '',
          location: '',
          startDate: '',
          endDate: '',
          currentlyWorking: false,
          description: ''
        }
      ]
    }));
  };
  
  const handleRemoveExperience = (index) => {
    const updatedExperience = [...applicationProfile.experience];
    updatedExperience.splice(index, 1);
    
    setApplicationProfile(prev => ({
      ...prev,
      experience: updatedExperience
    }));
  };
  
  const handleApplicationProfileUpdate = async (e) => {
    e.preventDefault();
    
    if (!user) return;
    setUpdating(true);
    setUpdateMessage({ type: '', message: '' });
    
    try {
      // Check if the user document already exists
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        // If the document exists, just update the applicationProfile field
        await updateDoc(userDocRef, {
          applicationProfile: applicationProfile,
          updatedAt: new Date().toISOString()
        });
      } else {
        // If the document doesn't exist, create it with the applicationProfile
        await setDoc(userDocRef, {
          applicationProfile: applicationProfile,
          email: user.email,
          name: user.displayName || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      setUpdateMessage({ 
        type: 'success', 
        message: 'Application profile saved successfully!' 
      });
    } catch (error) {
      console.error('Error updating application profile:', error);
      setUpdateMessage({ 
        type: 'error', 
        message: `Error saving application profile: ${error.message}` 
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDocumentUploadChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'file' && files && files[0]) {
      setDocumentUpload(prev => ({
        ...prev,
        file: files[0],
        // Auto-fill title with the filename if it's empty
        title: prev.title || files[0].name.split('.')[0]
      }));
    } else {
      setDocumentUpload(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    
    if (!user) return;
    if (!documentUpload.file) {
      setUpdateMessage({ 
        type: 'error', 
        message: 'Please select a file to upload' 
      });
      return;
    }
    
    setUploadingDocument(true);
    setUpdateMessage({ type: '', message: '' });
    setUploadProgress(0);
    
    try {
      // Limit file size to 5MB to prevent timeouts
      const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
      if (documentUpload.file.size > maxSizeInBytes) {
        throw new Error(`File size exceeds 5MB limit. Please choose a smaller file.`);
      }
      
      // Create a reference to the file in Firebase Storage
      const fileName = `${Date.now()}_${documentUpload.file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const fileRef = ref(storage, `documents/${user.uid}/${fileName}`);
      
      // Create document metadata in Firestore first (without the URL)
      const docId = Date.now().toString();
      const docData = {
        id: docId,
        userId: user.uid,
        title: documentUpload.title,
        type: documentUpload.type,
        description: documentUpload.description,
        fileName: documentUpload.file.name,
        fileSize: documentUpload.file.size,
        fileType: documentUpload.file.type,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        uploadComplete: false
      };
      
      // Save initial document metadata to Firestore
      await setDoc(doc(db, 'documents', docId), docData);
      
      // Set upload metadata to improve reliability
      const metadata = {
        contentType: documentUpload.file.type,
        customMetadata: {
          'userId': user.uid,
          'fileName': documentUpload.file.name,
          'docId': docId // Store the docId in metadata for potential cleanup
        }
      };
      
      // Use uploadBytesResumable to track progress
      const uploadTask = uploadBytesResumable(fileRef, documentUpload.file, metadata);
      
      // Set up progress monitoring
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          // Handle unsuccessful uploads
          throw error;
        }
      );
      
      // Wait for the upload to complete
      const snapshot = await uploadTask;
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Update the document with the download URL
      const updatedDocData = {
        ...docData,
        fileUrl: downloadURL,
        uploadComplete: true
      };
      
      // Update document metadata in Firestore with the URL
      await updateDoc(doc(db, 'documents', docId), {
        fileUrl: downloadURL,
        uploadComplete: true
      });
      
      // Update the list of saved documents
      setSavedDocuments(prev => [...prev, updatedDocData]);
      
      // Reset the form
      setDocumentUpload({
        file: null,
        title: '',
        type: 'resume',
        description: ''
      });
      
      setUpdateMessage({ 
        type: 'success', 
        message: 'Document uploaded successfully!' 
      });
      setUploadProgress(0);
    } catch (error) {
      console.error('Error uploading document:', error);
      
      let errorMessage = 'Error uploading document. Please try again.';
      
      if (error.code === 'storage/retry-limit-exceeded') {
        errorMessage = 'Upload timed out. Please try a smaller file or check your internet connection.';
      } else if (error.code === 'storage/unauthorized') {
        errorMessage = 'You are not authorized to upload files. Please sign in again.';
      } else if (error.code === 'storage/canceled') {
        errorMessage = 'Upload was canceled. Please try again.';
      } else if (error.code === 'storage/quota-exceeded') {
        errorMessage = 'Storage quota exceeded. Please contact support.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setUpdateMessage({ 
        type: 'error', 
        message: errorMessage
      });
      
      // Try to clean up the Firestore document if it was created but the upload failed
      try {
        // The docId variable might not be in scope if the error happened before it was created
        // so we'll use a try/catch to handle that case
        if (error.customMetadata && error.customMetadata.docId) {
          const errorDocId = error.customMetadata.docId;
          const docRef = doc(db, 'documents', errorDocId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists() && !docSnap.data().uploadComplete) {
            await deleteDoc(docRef);
          }
        }
      } catch (cleanupError) {
        console.error('Error cleaning up document after failed upload:', cleanupError);
      }
    } finally {
      setUploadingDocument(false);
    }
  };

  const renderDocumentIcon = (type) => {
    if (type === 'resume') {
      return (
        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
      );
    } else if (type === 'cover-letter') {
      return (
        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
        </svg>
      );
    } else if (type === 'reference') {
      return (
        <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
        </svg>
      );
    } else if (type === 'certificate') {
      return (
        <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
      </svg>
    );
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDeleteDocument = async (docId, fileUrl) => {
    if (!window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }
    
    try {
      // Delete the document from Firestore
      await deleteDoc(doc(db, 'documents', docId));
      
      // Delete the file from Storage if there's a URL
      if (fileUrl) {
        try {
          const fileRef = ref(storage, fileUrl);
          await deleteObject(fileRef);
        } catch (storageError) {
          console.error('Error deleting file from storage:', storageError);
          // Continue with document deletion even if file deletion fails
        }
      }
      
      // Update the UI by removing the deleted document
      setSavedDocuments(prev => prev.filter(doc => doc.id !== docId));
      
      setUpdateMessage({
        type: 'success',
        message: 'Document deleted successfully!'
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      setUpdateMessage({
        type: 'error',
        message: `Error deleting document: ${error.message}`
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
      <p className="text-gray-600 mb-8">
        Manage your personal information and view your saved documents
      </p>

      <div className="flex border-b mb-6">
        <button
          className={`py-2 px-4 ${
            activeTab === 'profile'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('profile')}
        >
          Profile Information
        </button>
        <button
          className={`py-2 px-4 ${
            activeTab === 'documents'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('documents')}
        >
          Saved Documents
        </button>
        <button
          className={`py-2 px-4 ${
            activeTab === 'application'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('application')}
        >
          Application Profile
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      ) : (
        <>
          {activeTab === 'profile' ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              {updateMessage.message && (
                <div className={`mb-4 p-3 rounded ${updateMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {updateMessage.message}
                </div>
              )}
              
              <form onSubmit={handleProfileUpdate}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                      Full Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="Your full name"
                      value={profile.name}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="Your email address"
                      value={profile.email}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="Your phone number"
                      value={profile.phone}
                      onChange={handleProfileChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location">
                      Location
                    </label>
                    <input
                      id="location"
                      name="location"
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="City, State"
                      value={profile.location}
                      onChange={handleProfileChange}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="profession">
                      Profession/Title
                    </label>
                    <input
                      id="profession"
                      name="profession"
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="e.g. Frontend Developer, Marketing Manager"
                      value={profile.profession}
                      onChange={handleProfileChange}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end mt-6">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={updating}
                  >
                    {updating ? 'Updating...' : 'Update Profile'}
                  </button>
                </div>
              </form>
            </div>
          ) : activeTab === 'documents' ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Your Saved Documents</h2>
              
              {updateMessage.message && activeTab === 'documents' && (
                <div className={`mb-4 p-3 rounded ${updateMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {updateMessage.message}
                </div>
              )}
              
              <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium mb-3">Upload a New Document</h3>
                <form onSubmit={handleDocumentUpload}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="file">
                        Select File
                      </label>
                      <input
                        id="file"
                        name="file"
                        type="file"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleDocumentUploadChange}
                        key={documentUpload.file ? 'has-file' : 'no-file'}
                      />
                      {documentUpload.file && (
                        <div className="mt-2 text-sm flex items-center text-gray-700">
                          <span className="mr-2">Selected:</span>
                          <span className="font-medium">{documentUpload.file.name}</span>
                          <span className="ml-2 text-xs text-gray-500">({formatFileSize(documentUpload.file.size)})</span>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Accepted formats: PDF, Word documents, Text files
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                        Document Title
                      </label>
                      <input
                        id="title"
                        name="title"
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        placeholder="Enter a title for this document"
                        value={documentUpload.title}
                        onChange={handleDocumentUploadChange}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="type">
                        Document Type
                      </label>
                      <select
                        id="type"
                        name="type"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        value={documentUpload.type}
                        onChange={handleDocumentUploadChange}
                      >
                        <option value="resume">Resume/CV</option>
                        <option value="cover-letter">Cover Letter</option>
                        <option value="reference">Reference Letter</option>
                        <option value="certificate">Certificate</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                        Description (Optional)
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        rows="3"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        placeholder="Add a short description of this document"
                        value={documentUpload.description}
                        onChange={handleDocumentUploadChange}
                      ></textarea>
                    </div>
                  </div>
                  
                  <div className="flex flex-col mt-4 w-full">
                    {uploadingDocument && (
                      <div className="w-full mb-4">
                        <div className="text-xs text-gray-500 mb-1 flex justify-between">
                          <span>Uploading...</span>
                          <span>{Math.round(uploadProgress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={uploadingDocument || !documentUpload.file}
                      >
                        {uploadingDocument ? 'Uploading...' : 'Upload Document'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
              
              {savedDocuments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">You don't have any saved documents yet.</p>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">Get started by:</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-2">
                      <button 
                        onClick={() => navigate('/cover-letter')}
                        className="btn btn-outline btn-sm"
                      >
                        Creating a Cover Letter
                      </button>
                      <button 
                        onClick={() => navigate('/resume-tailoring')}
                        className="btn btn-outline btn-sm"
                      >
                        Tailoring Your Resume
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {savedDocuments.map(document => (
                    <div key={document.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start">
                        <div className="mr-3">
                          {renderDocumentIcon(document.type)}
                        </div>
                        <div className="flex-grow min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{document.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Created: {new Date(document.createdAt).toLocaleDateString()}
                          </p>
                          <div className="flex flex-wrap items-center mt-2 text-xs text-gray-500">
                            <span className="mr-3">
                              {document.fileName && <span className="mr-1">📄 {document.fileName}</span>}
                            </span>
                            {document.fileSize && (
                              <span className="mr-3">📊 {formatFileSize(document.fileSize)}</span>
                            )}
                            <span>🏷️ {document.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                          </div>
                          {document.description && (
                            <p className="text-sm text-gray-600 mt-2">
                              {document.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end space-x-2">
                        <button 
                          className="btn btn-xs btn-outline text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                          onClick={() => handleDeleteDocument(document.id, document.fileUrl)}
                        >
                          Delete
                        </button>
                        {document.fileUrl && (
                          <a 
                            href={document.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-xs btn-primary"
                          >
                            Download
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Application Profile</h2>
              <p className="text-gray-600 mb-6">
                Complete these common application fields once and reuse them when applying for jobs to save time.
              </p>
              
              {updateMessage.message && (
                <div className={`mb-4 p-3 rounded ${updateMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {updateMessage.message}
                </div>
              )}
              
              <form onSubmit={handleApplicationProfileUpdate}>
                {/* Personal Information Section */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium border-b pb-2 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="firstName">
                        First Name
                      </label>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        value={applicationProfile.firstName}
                        onChange={handleApplicationProfileChange}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="middleName">
                        Middle Name (Optional)
                      </label>
                      <input
                        id="middleName"
                        name="middleName"
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        value={applicationProfile.middleName}
                        onChange={handleApplicationProfileChange}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lastName">
                        Last Name
                      </label>
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        value={applicationProfile.lastName}
                        onChange={handleApplicationProfileChange}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Education Section */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium border-b pb-2 mb-4">Education</h3>
                  
                  {applicationProfile.education.map((edu, index) => (
                    <div key={index} className="mb-6 p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Education #{index + 1}</h4>
                        {applicationProfile.education.length > 1 && (
                          <button 
                            type="button"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleRemoveEducation(index)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">
                            Institution
                          </label>
                          <input
                            type="text"
                            name={`education[${index}].institution`}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            value={edu.institution}
                            onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">
                            Degree
                          </label>
                          <input
                            type="text"
                            name={`education[${index}].degree`}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            value={edu.degree}
                            onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">
                            Field of Study
                          </label>
                          <input
                            type="text"
                            name={`education[${index}].fieldOfStudy`}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            value={edu.fieldOfStudy}
                            onChange={(e) => handleEducationChange(index, 'fieldOfStudy', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">
                            GPA (Optional)
                          </label>
                          <input
                            type="text"
                            name={`education[${index}].gpa`}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            value={edu.gpa}
                            onChange={(e) => handleEducationChange(index, 'gpa', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">
                            Start Date
                          </label>
                          <input
                            type="date"
                            name={`education[${index}].startDate`}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            value={edu.startDate}
                            onChange={(e) => handleEducationChange(index, 'startDate', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">
                            End Date
                          </label>
                          <div className="flex items-center">
                            <input
                              type="date"
                              name={`education[${index}].endDate`}
                              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                              value={edu.endDate}
                              onChange={(e) => handleEducationChange(index, 'endDate', e.target.value)}
                              disabled={edu.currentlyStudying}
                            />
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <label className="flex items-center space-x-2 mt-2">
                            <input
                              type="checkbox"
                              className="form-checkbox"
                              checked={edu.currentlyStudying}
                              onChange={(e) => handleEducationChange(index, 'currentlyStudying', e.target.checked)}
                            />
                            <span className="text-gray-700 text-sm font-bold">I am currently studying here</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handleAddEducation}
                  >
                    + Add Another Education
                  </button>
                </div>
                
                {/* Work Experience Section */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium border-b pb-2 mb-4">Work Experience</h3>
                  
                  {applicationProfile.experience.map((exp, index) => (
                    <div key={index} className="mb-6 p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Experience #{index + 1}</h4>
                        {applicationProfile.experience.length > 1 && (
                          <button 
                            type="button"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleRemoveExperience(index)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">
                            Company
                          </label>
                          <input
                            type="text"
                            name={`experience[${index}].company`}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            value={exp.company}
                            onChange={(e) => handleExperienceChange(index, 'company', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">
                            Position
                          </label>
                          <input
                            type="text"
                            name={`experience[${index}].position`}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            value={exp.position}
                            onChange={(e) => handleExperienceChange(index, 'position', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">
                            Location
                          </label>
                          <input
                            type="text"
                            name={`experience[${index}].location`}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            value={exp.location}
                            onChange={(e) => handleExperienceChange(index, 'location', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">
                            Start Date
                          </label>
                          <input
                            type="date"
                            name={`experience[${index}].startDate`}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            value={exp.startDate}
                            onChange={(e) => handleExperienceChange(index, 'startDate', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">
                            End Date
                          </label>
                          <div className="flex items-center">
                            <input
                              type="date"
                              name={`experience[${index}].endDate`}
                              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                              value={exp.endDate}
                              onChange={(e) => handleExperienceChange(index, 'endDate', e.target.value)}
                              disabled={exp.currentlyWorking}
                            />
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <label className="flex items-center space-x-2 mt-2">
                            <input
                              type="checkbox"
                              className="form-checkbox"
                              checked={exp.currentlyWorking}
                              onChange={(e) => handleExperienceChange(index, 'currentlyWorking', e.target.checked)}
                            />
                            <span className="text-gray-700 text-sm font-bold">I currently work here</span>
                          </label>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-gray-700 text-sm font-bold mb-2">
                            Description
                          </label>
                          <textarea
                            name={`experience[${index}].description`}
                            rows="3"
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            value={exp.description}
                            onChange={(e) => handleExperienceChange(index, 'description', e.target.value)}
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handleAddExperience}
                  >
                    + Add Another Experience
                  </button>
                </div>
                
                {/* Self Identification & Demographics Section */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium border-b pb-2 mb-4">Self Identification & Demographics</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    This information is optional and will only be used to auto-fill job applications. You can choose to skip any field.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="gender">
                        Gender
                      </label>
                      <select
                        id="gender"
                        name="gender"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        value={applicationProfile.gender}
                        onChange={handleApplicationProfileChange}
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="non-binary">Non-binary</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="ethnicity">
                        Ethnicity
                      </label>
                      <select
                        id="ethnicity"
                        name="ethnicity"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        value={applicationProfile.ethnicity}
                        onChange={handleApplicationProfileChange}
                      >
                        <option value="">Select Ethnicity</option>
                        <option value="american-indian">American Indian or Alaska Native</option>
                        <option value="asian">Asian</option>
                        <option value="black">Black or African American</option>
                        <option value="hispanic">Hispanic or Latino</option>
                        <option value="native-hawaiian">Native Hawaiian or Other Pacific Islander</option>
                        <option value="white">White</option>
                        <option value="two-or-more">Two or more races</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="veteranStatus">
                        Veteran Status
                      </label>
                      <select
                        id="veteranStatus"
                        name="veteranStatus"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        value={applicationProfile.veteranStatus}
                        onChange={handleApplicationProfileChange}
                      >
                        <option value="">Select Veteran Status</option>
                        <option value="protected-veteran">Protected Veteran</option>
                        <option value="not-protected-veteran">Not Protected Veteran</option>
                        <option value="dont-wish-to-answer">Don't wish to answer</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="disabilityStatus">
                        Disability Status
                      </label>
                      <select
                        id="disabilityStatus"
                        name="disabilityStatus"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        value={applicationProfile.disabilityStatus}
                        onChange={handleApplicationProfileChange}
                      >
                        <option value="">Select Disability Status</option>
                        <option value="yes">Yes, I have a disability</option>
                        <option value="no">No, I don't have a disability</option>
                        <option value="dont-wish-to-answer">Don't wish to answer</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Company Affiliation Section */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium border-b pb-2 mb-4">Company Affiliation</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Common questions about your relationship with companies you're applying to.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-start space-x-2">
                        <input
                          type="checkbox"
                          className="form-checkbox mt-1"
                          name="previouslyEmployed"
                          checked={applicationProfile.previouslyEmployed}
                          onChange={handleApplicationProfileChange}
                        />
                        <span className="text-gray-700 text-sm">
                          I have previously been employed by companies I'm applying to
                        </span>
                      </label>
                    </div>
                    
                    <div>
                      <label className="flex items-start space-x-2">
                        <input
                          type="checkbox"
                          className="form-checkbox mt-1"
                          name="relativeAtCompany"
                          checked={applicationProfile.relativeAtCompany}
                          onChange={handleApplicationProfileChange}
                        />
                        <span className="text-gray-700 text-sm">
                          I have a relative who works at companies I'm applying to
                        </span>
                      </label>
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="referredBy">
                        Referred By (Optional)
                      </label>
                      <input
                        id="referredBy"
                        name="referredBy"
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        placeholder="Name of person who referred you"
                        value={applicationProfile.referredBy}
                        onChange={handleApplicationProfileChange}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end mt-6">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={updating}
                  >
                    {updating ? 'Saving...' : 'Save Application Profile'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Profile; 