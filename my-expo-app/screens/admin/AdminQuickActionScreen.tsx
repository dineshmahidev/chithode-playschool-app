import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import api from '../../services/api';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface AdminQuickActionScreenProps {
  navigation: NavigationProps;
}

export default function AdminQuickActionScreen({ navigation }: AdminQuickActionScreenProps) {
  const { colors, theme } = useTheme();

  const quickActions = [
    {
      id: 'studentList',
      title: 'Student List',
      subtitle: 'View and manage all students',
      icon: 'briefcase-account',
      color: 'bg-blue-600',
      action: () => navigation.navigate('studentList')
    },
    {
      id: 'teacherAttendanceReport',
      title: 'Staff Attendance',
      subtitle: 'Monthly teacher logs',
      icon: 'account-tie',
      color: 'bg-indigo-600',
      action: () => navigation.navigate('teacherAttendanceReport')
    },
    {
      id: 'studentAttendanceReport',
      title: 'Attendance Report',
      subtitle: 'Monthly student tracking',
      icon: 'file-chart',
      color: 'bg-green-600',
      action: () => navigation.navigate('studentAttendanceReport')
    },
    {
      id: 'takeAttendance',
      title: 'Take Attendance',
      subtitle: 'Record student presence',
      icon: 'calendar-check',
      color: 'bg-teal-600',
      action: () => navigation.navigate('takeAttendance')
    },
    {
      id: 'addUser',
      title: 'Add New User',
      subtitle: 'Create student, teacher, or admin account',
      icon: 'account-plus',
      color: 'bg-brand-yellow',
      action: () => navigation.navigate('userManagement')
    },
    {
      id: 'addFee',
      title: 'Assign Fee',
      subtitle: 'Create fee for student',
      icon: 'cash-plus',
      color: 'bg-brand-pink',
      action: () => navigation.navigate('feesManagement')
    },
    {
      id: 'incomeExpense',
      title: 'Income & Expense',
      subtitle: 'Track school finances',
      icon: 'cash-multiple',
      color: 'bg-green-600',
      action: () => navigation.navigate('incomeExpense')
    },
    {
      id: 'viewReports',
      title: 'View Reports',
      subtitle: 'Check school statistics and reports',
      icon: 'chart-bar',
      color: 'bg-yellow-600',
      action: () => navigation.navigate('reports')
    },
    {
      id: 'announcements',
      title: 'Send Announcement',
      subtitle: 'Broadcast message to all users',
      icon: 'bullhorn',
      color: 'bg-pink-600',
      action: () => navigation.navigate('announcements')
    },
    {
      id: 'postActivity',
      title: 'Post Activity',
      subtitle: 'Share photos and videos',
      icon: 'camera-burst',
      color: 'bg-blue-500',
      action: () => navigation.navigate('postActivity')
    },
    {
      id: 'backup',
      title: 'Backup Data',
      subtitle: 'Create system backup',
      icon: 'database',
      color: 'bg-brand-yellow',
      action: () => navigation.navigate('backup')
    },
    {
      id: 'timetable',
      title: 'Timetable',
      subtitle: 'Manage daily class schedule',
      icon: 'calendar-clock',
      color: 'bg-indigo-600',
      action: () => navigation.navigate('timetable')
    }
  ];

  return (
    <View 
        className={`flex-1 ${theme === 'dark' ? 'bg-[#1c1c14]' : 'bg-white'}`}
        style={{ backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF' }}
    >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* ── Background Gradient & 3D Illustration ── */}
        <View className="absolute top-0 left-0 right-0 h-[500px] overflow-hidden">
            <LinearGradient
                colors={[theme === 'dark' ? '#1e3a8a' : '#FDF2F8', theme === 'dark' ? '#1c1c14' : '#FFFFFF']}
                className="absolute inset-0"
            />
            <Image 
                source={require('../../assets/images/playschool_actions.png')} 
                style={{ width: '100%', height: '100%', opacity: theme === 'dark' ? 0.15 : 0.25, transform: [{ scale: 1.2 }, { translateY: -20 }] }}
                resizeMode="cover"
            />
            <View className="absolute -top-20 -left-20 w-80 h-80 bg-brand-pink/10 rounded-full blur-3xl" />
            
            <LinearGradient
                colors={['transparent', theme === 'dark' ? '#1c1c14' : '#FFFFFF']}
                className="absolute bottom-0 left-0 right-0 h-60"
            />
        </View>

        {/* Header */}
        <View className="px-6 pt-12 pb-6">
            <View className="flex-row items-center justify-between">
                <View className="flex-1">
                    <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>
                        Admin
                    </Text>
                    <Text className="text-2xl font-black text-brand-pink mt-[-4px]">
                        Operations ⚡
                    </Text>
                    <View className="bg-brand-pink/20 self-start px-3 py-1.5 rounded-full mt-3 border border-brand-pink/10 shadow-sm">
                        <Text className="text-brand-pink text-[9px] font-black uppercase tracking-[2px]">Management Vault</Text>
                    </View>
                </View>
                <TouchableOpacity 
                    onPress={() => navigation.goBack()}
                    className={`${theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-brand-pink/20'} w-16 h-16 rounded-[24px] items-center justify-center shadow-2xl border`}
                >
                    <MaterialCommunityIcons name="arrow-left" size={32} color={theme === 'dark' ? '#FFF' : '#F472B6'} />
                </TouchableOpacity>
            </View>
        </View>

        {/* Live Monitoring - Ultra Premium Card */}
        <View className="px-6 mt-8 mb-6">
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('liveCamera')}
                className="rounded-[40px] overflow-hidden shadow-2xl"
                style={{ elevation: 20 }}
            >
                <LinearGradient
                    colors={theme === 'dark' ? ['#7f1d1d', '#450a0a'] : ['#EF4444', '#DC2626']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="p-8"
                >
                    <View className="flex-row items-center justify-between mb-6">
                        <View className="flex-row items-center">
                            <View className="bg-white/20 p-4 rounded-2xl border border-white/10 shadow-lg">
                                <MaterialCommunityIcons name="broadcast" size={32} color="white" />
                            </View>
                            <View className="ml-5">
                                <Text className="text-white text-2xl font-black tracking-tight">Live Monitoring</Text>
                                <View className="flex-row items-center mt-1.5">
                                    <View className="w-2 h-2 rounded-full bg-red-300 mr-2" />
                                    <Text className="text-red-100 font-black text-[10px] uppercase tracking-widest opacity-80">Security Terminal</Text>
                                </View>
                            </View>
                        </View>
                        <View className="bg-white/30 px-4 py-2 rounded-full flex-row items-center border border-white/20">
                            <View className="w-1.5 h-1.5 rounded-full bg-white mr-2" />
                            <Text className="text-white font-black text-[10px] uppercase tracking-tighter">LIVE</Text>
                        </View>
                    </View>

                    <View className="bg-white/10 p-5 rounded-3xl border border-white/10">
                        <Text className="text-white text-xs font-bold leading-5 opacity-90">
                            Access secure surveillance feeds, manage camera URLs, and monitor student zones in real-time.
                        </Text>
                        <View className="flex-row items-center mt-4">
                            <Text className="text-white font-black text-[10px] uppercase tracking-widest">Connect Now</Text>
                            <MaterialCommunityIcons name="chevron-right" size={16} color="white" className="ml-1" />
                        </View>
                    </View>
                    <View className="absolute -bottom-10 -right-10 opacity-10">
                        <MaterialCommunityIcons name="security" size={180} color="white" />
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </View>

        {/* Daily Highlights - Ultra Premium Card */}
        <View className="px-6 mb-8">
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('activityFeed')}
                className="rounded-[40px] overflow-hidden shadow-2xl"
                style={{ elevation: 20 }}
            >
                <LinearGradient
                    colors={theme === 'dark' ? ['#701a75', '#4a044e'] : ['#F472B6', '#BE185D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="p-8"
                >
                    <View className="flex-row items-center justify-between mb-6">
                        <View className="flex-row items-center">
                            <View className="bg-white/20 p-4 rounded-2xl border border-white/10 shadow-lg">
                                <MaterialCommunityIcons name="image-multiple-outline" size={32} color="white" />
                            </View>
                            <View className="ml-5">
                                <Text className="text-white text-2xl font-black tracking-tight">Daily Highlights</Text>
                                <View className="flex-row items-center mt-1.5">
                                    <View className="w-2 h-2 rounded-full bg-pink-300 mr-2" />
                                    <Text className="text-pink-100 font-black text-[10px] uppercase tracking-widest opacity-80">Parent Social Feed</Text>
                                </View>
                            </View>
                        </View>
                        <View className="bg-white/30 p-3 rounded-2xl border border-white/20">
                            <MaterialCommunityIcons name="heart" size={20} color="white" />
                        </View>
                    </View>

                    <View className="bg-white/10 p-5 rounded-3xl border border-white/10">
                        <Text className="text-white text-xs font-bold leading-5 opacity-90">
                            Curate school moments, interact with parent posts, and build our vibrant digital community.
                        </Text>
                        <View className="flex-row items-center mt-4">
                            <Text className="text-white font-black text-[10px] uppercase tracking-widest">Launch Feed</Text>
                            <MaterialCommunityIcons name="chevron-right" size={16} color="white" className="ml-1" />
                        </View>
                    </View>
                    <View className="absolute -bottom-10 -right-10 opacity-10">
                        <MaterialCommunityIcons name="emoticon-happy-outline" size={180} color="white" />
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </View>

        {/* Quick Action Grid */}
        <View className="px-6 pb-20">
            <View className="flex-row items-center justify-between mb-6 px-1">
                <Text className={`text-xl font-black ${colors.text} tracking-tighter`}>Toolbox 🛠️</Text>
                <View className="bg-brand-pink/10 px-3 py-1 rounded-full">
                    <Text className="text-brand-pink text-[9px] font-black uppercase tracking-widest">Master Tools</Text>
                </View>
            </View>

            <View className="flex-row flex-wrap justify-between">
                {[
                    { id: 'studentList', title: 'Student List', subtitle: 'Global database', icon: 'briefcase-account', colors: ['#2563EB', '#1D4ED8'], screen: 'studentList' },
                    { id: 'teacherAttendanceReport', title: 'Staff Logs', subtitle: 'Attendance stats', icon: 'account-tie', colors: ['#4F46E5', '#4338CA'], screen: 'teacherAttendanceReport' },
                    { id: 'studentAttendanceReport', title: 'Analytics', subtitle: 'Monthly tracking', icon: 'file-chart', colors: ['#10B981', '#059669'], screen: 'studentAttendanceReport' },
                    { id: 'takeAttendance', title: 'Attendance', subtitle: 'Record presence', icon: 'calendar-check', colors: ['#14B8A6', '#0D9488'], screen: 'takeAttendance' },
                    { id: 'addUser', title: 'User Add', subtitle: 'Create account', icon: 'account-plus', colors: ['#FBBF24', '#D97706'], screen: 'userManagement' },
                    { id: 'addFee', title: 'Assign Fee', subtitle: 'Student records', icon: 'cash-plus', colors: ['#F472B6', '#BE185D'], screen: 'feesManagement' },
                    { id: 'incomeExpense', title: 'Finances', subtitle: 'Budget tracker', icon: 'cash-multiple', colors: ['#059669', '#047857'], screen: 'incomeExpense' },
                    { id: 'reports', title: 'Reports', subtitle: 'School stats', icon: 'chart-bar', colors: ['#D97706', '#B45309'], screen: 'reports' },
                    { id: 'announcements', title: 'Broadcast', subtitle: 'Push alerts', icon: 'bullhorn', colors: ['#DB2777', '#BE185D'], screen: 'announcements' },
                    { id: 'postActivity', title: 'Post Now', subtitle: 'Media sharing', icon: 'camera-burst', colors: ['#3B82F6', '#2563EB'], screen: 'postActivity' },
                    { id: 'backup', title: 'Backup', subtitle: 'System vault', icon: 'database', colors: ['#F59E0B', '#D97706'], screen: 'backup' },
                    { id: 'timetable', title: 'Timetable', subtitle: 'Daily plans', icon: 'calendar-clock', colors: ['#6366F1', '#4F46E5'], screen: 'timetable' }
                ].map((action) => (
                    <TouchableOpacity
                        key={action.id}
                        activeOpacity={0.9}
                        onPress={() => navigation.navigate(action.screen as any)}
                        className="w-[48%] rounded-[32px] overflow-hidden shadow-xl mb-4"
                        style={{ elevation: 8 }}
                    >
                        <LinearGradient
                            colors={theme === 'dark' ? [action.colors[0] + '40', action.colors[1] + '20'] : [action.colors[0], action.colors[1]]}
                            className="p-5 h-44 justify-between border border-white/10"
                        >
                            <View className="bg-white/20 self-start p-3 rounded-2xl shadow-sm">
                                <MaterialCommunityIcons 
                                    name={action.icon as any} 
                                    size={24} 
                                    color="white" 
                                />
                            </View>
                            <View>
                                <Text className="text-white font-black text-lg tracking-tight" numberOfLines={1}>{action.title}</Text>
                                <Text className="text-white/80 text-[10px] font-bold uppercase tracking-widest mt-1" numberOfLines={1}>{action.subtitle}</Text>
                            </View>
                            <View className="absolute -bottom-4 -right-4 opacity-10">
                                <MaterialCommunityIcons name={action.icon as any} size={80} color="white" />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
        </ScrollView>
    </View>
  );
}
