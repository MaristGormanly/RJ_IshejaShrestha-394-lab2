import React, { useState, useEffect } from 'react';
import Button from '../Button';

const InterviewSurvey = ({ initialData, onSubmit }) => {
  const [formData, setFormData] = useState({
    jobTitle: '',
    industry: '',
    experienceLevel: 'entry',
    interviewType: 'behavioral',
    targetSkills: [],
    preferences: {
      interviewDuration: 15,
      questionDifficulty: 'medium',
    }
  });
  const [customSkill, setCustomSkill] = useState('');
  const [errors, setErrors] = useState({});

  // Industry options
  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
    'Retail', 'Marketing', 'Hospitality', 'Construction', 'Entertainment',
    'Legal', 'Science/Research', 'Government', 'Non-profit', 'Other'
  ];

  // Common skills
  const commonSkills = [
    'Communication', 'Leadership', 'Teamwork', 'Problem Solving',
    'Time Management', 'Adaptability', 'Critical Thinking', 'Organization',
    'Creativity', 'Customer Service', 'Project Management', 'Technical Skills',
    'Data Analysis', 'Public Speaking', 'Conflict Resolution'
  ];

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSkillToggle = (skill) => {
    setFormData(prev => {
      const currentSkills = [...prev.targetSkills];
      
      if (currentSkills.includes(skill)) {
        return {
          ...prev,
          targetSkills: currentSkills.filter(s => s !== skill)
        };
      } else {
        return {
          ...prev,
          targetSkills: [...currentSkills, skill]
        };
      }
    });
  };

  const handleAddCustomSkill = () => {
    if (customSkill.trim() === '') return;
    
    if (!formData.targetSkills.includes(customSkill)) {
      setFormData(prev => ({
        ...prev,
        targetSkills: [...prev.targetSkills, customSkill]
      }));
    }
    
    setCustomSkill('');
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.jobTitle.trim()) {
      newErrors.jobTitle = 'Job title is required';
    }
    
    if (!formData.industry) {
      newErrors.industry = 'Industry is required';
    }
    
    if (formData.targetSkills.length === 0) {
      newErrors.targetSkills = 'At least one skill is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-navy mb-6">Customize Your Interview Experience</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="jobTitle">
              Target Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="jobTitle"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleChange}
              className={`w-full p-3 border rounded-md ${errors.jobTitle ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="e.g. Software Engineer, Marketing Manager"
            />
            {errors.jobTitle && <p className="text-red-500 text-sm mt-1">{errors.jobTitle}</p>}
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="industry">
              Industry <span className="text-red-500">*</span>
            </label>
            <select
              id="industry"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              className={`w-full p-3 border rounded-md ${errors.industry ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Select Industry</option>
              {industries.map((industry) => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
            {errors.industry && <p className="text-red-500 text-sm mt-1">{errors.industry}</p>}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="experienceLevel">
              Experience Level
            </label>
            <select
              id="experienceLevel"
              name="experienceLevel"
              value={formData.experienceLevel}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md"
            >
              <option value="entry">Entry Level (0-2 years)</option>
              <option value="mid">Mid Level (3-5 years)</option>
              <option value="senior">Senior Level (6+ years)</option>
              <option value="management">Management</option>
              <option value="executive">Executive</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="interviewType">
              Interview Type
            </label>
            <select
              id="interviewType"
              name="interviewType"
              value={formData.interviewType}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md"
            >
              <option value="behavioral">Behavioral Interview</option>
              <option value="technical">Technical Interview</option>
              <option value="case">Case Interview</option>
              <option value="situational">Situational Interview</option>
              <option value="panel">Panel Interview</option>
            </select>
          </div>
        </div>
        
        <div className="mb-8">
          <label className="block text-gray-700 mb-2">
            Target Skills to Evaluate <span className="text-red-500">*</span>
          </label>
          {errors.targetSkills && <p className="text-red-500 text-sm mb-2">{errors.targetSkills}</p>}
          
          <div className="flex flex-wrap gap-2 mb-4">
            {commonSkills.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => handleSkillToggle(skill)}
                className={`px-3 py-1.5 rounded-full text-sm 
                  ${formData.targetSkills.includes(skill) 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {skill}
                {formData.targetSkills.includes(skill) && ' ✓'}
              </button>
            ))}
          </div>
          
          <div className="flex">
            <input
              type="text"
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              className="flex-1 p-3 border border-gray-300 rounded-l-md"
              placeholder="Add a custom skill"
            />
            <button
              type="button"
              onClick={handleAddCustomSkill}
              className="px-4 bg-navy text-white rounded-r-md hover:bg-opacity-90"
            >
              Add
            </button>
          </div>
          
          {formData.targetSkills.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Selected Skills:</p>
              <div className="flex flex-wrap gap-2">
                {formData.targetSkills.map((skill) => (
                  <span key={skill} className="bg-primary text-white px-3 py-1.5 rounded-full text-sm">
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleSkillToggle(skill)}
                      className="ml-2 text-white hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-navy mb-4">Interview Preferences</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="preferences.interviewDuration">
                Interview Duration (minutes)
              </label>
              <select
                id="preferences.interviewDuration"
                name="preferences.interviewDuration"
                value={formData.preferences.interviewDuration}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md"
              >
                <option value={10}>Short (10 minutes)</option>
                <option value={15}>Standard (15 minutes)</option>
                <option value={20}>Extended (20 minutes)</option>
                <option value={30}>In-depth (30 minutes)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="preferences.questionDifficulty">
                Question Difficulty
              </label>
              <select
                id="preferences.questionDifficulty"
                name="preferences.questionDifficulty"
                value={formData.preferences.questionDifficulty}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="mixed">Mixed Difficulty</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button color="primary" type="submit">
            Start Interview
          </Button>
        </div>
      </form>
    </div>
  );
};

export default InterviewSurvey; 