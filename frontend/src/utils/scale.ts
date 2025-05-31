import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const SCALE_FACTOR = 375;

export const scale = (size: number) => (width / SCALE_FACTOR) * size;