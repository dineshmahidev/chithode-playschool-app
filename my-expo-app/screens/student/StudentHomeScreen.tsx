import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

interface StudentHomeScreenProps {
  navigation: NavigationProps;
}

export default function StudentHomeScreen({ navigation }: StudentHomeScreenProps) {
  const { user, announcements, updateAvatar, fees: allFees, feeStructures } = useAuth();
  const { colors, theme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todaySchedule, setTodaySchedule] = useState<any>(null);
  const [timetableLoading, setTimetableLoading] = useState(false);

  const myFees = useMemo(() => {
    if (!user) return [];
    return allFees.filter(f => 
      f.student_id === user.studentId || 
      (user.id && f.student_id === user.id.toString())
    );
  }, [allFees, user]);

  const totalPending = useMemo(() => {
    const totalToPay = feeStructures.reduce((sum, fs) => sum + fs.amount, 0);
    const paid = myFees
      .filter(f => f.status === 'paid')
      .reduce((sum, f) => sum + f.amount, 0);
    return Math.max(0, totalToPay - paid);
  }, [feeStructures, myFees]);

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
        const currentOrNext = sorted.find((s: any) => timeToMinutes(s.time) >= nowMinutes - 30);
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

  // Update clock and fetch data
  useEffect(() => {
    fetchTimetable();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Only need to update every min now
    return () => clearInterval(timer);
  }, [fetchTimetable]);

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
          <View className="items-center px-6 pb-8">
            <View 
              style={{ 
                width: cardWidth, 
                aspectRatio: 16 / 10,
                elevation: 10
              }}
              className={`${colors.surface} items-center justify-center rounded-[32px] border-2 border-brand-pink/30 border-dashed shadow-xl`}
            >
              <View className="items-center justify-center">
                <View className="bg-brand-pink/10 w-24 h-24 rounded-full items-center justify-center mb-5 border border-brand-pink/20">
                  <MaterialCommunityIcons name="bullhorn-variant-outline" size={48} color="#F472B6" />
                </View>
                <Text className={`text-xl font-black ${colors.text} tracking-tighter`}>All caught up! ✨</Text>
                <Text className={`mt-2 font-black text-brand-pink/40 uppercase text-[9px] tracking-[4px]`}>No New Notices</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView className={`flex-1 ${colors.background}`} showsVerticalScrollIndicator={false}>
      {/* Header - Blends with background */}
      <View className="px-6 pt-8 pb-4">
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

        {/* Attendance Status - Moved from Quick Actions */}
        <View className={`${colors.surface} rounded-[32px] p-5 mt-6 border ${colors.border} shadow-sm`}>
          <View className="flex-row justify-between mb-4 px-1">
            <Text className={`text-base font-black ${colors.text}`}>Attendance Status 🕙</Text>
            <View className="bg-brand-pink/10 px-2 py-0.5 rounded-full">
              <Text className="text-brand-pink text-[9px] font-black uppercase">Live Updates</Text>
            </View>
          </View>
          
          <View className="flex-row justify-between">
            {/* Clock In Status */}
            <View className={`${theme === 'dark' ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-500/10 border-blue-50'} rounded-2xl p-3 w-[48%] border`}>
              <View className="flex-row items-center mb-2">
                <View className="bg-blue-600 w-10 h-10 rounded-full items-center justify-center mr-2 border-2 border-blue-100 shadow-sm">
                  <MaterialCommunityIcons name="account-tie" size={20} color="white" />
                </View>
                <View>
                  <Text className={`font-black ${colors.text} text-[10px]`}>Father</Text>
                  <Text className={`text-[8px] ${colors.textTertiary} font-bold`}>08:30 AM</Text>
                </View>
              </View>
              <View className="bg-green-500/20 py-1 rounded-full items-center">
                <Text className="text-green-700 text-[8px] font-black uppercase tracking-tighter">✅ Clocked In</Text>
              </View>
            </View>

            {/* Clock Out Status */}
            <View className={`${theme === 'dark' ? 'bg-pink-500/10 border-pink-500/30' : 'bg-pink-500/10 border-pink-50'} rounded-2xl p-3 w-[48%] border`}>
              <View className="flex-row items-center mb-2">
                <View className="bg-pink-600 w-10 h-10 rounded-full items-center justify-center mr-2 border-2 border-pink-100 shadow-sm">
                  <MaterialCommunityIcons name="account-heart" size={20} color="white" />
                </View>
                <View>
                  <Text className={`font-black ${colors.text} text-[10px]`}>Mother</Text>
                  <Text className={`text-[8px] ${colors.textTertiary} font-bold`}>03:45 PM</Text>
                </View>
              </View>
              <View className="bg-brand-pink/20 py-1 rounded-full items-center">
                <Text className="text-brand-pink text-[8px] font-black uppercase tracking-tighter">👋 Clock Out</Text>
              </View>
            </View>
          </View>
        </View>
      </View>


      {/* ── Top Announcements (Legacy Place) ── */}
      {studentNotices.length > 0 && renderAnnouncements(studentNotices, 'Notice Board', 'notices')}

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
              <MaterialCommunityIcons name="toy-brick-outline" size={120} color="white" />
          </View>
      </TouchableOpacity>

      {/* Fun Quick Actions */}
      <View className="px-6 py-6">
        <Text className={`text-xl font-black ${colors.text} mb-4 ml-1 uppercase tracking-widest text-[10px]`}>School Portal 📸</Text>
        <View className="flex-row justify-between">
          <TouchableOpacity
            className={`${colors.surface} py-5 px-2 rounded-2xl shadow-sm items-center w-[31%] border ${colors.border}`}
            onPress={() => navigation.navigate('activityFeed')}
          >
            <View className="bg-brand-pink/10 p-3 rounded-full mb-2">
              <MaterialCommunityIcons name="image-multiple" size={26} color="#F472B6" />
            </View>
            <Text className={`text-[11px] font-bold ${colors.text} text-center uppercase`}>Activity</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`${colors.surface} py-5 px-2 rounded-2xl shadow-sm items-center w-[31%] border ${colors.border}`}
            onPress={() => navigation.navigate('timetable')}
          >
            <View className="bg-brand-yellow/10 p-3 rounded-full mb-2">
              <MaterialCommunityIcons name="calendar-clock" size={26} color="#B45309" />
            </View>
            <Text className={`text-[11px] font-bold ${colors.text} text-center uppercase`}>Timetable</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`${colors.surface} py-5 px-2 rounded-2xl shadow-sm items-center w-[31%] border ${colors.border}`}
            onPress={() => navigation.navigate('liveCamera')}
          >
            <View className={`${theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-100/10'} p-3 rounded-full mb-2`}>
              <MaterialCommunityIcons name="video-vintage" size={26} color="#3B82F6" />
            </View>
            <Text className={`text-[11px] font-bold ${colors.text} text-center`}>Live Feed</Text>
          </TouchableOpacity>
        </View>
      </View>



      <View className="px-6 pb-12">
        <View className="mb-10">
          <View className="flex-row items-center justify-between mb-4 px-1">
            <Text className={`text-xl font-black ${colors.text}`}>Financial Overview 💳</Text>
            <TouchableOpacity onPress={() => navigation.navigate('myFees')}>
              <Text className="text-brand-pink font-bold text-xs">Full Report</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            onPress={() => navigation.navigate('myFees')}
            style={{ elevation: 12 }}
            className={`${colors.surface} mx-1 rounded-[32px] p-6 border-2 ${theme === 'dark' ? 'border-green-500/40' : 'border-green-500/20'} shadow-xl flex-row items-center border-dashed`}
            activeOpacity={0.9}
          >
            <View className={`${theme === 'dark' ? 'bg-green-500/20 border-green-500/40' : 'bg-green-600/10 border-green-500/30'} w-16 h-16 rounded-[24px] items-center justify-center mr-5 border`}>
              <MaterialCommunityIcons name="currency-inr" size={36} color={theme === 'dark' ? '#4ADE80' : '#16A34A'} />
            </View>
            
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <Text className={`font-black ${colors.text} text-xl tracking-tighter`}>School Fees</Text>
                <View className={`${theme === 'dark' ? 'bg-green-500/20' : 'bg-green-500/10'} px-2.5 py-1 rounded-full ml-3`}>
                  <Text className={`${theme === 'dark' ? 'text-green-400' : 'text-green-600'} text-[9px] font-black uppercase`}>Active</Text>
                </View>
              </View>
              <Text className={`text-[10px] ${theme === 'dark' ? 'text-green-400/60' : 'text-green-700/50'} mb-2 font-black uppercase tracking-[2px]`}>Fees Overview</Text>
              
              <View className="flex-row items-baseline">
                <Text className={`${theme === 'dark' ? 'text-green-400' : 'text-green-600'} text-2xl font-black italic`}>₹{totalPending.toLocaleString()}</Text>
                <Text className={`text-[9px] ${colors.textTertiary} ml-2 font-black uppercase`}>Balance</Text>
              </View>
            </View>
            
            <View className="bg-brand-pink/10 p-2 rounded-xl">
              <MaterialCommunityIcons name="chevron-right" size={24} color="#F472B6" />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Empty Announcements (Bottom Place) ── */}
        {studentNotices.length === 0 && renderAnnouncements(studentNotices, 'Notice Board', 'notices')}
      </View>
    </ScrollView>
  );
}
