import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';


interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface TeacherQuickActionScreenProps {
  navigation: NavigationProps;
}

export default function TeacherQuickActionScreen({ navigation }: TeacherQuickActionScreenProps) {
  const { user } = useAuth();
  const { colors, theme } = useTheme();

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
                  Teacher
                </Text>
                <Text className="text-2xl font-black text-brand-pink mt-[-4px]">
                  Power Tools ⚡
                </Text>
                <View className="bg-brand-pink/20 self-start px-3 py-1.5 rounded-full mt-3 border border-brand-pink/10 shadow-sm">
                    <Text className="text-brand-pink text-[9px] font-black uppercase tracking-[2px]">Faculty Dashboard</Text>
                </View>
              </View>
              <View className="bg-brand-pink w-20 h-20 rounded-[28px] items-center justify-center shadow-2xl border-4 border-white rotate-3">
                <MaterialCommunityIcons name="flash" size={42} color="white" />
              </View>
            </View>
          </View>

          {/* Quick Action Grid */}
          <View className="px-6 mt-8 pb-20">
            <View className="flex-row items-center justify-between mb-8 px-1">
                <Text className={`text-xl font-black ${colors.text} tracking-tighter`}>Operations ⚙️</Text>
                <View className="bg-brand-pink/10 px-3 py-1 rounded-full">
                    <Text className="text-brand-pink text-[9px] font-black uppercase tracking-widest">Master Tools</Text>
                </View>
            </View>

            <View className="flex-row flex-wrap justify-between">
              {[
                { id: 'studentList', title: 'Student Info', subtitle: 'Global directory', icon: 'account-group', colors: ['#6366F1', '#4F46E5'], screen: 'studentList' },
                { id: 'myAttendance', title: 'Duty Log', subtitle: 'Work history', icon: 'calendar-account', colors: ['#4F46E5', '#4338CA'], screen: 'myAttendance' },
                { id: 'takeAttendance', title: 'Roll Call', subtitle: 'Mark presence', icon: 'calendar-check', colors: ['#F472B6', '#BE185D'], screen: 'takeAttendance' },
                { id: 'studentAttendanceReport', title: 'Analytics', subtitle: 'Student stats', icon: 'file-chart-outline', colors: ['#10B981', '#059669'], screen: 'studentAttendanceReport' },
                { id: 'postActivity', title: 'Social Feed', subtitle: 'Share moments', icon: 'camera-burst', colors: ['#FBBF24', '#D97706'], screen: 'postActivity' },
                { id: 'timetable', title: 'Timetable', subtitle: 'Daily schedule', icon: 'calendar-clock', colors: ['#6366F1', '#4F46E5'], screen: 'timetable' }
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
