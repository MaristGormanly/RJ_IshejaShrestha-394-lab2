const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const db = require('./db/config');
const admin = require('firebase-admin');

// Initialize Firebase Admin
let firebaseInitialized = false;
try {
  const serviceAccount = require('./firebase-service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  firebaseInitialized = true;
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  console.log('Please make sure firebase-service-account.json is present in the Backend directory');
}

// Import routes
const jobsRoutes = require('./routes/jobs');

// Load environment variables
dotenv.config();

const app = express();

// Configure CORS for all routes
app.use(cors({
  origin: '*', // In production, change this to your specific domain
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Parse JSON bodies
app.use(express.json());

// Add headers middleware
app.use((req, res, next) => {
  // Set CORS headers manually as a fallback
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  
  // Log all requests
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
});

// Routes
app.use('/api/jobs', jobsRoutes);

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function(req, file, cb) {
    // Accept only certain file types
    const allowedTypes = ['text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only txt, pdf, and doc/docx files are allowed.'));
    }
  }
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create or update user profile
app.post('/api/profiles', async (req, res) => {
  try {
    const { userId, email, name } = req.body;
    
    const query = `
      INSERT INTO users (id, email, name)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO UPDATE
      SET email = EXCLUDED.email,
          name = EXCLUDED.name
      RETURNING *;
    `;
    
    const result = await db.query(query, [userId, email, name]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user profile
app.get('/api/profiles/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await db.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Upload profile document
app.post('/api/profiles/:userId/documents', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { userId } = req.params;
    const documentId = uuidv4();
    
    // First, ensure user exists
    const userQuery = 'SELECT id FROM users WHERE id = $1';
    const userResult = await db.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const query = `
      INSERT INTO documents (
        id, user_id, title, type, filename, original_name, mime_type, size, file_path
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      documentId,
      userId,
      req.body.title || req.file.originalname,
      req.body.type || 'profile_document',
      req.file.filename,
      req.file.originalname,
      req.file.mimetype,
      req.file.size,
      `/uploads/${req.file.filename}`
    ];

    const result = await db.query(query, values);
    const document = result.rows[0];

    res.json({
      id: document.id,
      filename: document.filename,
      originalname: document.original_name,
      mimetype: document.mime_type,
      size: document.size,
      url: `${req.protocol}://${req.get('host')}${document.file_path}`,
      type: document.type
    });
  } catch (error) {
    console.error('Profile document upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Get profile documents
app.get('/api/profiles/:userId/documents', async (req, res) => {
  try {
    const { userId } = req.params;
    const query = `
      SELECT * FROM documents 
      WHERE user_id = $1 AND type = 'profile_document'
      ORDER BY created_at DESC
    `;
    const result = await db.query(query, [userId]);
    
    const documents = result.rows.map(doc => ({
      ...doc,
      url: `${req.protocol}://${req.get('host')}${doc.file_path}`
    }));
    
    res.json(documents);
  } catch (error) {
    console.error('Error fetching profile documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Delete profile document
app.delete('/api/profiles/:userId/documents/:documentId', async (req, res) => {
  try {
    const { userId, documentId } = req.params;
    
    // Get document details and verify ownership
    const getQuery = 'SELECT * FROM documents WHERE id = $1 AND user_id = $2';
    const document = await db.query(getQuery, [documentId, userId]);
    
    if (document.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found or unauthorized' });
    }

    // Delete file from filesystem
    const filepath = path.join(__dirname, document.rows[0].file_path);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    // Delete from database
    const deleteQuery = 'DELETE FROM documents WHERE id = $1 AND user_id = $2';
    await db.query(deleteQuery, [documentId, userId]);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete profile document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.body.userId; // Get from auth token in production
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Create document record in database
    const documentId = uuidv4();
    const query = `
      INSERT INTO documents (
        id, user_id, title, type, filename, original_name, mime_type, size, file_path
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      documentId,
      userId,
      req.body.title || req.file.originalname,
      req.body.type || 'resume',
      req.file.filename,
      req.file.originalname,
      req.file.mimetype,
      req.file.size,
      `/uploads/${req.file.filename}`
    ];

    const result = await db.query(query, values);
    const document = result.rows[0];

    res.json({
      id: document.id,
      filename: document.filename,
      originalname: document.original_name,
      mimetype: document.mime_type,
      size: document.size,
      url: `${req.protocol}://${req.get('host')}${document.file_path}`
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Get user's documents
app.get('/api/documents/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const query = 'SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await db.query(query, [userId]);
    
    const documents = result.rows.map(doc => ({
      ...doc,
      url: `${req.protocol}://${req.get('host')}${doc.file_path}`
    }));
    
    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Download file endpoint
app.get('/api/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(__dirname, 'uploads', filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(filepath);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'File download failed' });
  }
});

// Delete document endpoint
app.delete('/api/documents/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    
    // Get document details
    const getQuery = 'SELECT * FROM documents WHERE id = $1';
    const document = await db.query(getQuery, [documentId]);
    
    if (document.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete file from filesystem
    const filepath = path.join(__dirname, document.rows[0].file_path);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    // Delete from database
    const deleteQuery = 'DELETE FROM documents WHERE id = $1';
    await db.query(deleteQuery, [documentId]);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Get resume content
app.get('/api/resumes/:resumeId/content', async (req, res) => {
  try {
    const { resumeId } = req.params;
    
    // Get document details
    const getQuery = 'SELECT * FROM documents WHERE id = $1';
    const document = await db.query(getQuery, [resumeId]);
    
    if (document.rows.length === 0) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Read file content
    const filepath = path.join(__dirname, document.rows[0].file_path);
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Resume file not found' });
    }

    const content = fs.readFileSync(filepath, 'utf8');
    res.json({ content });
  } catch (error) {
    console.error('Error fetching resume content:', error);
    res.status(500).json({ error: 'Failed to fetch resume content' });
  }
});

// Get all resumes for a user
app.get('/api/resumes', async (req, res) => {
  try {
    // Get user ID from auth token
    const userId = req.headers.authorization.split(' ')[1]; // In production, properly decode JWT
    
    const query = `
      SELECT id as _id, title as name, created_at as createdAt, updated_at as updatedAt
      FROM documents 
      WHERE user_id = $1 AND type = 'resume'
      ORDER BY updated_at DESC
    `;
    const result = await db.query(query, [userId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching resumes:', error);
    res.status(500).json({ error: 'Failed to fetch resumes' });
  }
});

// Get total user count
app.get('/api/users/count', async (req, res) => {
  try {
    if (!firebaseInitialized) {
      return res.status(500).json({ error: 'Firebase Admin SDK not initialized' });
    }
    const listUsersResult = await admin.auth().listUsers();
    res.json({ count: listUsersResult.users.length });
  } catch (error) {
    console.error('Error fetching user count:', error);
    res.status(500).json({ error: 'Failed to fetch user count' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 