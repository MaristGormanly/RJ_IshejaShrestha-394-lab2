const admin = require('firebase-admin');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const https = require('https');
const dotenv = require('dotenv');
const { createTables } = require('../db/migrations');

dotenv.config();

// Initialize Firebase Admin
const serviceAccount = require('../firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

// Initialize PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

const downloadFile = async (url, destPath) => {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download file: ${response.statusCode}`));
        return;
      }
      const fileStream = fs.createWriteStream(destPath);
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
    }).on('error', reject);
  });
};

const migrateUsers = async () => {
  try {
    console.log('Starting user migration...');
    const usersSnapshot = await admin.firestore().collection('users').get();
    
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      
      // Ensure we have at least the required fields
      if (!userData.email) {
        console.warn(`Skipping user ${doc.id} - missing email`);
        continue;
      }

      // Use Firebase ID directly
      const query = `
        INSERT INTO users (id, email, name)
        VALUES ($1, $2, $3)
        ON CONFLICT (id) DO UPDATE
        SET email = EXCLUDED.email,
            name = EXCLUDED.name
        RETURNING *;
      `;
      
      await pool.query(query, [
        doc.id, // Use Firebase ID directly
        userData.email,
        userData.name || null
      ]);
      
      // If additional profile data exists, update it separately
      if (userData.phone || userData.location || userData.profession) {
        const updateQuery = `
          UPDATE users 
          SET phone = $1,
              location = $2,
              profession = $3,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $4;
        `;
        
        await pool.query(updateQuery, [
          userData.phone || null,
          userData.location || null,
          userData.profession || null,
          doc.id // Use Firebase ID directly
        ]);
      }
      
      console.log(`Migrated user: ${userData.email}`);
    }
    console.log('User migration completed');
  } catch (error) {
    console.error('Error migrating users:', error);
    throw error;
  }
};

const migrateDocuments = async () => {
  try {
    console.log('Starting document migration...');
    const bucket = admin.storage().bucket();
    const uploadDir = path.join(__dirname, '..', 'uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const documentsSnapshot = await admin.firestore().collection('documents').get();
    
    for (const doc of documentsSnapshot.docs) {
      const documentData = doc.data();
      
      // Skip if required fields are missing
      if (!documentData.userId) {
        console.warn(`Skipping document ${doc.id} - missing userId`);
        continue;
      }

      // Check if user exists
      const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [documentData.userId]);
      if (userCheck.rows.length === 0) {
        console.warn(`Skipping document ${doc.id} - user ${documentData.userId} not found`);
        continue;
      }
      
      // Download file from Firebase Storage
      if (documentData.fileUrl) {
        const filename = `${Date.now()}-${documentData.originalName || 'document'}`;
        const filePath = path.join(uploadDir, filename);
        
        try {
          await downloadFile(documentData.fileUrl, filePath);
          
          // Get file stats
          const stats = fs.statSync(filePath);
          
          // Insert document record into PostgreSQL using Firebase ID
          const query = `
            INSERT INTO documents (
              id, user_id, title, type, filename, original_name, mime_type, size, file_path
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *;
          `;
          
          await pool.query(query, [
            doc.id, // Use Firebase document ID
            documentData.userId,
            documentData.title || documentData.originalName || 'Untitled',
            documentData.type || 'profile_document',
            filename,
            documentData.originalName || filename,
            documentData.mimeType || 'application/octet-stream',
            stats.size,
            `/uploads/${filename}`
          ]);
          
          console.log(`Migrated document: ${documentData.originalName || filename}`);
        } catch (error) {
          console.error(`Error migrating document ${doc.id}:`, error);
          // Clean up file if it was created
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          continue;
        }
      }
    }
    console.log('Document migration completed');
  } catch (error) {
    console.error('Error migrating documents:', error);
    throw error;
  }
};

const migrateAIGenerations = async () => {
  try {
    console.log('Starting AI generations migration...');
    const generationsSnapshot = await admin.firestore().collection('ai-generated').get();
    
    for (const doc of generationsSnapshot.docs) {
      const generationData = doc.data();
      
      // Skip if required fields are missing
      if (!generationData.userId || !generationData.content || !generationData.type) {
        console.warn(`Skipping AI generation ${doc.id} - missing required fields`);
        continue;
      }

      // Check if user exists
      const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [generationData.userId]);
      if (userCheck.rows.length === 0) {
        console.warn(`Skipping AI generation ${doc.id} - user ${generationData.userId} not found`);
        continue;
      }
      
      const query = `
        INSERT INTO ai_generations (
          id, user_id, document_id, type, content, prompt, model_used
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
        RETURNING *;
      `;
      
      await pool.query(query, [
        doc.id, // Use Firebase document ID
        generationData.userId,
        generationData.documentId || null,
        generationData.type,
        generationData.content,
        generationData.prompt || null,
        generationData.modelUsed || 'gpt-3.5-turbo'
      ]);
      
      console.log(`Migrated AI generation: ${doc.id}`);
    }
    console.log('AI generations migration completed');
  } catch (error) {
    console.error('Error migrating AI generations:', error);
    throw error;
  }
};

const runMigration = async () => {
  try {
    // First run the database migrations
    console.log('Running database migrations...');
    await createTables();
    console.log('Database migrations completed');
    
    // Then migrate the data
    console.log('Starting data migration...');
    await migrateUsers();
    await migrateDocuments();
    await migrateAIGenerations();
    
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    admin.app().delete();
  }
};

runMigration(); 