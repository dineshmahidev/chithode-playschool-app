import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

interface StudentHomeScreenProps {
  navigation: NavigationProps;
}

export default function StudentHomeScreen({ navigation }: StudentHomeScreenProps) {
  const { user, announcements, updateAvatar, fees: allFees, feeStructures, refreshFees } = useAuth();
  const { colors, theme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todaySchedule, setTodaySchedule] = useState<any>(null);
  const [timetableLoading, setTimetableLoading] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);

  const myFees = useMemo(() => {
    if (!user) return [];
    const studentUid = user.studentId || (user.id ? user.id.toString() : '');
    return allFees.filter(f => f.student_id === studentUid);
  }, [allFees, user]);

  const { currentMonthStr, currentMonthYearCode, academicYear } = useMemo(() => {
    const d = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthStr = months[d.getMonth()];
    const year = d.getFullYear();
    
    // Academic year usually starts in June
    const acadYearStart = d.getMonth() >= 5 ? year : year - 1;
    const acadYearEnd = acadYearStart + 1;
    
    return {
      currentMonthStr: `${monthStr} ${year}`,
      currentMonthYearCode: `${year}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      academicYear: `${acadYearStart}-${acadYearEnd.toString().slice(-2)}`
    };
  }, []);

  const financialStatus = useMemo(() => {
    if (!user || user.role !== 'student') return null;
    
    const dbId = user.id?.toString();
    const schoolId = user.studentId?.toString();
    const todayStr = new Date().toISOString().split('T')[0];

    // Find ALL fees for this student
    const studentFees = allFees.filter(f => 
      (f.student_id?.toString() === dbId || f.student_id?.toString() === schoolId)
    );

    const unpaidFees = studentFees.filter(f => f.status === 'unpaid');
    
    // Check if current month is already paid
    const currentMonthPaid = studentFees.find(f => 
       f.date?.includes(currentMonthYearCode) && f.status === 'paid'
    );

    // Cumulative logic:
    // If ANY unpaid fee exists and is past its due date, the status is Overdue (Red)
    let hasAnyOverdue = unpaidFees.some(f => f.due_date && f.due_date < todayStr);
    
    // Check if current month has a virtual overdue
    if (!hasAnyOverdue && !currentMonthPaid && !studentFees.some(f => f.date?.includes(currentMonthYearCode))) {
       const dueDayNum = parseInt(user.fee_due_day || '5');
       if (new Date().getDate() > dueDayNum) {
          hasAnyOverdue = true;
       }
    }

    const isPending = unpaidFees.length > 0 || (!currentMonthPaid && (user.fees && parseInt(user.fees) > 0));
    const isPaid = !isPending && currentMonthPaid;
    
    // Sort unpaid by date for naming context
    const sortedUnpaid = [...unpaidFees].sort((a,b) => (a.due_date || a.date).localeCompare(b.due_date || b.date));
    const oldestFee = sortedUnpaid[0];

    return {
      isPaid,
      isOverdue: hasAnyOverdue,
      isPending,
      dueDay: oldestFee?.due_date ? parseInt(oldestFee.due_date.split('-')[2]) : parseInt(user.fee_due_day || '5'),
      exists: isPending || isPaid,
      title: hasAnyOverdue ? 'Overdue Balance' : (isPending ? 'Monthly Fee' : 'Current Month')
    };
  }, [allFees, user, currentMonthYearCode]);

  const feeBreakdown = useMemo(() => {
    if (!user) return { total: 0, overdue: 0, current: 0 };
    
    const todayStr = new Date().toISOString().split('T')[0];
    
    // 1. Calculate Overdue from DB
    const overdueAmount = myFees
      .filter(f => f.status === 'unpaid' && f.due_date && f.due_date < todayStr)
      .reduce((sum, f) => sum + (f.amount || 0), 0);
    
    // 2. Calculate Current/Upcoming from DB
    const currentAmountDb = myFees
      .filter(f => f.status === 'unpaid' && (!f.due_date || f.due_date >= todayStr))
      .reduce((sum, f) => sum + (f.amount || 0), 0);
    
    // 3. Current month virtual fee
    const currentMonthPaid = myFees.find(f => f.date?.includes(currentMonthYearCode) && f.status === 'paid');
    const currentMonthInDb = myFees.find(f => f.date?.includes(currentMonthYearCode));
    
    let extra = 0;
    if (!currentMonthInDb && !currentMonthPaid && user.fees && parseInt(user.fees) > 0) {
       extra = parseInt(user.fees);
    }

    const totalCurrent = currentAmountDb + extra;

    return {
      total: overdueAmount + totalCurrent,
      overdue: overdueAmount,
      current: totalCurrent
    };
  }, [myFees, user, currentMonthYearCode]);

  const fetchTimetable = useCallback(async () => {
    setTimetableLoading(true);
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
        
        // Find current or upcoming session
        // Today we show the session if current time is within 60 mins of start or upcoming
        const currentOrNext = sorted.find((s: any) => {
          const sessionStart = timeToMinutes(s.time);
          // If current time is between session start and session start + 60 mins (assuming 1hr sessions)
          // OR if session is upcoming in the next 30 mins
          return (nowMinutes >= sessionStart && nowMinutes < sessionStart + 60) || (sessionStart > nowMinutes);
        });
        setTodaySchedule(currentOrNext || null);
      } else {
        setTodaySchedule(null);
      }
    } catch (err) {
      console.error('Fetch Timetable Error:', err);
    } finally {
      setTimetableLoading(false);
    }
  }, []);

  const fetchTodayAttendance = useCallback(async () => {
    if (!user) return;
    setAttendanceLoading(true);
    try {
      // Use local date string instead of UTC ISO to avoid timezone shifts
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      // Use user.id as it's the primary key used in the attendance table
      const studentUid = user.id.toString();
      
      const response = await api.get(`/attendance?date=${today}`);
      if (response.data && response.data.length > 0) {
        // Find the specific record for THIS student among today's records
        const myRecord = response.data.find((r: any) => 
          r.student_id?.toString() === studentUid && 
          r.date === today
        );
        setTodayAttendance(myRecord || null);
      } else {
        setTodayAttendance(null);
      }
    } catch (err) {
      console.error('Fetch Attendance Error:', err);
    } finally {
      setAttendanceLoading(false);
    }
  }, [user]);

  // Update clock and fetch data
  useEffect(() => {
    fetchTimetable();
    fetchTodayAttendance();
    refreshFees();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Only need to update every min now
    return () => clearInterval(timer);
  }, [fetchTimetable, fetchTodayAttendance, refreshFees]);

  // Filter announcements for students
  const studentNotices = announcements.filter(a => a.target === 'all' || a.target === 'student');
  const latestNotice = studentNotices.length > 0 ? studentNotices[0] : null;

  const handleQuickAction = (screen: string | null) => {
    if (screen) {
      navigation.navigate(screen as any);
    } else {
      Alert.alert('Coming Soon', 'This feature will be available shortly! 🎨');
    }
  };

  const renderAnnouncements = (list: any[], sectionTitle: string, hint: string) => {
    const screenWidth = Dimensions.get('window').width;
    const cardWidth = screenWidth - 48; // Significantly increased width

    return (
      <View className="py-2">
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
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
            decelerationRate="fast"
            snapToInterval={cardWidth + 16} // cardWidth + gap
          >
            {list.map((item, index) => (
              <TouchableOpacity 
                key={item.id}
                activeOpacity={0.9}
                style={{ width: cardWidth, aspectRatio: 16 / 9 }}
                className={`${index === list.length - 1 ? '' : 'mr-4'} bg-brand-pink relative overflow-hidden rounded-[32px] border-2 border-white shadow-xl`}
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
          <View className="items-center px-6">
            <LinearGradient
              colors={theme === 'dark' ? ['#1e1e1e', '#1a1a14'] : ['#FFF5F8', '#FFFFFF']}
              style={{ width: cardWidth, aspectRatio: 16 / 9 }}
              className="items-center justify-center rounded-[40px] border-2 border-brand-pink/10 border-dashed"
            >
              <View className="bg-brand-pink/10 w-20 h-20 rounded-full items-center justify-center mb-4">
                <MaterialCommunityIcons name="bullhorn-variant-outline" size={42} color="#F472B6" />
              </View>
              <Text className={`text-xl font-black ${colors.text} tracking-tighter`}>All Caught Up! ✨</Text>
              <Text className="mt-1 font-black text-brand-pink/40 uppercase text-[8px] tracking-[3px]">No New Notices</Text>
            </LinearGradient>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView className={`flex-1 ${colors.background}`} showsVerticalScrollIndicator={false}>
      {/* ── Background Gradient & 3D Illustration ── */}
      <View className="absolute top-0 left-0 right-0 h-[450px] overflow-hidden">
        <LinearGradient
            colors={[theme === 'dark' ? '#3d1d2b' : '#FDF2F8', theme === 'dark' ? '#1c1c14' : '#FFFFFF']}
            className="absolute inset-0"
        />
        <Image 
            source={require('../../assets/images/playschool_3d.png')} 
            style={{ width: '100%', height: '100%', opacity: theme === 'dark' ? 0.15 : 0.25, transform: [{ scale: 1.2 }, { translateY: -20 }] }}
            resizeMode="cover"
        />
        {/* Soft pink overlap glow */}
        <View className="absolute -top-20 -left-20 w-64 h-64 bg-brand-pink/10 rounded-full blur-3xl" />
        
        {/* Smooth transition gradient to content */}
        <LinearGradient
            colors={['transparent', theme === 'dark' ? '#1c1c14' : '#FFFFFF']}
            className="absolute bottom-0 left-0 right-0 h-40"
        />
      </View>

      {/* Header - Blends with background */}
      <View className="px-6 pt-10 pb-6">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className={`text-xl font-black ${colors.textSecondary} uppercase tracking-widest`}>
              Hi Student 🎒
            </Text>
            <View className="flex-row items-center mt-1">
              <Text className={`text-3xl font-black ${colors.text} tracking-tighter`}>
                {user?.name || 'Explorer'}
              </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('profile')}
                className="ml-2 bg-brand-pink/10 p-2 rounded-full"
              >
                <MaterialCommunityIcons name="pencil" size={18} color="#F472B6" />
              </TouchableOpacity>
            </View>
            <View className="bg-brand-pink/20 self-start px-3 py-1 rounded-full mt-2 border border-brand-pink/10 shadow-sm">
                <Text className="text-brand-pink text-[9px] font-black uppercase tracking-[2px]">Explorer</Text>
            </View>
          </View>
          <TouchableOpacity 
            className="bg-brand-yellow w-20 h-20 rounded-3xl items-center justify-center shadow-lg border-4 border-white rotate-3 relative overflow-hidden"
            onPress={updateAvatar}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <MaterialCommunityIcons name="face-man-shimmer-outline" size={42} color="#92400E" />
            )}
            <View className="absolute -bottom-1 -right-1 bg-brand-pink p-1.5 rounded-lg border-2 border-white">
              <MaterialCommunityIcons name="camera" size={14} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Modern Attendance Status Card ── */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('attendance')}
          className="mt-6 rounded-[40px] overflow-hidden shadow-2xl"
          style={{ elevation: 20 }}
        >
          <LinearGradient
            colors={theme === 'dark' ? ['#1e1b4b', '#1e293b'] : ['#FFFFFF', '#FDF2F8']}
            className="p-6"
          >
            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className={`text-2xl font-black ${colors.text} tracking-tighter`}>Daily Journey 🎒</Text>
                <Text className={`text-[10px] ${colors.textTertiary} font-black uppercase tracking-[2px]`}>Live Attendance Track</Text>
              </View>
              <View className={`${todayAttendance?.in_time ? 'bg-green-500/10 border-green-500/20' : 'bg-orange-500/10 border-orange-500/20'} px-3 py-1.5 rounded-full border flex-row items-center`}>
                <View className={`w-2 h-2 ${todayAttendance?.in_time ? 'bg-green-500' : 'bg-orange-500'} rounded-full mr-2`} />
                <Text className={`${todayAttendance?.in_time ? 'text-green-600' : 'text-orange-600'} text-[10px] font-black uppercase`}>
                  {todayAttendance?.in_time ? (todayAttendance?.out_time ? 'Journey Complete' : 'Safely In') : 'Expecting Arrival'}
                </Text>
              </View>
            </View>

            <View className="flex-row justify-between items-center">
              {/* Departure / Clock In Status */}
              <View className={`${theme === 'dark' ? 'bg-white/5' : 'bg-white'} rounded-[32px] p-4 w-[46%] shadow-sm border ${theme === 'dark' ? 'border-white/10' : 'border-gray-100'} ${!todayAttendance?.in_time ? 'opacity-50' : ''}`}>
                <View className="flex-row items-center mb-3">
                  <View className={`${todayAttendance?.in_time ? 'bg-blue-600' : 'bg-gray-400'} w-10 h-10 rounded-2xl items-center justify-center mr-2 shadow-lg`}>
                    <MaterialCommunityIcons name="bus-clock" size={22} color="white" />
                  </View>
                  <View>
                    <Text className={`font-black ${colors.text} text-[11px]`}>Arrival</Text>
                    <Text className={`text-[10px] font-bold ${todayAttendance?.in_time ? 'text-blue-500' : colors.textTertiary}`}>
                      {todayAttendance?.in_time || '--:--'}
                    </Text>
                  </View>
                </View>
                <View className={`${todayAttendance?.in_time ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'} px-2 py-1.5 rounded-xl border`}>
                  <Text className={`${todayAttendance?.in_time ? 'text-blue-700' : 'text-gray-400'} text-[9px] font-black uppercase text-center`} numberOfLines={1}>
                    {todayAttendance?.dropped_by_type ? `${todayAttendance.dropped_by_type} Drop` : 'Waiting...'}
                  </Text>
                </View>
              </View>

              {/* Progress Connector */}
              <View className="w-4 items-center justify-center">
                <MaterialCommunityIcons 
                  name="dots-vertical" 
                  size={20} 
                  color={todayAttendance?.in_time ? (theme === 'dark' ? '#334155' : '#E2E8F0') : '#F1F5F9'} 
                />
              </View>

              {/* Arrival / Clock Out Status */}
              <View className={`${theme === 'dark' ? 'bg-white/5' : 'bg-white'} rounded-[32px] p-4 w-[46%] shadow-sm border ${theme === 'dark' ? 'border-white/10' : 'border-gray-100'} ${!todayAttendance?.out_time ? 'opacity-50' : ''}`}>
                <View className="flex-row items-center mb-3">
                  <View className={`${todayAttendance?.out_time ? 'bg-brand-pink' : 'bg-gray-400'} w-10 h-10 rounded-2xl items-center justify-center mr-2 shadow-lg`}>
                    <MaterialCommunityIcons name="home-heart" size={22} color="white" />
                  </View>
                  <View>
                    <Text className={`font-black ${colors.text} text-[11px]`}>Departure</Text>
                    <Text className={`text-[10px] font-bold ${todayAttendance?.out_time ? 'text-brand-pink' : colors.textTertiary}`}>
                      {todayAttendance?.out_time || '--:--'}
                    </Text>
                  </View>
                </View>
                <View className={`${todayAttendance?.out_time ? 'bg-pink-50 border-pink-100' : 'bg-gray-50 border-gray-100'} px-2 py-1.5 rounded-xl border`}>
                  <Text className={`${todayAttendance?.out_time ? 'text-brand-pink' : 'text-gray-400'} text-[9px] font-black uppercase text-center`} numberOfLines={1}>
                    {todayAttendance?.picked_by_type ? `${todayAttendance.picked_by_type} Pick` : 'In School'}
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Background Glows */}
            <View className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl" />
            <View className="absolute -bottom-10 -left-10 w-32 h-32 bg-pink-500/5 rounded-full blur-3xl" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── Top Announcements (Legacy Place) ── */}
      {studentNotices.length > 0 && renderAnnouncements(studentNotices, 'Notice Board', 'notices')}

      {/* ── Today's Schedule Card ── */}
      <View className="px-6 mt-4">
        <View className="flex-row items-center justify-between mb-4 px-1">
          <Text className={`text-xl font-black ${colors.text} tracking-tighter`}>Today's Schedule ⏰</Text>
          <TouchableOpacity onPress={() => navigation.navigate('timetable')}>
            <Text className="text-brand-pink font-bold text-xs">View Full</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => navigation.navigate('timetable')}
            className="rounded-[40px] overflow-hidden shadow-2xl"
            style={{ elevation: 20 }}
        >
          <LinearGradient
              colors={theme === 'dark' ? ['#312e81', '#1e1b4b'] : ['#6366F1', '#4338CA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="p-6"
          >
              <View className="flex-row items-center justify-between relative z-10">
                  <View className="flex-1 mr-4">
                      <View className="flex-row items-center mb-1">
                          <View className="bg-white/20 p-1 rounded-md mr-2">
                            <MaterialCommunityIcons name="clock-fast" size={14} color="white" />
                          </View>
                          <Text className="text-white font-black uppercase text-[10px] tracking-[2px] opacity-80">
                              {todaySchedule ? "Upcoming Session" : "Schedule Ready"}
                          </Text>
                      </View>
                      <Text className="text-white text-3xl font-black mt-1 tracking-tighter" numberOfLines={1}>
                          {todaySchedule ? todaySchedule.activity : "Self Study Time"}
                      </Text>
                      <View className="flex-row items-center mt-3">
                          <View className="bg-white/20 self-start px-3 py-1.5 rounded-2xl flex-row items-center mr-2 border border-white/10">
                              <MaterialCommunityIcons name="clock-outline" size={14} color="white" />
                              <Text className="text-white text-[11px] font-black ml-1.5">
                                  {todaySchedule ? todaySchedule.time : "Day Off"}
                              </Text>
                          </View>
                          <View className="bg-white/20 self-start px-3 py-1.5 rounded-2xl flex-row items-center border border-white/10">
                              <MaterialCommunityIcons name="door-open" size={14} color="white" />
                              <Text className="text-white text-[11px] font-black ml-1.5">
                                  {todaySchedule ? (todaySchedule.room || 'Classroom') : "Home"}
                              </Text>
                          </View>
                      </View>
                  </View>
                  <View className="bg-white/30 w-16 h-16 rounded-[24px] items-center justify-center border-4 border-white/10">
                      <MaterialCommunityIcons 
                          name={todaySchedule ? (todaySchedule.icon || "book-open-page-variant") : "gamepad-variant"} 
                          size={36} 
                          color="white" 
                      />
                  </View>
              </View>
              {/* Background pattern */}
              <View className="absolute -bottom-6 -right-6 opacity-10">
                  <MaterialCommunityIcons name="toy-brick-plus-outline" size={140} color="white" />
              </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Modern School Portal Actions */}
      <View className="px-6 py-6">
        <View className="flex-row items-center justify-between mb-5">
          <Text className={`text-xl font-black ${colors.text} tracking-tighter`}>School Portal 📸</Text>
          <View className="bg-brand-pink/10 px-3 py-1 rounded-full">
            <Text className="text-brand-pink text-[9px] font-black uppercase tracking-widest">Interactive</Text>
          </View>
        </View>

        {/* Large Main Action: Activity Feed */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('activityFeed')}
          className="mb-4 rounded-[32px] overflow-hidden shadow-xl"
          style={{ elevation: 15 }}
        >
          <LinearGradient
            colors={theme === 'dark' ? ['#4c1d95', '#1e1b4b'] : ['#F472B6', '#DB2777']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-6 flex-row items-center justify-between"
          >
            <View className="flex-1">
              <View className="bg-white/20 self-start px-3 py-1 rounded-full mb-3">
                <Text className="text-white text-[10px] font-black uppercase tracking-widest">Daily Highlights</Text>
              </View>
              <Text className="text-white text-3xl font-black tracking-tighter">Activity Feed</Text>
              <Text className="text-white/80 text-sm font-bold mt-1">Check out today's classroom memories ✨</Text>
            </View>
            <View className="bg-white/40 p-4 rounded-3xl ml-4">
              <MaterialCommunityIcons name="image-multiple" size={42} color="white" />
            </View>
            
            {/* Background Pattern */}
            <View className="absolute -bottom-10 -right-10 opacity-10">
              <MaterialCommunityIcons name="camera-iris" size={150} color="white" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Secondary Duo Actions: Timetable & Live Feed */}
        <View className="flex-row justify-between">
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('timetable')}
            className="w-[48%] rounded-[32px] overflow-hidden shadow-lg"
            style={{ elevation: 12 }}
          >
            <LinearGradient
              colors={theme === 'dark' ? ['#1e3a8a', '#1e1b4b'] : ['#FBBF24', '#D97706']}
              className="p-5 h-44 justify-between"
            >
              <View className="bg-white/30 self-start p-3 rounded-2xl">
                <MaterialCommunityIcons name="calendar-clock" size={28} color="white" />
              </View>
              <View>
                <Text className="text-white text-xl font-black tracking-tighter">Timetable</Text>
                <Text className="text-white/80 text-[10px] font-bold mt-1 uppercase tracking-wider">Weekly Schedule</Text>
              </View>
              {/* Background Pattern */}
              <View className="absolute -bottom-4 -right-4 opacity-10">
                <MaterialCommunityIcons name="clock-outline" size={70} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('liveCamera')}
            className="w-[48%] rounded-[32px] overflow-hidden shadow-lg"
            style={{ elevation: 12 }}
          >
            <LinearGradient
              colors={theme === 'dark' ? ['#065f46', '#022c22'] : ['#3B82F6', '#2563EB']}
              className="p-5 h-44 justify-between"
            >
              <View className="bg-white/30 self-start p-3 rounded-2xl">
                <MaterialCommunityIcons name="video-vintage" size={28} color="white" />
              </View>
              <View>
                <Text className="text-white text-xl font-black tracking-tighter">Live Feed</Text>
                <Text className="text-white/80 text-[10px] font-bold mt-1 uppercase tracking-wider">Secure Camera</Text>
              </View>
              {/* Background Pattern */}
              <View className="absolute -bottom-4 -right-4 opacity-10">
                <MaterialCommunityIcons name="cctv" size={70} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>


      {/* ── Modern Financial Overview Card ── */}
      <View className="px-6 pb-12">
        <View className="flex-row items-center justify-between mb-5 px-1">
          <Text className={`text-xl font-black ${colors.text} tracking-tighter`}>Financial Vault 💳</Text>
          <View className="bg-green-500/10 px-3 py-1 rounded-full">
            <Text className="text-green-600 text-[9px] font-black uppercase tracking-widest">Secure Payments</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('myFees')}
          className="rounded-[40px] overflow-hidden shadow-2xl"
          style={{ elevation: 20 }}
        >
          <LinearGradient
            colors={financialStatus?.isOverdue 
              ? (theme === 'dark' ? ['#7f1d1d', '#450a0a'] : ['#EF4444', '#991B1B']) 
              : (financialStatus?.isPending
                ? (theme === 'dark' ? ['#7c2d12', '#431407'] : ['#F59E0B', '#D97706'])
                : (theme === 'dark' ? ['#064e3b', '#022c22'] : ['#10B981', '#059669']))
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-7"
          >
            <View className="flex-row items-center justify-between z-10">
              <View className="flex-1">
                <View className="bg-white/20 self-start px-3 py-1 rounded-full mb-3">
                  <Text className="text-white text-[10px] font-black uppercase tracking-widest">Academic Year {academicYear}</Text>
                </View>
                <Text className="text-white text-3xl font-black tracking-tighter">
                  {financialStatus?.isOverdue ? "Payment Overdue" : (financialStatus?.isPending ? "Fee Pending" : "School Fees")}
                </Text>
                <View className="flex-row items-center mt-2">
                  <View className={`bg-white/10 px-3 py-1.5 rounded-2xl border border-white/10 flex-row items-center`}>
                    <MaterialCommunityIcons 
                      name={financialStatus?.isOverdue ? "alert-circle" : (financialStatus?.isPending ? "clock-outline" : "checkbox-marked-circle")} 
                      size={16} 
                      color={financialStatus?.isOverdue ? "#FCA5A5" : (financialStatus?.isPending ? "#FDE68A" : "#34D399")} 
                    />
                    <Text className="text-white text-xs font-black ml-2">
                      {financialStatus?.isOverdue 
                        ? `${financialStatus.title} Overdue` 
                        : (financialStatus?.isPending ? `${financialStatus.title} Pending` : "No Pending Dues")}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View className="bg-white/30 w-16 h-16 rounded-[24px] items-center justify-center border-4 border-white/10 shadow-lg rotate-3">
                <MaterialCommunityIcons 
                  name={financialStatus?.isOverdue ? "cash-remove" : (financialStatus?.isPending ? "cash-fast" : "currency-inr")} 
                  size={36} 
                  color="white" 
                />
              </View>
            </View>

            <View className="flex-row items-center justify-between mt-8 z-10">
              <View>
                <Text className="text-white/60 text-[10px] font-black uppercase tracking-widest">
                  {financialStatus?.isOverdue ? "Cumulative Balance" : (financialStatus?.isPending ? "Amount to Pay" : "Current Balance")}
                </Text>
                <Text className="text-white text-xl font-black mt-1 tracking-tight">
                  {feeBreakdown.total > 0 
                    ? `₹${feeBreakdown.total.toLocaleString()} Total Due` 
                    : (financialStatus?.isPaid ? "Paid for this Month" : "No Pending Dues")}
                </Text>
                
                {financialStatus?.isOverdue && feeBreakdown.overdue > 0 && feeBreakdown.current > 0 && (
                  <Text className="text-white/80 text-[9px] font-black mt-1 uppercase tracking-wider">
                    (₹{feeBreakdown.overdue.toLocaleString()} Overdue + ₹{feeBreakdown.current.toLocaleString()} Current Month)
                  </Text>
                )}
              </View>
              <View className="bg-white p-2.5 rounded-2xl shadow-md">
                <MaterialCommunityIcons 
                  name="chevron-right" 
                  size={24} 
                  color={financialStatus?.isOverdue ? "#991B1B" : (financialStatus?.isPending ? "#D97706" : "#059669")} 
                />
              </View>
            </View>

            {/* Background Pattern */}
            <View className="absolute -bottom-12 -right-12 opacity-10">
              <MaterialCommunityIcons 
                name={financialStatus?.isOverdue ? "clock-alert-outline" : "safe-square-outline"} 
                size={180} 
                color="white" 
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
