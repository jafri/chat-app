<template>
  <div id="app">
    <b-container fluid class="h-100 p-0">
      <!-- Top nav bar -->
      <b-navbar toggleable="lg" type="dark" variant="primary" style="background-color: rgb(83, 167, 219) !important;">
        <b-navbar-brand href="#">SendIt</b-navbar-brand>
        <b-navbar-nav class="ml-auto">
          <template v-if="currentUser"><em>{{ currentUser }}</em></template>
          <div v-else>
            No User Selected
          </div>
        </b-navbar-nav>
      </b-navbar>

      <!-- Main content-->
      <b-row style="height: calc(100% - 56px);">
        <!-- Left Side -->
        <b-col cols="9" style="max-height: 100%;">
          <b-row style="height: calc(100% - 50px);" align-v="end">
            <b-col style="padding: 15px 0px 0px 40px; max-height: 100%; overflow-y: scroll; overflow-x: none;" id="message-container">
              <b-row
                class="message"
                v-for="(message, index) of messages"
                :key="index"
                style="margin-bottom: 15px;"
              >
                <b-col cols="9" style="text-align: left;">
                  <span :style="`color: ${message.color}`">
                    {{ message.user }}
                  </span>
                  <br/>

                  <span v-if="currentUser === message.user" style="font-weight: 700;">
                    {{ message.message }}
                  </span>
                  <span v-else>
                    {{ message.message }}
                  </span>
                </b-col>
                <b-col style="color: #949393;">
                  {{ parseDate(message.timestamp) }}
                </b-col>
              </b-row>
            </b-col>
          </b-row>

          <b-row style="height: 50px; margin-left: 1px;">
            <b-input-group
              key="lg"
              size="lg"
              class="mb-3"
            >
              <b-form-input
                id="input-large"
                size="lg"
                placeholder="Enter your message..."
                v-model="message"
                                  v-on:keyup.enter="sendMessage"
              />
              <b-input-group-append>
                <b-button
                  size="sm"
                  text="Button"
                  variant="success"
                  style="background-color: rgb(83, 167, 219) !important;"
                  @click="sendMessage"
                >
                  Send
                </b-button>
              </b-input-group-append>
            </b-input-group>
          </b-row>
        </b-col>

        <!-- Right Side -->
        <b-col style="padding-top: 15px; border-style: solid; border-color: lightgray; border-width: 1px;">
          <h4>Online Users</h4>

          <b-row v-for="(user, index) of Object.values(users)" :key="index" style="padding: 0px 15px;">
            <span :style="`color: ${user.color};`">{{ user.username }}</span>
          </b-row>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
const moment = require('moment')
const io = require('socket.io-client');
const feathers = require('@feathersjs/feathers');
let socketio = require('@feathersjs/socketio-client');
const socket = io(process.env.NODE_ENV === 'development' ? 'http://localhost:2889' : 'https://sendit-mmtrmvjr4.now.sh');

const app = feathers();
app.configure(socketio(socket));

const messageService = app.service('messages')

export default {
  name: 'App',
  components: {},
  data () {
    return {
      showSelectNickname: true,
      newNickNameInput: '',
      newColorInput: '',
      message: '',
      currentUser: '',
      users: {},
      messages: [],
      messageListener: undefined
    }
  },

  methods: {
    parseDate (date) {
      return moment(date).format('h:mm:ss a, MMMM Do');
    },

    scrollToBottom () {
      const element = document.getElementById("message-container");
      element.scrollTop = element.scrollHeight;
    },

    async selectNickname (firstLoad = false) {
      try {
        const result = await messageService.create({
          type: 'user',
          firstLoad,
          ...(!!this.newColorInput && { color: this.newColorInput }),
          ...(!!this.newNickNameInput && { username: this.newNickNameInput })
        });
        const { username, color } = result;
        console.log(username)
        this.currentUser = username
        localStorage.setItem('chatCreds', this.currentUser);
        localStorage.setItem('chatColor', color);
      } catch (e) {
        alert('Nickname already exists')
      }

      this.showSelectNickname = false
    },

    async sendMessage () {
      if (!this.message || !this.currentUser) return

      // Nick or nick color
      const [extraCommand, extra] = this.message.split(' ')
      if (extraCommand === '/nick') {
        this.newNickNameInput = extra;
        await this.selectNickname()
        this.message = ''
        return;
      } else if (extraCommand === '/nickcolor') {
        if (/^[0-9A-F]{6}$/i.test(extra)) {
          const color = `#${extra}`
          await messageService.create({
            type: 'colorchange',
            color
          });
          localStorage.setItem('chatColor', color);
          this.message = ''
        } else {
          alert('Invalid Hex Color: ' + extra)
        }
        return;
      }

      // Send message
      try {
        await messageService.create({
          type: 'message',
          user: this.currentUser,
          message: this.message
        });
        this.scrollToBottom()
      } catch (e) {
        alert('Error sending message!')
        console.log(e)
      }

      this.message = ''
    },

    async getInitialMessages () {
      this.messages = await messageService.find({ query: { type: 'message' } });
    },

    async initialize () {
      // Get initial messages and users
      this.messages = await messageService.find({ query: { type: 'message' } });
      this.users = await messageService.find({ query: { type: 'user' } });

      // Scroll
      this.scrollToBottom()

      // Listen for new messages
      this.messageListener = messageService.on('created', message => {
        if (message.message) {
          this.messages.push(message)
          this.scrollToBottom()
        } else if (message.color) {
          // no-op
        } else {
          this.users = message;
        }
      });

      // Find stored names
      const storedName = localStorage.getItem('chatCreds');
      if (storedName) {
        this.newNickNameInput = storedName
        this.newColorInput = localStorage.getItem('chatColor');
      }
      this.selectNickname(true)
    }
  },

  mounted () {
    this.initialize()
  }
}
</script>

<style>
html,
body {
  height: 100%;
}

.message {
  height: 50px
}

#app {
  height: 100%;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
