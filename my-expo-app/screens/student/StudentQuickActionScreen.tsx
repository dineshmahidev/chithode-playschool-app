import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface StudentQuickActionScreenProps {
  navigation: NavigationProps;
}

export default function StudentQuickActionScreen({ navigation }: StudentQuickActionScreenProps) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return {
      time: `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      ampm,
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    };
  };

  const { time, ampm, date } = formatTime(currentTime);

  const quickActions = [
    {
      id: 'kidsFeed',
      title: 'Kids Activity',
      subtitle: 'View school activities',
      icon: 'image-multiple',
      color: 'bg-brand-yellow',
      iconColor: '#92400E',
      screen: 'activityFeed'
    },
    {
      id: 'timetable',
      title: 'Timetable',
      subtitle: 'Daily school schedule',
      icon: 'calendar-clock',
      color: 'bg-indigo-500',
      iconColor: '#FFFFFF',
      screen: 'timetable'
    },
    {
      id: 'liveCamera',
      title: 'Live Camera',
      subtitle: 'View classroom live feed',
      icon: 'video',
      color: 'bg-yellow-600',
      iconColor: '#FFFFFF',
      screen: 'liveCamera'
    },
    {
      id: 'homework',
      title: 'View Homework',
      subtitle: 'Check teacher assignments',
      icon: 'book-open-page-variant',
      color: 'bg-pink-600',
      iconColor: '#FFFFFF',
      screen: 'homework'
    },
    {
      id: 'emergency',
      title: 'Emergency Contact',
      subtitle: 'Call guardians quickly',
      icon: 'phone-alert',
      color: 'bg-red-500',
      iconColor: '#FFFFFF',
      screen: 'emergencyContact'
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
              Actions 🍬
            </Text>
            <Text className={`text-sm ${colors.textTertiary} font-bold mt-1 uppercase tracking-widest`}>
              Easy access to daily tasks
            </Text>
          </View>
          <View className="bg-brand-pink w-20 h-20 rounded-3xl items-center justify-center shadow-lg border-4 border-white rotate-3">
            <MaterialCommunityIcons name="flash" size={48} color="white" />
          </View>
        </View>

      </View>

      {/* My Fees & Attendance Section */}
      <View className="px-6 py-4">
        <Text className={`text-xl font-black ${colors.text} mb-4 ml-1`}>My Info 📊</Text>
        
        {/* My Fees */}
        <TouchableOpacity
          onPress={() => navigation.navigate('myFees')}
          className={`${colors.surface} rounded-[28px] p-5 mb-4 border ${colors.border}`}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="bg-green-500 w-16 h-16 rounded-full items-center justify-center mr-4">
                <MaterialCommunityIcons name="currency-inr" size={32} color="white" />
              </View>
              <View className="flex-1">
                <Text className={`font-black ${colors.text} text-lg mb-1`}>My Fees</Text>
                <Text className={`text-sm ${colors.textSecondary} mb-2`}>View payment details</Text>
                <View className="flex-row items-center">
                  <View className="bg-green-500/20 px-3 py-1 rounded-full">
                    <Text className="text-green-700 text-xs font-black">₹15,000 Paid</Text>
                  </View>
                </View>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={28} color={colors.textTertiary} />
          </View>
        </TouchableOpacity>

        {/* My Attendance */}
        <TouchableOpacity
          onPress={() => navigation.navigate('attendance')}
          className={`${colors.surface} rounded-[28px] p-5 mb-4 border ${colors.border}`}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="bg-blue-500 w-16 h-16 rounded-full items-center justify-center mr-4">
                <MaterialCommunityIcons name="calendar-check" size={32} color="white" />
              </View>
              <View className="flex-1">
                <Text className={`font-black ${colors.text} text-lg mb-1`}>My Attendance</Text>
                <Text className={`text-sm ${colors.textSecondary} mb-2`}>View attendance record</Text>
                <View className="flex-row items-center">
                  <View className="bg-blue-500/20 px-3 py-1 rounded-full">
                    <Text className="text-blue-700 text-xs font-black">94% Present</Text>
                  </View>
                </View>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={28} color={colors.textTertiary} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Quick Action Grid */}
      <View className="px-6">
        <Text className={`text-xl font-black ${colors.text} mb-4 ml-1`}>Daily Actions</Text>
        <View className="flex-row flex-wrap justify-between">
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              onPress={() => navigation.navigate(action.screen)}
              className={`${colors.surface} p-5 rounded-3xl shadow-sm mb-4 w-[48%] border border-yellow-50 active:scale-95`}
            >
              <View className={`${action.color} p-3 rounded-2xl w-12 h-12 items-center justify-center mb-4`}>
                <MaterialCommunityIcons name={action.icon as any} size={24} color={action.id === 'kidsFeed' ? '#92400E' : 'white'} />
              </View>
              <Text className={`font-bold ${colors.text} text-base mb-1`}>{action.title}</Text>
              <Text className={`text-xs ${colors.textSecondary} leading-4`}>{action.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
