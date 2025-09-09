import {Text, View} from 'react-native';
import {ActivityIndicator} from 'react-native-paper';

export default function LoadingScreen() {
  return (
    <View
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
      }}>
      <ActivityIndicator size="large" animating={true} color="green" />
    </View>
  );
}
