const localStorageKey = 'moe-qr-profile';

const profileService = {
  getProfile: () => {
    const jsonString = localStorage.getItem(localStorageKey);
    const emptyProfile = {
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
    };

    return jsonString ? JSON.parse(atob(jsonString)) : emptyProfile;
  },

  setProfile: (profile) => localStorage.setItem(localStorageKey, btoa(JSON.stringify(profile))),
};

export default profileService;
