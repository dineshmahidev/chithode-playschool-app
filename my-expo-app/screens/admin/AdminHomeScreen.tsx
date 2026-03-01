import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface AdminHomeScreenProps {
  navigation: NavigationProps;
}

export default function AdminHomeScreen({ navigation }: AdminHomeScreenProps) {
  const { user, users, fees, updateAvatar, announcements } = useAuth();
  const { colors, theme } = useTheme();

  const studentCount = useMemo(() => users.filter(u => u.role === 'student').length, [users]);
  const teacherCount = useMemo(() => users.filter(u => u.role === 'teacher').length, [users]);

  // Use actual fee records for the status card
  const feeStats = useMemo(() => {
    return {
       total: fees.length,
       paid: fees.filter(f => f.status === 'paid').length
    };
  }, [fees]);

  const totalFeeCount = feeStats.total;
  const paidFeeCount  = feeStats.paid;

  const [presentToday, setPresentToday] = useState<number>(0);
  const [attendanceLoaded, setAttendanceLoaded] = useState(false);
  const [todaySchedule, setTodaySchedule] = useState<any>(null);

  const getTodayDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const todayStr = getTodayDateString();

  const fetchTodayAttendance = useCallback(async () => {
    try {
      const res = await api.get('/attendance');
      const todayPresent = res.data.filter(
        (r: any) => r.date === todayStr && r.status === 'present'
      ).length;
      setPresentToday(todayPresent);
    } catch {
      // silently fail
    } finally {
      setAttendanceLoaded(true);
    }
  }, [todayStr]);

  const fetchTimetable = useCallback(async () => {
    try {
      const response = await api.get('/timetable');
      const todayNum = new Date().getDay();
      const dayIndex = todayNum === 0 ? 6 : todayNum - 1;
      const filtered = response.data.filter((s: any) => s.day === dayIndex);
      
      if (filtered.length > 0) {
        const timeToMinutes = (timeStr: string) => {
          const [time, period] = timeStr.split(' ');
          let [hours, minutes] = time.split(':').map(Number);
          if (period === 'PM' && hours !== 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;
          return hours * 60 + minutes;
        };
        const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
        const sorted = filtered.sort((a: any, b: any) => timeToMinutes(a.time) - timeToMinutes(b.time));
        const currentOrNext = sorted.find((s: any) => timeToMinutes(s.time) >= nowMinutes - 30);
        setTodaySchedule(currentOrNext || null);
      } else {
        setTodaySchedule(null);
      }
    } catch (err) {
      console.error('Fetch Timetable Error:', err);
    }
  }, []);

  useEffect(() => { 
    fetchTodayAttendance(); 
    fetchTimetable();
  }, [fetchTodayAttendance, fetchTimetable]);

  const handleQuickAction = (screen: string | null) => {
    if (screen) {
      navigation.navigate(screen as any);
    } else {
      Alert.alert('Coming Soon', 'This feature will be available in the next update! 🚀');
    }
  };

  const renderAnnouncements = (list: any[], sectionTitle: string, hint: string) => {
    const screenWidth = Dimensions.get('window').width;
    const cardWidth = screenWidth - 100;

    return (
      <View className="mt-4">
        <View className="flex-row items-center justify-between mb-4 px-6">
          <Text className={`text-xl font-black ${colors.text}`}>{sectionTitle} 📢</Text>
          {list.length > 1 && (
            <Text className={`text-xs font-bold ${colors.textTertiary}`}>Swipe for more</Text>
          )}
        </View>
        
        {list.length > 0 ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 50, paddingBottom: 24 }}
            decelerationRate="fast"
            snapToInterval={cardWidth + 16} // cardWidth + gap
          >
            {list.map((item, index) => (
              <TouchableOpacity 
                key={item.id}
                activeOpacity={0.9}
                style={{ width: cardWidth, aspectRatio: 16 / 9 }}
                className={`${index === list.length - 1 ? '' : 'mr-4'} bg-brand-pink relative overflow-hidden rounded-[32px] border-2 ${theme === 'dark' ? 'border-gray-800' : 'border-white'} shadow-xl`}
                onPress={() => Alert.alert(item.title, item.content)}
              >
                {item.image ? (
                  <Image 
                    source={{ uri: item.image }} 
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center bg-brand-pink/20">
                    <MaterialCommunityIcons name="bullhorn-outline" size={64} color="#F472B6" />
                  </View>
                )}
                
                <View className="absolute inset-0 bg-black/30 justify-end p-6">
                  <View className="bg-white/20 self-start px-3 py-1 rounded-full mb-2 flex-row items-center">
                    <MaterialCommunityIcons name="calendar-edit" size={12} color="white" style={{ marginRight: 4 }} />
                    <Text className="text-white text-[10px] font-black uppercase tracking-widest">{item.date}</Text>
                  </View>
                  <Text className="text-white text-2xl font-black tracking-tighter" numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <MaterialCommunityIcons name="account-circle-outline" size={14} color="white" />
                    <Text className="text-white/80 text-xs font-bold ml-1">{item.author || 'Admin'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View className="items-center px-6 pb-8">
            <View 
              style={{ 
                width: cardWidth, 
                aspectRatio: 16 / 10,
                elevation: 10
              }}
              className={`${theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-brand-pink/30'} items-center justify-center rounded-[32px] border-2 border-dashed shadow-xl`}
            >
              <View className="items-center justify-center">
                <View className={`${theme === 'dark' ? 'bg-pink-500/10' : 'bg-brand-pink/10'} w-24 h-24 rounded-full items-center justify-center mb-5 border ${theme === 'dark' ? 'border-pink-500/20' : 'border-brand-pink/20'}`}>
                  <MaterialCommunityIcons name="bullhorn-variant-outline" size={48} color="#F472B6" />
                </View>
                <Text className={`text-xl font-black ${colors.text} tracking-tighter`}>All caught up! ✨</Text>
                <Text className={`mt-2 font-black text-brand-pink/40 uppercase text-[9px] tracking-[4px]`}>No current {hint}</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View 
        className={`flex-1 ${theme === 'dark' ? 'bg-[#121212]' : 'bg-white'}`}
        style={{ backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF' }}
    >
        <ScrollView
        className={`flex-1 ${theme === 'dark' ? '' : 'bg-white'}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        >
        {/* ── Header ── */}
        <View className="px-6 pt-8 pb-4">
            <View className="flex-row items-center justify-between">
            <View className="flex-1">
                <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>Welcome,</Text>
                <Text className="text-2xl font-bold text-brand-pink">{user?.name || 'Admin'}! 👑</Text>
            </View>
            <TouchableOpacity
                className={`w-20 h-20 rounded-3xl items-center justify-center shadow-lg border-4 ${theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-brand-yellow border-white'} rotate-3 relative overflow-hidden`}
                onPress={updateAvatar}
            >
                {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
                ) : (
                <MaterialCommunityIcons name="shield-account" size={42} color={theme === 'dark' ? '#F472B6' : '#92400E'} />
                )}
                <View className="absolute -bottom-1 -right-1 bg-brand-pink p-1.5 rounded-lg border-2 border-white">
                <MaterialCommunityIcons name="camera" size={14} color="white" />
                </View>
            </TouchableOpacity>
            </View>
        </View>

        {/* ── Quick Stats ── */}
        <View className="px-6 py-4">
            <View className="flex-row justify-between">
            <TouchableOpacity
                className={`${theme === 'dark' ? 'bg-[#1e1e1e]' : colors.surface} p-5 rounded-[28px] shadow-sm flex-1 mr-2 border ${theme === 'dark' ? 'border-gray-800' : colors.border}`}
                onPress={() => handleQuickAction('userManagement')}
                activeOpacity={0.75}
            >
                <View className="flex-row items-center justify-between mb-2">
                <Text className={`text-4xl font-black ${theme === 'dark' ? 'text-amber-500' : 'text-yellow-600'} font-mono`}>{studentCount}</Text>
                <View className={`${theme === 'dark' ? 'bg-amber-500/10' : 'bg-yellow-100/50'} p-2 rounded-2xl`}>
                    <MaterialCommunityIcons name="school" size={28} color={theme === 'dark' ? '#FBBF24' : '#B45309'} />
                </View>
                </View>
                <Text className={`${colors.textSecondary} text-[10px] font-black uppercase tracking-widest`}>Students</Text>
            </TouchableOpacity>
            <TouchableOpacity
                className={`${theme === 'dark' ? 'bg-[#1e1e1e]' : colors.surface} p-5 rounded-[28px] shadow-sm flex-1 ml-2 border ${theme === 'dark' ? 'border-gray-800' : colors.border}`}
                onPress={() => handleQuickAction('userManagement')}
                activeOpacity={0.75}
            >
                <View className="flex-row items-center justify-between mb-2">
                <Text className="text-4xl font-black text-brand-pink font-mono">{teacherCount}</Text>
                <View className={`${theme === 'dark' ? 'bg-pink-500/10' : 'bg-pink-100/50'} p-2 rounded-2xl`}>
                    <MaterialCommunityIcons name="account-tie" size={28} color="#F472B6" />
                </View>
                </View>
                <Text className={`${colors.textSecondary} text-[10px] font-black uppercase tracking-widest`}>Staff</Text>
            </TouchableOpacity>
            </View>
        </View>

        {/* ── Today's Schedule ── */}
        <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => navigation.navigate('timetable')}
            className={`mx-6 mt-4 ${todaySchedule ? todaySchedule.color || 'bg-brand-pink' : 'bg-gray-400'} rounded-[32px] p-6 shadow-xl relative overflow-hidden`}
        >
            <View className="flex-row items-center justify-between relative z-10">
                <View className="flex-1 mr-4">
                    <View className="flex-row items-center mb-1">
                        <MaterialCommunityIcons name="calendar-clock" size={16} color="white" />
                        <Text className="text-white font-black uppercase text-[10px] tracking-widest ml-2 opacity-80">
                            {todaySchedule ? "Next Session" : "Today's Schedule"}
                        </Text>
                    </View>
                    <Text className="text-white text-2xl font-black mt-1" numberOfLines={1}>
                        {todaySchedule ? todaySchedule.activity : "No sessions mentioned"}
                    </Text>
                    {todaySchedule && (
                        <View className="flex-row items-center mt-2 bg-white/20 self-start px-3 py-1 rounded-full">
                            <MaterialCommunityIcons name="clock-outline" size={14} color="white" />
                            <Text className="text-white text-xs font-bold ml-1.5" numberOfLines={1}>
                                {todaySchedule.time} • {todaySchedule.room || 'Classroom'}
                            </Text>
                        </View>
                    )}
                </View>
                <View className="bg-white/30 w-16 h-16 rounded-[24px] items-center justify-center">
                    <MaterialCommunityIcons 
                        name={todaySchedule ? (todaySchedule.icon || "book-open-variant") : "calendar-blank"} 
                        size={36} 
                        color="white" 
                    />
                </View>
            </View>
            {/* Background pattern */}
            <View className="absolute -bottom-4 -right-4 opacity-10">
                <MaterialCommunityIcons name="school" size={120} color="white" />
            </View>
        </TouchableOpacity>

        {(announcements?.length ?? 0) > 0 && renderAnnouncements(announcements, 'Announcements', 'announcements')}

        {/* ── Core Management ── */}
        <View className="px-6 py-6">
            <Text className={`text-lg font-black ${colors.text} mb-4 uppercase tracking-widest text-[10px]`}>Core Management</Text>
            <View className="flex-row justify-between">
                {[
                    { label: 'Finance', icon: 'cash-register', color: '#10B981', bg: 'bg-green-100/10', screen: 'incomeExpense' },
                    { label: 'Fees', icon: 'cash-multiple', color: '#EAB308', bg: 'bg-brand-yellow/10', screen: 'feesManagement' },
                    { label: 'Activity', icon: 'camera-plus-outline', color: '#F472B6', bg: 'bg-brand-pink/10', screen: 'postActivity' }
                ].map((action, idx) => (
                    <TouchableOpacity
                        key={idx}
                        className={`${theme === 'dark' ? 'bg-[#1e1e1e]' : colors.surface} py-5 px-2 rounded-3xl shadow-sm items-center w-[31%] border ${theme === 'dark' ? 'border-gray-800' : colors.border}`}
                        onPress={() => handleQuickAction(action.screen)}
                    >
                        <View className={`${action.bg} p-3 rounded-2xl mb-2`}>
                            <MaterialCommunityIcons name={action.icon as any} size={26} color={action.color} />
                        </View>
                        <Text className={`text-[11px] font-black ${colors.text} text-center uppercase`}>{action.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>

        {/* ── School Overview ── */}
        <View className="px-6 pb-12">
            <Text className={`text-xl font-black ${colors.text} mb-6 tracking-tight`}>School Overview 📊</Text>

            <View className="flex-row justify-between">
                {/* Fees Overview Card */}
                <TouchableOpacity 
                    activeOpacity={0.8}
                    onPress={() => handleQuickAction('feesManagement')}
                    className={`flex-1 rounded-[32px] border mr-2 ${theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-brand-yellow/20'} overflow-hidden shadow-sm`}
                >
                    <View className="h-1.5 bg-brand-yellow" />
                    <View className="p-5">
                        <View className={`w-12 h-12 rounded-2xl items-center justify-center mb-4 ${theme === 'dark' ? 'bg-brand-yellow/10' : 'bg-brand-yellow/10'}`}>
                            <MaterialCommunityIcons name="cash-check" size={26} color="#EAB308" />
                        </View>
                        <Text 
                            style={{ color: '#EAB308' }}
                            className="text-[10px] font-black uppercase tracking-widest mb-2"
                        >
                            Monthly Fees
                        </Text>
                        <View className="flex-row items-end mb-1">
                            <Text style={{ color: '#EAB308' }} className="text-3xl font-black">{paidFeeCount}</Text>
                            <Text className={`text-sm font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-1 ml-1`}>/ {totalFeeCount}</Text>
                        </View>
                        <Text className={`text-[10px] font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} mb-4`}>Fees Collected</Text>
                        <View className={`h-1.5 rounded-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-brand-yellow/10'} overflow-hidden`}>
                            <View style={{ width: `${totalFeeCount > 0 ? (paidFeeCount / totalFeeCount) * 100 : 0}%` }} className="h-full bg-brand-yellow rounded-full" />
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Attendance Card */}
                <TouchableOpacity 
                    activeOpacity={0.8}
                    onPress={() => handleQuickAction('takeAttendance')}
                    className={`flex-1 rounded-[32px] border ml-2 ${theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-pink-100'} overflow-hidden shadow-sm`}
                >
                    <View className="h-1.5 bg-brand-pink" />
                    <View className="p-5">
                        <View className={`w-12 h-12 rounded-2xl items-center justify-center mb-4 ${theme === 'dark' ? 'bg-pink-500/10' : 'bg-pink-50'}`}>
                            <MaterialCommunityIcons name="account-check" size={26} color="#F472B6" />
                        </View>
                        <Text 
                            style={{ color: '#F472B6' }}
                            className="text-[10px] font-black uppercase tracking-widest mb-2"
                        >
                            Attendance
                        </Text>
                        <View className="flex-row items-end mb-1">
                            <Text style={{ color: '#F472B6' }} className="text-3xl font-black">{presentToday}</Text>
                            <Text className={`text-sm font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-1 ml-1`}>/ {studentCount}</Text>
                        </View>
                        <Text className={`text-[10px] font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} mb-4`}>Present Today</Text>
                        <View className={`h-1.5 rounded-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-pink-100/50'} overflow-hidden`}>
                            <View style={{ width: `${studentCount > 0 ? (presentToday / studentCount) * 100 : 0}%` }} className="h-full bg-brand-pink rounded-full" />
                        </View>
                    </View>
                </TouchableOpacity>
            </View>
        </View>

        <View className="px-6">
            <TouchableOpacity
                onPress={() => handleQuickAction('reports')}
                className="bg-brand-yellow py-5 rounded-[32px] items-center shadow-lg active:scale-95 mb-10 border-4 border-white"
            >
                <View className="flex-row items-center">
                    <MaterialCommunityIcons name="view-dashboard" size={24} color="#92400E" />
                    <Text className="text-amber-900 font-black text-lg ml-2 uppercase tracking-tight">Full Analytics</Text>
                </View>
            </TouchableOpacity>
        </View>

        {(announcements?.length ?? 0) === 0 && renderAnnouncements(announcements ?? [], 'Announcements', 'announcements')}
        </ScrollView>
    </View>
  );
}
