module.exports = {
  apps: [{
    name: 'angular',
    script: './dist/SDPWeb/server/server.mjs', // IMPORTANT: Update this path
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};