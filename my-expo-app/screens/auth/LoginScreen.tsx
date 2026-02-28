import React, { useEffect } from 'react';
import { Text, View, TextInput, TouchableOpacity, Dimensions, Alert } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, Easing } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  const { login } = useAuth();
  const { colors, theme } = useTheme();

  // Animation values
  const logoScale = useSharedValue(0);
  const logoRotate = useSharedValue(0);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(50);
  const bubble1Scale = useSharedValue(0);
  const bubble2Scale = useSharedValue(0);
  const bubble3Scale = useSharedValue(0);
  const bubble4Scale = useSharedValue(0);
  const bubble5Scale = useSharedValue(0);

  // Floating bubbles animation
  const floatingBubbles = [
    { scale: bubble1Scale, delay: 0, color: 'bg-yellow-400', position: { top: 100, left: 50 } },
    { scale: bubble2Scale, delay: 500, color: 'bg-blue-400', position: { top: 200, right: 70 } },
    { scale: bubble3Scale, delay: 1000, color: 'bg-red-400', position: { bottom: 300, left: 80 } },
    { scale: bubble4Scale, delay: 1500, color: 'bg-green-400', position: { bottom: 150, right: 60 } },
    { scale: bubble5Scale, delay: 2000, color: 'bg-purple-400', position: { top: 300, left: 200 } },
  ];

  useEffect(() => {
    // Logo animation
    logoScale.value = withTiming(1, { duration: 1000, easing: Easing.bounce });
    logoRotate.value = withRepeat(
      withSequence(
        withTiming(10, { duration: 2000 }),
        withTiming(-10, { duration: 2000 })
      ),
      -1,
      true
    );

    // Form animation
    setTimeout(() => {
      formOpacity.value = withTiming(1, { duration: 800 });
      formTranslateY.value = withTiming(0, { duration: 800 });
    }, 500);

    // Bubble animations
    floatingBubbles.forEach((bubble) => {
      setTimeout(() => {
        bubble.scale.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 2000 }),
            withTiming(0.5, { duration: 2000 })
          ),
          -1,
          true
        );
      }, bubble.delay);
    });
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotate.value}deg` },
    ],
  }));

  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Oops!', 'Please enter both username and password! 🎈');
      return;
    }
    setIsLoading(true);
    try {
      const success = await login(username, password);
      if (success) {
        onLogin();
      } else {
        Alert.alert('Login Failed', 'The username or password you entered is incorrect. Please try again or contact the school office.');
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className={`flex-1 ${colors.background} justify-center items-center`}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {/* Floating Animated Bubbles */}
      {floatingBubbles.map((bubble, index) => (
        <Animated.View
          key={index}
          style={[
            {
              position: 'absolute',
              width: 60,
              height: 60,
              borderRadius: 30,
              ...bubble.position,
            },
            useAnimatedStyle(() => ({
              transform: [{ scale: bubble.scale.value }],
            })),
          ]}
          className={`${bubble.color} opacity-40`}
        />
      ))}

      <View className="flex-1 justify-center items-center px-8 w-full">
        {/* Animated Logo */}
        <Animated.View style={logoAnimatedStyle} className="mb-8 items-center">
          <View className={`${theme === 'dark' ? 'bg-[#2d2d24]' : 'bg-white'} rounded-full p-6 shadow-xl border-4 border-brand-yellow`}>
            <Text className="text-6xl text-center">☀️</Text>
          </View>
          <Text className={`text-3xl font-black ${colors.text} text-center mt-4 tracking-tighter`}>
            Chithode Happykids
          </Text>
          <Text className={`text-lg ${colors.textSecondary} text-center opacity-90`}>
            A Magical Place to Learn! 🌈
          </Text>
        </Animated.View>

        {/* Animated Login Form */}
        <Animated.View style={formAnimatedStyle} className="w-full max-w-sm">
          <View className={`${colors.surface} rounded-[40px] p-8 shadow-2xl border ${colors.border}`}>
            {/* Email Input */}
            <View className="mb-6">
              <Text className={`${colors.textSecondary} font-black uppercase text-[10px] tracking-widest mb-3 ml-1`}>Username</Text>
              <View className={`${theme === 'dark' ? 'bg-[#3e3e34]' : 'bg-yellow-50/50'} flex-row items-center rounded-2xl px-5 py-2 border-2 ${theme === 'dark' ? 'border-[#4e4e44]' : 'border-transparent'}`}>
                <Text className="text-2xl mr-3 font-mono">👤</Text>
                <TextInput
                  className={`flex-1 h-12 font-bold ${colors.text}`}
                  placeholder="Enter your username"
                  placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Input */}
            <View className="mb-8">
              <Text className={`${colors.textSecondary} font-black uppercase text-[10px] tracking-widest mb-3 ml-1`}>Password</Text>
              <View className={`${theme === 'dark' ? 'bg-[#3e3e34]' : 'bg-yellow-50/50'} flex-row items-center rounded-2xl px-5 py-2 border-2 ${theme === 'dark' ? 'border-[#4e4e44]' : 'border-transparent'}`}>
                <Text className="text-2xl mr-3 font-mono">🔒</Text>
                <TextInput
                  className={`flex-1 h-12 font-bold ${colors.text}`}
                  placeholder="Enter your password"
                  placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                  <MaterialCommunityIcons 
                    name={showPassword ? "eye" : "eye-off"} 
                    size={22} 
                    color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              className={`bg-brand-yellow rounded-2xl py-5 px-8 shadow-lg ${
                isLoading ? 'opacity-70' : 'active:scale-95'
              }`}
            >
              <Text className="text-amber-900 text-center font-black text-lg">
                {isLoading ? 'Logging in... 🎈' : 'Let\'s Learn! 🚀'}
              </Text>
            </TouchableOpacity>

            {/* Fun Message */}
            <Text className={`text-center ${colors.textTertiary} mt-6 text-xs font-bold`}>
              Ready for an amazing day of learning? 🌟
            </Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
