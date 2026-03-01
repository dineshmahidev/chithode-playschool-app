import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Image, Dimensions, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface TeacherHomeScreenProps {
  navigation: NavigationProps;
}

export default function TeacherHomeScreen({ navigation }: TeacherHomeScreenProps) {
  const { user, announcements, updateAvatar, users } = useAuth();
  const { colors, theme } = useTheme();
  
  // Filter announcements for teachers
  const teacherNotices = announcements.filter(a => a.target === 'all' || a.target === 'teacher');
  const latestNotice = teacherNotices.length > 0 ? teacherNotices[0] : null;

  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [clockOutTime, setClockOutTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [studentStats, setStudentStats] = useState({ total: 0, present: 0 });
  const [todaySchedule, setTodaySchedule] = useState<any>(null);

  const fetchStudentStats = useCallback(async () => {
    try {
      const response = await api.get('/attendance');
      const today = new Date().toISOString().split('T')[0];
      const todayRecords = response.data.filter((r: any) => r.date === today && r.user_role === 'student');
      const presentCount = todayRecords.filter((r: any) => r.status === 'present').length;
      
      const totalStudents = users.filter(u => u.role === 'student').length;
      setStudentStats({ 
        total: totalStudents || 0,
        present: presentCount 
      });
    } catch (err) {
      console.error('Fetch Stats Error:', err);
    }
  }, [users]);

  const fetchTimetable = useCallback(async () => {
    try {
      const response = await api.get('/timetable');
      const todayNum = new Date().getDay();
      const dayIndex = todayNum === 0 ? 6 : todayNum - 1;
      const filtered = response.data.filter((s: any) => s.day === dayIndex);
      
      if (filtered.length > 0) {
        // Function to convert "HH:MM AM/PM" to total minutes for comparison
        const timeToMinutes = (timeStr: string) => {
          const [time, period] = timeStr.split(' ');
          let [hours, minutes] = time.split(':').map(Number);
          if (period === 'PM' && hours !== 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;
          return hours * 60 + minutes;
        };

        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        
        // Sort by time
        const sorted = filtered.sort((a: any, b: any) => timeToMinutes(a.time) - timeToMinutes(b.time));
        
        // Find first session that hasn't finished yet (assuming 1 hour duration or just start time)
        const currentOrNext = sorted.find((s: any) => timeToMinutes(s.time) >= nowMinutes - 30); // 30 min grace period
        
        setTodaySchedule(currentOrNext || null);
      } else {
        setTodaySchedule(null);
      }
    } catch (err) {
      console.error('Fetch Timetable Error:', err);
    }
  }, []);

  const fetchTodayAttendance = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get(`/attendance?student_id=${user.id}&date=${today}`);
      if (response.data && response.data.length > 0) {
        const record = response.data.find((r: any) => r.user_role === 'teacher' || !r.user_role); // fallback
        if (record) {
          setClockInTime(record.in_time);
          setClockOutTime(record.out_time);
          setIsClockedIn(!!record.in_time && !record.out_time);
        }
      }
      await Promise.all([
        fetchStudentStats(),
        fetchTimetable()
      ]);
    } catch (err) {
      console.error('Fetch Attendance Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchStudentStats]);

  useEffect(() => {
    fetchTodayAttendance();
  }, [fetchTodayAttendance]);

  const handleClockIn = async () => {
    if (!user) return;
    try {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const today = now.toISOString().split('T')[0];
      
      const payload = {
        student_id: user.id,
        date: today,
        status: 'present',
        in_time: timeString,
        user_role: 'teacher'
      };

      await api.post('/attendance', payload);
      setClockInTime(timeString);
      setIsClockedIn(true);
      Alert.alert('Success 🎉', `You clocked in at ${timeString}`);
    } catch (err) {
      Alert.alert('Error', 'Failed to clock in. Please try again.');
    }
  };

  const handleClockOut = async () => {
    if (!user) return;
    try {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const today = now.toISOString().split('T')[0];
      
      const payload = {
        student_id: user.id,
        date: today,
        status: 'present',
        in_time: clockInTime,
        out_time: timeString,
        user_role: 'teacher'
      };

      await api.post('/attendance', payload);
      setClockOutTime(timeString);
      setIsClockedIn(false);
      Alert.alert('Done! 👋', `You clocked out at ${timeString}. Great job today!`);
    } catch (err) {
      Alert.alert('Error', 'Failed to clock out.');
    }
  };

  const renderAnnouncements = (list: any[], sectionTitle: string, hint: string) => (
    <View className="px-6 py-2">
      <View className="flex-row items-center justify-between mb-4">
        <Text className={`text-xl font-black ${colors.text} uppercase tracking-widest opacity-60`}>{sectionTitle} 📢</Text>
        {list.length > 1 && (
          <Text className={`text-xs font-bold ${colors.textTertiary}`}>Swipe for more</Text>
        )}
      </View>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} className="overflow-hidden rounded-[32px]">
        {list.length > 0 ? list.map((item) => (
          <TouchableOpacity 
            key={item.id} activeOpacity={0.9}
            style={{ width: Dimensions.get('window').width - 48, aspectRatio: 16 / 9 }}
            className="mr-3 bg-brand-pink relative overflow-hidden rounded-[32px] border-4 border-white shadow-xl"
            onPress={() => Alert.alert(item.title, item.content)}
          >
            {item.image ? <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : (
              <View className="flex-1 items-center justify-center bg-brand-pink/20">
                <MaterialCommunityIcons name="bullhorn-outline" size={64} color="#F472B6" />
              </View>
            )}
            <View className="absolute inset-0 bg-black/30 justify-end p-6">
              <View className="bg-white/20 self-start px-3 py-1 rounded-full mb-2">
                <Text className="text-white text-[10px] font-black uppercase tracking-widest">{item.date}</Text>
              </View>
              <Text className="text-white text-2xl font-black tracking-tighter" numberOfLines={2}>{item.title}</Text>
              <View className="flex-row items-center mt-1">
                <MaterialCommunityIcons name="account-circle-outline" size={14} color="white" />
                <Text className="text-white/80 text-xs font-bold ml-1">{item.author || 'Admin'}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )) : (
          <View style={{ width: Dimensions.get('window').width - 48, aspectRatio: 16 / 9 }} className="bg-brand-pink/10 items-center justify-center rounded-[32px] border-4 border-white border-dashed">
            <MaterialCommunityIcons name="bullhorn-variant-outline" size={48} color="#F472B6" />
            <Text className={`mt-4 font-bold ${colors.textTertiary}`}>No current {hint}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );


  return (
    <ScrollView className={`flex-1 ${colors.background}`} showsVerticalScrollIndicator={false}>
      {/* Header - Blends with background */}
      <View className="px-6 pt-8 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>
              Welcome,
            </Text>
            <Text className={`text-2xl font-bold text-brand-pink`}>
              {user?.name || 'Teacher'}!
            </Text>
          </View>
          <TouchableOpacity 
            className="bg-brand-yellow w-20 h-20 rounded-3xl items-center justify-center shadow-lg border-4 border-white rotate-3 relative overflow-hidden"
            onPress={updateAvatar}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <MaterialCommunityIcons name="account-tie" size={42} color="#92400E" />
            )}
            <View className="absolute -bottom-1 -right-1 bg-brand-pink p-1.5 rounded-lg border-2 border-white">
              <MaterialCommunityIcons name="camera" size={14} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Top Announcements  ── */}
      {teacherNotices.length > 0 && renderAnnouncements(teacherNotices, 'Admin Notices', 'notices')}


      {/* Quick Stats */}
      <View className="px-6 py-4">
        <View className="flex-row justify-between">
          <TouchableOpacity 
            onPress={() => navigation.navigate('studentList')}
            activeOpacity={0.7}
            className={`${colors.surface} p-5 rounded-[28px] shadow-sm flex-1 mr-2 border ${colors.border}`}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-4xl font-black text-yellow-600 font-mono">{studentStats.total}</Text>
              <View className={`${theme === 'dark' ? 'bg-yellow-500/10' : 'bg-yellow-100/50'} p-2 rounded-2xl`}>
                <MaterialCommunityIcons name="account-group" size={28} color="#B45309" />
              </View>
            </View>
            <Text className={`${colors.textSecondary} text-[10px] font-black uppercase tracking-widest`}>My Students</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.navigate('takeAttendance')}
            activeOpacity={0.7}
            className={`${colors.surface} p-5 rounded-[28px] shadow-sm flex-1 ml-2 border ${colors.border}`}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-4xl font-black text-brand-pink font-mono">{studentStats.present}</Text>
              <View className={`${theme === 'dark' ? 'bg-pink-500/10' : 'bg-pink-100/50'} p-2 rounded-2xl`}>
                <MaterialCommunityIcons name="account-check" size={28} color="#F472B6" />
              </View>
            </View>
            <Text className={`${colors.textSecondary} text-[10px] font-black uppercase tracking-widest`}>Present</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Today's Schedule */}
      <View className={`mx-6 mt-2 ${todaySchedule ? todaySchedule.color || 'bg-brand-pink' : 'bg-gray-400'} rounded-2xl p-5 shadow-lg`}>
        <View className="flex-row items-center justify-between">
          <View className="flex-1 mr-4">
            <View className="flex-row items-center mb-1">
              <MaterialCommunityIcons name="calendar-clock" size={16} color="white" />
              <Text className="text-white font-bold uppercase text-xs tracking-wider ml-2">
                {todaySchedule ? "Next Session" : "Today's Schedule"}
              </Text>
            </View>
            <Text className="text-white text-xl font-bold mt-1" numberOfLines={1}>
              {todaySchedule ? todaySchedule.activity : "No schedule mentioned"}
            </Text>
            {todaySchedule && (
              <View className="flex-row items-center mt-1 opacity-90">
                <MaterialCommunityIcons name="clock-outline" size={14} color="white" />
                <Text className="text-white text-sm ml-1" numberOfLines={1}>
                  {todaySchedule.time} • {todaySchedule.room || 'Classroom'}
                </Text>
              </View>
            )}
          </View>
          <View className="bg-white/20 p-3 rounded-2xl">
            <MaterialCommunityIcons 
              name={todaySchedule ? (todaySchedule.icon || "book-open-variant") : "calendar-blank"} 
              size={32} 
              color="white" 
            />
          </View>
        </View>
      </View>

      {/* Quick Action Panel */}
      <View className="px-6 py-6" id="teacher-actions">
        <Text className={`text-lg font-semibold ${colors.text} mb-4`}>Quick Actions</Text>
        <View className="flex-row justify-between">
          <TouchableOpacity
            className={`${colors.surface} py-5 px-2 rounded-2xl shadow-sm items-center w-[31%] border ${colors.border}`}
            onPress={() => navigation.navigate('takeAttendance')}
          >
            <View className="bg-brand-pink/10 p-3 rounded-full mb-2">
              <MaterialCommunityIcons name="calendar-check" size={26} color="#F472B6" />
            </View>
            <Text className={`text-[11px] font-bold ${colors.text} text-center`}>Take Attendance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`${colors.surface} py-5 px-2 rounded-2xl shadow-sm items-center w-[31%] border ${colors.border}`}
            onPress={() => navigation.navigate('postActivity')}
          >
            <View className="bg-brand-yellow/10 p-3 rounded-full mb-2">
              <MaterialCommunityIcons name="camera-plus" size={26} color="#EAB308" />
            </View>
            <Text className={`text-[11px] font-bold ${colors.text} text-center`}>Post Activity</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`${colors.surface} py-5 px-2 rounded-2xl shadow-sm items-center w-[31%] border ${colors.border}`}
            onPress={() => navigation.navigate('activityFeed')}
          >
            <View className={`${theme === 'dark' ? 'bg-amber-500/10' : 'bg-yellow-100'} p-3 rounded-full mb-2`}>
              <MaterialCommunityIcons name="newspaper-variant-outline" size={26} color="#B45309" />
            </View>
            <Text className={`text-[11px] font-bold ${colors.text} text-center`}>Activity Feed</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Official Attendance - Modified to exclude remarks as requested */}
      <View className="px-6 pb-12">
        <View className={`${colors.surface} p-6 rounded-[32px] shadow-xl border ${colors.border}`}>
          <Text className={`text-xl font-black ${colors.text} mb-4`}>Teacher Duty Log</Text>
          
          {isLoading ? (
            <ActivityIndicator size="large" color="#F472B6" className="my-10" />
          ) : (
            <>
              <View className="flex-row justify-between mb-8">
                <View className={`${theme === 'dark' ? 'bg-amber-900/10' : 'bg-yellow-50/50'} p-4 rounded-2xl flex-1 mr-2 items-center`}>
                  <Text className={`text-[10px] font-black uppercase text-amber-600 tracking-widest`}>Clock In</Text>
                  <Text className={`text-xl font-black ${colors.text} mt-1`}>{clockInTime || '--:--'}</Text>
                </View>
                <View className={`${theme === 'dark' ? 'bg-pink-900/10' : 'bg-pink-50/50'} p-4 rounded-2xl flex-1 ml-2 items-center`}>
                  <Text className={`text-[10px] font-black uppercase text-brand-pink tracking-widest`}>Clock Out</Text>
                  <Text className={`text-xl font-black ${colors.text} mt-1`}>{clockOutTime || '--:--'}</Text>
                </View>
              </View>

              {!clockInTime ? (
                <TouchableOpacity
                  onPress={handleClockIn}
                  className="bg-brand-pink py-5 rounded-2xl items-center shadow-lg active:scale-95"
                >
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons name="login" size={24} color="white" />
                    <Text className="text-white font-black text-lg ml-2 uppercase tracking-widest">Start Duty</Text>
                  </View>
                </TouchableOpacity>
              ) : !clockOutTime ? (
                <TouchableOpacity
                  onPress={handleClockOut}
                  className="bg-brand-yellow py-5 rounded-2xl items-center shadow-lg active:scale-95"
                >
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons name="logout" size={24} color="#92400E" />
                    <Text className="text-amber-900 font-black text-lg ml-2 uppercase tracking-widest">End Duty</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View className="bg-green-100 py-6 rounded-2xl items-center border border-green-200">
                   <View className="flex-row items-center">
                    <MaterialCommunityIcons name="check-decagram" size={28} color="#059669" />
                    <Text className="text-green-700 font-black text-lg ml-2">Duty Logged Successfully! ✨</Text>
                  </View>
                </View>
              )}
            </>
          )}
        </View>

        {/* ── Empty Announcements ── */}
        {teacherNotices.length === 0 && renderAnnouncements(teacherNotices, 'Admin Notices', 'notices')}
      </View>
    </ScrollView>
  );
}
