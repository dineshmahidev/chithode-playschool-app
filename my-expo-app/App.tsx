import React from 'react';
import { BackHandler } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  // Handle hardware back button to prevent app from closing
  React.useEffect(() => {
    const backAction = () => {
      // Let the navigation handle the back action
      // This prevents the app from closing when back is pressed
      return false; // Return false to let the navigation handle it
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}