<template>
  <tabs @changed="tabChanged">
    <tab name="vCard" title="vCard">
      <!-- profile -->
      <div id="profile">
        <h4>My profile</h4>
        <h6>Name</h6>
        <input id="vcard_name" type="text" placeholder="first and last name" v-model="profile.name" />
        <h6>Mail</h6>
        <input id="vcard_email" type="email" placeholder="mail address" v-model="profile.email" />
        <h6>Phone</h6>
        <input id="vcard_phone" type="tel" placeholder="phone number" v-model="profile.phone" />
      </div>
    </tab>

    <tab name="URL" title="URL">
      <!-- profile -->
      <div id="profile">
        <h4>URL</h4>
        <h6>Name</h6>
        <input id="url_name" type="text" placeholder="name" v-model="profile.name" />
        <h6>URL</h6>
        <input id="url_url" type="text" placeholder="url" v-model="profile.url" />
      </div>
    </tab>
  </tabs>
  
  <!-- toolbar -->
  <div id="toolbar">
    <button @click="saveQrCode()">Save QR code</button>
  </div>  

  <!-- modal dialog for QR download  -->
  <div id="qrDisplayModal" class="modal" :hidden="!showQrDisplay">
    <div class="close-modal" @click="showQrDisplay = !showQrDisplay">X</div>
    <canvas id="qrDisplay"></canvas>
    <center>
      <pre>{{qrToDisplay}}</pre>
      <input type="button" id="downloadButton" @click="downloadQrCode()" value="Download" />
    </center>
  </div>

  <div id="myQrContainer">
    <keep-alive><canvas id="myQrDisplay"></canvas></keep-alive>
  </div>  
  <div id="contacts">
    <h4>Contacts</h4>
    <div id="no-contacts" v-if="content.length == 0">No contacts yet.</div>

    <div class="contact" v-for="c in content" :key="c.id">
      <div class="contact-name">{{c.name}}</div>
      <div class="contact-email">{{c.email}}</div>
      <div class="contact-phone">{{c.phone}}</div>
      <div class="contact-phone">{{c.url}}</div>
      <div class="contact-toolbar">
        <button @click="displayQrCode(c, 'qrDisplay')">Share</button>
        <button @click="clickDelete(c.id)">Delete</button>
      </div>
    </div>
  </div>    
</template>

<script>
import QRCode from 'qrcode';
import md5 from 'md5';
import profileService from '@/services/profileService';
import contactService from '@/services/contactService';
import Tabs from "./Tabs.vue";
import Tab from "./Tab.vue";

export default {  
  components: { Tabs, Tab },
  data() {
    return {
      // boolean variables to keep track of pop-up windows being shown
      showQrDisplay: false,
      showQrReader: false,

      // MD5 hash of the contact currently shown (only for validation)
      qrToDisplay: null,

      // own profile
      profile: {
        name: null,
        email: null,
        phone: null,
        url: null,
        type: null,
      },

      // list of all conent
      content: [],
    };
  },

  methods: {
    // object-destructuring to add functions of our services in 'methods'
    ...contactService,
    ...profileService,

    tabChanged(selectedTab) {
      this.profile.type = selectedTab.tab.name;
      this.profile.name = "";
      this.profile.phone = "";
      this.profile.email = "";
      this.profile.url = "";
    },
    
    // load data from the contact and profile services into the view
    loadData() {
      this.content = this.getContacts().reverse();
      this.profile = this.getProfile();
    },

    downloadQrCode() {
      const myCanvas = document.getElementById('qrDisplay');
      const img = document.getElementById('qrDisplay').getElementsByTagName('img');
      img.src = myCanvas.toDataURL('image/jpg');
      const a = document.createElement('a');
      // Set the href attribute of the a tag (turn the canvas into a png image)
      a.href = img.src;
      a.download = 'qrcode';
      a.click();
    },

    // delete contact via our service
    clickDelete(contact) {
      this.deleteContact(contact);
      this.loadData();
    },

    // save QR code
    saveQrCode() {
      this.createContact(this.getProfile());
      this.loadData();
    },

    renderData(payload) {
      if (payload.type == 'URL') {
        payload = JSON.stringify(payload.url);
      } else {
        payload = JSON.stringify({
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
        });
      }
      return payload;
    },

    // show QR code for payload (contact / url)
    displayQrCode(payload, elementId) {
      const data = this.renderData(payload);
      const qrDisplay = document.getElementById(elementId);

      // show payload (contact / url) as QR code via its JSON string
      QRCode.toCanvas(qrDisplay, data);
      this.qrToDisplay = md5(data);
      this.showQrDisplay = true;
    },

    displayMyQrCode(payload, elementId) {
      const data = this.renderData(payload);      
      const myCanvas = document.getElementById(elementId);
      if (myCanvas != null) {
        QRCode.toCanvas(myCanvas, data);
      }
    },
  },

  watch: {
    // whenever input changes, update and display those changes in QR code
    profile: {
      handler() {
        this.setProfile(this.profile);
        this.displayMyQrCode(this.profile, 'myQrDisplay');
      },
      deep: true,
    },
  },

  // load data when opening the page
  mounted() {
    this.loadData();
  },
};
</script>

<style lang="scss">
* {
  box-sizing: border-box;
}

body,
html {
  padding: 0;
  margin: 0;
  height: 100%;
  font-family: Verdana, sans-serif;
  background-color:rgb(0, 0, 0);
}

#app {
  max-width: 450px;
  height: 100%;
  overflow: auto;
  margin: auto;
  background-color: white;
  padding: 20px 40px 40px 40px;

  .modal {
    position: fixed;
    background-color: white;
    top: 0px;
    width: 100%;
    margin-left: -80px;
    max-width: 450px;
    height: 100%;
    .close-modal {
      cursor: pointer;
      padding: 10px;
      text-align: right;
      font-weight: bold;
      font-size: 24px;
    }
  }

  #toolbar {
    display: flex;
    justify-content: space-around;
    button {
      padding: 10px;
      margin: 10px;
    }
  }

  #qrDisplayModal {
    canvas {
      width: 100% !important;
      height: auto !important;
    }
  }

  #profile {
    h4 {
      color: #0b27b6;
    }
    h6 {
      margin: 0;
    }
    input {
      width: 100%;
      padding: 5px;
      margin: 5px 0;
    }
  }

  #myQrContainer{
    width: 100%;
    text-align: center;

    #myQrDisplay {
      margin: 5px 25px;
      width: calc(60% - 50px) !important;
      height: auto !important;
    }
  }

  #contacts {
    h4 {
      color: #0b27b6;
    }
    #no-contacts {
      text-align: center;
      font-style: italic;
      margin: 50px 0;
    }
    .contact {
      border: 1px solid #7a7a7a;
      padding: 10px;
      margin: 10px 0;
      line-height: 1.25;

      .contact-name {
        font-weight: bold;
        margin-bottom: 5px;
      }
      .contact-email {
        font-style: italic;
      }
      .contact-phone {
        font-style: italic;
      }
      .contact-toolbar {
        display: flex;
        justify-content: space-around;
        margin-top: 10px;
        button {
          width: 45%;
        }
      }
    }
  }
}
</style>
