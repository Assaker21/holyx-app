import axios from 'axios';
import {createContext, useContext, useEffect, useRef, useState} from 'react';
import useSecureStore from '../hooks/useSecureStore.hook';
import {navigationRef} from '../utils/navigationRef';
import {Alert} from 'react-native';

const DeviceContext = createContext(null);

export const DeviceProvider = ({children}) => {
  const [device, setDevice] = useState(null);
  const [signal, setSignal] = useState(Math.random());
  const loading = useRef({});
  const storage = useSecureStore();

  if (!navigationRef.isReady) return;
  const navigation = navigationRef;

  function getLoading(key) {
    return loading.current[key];
  }

  function setLoading(key, value) {
    loading.current[key] = value;
    setSignal(Math.random());
  }

  async function scanDevice(deviceId) {
    if (getLoading('scan')) return;
    setLoading('scan', true);

    try {
      const response = await axios.get(
        'https://holyx-api.onrender.com/devices/' + deviceId,
      );

      if (response.data) {
        setDevice({
          id: deviceId,
          data: response.data,
        });
      }

      await storage.set('device-id', deviceId);

      navigation.reset({
        index: 0,
        routes: [{name: 'Home'}],
      });
    } catch (err) {
      console.log('API ERROR: ', err);
    }

    setLoading('scan', false);
  }

  async function setup() {
    if (getLoading('setup')) return;
    setLoading('setup', true);
    try {
      const deviceId = await storage.get('device-id');
      if (!deviceId) {
        setLoading('setup', false);
        navigation.reset({index: 0, routes: [{name: 'Scanner'}]});
        return;
      }

      const response = await axios.get(
        'https://holyx-api.onrender.com/devices/' + deviceId,
      );

      if (response.data) {
        const lastUpdate = await storage.get('last-update');
        setDevice({
          id: deviceId,
          data: response.data,
          lastUpdate: lastUpdate ? new Date(lastUpdate) : null,
        });
      }

      setLoading('setup', false);
      navigation.reset({
        index: 0,
        routes: [{name: 'Home'}],
      });
    } catch (err) {
      setLoading('setup', false);
      console.log('API ERROR: ', err);
    }

    setLoading('setup', false);
  }

  async function removeDevice() {
    Alert.alert(
      'This device will be removed!',
      'Once you remove this device, you will be required to scan the QR code again to be able to update it.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove device',
          onPress: () => {
            storage.remove('device-id');
            storage.remove('last-update');
            storage.remove('schedule');
            setDevice(null);

            navigation.reset({
              index: 0,
              routes: [{name: 'Scanner'}],
            });
          },
        },
      ],
    );
  }

  async function switchProviders(providerId) {
    if (providerId == device?.data?.provider?.id) {
      return;
    }

    if (getLoading('provider-switch')) {
      return;
    }

    setLoading('provider-switch', true);

    try {
      const firstResponse = await axios.put(
        'https://holyx-api.onrender.com/devices/' + device.data.id,
        {
          providerId,
        },
      );

      const response = await axios.get(
        'https://holyx-api.onrender.com/devices/' + device.data.code,
      );

      if (response.data) {
        setDevice({
          id: device.data.id,
          data: response.data,
          lastUpdate: device.lastUpdate ? new Date(device.lastUpdate) : null,
        });

        navigation.goBack();
      }
    } catch (err) {
      console.log('AXIOS ERROR: ', err);
    }

    setLoading('provider-switch', false);
  }

  async function getDevice() {
    const deviceId = await storage.get('device-id');
    if (deviceId) {
      setDevice(
        device?.data ? device => ({...device, id: deviceId}) : {id: deviceId},
      );
      return {id: deviceId};
    }

    return;
  }

  async function saveDevice(deviceId) {
    await storage.set('device-id', deviceId);
    setDevice(
      device?.data ? device => ({...device, id: deviceId}) : {id: deviceId},
    );
  }

  async function getDeviceData(deviceId) {
    try {
      const response = await axios.get(
        'https://holyx-api.onrender.com/devices/' + deviceId,
      );
      setDevice(device => ({...device, data: response?.data}));
      return response?.data;
    } catch (err) {
      console.log('[Axios error]: ', err);
    }
  }

  useEffect(() => {
    setup();
  }, []);

  useEffect(() => {
    if (device?.data?.provider?.schedule) {
      storage.set('schedule', device.data.provider.schedule.join(','));
    }
  }, [device?.data]);

  return (
    <DeviceContext.Provider
      value={{
        signal,
        scanDevice,
        setup,
        device,
        setDevice,
        getDevice,
        saveDevice,
        removeDevice,
        getDeviceData,
        switchProviders,
        loading:
          getLoading('scan') ||
          getLoading('setup') ||
          getLoading('provider-switch'),
      }}>
      {children}
    </DeviceContext.Provider>
  );
};

export const useDevice = () => {
  const context = useContext(DeviceContext);

  return context;
};
