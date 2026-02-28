import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface AttendanceScreenProps {
  navigation: NavigationProps;
}

export default function AttendanceScreen({ navigation }: AttendanceScreenProps) {
  const { user } = useAuth();
  const { colors, theme } = useTheme();
  
  // Month picker state
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear] = useState(new Date().getFullYear());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate attendance data for the selected month
  const generateAttendanceData = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const attendanceRecords = [];
    const guardians = ['Father', 'Mother'];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth, day);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const isWeekend = dayName === 'Sat' || dayName === 'Sun';
      const isPast = date <= new Date();
      
      // Generate mock data
      let status = 'absent';
      let clockIn = null;
      let clockOut = null;
      let clockInBy = null;
      let clockOutBy = null;

      if (isPast && !isWeekend) {
        const random = Math.random();
        if (random > 0.1) { // 90% attendance
          status = 'present';
          clockIn = `0${8 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')} AM`;
          clockOut = `0${3 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')} PM`;
          clockInBy = guardians[Math.floor(Math.random() * guardians.length)];
          clockOutBy = guardians[Math.floor(Math.random() * guardians.length)];
        }
      } else if (isWeekend) {
        status = 'holiday';
      } else {
        status = 'upcoming';
      }

      attendanceRecords.push({
        day,
        dayName,
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        status,
        clockIn,
        clockOut,
        clockInBy,
        clockOutBy,
        isWeekend
      });
    }

    return attendanceRecords;
  };

  const attendanceData = generateAttendanceData();
  const presentDays = attendanceData.filter(d => d.status === 'present').length;
  const totalDays = attendanceData.filter(d => d.status !== 'holiday' && d.status !== 'upcoming').length;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-500';
      case 'absent': return 'bg-red-500';
      case 'holiday': return 'bg-gray-400';
      case 'upcoming': return 'bg-blue-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present': return 'Present';
      case 'absent': return 'Absent';
      case 'holiday': return 'Holiday';
      case 'upcoming': return 'Upcoming';
      default: return 'N/A';
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${colors.background}`}>
      {/* Header */}
      <View className="px-6 pt-4 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              className={`mb-4 ${colors.surface} w-12 h-12 rounded-2xl items-center justify-center border ${colors.border}`}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={28} color={theme === 'dark' ? '#FFF' : '#000'} />
            </TouchableOpacity>
            <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>My</Text>
            <Text className="text-2xl font-bold text-brand-pink">Attendance 📅</Text>
          </View>
          <View className="bg-blue-500 w-16 h-16 rounded-3xl items-center justify-center">
            <MaterialCommunityIcons name="calendar-check" size={32} color="white" />
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Attendance Summary */}
        <View className={`${colors.surface} rounded-[28px] p-6 mb-6 border ${colors.border}`}>
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className={`text-sm ${colors.textSecondary} uppercase font-bold tracking-wider`}>
                Attendance Rate
              </Text>
              <Text className={`text-5xl font-black ${colors.text} mt-2`}>{attendancePercentage}%</Text>
            </View>
            <View className="items-end">
              <View className="bg-green-500/20 px-4 py-2 rounded-full mb-2">
                <Text className="text-green-700 text-sm font-black">{presentDays} Days</Text>
              </View>
              <Text className={`text-xs ${colors.textTertiary}`}>Present</Text>
            </View>
          </View>
          
          <View className={`border-t ${colors.border} pt-4`}>
            <View className="flex-row justify-between">
              <View>
                <Text className={`text-xs ${colors.textSecondary}`}>Total Days</Text>
                <Text className={`text-lg font-black ${colors.text}`}>{totalDays}</Text>
              </View>
              <View>
                <Text className={`text-xs ${colors.textSecondary}`}>Absent</Text>
                <Text className={`text-lg font-black text-red-600`}>{totalDays - presentDays}</Text>
              </View>
              <View>
                <Text className={`text-xs ${colors.textSecondary}`}>Holidays</Text>
                <Text className={`text-lg font-black ${colors.text}`}>
                  {attendanceData.filter(d => d.status === 'holiday').length}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Month Picker */}
        <View className="mb-4">
          <Text className={`text-sm ${colors.textSecondary} font-bold mb-3 uppercase tracking-wider`}>
            Select Month
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {months.map((month, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedMonth(index)}
                className={`${selectedMonth === index ? 'bg-brand-pink' : colors.surface} px-5 py-3 rounded-2xl mr-3 border ${selectedMonth === index ? 'border-brand-pink' : colors.border}`}
                activeOpacity={0.7}
              >
                <Text className={`font-bold ${selectedMonth === index ? 'text-white' : colors.text}`}>
                  {month}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Attendance List */}
        <Text className={`text-xl font-black ${colors.text} mb-4 ml-1 uppercase tracking-widest opacity-60`}>
          Daily Records
        </Text>

        {attendanceData.map((record) => (
          <View 
            key={record.day} 
            className={`${colors.surface} rounded-2xl p-4 mb-3 border ${colors.border}`}
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className={`${getStatusColor(record.status)} w-12 h-12 rounded-full items-center justify-center mr-4`}>
                  <Text className="text-white font-black text-lg">{record.day}</Text>
                </View>
                <View>
                  <Text className={`font-black ${colors.text} text-base`}>{record.dayName}</Text>
                  <Text className={`text-xs ${colors.textSecondary}`}>{record.date}</Text>
                </View>
              </View>
              <View className={`${getStatusColor(record.status)}/20 px-3 py-1 rounded-full`}>
                <Text className={`${getStatusColor(record.status).replace('bg-', 'text-')} text-xs font-black uppercase`}>
                  {getStatusText(record.status)}
                </Text>
              </View>
            </View>

            {/* Clock In/Out Times */}
            {record.status === 'present' && (
              <View className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-3`}>
                <View className="flex-row justify-between">
                  <View className="flex-1 mr-2">
                    <View className="flex-row items-center mb-1">
                      <MaterialCommunityIcons name="clock-in" size={16} color="#10B981" />
                      <Text className={`text-xs ${colors.textSecondary} ml-2 uppercase font-bold`}>Clock In</Text>
                    </View>
                    <Text className={`text-lg font-black text-green-600`}>{record.clockIn}</Text>
                    <View className="flex-row items-center mt-2">
                      <MaterialCommunityIcons 
                        name={record.clockInBy === 'Father' ? 'account-tie' : 'account-heart'} 
                        size={14} 
                        color={record.clockInBy === 'Father' ? '#3B82F6' : '#EC4899'} 
                      />
                      <Text className={`text-xs ${colors.textTertiary} ml-1 font-bold`}>
                        by {record.clockInBy}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-1 ml-2">
                    <View className="flex-row items-center mb-1">
                      <MaterialCommunityIcons name="clock-out" size={16} color="#EC4899" />
                      <Text className={`text-xs ${colors.textSecondary} ml-2 uppercase font-bold`}>Clock Out</Text>
                    </View>
                    <Text className={`text-lg font-black text-pink-600`}>{record.clockOut}</Text>
                    <View className="flex-row items-center mt-2">
                      <MaterialCommunityIcons 
                        name={record.clockOutBy === 'Father' ? 'account-tie' : 'account-heart'} 
                        size={14} 
                        color={record.clockOutBy === 'Father' ? '#3B82F6' : '#EC4899'} 
                      />
                      <Text className={`text-xs ${colors.textTertiary} ml-1 font-bold`}>
                        by {record.clockOutBy}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
        ))}

        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
