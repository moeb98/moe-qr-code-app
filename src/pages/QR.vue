<template>
  <q-page class="q-ma-lg">
    <q-card>
      <q-tabs
        v-model="tab"
        dense
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        narrow-indicator
      >
        <q-tab name="vCard" label="vCard" />
        <q-tab name="url" label="URL" />
      </q-tabs>
      <q-separator />
      <q-tab-panels v-model="tab" animated keep-alive>
        <q-tab-panel name="vCard">
          <div class="q-ma-sm row flex flex-center">
            <div class="col-2"></div>
            <div class="col-6">
            <div class="text-h4 q-mb-md text-primary">My profile</div>
              <q-input v-model="profile.name" label="name" placeholder="first and last name" class="q-mb-md" />
              <q-input v-model="profile.email" label="e-mail" placeholder="mail address" class="q-mb-md" />
              <q-input v-model="profile.phone" label="phone" placeholder="phone number" />          
            </div>
            <div class="col-2"></div>
          </div>
        </q-tab-panel>
        <q-tab-panel name="url">
          <div class="q-ma-sm row flex flex-center">
            <div class="col-2"></div>
            <div class="col-6">
              <div class="text-h4 q-mb-md text-primary">URL</div>
              <q-input v-model="profile.name" label="name" placeholder="first and last name" class="q-mb-md" />
              <q-input v-model="profile.url" label="url" placeholder="url" />
            </div>
            <div class="col-2"></div>
          </div>        
        </q-tab-panel>
      </q-tab-panels>

      <div class="q-ma-sm row flex flex-center">
        <div class="col-2"></div>
        <div class="col-6 flex flex-center" id="myQrContainer">
          <keep-alive><canvas id="myQrDisplay" ></canvas></keep-alive>
        </div>
        <div class="col-2"></div>
      </div>  

      <div class="q-ma-sm row flex flex-center">
        <div class="col-2"></div>
        <div class="col-6 flex flex-center">
          <q-btn @click="saveQrCode()" icon="save" align="left" class="btn-fixed-width " color="primary" label="Save" />
        </div>
        <div class="col-2"></div>
      </div>

      <div class="q-ma-sm row flex flex-center">
        <div class="col-2"></div>
        <div class="col-6">
        <div class="text-h4 q-mb-md q-mt-lg text-primary">Contacts</div>
        </div>
        <div class="col-2"></div>
      </div>

      <div class="q-ma-sm row flex flex-center q-gutter-sm">
        <div class="col-2"></div>
        <div class="col-6">
          <div id="no-contacts" v-if="content.length == 0">No contacts yet.</div>
          <q-list separator bordered class="bg-grey-3">
            <q-item v-for="c in content" :key="c.id">
              <q-item-section>
                <div class="contact-name">{{c.name}}</div>
                <div class="contact-email">{{c.email}}</div>
                <div class="contact-phone">{{c.phone}}</div>
                <div class="contact-phone">{{c.url}}</div>
              </q-item-section>
              <q-item-section side>
                <div class="q-gutter-xs">
                  <q-btn outline round color="primary" @click="displayQrCode(c, 'qrDisplay')" icon="share" />  
                  <q-btn outline round color="primary" @click="clickDelete(c.id)" icon="delete" />  
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
        <div class="col-2"></div>
      </div>
      <div class="q-pa-sm"></div>

      <!-- modal dialog for QR download  -->
      <div id="qrDisplayModal" class="modal item-center" :hidden="!showQrDisplay">
        <div class="close-modal" @click="showQrDisplay = !showQrDisplay">X</div>
        <center>
          <canvas id="qrDisplay"></canvas>
          <pre>{{qrToDisplay}}</pre>
          <input type="button" id="downloadButton" @click="downloadQrCode()" value="Download" />
        </center>
      </div>         
    </q-card>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import { ref } from 'vue'
import QRCode from 'qrcode';
import md5 from 'md5';
import profileService from '../services/profileService';
import contactService from '../services/contactService';

export default defineComponent({
  name: 'QR',

  setup () {
    return {
      tab: ref('vCard')
    }
  },

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

})

</script>

<style lang="scss">

  .modal {
    position: fixed;
    background-color: rgb(255, 255, 255);
    top: 50px;
    width: 100%;
    margin-left: -25px;
    max-width: 100%;
    height: 100%;
    .close-modal {
      cursor: pointer;
      padding: 10px;
      text-align: right;
      font-weight: normal;
      font-size: 24px;
    }
  }

  #qrDisplayModal {
    canvas {
      width: 20% !important;
      height: auto !important;
      margin-top: 50px;
    }
  }
  
  #myQrContainer{
    width: 50%;
    text-align: center;
    #myQrDisplay {
      margin: 5px 25px;
      width: calc(40% - 50px) !important;
      height: auto !important;
    }
  }
  
</style>