import React, { useState, useEffect } from 'react';

const JobApplicationModal = ({ job, userProfile, onClose, onSubmit, isSubmitting, applicationResult }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    education: [],
    experience: [],
    coverLetter: '',
    resume: '',
    gender: '',
    ethnicity: '',
    veteranStatus: '',
    disabilityStatus: '',
    previouslyEmployed: false,
    relativeAtCompany: false,
    referredBy: '',
    agreeToTerms: false
  });

  // Pre-fill form data from user profile when component mounts
  useEffect(() => {
    if (userProfile) {
      // Get application profile if it exists
      const applicationProfile = userProfile.applicationProfile || {};
      
      setFormData({
        firstName: applicationProfile.firstName || '',
        lastName: applicationProfile.lastName || '',
        middleName: applicationProfile.middleName || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        address: userProfile.location || '',
        city: '',
        state: '',
        zip: '',
        education: applicationProfile.education || [],
        experience: applicationProfile.experience || [],
        coverLetter: '',
        resume: '',
        gender: applicationProfile.gender || '',
        ethnicity: applicationProfile.ethnicity || '',
        veteranStatus: applicationProfile.veteranStatus || '',
        disabilityStatus: applicationProfile.disabilityStatus || '',
        previouslyEmployed: applicationProfile.previouslyEmployed || false,
        relativeAtCompany: applicationProfile.relativeAtCompany || false,
        referredBy: applicationProfile.referredBy || '',
        agreeToTerms: false
      });

      // Try to parse city, state, zip from location if available
      if (userProfile.location) {
        const locationParts = userProfile.location.split(',');
        if (locationParts.length >= 2) {
          setFormData(prev => ({
            ...prev,
            city: locationParts[0].trim(),
            state: locationParts[1].trim()
          }));
          
          // Extract zip code if present
          const stateZipMatch = locationParts[1].match(/([A-Z]{2})\s+(\d{5}(-\d{4})?)/);
          if (stateZipMatch) {
            setFormData(prev => ({
              ...prev,
              state: stateZipMatch[1],
              zip: stateZipMatch[2]
            }));
          }
        }
      }
    }
  }, [userProfile]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.agreeToTerms) {
      alert('Please agree to the terms and conditions to submit your application.');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto p-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-navy">Apply to: {job.title}</h2>
          <p className="text-gray-600">{job.company} • {job.location}</p>
        </div>

        {applicationResult.message ? (
          <div className={`p-4 mb-6 rounded-md ${applicationResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <p className="font-medium">{applicationResult.message}</p>
            {applicationResult.success && (
              <button 
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-navy text-white rounded hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <section>
              <h3 className="text-lg font-semibold border-b pb-2 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="firstName">
                    First Name *
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="middleName">
                    Middle Name
                  </label>
                  <input
                    id="middleName"
                    name="middleName"
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.middleName}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lastName">
                    Last Name *
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                    Email *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
                    Phone *
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">
                  Address
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="city">
                    City
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="state">
                    State
                  </label>
                  <input
                    id="state"
                    name="state"
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.state}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="zip">
                    Zip Code
                  </label>
                  <input
                    id="zip"
                    name="zip"
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.zip}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </section>

            {/* Education */}
            <section>
              <h3 className="text-lg font-semibold border-b pb-2 mb-4">Education</h3>
              {formData.education && formData.education.length > 0 ? (
                <div className="space-y-4">
                  {formData.education.map((edu, index) => (
                    <div key={index} className="p-3 border border-gray-200 rounded-md">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-bold">Institution</p>
                          <p>{edu.institution}</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold">Degree</p>
                          <p>{edu.degree}</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold">Field of Study</p>
                          <p>{edu.fieldOfStudy}</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold">Dates</p>
                          <p>
                            {edu.startDate} - {edu.currentlyStudying ? 'Present' : edu.endDate}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 bg-gray-50 rounded-md">
                  <p className="text-gray-500">No education information found in your profile.</p>
                  <p className="text-sm text-gray-400 mt-1">
                    You can add this information in your Application Profile.
                  </p>
                </div>
              )}
            </section>

            {/* Work Experience */}
            <section>
              <h3 className="text-lg font-semibold border-b pb-2 mb-4">Work Experience</h3>
              {formData.experience && formData.experience.length > 0 ? (
                <div className="space-y-4">
                  {formData.experience.map((exp, index) => (
                    <div key={index} className="p-3 border border-gray-200 rounded-md">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-bold">Company</p>
                          <p>{exp.company}</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold">Position</p>
                          <p>{exp.position}</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold">Location</p>
                          <p>{exp.location}</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold">Dates</p>
                          <p>
                            {exp.startDate} - {exp.currentlyWorking ? 'Present' : exp.endDate}
                          </p>
                        </div>
                      </div>
                      {exp.description && (
                        <div className="mt-2">
                          <p className="text-sm font-bold">Description</p>
                          <p className="text-sm">{exp.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 bg-gray-50 rounded-md">
                  <p className="text-gray-500">No work experience found in your profile.</p>
                  <p className="text-sm text-gray-400 mt-1">
                    You can add this information in your Application Profile.
                  </p>
                </div>
              )}
            </section>

            {/* Documents */}
            <section>
              <h3 className="text-lg font-semibold border-b pb-2 mb-4">Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="resume">
                    Resume *
                  </label>
                  <input
                    id="resume"
                    name="resume"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="coverLetter">
                    Cover Letter
                  </label>
                  <input
                    id="coverLetter"
                    name="coverLetter"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </section>

            {/* Equal Opportunity Information */}
            <section>
              <h3 className="text-lg font-semibold border-b pb-2 mb-4">Equal Opportunity Information</h3>
              <p className="text-sm text-gray-500 mb-4">
                This information is voluntary and will not be used for hiring decisions.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="gender">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.gender}
                    onChange={handleInputChange}
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
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.ethnicity}
                    onChange={handleInputChange}
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
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.veteranStatus}
                    onChange={handleInputChange}
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
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.disabilityStatus}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Disability Status</option>
                    <option value="yes">Yes, I have a disability</option>
                    <option value="no">No, I don't have a disability</option>
                    <option value="dont-wish-to-answer">Don't wish to answer</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Company Relationships */}
            <section>
              <h3 className="text-lg font-semibold border-b pb-2 mb-4">Company Relationships</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      className="mt-1"
                      name="previouslyEmployed"
                      checked={formData.previouslyEmployed}
                      onChange={handleInputChange}
                    />
                    <span className="text-gray-700">
                      I have previously been employed by {job.company}
                    </span>
                  </label>
                </div>

                <div>
                  <label className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      className="mt-1"
                      name="relativeAtCompany"
                      checked={formData.relativeAtCompany}
                      onChange={handleInputChange}
                    />
                    <span className="text-gray-700">
                      I have a relative who works at {job.company}
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
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Name of person who referred you"
                    value={formData.referredBy}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </section>

            {/* Terms and Submit */}
            <section>
              <div className="mb-4">
                <label className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    className="mt-1"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    required
                  />
                  <span className="text-gray-700">
                    I certify that the information provided in this application is true and complete to the best of my knowledge.
                    I understand that any false statement or omission may disqualify me from further consideration for employment and may
                    result in dismissal if discovered at a later date.
                  </span>
                </label>
              </div>

              <div className="flex justify-end mt-6 space-x-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </section>
          </form>
        )}
      </div>
    </div>
  );
};

export default JobApplicationModal; 