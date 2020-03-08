const randomWords = require('random-words');
const randomColor = require('randomcolor');

/* eslint-disable no-unused-vars */
exports.Messages = class Messages {
  constructor (app) {
    this.app = app;
    this.messages = [];
    this.users = {};

    // remove user on disconnect
    app.on('disconnect', (conn) => {
      if (this.users[conn.id]) {
        delete this.users[conn.id];
        app.service('messages').create({});
      }
    });
  }

  async find (params) {
    if (params.query.type === 'message') {
      return this.messages;
    } else if (params.query.type === 'user') {
      return this.users;
    }
  }

  async get (id, params) {
    return { id };
  }

  async create (data, params) {
    if (Array.isArray(data)) {
      return Promise.all(data.map(current => this.create(current, params)));
    }

    if (data.type === 'message') {
      const message = {
        ...data,
        color: this.users[params.connection.id].color,
        timestamp: new Date()
      };

      this.messages.push(message);
      return message;
    } else if (data.type === 'user') {
      let username = data.username || randomWords();
      let color = data.color || randomColor();
      let userExists = Object.values(this.users).find(user => user.username === username);

      if (userExists && data.firstLoad) {
        userExists = false;
        username = randomWords();
        color = randomColor();
      }
      if (userExists) {
        throw new Error('User already exists');
      } else {
        const user = { username, color };
        this.users[params.connection.id] = user;
        this.create({});
        return user;
      }
    } else if (data.type === 'colorchange') {
      if (this.users[params.connection.id]) {
        this.users[params.connection.id].color = data.color;
      }
    }

    return this.users;
  }

  async update (id, data, params) {
    return data;
  }

  async patch (id, data, params) {
    return data;
  }

  async remove (id, params) {
    return { id };
  }
};
