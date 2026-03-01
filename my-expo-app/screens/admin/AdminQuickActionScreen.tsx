import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    },
    {
      id: 'websiteSettings',
      title: 'Website Settings',
      subtitle: 'Manage your public website content',
      icon: 'web',
      color: 'bg-indigo-500',
      action: () => navigation.navigate('websiteSettings')
    }
  ];

  return (
    <View 
        className={`flex-1 ${colors.background}`}
        style={{ backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF' }}
    >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-4">
            <View className="flex-row items-center justify-between">
                <View className="flex-1">
                    <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>
                        Quick
                    </Text>
                    <Text className={`text-2xl font-bold text-brand-pink`}>
                        Actions 👑
                    </Text>
                    <Text className={`text-[10px] ${theme === 'dark' ? 'text-gray-400' : colors.textTertiary} font-black mt-1 uppercase tracking-[3px]`}>
                        Efficient Management
                    </Text>
                </View>
                <TouchableOpacity 
                    onPress={() => navigation.goBack()}
                    className={`${theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-brand-pink/20'} w-14 h-14 rounded-2xl items-center justify-center shadow-sm border`}
                >
                    <MaterialCommunityIcons name="arrow-left" size={28} color={theme === 'dark' ? '#FFF' : '#F472B6'} />
                </TouchableOpacity>
            </View>
        </View>

        {/* Live Camera Feature - Prominent Card */}
        {/* Live Camera Feature - Prominent Card */}
        <View className="px-6 mt-6 mb-6">
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('liveCamera')}
                className={`${theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-red-50'} p-7 rounded-[40px] border-2 shadow-2xl shadow-red-500/10 overflow-hidden`}
            >
                {/* Decorative background glow */}
                <View className="absolute -top-20 -right-20 w-48 h-48 bg-red-500/10 rounded-full blur-3xl" />
                
                <View className="flex-row items-center justify-between mb-5">
                    <View className="flex-row items-center">
                        <View className="bg-red-500 p-4 rounded-2xl shadow-lg shadow-red-500/40">
                            <MaterialCommunityIcons name="broadcast" size={30} color="white" />
                        </View>
                        <View className="ml-4">
                            <Text className={`text-xl font-black ${colors.text} tracking-tight`}>Live Monitoring</Text>
                            <View className="flex-row items-center mt-1">
                                <View className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse" />
                                <Text className="text-red-500 font-black text-[10px] uppercase tracking-widest">System Online</Text>
                            </View>
                        </View>
                    </View>
                    <View className="bg-red-600 px-4 py-2 rounded-full flex-row items-center">
                        <View className="w-1.5 h-1.5 rounded-full bg-white mr-2" />
                        <Text className="text-white font-black text-[10px] uppercase tracking-tighter">LIVE</Text>
                    </View>
                </View>

                <View className={`${theme === 'dark' ? 'bg-black/20' : 'bg-red-50/50'} p-5 rounded-3xl border ${theme === 'dark' ? 'border-gray-800' : 'border-red-100'}`}>
                    <Text className={`text-xs ${colors.textSecondary} font-bold leading-5 opacity-90`}>
                        Access your surveillance feeds, manage camera URLs, and monitor student areas in real-time.
                    </Text>
                    <View className="flex-row items-center mt-4">
                        <Text className="text-red-500 font-black text-[10px] uppercase tracking-widest">Access Terminal</Text>
                        <MaterialCommunityIcons name="chevron-right" size={16} color="#EF4444" className="ml-1" />
                    </View>
                </View>
            </TouchableOpacity>
        </View>

        {/* Kids Activity Highlight Features - Prominent Card */}
        <View className="px-6 mb-6">
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('activityFeed')}
                className={`${theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-pink-50'} p-7 rounded-[40px] border-2 shadow-2xl shadow-pink-500/10 overflow-hidden`}
            >
                {/* Decorative background glow */}
                <View className="absolute -top-20 -right-20 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl" />
                
                <View className="flex-row items-center justify-between mb-5">
                    <View className="flex-row items-center">
                        <View className="bg-brand-pink p-4 rounded-2xl shadow-lg shadow-pink-500/40">
                            <MaterialCommunityIcons name="image-multiple" size={30} color="white" />
                        </View>
                        <View className="ml-4">
                            <Text className={`text-xl font-black ${colors.text} tracking-tight`}>Daily Highlights</Text>
                            <View className="flex-row items-center mt-1">
                                <View className="w-2 h-2 rounded-full bg-brand-pink mr-2" />
                                <Text className="text-brand-pink font-black text-[10px] uppercase tracking-widest">Social Feed</Text>
                            </View>
                        </View>
                    </View>
                    <View className="bg-brand-pink/20 px-4 py-2 rounded-full border border-brand-pink/10">
                        <MaterialCommunityIcons name="heart" size={16} color="#F472B6" />
                    </View>
                </View>

                <View className={`${theme === 'dark' ? 'bg-black/20' : 'bg-pink-50/50'} p-5 rounded-3xl border ${theme === 'dark' ? 'border-gray-800' : 'border-pink-100'}`}>
                    <Text className={`text-xs ${colors.textSecondary} font-bold leading-5 opacity-90`}>
                        Browse school activities, interact with parent posts, and build the school's digital scrapbook.
                    </Text>
                    <View className="flex-row items-center mt-4">
                        <Text className="text-brand-pink font-black text-[10px] uppercase tracking-widest">Open Highlights</Text>
                        <MaterialCommunityIcons name="chevron-right" size={16} color="#F472B6" className="ml-1" />
                    </View>
                </View>
            </TouchableOpacity>
        </View>

        {/* Quick Action Grid */}
        <View className="px-6 pb-20">
            <Text className={`text-[10px] font-black uppercase tracking-[3px] ${colors.textTertiary} mt-10 mb-4 ml-1`}>Admin Toolset</Text>
            <View className="flex-row flex-wrap justify-between">
            {quickActions.map((action) => (
                <TouchableOpacity
                key={action.id}
                className={`${colors.surface} p-5 rounded-[28px] shadow-sm mb-4 w-[48%] border ${colors.border}`}
                onPress={action.action}
                >
                <View className={`${action.color} p-3 rounded-2xl w-12 h-12 items-center justify-center mb-4 shadow-sm`}>
                    <MaterialCommunityIcons 
                        name={action.icon as any} 
                        size={24} 
                        color={(action.id === 'addUser' || action.id === 'backup') ? (theme === 'dark' ? '#1c1c14' : '#92400E') : 'white'} 
                    />
                </View>
                <Text className={`font-black ${colors.text} text-base mb-1`}>{action.title}</Text>
                <Text className={`text-xs ${colors.textSecondary} leading-4 font-bold`}>{action.subtitle}</Text>
                </TouchableOpacity>
            ))}
            </View>
        </View>
        </ScrollView>
    </View>
  );
}
