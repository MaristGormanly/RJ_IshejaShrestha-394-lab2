# Landed - AI-Powered Resume & Cover Letter Tool

Landed is a modern web application that helps job seekers create tailored resumes and cover letters using AI to match job descriptions and improve their chances of landing interviews.

## Features

- **Resume Parsing**: Automatically extract key information from uploaded resumes using NLP
- **Cover Letter Generator**: Create personalized cover letters based on your resume and job descriptions
- **Resume Tailoring**: Optimize your resume for specific job descriptions with AI suggestions
- **Skills Gap Analysis**: Identify missing skills using our knowledge graph algorithm and get recommendations
- **Document Management**: Save, edit, and download your tailored documents
- **User Authentication**: Secure multi-factor authentication with OAuth integration
- **Responsive Design**: Optimized experience across desktop and mobile devices

## Tech Stack

### Frontend

- **Framework**: React.js (Single Page Application)
- **UI Library**: Tailwind CSS for responsive design
- **State Management**: React Context API
- **Form Handling**: Formik with Yup validation
- **Testing**: Jest and React Testing Library

### Backend

- **Firebase Services**:
  - Authentication (Email/Password, Google, LinkedIn, GitHub)
  - Cloud Firestore Database
  - Firebase Storage
  - Firebase Hosting
  - Cloud Functions for serverless operations
- **Security**: Firebase Security Rules for granular access control

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:

   ```
   git clone <repository-url>
   cd covercraft
   ```

2. Install all dependencies:

   ```
   npm run install-all
   ```

3. Set up Firebase:

   - Create a new Firebase project at https://console.firebase.google.com/
   - Enable Authentication (Email/Password, Google, LinkedIn, GitHub)
   - Enable Firestore Database
   - Enable Storage
   - Get your Firebase configuration (Project settings > General > Your apps > Firebase SDK snippet > Config)
   - Update the Firebase configuration in `Frontend/src/firebase/config.js`

4. Start the development servers:

   ```
   # Start backend development server
   npm run backend:start

   # In a separate terminal, start frontend development server
   npm run frontend:start
   ```

5. Build for production:
   ```
   npm run predeploy
   ```

## Deployment

To deploy the application to Firebase Hosting:

1. Install Firebase CLI if not already installed:

   ```
   npm install -g firebase-tools
   ```

2. Login to Firebase:

   ```
   firebase login
   ```

3. Deploy the entire application:

   ```
   npm run deploy
   ```

   Or deploy frontend and backend separately:

   ```
   npm run frontend:deploy
   npm run backend:deploy
   ```

## Project Structure

```
CoverCraft/
├── Frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # React Context providers
│   │   ├── firebase/        # Firebase configuration and services
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Page components
│   │   ├── services/        # API and service integrations
│   │   ├── utils/           # Utility functions
│   │   ├── App.js           # Main application component
│   │   ├── index.js         # Application entry point
│   │   └── index.css        # Global styles
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
├── Backend/
│   ├── functions/           # Firebase Cloud Functions
│   ├── package.json
│   └── firestore.rules      # Database security rules
├── package.json             # Root package.json for deployment scripts
└── firebase.json            # Firebase configuration
```

## Key Technical Implementations

- **TF-IDF Algorithm**: For matching resume content with job descriptions
- **Named Entity Recognition**: For identifying skills and experiences in documents
- **Knowledge Graph**: For skills relationship mapping and recommendations
- **Template-based Generation**: For dynamic cover letter creation

## Security Features

- HTTPS-only communication
- JWT token authentication with refresh token rotation
- Role-based access control
- Data validation and sanitization
- Regular security audits and penetration testing

## Performance Optimizations

- Code splitting and lazy loading
- Caching strategies for processed documents
- CDN delivery for static assets
- Optimized database queries with indexing

## Future Enhancements

- **AI-driven Interview Preparation**: Question prediction and answer suggestions
- **ATS Integration**: Direct submission to popular Applicant Tracking Systems
- **Advanced Document Formatting**: Custom template builder with drag-and-drop interface
- **Career Progression Analysis**: ML-powered career path prediction and skills development
- **Template Marketplace**: Community-contributed templates for various industries

## Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

[MIT License](LICENSE)
