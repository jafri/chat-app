// Initializes the `messages` service on path `/messages`
const { Messages } = require('./messages.class');
const hooks = require('./messages.hooks');

module.exports = function (app) {
  // Initialize our service with any options it requires
  app.use('/messages', new Messages(app));

  // Get our initialized service so that we can register hooks
  const service = app.service('messages');

  service.hooks(hooks);
};
