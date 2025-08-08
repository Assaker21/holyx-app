import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import ReactNativeForegroundService from '@supersami/rn-foreground-service';
import React, {useEffect} from 'react';
import {Alert, Linking, Platform} from 'react-native';
import Permissions from 'react-native-permissions';

import {
  BatteryOptEnabled,
  RequestDisableOptimization,
} from 'react-native-battery-optimization-check';
import {PaperProvider} from 'react-native-paper';
import RootLayout from './src/layouts/root.layout.jsx';
import {PERIOD, runTask} from './src/utils/runTask.js';
import {navigationRef} from './src/utils/navigationRef.js';

const Stack = createNativeStackNavigator();

export default function App() {
  async function ensureNotOptimised() {
    if (await BatteryOptEnabled()) {
      await RequestDisableOptimization(); // system dialog pops up
    }
  }
  const startTask = async () => {
    if (Platform.Version >= 33) {
      const response = await Permissions.request(
        Permissions.PERMISSIONS.ANDROID.POST_NOTIFICATIONS,
      );

      await Permissions.requestMultiple([
        Permissions.PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
        Permissions.PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
        Permissions.PERMISSIONS.ANDROID.BLUETOOTH_ADVERTISE,
        Permissions.PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
        Permissions.PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      ]);

      if (response === Permissions.RESULTS.BLOCKED) {
        Alert.alert(
          'Permission Blocked',
          'Notification permission is blocked. Please enable it from the app settings.',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Open Settings', onPress: () => Linking.openSettings()},
          ],
        );
        return;
      } else if (response !== Permissions.RESULTS.GRANTED) {
        console.log('Did not get the permission');
        return;
      }
    }

    ReactNativeForegroundService.start({
      id: 1244,
      title: 'HOLY-X',
      message: 'This is to update your device at all times.',
      icon: 'ic_launcher',
      ServiceType: 'connectedDevice,dataSync',
      setOnlyAlertOnce: 'true',
      color: '#000000',
    });
  };

  const stopTask = () => {
    ReactNativeForegroundService.stop();
  };

  useEffect(() => {
    Permissions.requestMultiple([
      Permissions.PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
      Permissions.PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
      Permissions.PERMISSIONS.ANDROID.BLUETOOTH_ADVERTISE,
      Permissions.PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
      Permissions.PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      Permissions.PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION,
    ]);

    ensureNotOptimised();

    //stopTask();
    if (!ReactNativeForegroundService.is_task_running('taskid')) {
      console.log(
        'Task running: ',
        ReactNativeForegroundService.is_task_running('taskid'),
      );
      ReactNativeForegroundService.add_task(log, {
        delay: PERIOD,
        onLoop: true,
        taskId: 'taskid',
        onError: e => console.log(`Error logging:`, e),
      });

      startTask();
    }
  }, []);

  return (
    <PaperProvider>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          initialRouteName="Root"
          screenOptions={{headerShown: false}}>
          <Stack.Screen name="Root" component={RootLayout} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

const log = () => runTask();
