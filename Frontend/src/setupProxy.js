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

  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
    })
  );
}; 