import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {DeviceProvider} from '../contexts/device.context';
import DeleteScreen from '../screens/Delete.screen';
import HomeScreen from '../screens/Home.screen';
import LoadingScreen from '../screens/Loading.screen';
import ProvidersScreen from '../screens/Providers.screen';
import ScannerScreen from '../screens/Scanner.screen';

const Stack = createNativeStackNavigator();

export default function RootLayout() {
  return (
    <DeviceProvider>
      <Stack.Navigator initialRouteName="Loading">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Loading" component={LoadingScreen} />
        <Stack.Screen name="Delete" component={DeleteScreen} />
        <Stack.Screen name="Providers" component={ProvidersScreen} />
        <Stack.Screen name="Scanner" component={ScannerScreen} />
      </Stack.Navigator>
    </DeviceProvider>
  );
}
