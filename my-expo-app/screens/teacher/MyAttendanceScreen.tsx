import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator, 
  Image, Dimensions, Modal, Animated, Easing, RefreshControl
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function MyAttendanceScreen({ navigation }: any) {
  const { user } = useAuth();
  const { colors, theme: appTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = appTheme === 'dark';
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  const fetchAttendance = useCallback(async (showIndicator = true) => {
    if (!user) return;
    try {
      if (showIndicator) setIsLoading(true);
      const response = await api.get(`/attendance?student_id=${user.id}&user_role=teacher`);
      setRecords(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      if (showIndicator) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchAttendance(false);
  }, [fetchAttendance]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);



  const attendanceData = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const result = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const recordMap: Record<string, any> = {};
    records.forEach(r => { recordMap[r.date] = r; });

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dateObj = new Date(selectedYear, selectedMonth, day);
      dateObj.setHours(0,0,0,0);
      const record = recordMap[dateStr];

      let derivedStatus = 'not_marked';
      if (record) derivedStatus = record.status;
      else if (dateObj.getTime() > today.getTime()) derivedStatus = 'upcoming';
      else if (dateObj.getTime() < today.getTime()) derivedStatus = 'absent';
      else derivedStatus = 'pending';

      result.push({
        day,
        dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
        date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: dateStr,
        status: derivedStatus,
        inTime: record?.in_time,
        outTime: record?.out_time
      });
    }
    return result;
  }, [selectedMonth, selectedYear, records]);

  const stats = useMemo(() => {
    const monthRecords = records.filter(r => {
      const [y, m] = r.date.split('-');
      return parseInt(y) === selectedYear && parseInt(m) === (selectedMonth + 1);
    });
    return {
      present: monthRecords.filter(r => r.status === 'present').length,
      late: monthRecords.filter(r => r.status === 'late').length,
      total: monthRecords.length
    };
  }, [selectedMonth, selectedYear, records]);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* ── Background Decoration ── */}
      <View className="absolute top-0 left-0 right-0 h-[450px] overflow-hidden">
        <LinearGradient
          colors={isDark ? ['#3d1d2b', colors.backgroundHex] : ['#FDF2F8', '#FFFFFF']}
          className="absolute inset-0"
        />
        <Image 
          source={require('../../assets/images/playschool_actions.png')} 
          style={{ width: '100%', height: '100%', opacity: isDark ? 0.05 : 0.1, transform: [{ scale: 1.5 }, { translateY: -40 }] }}
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
                className={`w-12 h-12 rounded-2xl items-center justify-center border mb-6 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-pink-100 shadow-sm'}`}
              >
                <MaterialCommunityIcons name="arrow-left" size={24} color={isDark ? '#FFF' : '#F472B6'} />
              </TouchableOpacity>
              <Text className={`text-4xl font-black tracking-tighter ${colors.text}`}>My Duty</Text>
              <Text className="text-2xl font-bold text-brand-pink mt-[-4px]">Attendance 🛡️</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setShowMonthDropdown(true)}
              className="bg-brand-pink w-20 h-20 rounded-[28px] items-center justify-center border-4 border-white shadow-2xl rotate-3 overflow-hidden"
            >
               <MaterialCommunityIcons name="calendar-account" size={40} color="white" />
            </TouchableOpacity>
          </View>

          {/* Stats Bar */}
          <View className="flex-row gap-3 mt-8">
             <View className={`${isDark ? 'bg-white/5' : 'bg-white'} flex-1 p-5 rounded-[28px] border ${isDark ? 'border-white/5' : 'border-gray-50 shadow-sm'} items-center`}>
                <Text className="text-green-500 text-2xl font-black">{stats.present}</Text>
                <Text className="text-gray-400 text-[8px] font-black uppercase tracking-widest mt-1">Present</Text>
             </View>
             <View className={`${isDark ? 'bg-white/5' : 'bg-white'} flex-1 p-5 rounded-[28px] border ${isDark ? 'border-white/5' : 'border-gray-50 shadow-sm'} items-center`}>
                <Text className="text-orange-500 text-2xl font-black">{stats.late}</Text>
                <Text className="text-gray-400 text-[8px] font-black uppercase tracking-widest mt-1">Late</Text>
             </View>
             <View className={`${isDark ? 'bg-white/5' : 'bg-white'} flex-1 p-5 rounded-[28px] border ${isDark ? 'border-white/5' : 'border-gray-50 shadow-sm'} items-center`}>
                <Text className={`text-2xl font-black ${colors.text}`}>{stats.total}</Text>
                <Text className="text-gray-400 text-[8px] font-black uppercase tracking-widest mt-1">Logged</Text>
             </View>
          </View>
        </View>

        <View className="flex-row items-center justify-between px-6 mb-4">
            <Text className={`font-black ${colors.text} text-lg`}>{MONTHS[selectedMonth]} {selectedYear}</Text>
            <View className="bg-pink-100 dark:bg-pink-500/10 px-3 py-1 rounded-full border border-pink-200 dark:border-pink-500/20">
               <Text className="text-brand-pink text-[9px] font-black uppercase tracking-widest">Monthly Pulse</Text>
            </View>
        </View>

        <ScrollView 
            className="flex-1 px-6" 
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl 
                    refreshing={isRefreshing} 
                    onRefresh={onRefresh}
                    colors={['#F472B6']}
                    tintColor={isDark ? '#FFF' : '#F472B6'}
                />
            }
        >
          {isLoading ? (
            <ActivityIndicator size="large" color="#F472B6" style={{ marginTop: 50 }} />
          ) : (
            attendanceData.map((item, index) => (
              <View 
                key={index}
                className={`mb-5 p-5 rounded-[36px] border flex-row items-center justify-between ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-50 shadow-sm'}`}
              >
                <View className="flex-row items-center">
                  <View className={`w-14 h-14 rounded-2xl items-center justify-center mr-4 ${
                    item.status === 'present' ? 'bg-green-500/10' : 
                    item.status === 'absent' ? 'bg-red-500/10' : 
                    item.status === 'late' ? 'bg-orange-500/10' : (isDark ? 'bg-white/5' : 'bg-gray-100')
                  }`}>
                    <Text className={`font-black text-xl ${
                      item.status === 'present' ? 'text-green-600' : 
                      item.status === 'absent' ? 'text-red-600' : 
                      item.status === 'late' ? 'text-orange-600' : (isDark ? 'text-gray-600' : 'text-gray-300')
                    }`}>{item.day}</Text>
                    <Text className={`text-[8px] font-black ${colors.textTertiary} uppercase`}>{item.dayName}</Text>
                  </View>
                  <View>
                    <Text className={`font-black ${colors.text} text-sm`}>{item.date}</Text>
                    <View className="flex-row items-center mt-1.5 gap-3">
                      {item.inTime && (
                        <View className="flex-row items-center">
                          <MaterialCommunityIcons name="clock-in" size={12} color="#10B981" />
                          <Text className="text-green-600 text-[10px] font-black ml-1">{item.inTime}</Text>
                        </View>
                      )}
                      {item.outTime && (
                        <View className="flex-row items-center">
                          <MaterialCommunityIcons name="clock-out" size={12} color="#EF4444" />
                          <Text className="text-red-600 text-[10px] font-black ml-1">{item.outTime}</Text>
                        </View>
                      )}
                      {!item.inTime && !item.outTime && (
                         <Text className="text-gray-400 text-[9px] font-bold italic">No records found</Text>
                      )}
                    </View>
                  </View>
                </View>

                <View className={`px-4 py-2 rounded-full ${
                  item.status === 'present' ? 'bg-green-500' : 
                  item.status === 'absent' ? 'bg-red-500' : 
                  item.status === 'late' ? 'bg-orange-500' : (isDark ? 'bg-white/10' : 'bg-gray-100')
                }`}>
                  <Text className={`text-white text-[9px] font-black uppercase tracking-widest ${item.status === 'not_marked' ? 'text-gray-400' : ''}`}>
                    {item.status === 'not_marked' ? 'N/A' : item.status}
                  </Text>
                </View>
              </View>
            ))
          )}
          <View className="h-32" />
        </ScrollView>
      </View>

      {/* Month Dropdown Overlay */}
      <Modal visible={showMonthDropdown} transparent animationType="fade">
        <View className="flex-1 bg-black/80 items-center justify-center px-6">
          <View className={`${isDark ? 'bg-[#1a1a18]' : 'bg-white'} w-full rounded-[45px] p-8 shadow-2xl border border-white/10`}>
            <Text className={`text-2xl font-black ${colors.text} mb-8 text-center tracking-tighter`}>Select Period</Text>
            <View className="flex-row flex-wrap justify-between">
              {MONTHS.map((m, i) => (
                <TouchableOpacity 
                   key={m}
                   onPress={() => { setSelectedMonth(i); setShowMonthDropdown(false); }}
                   className={`w-[48%] py-4 rounded-[24px] mb-4 items-center border-2 ${selectedMonth === i ? 'bg-brand-pink border-brand-pink' : (isDark ? 'border-white/5 bg-white/5' : 'border-gray-50 bg-gray-50')}`}
                >
                  <Text className={`font-black uppercase tracking-widest text-[10px] ${selectedMonth === i ? 'text-white' : colors.textSecondary}`}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity 
              onPress={() => setShowMonthDropdown(false)}
              className="mt-6 bg-gray-100 dark:bg-white/10 py-5 rounded-[24px] items-center"
            >
              <Text className="font-black text-gray-400 uppercase tracking-widest text-xs">Close Panel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
