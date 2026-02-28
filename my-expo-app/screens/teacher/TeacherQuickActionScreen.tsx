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
      id: 'postHomework',
      title: 'Post Homework',
      subtitle: 'Assign homework to students',
      icon: 'book-plus',
      color: 'bg-brand-yellow',
      iconColor: '#92400E',
      action: () => navigation.navigate('postHomework')
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
      id: 'postActivity',
      title: 'Post Activity',
      subtitle: 'Share class activities',
      icon: 'camera-plus',
      color: 'bg-yellow-600',
      iconColor: '#FFFFFF',
      action: () => navigation.navigate('postActivity')
    },
    {
      id: 'viewSubmissions',
      title: 'View Submissions',
      subtitle: 'Check homework submissions',
      icon: 'clipboard-check',
      color: 'bg-pink-600',
      iconColor: '#FFFFFF',
      action: () => navigation.navigate('viewSubmissions')
    },
    {
      id: 'classSchedule',
      title: 'Class Schedule',
      subtitle: 'View today\'s timetable',
      icon: 'calendar-clock',
      color: 'bg-brand-yellow',
      iconColor: '#92400E',
      action: () => navigation.navigate('classSchedule')
    },
    {
      id: 'parentCommunication',
      title: 'Parent Messages',
      subtitle: 'Send messages to parents',
      icon: 'message-text',
      color: 'bg-gray-600',
      iconColor: '#FFFFFF',
      action: () => navigation.navigate('parentMessages')
    }
  ];

  return (
    <ScrollView className={`flex-1 ${colors.background}`} showsVerticalScrollIndicator={false}>
      {/* Attractive Header - Blends with status bar */}
      <View className="px-6 pt-8 pb-4">
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

      {/* Today's Overview */}
      <View className="px-6 py-6">
        <View className={`${colors.surface} rounded-2xl p-5 shadow-sm border border-yellow-50`}>
          <Text className={`text-lg font-bold ${colors.text} mb-4`}>Today's Overview</Text>
          <View className="flex-row justify-between items-center">
            <View className="flex-1 mr-2">
              <Text className={`text-xs ${colors.textSecondary} uppercase font-bold tracking-wider`}>Present</Text>
              <Text className={`text-xl font-black text-yellow-600 mt-1`}>22/25</Text>
            </View>
            <View className="flex-1 mx-1">
              <Text className={`text-xs ${colors.textSecondary} uppercase font-bold tracking-wider`}>Activities</Text>
              <Text className={`text-xl font-black text-brand-pink mt-1`}>3</Text>
            </View>
            <View className="flex-1 ml-2">
              <Text className={`text-xs ${colors.textSecondary} uppercase font-bold tracking-wider`}>Homework</Text>
              <Text className={`text-xl font-black text-gray-700 mt-1`}>1</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Action Grid */}
      <View className="px-6">
        <Text className={`text-xl font-black ${colors.text} mb-4 ml-1`}>Class Management</Text>
        <View className="flex-row flex-wrap justify-between">
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              className={`${colors.surface} p-5 rounded-3xl shadow-sm mb-4 w-[48%] border border-yellow-50`}
              onPress={action.action}
            >
              <View className={`${action.color} p-3 rounded-2xl w-12 h-12 items-center justify-center mb-4`}>
                <MaterialCommunityIcons name={action.icon as any} size={24} color={action.id === 'postHomework' || action.id === 'classSchedule' ? '#92400E' : 'white'} />
              </View>
              <Text className={`font-bold ${colors.text} text-base mb-1`}>{action.title}</Text>
              <Text className={`text-xs ${colors.textSecondary} leading-4`}>{action.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Next Class */}
        <View className="mt-8 mb-8">
          <Text className={`text-xl font-bold ${colors.text} mb-4`}>Upcoming Session</Text>
          <View className={`${colors.surface} rounded-3xl p-5 shadow-sm border border-yellow-50`}>
            <View className="flex-row items-center">
              <View className="bg-brand-yellow/20 p-4 rounded-2xl mr-4">
                <MaterialCommunityIcons name="clock-outline" size={30} color="#B45309" />
              </View>
              <View className="flex-1">
                <Text className={`text-lg font-black ${colors.text}`}>Mathematics</Text>
                <Text className={`text-sm ${colors.textSecondary}`}>Room 201 • 2:00 PM</Text>
                <View className="bg-brand-pink/10 px-3 py-1 rounded-full self-start mt-2">
                  <Text className="text-brand-pink text-[10px] font-black uppercase">In 30 mins</Text>
                </View>
              </View>
              <TouchableOpacity className="bg-brand-pink px-4 py-2 rounded-xl shadow-md">
                <Text className="text-white font-bold">Start</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
