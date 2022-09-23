<template>
  <q-page class="q-ma-lg">
    <q-card>
      <q-tabs
        v-model="activeTab"
        @update:model-value="tabChanged(activeTab)"
        dense: false
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="center"
        narrow-indicator
      >
        <q-tab name="profile" label="Profile" />
        <q-tab name="url" label="URL" />
        <q-tab name="vCard" label="vCard" />
      </q-tabs>
      <q-separator />
      <q-tab-panels v-model="activeTab" animated keep-alive>
        <q-tab-panel name="profile">
          <div class="q-ma-sm row flex flex-center" style="min-height: 280px">
            <div class="col-10">
              <div class="text-h4 q-mb-md text-primary">Profile</div>
              <q-input v-model="profile.name" label="name" placeholder="first and last name" class="q-mb-md" />
              <q-input v-model="profile.email" label="e-mail" placeholder="mail address" class="q-mb-md" />
              <q-input v-model="profile.phone" label="phone" placeholder="phone number" />
            </div>
          </div>
        </q-tab-panel>
        <q-tab-panel name="url">
          <div class="q-ma-sm row flex flex-center" style="min-height: 280px">
              <div class="col-10">
              <div class="text-h4 q-mb-md text-primary">URL</div>
              <q-input v-model="profile.name" label="name" placeholder="name" class="q-mb-md" />
              <q-input v-model="profile.url" label="url" placeholder="url" />
            </div>
          </div>
        </q-tab-panel>
        <q-tab-panel name="vCard">
          <div class="q-ma-sm row flex flex-center" style="min-height: 280px">
            <div class="col-10">
              <div class="text-h4 q-mb-md text-primary">vCard</div>
              <div class="q-gutter-md row items-start">
                <q-input v-model="profile.vTitle" dense label="title" placeholder="title" class="q-mb-md" style="width: 10%"/>
                <q-input v-model="profile.vFirstName" dense label="first name" placeholder="first name" class="q-mb-md" style="width: 35%"/>
                <q-input v-model="profile.vLastName" dense label="last name" placeholder="last name" style="width: 35%"/>
              </div>
              <div class="q-gutter-md row items-start">
                <q-input v-model="profile.vStreet" dense label="street" placeholder="street" class="q-mb-md" style="width: 66%"/>
                <q-input v-model="profile.vHouseNumber" dense label="number" placeholder="number" class="q-mb-md" style="width: 15%"/>
              </div>
              <div class="q-gutter-md row items-start">
                <q-input v-model="profile.vZip" dense label="zip" placeholder="zip" class="q-mb-md" style="width: 15%"/>
                <q-input v-model="profile.vCity" dense label="city" placeholder="city" class="q-mb-md" style="width: 66%"/>
              </div>
              <div class="q-gutter-md row items-start">
                <q-input v-model="profile.vMobile" dense label="mobile" placeholder="mobile" class="q-mb-md" style="width: 26%"/>
                <q-input v-model="profile.vWorkPhone" dense label="work" placeholder="work" class="q-mb-md" style="width: 27%"/>
                <q-input v-model="profile.vPrivatePhone" dense label="private" placeholder="private" class="q-mb-md" style="width: 26%"/>
              </div>
              <div class="q-gutter-md row items-start">
                <q-input v-model="profile.vEmail" dense label="email" placeholder="email" class="q-mb-md" style="width: 26%"/>
                <q-input v-model="profile.vUrl" dense label="url" placeholder="url" class="q-mb-md" style="width: 27%"/>
                <q-input v-model="profile.vOrg" dense label="organisation" placeholder="organisation" class="q-mb-md" style="width: 26%"/>
              </div>
            </div>
          </div>
        </q-tab-panel>
      </q-tab-panels>

      <div class="q-ma-sm row flex flex-center">
        <div class="col-10 flex flex-center" id="myQrContainer">
          <keep-alive><canvas id="myQrDisplay" ></canvas></keep-alive>
        </div>
      </div>

      <div class="q-ma-sm row flex flex-center">
        <div class="col-10 flex flex-center">
          <q-btn @click="saveQrCode()" icon="save" align="left" class="btn-fixed-width " color="primary" label="Save" />
        </div>
      </div>

      <div class="q-ma-sm row flex flex-center">
        <div class="col-10">
          <div class="text-h4 q-mb-md q-mt-lg text-primary">Storage</div>
        </div>
      </div>

      <div class="q-ma-sm row flex flex-center q-gutter-sm">

        <div class="col-10">
          <div id="no-contacts" v-if="content.length == 0">No QR code yet.</div>
          <q-list separator bordered dense>
            <q-item v-for="c in content" :key="c.id">
              <q-item-section class="truncate">
                <div class="text-weight-bolder truncate">{{c.name}} {{ c.vFirstName }} {{ c.vLastName }} </div>
                <div class="text-italic truncate">{{c.email}} {{ c.vEmail }} </div>
                <div class="truncate">{{c.phone}}</div>
                <div class="truncate">{{c.url}} {{ c.vUrl }} </div>
              </q-item-section>
              <q-item-section side>
                <div class="q-gutter-xs">
                  <q-btn dense outline round color="primary" @click="displayQrCode(c, 'qrDisplay')" icon="download" />
                  <q-btn dense outline round color="primary" @click="clickDelete(c.id)" icon="delete" />
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

      </div>
      <div class="q-pa-sm"></div>

    </q-card>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
// import { ref } from 'vue'
import QRCode from 'qrcode';
import md5 from 'md5';
import profileService from '../services/profileService';
import contactService from '../services/contactService';
import { useQuasar } from 'quasar';


export default defineComponent({
  name: 'QR',

  setup () {
    return {
      // this.profile.type: ref('vCard')
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
        vTitle: null,
        vFirstName: null,
        vLastName: null,
        vStreet: null,
        vHouseNumber: null,
        vZip: null,
        vCity: null,
        vMobile: null,
        vWorkPhone: null,
        vPrivatePhone: null,
        vEmail: null,
        vUrl: null,
        vOrg: null,
        tab: null,
      },
      // list of all conent
      content: [],
      activeTab: 'profile',
    };
  },

  methods: {
    // object-destructuring to add functions of our services in 'methods'
    ...contactService,
    ...profileService,

    tabChanged(selectedTab) {
      if (selectedTab == "url") {
        this.profile.phone = "";
        this.profile.email = "";
        this.profile.tab = "url";
      } else if (selectedTab == "profile") {
        this.profile.url = "";
        this.profile.tab = "profile";
      } else if (selectedTab == "vCard") {
        this.profile.url = "";
        this.profile.name = "";
        this.profile.tab = "vCard";
      }

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
      this.$q.dialog({
        title: 'Confirm',
        message: 'Really delete?',
        ok: {
          color: 'primary'
        },
        cancel: {
          color: 'primary'
        },
        // cancel: true,
        persistent: true
      }).onOk(() => {
        this.deleteContact(contact);
        this.loadData();
        this.$q.notify({
          message: 'Deleted!',
          color: 'primary'
          });
      })

    },
    // save QR code
    saveQrCode() {
      this.createContact(this.getProfile());
      this.loadData();
    },
    renderData(payload) {
      if (payload.tab == 'url') {
        payload = JSON.stringify(payload.url);
      } else if (payload.tab == 'profile') {
        payload = JSON.stringify({
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
        });
      } else if (payload.tab == 'vCard') {
        var vcfStr = "BEGIN:VCARD\nVERSION:3.0\n";
        vcfStr = vcfStr.concat("N:" + payload.vLastName + ";" + payload.vFirstName + "\n");
        var vName = payload.vFirstName + " " + payload.vLastName;
        if (vName != null && vName.length > 0) {
          vcfStr = vcfStr.concat("FN:" + vName + "\n");
        }
        if (payload.vOrg != null && payload.vOrg.length > 0) {
          vcfStr = vcfStr.concat("ORG:" + payload.vOrg + "\n");
        }
        if (payload.vTitle != null && payload.vTitle.length > 0) {
          vcfStr = vcfStr.concat("TITLE:" + payload.vTitle + "\n");
        }
        if (payload.vMobile != null && payload.vMobile.length > 0) {
          vcfStr = vcfStr.concat("TEL;type=CELL:" + payload.vMobile + "\n");
        }
        if (payload.vWorkPhone != null && payload.vWorkPhone.length > 0) {
          vcfStr = vcfStr.concat("TEL;type=WORK:" + payload.vWorkPhone + "\n");
        }
        if (payload.vPrivatePhone != null && payload.vPrivatePhone.length > 0) {
          vcfStr = vcfStr.concat("TEL;type=HOME:" + payload.vPrivatePhone + "\n");
        }
        if (payload.vEmail != null && payload.vEmail.length > 0) {
          vcfStr = vcfStr.concat("EMAIL:" + payload.vEmail + "\n");
        }
        vcfStr = vcfStr.concat("ADR:;;" + payload.vStreet + " " + payload.vHouseNumber + ";" + payload.vCity + ";;" + payload.vZip + ";" + "\n");
        if (payload.vUrl != null && payload.vUrl.length > 0) {
          vcfStr = vcfStr.concat("URL:" + payload.vUrl + "\n");
        }

        vcfStr = vcfStr.concat("END:VCARD");

        payload = vcfStr;
        console.log(payload);

      }
      return payload;
    },
    // show QR code for payload (contact / url)
    displayQrCode(payload, elementId) {
        const data = this.renderData(payload);

        const printCode = async () => {
          const a = await QRCode.toDataURL(data);
          const htmlCode = '<div class="flex flex-center"><img id="qrImg" src="' + a + '" /></div>';

          this.$q.dialog({
            title: 'Download',
            message: htmlCode,
            html: true,
            ok: {
              color: 'primary',
              label: 'Download'
            },
            cancel: {
              color: 'primary'
},
          }).onOk(() => {
            const img = document.getElementById('qrImg');
            const a = document.createElement('a');
            // Set the href attribute of the a tag (turn the canvas into a png image)
            a.href = img.src;
            a.download = 'qrcode';
            a.click();
          }).onCancel(() => {

          }).onDismiss(() => {

          })
        };
      printCode();

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

  #myQrContainer{
    width: 50%;
    text-align: center;
    #myQrDisplay {
      margin: 5px 25px;
      width: calc(40% - 50px) !important;
      min-width: 150px !important;
      height: auto !important;
    }
  }

  .truncate {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
</style>
