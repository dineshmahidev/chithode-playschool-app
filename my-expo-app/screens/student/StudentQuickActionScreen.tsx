import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';


interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface StudentQuickActionScreenProps {
  navigation: NavigationProps;
}

export default function StudentQuickActionScreen({ navigation }: StudentQuickActionScreenProps) {
  const { user, fees: allFees } = useAuth();
  const { colors, theme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());

  const { currentMonthStr, currentMonthYearCode } = useMemo(() => {
    const d = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return {
      currentMonthStr: `${months[d.getMonth()]} ${d.getFullYear()}`,
      currentMonthYearCode: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    };
  }, []);

  const myFees = useMemo(() => {
    if (!user) return [];
    return allFees.filter(f => 
      f.student_id === user.studentId || 
      (user.id && f.student_id === user.id.toString())
    );
  }, [allFees, user]);

  const financialStatus = useMemo(() => {
    if (!user) return null;
    
    const dbId = user.id?.toString();
    const schoolId = user.studentId?.toString();
    const todayStr = new Date().toISOString().split('T')[0];

    const studentFees = allFees.filter(f => 
      (f.student_id?.toString() === dbId || f.student_id?.toString() === schoolId)
    );

    const unpaidFees = studentFees.filter(f => f.status === 'unpaid');
    const currentMonthPaid = studentFees.find(f => 
       f.date?.includes(currentMonthYearCode) && f.status === 'paid'
    );

    let isOverdue = false;
    let isPending = false;
    let title = 'Monthly Fee';

    if (unpaidFees.length > 0) {
      const sortedUnpaid = [...unpaidFees].sort((a, b) => (a.due_date || a.date).localeCompare(b.due_date || b.date));
      const activeFee = sortedUnpaid[0];
      isOverdue = activeFee.due_date ? activeFee.due_date < todayStr : false;
      isPending = true;
      title = activeFee.type || 'Monthly Fee';
    } else if (!currentMonthPaid && (user.fees && parseInt(user.fees) > 0)) {
       isPending = true;
       const dueDayNum = parseInt(user.fee_due_day || '5');
       isOverdue = new Date().getDate() > dueDayNum;
       title = 'Current Month Fee';
    }

    return { isPaid: !!currentMonthPaid, isOverdue, isPending, title };
  }, [allFees, user, currentMonthYearCode]);

  const totalSummary = useMemo(() => {
    if (!user) return { paid: 0, pending: 0, overdue: 0, current: 0 };
    
    const todayStr = new Date().toISOString().split('T')[0];

    const paid = myFees
      .filter(f => f.status === 'paid')
      .reduce((sum, f) => sum + (f.amount || 0), 0);

    const overdueDb = myFees
      .filter(f => f.status === 'unpaid' && f.due_date && f.due_date < todayStr)
      .reduce((sum, f) => sum + (f.amount || 0), 0);
    
    const currentDb = myFees
      .filter(f => f.status === 'unpaid' && (!f.due_date || f.due_date >= todayStr))
      .reduce((sum, f) => sum + (f.amount || 0), 0);
    
    const currentMonthInDb = myFees.find(f => f.date?.includes(currentMonthYearCode));
    const currentMonthPaid = myFees.find(f => f.date?.includes(currentMonthYearCode) && f.status === 'paid');
    
    let virtualExtra = 0;
    if (!currentMonthInDb && !currentMonthPaid && user.fees && parseInt(user.fees) > 0) {
       virtualExtra = parseInt(user.fees);
    }

    const totalCurrent = currentDb + virtualExtra;

    return { 
      paid, 
      pending: overdueDb + totalCurrent,
      overdue: overdueDb,
      current: totalCurrent
    };
  }, [myFees, user, currentMonthYearCode]);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return {
      time: `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      ampm,
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    };
  };

  const { time, ampm, date } = formatTime(currentTime);

  const quickActions = [
    {
      id: 'kidsFeed',
      title: 'Kids Activity',
      subtitle: 'View school activities',
      icon: 'image-multiple',
      color: 'bg-brand-yellow',
      iconColor: '#92400E',
      screen: 'activityFeed'
    },
    {
      id: 'timetable',
      title: 'Timetable',
      subtitle: 'Daily school schedule',
      icon: 'calendar-clock',
      color: 'bg-indigo-500',
      iconColor: '#FFFFFF',
      screen: 'timetable'
    },
    {
      id: 'liveCamera',
      title: 'Live Camera',
      subtitle: 'View classroom live feed',
      icon: 'video',
      color: 'bg-yellow-600',
      iconColor: '#FFFFFF',
      screen: 'liveCamera'
    },
    {
      id: 'emergency',
      title: 'Emergency Contact',
      subtitle: 'Call guardians quickly',
      icon: 'phone-alert',
      color: 'bg-red-500',
      iconColor: '#FFFFFF',
      screen: 'emergencyContact'
    }
  ];

  return (
    <ScrollView className={`flex-1 ${colors.background}`} showsVerticalScrollIndicator={false}>
      {/* ── Background Gradient & 3D Illustration ── */}
      <View className="absolute top-0 left-0 right-0 h-[450px] overflow-hidden">
        <LinearGradient
            colors={[theme === 'dark' ? '#3d1d2b' : '#FDF2F8', theme === 'dark' ? '#1c1c14' : '#FFFFFF']}
            className="absolute inset-0"
        />
        <Image 
            source={require('../../assets/images/playschool_actions.png')} 
            style={{ width: '100%', height: '100%', opacity: theme === 'dark' ? 0.15 : 0.25, transform: [{ scale: 1.1 }, { translateY: -10 }] }}
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

      {/* Attractive Header */}
      <View className="px-6 pt-10 pb-6">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className={`text-xl font-black ${colors.textSecondary} uppercase tracking-widest`}>
              Explorer Mode 🚀
            </Text>
            <View className="flex-row items-center mt-1">
              <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>
                Quick Actions
              </Text>
            </View>
            <View className="bg-brand-pink/20 self-start px-3 py-1 rounded-full mt-2 border border-brand-pink/10 shadow-sm">
                <Text className="text-brand-pink text-[9px] font-black uppercase tracking-[2px]">Daily Playground</Text>
            </View>
          </View>
          <View className="bg-brand-pink w-20 h-20 rounded-3xl items-center justify-center shadow-lg border-4 border-white rotate-3 relative overflow-hidden">
            <MaterialCommunityIcons name="flash" size={48} color="white" />
            <View className="absolute -bottom-4 -right-4 opacity-20">
              <MaterialCommunityIcons name="lightning-bolt" size={60} color="white" />
            </View>
          </View>
        </View>
      </View>

      {/* ── Premium Info Section ── */}
      <View className="px-6 py-4">
        <View className="flex-row items-center justify-between mb-5 px-1">
          <Text className={`text-xl font-black ${colors.text} tracking-tighter`}>My Academic Info 📊</Text>
          <View className="bg-brand-pink/10 px-3 py-1 rounded-full">
            <Text className="text-brand-pink text-[9px] font-black uppercase tracking-widest">Live Updates</Text>
          </View>
        </View>
        
        {/* Modern My Fees Card */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('myFees')}
          className="rounded-[40px] overflow-hidden shadow-2xl mb-6"
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
            className="p-6"
          >
            <View className="flex-row items-center justify-between z-10">
              <View className="flex-1">
                <View className="bg-white/20 self-start px-3 py-1 rounded-full mb-2">
                  <Text className="text-white text-[10px] font-black uppercase tracking-widest">
                    {financialStatus?.isOverdue ? "Overdue Alert" : (financialStatus?.isPending ? "Pending Payment" : "Financial Status")}
                  </Text>
                </View>
                <Text className="text-white text-3xl font-black tracking-tighter">My Fees</Text>
                <View className="flex-row items-center mt-3">
                  <View className="bg-white/10 px-3 py-1.5 rounded-2xl border border-white/10">
                    <View className="flex-row items-center">
                        <MaterialCommunityIcons 
                           name={financialStatus?.isOverdue ? "alert-circle" : (financialStatus?.isPending ? "clock-outline" : "check-decagram")} 
                           size={16} 
                           color={financialStatus?.isOverdue ? "#FCA5A5" : (financialStatus?.isPending ? "#FDE68A" : "#34D399")} 
                        />
                        <Text className="text-white text-xs font-black ml-2">
                          {totalSummary.pending > 0 
                            ? `₹${totalSummary.pending.toLocaleString()} Total Due` 
                            : `₹${totalSummary.paid.toLocaleString()} Paid`}
                        </Text>
                    </View>
                    {financialStatus?.isOverdue && totalSummary.overdue > 0 && totalSummary.current > 0 && (
                       <Text className="text-white/80 text-[8px] font-black uppercase mt-1">
                          (₹{totalSummary.overdue.toLocaleString()} Overdue + ₹{totalSummary.current.toLocaleString()} Cur.)
                       </Text>
                    )}
                  </View>
                </View>
              </View>
              
              <View className="bg-white/30 w-16 h-16 rounded-[24px] items-center justify-center border-4 border-white/10 shadow-lg rotate-3">
                <MaterialCommunityIcons name="currency-inr" size={32} color="white" />
              </View>
            </View>

            <View className="flex-row items-center justify-between mt-6 z-10">
              <Text className="text-white/80 text-xs font-bold">Tap to view detailed history</Text>
              <View className="bg-white p-2 rounded-2xl">
                <MaterialCommunityIcons name="chevron-right" size={20} color="#059669" />
              </View>
            </View>

            {/* Background Pattern */}
            <View className="absolute -bottom-8 -right-8 opacity-10">
              <MaterialCommunityIcons name="wallet-giftcard" size={140} color="white" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Modern My Attendance Card */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('attendance')}
          className="rounded-[40px] overflow-hidden shadow-2xl mb-6"
          style={{ elevation: 20 }}
        >
          <LinearGradient
            colors={theme === 'dark' ? ['#1e3a8a', '#1e1b4b'] : ['#3B82F6', '#2563EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-6"
          >
            <View className="flex-row items-center justify-between z-10">
              <View className="flex-1">
                <View className="bg-white/20 self-start px-3 py-1 rounded-full mb-2">
                  <Text className="text-white text-[10px] font-black uppercase tracking-widest">Attendance Record</Text>
                </View>
                <Text className="text-white text-3xl font-black tracking-tighter">Attendance</Text>
                <View className="flex-row items-center mt-3">
                  <View className="bg-white/10 px-3 py-1.5 rounded-2xl border border-white/10 flex-row items-center">
                    <MaterialCommunityIcons name="trending-up" size={16} color="#93C5FD" />
                    <Text className="text-white text-xs font-black ml-2">94% Regularity</Text>
                  </View>
                </View>
              </View>
              
              <View className="bg-white/30 w-16 h-16 rounded-[24px] items-center justify-center border-4 border-white/10 shadow-lg -rotate-3">
                <MaterialCommunityIcons name="calendar-check" size={32} color="white" />
              </View>
            </View>

            <View className="flex-row items-center justify-between mt-6 z-10">
              <Text className="text-white/80 text-xs font-bold">Check your daily logbook</Text>
              <View className="bg-white p-2 rounded-2xl">
                <MaterialCommunityIcons name="chevron-right" size={20} color="#2563EB" />
              </View>
            </View>

            {/* Background Pattern */}
            <View className="absolute -bottom-8 -right-8 opacity-10">
              <MaterialCommunityIcons name="account-check-outline" size={140} color="white" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── Daily Action Grid ── */}
      <View className="px-6 pb-12">
        <View className="flex-row items-center justify-between mb-5 px-1">
          <Text className={`text-xl font-black ${colors.text} tracking-tighter`}>Daily Playground 🍭</Text>
          <View className="bg-brand-yellow/20 px-3 py-1 rounded-full">
            <Text className="text-brand-yellow text-[9px] font-black uppercase tracking-widest">Interactive</Text>
          </View>
        </View>
        
        <View className="flex-row flex-wrap justify-between">
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              activeOpacity={0.9}
              onPress={() => navigation.navigate(action.screen)}
              className="w-[48%] rounded-[32px] overflow-hidden shadow-lg mb-4"
              style={{ elevation: 12 }}
            >
              <LinearGradient
                colors={
                  action.id === 'kidsFeed' ? (theme === 'dark' ? ['#4c1d95', '#1e1b4b'] : ['#F472B6', '#DB2777']) :
                  action.id === 'timetable' ? (theme === 'dark' ? ['#1e3a8a', '#1e1b4b'] : ['#FBBF24', '#D97706']) :
                  action.id === 'liveCamera' ? (theme === 'dark' ? ['#065f46', '#022c22'] : ['#3B82F6', '#2563EB']) :
                  (theme === 'dark' ? ['#7f1d1d', '#450a0a'] : ['#EF4444', '#B91C1C'])
                }
                className="p-5 h-44 justify-between"
              >
                <View className="bg-white/30 self-start p-3 rounded-2xl">
                  <MaterialCommunityIcons name={action.icon as any} size={28} color="white" />
                </View>
                <View>
                  <Text className="text-white text-xl font-black tracking-tighter">{action.title}</Text>
                  <Text className="text-white/80 text-[10px] font-bold mt-1 uppercase tracking-wider">{action.subtitle}</Text>
                </View>
                
                {/* Background Pattern */}
                <View className="absolute -bottom-4 -right-4 opacity-10">
                  <MaterialCommunityIcons name={action.icon as any} size={70} color="white" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
