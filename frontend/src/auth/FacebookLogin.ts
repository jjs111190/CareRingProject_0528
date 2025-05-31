// import { LoginManager, AccessToken } from 'react-native-fbsdk-next';

const handleFacebookLogin = async () => {
  try {
    const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
    if (result.isCancelled) return;

    const data = await AccessToken.getCurrentAccessToken();
    const token = data?.accessToken;

    const res = await axios.post('https://your-api.com/auth/facebook', { access_token: token });

    await AsyncStorage.setItem('token', res.data.access_token);
    navigation.navigate('Home');

  } catch (err) {
    console.error(err);
    Alert.alert('Facebook 로그인 실패');
  }
};