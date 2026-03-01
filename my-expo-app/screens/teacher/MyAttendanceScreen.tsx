import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface TeacherAttendanceScreenProps {
  navigation: NavigationProps;
}

interface BackendRecord {
  id: number;
  student_id: number;
  date: string;
  status: 'present' | 'absent' | 'late';
  in_time: string | null;
  out_time: string | null;
  user_role: string;
}

const { width } = Dimensions.get('window');

export default function TeacherAttendanceScreen({ navigation }: TeacherAttendanceScreenProps) {
  const { user } = useAuth();
  const { colors, theme } = useTheme();
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [records, setRecords] = useState<BackendRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchAttendance = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      // Fetch specifically for teachers
      const response = await api.get(`/attendance?student_id=${user.id}&user_role=teacher`);
      setRecords(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

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

      let derivedStatus = 'not_marked';
      if (record) {
        derivedStatus = record.status;
      } else if (dateObj.getTime() > today.getTime()) {
        derivedStatus = 'upcoming';
      } else if (dateObj.getTime() < today.getTime()) {
         derivedStatus = 'absent'; // If not marked and in past, assume absent or half day? Let's say absent for teachers
      } else {
        derivedStatus = 'pending';
      }

      result.push({
        day,
        dayName,
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
    const present = monthRecords.filter(r => r.status === 'present').length;
    const late = monthRecords.filter(r => r.status === 'late').length;
    return { present, late, total: monthRecords.length };
  }, [selectedMonth, selectedYear, records]);

  return (
    <SafeAreaView className={`flex-1 ${colors.background}`}>
      <View className="px-6 pt-4 pb-4 bg-brand-pink rounded-b-[40px] shadow-lg">
        <View className="flex-row items-center justify-between mb-8">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="bg-white/20 w-12 h-12 rounded-2xl items-center justify-center border border-white/30"
          >
            <MaterialCommunityIcons name="arrow-left" size={28} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-black uppercase tracking-widest">My Attendance</Text>
          <View className="w-12" />
        </View>

        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity 
            onPress={() => setShowMonthDropdown(!showMonthDropdown)}
            className="flex-row items-center bg-white/20 py-2 px-4 rounded-xl border border-white/30"
          >
            <Text className="text-white font-black">{months[selectedMonth]} {selectedYear}</Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="white" className="ml-2" />
          </TouchableOpacity>
          <View className="bg-white/20 p-3 rounded-2xl border border-white/30">
            <MaterialCommunityIcons name="calendar-account" size={28} color="white" />
          </View>
        </View>

        {/* Attendance Summary */}
        <View className="flex-row justify-between mb-2">
          <View className="bg-white/10 p-4 rounded-3xl items-center flex-1 mx-1 border border-white/10">
            <Text className="text-white text-2xl font-black">{stats.present}</Text>
            <Text className="text-white/60 text-[8px] font-black uppercase tracking-widest">Present</Text>
          </View>
          <View className="bg-white/10 p-4 rounded-3xl items-center flex-1 mx-1 border border-white/10">
            <Text className="text-white text-2xl font-black">{stats.late}</Text>
            <Text className="text-white/60 text-[8px] font-black uppercase tracking-widest">Late</Text>
          </View>
          <View className="bg-white/10 p-4 rounded-3xl items-center flex-1 mx-1 border border-white/10">
            <Text className="text-white text-2xl font-black">{stats.total}</Text>
            <Text className="text-white/60 text-[8px] font-black uppercase tracking-widest">Logged</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#F472B6" className="mt-20" />
        ) : (
          attendanceData.map((item, index) => (
            <View 
              key={index}
              className={`mb-4 p-5 rounded-[28px] border flex-row items-center justify-between ${theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}
            >
              <View className="flex-row items-center">
                <View className={`w-14 h-14 rounded-2xl items-center justify-center mr-4 ${
                  item.status === 'present' ? 'bg-green-500/10' : 
                  item.status === 'absent' ? 'bg-red-500/10' : 
                  item.status === 'late' ? 'bg-orange-500/10' : 'bg-gray-100'
                }`}>
                  <Text className={`font-black text-lg ${
                    item.status === 'present' ? 'text-green-600' : 
                    item.status === 'absent' ? 'text-red-600' : 
                    item.status === 'late' ? 'text-orange-600' : 'text-gray-400'
                  }`}>{item.day}</Text>
                  <Text className={`text-[8px] font-bold ${colors.textTertiary} uppercase`}>{item.dayName}</Text>
                </View>
                <View>
                  <Text className={`font-black ${colors.text}`}>{item.date}</Text>
                  <View className="flex-row items-center mt-1">
                    {item.inTime ? (
                      <View className="flex-row items-center mr-3">
                        <MaterialCommunityIcons name="clock-in" size={12} color="#10B981" />
                        <Text className="text-green-600 text-[10px] font-bold ml-1">{item.inTime}</Text>
                      </View>
                    ) : null}
                    {item.outTime ? (
                       <View className="flex-row items-center">
                        <MaterialCommunityIcons name="clock-out" size={12} color="#EF4444" />
                        <Text className="text-red-600 text-[10px] font-bold ml-1">{item.outTime}</Text>
                      </View>
                    ) : null}
                    {!item.inTime && !item.outTime && (
                       <Text className="text-gray-400 text-[10px] italic">No duty logged</Text>
                    )}
                  </View>
                </View>
              </View>

              <View className={`px-4 py-2 rounded-full ${
                item.status === 'present' ? 'bg-green-500' : 
                item.status === 'absent' ? 'bg-red-500' : 
                item.status === 'late' ? 'bg-orange-500' : 'bg-gray-200'
              }`}>
                <Text className="text-white text-[10px] font-black uppercase">
                  {item.status === 'not_marked' ? 'N/A' : item.status}
                </Text>
              </View>
            </View>
          ))
        )}
        <View className="h-10" />
      </ScrollView>

      {/* Month Dropdown Overlay */}
      {showMonthDropdown && (
        <View className="absolute inset-0 z-50 justify-center items-center bg-black/50 px-6">
          <View className={`${theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white'} w-full rounded-[40px] p-6 shadow-2xl overflow-hidden`}>
            <Text className={`text-xl font-black ${colors.text} mb-4 text-center`}>Select Month</Text>
            <View className="flex-row flex-wrap justify-between">
              {months.map((m, i) => (
                <TouchableOpacity 
                   key={m}
                   onPress={() => { setSelectedMonth(i); setShowMonthDropdown(false); }}
                   className={`w-[48%] py-4 rounded-2xl mb-4 items-center border ${selectedMonth === i ? 'bg-brand-pink border-brand-pink' : (theme === 'dark' ? 'border-gray-800' : 'border-gray-100')}`}
                >
                  <Text className={`font-black ${selectedMonth === i ? 'text-white' : colors.text}`}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity 
              onPress={() => setShowMonthDropdown(false)}
              className="mt-2 bg-gray-100 py-4 rounded-3xl items-center"
            >
              <Text className="font-black text-gray-500">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
