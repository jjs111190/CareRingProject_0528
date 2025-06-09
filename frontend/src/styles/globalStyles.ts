import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const SCALE_FACTOR = 375;
const scale = (size: number) => (width / SCALE_FACTOR) * size;

export const globalStyles = StyleSheet.create({
  // 공통 컨테이너 스타일
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: scale(16),
  },

  // 제목 스타일
  title: {
    fontSize: scale(32),
    fontWeight: 'bold',
    marginBottom: scale(8),
    color: '#000',
  },
  subtitle: {
    color: '#6B7280',
    marginBottom: scale(24),
    fontSize: scale(16),
    textAlign: 'center',
  },

  // 입력 필드 스타일
  inputContainer: {
    width: '100%',
    marginBottom: scale(12),
  },
  formGroup: {
    width: '100%',
    marginBottom: scale(16),
  },
  halfInputLeft: {
    flex: 1,
    marginRight: scale(8),
  },
  halfInputRight: {
    flex: 1,
    marginLeft: scale(8),
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: scale(14),
    fontSize: scale(15),
    height: scale(48),
    backgroundColor: '#F9FAFB',
    paddingRight: scale(40), // 추가 수정
    width: '100%', // ✅ 추가

  },
  label: {
    color: '#374151',
    marginBottom: scale(6),
    fontSize: scale(14),
    fontWeight: '500',
  },
  unitText: {
    position: 'absolute',
    right: scale(16),
    top: scale(38), // 높이 조정
    color: '#6B7280',
  },

  // 버튼 스타일
  button: {
    width: '90%',
    backgroundColor: '#4387E5',
    borderRadius: 12,
    paddingVertical: scale(16),
    marginBottom: scale(24),
    shadowColor: '#4387E5',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: scale(18),
  },

  // 소셜 로그인 스타일
  socialSignInContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(24),
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1D5DB',
  },
  socialSignInText: {
    marginHorizontal: scale(8),
    color: '#6B7280',
    fontSize: scale(14),
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scale(16),
    marginBottom: scale(24),
  },
  socialIcon: {
    width: scale(48),
    height: scale(48),
  },

  // 링크 및 푸터 텍스트 스타일
  footerText: {
    color: '#6B7280',
    fontSize: scale(14),
  },
  linkText: {
    color: '#3B82F6',
    fontSize: scale(14),
    textTransform: 'uppercase',  // 추가 수정
    letterSpacing: 0.5,          // 추가 수정
  },

  // 비밀번호 관련 스타일
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: scale(4),
  },
  forgotPasswordText: {
    color: '#3B82F6',
    fontSize: scale(14),
  },

  // 프로필 이미지 스타일
  profileImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(30), // 기존 20에서 30으로 수정
  },
  profileImage: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(50),
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginBottom: scale(8),
  },

  // 뒤로가기 버튼 스타일
  backButton: {
    position: 'absolute',
    top: scale(40),
    left: scale(20),
  },
  backIcon: {
    width: scale(30),
    height: scale(30),
  },

  // 로딩 화면 스타일
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4387E5',
  },
  loadingLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingLogo: {
    width: scale(80),
    height: scale(80),
  },
  loadingText: {
    fontSize: scale(50),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: scale(8),
  },
  loadingSpinner: {
    marginTop: scale(20),
  },

  // 행 스타일
  rowContainer: {
    flexDirection: 'row',
    width: '90%',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // 선택기 스타일 (Picker)
  pickerContainer: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    height: scale(48),
    justifyContent: 'center',
    fontSize: scale(15),
  },
  picker: {
    height: scale(48),
    fontSize: scale(15),
  },

  // 헤더 스타일
  headerContainer: {
    marginBottom: scale(32), // 기존 24에서 32로 수정
    alignItems: 'center',
  },
  genderButtonGroup: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 4,
},
genderButton: {
  flex: 1,
  height: scale(48),
  marginHorizontal: 4,
  borderWidth: 1,
  borderColor: '#D1D5DB',
  borderRadius: 8,
  alignItems: 'center',
  justifyContent: 'center',
},
genderButtonSelected: {
  backgroundColor: '#4387E5',
  borderColor: '#4387E5',
},
genderText: {
  color: '#374151',
},
genderTextSelected: {
  color: '#fff',
  fontWeight: 'bold',
},
});