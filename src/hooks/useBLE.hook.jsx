import {Buffer} from 'buffer';
import {useCallback, useEffect, useRef, useState} from 'react';
import {PermissionsAndroid, Platform} from 'react-native';
import {BleManager, ScanMode} from 'react-native-ble-plx';
import * as Crypto from '../utils/crypto.js';
import useGetImage from './useGetImage.hook';
import useSecureStore from './useSecureStore.hook';

export const BleStage = {
  idle: 'idle',
  scanning: 'scanning',
  connecting: 'connecting',
  sending: 'sending',
  success: 'success',
  error: 'error',
};

export function useBle({serviceUuid}) {
  const storage = useSecureStore();
  const getImage = useGetImage();
  const [stage, setStage] = useState(BleStage.idle);
  const [devices, setDevices] = useState({});
  const [connectedDevice, setConn] = useState(null);
  const [errorMessage, setError] = useState(null);
  const [granted, setGranted] = useState(false);

  const ble = useRef(new BleManager()).current;
  const scanSub = useRef(null);
  const HOLY_REGEX = /^HOLYX-\d{6}$/;

  useEffect(() => {
    (async () => {
      try {
        await requestPermissions();
        // startScan();
      } catch (e) {
        bail(e);
      }
    })();

    return () => ble.destroy();
  }, []);

  async function requestPermissions() {
    if (Platform.OS === 'android') {
      const res = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      const denied = Object.values(res).some(r => r !== 'granted');
      if (denied) throw new Error('Bluetooth permissions not granted');

      setGranted(true);
    }
  }

  const startScan = useCallback(() => {
    setStage(BleStage.scanning);
    setDevices({});
    scanSub.current?.remove?.();

    scanSub.current = ble.startDeviceScan(null, null, async (err, device) => {
      if (err) return bail(err);

      if (device?.name) {
        setDevices(prev => ({...prev, [device.id]: device}));

        if (HOLY_REGEX.test(device.name)) {
          scanSub.current?.remove?.();
          ble.stopDeviceScan();
          await connectAndSend(device);
        }
      }
    });
  }, [ble]);

  async function connectAndSend(device) {
    setStage(BleStage.connecting);

    try {
      let d = await ble.connectToDevice(device.id);
      d = await d.discoverAllServicesAndCharacteristics();
      console.log(
        'C: ',
        d.characteristicsForService('00001234-0000-1000-8000-00805f9b34fb'),
      );
      setConn(d);

      setStage(BleStage.sending);
      await sendPayload(d);

      await d.cancelConnection();
      setConn(null);
      setStage(BleStage.success);
    } catch (e) {
      bail(e);
    }
  }

  async function sendPayload(device) {
    if (!device) return;

    const nonce = randomHex(16);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    let kSampleBase64 = await getImage();

    const msg = `${nonce}____${timestamp}____${kSampleBase64}`;
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      msg + storage.get('device-id'),
      {encoding: Crypto.CryptoEncoding.HEX},
    );

    console.log('HASH: ', hash);

    const IMAGE_CHAR = '00006679-0000-1000-8000-00805f9b34fb';

    const authPayload = `STARTSEND${nonce}____${hash}`;

    await writeChunks(device, IMAGE_CHAR, authPayload);
    await writeChunks(device, IMAGE_CHAR, timestamp);
    await writeChunks(device, IMAGE_CHAR, `${kSampleBase64}ENDSEND`);
  }

  async function writeChunks(device, charUuid, str) {
    const CHUNK = 13;
    const bytes = Buffer.from(str, 'utf8');

    for (let i = 0; i < bytes.length; i += CHUNK) {
      const slice = bytes.slice(i, i + CHUNK);
      const b64 = Buffer.from(slice).toString('base64');
      console.log('Wrote: ', i, '/', bytes.length);
      await device.writeCharacteristicWithResponseForService(
        serviceUuid,
        charUuid,
        b64,
      );
      await delay(20);
    }
  }

  function randomHex(len) {
    const bytes = Crypto.getRandomBytes(len / 2); // returns Uint8Array
    return Buffer.from(bytes).toString('hex');
  }
  const delay = ms => new Promise(r => setTimeout(r, ms));

  function bail(e) {
    setError(String(e));
    setStage(BleStage.error);
  }

  return {
    stage,
    devices,
    connectedDevice,
    errorMessage,
    isScanning: stage === BleStage.scanning,
    startScan,
    granted,
  };
}

const delay = ms => new Promise(r => setTimeout(r, ms));
let scanInProgress = false;

export function bleScanAndSend(serviceUuid, bleInstance, onComplete, nextTime) {
  if (scanInProgress) return;
  scanInProgress = true;
  console.log('Running ble scan and send!');
  const storage = useSecureStore();
  const getImage = useGetImage();
  let devices = {};
  const ble = bleInstance || new BleManager();
  const HOLY_REGEX = /^HOLYX-\d{6}$/;

  async function connectAndSend(device) {
    try {
      let d = await ble.connectToDevice(device.id);
      d = await d.discoverAllServicesAndCharacteristics();

      await sendPayload(d);

      storage.set('last-update', new Date().toString());

      await d.cancelConnection();
      scanInProgress = false;

      onComplete?.();
    } catch (e) {
      scanInProgress = false;
      console.log('Error on connect and send: ', e);
    }
  }

  async function sendPayload(device) {
    if (!device) return;

    const nonce = randomHex(16);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    let kSampleBase64 = await getImage();
    console.log('kSampleBase64: ', kSampleBase64);

    const nextTimestamp = Math.floor(nextTime.getTime() / 1000).toString();
    const deviceId = await storage.get('device-id');

    console.log('Start timestamp: ', timestamp);
    console.log('Next timestamp: ', nextTimestamp);
    let schedule = await storage.get('schedule');
    const sentSchedule = schedule
      .replaceAll(',', '')
      .replaceAll(':', '')
      .slice(0, 100);

    console.log('Sent schedule: ', sentSchedule);

    const msg = `${nonce}____${timestamp}____${nextTimestamp}____${sentSchedule}____${kSampleBase64}`;
    console.log('Message length: ', msg.length);
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      msg + deviceId,
      {encoding: Crypto.CryptoEncoding.HEX},
    );

    console.log('HASH: ', hash);

    const IMAGE_CHAR = '00006679-0000-1000-8000-00805f9b34fb';
    const authPayload = `STARTSEND${nonce}____${hash}`;

    await writeChunks(device, IMAGE_CHAR, authPayload);
    await writeChunks(device, IMAGE_CHAR, timestamp);
    await writeChunks(device, IMAGE_CHAR, nextTimestamp);
    await writeChunks(device, IMAGE_CHAR, sentSchedule);
    await writeChunks(device, IMAGE_CHAR, `${kSampleBase64}ENDSEND`);
  }

  async function writeChunks(device, charUuid, str) {
    const CHUNK = 13;
    const bytes = Buffer.from(str, 'utf8');

    let counter = 0;

    for (let i = 0; i < bytes.length; i += CHUNK) {
      const slice = bytes.slice(i, i + CHUNK);
      const b64 = Buffer.from(slice).toString('base64');
      if (i > counter) {
        counter += 100;
        console.log('Wrote: ', i, '/', bytes.length);
      }
      await device.writeCharacteristicWithResponseForService(
        serviceUuid,
        charUuid,
        b64,
      );
      //await delay(5);
    }
  }

  function randomHex(len) {
    const bytes = Crypto.getRandomBytes(len / 2); // returns Uint8Array
    return Buffer.from(bytes).toString('hex');
  }

  ble.startDeviceScan(
    [serviceUuid],
    {scanMode: ScanMode.LowLatency},
    async (err, device) => {
      if (err) {
        scanInProgress = false;

        return console.log('Error on startDeviceScan: ', err);
      }

      if (device?.name) {
        devices = {...devices, [device.id]: device};

        if (HOLY_REGEX.test(device.name)) {
          ble.stopDeviceScan();
          await connectAndSend(device);
        }
      }
    },
  );
}
