import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, BackHandler, Alert, ActivityIndicator, Animated, Easing } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import AdminQuickActionScreen from '../screens/admin/AdminQuickActionScreen';
import AdminAccountScreen from '../screens/admin/AdminAccountScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import FeesManagementScreen from '../screens/admin/FeesManagementScreen';
import AnnouncementsScreen from '../screens/admin/AnnouncementsScreen';
import ReportsScreen from '../screens/admin/ReportsScreen';
import BackupScreen from '../screens/admin/BackupScreen';
import SettingsScreen from '../screens/admin/SettingsScreen';
import StudentListScreen from '../screens/admin/StudentListScreen';
import StudentDetailScreen from '../screens/admin/StudentDetailScreen';
import IncomeExpenseScreen from '../screens/admin/IncomeExpenseScreen';
import StudentHomeScreen from '../screens/student/StudentHomeScreen';
import StudentQuickActionScreen from '../screens/student/StudentQuickActionScreen';
import StudentAccountScreen from '../screens/student/StudentAccountScreen';
import AttendanceScreen from '../screens/student/AttendanceScreen';
import ActivityFeedScreen from '../screens/student/ActivityFeedScreen';
import LiveCameraScreen from '../screens/student/LiveCameraScreen';
import HomeworkScreen from '../screens/student/HomeworkScreen';
import TimetableScreen from '../screens/student/TimetableScreen';
import EmergencyContactScreen from '../screens/student/EmergencyContactScreen';
import MyFeesScreen from '../screens/student/MyFeesScreen';
import RewardsScreen from '../screens/student/RewardsScreen';
import ProfileScreen from '../screens/student/ProfileScreen';
import TeacherHomeScreen from '../screens/teacher/TeacherHomeScreen';
import TeacherQuickActionScreen from '../screens/teacher/TeacherQuickActionScreen';
import TeacherAccountScreen from '../screens/teacher/TeacherAccountScreen';
import PostHomeworkScreen from '../screens/teacher/PostHomeworkScreen';
import TakeAttendanceScreen from '../screens/teacher/TakeAttendanceScreen';
import PostActivityScreen from '../screens/admin/PostActivityScreen';
import ViewSubmissionsScreen from '../screens/teacher/ViewSubmissionsScreen';
import ClassScheduleScreen from '../screens/teacher/ClassScheduleScreen';
import ParentMessagesScreen from '../screens/teacher/ParentMessagesScreen';
import MyAttendanceScreen from '../screens/teacher/MyAttendanceScreen';
import StudentAttendanceReportScreen from '../screens/teacher/StudentAttendanceReportScreen';
import TeacherAttendanceReportScreen from '../screens/admin/TeacherAttendanceReportScreen';
import SplashScreen from '../screens/auth/SplashScreen';

type ScreenType = 'login' | 'home' | 'quickAction' | 'account' | 'userManagement' | 'feesManagement' | 'announcements' | 'reports' | 'backup' | 'settings' | 'attendance' | 'activityFeed' | 'liveCamera' | 'homework' | 'emergencyContact' | 'myFees' | 'rewards' | 'profile' | 'timetable' | 'postHomework' | 'takeAttendance' | 'postActivity' | 'viewSubmissions' | 'classSchedule' | 'parentMessages' | 'studentList' | 'studentDetail' | 'incomeExpense' | 'myAttendance' | 'studentAttendanceReport' | 'teacherAttendanceReport';

export default function AppNavigator() {
  const { user, announcements, isLoading } = useAuth();
  const { theme, colors } = useTheme();
  
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('login');
  const [navigationStack, setNavigationStack] = useState<ScreenType[]>(['login']);
  const [params, setParams] = useState<any>(null);
  const [isHomeBlinking, setIsHomeBlinking] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const navigate = useCallback((screen: ScreenType, resetOrParams: boolean | any = false, screenParams: any = null) => {
    setCurrentScreen(screen);
    const finalParams = typeof resetOrParams === 'object' ? resetOrParams : screenParams;
    setParams(finalParams);
    
    if (resetOrParams === true) {
      setNavigationStack([screen]);
    } else {
      setNavigationStack(prev => [...prev, screen]);
    }
  }, []);

  const goBack = useCallback(() => {
    let handled = false;
    setNavigationStack(prev => {
      if (prev.length > 1) {
        const newStack = [...prev];
        newStack.pop();
        const previousScreen = newStack[newStack.length - 1];
        setCurrentScreen(previousScreen);
        handled = true;
        return newStack;
      }
      return prev;
    });
    return handled;
  }, []);

  const navigation = useMemo(() => ({ navigate, goBack }), [navigate, goBack]);


  const insets = useSafeAreaInsets();
  
  // Redirect logic with splash transition
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        if (currentScreen !== 'login') {
          // Trigger logout splash transition
          setIsTransitioning(true);
          setTimeout(() => {
            setCurrentScreen('login');
            setNavigationStack(['login']);
            setIsTransitioning(false);
          }, 2000); // 2 seconds splash for logout
        }
      } else if (currentScreen === 'login') {
        // Trigger login splash transition
        setIsTransitioning(true);
        setTimeout(() => {
            navigate('home', true);
            setIsTransitioning(false);
        }, 2000); // 2 seconds splash for login
      }
    }
  }, [user, isLoading, currentScreen, navigate]);

  // Handle hardware back button
  useEffect(() => {
    const backAction = () => {
      if (user && !['home', 'quickAction', 'account', 'login'].includes(currentScreen)) {
        return goBack();
      }
      if (user && ['home', 'quickAction', 'account'].includes(currentScreen)) {
        Alert.alert('Exit App', 'Are you sure you want to exit the app?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      }
      if (currentScreen === 'login') {
        Alert.alert('Exit App', 'Are you sure you want to exit the app?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [user, currentScreen, goBack]);

  // ── Tab Animation Animations ──
  const homeScale = useRef(new Animated.Value(1)).current;
  const homeOpacity = useRef(new Animated.Value(1)).current;
  const quickScale = useRef(new Animated.Value(1)).current;
  const quickRotate = useRef(new Animated.Value(0)).current;
  const accountScale = useRef(new Animated.Value(1)).current;
  const accountOpacity = useRef(new Animated.Value(1)).current;

  // Map screens to their parent tabs for consistent highlighting
  const tabMapping: Record<string, string> = {
    home: 'home',
    activityFeed: 'home',
    timetable: 'home',
    attendance: 'home',
    liveCamera: 'home',
    homework: 'home',
    emergencyContact: 'home',
    myFees: 'home',
    rewards: 'home',
    profile: 'account',
    quickAction: 'quickAction',
    account: 'account',
    // Admin screens
    userManagement: 'quickAction',
    feesManagement: 'quickAction',
    announcements: 'quickAction',
    reports: 'quickAction',
    backup: 'quickAction',
    postActivity: 'quickAction',
    studentList: 'quickAction',
    studentDetail: 'quickAction',
    incomeExpense: 'quickAction',
    // Teacher screens
    postHomework: 'quickAction',
    takeAttendance: 'quickAction',
    viewSubmissions: 'home',
    classSchedule: 'home', 
    parentMessages: 'account',
    myAttendance: 'quickAction',
    studentAttendanceReport: 'quickAction',
    teacherAttendanceReport: 'quickAction'
  };

  const isTabScreen = currentScreen !== 'login' && !!user;
  const activeTab = tabMapping[currentScreen] || 'home';

  useEffect(() => {
    if (!isTabScreen) return;
    
    const triggerSpring = (animatedValue: Animated.Value) => {
      Animated.spring(animatedValue, {
        toValue: 1.15,
        friction: 4,
        tension: 40,
        useNativeDriver: true
      }).start(() => {
        Animated.spring(animatedValue, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true
        }).start();
      });
    };

    if (activeTab === 'home') {
      setIsHomeBlinking(true);
      triggerSpring(homeScale);
      Animated.sequence([
        Animated.timing(homeOpacity, { toValue: 0, duration: 80, useNativeDriver: true }),
        Animated.timing(homeOpacity, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(homeOpacity, { toValue: 0, duration: 80, useNativeDriver: true }),
        Animated.timing(homeOpacity, { toValue: 1, duration: 80, useNativeDriver: true }),
      ]).start(() => {
        setIsHomeBlinking(false);
      });
    }
    if (activeTab === 'quickAction') {
      triggerSpring(quickScale);
      // Request: 2 Anti-clockwise (-720) then 1 clockwise (+360)
      Animated.sequence([
        Animated.timing(quickRotate, {
          toValue: -2, // -720 degrees
          duration: 900,
          easing: Easing.bezier(0.33, 1, 0.68, 1),
          useNativeDriver: true
        }),
        Animated.timing(quickRotate, {
          toValue: -1, // +360 from -720 is -360 (one full turn CW)
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        })
      ]).start();
    } else {
      Animated.spring(quickRotate, { toValue: 0, useNativeDriver: true }).start();
    }
    if (activeTab === 'account') {
      triggerSpring(accountScale);
      Animated.sequence([
        Animated.timing(accountOpacity, { toValue: 0, duration: 80, useNativeDriver: true }),
        Animated.timing(accountOpacity, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(accountOpacity, { toValue: 0, duration: 80, useNativeDriver: true }),
        Animated.timing(accountOpacity, { toValue: 1, duration: 80, useNativeDriver: true }),
      ]).start();
    }
  }, [activeTab, isTabScreen]);

  const thunderRotation = quickRotate.interpolate({
    inputRange: [-2, -1, 0],
    outputRange: ['-720deg', '-360deg', '0deg']
  });

  const renderInnerContent = () => {
    const activeTab = currentScreen === 'login' ? 'home' : currentScreen;
    switch (activeTab) {
      case 'home':
        return (
          <>
            {user?.role === 'admin' && <AdminHomeScreen navigation={navigation} />}
            {user?.role === 'student' && <StudentHomeScreen navigation={navigation} />}
            {user?.role === 'teacher' && <TeacherHomeScreen navigation={navigation} />}
          </>
        );
      case 'quickAction':
        return (
          <>
            {user?.role === 'admin' && <AdminQuickActionScreen navigation={navigation} />}
            {user?.role === 'student' && <StudentQuickActionScreen navigation={navigation} />}
            {user?.role === 'teacher' && <TeacherQuickActionScreen navigation={navigation} />}
          </>
        );
      case 'account':
        return (
          <>
            {user?.role === 'admin' && <AdminAccountScreen navigation={navigation} />}
            {user?.role === 'student' && <StudentAccountScreen navigation={navigation} />}
            {user?.role === 'teacher' && <TeacherAccountScreen navigation={navigation} />}
          </>
        );
      case 'userManagement': return <UserManagementScreen navigation={navigation} />;
      case 'feesManagement': return <FeesManagementScreen navigation={navigation} />;
      case 'announcements': return <AnnouncementsScreen navigation={navigation} />;
      case 'reports': return <ReportsScreen navigation={navigation} />;
      case 'backup': return <BackupScreen navigation={navigation} />;
      case 'settings': return <SettingsScreen navigation={navigation} />;
      case 'studentList': return <StudentListScreen navigation={navigation} />;
      case 'studentDetail': return <StudentDetailScreen navigation={navigation} route={{ params }} />;
      case 'attendance': return <AttendanceScreen navigation={navigation} />;
      case 'activityFeed': return <ActivityFeedScreen navigation={navigation} />;
      case 'liveCamera': return <LiveCameraScreen navigation={navigation} />;
      case 'timetable': return <TimetableScreen navigation={navigation} />;
      case 'homework': return <HomeworkScreen navigation={navigation} />;
      case 'emergencyContact': return <EmergencyContactScreen navigation={navigation} />;
      case 'myFees': return <MyFeesScreen navigation={navigation} />;
      case 'myAttendance': return <MyAttendanceScreen navigation={navigation} />;
      case 'studentAttendanceReport': return <StudentAttendanceReportScreen navigation={navigation} />;
      case 'teacherAttendanceReport': return <TeacherAttendanceReportScreen navigation={navigation} />;
      case 'rewards': return <RewardsScreen navigation={navigation} />;
      case 'profile': return <ProfileScreen navigation={navigation} route={{ params }} />;
      case 'postHomework': return <PostHomeworkScreen navigation={navigation} />;
      case 'takeAttendance': return <TakeAttendanceScreen navigation={navigation} />;
      case 'postActivity': return <PostActivityScreen navigation={navigation} />;
      case 'viewSubmissions': return <ViewSubmissionsScreen navigation={navigation} />;
      case 'classSchedule': return <ClassScheduleScreen navigation={navigation} />;
      case 'parentMessages': return <ParentMessagesScreen navigation={navigation} />;
      case 'incomeExpense': return <IncomeExpenseScreen navigation={navigation} />;
      default: return <AdminHomeScreen navigation={{ navigate, goBack }} />;
    }
  };

  if (isLoading || isTransitioning) {
    return <SplashScreen />;
  }

  if (!user) {
    return (
        <>
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} translucent={true} backgroundColor="transparent" />
            <LoginScreen onLogin={() => navigate('home', true)} />
        </>
    );
  }


  return (
    <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF' }}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} backgroundColor={theme === 'dark' ? '#1c1c14' : '#FFFFFF'} translucent={false} />
      
      {isTabScreen ? (
        <View 
            className="flex-1" 
            style={{ 
              backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF',
            }}
        >
          <View 
            className="flex-1" 
            style={{ 
              paddingBottom: 85 + Math.max(insets.bottom, 15) // Corrected padding for better clearance
            }}
        >
            {renderInnerContent()}
          </View>
          
          {/* Truly Premium Floating Pill Tab Bar */}
          <View 
            style={{ 
              position: 'absolute',
              bottom: Math.max(insets.bottom, 15), // Increased slightly for button-nav devices
              left: 16,
              right: 16,
              zIndex: 1000,
              backgroundColor: 'transparent',
            }}
          >
            <LinearGradient
              colors={theme === 'dark' ? ['#21211b', '#0f0f0a'] : ['#FFFFFF', '#FDF2F8']}
              style={{
                borderRadius: 45,
                height: 85,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#F472B6',
                shadowOffset: { width: 0, height: 15 },
                shadowOpacity: 0.25,
                shadowRadius: 20,
                elevation: 20,
                borderWidth: 1.5,
                borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(244,114,182,0.12)',
              }}
            >
              <View className="flex-1 flex-row items-center justify-between h-full px-5">
                {['home', 'quickAction', 'account'].map((tab) => {
                  const isActive = activeTab === tab;
                  const isCenter = tab === 'quickAction';
                  
                  const getTabIcon = () => {
                    if (tab === 'home') {
                      if (isHomeBlinking) return 'shield-account'; // The "Admin Mention" icon during blink
                      return isActive ? 'home' : 'home-outline';
                    }
                    if (tab === 'quickAction') return 'lightning-bolt';
                    if (tab === 'account') return isActive ? 'account-circle' : 'account-circle-outline';
                    return 'help';
                  };
                  
                  const scale = tab === 'home' ? homeScale : (tab === 'quickAction' ? quickScale : accountScale);

                  if (isCenter) {
                    return (
                      <TouchableOpacity
                        key={tab}
                        activeOpacity={0.9}
                        onPress={() => navigate(tab as ScreenType, true)}
                        className="items-center justify-center"
                        style={{ zIndex: 1001 }}
                      >
                        <Animated.View style={{ transform: [{ scale: quickScale }, { rotate: thunderRotation }] }}>
                          <LinearGradient
                            colors={['#FBBF24', '#D97706']}
                            style={{
                              width: 78,
                              height: 78,
                              borderRadius: 39,
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderWidth: 6,
                              borderColor: '#FFFFFF',
                              shadowColor: '#FBBF24',
                              shadowOffset: { width: 0, height: 8 },
                              shadowOpacity: 0.5,
                              shadowRadius: 15,
                              elevation: 15,
                            }}
                          >
                            <MaterialCommunityIcons name={getTabIcon()} size={36} color="white" />
                          </LinearGradient>
                        </Animated.View>
                      </TouchableOpacity>
                    );
                  }

                  // Enhanced Side Buttons (Home and Me)
                  return (
                    <TouchableOpacity
                      key={tab}
                      activeOpacity={0.8}
                      className="items-center justify-center"
                      onPress={() => navigate(tab as ScreenType, true)}
                    >
                      <Animated.View 
                        style={{ 
                          transform: [{ scale }], 
                          opacity: tab === 'home' ? homeOpacity : (tab === 'account' ? accountOpacity : 1),
                          alignItems: 'center' 
                        }}
                      >
                        <LinearGradient
                          colors={isActive 
                             ? (tab === 'home' ? ['#6366F1', '#4F46E5'] : ['#F472B6', '#BE185D']) 
                             : (theme === 'dark' ? ['#2d2d24', '#1a1a14'] : ['#F9FAFB', '#F3F4F6'])}
                          style={{
                            width: 58,
                            height: 58,
                            borderRadius: 29,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: isActive ? 4 : 1,
                            borderColor: theme === 'dark' ? '#FFFFFF' : (isActive ? '#FFFFFF' : '#E5E7EB'),
                            shadowColor: isActive ? (tab === 'home' ? '#6366F1' : '#F472B6') : 'transparent',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: isActive ? 0.3 : 0,
                            shadowRadius: 12,
                            elevation: 12,
                          }}
                        >
                          <MaterialCommunityIcons 
                            name={getTabIcon()} 
                            size={28} 
                            color={isActive ? 'white' : (theme === 'dark' ? '#6B7280' : '#9CA3AF')} 
                          />
                        </LinearGradient>
                      </Animated.View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </LinearGradient>
          </View>
        </View>
      ) : (
        <View className="flex-1">
          {renderInnerContent()}
        </View>
      )}
    </View>
  );
}
