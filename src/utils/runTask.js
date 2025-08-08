import {BleManager} from 'react-native-ble-plx';
import {bleScanAndSend} from '../hooks/useBLE.hook';
import useSecureStore from '../hooks/useSecureStore.hook';
import {getNextNextTime, getNextTime} from './time';

export const PERIOD = 100000;

export async function runTask() {
  const storage = useSecureStore();

  let deviceId = await storage.get('device-id');
  if (!deviceId) {
    console.log('[NO RUN]: no deviceId');
    return;
  }

  let schedule = await storage.get('schedule');
  schedule = schedule?.split?.(',');

  if (!schedule?.length) {
    console.log('[NO RUN]: no schedule');
    return;
  }

  const nextTime = getNextTime(schedule);
  const nextNextTime = getNextNextTime(schedule);

  if (Date.now() + PERIOD < new Date(nextTime).getTime()) {
    console.log(
      '[NO RUN]: next time not in period: nextTime=',
      nextTime,
      ', PERIOD=',
      PERIOD,
      ', NOW=',
      new Date(),
    );
    return;
  }

  const delay = Math.max(new Date(nextTime).getTime() - Date.now() - 5000, 0);

  console.log('[RUN]: Will run in ', delay / 1000, 'seconds');

  setTimeout(() => {
    try {
      const ble = new BleManager();
      bleScanAndSend(
        '00001234-0000-1000-8000-00805f9b34fb',
        ble,
        () => {
          ble.destroy();

          runTask();
        },
        new Date(nextNextTime),
      );
    } catch (scanErr) {
      console.warn('[BLE] Scanning failed:', scanErr);
    }
  }, delay);
}
