// import { GoogleSignin } from '@react-native-google-signin/google-signin';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// export const handleGoogleLogin = async (navigation: any) => {
//   try {
//     await GoogleSignin.hasPlayServices();
//     const userInfo = await GoogleSignin.signIn();
//     const idToken = userInfo.idToken;

//     const response = await axios.post('https://mycarering.loca.lt/auth/google', {
//       id_token: idToken,
//     });

//     const token = response.data.access_token;

//     await AsyncStorage.setItem('token', token);
//     await AsyncStorage.setItem('userEmail', userInfo.user.email);

//     const introSeen = await AsyncStorage.getItem(`introSeen-${userInfo.user.email}`);
//     if (introSeen) {
//       navigation.navigate('Home');
//     } else {
//       await AsyncStorage.setItem(`introSeen-${userInfo.user.email}`, 'true');
//       navigation.navigate('Intro');
//     }
//   } catch (error: any) {
//     console.error('🔴 Google login error:', error);
//     alert('Google login failed.');
//   }
// };