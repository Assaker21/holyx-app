import {useNavigation} from '@react-navigation/native';
import {Text, View} from 'react-native';
import {Card, FAB} from 'react-native-paper';
import {useDevice} from '../contexts/device.context';
import {formatDateTime, getNextTime} from '../utils/time';

export default function HomeScreen() {
  const navigation = useNavigation();
  const {removeDevice, device} = useDevice();

  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
      }}>
      <Text style={{fontSize: 32, color: 'black'}}>
        Last sync happened{' '}
        {device?.lastUpdate ? formatDateTime(device?.lastUpdate) : 'never'}
      </Text>
      <Text style={{fontSize: 32, color: 'black'}}>
        Next sync happens{' '}
        {device?.data?.provider?.schedule?.length
          ? formatDateTime(getNextTime(device?.data?.provider?.schedule))
          : 'never'}
      </Text>
      {device?.data?.provider ? (
        <Card style={{width: 200, overflow: 'hidden'}}>
          <Card.Cover
            source={{uri: device?.data?.provider?.logo}}
            style={{height: 200, borderRadius: 0}}
          />
          <Card.Title
            title={device?.data?.provider?.name}
            titleStyle={{textAlign: 'center', fontSize: 14}}
          />
        </Card>
      ) : null}
      {device?.data?.provider?.allowDevicesToChangeProvider ? (
        <FAB
          icon="pencil"
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            margin: 16,
          }}
          onPress={() => navigation.navigate('Providers')}
        />
      ) : null}
      <FAB
        icon="delete"
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          margin: 16,
          marginHorizontal: device?.data?.provider?.allowDevicesToChangeProvider
            ? 85
            : null,
        }}
        color="red"
        variant="tertiary"
        onPress={() => {
          removeDevice();
        }}
      />
    </View>
  );
}
