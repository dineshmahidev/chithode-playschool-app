import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, Image, Dimensions, ActivityIndicator, FlatList, ScrollView, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface TeacherAttendanceReportScreenProps {
  navigation: NavigationProps;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];

export default function TeacherAttendanceReportScreen({ navigation }: TeacherAttendanceReportScreenProps) {
  const { colors, theme: appTheme } = useTheme();
  const { users } = useAuth();
  
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyRecords, setMonthlyRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);

  const teachers = useMemo(() => {
    return users.filter(u => u.role === 'teacher');
  }, [users]);

  const fetchMonthlyRecords = useCallback(async (teacherId: string) => {
    try {
      setIsLoading(true);
      const response = await api.get(`/attendance?student_id=${teacherId}&user_role=teacher`);
      const data = response.data;
      
      const attendanceMap: Record<string, any> = {};
      data.forEach((r: any) => {
        attendanceMap[r.date] = r;
      });

      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const records = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayRecord = attendanceMap[dateStr];
        const dateObj = new Date(selectedYear, selectedMonth, day);

        records.push({
          day,
          dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
          date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          status: dayRecord?.status || 'not_marked',
          clockIn: dayRecord?.in_time,
          clockOut: dayRecord?.out_time,
          remarks: dayRecord?.remarks
        });
      }
      setMonthlyRecords(records);
    } catch (error) {
      console.error('Error fetching teacher records:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (selectedTeacher) {
      fetchMonthlyRecords(selectedTeacher.id);
    }
  }, [selectedTeacher, selectedMonth, selectedYear, fetchMonthlyRecords]);

  const stats = useMemo(() => {
    const present = monthlyRecords.filter(r => r.status === 'present').length;
    const absent = monthlyRecords.filter(r => r.status === 'absent').length;
    const late = monthlyRecords.filter(r => r.status === 'late').length;
    return { present, absent, late, total: monthlyRecords.filter(r => r.status !== 'not_marked').length };
  }, [monthlyRecords]);

  const renderRecordItem = ({ item }: { item: any }) => (
    <View className={`${appTheme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white'} p-4 rounded-3xl mb-3 border ${appTheme === 'dark' ? 'border-gray-800' : 'border-gray-100'} flex-row items-center justify-between`}>
      <View className="flex-row items-center">
        <View className={`${item.status === 'present' ? 'bg-indigo-500' : (item.status === 'absent' ? 'bg-red-500' : 'bg-gray-200')} w-10 h-10 rounded-xl items-center justify-center mr-4`}>
          <Text className="text-white font-black">{item.day}</Text>
        </View>
        <View>
          <Text className={`font-black ${colors.text} text-sm`}>{item.dayName}, {item.date}</Text>
          <Text className={`text-[10px] font-bold ${item.status === 'present' ? 'text-indigo-500' : (item.status === 'absent' ? 'text-red-500' : 'text-gray-400')} uppercase`}>
            {item.status.replace('_', ' ')}
          </Text>
        </View>
      </View>
      {item.status === 'present' && (
        <View className="items-end">
          <Text className="text-indigo-500 text-[10px] font-bold">In: {item.clockIn}</Text>
          {item.clockOut && <Text className="text-pink-500 text-[10px] font-bold mt-1">Out: {item.clockOut}</Text>}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView className={`flex-1 ${colors.background}`}>
      {/* Header */}
      <View className="px-6 pt-4 pb-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="bg-indigo-600 w-12 h-12 rounded-2xl items-center justify-center shadow-lg"
          >
            <MaterialCommunityIcons name="arrow-left" size={28} color="white" />
          </TouchableOpacity>
          <Text className={`text-xl font-black ${colors.text} uppercase tracking-widest`}>Teacher Reports</Text>
          <View className="w-12" />
        </View>
      </View>

      {/* Teacher Dropdown Selector */}
      <View className="px-6 mb-6">
        <TouchableOpacity 
          onPress={() => setShowTeacherDropdown(true)}
          className={`${appTheme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white'} p-4 rounded-3xl border ${appTheme === 'dark' ? 'border-gray-800' : 'border-gray-100'} flex-row items-center justify-between shadow-sm`}
        >
          <View className="flex-row items-center">
            <View className="bg-indigo-500/10 w-10 h-10 rounded-xl items-center justify-center mr-3">
              <MaterialCommunityIcons name="account-tie" size={24} color="#6366F1" />
            </View>
            <View>
              <Text className={`text-[10px] font-black uppercase tracking-widest ${colors.textTertiary}`}>Selected Teacher</Text>
              <Text className={`text-base font-black ${colors.text}`}>{selectedTeacher?.name || 'Select a Teacher'}</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-down" size={24} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {!selectedTeacher ? (
        <View className="flex-1 items-center justify-center px-10">
          <MaterialCommunityIcons name="account-search-outline" size={80} color={colors.textTertiary} style={{ opacity: 0.3 }} />
          <Text className={`text-center mt-4 font-black ${colors.textTertiary} uppercase tracking-widest`}>Choose a teacher to view their detailed attendance records</Text>
          <TouchableOpacity 
            onPress={() => setShowTeacherDropdown(true)}
            className="mt-6 bg-indigo-600 px-8 py-4 rounded-2xl shadow-lg"
          >
            <Text className="text-white font-black uppercase tracking-widest">Select Teacher</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="flex-1">
          {/* Stats Summary */}
          <View className="px-5 mb-6 flex-row">
            <View className={`${appTheme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white'} py-5 rounded-3xl flex-1 mx-1 items-center border ${appTheme === 'dark' ? 'border-gray-800' : 'border-gray-100'} shadow-sm`}>
              <Text className="text-xl font-black text-indigo-500">{stats.present}</Text>
              <Text className={`text-[7px] font-black uppercase tracking-[2px] ${colors.textTertiary} mt-1`}>Present</Text>
            </View>
            <View className={`${appTheme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white'} py-5 rounded-3xl flex-1 mx-1 items-center border ${appTheme === 'dark' ? 'border-gray-800' : 'border-gray-100'} shadow-sm`}>
              <Text className="text-xl font-black text-red-500">{stats.absent}</Text>
              <Text className={`text-[7px] font-black uppercase tracking-[2px] ${colors.textTertiary} mt-1`}>Absent</Text>
            </View>
            <View className={`${appTheme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white'} py-5 rounded-3xl flex-[1.2] mx-1 items-center border ${appTheme === 'dark' ? 'border-gray-800' : 'border-gray-100'} shadow-sm`}>
              <Text className="text-xl font-black text-pink-500">{MONTHS[selectedMonth].substring(0,3)} {selectedYear}</Text>
              <View className="flex-row gap-2 mt-1">
                <TouchableOpacity onPress={() => setShowMonthSelector(true)}>
                  <Text className={`text-[8px] font-black uppercase tracking-widest text-indigo-500`}>Month</Text>
                </TouchableOpacity>
                <Text className="text-[8px] text-gray-300">|</Text>
                <TouchableOpacity onPress={() => setShowYearSelector(true)}>
                  <Text className={`text-[8px] font-black uppercase tracking-widest text-indigo-500`}>Year</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View className="px-6 mb-4 flex-row items-center justify-between">
            <Text className={`font-black ${colors.text} text-lg`}>{MONTHS[selectedMonth]} {selectedYear}</Text>
            {isLoading && <ActivityIndicator color="#6366F1" size="small" />}
          </View>

          <FlatList
            data={monthlyRecords}
            keyExtractor={(item) => item.day.toString()}
            renderItem={renderRecordItem}
            className="px-6"
            showsVerticalScrollIndicator={false}
            ListFooterComponent={<View className="h-10" />}
          />
        </View>
      )}

      {/* Teacher Selection Modal (Dropdown) */}
      <Modal visible={showTeacherDropdown} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
          <View className={`${appTheme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white'} rounded-t-[40px] p-6 max-h-[70%] shadow-2xl`}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className={`text-xl font-black ${colors.text}`}>Select Teacher</Text>
              <TouchableOpacity onPress={() => setShowTeacherDropdown(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={teachers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                   onPress={() => { setSelectedTeacher(item); setShowTeacherDropdown(false); }}
                   className={`p-4 rounded-2xl mb-2 flex-row items-center ${selectedTeacher?.id === item.id ? 'bg-indigo-600' : (appTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100')}`}
                >
                  <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${selectedTeacher?.id === item.id ? 'bg-white/20' : 'bg-indigo-500/10'}`}>
                    <MaterialCommunityIcons name="account" size={24} color={selectedTeacher?.id === item.id ? 'white' : '#6366F1'} />
                  </View>
                  <Text className={`font-black ${selectedTeacher?.id === item.id ? 'text-white' : colors.text}`}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Month Selector Overlay */}
      {showMonthSelector && (
        <View className="absolute inset-0 z-50 justify-center items-center bg-black/80 px-6">
          <View className={`${appTheme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white'} w-full rounded-[40px] p-6 shadow-2xl overflow-hidden`}>
            <Text className={`text-xl font-black ${colors.text} mb-6 text-center`}>Select Month 📅</Text>
            <View className="flex-row flex-wrap justify-between">
              {MONTHS.map((m, i) => (
                <TouchableOpacity 
                   key={m}
                   onPress={() => { setSelectedMonth(i); setShowMonthSelector(false); }}
                   className={`w-[48%] py-4 rounded-2xl mb-4 items-center border-2 ${selectedMonth === i ? 'border-indigo-600 bg-indigo-600' : (appTheme === 'dark' ? 'border-gray-800' : 'border-gray-100')}`}
                >
                  <Text className={`font-black ${selectedMonth === i ? 'text-white' : colors.text}`}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity 
              onPress={() => setShowMonthSelector(false)}
              className="mt-4 bg-gray-100 dark:bg-gray-800 py-4 rounded-3xl items-center"
            >
              <Text className="font-black text-gray-500 uppercase tracking-widest">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Year Selector Overlay */}
      {showYearSelector && (
        <View className="absolute inset-0 z-50 justify-center items-center bg-black/80 px-6">
          <View className={`${appTheme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white'} w-full rounded-[40px] p-6 shadow-2xl overflow-hidden`}>
            <Text className={`text-xl font-black ${colors.text} mb-6 text-center`}>Select Year 🔢</Text>
            <ScrollView className="max-h-[300px]" showsVerticalScrollIndicator={false}>
              <View className="flex-row flex-wrap justify-between px-1">
                {YEARS.map((y) => (
                  <TouchableOpacity 
                    key={y}
                    onPress={() => { setSelectedYear(y); setShowYearSelector(false); }}
                    className={`w-[48%] py-4 rounded-2xl mb-4 items-center border-2 ${selectedYear === y ? 'border-indigo-600 bg-indigo-600' : (appTheme === 'dark' ? 'border-gray-800' : 'border-gray-100')}`}
                  >
                    <Text className={`font-black ${selectedYear === y ? 'text-white' : colors.text}`}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity 
              onPress={() => setShowYearSelector(false)}
              className="mt-4 bg-gray-100 dark:bg-gray-800 py-4 rounded-3xl items-center"
            >
              <Text className="font-black text-gray-500 uppercase tracking-widest">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
