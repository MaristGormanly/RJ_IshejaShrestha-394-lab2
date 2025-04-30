module.exports = {
  devServer: {
    allowedHosts: 'all',
    host: 'localhost',
    port: 3000,
    proxy: {
      '/api': 'http://localhost:5000',
      '/firebase-storage-proxy': {
        target: 'https://firebasestorage.googleapis.com',
        changeOrigin: true,
        pathRewrite: {
          '^/firebase-storage-proxy': ''
        }
      }
    }
  }
}; 