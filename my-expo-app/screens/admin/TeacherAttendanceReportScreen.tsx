import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, Image, Dimensions, ActivityIndicator, FlatList, ScrollView, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
  const insets = useSafeAreaInsets();
  const isDark = appTheme === 'dark';
  
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
    <View className={`${isDark ? 'bg-[#25251d]' : 'bg-white'} p-5 rounded-[32px] mb-4 border ${isDark ? 'border-white/5' : 'border-gray-50 shadow-sm'} flex-row items-center justify-between`}>
      <View className="flex-row items-center">
        <View className={`${item.status === 'present' ? 'bg-indigo-500' : (item.status === 'absent' ? 'bg-red-500' : 'bg-gray-100 dark:bg-white/10')} w-12 h-12 rounded-[20px] items-center justify-center mr-4 shadow-sm`}>
          <Text className="text-white font-black text-lg">{item.day}</Text>
        </View>
        <View>
          <Text className={`font-black ${colors.text} text-sm tracking-tight`}>{item.dayName}, {item.date}</Text>
          <Text className={`text-[9px] font-black ${item.status === 'present' ? 'text-indigo-500' : (item.status === 'absent' ? 'text-red-500' : 'text-gray-400')} uppercase tracking-widest mt-0.5`}>
            {item.status.replace('_', ' ')}
          </Text>
        </View>
      </View>
      {item.status === 'present' && (
        <View className="items-end bg-indigo-500/5 px-3 py-1.5 rounded-xl border border-indigo-500/10">
          <View className="flex-row items-center mb-1">
            <MaterialCommunityIcons name="login" size={10} color="#6366F1" />
            <Text className="text-indigo-500 text-[10px] font-black uppercase ml-1.5">IN: {item.clockIn}</Text>
          </View>
          {item.clockOut && (
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="logout" size={10} color="#F472B6" />
              <Text className="text-pink-500 text-[10px] font-black uppercase ml-1.5">OUT: {item.clockOut}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* ── Visual Header Background ── */}
      <View className="absolute top-0 left-0 right-0 h-[350px] overflow-hidden">
        <LinearGradient
          colors={isDark ? ['#1e1b4b', colors.backgroundHex] : ['#EEF2FF', '#FFFFFF']}
          className="absolute inset-0"
        />
        <Image 
          source={require('../../assets/images/playschool_actions.png')} 
          style={{ width: '100%', height: '100%', opacity: isDark ? 0.05 : 0.1, transform: [{ scale: 1.2 }, { translateY: -20 }] }}
          resizeMode="cover"
        />
      </View>

      <View className="flex-1">
        {/* Header */}
        <View style={{ paddingTop: Math.max(insets.top, 20) }} className="px-6 pb-6">
          <View className="flex-row items-center justify-between">
            <View>
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                className={`w-12 h-12 rounded-2xl items-center justify-center border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-indigo-500/10 shadow-sm'}`}
              >
                <MaterialCommunityIcons name="arrow-left" size={24} color={isDark ? '#FFF' : '#6366F1'} />
              </TouchableOpacity>
              <Text className={`text-4xl font-black mt-6 tracking-tighter ${colors.text}`}>Teacher</Text>
              <Text className="text-2xl font-bold text-brand-pink mt-[-4px]">Attendance 📊</Text>
            </View>
            <View className="bg-indigo-600 w-20 h-20 rounded-[28px] items-center justify-center border-4 border-white shadow-2xl rotate-3 relative overflow-hidden">
               <MaterialCommunityIcons name="account-tie" size={40} color="white" />
            </View>
          </View>
        </View>

        {/* Teacher Dropdown Selector */}
        <View className="px-6 mb-8">
          <TouchableOpacity 
            onPress={() => setShowTeacherDropdown(true)}
            activeOpacity={0.8}
            className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'} p-6 rounded-[32px] border flex-row items-center justify-between shadow-sm`}
          >
            <View className="flex-row items-center">
              <View className="bg-indigo-500/10 w-12 h-12 rounded-[18px] items-center justify-center mr-4">
                <MaterialCommunityIcons name="account-search-outline" size={26} color="#6366F1" />
              </View>
              <View>
                <Text className={`text-[10px] font-black uppercase tracking-[2px] ${colors.textTertiary} mb-0.5`}>Academic Auditor</Text>
                <Text className={`text-xl font-black ${colors.text} tracking-tight`}>{selectedTeacher?.name || 'Select Lead Teacher'}</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-down" size={28} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {!selectedTeacher ? (
          <View className="flex-1 items-center justify-center px-10 pb-20">
            <View className="bg-indigo-500/5 p-12 rounded-[50px] mb-8">
              <MaterialCommunityIcons name="radar" size={80} color={isDark ? '#2e2e2c' : '#E5E7EB'} />
            </View>
            <Text className={`text-xl font-black ${colors.text} text-center`}>No Selection Made</Text>
            <Text className={`text-center mt-2 font-bold ${colors.textTertiary} uppercase tracking-widest text-[10px]`}>Choose a teacher to view their global attendance metrics</Text>
            <TouchableOpacity 
              onPress={() => setShowTeacherDropdown(true)}
              className="mt-8 bg-indigo-600 px-10 py-5 rounded-3xl shadow-xl shadow-indigo-600/20"
            >
              <Text className="text-white font-black uppercase tracking-[3px] text-xs">Search Teachers</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-1">
            {/* Stats Summary */}
            <View className="px-5 mb-8 flex-row">
              <View className={`${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-50'} py-6 rounded-[32px] flex-1 mx-1.5 items-center border shadow-sm`}>
                <Text className="text-2xl font-black text-indigo-500">{stats.present}</Text>
                <Text className={`text-[8px] font-black uppercase tracking-[3px] ${colors.textTertiary} mt-1.5`}>Present</Text>
              </View>
              <View className={`${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-50'} py-6 rounded-[32px] flex-1 mx-1.5 items-center border shadow-sm`}>
                <Text className="text-2xl font-black text-red-500">{stats.absent}</Text>
                <Text className={`text-[8px] font-black uppercase tracking-[3px] ${colors.textTertiary} mt-1.5`}>Absent</Text>
              </View>
              <View className={`${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-50'} py-6 rounded-[32px] flex-[1.4] mx-1.5 items-center border shadow-sm`}>
                <Text className={`text-xl font-black ${colors.text} tracking-tight`}>{MONTHS[selectedMonth].substring(0,3)} {selectedYear}</Text>
                <View className="flex-row gap-2 mt-1.5 items-center">
                  <TouchableOpacity onPress={() => setShowMonthSelector(true)}>
                    <Text className={`text-[8px] font-black uppercase tracking-[2px] text-indigo-500`}>Month</Text>
                  </TouchableOpacity>
                  <View className="w-1 h-1 rounded-full bg-gray-300" />
                  <TouchableOpacity onPress={() => setShowYearSelector(true)}>
                    <Text className={`text-[8px] font-black uppercase tracking-[2px] text-indigo-500`}>Year</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View className="px-8 mb-4 flex-row items-center justify-between">
              <Text className={`font-black ${colors.text} text-xl tracking-tighter uppercase opacity-60 tracking-[2px]`}>Activity Log</Text>
              {isLoading && <ActivityIndicator color="#6366F1" size="small" />}
            </View>

            <FlatList
              data={monthlyRecords}
              keyExtractor={(item) => item.day.toString()}
              renderItem={renderRecordItem}
              className="px-6"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
              ListEmptyComponent={
                <View className="items-center py-20 opacity-20">
                   <MaterialCommunityIcons name="calendar-blank-outline" size={60} color={colors.text} />
                </View>
              }
            />
          </View>
        )}

        {/* Teacher Selection Modal (Dropdown) */}
        <Modal visible={showTeacherDropdown} transparent animationType="slide" onRequestClose={() => setShowTeacherDropdown(false)}>
          <View className="flex-1 bg-black/60 justify-end">
            <TouchableOpacity className="flex-1" onPress={() => setShowTeacherDropdown(false)} />
            <View className={`${isDark ? 'bg-[#1c1c1a]' : 'bg-white'} rounded-t-[40px] p-8 max-h-[70%] shadow-2xl border-t border-white/5`}>
              <View className="flex-row items-center justify-between mb-8">
                <View>
                  <Text className={`text-2xl font-black ${colors.text} tracking-tighter`}>Select Teacher</Text>
                  <Text className="text-brand-pink text-[10px] font-black uppercase tracking-[3px] mt-1">Personnel Directory</Text>
                </View>
                <TouchableOpacity onPress={() => setShowTeacherDropdown(false)} className="bg-gray-100 dark:bg-white/10 w-10 h-10 rounded-full items-center justify-center">
                  <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={teachers}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                     onPress={() => { setSelectedTeacher(item); setShowTeacherDropdown(false); }}
                     activeOpacity={0.8}
                     className={`p-5 rounded-[24px] mb-3 flex-row items-center border-2 ${selectedTeacher?.id === item.id ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-600/30' : (isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-transparent')}`}
                  >
                    <View className={`w-12 h-12 rounded-[14px] items-center justify-center mr-4 ${selectedTeacher?.id === item.id ? 'bg-white/20' : 'bg-indigo-500/10'}`}>
                      <MaterialCommunityIcons name="account" size={28} color={selectedTeacher?.id === item.id ? 'white' : '#6366F1'} />
                    </View>
                    <View className="flex-1">
                      <Text className={`font-black text-lg tracking-tight ${selectedTeacher?.id === item.id ? 'text-white' : colors.text}`}>{item.name}</Text>
                      <Text className={`text-[10px] font-black uppercase tracking-[2px] ${selectedTeacher?.id === item.id ? 'text-white/60' : colors.textTertiary}`}>{item.category || 'Lead Teacher'}</Text>
                    </View>
                    {selectedTeacher?.id === item.id && <MaterialCommunityIcons name="check-circle" size={20} color="white" />}
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </Modal>

        {/* Month Selector Overlay */}
        {showMonthSelector && (
          <View className="absolute inset-0 z-50 justify-center items-center bg-black/80 px-6">
            <View className={`${isDark ? 'bg-[#1c1c1a]' : 'bg-white'} w-full rounded-[45px] p-8 shadow-2xl overflow-hidden border border-white/10`}>
              <View className="absolute top-0 right-0 opacity-5">
                 <MaterialCommunityIcons name="calendar-month" size={150} color={colors.text} />
              </View>
              <Text className={`text-2xl font-black ${colors.text} mb-8 text-center tracking-tighter`}>Select Month 📅</Text>
              <View className="flex-row flex-wrap justify-between">
                {MONTHS.map((m, i) => (
                  <TouchableOpacity 
                     key={m}
                     onPress={() => { setSelectedMonth(i); setShowMonthSelector(false); }}
                     className={`w-[48%] py-4 rounded-2xl mb-4 items-center border-2 ${selectedMonth === i ? 'border-indigo-600 bg-indigo-600' : (isDark ? 'border-white/5 bg-white/5' : 'border-gray-100 bg-gray-50')}`}
                  >
                    <Text className={`font-black text-xs uppercase tracking-widest ${selectedMonth === i ? 'text-white' : colors.text}`}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity 
                onPress={() => setShowMonthSelector(false)}
                className="mt-6 bg-gray-100 dark:bg-white/10 py-5 rounded-3xl items-center border border-transparent dark:border-white/5"
              >
                <Text className="font-black text-gray-500 dark:text-gray-400 uppercase tracking-[4px] text-[10px]">Acknowledge</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Year Selector Overlay */}
        {showYearSelector && (
          <View className="absolute inset-0 z-50 justify-center items-center bg-black/80 px-6">
            <View className={`${isDark ? 'bg-[#1c1c1a]' : 'bg-white'} w-full rounded-[45px] p-8 shadow-2xl overflow-hidden border border-white/10`}>
              <View className="absolute top-0 right-0 opacity-5">
                 <MaterialCommunityIcons name="calendar-range" size={150} color={colors.text} />
              </View>
              <Text className={`text-2xl font-black ${colors.text} mb-8 text-center tracking-tighter`}>Select Year 🔢</Text>
              <ScrollView className="max-h-[350px]" showsVerticalScrollIndicator={false}>
                <View className="flex-row flex-wrap justify-between px-1">
                  {YEARS.map((y) => (
                    <TouchableOpacity 
                      key={y}
                      onPress={() => { setSelectedYear(y); setShowYearSelector(false); }}
                      className={`w-[48%] py-4 rounded-2xl mb-4 items-center border-2 ${selectedYear === y ? 'border-indigo-600 bg-indigo-600' : (isDark ? 'border-white/5 bg-white/5' : 'border-gray-100 bg-gray-50')}`}
                    >
                      <Text className={`font-black text-sm ${selectedYear === y ? 'text-white' : colors.text}`}>{y}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <TouchableOpacity 
                onPress={() => setShowYearSelector(false)}
                className="mt-6 bg-gray-100 dark:bg-white/10 py-5 rounded-3xl items-center border border-transparent dark:border-white/5"
              >
                <Text className="font-black text-gray-500 dark:text-gray-400 uppercase tracking-[4px] text-[10px]">Acknowledge</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
