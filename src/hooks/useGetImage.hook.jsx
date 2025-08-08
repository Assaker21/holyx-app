import axios from 'axios';
import useSecureStore from '../hooks/useSecureStore.hook';

export default function useGetImage() {
  const storage = useSecureStore();

  async function getImage() {
    try {
      const response = await axios.get(
        'https://holyx-api.onrender.com/devices/' + 'K652' ||
          storage.get('device-id'),
      );
      return response?.data?.provider?.image;
    } catch (err) {
      console.log(
        'AXIOS ERROR: ',
        err,
        'https://holyx-api.onrender.com/devices/' + 'K652' ||
          storage.get('device-id'),
      );
      return 'AAAAAAAA';
    }
  }

  return getImage;
}
