import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Image, Dimensions, ActivityIndicator } from 'react-native';
import PremiumPopup from '../../components/PremiumPopup';
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
  const [selectedNotice, setSelectedNotice] = useState<any>(null);

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
          // Only show as clocked in if there is an in_time but NO out_time
          setIsClockedIn(!!record.in_time && !record.out_time);
        } else {
          setClockInTime(null);
          setClockOutTime(null);
          setIsClockedIn(false);
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }} snapToInterval={Dimensions.get('window').width - 48 + 12} decelerationRate="fast">
        {list.length > 0 ? list.map((item) => (
          <TouchableOpacity 
            key={item.id} activeOpacity={0.9}
            style={{ width: Dimensions.get('window').width - 48, aspectRatio: 16 / 9 }}
            className="mr-3 bg-brand-pink relative overflow-hidden rounded-[32px] border-2 border-white shadow-xl"
            onPress={() => setSelectedNotice(item)}
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
          <View style={{ width: Dimensions.get('window').width - 48, aspectRatio: 16 / 9 }} className="bg-brand-pink/5 items-center justify-center rounded-[40px] border-2 border-brand-pink/10 border-dashed">
            <View className="bg-brand-pink/10 w-20 h-20 rounded-full items-center justify-center mb-4">
              <MaterialCommunityIcons name="bullhorn-variant-outline" size={42} color="#F472B6" />
            </View>
            <Text className={`text-xl font-black ${colors.text} tracking-tighter`}>All Quiet ✨</Text>
            <Text className="mt-1 font-black text-brand-pink/40 uppercase text-[8px] tracking-[3px]">No Active {hint}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );


  return (
    <View 
        className={`flex-1 ${theme === 'dark' ? 'bg-[#1c1c14]' : 'bg-white'}`}
        style={{ backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF' }}
    >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
          {/* ── Background Gradient & 3D Illustration ── */}
          <View className="absolute top-0 left-0 right-0 h-[500px] overflow-hidden">
            <LinearGradient
                colors={[theme === 'dark' ? '#1e3a8a' : '#FDF2F8', theme === 'dark' ? '#1c1c14' : '#FFFFFF']}
                className="absolute inset-0"
            />
            <Image 
                source={require('../../assets/images/playschool_3d.png')} 
                style={{ width: '100%', height: '100%', opacity: theme === 'dark' ? 0.15 : 0.25, transform: [{ scale: 1.3 }, { translateY: -30 }] }}
                resizeMode="cover"
            />
            <View className="absolute -top-20 -left-20 w-80 h-80 bg-brand-pink/10 rounded-full blur-3xl" />
            
            <LinearGradient
                colors={['transparent', theme === 'dark' ? '#1c1c14' : '#FFFFFF']}
                className="absolute bottom-0 left-0 right-0 h-60"
            />
          </View>

          {/* Header */}
          <View className="px-6 pt-12 pb-6">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className={`text-xl font-black ${colors.textSecondary} uppercase tracking-[3px]`}>
                  Educator Hub 🍎
                </Text>
                <View className="flex-row items-center mt-1">
                  <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>
                    {user?.name || 'Teacher'}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('profile')}
                    className="ml-3 bg-brand-pink/10 p-2.5 rounded-2xl"
                  >
                    <MaterialCommunityIcons name="pencil-box-multiple-outline" size={22} color="#F472B6" />
                  </TouchableOpacity>
                </View>
                <View className="bg-brand-pink/20 self-start px-4 py-1.5 rounded-full mt-3 border border-brand-pink/10 shadow-sm">
                    <Text className="text-brand-pink text-[10px] font-black uppercase tracking-[2px]">Core Faculty</Text>
                </View>
              </View>
              <TouchableOpacity 
                className="bg-brand-yellow w-24 h-24 rounded-[36px] items-center justify-center shadow-2xl border-4 border-white rotate-3 relative overflow-hidden"
                onPress={updateAvatar}
              >
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <MaterialCommunityIcons name="face-woman-outline" size={48} color="#92400E" />
                )}
                <View className="absolute -bottom-1 -right-1 bg-brand-pink p-2 rounded-xl border-2 border-white">
                  <MaterialCommunityIcons name="camera" size={14} color="white" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Admin Notices ── */}
          {teacherNotices.length > 0 && renderAnnouncements(teacherNotices, 'Official Notices', 'notices')}

          {/* Quick Stats - Premium Cards */}
          <View className="px-6 py-4 flex-row justify-between">
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => navigation.navigate('studentList')}
              className="w-[48%] rounded-[40px] overflow-hidden shadow-2xl"
              style={{ elevation: 15 }}
            >
              <LinearGradient
                  colors={theme === 'dark' ? ['#1e40af', '#1e1b4b'] : ['#FBBF24', '#D97706']}
                  className="p-6 h-40 justify-between"
              >
                <View className="flex-row justify-between items-start">
                  <View className="bg-white/20 p-2.5 rounded-2xl">
                    <MaterialCommunityIcons name="account-group-outline" size={28} color="white" />
                  </View>
                  <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest">My Class</Text>
                </View>
                <View>
                  <Text className="text-white text-5xl font-black font-mono tracking-tighter">{studentStats.total}</Text>
                  <Text className="text-white/80 text-[11px] font-black uppercase mt-1 tracking-widest">Total Kids</Text>
                </View>
                <View className="absolute -bottom-6 -right-6 opacity-10">
                  <MaterialCommunityIcons name="baby-face-outline" size={100} color="white" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => navigation.navigate('takeAttendance')}
              className="w-[48%] rounded-[40px] overflow-hidden shadow-2xl"
              style={{ elevation: 15 }}
            >
              <LinearGradient
                  colors={theme === 'dark' ? ['#701a75', '#4a044e'] : ['#F472B6', '#BE185D']}
                  className="p-6 h-40 justify-between"
              >
                <View className="flex-row justify-between items-start">
                  <View className="bg-white/20 p-2.5 rounded-2xl">
                    <MaterialCommunityIcons name="account-check-outline" size={28} color="white" />
                  </View>
                  <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest">Attendance</Text>
                </View>
                <View>
                  <Text className="text-white text-5xl font-black font-mono tracking-tighter">{studentStats.present}</Text>
                  <Text className="text-white/80 text-[11px] font-black uppercase mt-1 tracking-widest">Present Now</Text>
                </View>
                <View className="absolute -bottom-6 -right-6 opacity-10">
                  <MaterialCommunityIcons name="check-decagram" size={100} color="white" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Today's Pulse Card */}
          <View className="px-6 mt-6">
            <View className="flex-row items-center justify-between mb-4 px-1">
                <Text className={`text-xl font-black ${colors.text} tracking-tighter`}>Teaching Pulse 📡</Text>
                <TouchableOpacity onPress={() => navigation.navigate('timetable')}>
                    <Text className="text-brand-pink font-bold text-xs tracking-tighter">View Timetable</Text>
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
                        <MaterialCommunityIcons name="calendar-clock" size={14} color="white" />
                      </View>
                      <Text className="text-white font-black uppercase text-[10px] tracking-[2px] opacity-80">
                        {todaySchedule ? "Ongoing Session" : "Operations Ready"}
                      </Text>
                    </View>
                    <Text className="text-white text-2xl font-black mt-2 tracking-tighter" numberOfLines={1}>
                      {todaySchedule ? todaySchedule.activity : "No sessions mentioned"}
                    </Text>
                    <View className="flex-row items-center mt-4">
                      <View className="bg-white/20 self-start px-4 py-2 rounded-2xl flex-row items-center mr-3 border border-white/10">
                         <MaterialCommunityIcons name="clock-outline" size={14} color="white" />
                         <Text className="text-white text-[12px] font-black ml-2" numberOfLines={1}>
                           {todaySchedule ? todaySchedule.time : "Standby"}
                         </Text>
                      </View>
                      <View className="bg-white/20 self-start px-4 py-2 rounded-2xl flex-row items-center border border-white/10">
                         <MaterialCommunityIcons name="map-marker-outline" size={14} color="white" />
                         <Text className="text-white text-[12px] font-black ml-2" numberOfLines={1}>
                            {todaySchedule ? (todaySchedule.room || 'Classroom') : "Main Site"}
                         </Text>
                      </View>
                    </View>
                  </View>
                  <View className="bg-white/30 w-18 h-18 rounded-[28px] items-center justify-center border-4 border-white/10 shadow-lg rotate-6">
                    <MaterialCommunityIcons 
                      name={todaySchedule ? (todaySchedule.icon || "book-open-variant") : "calendar-blank"} 
                      size={42} 
                      color="white" 
                    />
                  </View>
                </View>
                <View className="absolute -bottom-6 -right-6 opacity-10">
                  <MaterialCommunityIcons name="pencil-ruler" size={150} color="white" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Quick Actions Panel */}
          <View className="px-6 py-8">
            <View className="flex-row items-center justify-between mb-6 px-1">
                <Text className={`text-xl font-black ${colors.text} tracking-tighter`}>Daily Actions ⚙️</Text>
                <View className="bg-brand-pink/10 px-3 py-1 rounded-full">
                    <Text className="text-brand-pink text-[9px] font-black uppercase tracking-widest">Faculty Tools</Text>
                </View>
            </View>

            <View className="flex-row justify-between">
              {[
                { label: 'Attendance', icon: 'calendar-check', color: '#F472B6', bg: 'bg-brand-pink/10', screen: 'takeAttendance' },
                { label: 'Post Activity', icon: 'camera-plus', color: '#EAB308', bg: 'bg-brand-yellow/10', screen: 'postActivity' },
                { label: 'Highlights', icon: 'newspaper-variant', color: '#10B981', bg: 'bg-green-100/10', screen: 'activityFeed' }
              ].map((action, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.9}
                  className={`${theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white'} py-6 px-2 rounded-3xl shadow-xl items-center w-[31%] border ${theme === 'dark' ? 'border-gray-800' : 'border-gray-50'}`}
                  onPress={() => navigation.navigate(action.screen as any)}
                >
                  <View className={`${action.bg} p-4 rounded-2xl mb-3`}>
                    <MaterialCommunityIcons name={action.icon as any} size={28} color={action.color} />
                  </View>
                  <Text className={`text-[10px] font-black ${colors.text} text-center uppercase tracking-tighter`}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Teacher Duty Log - Premium Card */}
          <View className="px-6 pb-12">
            <View className="flex-row items-center justify-between mb-6 px-1">
                <Text className={`text-xl font-black ${colors.text} tracking-tighter`}>Duty Log 📅</Text>
                <View className="bg-brand-pink/10 px-3 py-1 rounded-full">
                    <Text className="text-brand-pink text-[9px] font-black uppercase tracking-widest">Official Entry</Text>
                </View>
            </View>

            {isLoading ? (
              <ActivityIndicator size="large" color="#F472B6" className="my-10" />
            ) : (
              <View className={`${theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white'} p-8 rounded-[40px] shadow-2xl border ${theme === 'dark' ? 'border-gray-800' : 'border-brand-pink/10'} relative overflow-hidden`}>
                <View className="flex-row justify-between mb-8">
                  <View className={`${theme === 'dark' ? 'bg-white/5' : 'bg-yellow-50/50'} p-5 rounded-3xl flex-1 mr-2 items-center border ${theme === 'dark' ? 'border-white/5' : 'border-yellow-100'}`}>
                    <Text className={`text-[9px] font-black uppercase text-amber-600 tracking-[3px]`}>Clock In</Text>
                    <Text className={`text-2xl font-black ${colors.text} mt-2`}>{clockInTime || '--:--'}</Text>
                  </View>
                  <View className={`${theme === 'dark' ? 'bg-white/5' : 'bg-pink-50/50'} p-5 rounded-3xl flex-1 ml-2 items-center border ${theme === 'dark' ? 'border-white/5' : 'border-pink-100'}`}>
                    <Text className={`text-[9px] font-black uppercase text-brand-pink tracking-[3px]`}>Clock Out</Text>
                    <Text className={`text-2xl font-black ${colors.text} mt-2`}>{clockOutTime || '--:--'}</Text>
                  </View>
                </View>

                {!clockInTime ? (
                  <TouchableOpacity
                    onPress={handleClockIn}
                    activeOpacity={0.9}
                    className="overflow-hidden rounded-[32px] shadow-xl"
                  >
                    <LinearGradient
                      colors={['#F472B6', '#BE185D']}
                      className="py-6 items-center flex-row justify-center"
                    >
                      <MaterialCommunityIcons name="login-variant" size={24} color="white" />
                      <Text className="text-white font-black text-xl ml-3 uppercase tracking-tighter">Start Duty</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : !clockOutTime ? (
                  <TouchableOpacity
                    onPress={handleClockOut}
                    activeOpacity={0.9}
                    className="overflow-hidden rounded-[32px] shadow-xl"
                  >
                    <LinearGradient
                      colors={['#FBBF24', '#D97706']}
                      className="py-6 items-center flex-row justify-center"
                    >
                      <MaterialCommunityIcons name="logout-variant" size={24} color="#92400E" />
                      <Text className="text-amber-900 font-black text-xl ml-3 uppercase tracking-tighter">End Duty</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <View className="bg-green-500/10 py-6 rounded-3xl items-center border border-green-500/20 flex-row justify-center">
                      <MaterialCommunityIcons name="check-decagram-outline" size={32} color="#10B981" />
                      <Text className="text-green-600 font-black text-lg ml-3 tracking-tighter">Duty Logged ✨</Text>
                  </View>
                )}
                
                <View className="absolute -bottom-4 -right-4 opacity-5">
                   <MaterialCommunityIcons name="clipboard-check" size={120} color={colors.text} />
                </View>
              </View>
            )}


          </View>
        </ScrollView>

        <PremiumPopup
          visible={!!selectedNotice}
          onClose={() => setSelectedNotice(null)}
          title={selectedNotice?.title || ''}
          message={selectedNotice?.content}
          type="info"
          icon="bullhorn"
        >
          {selectedNotice?.date && (
            <View className="bg-blue-50/50 dark:bg-blue-500/10 self-center px-4 py-1.5 rounded-full border border-blue-100 dark:border-blue-500/20 mb-4 flex-row items-center">
              <MaterialCommunityIcons name="calendar-clock" size={12} color="#3B82F6" />
              <Text className="text-blue-500 text-[10px] font-black uppercase tracking-widest ml-2">{selectedNotice.date}</Text>
            </View>
          )}
          {selectedNotice?.image && (
            <Image 
              source={{ uri: selectedNotice.image }} 
              style={{ width: '100%', height: 200, borderRadius: 24, marginBottom: 16 }}
              resizeMode="cover"
            />
          )}
        </PremiumPopup>
    </View>
  );
}
