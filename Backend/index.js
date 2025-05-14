const functions = require('firebase-functions');
const app = require('./server'); // Import your existing Express app

// This is the Firebase Functions entry point
exports.api = functions.https.onRequest(app);

// We're removing the local server start since Firebase will handle this
// Only start the server if directly executing this file
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} 