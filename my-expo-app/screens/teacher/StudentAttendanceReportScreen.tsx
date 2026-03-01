import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, Image, Dimensions, ActivityIndicator, FlatList, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface StudentAttendanceReportScreenProps {
  navigation: NavigationProps;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function StudentAttendanceReportScreen({ navigation }: StudentAttendanceReportScreenProps) {
  const { colors, theme: appTheme } = useTheme();
  const { users } = useAuth();
  
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyRecords, setMonthlyRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showMonthSelector, setShowMonthSelector] = useState(false);

  const students = useMemo(() => {
    return users.filter(u => u.role === 'student');
  }, [users]);

  const fetchMonthlyRecords = useCallback(async (studentId: string) => {
    try {
      setIsLoading(true);
      const response = await api.get(`/attendance?student_id=${studentId}&user_role=student`);
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
          clockInBy: dayRecord?.dropped_by_type,
          clockOutBy: dayRecord?.picked_by_type
        });
      }
      setMonthlyRecords(records);
    } catch (error) {
      console.error('Error fetching monthly records:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (selectedStudent) {
      fetchMonthlyRecords(selectedStudent.id);
    }
  }, [selectedStudent, selectedMonth, selectedYear, fetchMonthlyRecords]);

  const stats = useMemo(() => {
    const present = monthlyRecords.filter(r => r.status === 'present').length;
    const absent = monthlyRecords.filter(r => r.status === 'absent').length;
    const late = monthlyRecords.filter(r => r.status === 'late').length;
    return { present, absent, late, total: monthlyRecords.filter(r => r.status !== 'not_marked').length };
  }, [monthlyRecords]);

  const renderStudentItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      onPress={() => setSelectedStudent(item)}
      className={`${appTheme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white'} p-4 rounded-3xl mb-3 flex-row items-center border ${appTheme === 'dark' ? 'border-gray-800' : 'border-gray-100'} shadow-sm`}
    >
      <View className="bg-brand-pink/10 w-12 h-12 rounded-2xl items-center justify-center mr-4">
        <MaterialCommunityIcons name="account" size={24} color="#F472B6" />
      </View>
      <View className="flex-1">
        <Text className={`font-black ${colors.text}`}>{item.name}</Text>
        <Text className={`text-[10px] ${colors.textTertiary} font-bold uppercase`}>ID: {item.student_id || item.id}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  const renderRecordItem = ({ item }: { item: any }) => (
    <View className={`${appTheme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white'} p-4 rounded-3xl mb-3 border ${appTheme === 'dark' ? 'border-gray-800' : 'border-gray-100'} flex-row items-center justify-between`}>
      <View className="flex-row items-center">
        <View className={`${item.status === 'present' ? 'bg-green-500' : (item.status === 'absent' ? 'bg-red-500' : 'bg-gray-200')} w-10 h-10 rounded-xl items-center justify-center mr-4`}>
          <Text className="text-white font-black">{item.day}</Text>
        </View>
        <View>
          <Text className={`font-black ${colors.text} text-sm`}>{item.dayName}, {item.date}</Text>
          <Text className={`text-[10px] font-bold ${item.status === 'present' ? 'text-green-500' : (item.status === 'absent' ? 'text-red-500' : 'text-gray-400')} uppercase`}>
            {item.status.replace('_', ' ')}
          </Text>
        </View>
      </View>
      {item.status === 'present' && (
        <View className="items-end">
          <Text className="text-green-500 text-[10px] font-bold">In: {item.clockIn}</Text>
          {item.clockOut && <Text className="text-brand-pink text-[10px] font-bold mt-1">Out: {item.clockOut}</Text>}
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
            onPress={() => selectedStudent ? setSelectedStudent(null) : navigation.goBack()}
            className="bg-brand-pink w-12 h-12 rounded-2xl items-center justify-center shadow-lg"
          >
            <MaterialCommunityIcons name="arrow-left" size={28} color="white" />
          </TouchableOpacity>
          <Text className={`text-xl font-black ${colors.text} uppercase tracking-widest`}>Monthly Report</Text>
          <View className="w-12" />
        </View>
      </View>

      {!selectedStudent ? (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderStudentItem}
          className="px-6 pt-2"
          ListHeaderComponent={
            <View className="mb-6">
              <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>Student</Text>
              <Text className="text-2xl font-bold text-brand-pink">Roster 📋</Text>
              <Text className={`text-[10px] font-black uppercase tracking-[3px] ${colors.textTertiary} mt-4`}>Select student to view records</Text>
            </View>
          }
        />
      ) : (
        <View className="flex-1">
          {/* Student Info Card */}
          <View className="px-6 mb-6">
            <View className="bg-brand-pink p-6 rounded-[32px] shadow-xl flex-row items-center">
              <View className="bg-white/20 w-16 h-16 rounded-[24px] items-center justify-center mr-4">
                <MaterialCommunityIcons name="account-school" size={40} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-2xl font-black tracking-tight" numberOfLines={1}>{selectedStudent.name}</Text>
                <Text className="text-white/80 font-bold uppercase text-[10px] tracking-widest">Student Attendance</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setShowMonthSelector(true)}
                className="bg-white/20 p-3 rounded-2xl"
              >
                <MaterialCommunityIcons name="calendar-edit" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Summary */}
          <View className="px-6 mb-6 flex-row justify-between">
            <View className={`${appTheme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white'} p-4 rounded-3xl flex-1 mx-1 items-center border ${appTheme === 'dark' ? 'border-gray-800' : 'border-gray-100'} shadow-sm`}>
              <Text className="text-2xl font-black text-green-500">{stats.present}</Text>
              <Text className={`text-[8px] font-black uppercase tracking-widest ${colors.textTertiary}`}>Present</Text>
            </View>
            <View className={`${appTheme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white'} p-4 rounded-3xl flex-1 mx-1 items-center border ${appTheme === 'dark' ? 'border-gray-800' : 'border-gray-100'} shadow-sm`}>
              <Text className="text-2xl font-black text-red-500">{stats.absent}</Text>
              <Text className={`text-[8px] font-black uppercase tracking-widest ${colors.textTertiary}`}>Absent</Text>
            </View>
            <View className={`${appTheme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white'} p-4 rounded-3xl flex-1 mx-1 items-center border ${appTheme === 'dark' ? 'border-gray-800' : 'border-gray-100'} shadow-sm`}>
              <Text className="text-2xl font-black text-orange-500">{stats.late}</Text>
              <Text className={`text-[8px] font-black uppercase tracking-widest ${colors.textTertiary}`}>Late</Text>
            </View>
          </View>

          <View className="px-6 mb-4 flex-row items-center justify-between">
            <Text className={`font-black ${colors.text} text-lg`}>{MONTHS[selectedMonth]} {selectedYear}</Text>
            {isLoading && <ActivityIndicator color="#F472B6" size="small" />}
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

      {/* Month Selector Overlay */}
      {showMonthSelector && (
        <View className="absolute inset-0 z-50 justify-center items-center bg-black/80 px-6">
          <View className={`${appTheme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white'} w-full rounded-[40px] p-6 shadow-2xl overflow-hidden`}>
            <Text className={`text-xl font-black ${colors.text} mb-6 text-center`}>Select Reporting Month</Text>
            <View className="flex-row flex-wrap justify-between">
              {MONTHS.map((m, i) => (
                <TouchableOpacity 
                   key={m}
                   onPress={() => { setSelectedMonth(i); setShowMonthSelector(false); }}
                   className={`w-[48%] py-4 rounded-2xl mb-4 items-center border-2 ${selectedMonth === i ? 'border-brand-pink bg-brand-pink' : (appTheme === 'dark' ? 'border-gray-800' : 'border-gray-100')}`}
                >
                  <Text className={`font-black ${selectedMonth === i ? 'text-white' : colors.text}`}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity 
              onPress={() => setShowMonthSelector(false)}
              className="mt-4 bg-gray-100 py-4 rounded-3xl items-center"
            >
              <Text className="font-black text-gray-500 uppercase tracking-widest">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
