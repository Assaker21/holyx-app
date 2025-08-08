import axios from 'axios';
import React, {useEffect, useState} from 'react';
import {Dimensions, FlatList} from 'react-native';
import {Card, TouchableRipple} from 'react-native-paper';
import {useDevice} from '../contexts/device.context';
import LoadingScreen from './Loading.screen';

const NUM_COLUMNS = 2;
const CARD_MARGIN = 8;
const CARD_SIZE =
  Dimensions.get('window').width / NUM_COLUMNS -
  CARD_MARGIN * (NUM_COLUMNS + 1);

export default function ProvidersScreen() {
  const {switchProviders, loading} = useDevice();
  const [providers, setProviders] = useState([]);

  async function getProviders() {
    try {
      const response = await axios.get(
        'https://holyx-api.onrender.com/providers',
      );
      setProviders(response?.data);
    } catch (err) {
      console.err('[AXIOS ERROR]: ', err);
    }
  }

  useEffect(() => {
    getProviders();
  }, []);

  const renderItem = ({item}) => (
    <TouchableRipple
      onPress={() => switchProviders(item.id)}
      style={{flex: 1, margin: CARD_MARGIN, borderRadius: 20}}>
      <Card style={{width: CARD_SIZE, overflow: 'hidden'}}>
        <Card.Cover
          source={{uri: item.logo}}
          style={{height: CARD_SIZE, borderRadius: 0}}
        />
        <Card.Title
          title={item.name}
          titleStyle={{textAlign: 'center', fontSize: 14}}
        />
      </Card>
    </TouchableRipple>
  );

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <FlatList
      data={providers}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      numColumns={NUM_COLUMNS}
      contentContainerStyle={{padding: CARD_MARGIN}}
    />
  );
}
