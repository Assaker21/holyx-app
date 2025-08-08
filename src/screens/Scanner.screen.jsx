import {Pressable, SafeAreaView, StyleSheet, Text, View} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import {useDevice} from '../contexts/device.context';

export default function ScannerScreen() {
  const {device, scanDevice, loading} = useDevice();

  const {hasPermission, requestPermission} = useCameraPermission();
  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: ([code]) => {
      scanDevice(code.value);
    },
  });

  const cameraDevice = useCameraDevice('back');

  return (
    <SafeAreaView style={styleSheet.container}>
      {!hasPermission ? (
        <Pressable
          style={[styleSheet.mainBtn, styleSheet.btnGreen]}
          onPress={requestPermission}>
          <Text>Request Permission</Text>
        </Pressable>
      ) : null}

      {hasPermission ? (
        <Camera
          style={styleSheet.camStyle}
          device={cameraDevice}
          isActive={true}
          codeScanner={codeScanner}
        />
      ) : null}

      {loading ? (
        <View
          style={{
            flex: 1,
            position: 'absolute',
            top: 0,
            left: 0,
            width: 'auto',
            backgroundColor: '#00000022',
          }}></View>
      ) : null}

      {device?.id ? <Text>{device?.id}</Text> : null}
    </SafeAreaView>
  );
}
const styleSheet = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: 20,
  },
  mainBtn: {
    width: 200,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnGreen: {
    backgroundColor: '#0BCD4C',
  },
  mainText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  camStyle: {
    position: 'absolute',
    width: 300,
    height: 300,
  },
});
