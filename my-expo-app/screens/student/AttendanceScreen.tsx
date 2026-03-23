import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image, FlatList, Modal, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = [2023, 2024, 2025, 2026];

interface BackendRecord {
  id: number;
  student_id: number;
  date: string;
  status: 'present' | 'absent' | 'late' | 'holiday';
  in_time: string | null;
  out_time: string | null;
  dropped_by_type: string | null;
  picked_by_type: string | null;
  dropped_by_name: string | null;
  picked_by_name: string | null;
}

export default function AttendanceScreen({ navigation }: any) {
  const { user } = useAuth();
  const { colors, theme: appTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = appTheme === 'dark';

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [records, setRecords] = useState<BackendRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);

  const fetchAttendance = useCallback(async (showIndicator = true) => {
    if (!user?.id) return;
    try {
      if (showIndicator) setLoading(true);
      const res = await api.get(`/attendance?student_id=${user.id}&user_role=${user.role}`);
      setRecords(res.data);
    } catch (error) {
      console.error('Fetch attendance error:', error);
    } finally {
      if (showIndicator) setLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, user?.role]);

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
    
    const recordMap: Record<string, BackendRecord> = {};
    records.forEach(r => {
      recordMap[r.date] = r;
    });

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dateObj = new Date(selectedYear, selectedMonth, day);
      dateObj.setHours(0,0,0,0);
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const record = recordMap[dateStr];

      result.push({
        day,
        dayName,
        date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: dateStr,
        status: record?.status || 'not_marked',
        clockIn: record?.in_time,
        clockOut: record?.out_time,
        clockInBy: record?.dropped_by_name || record?.dropped_by_type,
        clockOutBy: record?.picked_by_name || record?.picked_by_type,
      });
    }

    return result.reverse();
  }, [records, selectedMonth, selectedYear]);

  const stats = useMemo(() => {
    const relevant = attendanceData.filter(d => 
        (d.status === 'present' || d.status === 'absent' || d.status === 'late')
    );
    const present = relevant.filter(d => d.status === 'present' || d.status === 'late').length;
    const total = relevant.length;
    return {
      present,
      absent: relevant.filter(d => d.status === 'absent').length,
      holiday: attendanceData.filter(d => d.status === 'holiday').length,
      percentage: total > 0 ? Math.round((present / total) * 100) : 0,
    };
  }, [attendanceData]);

  const renderItem = ({ item }: { item: any }) => (
    <View className={`${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-50 shadow-sm'} p-5 rounded-[32px] mb-4 border flex-row items-center justify-between`}>
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
          <View className="flex-row items-center">
            <MaterialCommunityIcons name="clock-check-outline" size={12} color="#6366F1" />
            <Text className="text-indigo-500 text-[10px] font-black ml-1.5">{item.clockIn || '--:--'}</Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* ── Background Decoration ── */}
      <View className="absolute top-0 left-0 right-0 h-[450px] overflow-hidden">
        <LinearGradient
          colors={isDark ? ['#1e1b4b', colors.backgroundHex] : ['#EEF2FF', colors.backgroundHex]}
          className="absolute inset-0"
        />
        <Image 
          source={require('../../assets/images/playschool_actions.png')} 
          style={{ width: '100%', height: '100%', opacity: isDark ? 0.08 : 0.15, transform: [{ scale: 1.6 }, { translateY: -20 }] }}
          resizeMode="cover"
        />
        {/* Fading Edge Mask */}
        <LinearGradient
          colors={['transparent', colors.backgroundHex]}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 150 }}
        />
      </View>

      <View className="flex-1">
        {/* Header */}
        <View style={{ paddingTop: Math.max(insets.top, 20) }} className="px-6 pb-6">
          <View className="flex-row items-center justify-between">
            <View>
               <TouchableOpacity 
                 onPress={() => navigation.goBack()}
                 className={`w-12 h-12 rounded-2xl items-center justify-center border mb-6 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-indigo-100 shadow-sm'}`}
               >
                 <MaterialCommunityIcons name="arrow-left" size={24} color={isDark ? '#FFF' : '#6366F1'} />
               </TouchableOpacity>
               <Text className={`text-4xl font-black tracking-tighter ${colors.text}`}>My</Text>
               <Text className="text-2xl font-bold text-brand-pink mt-[-4px]">Attendance ✍️</Text>
            </View>
            <View className="bg-indigo-600 w-20 h-20 rounded-[28px] items-center justify-center border-4 border-white shadow-2xl rotate-3 overflow-hidden">
               <MaterialCommunityIcons name="calendar-check" size={40} color="white" />
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View className="px-6 mb-8 flex-row gap-3">
          <View className={`${isDark ? 'bg-white/5' : 'bg-white'} flex-1 p-5 rounded-[32px] items-center shadow-sm border ${isDark ? 'border-white/5' : 'border-gray-50'}`}>
            <Text className="text-2xl font-black text-indigo-500">{stats.present}</Text>
            <Text className={`text-[8px] font-black uppercase tracking-[2px] ${colors.textTertiary} mt-1`}>Days In</Text>
          </View>
          <View className={`${isDark ? 'bg-white/5' : 'bg-white'} flex-1 p-5 rounded-[32px] items-center shadow-sm border ${isDark ? 'border-white/5' : 'border-gray-50'}`}>
            <Text className="text-2xl font-black text-red-500">{stats.absent}</Text>
            <Text className={`text-[8px] font-black uppercase tracking-[2px] ${colors.textTertiary} mt-1`}>Absent</Text>
          </View>
          <TouchableOpacity 
            onPress={() => setShowMonthSelector(true)}
            className={`${isDark ? 'bg-indigo-500/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-100'} flex-[1.4] p-5 rounded-[32px] items-center border shadow-sm`}
          >
            <Text className={`text-xl font-black ${colors.text} tracking-tighter`}>{MONTHS[selectedMonth].substring(0,3)} {selectedYear}</Text>
            <View className="flex-row items-center mt-1">
               <Text className="text-[8px] font-black uppercase tracking-[2px] text-indigo-500">Pick Period</Text>
               <MaterialCommunityIcons name="chevron-down" size={12} color="#6366F1" style={{ marginLeft: 4 }} />
            </View>
          </TouchableOpacity>
        </View>

        {/* List Header */}
        <View className="px-8 mb-4 flex-row items-center justify-between">
          <Text className={`font-black ${colors.text} text-xl tracking-tighter uppercase opacity-60 tracking-[2px]`}>Registry</Text>
          {loading && <ActivityIndicator color="#6366F1" size="small" />}
        </View>

        <FlatList
          data={attendanceData}
          keyExtractor={(item) => item.day.toString()}
          renderItem={renderItem}
          className="px-6"
          showsVerticalScrollIndicator={false}
          refreshControl={
              <RefreshControl 
                  refreshing={isRefreshing} 
                  onRefresh={onRefresh}
                  colors={['#6366F1']}
                  tintColor={isDark ? '#FFF' : '#6366F1'}
              />
          }
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="items-center py-20 opacity-20">
               <MaterialCommunityIcons name="calendar-blank-outline" size={80} color={colors.text} />
               <Text className={`font-black uppercase tracking-[5px] ${colors.text} mt-4 text-xs`}>No Records</Text>
            </View>
          }
        />
      </View>

      {/* Select Month Modal */}
      {showMonthSelector && (
        <View className="absolute inset-0 z-50 justify-center items-center bg-black/80 px-6">
          <View className={`${isDark ? 'bg-[#1c1c1a]' : 'bg-white'} w-full rounded-[45px] p-8 shadow-2xl border border-white/10`}>
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
               onPress={() => { setShowMonthSelector(false); setShowYearSelector(true); }}
               className="mt-4 p-4 items-center"
            >
               <Text className="text-indigo-500 font-black uppercase tracking-widest text-[10px]">Change Academic Year Instead</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setShowMonthSelector(false)}
              className="mt-4 bg-gray-100 dark:bg-white/10 py-5 rounded-3xl items-center"
            >
              <Text className="font-black text-gray-500 dark:text-gray-400 uppercase tracking-[4px] text-[10px]">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Select Year Modal */}
      {showYearSelector && (
        <View className="absolute inset-0 z-50 justify-center items-center bg-black/80 px-6">
          <View className={`${isDark ? 'bg-[#1c1c1a]' : 'bg-white'} w-full rounded-[45px] p-8 shadow-2xl border border-white/10`}>
            <Text className={`text-2xl font-black ${colors.text} mb-8 text-center tracking-tighter`}>Select Year 🔢</Text>
            <View className="flex-row flex-wrap justify-between">
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
            <TouchableOpacity 
              onPress={() => setShowYearSelector(false)}
              className="mt-6 bg-gray-100 dark:bg-white/10 py-5 rounded-3xl items-center"
            >
              <Text className="font-black text-gray-500 dark:text-gray-400 uppercase tracking-[4px] text-[10px]">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
