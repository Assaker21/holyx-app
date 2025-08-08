import * as Keychain from 'react-native-keychain';

export default function useSecureStore() {
  async function get(key) {
    const credentials = await Keychain.getGenericPassword({service: key});
    return credentials ? credentials.password : null;
  }

  async function set(key, value) {
    return Keychain.setGenericPassword(key, value, {service: key});
  }

  async function remove(key) {
    return Keychain.resetGenericPassword({service: key});
  }

  return {get, set, remove};
}
