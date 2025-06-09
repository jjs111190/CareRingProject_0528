module.exports = {
  presets: ['module:@react-native/babel-preset'],
    plugins: [
    // ... 다른 플러그인들 (만약 있다면)
    'react-native-reanimated/plugin', // 이 줄이 반드시 마지막에 있어야 합니다.
  ],
};
