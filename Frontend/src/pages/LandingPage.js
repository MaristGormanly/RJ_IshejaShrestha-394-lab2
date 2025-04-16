import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-navy to-blue-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold font-serif mb-4">Land Your Dream Job With AI-Powered Tools</h1>
              <p className="text-xl mb-8 text-blue-100">
                Streamline your job search with AI tools that help you create tailored resumes, 
                write compelling cover letters, and prepare for interviews.
              </p>
              <div className="flex space-x-4">
                <Link to="/register">
                  <Button color="secondary" size="lg">Get Started Free</Button>
                </Link>
                <a href="#features" className="inline-flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-white hover:bg-opacity-10 transition">
                  Learn More
                </a>
              </div>
            </div>
            <div className="md:w-1/2 md:pl-10">
              <img 
                src="https://images.unsplash.com/photo-1568992687947-868a62a9f521?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1632&q=80" 
                alt="Job seeker using laptop" 
                className="rounded-lg shadow-xl w-full object-cover h-80 md:h-96" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-navy mb-2">93%</p>
              <p className="text-gray-600">Success Rate</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-navy mb-2">5k+</p>
              <p className="text-gray-600">Happy Users</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-navy mb-2">250+</p>
              <p className="text-gray-600">Companies Hiring</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-navy mb-2">100K+</p>
              <p className="text-gray-600">Job Listings</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-offwhite">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-navy mb-4 font-serif">Why Choose Landed?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We combine AI-powered tools with real job listings to help you land your dream job faster.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="inline-block p-4 bg-blue-100 rounded-lg text-navy mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-navy mb-3">AI Resume Generator</h3>
              <p className="text-gray-600 mb-4">
                Create professional, ATS-friendly resumes tailored to specific job descriptions with our AI-powered tools.
              </p>
              <Link to="/register" className="text-navy font-medium hover:text-blue-800">
                Try it now →
              </Link>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="inline-block p-4 bg-blue-100 rounded-lg text-navy mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-navy mb-3">AI Cover Letter Writer</h3>
              <p className="text-gray-600 mb-4">
                Generate compelling cover letters that highlight your relevant experience and skills for each job application.
              </p>
              <Link to="/register" className="text-navy font-medium hover:text-blue-800">
                Try it now →
              </Link>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="inline-block p-4 bg-blue-100 rounded-lg text-navy mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-navy mb-3">AI Interview Coach</h3>
              <p className="text-gray-600 mb-4">
                Practice answering interview questions with our AI coach and get feedback to improve your responses.
              </p>
              <Link to="/register" className="text-navy font-medium hover:text-blue-800">
                Try it now →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Job Search Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0 md:pr-10">
              <h2 className="text-3xl font-bold text-navy mb-4 font-serif">Real-Time Job Search</h2>
              <p className="text-gray-600 mb-6">
                Search through thousands of job listings from top companies around the world. 
                Our platform connects to real-time job databases to ensure you see the most 
                current opportunities.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-700">Access to thousands of current job listings</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-700">Save jobs and track your applications</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-700">One-click applications to many positions</span>
                </li>
              </ul>
              <Link to="/register">
                <Button color="primary">Start Searching Now</Button>
              </Link>
            </div>
            <div className="md:w-1/2">
              <img 
                src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1472&q=80" 
                alt="Person searching for jobs on laptop" 
                className="rounded-lg shadow-xl w-full" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-navy text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 font-serif">What Our Users Say</h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Join thousands of professionals who have found their dream jobs using our platform.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white text-gray-800 p-8 rounded-lg shadow-md relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-navy" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              </div>
              <p className="text-gray-600 mb-6 pt-4">
                "Landed helped me create a resume that actually got responses! The AI interview coach was invaluable in preparing me for tough questions."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-navy font-bold">JD</span>
                </div>
                <div>
                  <p className="font-bold text-navy">John Doe</p>
                  <p className="text-sm text-gray-500">Software Engineer at Google</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white text-gray-800 p-8 rounded-lg shadow-md relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-navy" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              </div>
              <p className="text-gray-600 mb-6 pt-4">
                "I found my dream job within 3 weeks of using Landed. The AI cover letter generator saved me hours of time and produced better results than I could have written myself."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-navy font-bold">JS</span>
                </div>
                <div>
                  <p className="font-bold text-navy">Jane Smith</p>
                  <p className="text-sm text-gray-500">Product Manager at Amazon</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white text-gray-800 p-8 rounded-lg shadow-md relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-navy" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              </div>
              <p className="text-gray-600 mb-6 pt-4">
                "As a recent graduate, I was struggling to get interviews. Landed helped me optimize my resume and prepare for interviews. I now have a job at my dream company!"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-navy font-bold">RJ</span>
                </div>
                <div>
                  <p className="font-bold text-navy">Robert Johnson</p>
                  <p className="text-sm text-gray-500">Data Analyst at Microsoft</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-navy text-black text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 font-serif">Ready to Land Your Dream Job?</h2>
          <p className="text-xl md:text-2xl mb-8 text-gray-800 max-w-3xl mx-auto">
            Join thousands of professionals who have accelerated their job search with our AI-powered tools.
          </p>
          <Link to="/register">
            <button className="inline-flex items-center justify-center px-8 py-4 bg-white text-navy text-lg font-bold rounded-md shadow-lg hover:bg-blue-50 transition transform hover:scale-105">
              Get Started Free
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
              </svg>
            </button>
          </Link>
          <p className="mt-4 text-gray-800">No credit card required. Free forever.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Landed</h3>
              <p className="text-gray-400">
                AI-powered job search platform helping professionals land their dream jobs faster.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Features</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Job Search</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">AI Resume Generator</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Cover Letter Writer</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Interview Coach</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Landed. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 