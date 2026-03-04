import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
      const studentIds = users.filter(u => u.role === 'student').map(u => u.id.toString());
      const res = await api.get('/attendance');
      const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      const todayPresent = data.filter(
        (r: any) => 
          r.date === todayStr && 
          r.status === 'present' &&
          studentIds.includes(r.student_id?.toString())
      ).length;
      setPresentToday(todayPresent);
    } catch {
      // silently fail
    } finally {
      setAttendanceLoaded(true);
    }
  }, [todayStr, users]);

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
    const cardWidth = screenWidth - 48;

    return (
      <View className="mt-8">
        <View className="flex-row items-center justify-between mb-5 px-1">
          <Text className={`text-xl font-black ${colors.text} uppercase tracking-widest opacity-60 ml-6`}>{sectionTitle} 📢</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('announcements')}
            className="bg-brand-pink/10 px-4 py-1.5 rounded-full border border-brand-pink/20"
          >
             <Text className="text-brand-pink text-[9px] font-black uppercase tracking-widest">See All</Text>
          </TouchableOpacity>
        </View>
        
        {list.length > 0 ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
            snapToInterval={cardWidth + 12}
            decelerationRate="fast"
          >
            {list.map((item) => (
              <TouchableOpacity 
                key={item.id}
                activeOpacity={0.9}
                style={{ width: cardWidth, aspectRatio: 16 / 9 }}
                className="mr-3 bg-brand-pink relative overflow-hidden rounded-[40px] border-2 border-white shadow-2xl"
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
                    <MaterialCommunityIcons name="bullhorn-outline" size={80} color="#F472B6" />
                  </View>
                )}
                
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  className="absolute inset-x-0 bottom-0 h-40 justify-end p-8"
                >
                  <View className="bg-white/20 self-start px-3 py-1.5 rounded-xl mb-3 flex-row items-center border border-white/10">
                    <MaterialCommunityIcons name="calendar-clock" size={14} color="white" />
                    <Text className="text-white text-[10px] font-black uppercase tracking-widest ml-2">{item.date}</Text>
                  </View>
                  <Text className="text-white text-3xl font-black tracking-tighter" numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View className="flex-row items-center mt-2">
                    <View className="bg-brand-yellow w-5 h-5 rounded-full items-center justify-center mr-2">
                        <MaterialCommunityIcons name="account-tie" size={12} color="#92400E" />
                    </View>
                    <Text className="text-white/80 text-[11px] font-black uppercase tracking-[2px]">{item.author || 'Admin Headquarters'}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View className="px-6">
            <LinearGradient
              colors={theme === 'dark' ? ['#1e1e1e', '#1a1a14'] : ['#FFF5F8', '#FFFFFF']}
              style={{ width: '100%', aspectRatio: 16 / 9 }}
              className="items-center justify-center rounded-[40px] border-2 border-brand-pink/10 border-dashed"
            >
              <View className="bg-brand-pink/10 w-20 h-20 rounded-full items-center justify-center mb-4">
                <MaterialCommunityIcons name="bullhorn-variant-outline" size={42} color="#F472B6" />
              </View>
              <Text className={`text-xl font-black ${colors.text} tracking-tighter`}>Mission Complete! ✨</Text>
              <Text className="mt-1 font-black text-brand-pink/40 uppercase text-[8px] tracking-[3px]">No Active {hint}</Text>
            </LinearGradient>
          </View>
        )}
      </View>
    );
  };

  return (
    <View 
        className={`flex-1 ${theme === 'dark' ? 'bg-[#1c1c14]' : 'bg-white'}`}
        style={{ backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF' }}
    >
        <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        >
        {/* ── Background Gradient & 3D Illustration ── */}
        <View className="absolute top-0 left-0 right-0 h-[500px] overflow-hidden">
            <LinearGradient
                colors={[theme === 'dark' ? '#1e1b4b' : '#FDF2F8', theme === 'dark' ? '#1c1c14' : '#FFFFFF']}
                className="absolute inset-0"
            />
            <Image 
                source={require('../../assets/images/playschool_3d.png')} 
                style={{ width: '100%', height: '100%', opacity: theme === 'dark' ? 0.15 : 0.25, transform: [{ scale: 1.3 }, { translateY: -30 }] }}
                resizeMode="cover"
            />
            {/* Soft glow overlap */}
            <View className="absolute -top-20 -left-20 w-80 h-80 bg-brand-pink/10 rounded-full blur-3xl" />
            
            {/* Smooth transition gradient to content */}
            <LinearGradient
                colors={['transparent', theme === 'dark' ? '#1c1c14' : '#FFFFFF']}
                className="absolute bottom-0 left-0 right-0 h-60"
            />
        </View>

        {/* ── Modern Header ── */}
        <View className="px-6 pt-12 pb-6">
            <View className="flex-row items-center justify-between">
                <View className="flex-1">
                    <Text className={`text-xl font-black ${colors.textSecondary} uppercase tracking-widest`}>
                        Admin Hub 🔐
                    </Text>
                    <Text className={`text-4xl font-black ${colors.text} tracking-tighter mt-1`}>
                        {user?.name || 'Administrator'}
                    </Text>
                    <View className="bg-brand-pink/20 self-start px-4 py-1.5 rounded-full mt-3 border border-brand-pink/10 shadow-sm">
                        <Text className="text-brand-pink text-[10px] font-black uppercase tracking-[2px]">Master Control Panel</Text>
                    </View>
                </View>

                <TouchableOpacity
                    className="bg-brand-yellow w-20 h-20 rounded-[32px] items-center justify-center shadow-2xl border-4 border-white rotate-3 relative overflow-hidden"
                    onPress={updateAvatar}
                >
                    {user?.avatar ? (
                    <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                    <MaterialCommunityIcons name="shield-crown-outline" size={36} color="#92400E" />
                    )}
                    <View className="absolute -bottom-1 -right-1 bg-brand-pink p-1.5 rounded-xl border-2 border-white">
                        <MaterialCommunityIcons name="camera" size={12} color="white" />
                    </View>
                </TouchableOpacity>
            </View>
        </View>

        {/* ── Premium Quick Stats ── */}
        <View className="px-6 py-4 flex-row justify-between">
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleQuickAction('userManagement')}
                className="w-[48%] rounded-[40px] overflow-hidden shadow-2xl"
                style={{ elevation: 15 }}
            >
                <LinearGradient
                    colors={theme === 'dark' ? ['#1e3a8a', '#1e1b4b'] : ['#FBBF24', '#D97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="p-6 h-40 justify-between"
                >
                    <View className="flex-row justify-between items-start">
                        <View className="bg-white/20 p-2.5 rounded-2xl">
                            <MaterialCommunityIcons name="school-outline" size={28} color="white" />
                        </View>
                        <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest">Enrollment</Text>
                    </View>
                    <View>
                        <Text className="text-white text-5xl font-black font-mono tracking-tighter">{studentCount}</Text>
                        <Text className="text-white/80 text-[11px] font-black uppercase mt-1 tracking-widest">Total Students</Text>
                    </View>
                    {/* Pattern */}
                    <View className="absolute -bottom-6 -right-6 opacity-10">
                         <MaterialCommunityIcons name="book-multiple" size={100} color="white" />
                    </View>
                </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleQuickAction('userManagement')}
                className="w-[48%] rounded-[40px] overflow-hidden shadow-2xl"
                style={{ elevation: 15 }}
            >
                <LinearGradient
                    colors={theme === 'dark' ? ['#4c1d95', '#1e1b4b'] : ['#F472B6', '#BE185D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="p-6 h-40 justify-between"
                >
                    <View className="flex-row justify-between items-start">
                        <View className="bg-white/20 p-2.5 rounded-2xl">
                            <MaterialCommunityIcons name="account-group" size={28} color="white" />
                        </View>
                        <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest">Faculty</Text>
                    </View>
                    <View>
                        <Text className="text-white text-5xl font-black font-mono tracking-tighter">{teacherCount}</Text>
                        <Text className="text-white/80 text-[11px] font-black uppercase mt-1 tracking-widest">Active Staff</Text>
                    </View>
                    {/* Pattern */}
                    <View className="absolute -bottom-6 -right-6 opacity-10">
                         <MaterialCommunityIcons name="face-man-profile" size={100} color="white" />
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </View>

        {/* ── School Overview ── */}
        <View className="px-6 mt-6">
            <View className="flex-row items-center justify-between mb-4 px-1">
                <Text className={`text-xl font-black tracking-tighter ${colors.text}`}>School Metrics 📊</Text>
                <View className="bg-brand-pink/10 px-3 py-1 rounded-full">
                    <Text className="text-brand-pink text-[9px] font-black uppercase tracking-widest">Real-time</Text>
                </View>
            </View>

            <View className="flex-row justify-between">
                <TouchableOpacity 
                   activeOpacity={0.9}
                   onPress={() => handleQuickAction('feesManagement')}
                   style={{ elevation: 15 }}
                   className={`w-[48%] rounded-[40px] overflow-hidden shadow-2xl ${theme === 'dark' ? 'bg-[#1a1a18] border-gray-800' : 'bg-white border-brand-pink/5'}`}
                >
                    <LinearGradient
                        colors={theme === 'dark' ? ['#831843', '#1c1c14'] : ['#FFFFFF', '#FFF5F7']}
                        className="p-6"
                    >
                        <View className="flex-row items-center justify-between mb-6">
                            <View className="bg-brand-pink/10 dark:bg-brand-pink/20 w-11 h-11 rounded-2xl items-center justify-center">
                                <MaterialCommunityIcons name="currency-inr" size={24} color="#F472B6" />
                            </View>
                            <Text className="text-brand-pink font-black text-[8px] uppercase tracking-widest">Fees</Text>
                        </View>
                        <View className="flex-row items-center">
                            <Text className={`text-3xl font-black ${colors.text}`}>{paidFeeCount}</Text>
                            <Text className="text-gray-400 text-[12px] font-bold mx-1 opacity-40">/</Text>
                            <Text className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-gray-300' : 'text-gray-400'}`}>{totalFeeCount}</Text>
                        </View>
                        <Text className="text-gray-400 text-[9px] font-bold uppercase opacity-60 tracking-tighter">Collected</Text>
                        
                        <View className="mt-5 h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <View 
                                style={{ width: `${totalFeeCount > 0 ? (paidFeeCount / totalFeeCount) * 100 : 0}%`, height: '100%' }} 
                                className="bg-brand-pink rounded-full shadow-sm" 
                            />
                        </View>
                        <Text className="text-brand-pink font-black text-[10px] mt-3 uppercase tracking-tighter self-end">{Math.round(totalFeeCount > 0 ? (paidFeeCount / totalFeeCount) * 100 : 0)}% Clear</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                   activeOpacity={0.9}
                   onPress={() => handleQuickAction('takeAttendance')}
                   style={{ elevation: 15 }}
                   className={`w-[48%] rounded-[40px] overflow-hidden shadow-2xl ${theme === 'dark' ? 'bg-[#1a1a18] border-gray-800' : 'bg-white border-brand-pink/5'}`}
                >
                    <LinearGradient
                        colors={theme === 'dark' ? ['#1e40af', '#1c1c14'] : ['#FFFFFF', '#EFF6FF']}
                        className="p-6"
                    >
                        <View className="flex-row items-center justify-between mb-6">
                            <View className="bg-blue-100 dark:bg-blue-500/20 w-11 h-11 rounded-2xl items-center justify-center">
                                <MaterialCommunityIcons name="account-check-outline" size={24} color="#3B82F6" />
                            </View>
                            <Text className="text-blue-500 font-black text-[8px] uppercase tracking-widest">Presence</Text>
                        </View>
                        <View className="flex-row items-center">
                             <Text className={`text-3xl font-black ${colors.text}`}>{presentToday}</Text>
                             <Text className="text-gray-400 text-[12px] font-bold mx-1 opacity-40">/</Text>
                             <Text className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-gray-300' : 'text-gray-400'}`}>{studentCount}</Text>
                        </View>
                        <Text className="text-gray-400 text-[9px] font-bold uppercase opacity-60 tracking-tighter">Attending Today</Text>
                        
                        <View className="mt-5 h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <View 
                                style={{ width: `${studentCount > 0 ? (presentToday / studentCount) * 100 : 0}%`, height: '100%' }} 
                                className="bg-blue-500 rounded-full shadow-sm" 
                            />
                        </View>
                        <Text className="text-blue-500 font-black text-[10px] mt-3 uppercase tracking-tighter self-end">{Math.round(studentCount > 0 ? (presentToday / studentCount) * 100 : 100)}% Present</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>

        {announcements.length > 0 && renderAnnouncements(announcements, 'Central Notices', 'announcements')}

        {/* ── Modern Management Portal ── */}
        <View className="px-6 py-8">
            <View className="flex-row items-center justify-between mb-6 px-1">
                <Text className={`text-xl font-black ${colors.text} tracking-tighter`}>Main Operations ⚙️</Text>
                <View className="bg-brand-pink/10 px-3 py-1 rounded-full">
                    <Text className="text-brand-pink text-[9px] font-black uppercase font-bold tracking-widest">Master Controls</Text>
                </View>
            </View>

            <View className="flex-row justify-between mb-4">
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => handleQuickAction('incomeExpense')}
                    className="w-[48%] rounded-[36px] overflow-hidden shadow-xl"
                    style={{ elevation: 12 }}
                >
                    <LinearGradient
                        colors={theme === 'dark' ? ['#064e3b', '#022c22'] : ['#10B981', '#059669']}
                        className="p-6 h-48 justify-between"
                    >
                        <View className="bg-white/20 self-start p-3.5 rounded-2xl shadow-sm">
                            <MaterialCommunityIcons name="finance" size={28} color="white" />
                        </View>
                        <View>
                            <Text className="text-white text-2xl font-black tracking-tighter">Finance Hub</Text>
                            <Text className="text-white/80 text-[10px] font-bold mt-1 uppercase tracking-widest">Accounts & Budget</Text>
                        </View>
                        <View className="absolute -bottom-4 -right-4 opacity-10">
                            <MaterialCommunityIcons name="leaf" size={100} color="white" />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => handleQuickAction('feesManagement')}
                    className="w-[48%] rounded-[36px] overflow-hidden shadow-xl"
                    style={{ elevation: 12 }}
                >
                    <LinearGradient
                        colors={theme === 'dark' ? ['#1e40af', '#1e1b4b'] : ['#3B82F6', '#2563EB']}
                        className="p-6 h-48 justify-between"
                    >
                        <View className="bg-white/20 self-start p-3.5 rounded-2xl shadow-sm">
                            <MaterialCommunityIcons name="cash-register" size={28} color="white" />
                        </View>
                        <View>
                            <Text className="text-white text-2xl font-black tracking-tighter">Fee Portal</Text>
                            <Text className="text-white/80 text-[10px] font-bold mt-1 uppercase tracking-widest">Collections Info</Text>
                        </View>
                        <View className="absolute -bottom-4 -right-4 opacity-10">
                            <MaterialCommunityIcons name="credit-card-chip" size={100} color="white" />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleQuickAction('postActivity')}
                className="rounded-[36px] overflow-hidden shadow-xl"
                style={{ elevation: 12 }}
            >
                <LinearGradient
                    colors={theme === 'dark' ? ['#312e81', '#1e1b4b'] : ['#8B5CF6', '#6D28D9']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="p-6 flex-row items-center justify-between"
                >
                    <View className="flex-1">
                        <View className="bg-white/20 self-start px-3 py-1 rounded-full mb-3">
                            <Text className="text-white text-[9px] font-black uppercase tracking-widest">Broadcast Tool</Text>
                        </View>
                        <Text className="text-white text-3xl font-black tracking-tighter">Post Highlights</Text>
                        <Text className="text-white/80 text-sm font-bold mt-1">Share school moments with parents ✨</Text>
                    </View>
                    <View className="bg-white/30 p-4 rounded-3xl ml-4">
                        <MaterialCommunityIcons name="camera-iris" size={42} color="white" />
                    </View>
                    <View className="absolute -bottom-10 -right-10 opacity-10">
                        <MaterialCommunityIcons name="image-multiple-outline" size={150} color="white" />
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </View>

        {/* ── Today's Pulse Card ── */}
        <View className="px-6 pb-12">
            <View className="flex-row items-center justify-between mb-8 px-1">
                <Text className={`text-xl font-black ${colors.text} tracking-tighter`}>Daily Pulse 📡</Text>
                <TouchableOpacity onPress={() => navigation.navigate('timetable')}>
                    <Text className="text-brand-pink font-bold text-xs">Full View</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => navigation.navigate('timetable')}
                className="rounded-[40px] overflow-hidden shadow-2xl"
                style={{ elevation: 20 }}
            >
                <LinearGradient
                    colors={theme === 'dark' ? ['#312e81', '#1e1b4b'] : ['#6366F1', '#4F46E5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="p-7"
                >
                    <View className="flex-row items-center justify-between relative z-10">
                        <View className="flex-1 mr-4">
                            <View className="flex-row items-center mb-1">
                                <View className="bg-white/20 p-1.5 rounded-lg mr-2">
                                    <MaterialCommunityIcons name="timeline-clock-outline" size={14} color="white" />
                                </View>
                                <Text className="text-white font-black uppercase text-[10px] tracking-[2px] opacity-80">
                                    {todaySchedule ? "Ongoing Activity" : "Operations Ready"}
                                </Text>
                            </View>
                            <Text className="text-white text-3xl font-black mt-2 tracking-tighter" numberOfLines={1}>
                                {todaySchedule ? todaySchedule.activity : "No Scheduled Events"}
                            </Text>
                            <View className="flex-row items-center mt-4">
                                <View className="bg-white/20 self-start px-4 py-2 rounded-2xl flex-row items-center mr-3 border border-white/10">
                                    <MaterialCommunityIcons name="clock-fast" size={16} color="white" />
                                    <Text className="text-white text-[12px] font-black ml-2">
                                        {todaySchedule ? todaySchedule.time : "Standby"}
                                    </Text>
                                </View>
                                <View className="bg-white/20 self-start px-4 py-2 rounded-2xl flex-row items-center border border-white/10">
                                    <MaterialCommunityIcons name="map-marker-outline" size={16} color="white" />
                                    <Text className="text-white text-[12px] font-black ml-2">
                                        {todaySchedule ? (todaySchedule.room || 'All Class') : "Main Site"}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <View className="bg-white/30 w-18 h-18 rounded-[28px] items-center justify-center border-4 border-white/10 shadow-lg rotate-6">
                            <MaterialCommunityIcons 
                                name={todaySchedule ? (todaySchedule.icon || "bullseye-arrow") : "checkbox-marked-circle-outline"} 
                                size={42} 
                                color="white" 
                            />
                        </View>
                    </View>
                    <View className="absolute -bottom-10 -right-10 opacity-10">
                        <MaterialCommunityIcons name="toy-brick-plus" size={180} color="white" />
                    </View>
                </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => navigation.navigate('reports')}
                activeOpacity={0.9}
                className="mt-10 rounded-[40px] overflow-hidden shadow-2xl"
                style={{ elevation: 20 }}
            >
                <LinearGradient
                    colors={theme === 'dark' ? ['#1e1b4b', '#312e81'] : ['#FBBF24', '#D97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="py-7 px-10 flex-row items-center justify-center"
                >
                    <View className="bg-white/20 p-2.5 rounded-2xl mr-4">
                        <MaterialCommunityIcons 
                            name="view-dashboard-variant-outline" 
                            size={28} 
                            color={theme === 'dark' ? 'white' : '#92400E'} 
                        />
                    </View>
                    <View>
                        <Text className={`${theme === 'dark' ? 'text-white' : 'text-amber-900'} font-black text-2xl tracking-tighter`}>Full School Analytics</Text>
                        <Text className={`${theme === 'dark' ? 'text-white/60' : 'text-amber-800/60'} text-[10px] font-black uppercase tracking-widest mt-0.5`}>Central Intelligence Portal</Text>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </View>

        <View className="h-10" />
        </ScrollView>
    </View>
  );
}
