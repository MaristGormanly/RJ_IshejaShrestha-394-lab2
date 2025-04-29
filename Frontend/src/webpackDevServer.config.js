// This file overrides the webpack dev server configuration
// to fix the allowedHosts issue permanently
module.exports = {
  allowedHosts: 'all', // This will accept connections from all hosts
  // You can also use: allowedHosts: ['localhost', '.localhost']
  
  // Other common development server settings
  compress: true,
  hot: true,
  historyApiFallback: true
}; 