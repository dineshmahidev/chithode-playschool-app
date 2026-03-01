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

interface AttendanceScreenProps {
  navigation: NavigationProps;
}

interface BackendRecord {
  id: number;
  student_id: number;
  date: string;
  status: 'present' | 'absent' | 'late';
  in_time: string | null;
  out_time: string | null;
  dropped_by_type: string | null;
  picked_by_type: string | null;
  dropped_by_name: string | null;
  picked_by_name: string | null;
}

const { width } = Dimensions.get('window');

export default function AttendanceScreen({ navigation }: AttendanceScreenProps) {
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
      // Backend uses user.id as the student_id in attendance table
      const response = await api.get(`/attendance?student_id=${user.id}`);
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
    
    // Create a map for quick lookup
    const recordMap: Record<string, BackendRecord> = {};
    records.forEach(r => {
      recordMap[r.date] = r;
    });

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dateObj = new Date(selectedYear, selectedMonth, day);
      dateObj.setHours(0,0,0,0);
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
      const record = recordMap[dateStr];

      let derivedStatus = 'not_marked';
      if (record) {
        derivedStatus = record.status;
      } else if (isWeekend) {
        derivedStatus = 'holiday';
      } else if (dateObj.getTime() > today.getTime()) {
        derivedStatus = 'upcoming';
      } else if (dateObj.getTime() === today.getTime()) {
        derivedStatus = 'pending'; 
      }

      result.push({
        day,
        dayName,
        date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: dateStr,
        status: derivedStatus,
        clockIn: record?.in_time,
        clockOut: record?.out_time,
        clockInBy: record?.dropped_by_name || record?.dropped_by_type,
        clockOutBy: record?.picked_by_name || record?.picked_by_type,
        isWeekend
      });
    }

    return result;
  }, [records, selectedMonth, selectedYear]);

  const stats = useMemo(() => {
    // Only count recorded entries for stats to be "Real"
    const relevant = attendanceData.filter(d => 
        (d.status === 'present' || d.status === 'absent' || d.status === 'late')
    );
    const present = relevant.filter(d => d.status === 'present' || d.status === 'late').length;
    const total = relevant.length;
    return {
      present,
      absent: relevant.filter(d => d.status === 'absent').length,
      total,
      percentage: total > 0 ? Math.round((present / total) * 100) : 0,
      holidays: attendanceData.filter(d => d.status === 'holiday').length
    };
  }, [attendanceData]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'present': return { bg: 'bg-green-500', text: 'text-green-500', lightBg: 'bg-green-500/10', icon: 'check-circle' as const };
      case 'late': return { bg: 'bg-amber-500', text: 'text-amber-500', lightBg: 'bg-amber-500/10', icon: 'clock-alert' as const };
      case 'absent': return { bg: 'bg-red-500', text: 'text-red-500', lightBg: 'bg-red-500/10', icon: 'close-circle' as const };
      case 'holiday': return { bg: 'bg-gray-400', text: 'text-gray-400', lightBg: 'bg-gray-400/10', icon: 'island' as const };
      case 'pending': return { bg: 'bg-brand-yellow', text: 'text-brand-yellow', lightBg: 'bg-brand-yellow/10', icon: 'clock-outline' as const };
      case 'not_marked': return { bg: 'bg-gray-300', text: 'text-gray-400', lightBg: 'bg-gray-300/10', icon: 'minus-circle-outline' as const };
      default: return { bg: 'bg-blue-400', text: 'text-blue-400', lightBg: 'bg-blue-400/10', icon: 'calendar-clock' as const };
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${colors.background}`}>
      <View className="px-6 pt-4 pb-6">
        <View className="flex-row items-center justify-between">
          <View>
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              className={`mb-4 ${theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-gray-100'} w-12 h-12 rounded-2xl items-center justify-center border shadow-sm`}
            >
              <MaterialCommunityIcons name="arrow-left" size={28} color={theme === 'dark' ? '#FFF' : '#000'} />
            </TouchableOpacity>
            <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>My</Text>
            <Text className="text-2xl font-bold text-brand-pink tracking-tight">Attendance 📅</Text>
          </View>
          <View className="bg-brand-pink w-20 h-20 rounded-3xl items-center justify-center shadow-lg border-4 border-white rotate-3">
             <MaterialCommunityIcons name="calendar-check" size={48} color="white" />
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 mb-8">
            <View className={`${theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-gray-100'} rounded-[40px] p-8 border shadow-xl`}>
                <View className="flex-row items-center justify-between mb-8">
                    <View>
                        <Text className={`text-[10px] font-black uppercase tracking-[2px] ${colors.textTertiary} mb-1`}>Monthly Performance</Text>
                        <Text className={`text-5xl font-black ${colors.text}`}>{stats.percentage}%</Text>
                    </View>
                    <View className="w-20 h-20 rounded-full items-center justify-center border-8 border-brand-pink/10">
                        <View style={{ width: '100%', height: '100%', borderRadius: 100, borderLeftColor: '#F472B6', borderLeftWidth: 8, position: 'absolute', transform: [{ rotate: `${(stats.percentage / 100) * 360}deg` }] }} />
                        <MaterialCommunityIcons name="trophy" size={32} color="#F472B6" />
                    </View>
                </View>

                <View className="flex-row justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
                    <View className="items-center">
                        <Text className="text-green-500 font-black text-xl">{stats.present}</Text>
                        <Text className={`text-[8px] font-black uppercase tracking-widest ${colors.textTertiary}`}>Present</Text>
                    </View>
                    <View className="items-center">
                        <Text className="text-red-500 font-black text-xl">{stats.absent}</Text>
                        <Text className={`text-[8px] font-black uppercase tracking-widest ${colors.textTertiary}`}>Absent</Text>
                    </View>
                    <View className="items-center">
                        <Text className={`text-xl font-black ${colors.text}`}>{stats.holidays}</Text>
                        <Text className={`text-[8px] font-black uppercase tracking-widest ${colors.textTertiary}`}>Holidays</Text>
                    </View>
                </View>
            </View>
        </View>

        <View className="px-6 mb-8">
            <Text className={`text-[10px] font-black uppercase tracking-[2px] ${colors.textTertiary} mb-3`}>Report Period</Text>
            <TouchableOpacity 
                onPress={() => setShowMonthDropdown(!showMonthDropdown)}
                activeOpacity={0.8}
                className={`${theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-gray-100'} p-5 rounded-[28px] border shadow-sm flex-row items-center justify-between`}
            >
                <View className="flex-row items-center">
                    <View className="bg-brand-pink/10 p-2.5 rounded-xl mr-4">
                        <MaterialCommunityIcons name="calendar-month" size={24} color="#F472B6" />
                    </View>
                    <View>
                        <Text className={`text-lg font-black ${colors.text}`}>{months[selectedMonth]}</Text>
                        <Text className={`text-[10px] font-bold ${colors.textTertiary} uppercase tracking-widest`}>Academic Year {selectedYear}</Text>
                    </View>
                </View>
                <MaterialCommunityIcons 
                    name={showMonthDropdown ? "chevron-up" : "chevron-down"} 
                    size={28} 
                    color={theme === 'dark' ? '#4b4b4b' : '#E5E7EB'} 
                />
            </TouchableOpacity>

            {showMonthDropdown && (
                <View 
                    style={{ borderRadius: 35 }}
                    className={`mt-3 ${theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-gray-100'} border shadow-2xl p-4 flex-row flex-wrap justify-between`}
                >
                    {months.map((month, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => {
                                setSelectedMonth(index);
                                setShowMonthDropdown(false);
                            }}
                            className={`w-[31%] py-3 mb-2 rounded-[18px] items-center ${selectedMonth === index ? 'bg-brand-pink shadow-md shadow-brand-pink/20' : (theme === 'dark' ? 'bg-black/20' : 'bg-gray-50')}`}
                        >
                            <Text className={`text-[10px] font-black uppercase tracking-tighter ${selectedMonth === index ? 'text-white' : colors.textSecondary}`}>
                                {month.substring(0, 3)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity 
                        onPress={() => {
                            setSelectedMonth(new Date().getMonth());
                            setShowMonthDropdown(false);
                        }}
                        className={`w-full py-3 mt-2 rounded-[18px] items-center border border-dashed ${theme === 'dark' ? 'border-gray-800/50 bg-gray-900/40' : 'border-brand-pink/20 bg-brand-pink/5'}`}
                    >
                        <Text className="text-brand-pink font-black text-[10px] uppercase tracking-widest">Jump to Today</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>

        <View className="px-6 mb-10">
            <View className="flex-row items-center justify-between mb-6">
                <Text className={`text-xs font-black uppercase tracking-widest ${colors.textTertiary}`}>Daily Log</Text>
                {isLoading && <ActivityIndicator size="small" color="#F472B6" />}
            </View>

            {attendanceData.map((record) => {
                const style = getStatusStyle(record.status);
                return (
                    <View 
                        key={record.fullDate}
                        style={{ borderRadius: 32 }}
                        className={`${theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-gray-100'} p-5 mb-4 border shadow-sm`}
                    >
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center">
                                <View className={`${style.bg} w-14 h-14 rounded-[20px] items-center justify-center mr-4 shadow-sm`}>
                                    <Text className="text-white font-black text-xl">{record.day}</Text>
                                </View>
                                <View>
                                    <Text className={`font-black ${colors.text} text-base mb-0.5`}>{record.dayName}</Text>
                                    <View className="flex-row items-center">
                                        <MaterialCommunityIcons name={style.icon as any} size={12} color={style.text.replace('text-', '')} />
                                        <Text className={`text-[10px] font-black uppercase ml-1 ${style.text}`}>{record.status.replace('_', ' ')}</Text>
                                    </View>
                                </View>
                            </View>
                            
                            {record.clockIn && (
                                <View className="items-end">
                                    <View className="flex-row items-center mb-1">
                                        <MaterialCommunityIcons name="login" size={10} color="#10B981" />
                                        <Text className="text-[10px] font-black text-green-500 ml-1 uppercase">{record.clockIn}</Text>
                                    </View>
                                    {record.clockOut && (
                                        <View className="flex-row items-center">
                                            <MaterialCommunityIcons name="logout" size={10} color="#F472B6" />
                                            <Text className="text-[10px] font-black text-brand-pink ml-1 uppercase">{record.clockOut}</Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>

                        {record.clockIn && (
                            <View className={`mt-4 pt-4 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-50'} flex-row justify-between`}>
                                <View className="flex-row items-center">
                                    <MaterialCommunityIcons name="account-heart-outline" size={14} color={colors.textTertiary} />
                                    <Text className={`text-[9px] font-bold ${colors.textTertiary} ml-1 italic`}>Dropped: {record.clockInBy || 'Parent'}</Text>
                                </View>
                                {record.clockOut && (
                                    <View className="flex-row items-center">
                                        <MaterialCommunityIcons name="account-check-outline" size={14} color={colors.textTertiary} />
                                        <Text className={`text-[9px] font-bold ${colors.textTertiary} ml-1 italic`}>Picked: {record.clockOutBy || 'Parent'}</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                );
            })}
        </View>
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
