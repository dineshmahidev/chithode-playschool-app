import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withRepeat, 
  withSequence,
  withDelay,
  withTiming,
  Easing,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  const { theme } = useTheme();
  
  // Animation values
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const logoRotate = useSharedValue(0);
  const logoTranslateY = useSharedValue(50);
  
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);
  
  const ringScale1 = useSharedValue(0);
  const ringOpacity1 = useSharedValue(0);
  const ringScale2 = useSharedValue(0);
  const ringOpacity2 = useSharedValue(0);

  useEffect(() => {
    // Start animations
    logoScale.value = withSpring(1, { damping: 12, stiffness: 90 });
    logoOpacity.value = withTiming(1, { duration: 800 });
    logoTranslateY.value = withSpring(0, { damping: 12, stiffness: 90 });
    logoRotate.value = withSequence(
      withTiming(-0.1, { duration: 400 }),
      withRepeat(withTiming(0.1, { duration: 800, easing: Easing.bezier(0.4, 0, 0.6, 1) }), -1, true)
    );

    textOpacity.value = withDelay(500, withTiming(1, { duration: 1000 }));
    textTranslateY.value = withDelay(500, withSpring(0));

    // Background rings animation
    ringScale1.value = withRepeat(
      withTiming(1.5, { duration: 3000, easing: Easing.out(Easing.quad) }),
      -1,
      false
    );
    ringOpacity1.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      ),
      -1,
      false
    );

    ringScale2.value = withDelay(1500, withRepeat(
      withTiming(1.5, { duration: 3000, easing: Easing.out(Easing.quad) }),
      -1,
      false
    ));
    ringOpacity2.value = withDelay(1500, withRepeat(
      withSequence(
        withTiming(0.4, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      ),
      -1,
      false
    ));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { translateY: logoTranslateY.value },
      { rotate: `${logoRotate.value}rad` }
    ],
    opacity: logoOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const ringStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale1.value }],
    opacity: ringOpacity1.value,
  }));

  const ringStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale2.value }],
    opacity: ringOpacity2.value,
  }));

  return (
    <View style={styles.container}>
      {/* Using global StatusBar */}
      <LinearGradient
        colors={['#FFFFFF', '#FDF2F8']}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Rings */}
      <Animated.View style={[styles.ring, ringStyle1, { borderColor: 'rgba(244, 114, 182, 0.2)' }]} />
      <Animated.View style={[styles.ring, ringStyle2, { borderColor: 'rgba(244, 114, 182, 0.1)' }]} />

      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <View style={styles.logoGlow} />
          <Image 
            source={require('../../assets/images/splash-logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={[styles.textContainer, textStyle]}>
          <Image 
            source={require('../../assets/images/splash-text.png')} 
            style={styles.splashTextImage}
            resizeMode="contain"
          />
          <View style={styles.loaderLineContainer}>
             <View style={styles.loaderLineBackground} />
             <Animated.View style={[styles.loaderLine, { 
               width: '40%', 
               backgroundColor: '#F472B6' 
             }]} />
          </View>
          <Text style={styles.loadingText}>Initializing Experience...</Text>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>SECURE ACADEMIC GATEWAY</Text>
        <View style={styles.footerLine} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logoContainer: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  logoGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(244, 114, 182, 0.05)',
  },
  textContainer: {
    alignItems: 'center',
  },
  splashTextImage: {
    width: width * 0.7,
    height: 100,
  },
  ring: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    zIndex: 1,
  },
  loaderLineContainer: {
    width: 200,
    height: 4,
    marginTop: 20,
    borderRadius: 2,
    overflow: 'hidden',
  },
  loaderLineBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(244, 114, 182, 0.1)',
  },
  loaderLine: {
    height: '100%',
    borderRadius: 2,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginTop: 15,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 4,
  },
  footerLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(244, 114, 182, 0.3)',
    marginTop: 10,
    borderRadius: 1,
  }
});

export default SplashScreen;
