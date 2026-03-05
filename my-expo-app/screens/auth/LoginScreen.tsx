import React, { useEffect, useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, Dimensions, Alert, Image, KeyboardAvoidingView, Platform, Modal, Linking, Keyboard } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, interpolate } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import PremiumPopup from '../../components/PremiumPopup';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import '../../global.css';

const { width, height } = Dimensions.get('window');

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const [statusModal, setStatusModal] = useState({ visible: false, title: '', message: '', type: 'error' as 'success' | 'error' | 'info' | 'action' });
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Animation values
  const formTranslateY = useSharedValue(height * 0.3);
  const themeAnim = useSharedValue(theme === 'dark' ? 1 : 0);
  const headerOpacity = useSharedValue(1);
  const headerTranslateY = useSharedValue(0);

  useEffect(() => {
    formTranslateY.value = withTiming(0, { duration: 1000, easing: Easing.out(Easing.exp) });

    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      headerOpacity.value = withTiming(0, { duration: 300 });
      headerTranslateY.value = withTiming(-20, { duration: 300 });
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      headerOpacity.value = withTiming(1, { duration: 300 });
      headerTranslateY.value = withTiming(0, { duration: 300 });
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    themeAnim.value = withTiming(theme === 'dark' ? 1 : 0, { duration: 400 });
  }, [theme]);

  const formAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: formTranslateY.value }],
  }));

  const toggleSwitchStyle = useAnimatedStyle(() => {
    const translateX = interpolate(themeAnim.value, [0, 1], [2, 26]);
    return { transform: [{ translateX }] };
  });

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
    pointerEvents: headerOpacity.value < 0.5 ? 'none' : 'auto'
  }));

  const handleLogin = async () => {
    if (!username || !password) {
      setStatusModal({
        visible: true,
        title: 'Oops! 🎈',
        message: 'Please enter both username and password to enter the playground!',
        type: 'error'
      });
      return;
    }
    setIsLoading(true);
    try {
      const success = await login(username, password);
      if (success) {
        onLogin();
      } else {
        setStatusModal({
          visible: true,
          title: 'Login Failed 🔒',
          message: 'The username or password you entered doesn\'t seem right. Please check and try again!',
          type: 'error'
        });
      }
    } catch (error: any) {
      if (error.message === 'INACTIVE_USER_ALERT') {
         setStatusModal({
           visible: true,
           title: 'Account Inactive 🛑',
           message: 'This account is currently inactive. Please contact the school office to reactivate your access.',
           type: 'info'
         });
      } else {
        setStatusModal({
          visible: true,
          title: 'System Error ⚠️',
          message: 'Something went wrong on our end. Please try again or contact the school office.',
          type: 'error'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCallOffice = () => {
    Linking.openURL('tel:9787751430'); 
  };

  const insets = useSafeAreaInsets();
  const brandPink = '#F472B6';
  const isDark = theme === 'dark';

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#121212' : '#FDF2F8' }}>
      <StatusBar style={isDark ? 'light' : 'dark'} translucent={true} backgroundColor="transparent" />
      
      {/* Immersive Background */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.65 }}>
        <Image 
          source={require('../../assets/images/playschool_teacher_login_bg.png')} 
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', isDark ? '#121212' : '#FDF2F8']}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 180 }}
        />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          {/* Top Branding & Premium Toggle */}
          <Animated.View 
            style={[
              headerAnimatedStyle,
              { 
                flexDirection: 'row', 
                alignItems: 'center', 
                paddingTop: Math.max(insets.top, 16),
                justifyContent: 'space-between',
                zIndex: 10
              }
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ 
                shadowColor: brandPink,
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                elevation: 15,
              }}>
                <LinearGradient
                  colors={isDark ? ['#333', '#111'] : ['#FFFFFF', '#FFF5F8']}
                  style={{ 
                    borderRadius: 24, 
                    padding: 4, 
                    borderWidth: 3, 
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF',
                  }}
                >
                   <LinearGradient
                    colors={['rgba(255,255,255,0.2)', 'transparent']}
                    style={{ 
                      borderRadius: 18, 
                      overflow: 'hidden',
                      backgroundColor: isDark ? '#1c1c14' : '#FDF2F8',
                      padding: 2
                    }}
                   >
                     <Image 
                       source={require('../../assets/images/playschool_logo_3d.png')} 
                       style={{ width: 56, height: 56 }}
                       resizeMode="contain"
                     />
                   </LinearGradient>
                </LinearGradient>
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: isDark ? 'white' : '#1E1B4B', letterSpacing: -0.5 }}>Chithode</Text>
                <Text style={{ fontSize: 18, fontWeight: '700', color: brandPink, marginTop: -4 }}>Happykids</Text>
              </View>
            </View>

            <TouchableOpacity 
              onPress={toggleTheme}
              activeOpacity={0.8}
              style={{ 
                width: 60,
                height: 32,
                borderRadius: 16,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(244, 114, 182, 0.1)',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(244, 114, 182, 0.2)',
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 4,
                justifyContent: 'space-between'
              }}
            >
              <MaterialCommunityIcons name="moon-waning-crescent" size={14} color={isDark ? 'rgba(255,255,255,0.4)' : brandPink} style={{ marginLeft: 4 }} />
              <MaterialCommunityIcons name="white-balance-sunny" size={14} color={isDark ? '#FFD700' : 'rgba(0,0,0,0.2)'} style={{ marginRight: 4 }} />
              
              <Animated.View 
                style={[
                  toggleSwitchStyle,
                  { 
                    position: 'absolute',
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: isDark ? '#FFFFFF' : brandPink,
                    shadowColor: '#000',
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 3,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }
                ]}
              >
                 <MaterialCommunityIcons 
                    name={isDark ? "white-balance-sunny" : "moon-waning-crescent"} 
                    size={14} 
                    color={isDark ? brandPink : 'white'} 
                  />
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>

          <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: Math.max(insets.bottom, 20) }}>
            {/* ── Modern Premium Login Container ── */}
            <Animated.View 
              style={[
                formAnimatedStyle,
                { 
                  backgroundColor: isDark ? '#1c1c14' : '#FFFFFF',
                  borderRadius: 48,
                  shadowColor: brandPink,
                  shadowOffset: { width: 0, height: 20 },
                  shadowOpacity: 0.4,
                  shadowRadius: 30,
                  elevation: 30,
                  borderWidth: 4,
                  borderColor: brandPink,
                  overflow: 'hidden'
                }
              ]}
            >
              {/* Header Decorative Area (Matches Modal style) */}
              <View style={{ height: 80, position: 'relative', overflow: 'hidden' }}>
                <LinearGradient
                  colors={isDark ? ['#f472b633', 'transparent'] : ['#FDF2F8', '#FFFFFF']}
                  className="absolute inset-0"
                />
                <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
                   <View style={{ 
                      backgroundColor: brandPink, 
                      width: 64, 
                      height: 64, 
                      borderRadius: 20, 
                      justifyContent: 'center', 
                      shadowColor: brandPink,
                      shadowOpacity: 0.5,
                      shadowRadius: 10,
                      elevation: 8,
                      transform: [{ rotate: '5deg' }],
                      borderWidth: 3,
                      borderColor: 'white',
                      alignItems: 'center'
                   }}>
                      <MaterialCommunityIcons name="lock-open-variant" size={32} color="white" />
                   </View>
                </View>
                
                {/* Decorative Background Icons */}
                <View style={{ position: 'absolute', top: -20, left: -20, opacity: 0.05, transform: [{ rotate: '15deg' }] }}>
                   <MaterialCommunityIcons name="security" size={100} color={isDark ? 'white' : 'black'} />
                </View>
              </View>

              <View style={{ paddingHorizontal: 26, paddingBottom: 24 }}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={{ backgroundColor: brandPink + '15', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, marginBottom: 8 }}>
                  <Text style={{ color: brandPink, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 }}>PRESCHOOL PORTAL</Text>
                </View>
                <Text style={{ color: isDark ? 'white' : '#1E1B4B', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 }}>Account Login</Text>
              </View>

              <View>
                {/* Structured Text Inputs */}
                <View style={{ marginBottom: 12 }}>
                  <View 
                    style={{ 
                      backgroundColor: isDark ? '#1A1A1A' : '#F9FBFE',
                      borderRadius: 18,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#EDF2F7',
                      flexDirection: 'row',
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOpacity: 0.02,
                      shadowRadius: 5,
                    }}
                  >
                    <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: isDark ? '#262626' : 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
                      <MaterialCommunityIcons name="account-outline" size={18} color={brandPink} />
                    </View>
                    <TextInput
                      style={{ 
                        flex: 1, 
                        marginLeft: 14, 
                        fontWeight: '600', 
                        color: isDark ? '#FFFFFF' : '#1A202C', 
                        fontSize: 15,
                        paddingVertical: Platform.OS === 'ios' ? 0 : 4
                      }}
                      placeholder="Username"
                      placeholderTextColor={isDark ? '#555' : '#A0AEC0'}
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={{ marginBottom: 10 }}>
                  <View 
                    style={{ 
                      backgroundColor: isDark ? '#1A1A1A' : '#F9FBFE',
                      borderRadius: 18,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#EDF2F7',
                      flexDirection: 'row',
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOpacity: 0.02, shadowRadius: 5,
                    }}
                  >
                    <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: isDark ? '#262626' : 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
                      <MaterialCommunityIcons name="lock-outline" size={18} color={brandPink} />
                    </View>
                    <TextInput
                      style={{ 
                        flex: 1, 
                        marginLeft: 14, 
                        fontWeight: '600', 
                        color: isDark ? '#FFFFFF' : '#1A202C', 
                        fontSize: 15,
                        paddingVertical: Platform.OS === 'ios' ? 0 : 4
                      }}
                      placeholder="Password"
                      placeholderTextColor={isDark ? '#555' : '#A0AEC0'}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                      <MaterialCommunityIcons 
                        name={showPassword ? "eye-outline" : "eye-off-outline"} 
                        size={18} 
                        color={isDark ? '#555' : '#CBD5E0'} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity 
                  onPress={() => setShowRecoverModal(true)}
                  style={{ alignSelf: 'flex-end', marginBottom: 16, marginRight: 2 }}
                >
                  <Text style={{ color: brandPink, fontWeight: '700', fontSize: 13 }}>Recover password?</Text>
                </TouchableOpacity>

                {/* Highly Modern Button with Gradient */}
                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={[brandPink, '#EC4899']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ 
                      borderRadius: 18,
                      paddingVertical: 15,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: brandPink,
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.35,
                      shadowRadius: 12,
                      elevation: 8,
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: '900', fontSize: 16, marginRight: 8, letterSpacing: 0.5 }}>
                      {isLoading ? 'SECURE LOGGING...' : 'CONTINUE'}
                    </Text>
                    {!isLoading && <MaterialCommunityIcons name="arrow-right" size={20} color="white" />}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 14 }}>
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#CBD5E0', marginHorizontal: 8 }} />
                  <Text style={{ color: isDark ? '#555' : '#A0AEC0', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>SECURE ACCESS</Text>
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#CBD5E0', marginHorizontal: 8 }} />
                </View>
              </View>
            </View>
          </Animated.View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Attractive Recover Password Modal */}
      <PremiumPopup
        visible={showRecoverModal}
        onClose={() => setShowRecoverModal(false)}
        title="Reset Password"
        message="Oops! Forgot your keys? 🎈 Please contact our school office directly to securely reset the password for your kid."
        type="info"
        icon="phone-message"
        buttonText="Call School Office"
        onButtonPress={handleCallOffice}
      />

      <PremiumPopup
        visible={statusModal.visible}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
        onClose={() => setStatusModal({ ...statusModal, visible: false })}
        buttonText="Got it"
      />
    </View>
  );
}
