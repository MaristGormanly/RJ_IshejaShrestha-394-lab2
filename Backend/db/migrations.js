const { pool } = require('./config');

const createTables = async () => {
  try {
    // Drop existing tables if they exist (be careful with this in production)
    await pool.query(`
      DROP TABLE IF EXISTS ai_generations CASCADE;
      DROP TABLE IF EXISTS documents CASCADE;
      DROP TABLE IF EXISTS profile_settings CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    // Create users table with all required fields - using VARCHAR for Firebase IDs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(128) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        phone VARCHAR(50),
        location VARCHAR(255),
        profession VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create documents table - using VARCHAR for IDs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id VARCHAR(128) PRIMARY KEY,
        user_id VARCHAR(128) REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        size INTEGER NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        description TEXT,
        tags TEXT[],
        is_public BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create ai_generations table - using VARCHAR for IDs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_generations (
        id VARCHAR(128) PRIMARY KEY,
        user_id VARCHAR(128) REFERENCES users(id) ON DELETE CASCADE,
        document_id VARCHAR(128) REFERENCES documents(id) ON DELETE SET NULL,
        type VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        prompt TEXT,
        model_used VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create profile_settings table - using VARCHAR for user_id
    await pool.query(`
      CREATE TABLE IF NOT EXISTS profile_settings (
        user_id VARCHAR(128) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        default_resume_format VARCHAR(50),
        preferred_job_types TEXT[],
        notification_preferences JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('All tables created successfully');
  } catch (err) {
    console.error('Error creating tables:', err);
    throw err;
  }
};

// Export both functions
module.exports = {
  createTables,
  runMigrations: async () => {
    try {
      await createTables();
      console.log('Migrations completed successfully');
    } catch (err) {
      console.error('Migration failed:', err);
      throw err;
    }
  }
};

// Run migrations if this file is run directly
if (require.main === module) {
  createTables()
    .then(() => {
      console.log('Migrations completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    })
    .finally(() => {
      pool.end();
    });
} 