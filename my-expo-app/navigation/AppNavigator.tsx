import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, BackHandler, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

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
import WebsiteSettingsScreen from '../screens/admin/WebsiteSettingsScreen';
import MyAttendanceScreen from '../screens/teacher/MyAttendanceScreen';
import StudentAttendanceReportScreen from '../screens/teacher/StudentAttendanceReportScreen';
import TeacherAttendanceReportScreen from '../screens/admin/TeacherAttendanceReportScreen';

type ScreenType = 'login' | 'home' | 'quickAction' | 'account' | 'userManagement' | 'feesManagement' | 'announcements' | 'reports' | 'backup' | 'settings' | 'attendance' | 'activityFeed' | 'liveCamera' | 'homework' | 'emergencyContact' | 'myFees' | 'rewards' | 'profile' | 'timetable' | 'postHomework' | 'takeAttendance' | 'postActivity' | 'viewSubmissions' | 'classSchedule' | 'parentMessages' | 'studentList' | 'studentDetail' | 'incomeExpense' | 'websiteSettings' | 'myAttendance' | 'studentAttendanceReport' | 'teacherAttendanceReport';

export default function AppNavigator() {
  const { user, announcements, isLoading } = useAuth();
  const { theme, colors } = useTheme();
  
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('login');
  const [navigationStack, setNavigationStack] = useState<ScreenType[]>(['login']);
  const [params, setParams] = useState<any>(null);

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
  
  // Redirect logic
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        if (currentScreen !== 'login') {
          setCurrentScreen('login');
          setNavigationStack(['login']);
        }
      } else if (currentScreen === 'login') {
        navigate('home', true);
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
      case 'websiteSettings': return <WebsiteSettingsScreen navigation={navigation} />;
      default: return <AdminHomeScreen navigation={{ navigate, goBack }} />;
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar style="light" backgroundColor="#F472B6" />
        <ActivityIndicator size="large" color="#F472B6" />
        <Text style={{ marginTop: 20, color: '#F472B6', fontWeight: 'bold' }}>Restoring Session...</Text>
      </View>
    );
  }

  if (!user) {
    return (
        <>
            <StatusBar style="light" backgroundColor="#F472B6" />
            <LoginScreen onLogin={() => navigate('home', true)} />
        </>
    );
  }

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
    websiteSettings: 'quickAction',
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

  const isTabScreen = currentScreen !== 'login';
  const activeTab = tabMapping[currentScreen] || 'home';

  return (
    <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF' }}>
      <StatusBar style="light" backgroundColor="#F472B6" translucent={false} />
      
      {isTabScreen ? (
        <View 
            className="flex-1" 
            style={{ 
              backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF',
              paddingTop: insets.top
            }}
        >
          <View className="flex-1">{renderInnerContent()}</View>
          
          {/* Persistent Tab Bar */}
          <View 
            className={`${colors.surface} ${colors.border} border-t flex-row`}
            style={{ paddingBottom: Math.max(insets.bottom, 12) }}
          >
            {['home', 'quickAction', 'account'].map((tab) => {
              const isActive = activeTab === tab;
              const icons: any = { home: 'home', quickAction: 'flash', account: 'account' };
              const labels = { home: 'Home', quickAction: 'Quick Action', account: 'Account' };
              return (
                <TouchableOpacity
                  key={tab}
                  className={`flex-1 pt-3 items-center ${isActive ? `${colors.tabBarActiveBg} border-t-4 border-brand-pink` : colors.tabBarInactiveBg}`}
                  onPress={() => navigate(tab as ScreenType, true)}
                >
                  <MaterialCommunityIcons name={icons[tab]} size={24} color={isActive ? colors.tabBarActive : colors.tabBarInactive} />
                  <Text className={`text-[10px] mt-1 uppercase tracking-tighter ${isActive ? 'text-brand-pink font-black' : colors.textTertiary}`}>{labels[tab as keyof typeof labels]}</Text>
                </TouchableOpacity>
              );
            })}
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
