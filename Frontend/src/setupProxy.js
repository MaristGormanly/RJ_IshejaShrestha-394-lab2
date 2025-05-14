const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  // Firebase Storage proxy with more comprehensive configuration
  app.use(
    '/firebase-storage-proxy',
    createProxyMiddleware({
      target: 'https://firebasestorage.googleapis.com',
      changeOrigin: true,
      pathRewrite: {
        '^/firebase-storage-proxy': ''
      },
      onProxyRes: function(proxyRes, req, res) {
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
      }
    })
  );

  // This proxy middleware is only used in development
  // In production with Firebase, the API requests are handled by the rewrite rules in firebase.json
  if (process.env.NODE_ENV !== 'production') {
    app.use(
      '/api',
      createProxyMiddleware({
        target: process.env.REACT_APP_API_URL || 'http://localhost:5000',
        changeOrigin: true,
      })
    );
  }
}; 