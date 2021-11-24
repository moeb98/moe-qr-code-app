<template>
  <div id="app">
    <!-- Toolbar -->
    <div id="toolbar">
      <button @click="readQrCode">Read new QR code</button>
    </div>
    <div id="qrDisplayModal" class="modal" :hidden="!showQrDisplay">
      <div class="close-modal" @click="showQrDisplay = !showQrDisplay">X</div>
      <canvas id="qrDisplay"></canvas>
      <center>
        <pre>{{contactToDisplay}}</pre>
      </center>
    </div>

    <!-- QR Reader -->
    <div id="qrReader" class="modal" :hidden="!showQrReader">
      <div class="close-modal" @click="showQrReader = !showQrReader">X</div>
      <video id="qrReaderVideo"></video>
      <canvas id="qrReaderImage" hidden></canvas>
    </div>

    <!-- own profile -->
    <div id="profile">
      <h3>My profile</h3>
      <h6>Name</h6>
      <input type="text" placeholder="first and last name" v-model="profile.name" />
      <h6>Mail</h6>
      <input type="email" placeholder="mail address" v-model="profile.email" />
      <h6>Phone</h6>
      <input type="tel" placeholder="phone number" v-model="profile.phone" />
      <canvas id="myQrDisplay"></canvas>
    </div>

    <!-- list of contacts -->
    <div id="contacts">
      <h3>Contacts</h3>
      <div id="no-contacts" v-if="contacts.length == 0">No contacts yet.</div>

      <div class="contact" v-for="c in contacts" :key="c.id">
        <div class="contact-name">{{c.name}}</div>
        <div class="contact-email">{{c.email}}</div>
        <div class="contact-phone">{{c.phone}}</div>
        <div class="contact-toolbar">
          <button @click="displayQrCode(c)">Share contact</button>
          <button @click="clickDelete(c.id)">Delete contact</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import md5 from 'md5';
import profileService from '@/services/profileService';
import contactService from '@/services/contactService';

export default {
  data() {
    return {
      // boolean variables to keep track of pop-up windows being shown
      showQrDisplay: false,
      showQrReader: false,

      // MD5 hash of the contact currently shown (only for validation)
      contactToDisplay: null,

      // own profile
      profile: {
        name: null,
        email: null,
        phone: null,
      },

      // list of scanned contacts
      contacts: [],
    };
  },

  methods: {
    // über Object-Destructuring werden die Funktionen der Services in methods aufgenommen
    ...contactService,
    ...profileService,

    // load data from the contact and profile services into the view
    loadData() {
      this.contacts = this.getContacts().reverse();
      this.profile = this.getProfile();
    },

    // delete contact via our service
    clickDelete(contactId) {
      this.deleteContact(contactId);
      this.loadData();
    },

    // read QR code
    async readQrCode() {
      this.showQrReader = true;

      // show webcam video in HTML element
      const qrReaderVideo = document.getElementById('qrReaderVideo');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      qrReaderVideo.srcObject = stream;
      qrReaderVideo.play();

      // set interval in which video is checked for QR codes to 10ms
      const interval = setInterval(() => this.checkForQrCode(qrReaderVideo, stream, interval), 10);
    },

    checkForQrCode(video, stream, interval) {
      // only start to check video for QR codes when enough video data is available
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        return;
      }

      const qrReaderImage = document.getElementById('qrReaderImage');
      const height = qrReaderImage.height = video.videoHeight;
      const width = qrReaderImage.width = video.videoWidth;

      // Standbild wird aus dem Video erzeugt
      qrReaderImage.getContext('2d').drawImage(video, 0, 0, width, height);
      const { data } = qrReaderImage.getContext('2d').getImageData(0, 0, width, height);

      // Standbild wird in die QR-Funktion übergeben
      const code = jsQR(data, width, height);

      // es wurde ein QR-Code gefunden, also wird der Kontakt angelegt
      if (code && code.data.length > 1) {
        this.createContact(JSON.parse(code.data));
        this.loadData();
        this.showQrReader = false;
      }

      // der Reader wurde geschlossen, also werden das Intervall & Video beendet
      if (this.showQrReader == false) {
        clearInterval(interval);
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        video.srcObject = null;
      }
    },

    // QR-Code für Kontakt anzeigen
    displayQrCode(contact) {
      contact = JSON.stringify({
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
      });

      const qrDisplay = document.getElementById('qrDisplay');

      // der Kontakt wird per JSON-String als QR-Code angezeigt
      QRCode.toCanvas(qrDisplay, contact);
      this.contactToDisplay = md5(contact);
      this.showQrDisplay = true;
    },

    displayMyQrCode() {
      const myQrDisplay = document.getElementById('myQrDisplay');
      QRCode.toCanvas(myQrDisplay, JSON.stringify(this.profile));
    },
  },

  watch: {
    // immer dann, wenn sich das eigene Profil ändert, sollen die Änderungen gespeichert werden
    profile: {
      handler() {
        this.setProfile(this.profile);
        this.displayMyQrCode();
      },
      deep: true,
    },
  },

  // beim Öffnen der Seite werden die Daten direkt geladen
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
  background-color:white;
}

#app {
  max-width: 400px;
  height: 100%;
  overflow: auto;
  margin: auto;
  background-color: white;
  padding: 40px;

  .modal {
    position: fixed;
    background-color: white;
    top: 0px;
    width: 100%;
    margin-left: -10px;
    max-width: 400px;
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
    }
  }

  #qrDisplayModal {
    canvas {
      width: 100% !important;
      height: auto !important;
    }
  }

  #qrReader {
    video {
      height: 100%;
      width: 93%;
    }
  }

  #profile {
    h3 {
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

    #myQrDisplay {
      margin: 5px 25px;
      width: calc(100% - 50px) !important;
      height: auto !important;
    }
  }

  #contacts {
    h3 {
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
