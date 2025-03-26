# CoverCraft - Resume & Cover Letter Tool

CoverCraft is a modern web application that helps job seekers create tailored resumes and cover letters using AI to match job descriptions.

## Features

- **Cover Letter Generator**: Create personalized cover letters based on your resume and job descriptions
- **Resume Tailoring**: Optimize your resume for specific job descriptions to increase your chances of getting interviews
- **Skills Analysis**: Identify missing skills and recommendations for improvement
- **User Authentication**: Securely store your documents and access them from anywhere
- **Document Management**: Save, edit, and download your tailored documents

## Tech Stack

- **Frontend**: React, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Deployment**: Firebase Hosting

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:

   ```
   git clone <repository-url>
   cd covercraft
   ```

2. Install dependencies:

   ```
   cd Frontend
   npm install
   ```

3. Set up Firebase:

   - Create a new Firebase project at https://console.firebase.google.com/
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Enable Storage
   - Get your Firebase configuration (Project settings > General > Your apps > Firebase SDK snippet > Config)
   - Update the Firebase configuration in `src/firebase/config.js`

4. Start the development server:

   ```
   npm start
   ```

5. Build for production:
   ```
   npm run build
   ```

## Deployment

To deploy the application to Firebase Hosting:

1. Install Firebase CLI:

   ```
   npm install -g firebase-tools
   ```

2. Login to Firebase:

   ```
   firebase login
   ```

3. Initialize Firebase:

   ```
   firebase init
   ```

   - Select Hosting
   - Select your Firebase project
   - Set the public directory to `build`
   - Configure as a single-page app

4. Deploy:
   ```
   firebase deploy
   ```

## Project Structure

```
Frontend/
├── public/
├── src/
│   ├── components/      # Reusable UI components
│   ├── firebase/        # Firebase configuration and services
│   ├── pages/           # Page components
│   ├── utils/           # Utility functions
│   ├── App.js           # Main application component
│   ├── index.js         # Application entry point
│   └── index.css        # Global styles
├── package.json
├── tailwind.config.js
└── postcss.config.js
```

## Future Enhancements

- Integration with job search APIs
- Advanced document formatting options
- AI-powered resume and cover letter analysis
- Template marketplace
- Export to different file formats

## License

[MIT License](LICENSE)
