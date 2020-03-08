module.exports = function(app) {
  if(typeof app.channel !== 'function') {
    // If no real-time functionality has been configured just return
    return;
  }

  app.on('connection', connection => {
    app.channel('anonymous').join(connection);
  });

  app.on('login', (authResult, { connection }) => {
    if (connection) {
      app.channel('anonymous').leave(connection);
    }
  });

  // eslint-disable-next-line no-unused-vars
  app.publish((data, hook) => {
    return app.channel('anonymous');
  });
};
