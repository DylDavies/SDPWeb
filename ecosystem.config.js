module.exports = {
  apps: [{
    name: 'angular',
    script: './dist/SDPWeb/server/server.mjs',
    env_production: {
      NODE_ENV: 'production',
      PM2_RUN: 'true'
    }
  }]
};