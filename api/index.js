const { app } = require('../src/app');

module.exports = (req, res) => {
  // Handle the request with the Express app
  return app(req, res);
};