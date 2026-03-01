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

interface TeacherQuickActionScreenProps {
  navigation: NavigationProps;
}

export default function TeacherQuickActionScreen({ navigation }: TeacherQuickActionScreenProps) {
  const { user } = useAuth();
  const { colors } = useTheme();

  const quickActions = [
    {
      id: 'studentList',
      title: 'Student Info',
      subtitle: 'View student directory',
      icon: 'account-group',
      color: 'bg-blue-600',
      iconColor: '#FFFFFF',
      action: () => navigation.navigate('studentList')
    },
    {
      id: 'myAttendance',
      title: 'My Attendance',
      subtitle: 'View your duty history',
      icon: 'calendar-account',
      color: 'bg-indigo-600',
      iconColor: '#FFFFFF',
      action: () => navigation.navigate('myAttendance')
    },
    {
      id: 'takeAttendance',
      title: 'Take Attendance',
      subtitle: 'Mark student attendance',
      icon: 'calendar-check',
      color: 'bg-brand-pink',
      iconColor: '#FFFFFF',
      action: () => navigation.navigate('takeAttendance')
    },
    {
      id: 'studentAttendanceReport',
      title: 'Student Reports',
      subtitle: 'Monthly attendance logs',
      icon: 'file-chart',
      color: 'bg-green-600',
      iconColor: '#FFFFFF',
      action: () => navigation.navigate('studentAttendanceReport')
    },
    {
      id: 'postActivity',
      title: 'Post Activity',
      subtitle: 'Share class activities',
      icon: 'camera-plus',
      color: 'bg-yellow-600',
      iconColor: '#FFFFFF',
      action: () => navigation.navigate('postActivity')
    },
    {
      id: 'timetable',
      title: 'Timetable',
      subtitle: 'View daily schedule',
      icon: 'calendar-clock',
      color: 'bg-brand-yellow',
      iconColor: '#92400E',
      action: () => navigation.navigate('timetable')
    }
  ];

  return (
    <ScrollView className={`flex-1 ${colors.background}`} showsVerticalScrollIndicator={false}>
      {/* Attractive Header - Blends with status bar */}
      <View className="px-6 pt-12 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>
              Quick
            </Text>
            <Text className={`text-2xl font-bold text-brand-pink`}>
              Actions ⚡
            </Text>
            <Text className={`text-sm ${colors.textTertiary} font-bold mt-1 uppercase tracking-widest`}>
              Manage your classroom
            </Text>
          </View>
          <View className="bg-brand-pink w-20 h-20 rounded-3xl items-center justify-center shadow-lg border-4 border-white rotate-3">
            <MaterialCommunityIcons name="flash" size={48} color="white" />
          </View>
        </View>
      </View>

      {/* Quick Action Grid */}
      <View className="px-6 mt-6 pb-20">
        <Text className={`text-xl font-black ${colors.text} mb-4 ml-1 uppercase tracking-widest text-[10px]`}>Class Management</Text>
        <View className="flex-row flex-wrap justify-between">
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              className={`${colors.surface} p-5 rounded-[40px] shadow-sm mb-4 w-[48%] border ${colors.border}`}
              onPress={action.action}
            >
              <View className={`${action.color} p-3 rounded-2xl w-12 h-12 items-center justify-center mb-4 shadow-lg`}>
                <MaterialCommunityIcons name={action.icon as any} size={24} color={action.iconColor} />
              </View>
              <Text className={`font-black ${colors.text} text-base mb-1`}>{action.title}</Text>
              <Text className={`text-[10px] ${colors.textSecondary} uppercase font-bold tracking-tighter`}>{action.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
