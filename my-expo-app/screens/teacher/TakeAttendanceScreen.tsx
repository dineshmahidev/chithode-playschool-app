import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, Image, Dimensions, Modal, ActivityIndicator, FlatList, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface TakeAttendanceScreenProps {
  navigation: any;
}

interface StudentAttendance {
  id: string;
  status: 'present' | 'absent' | 'late' | 'not_marked';
  inTime: string | null;
  outTime: string | null;
  droppedBy?: string;
  droppedByType?: 'Mother' | 'Father' | 'Guardian';
  pickedBy?: string;
  pickedByType?: 'Mother' | 'Father' | 'Guardian';
}

const StudentCard = React.memo(({ 
  student, 
  record, 
  colors, 
  onTap, 
  onLongPress 
}: { 
  student: any, 
  record: StudentAttendance | undefined, 
  colors: any,
  onTap: (id: string) => void,
  onLongPress?: (id: string) => void
}) => {
  const { theme: appTheme } = useTheme();
  const isAbsent = record?.status === 'absent';
  const isIn = !!record?.inTime;
  const isOut = !!record?.outTime;

  const borderColor = useMemo(() => {
    if (isAbsent) return '#EF4444';
    if (isOut) return '#10B981';
    if (isIn) return '#10B981';
    return '#F472B6';
  }, [isAbsent, isIn, isOut]);

  return (
    <TouchableOpacity 
      onPress={() => onTap(student.id)}
      onLongPress={onLongPress ? () => onLongPress(student.id) : undefined}
      delayLongPress={500}
      activeOpacity={0.9}
      className={`${colors.surface} rounded-[32px] p-4 mb-4 border-b-4 ${isAbsent ? 'border-red-500 bg-red-900/10' : colors.border} shadow-sm`}
    >
      <View className="flex-row items-center">
        <View className="relative">
          {student.avatar ? (
            <Image 
              source={{ uri: student.avatar }} 
              className="w-16 h-16 rounded-2xl border-4"
              style={{ borderColor }}
            />
          ) : (
            <View 
              className={`w-16 h-16 rounded-2xl items-center justify-center border-4 ${isAbsent ? (appTheme === 'dark' ? 'bg-red-900/20' : 'bg-red-50') : (appTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100')}`}
              style={{ borderColor }}
            >
              <MaterialCommunityIcons name="account-school" size={32} color={isAbsent ? '#EF4444' : (isIn ? '#10B981' : '#F472B6')} />
            </View>
          )}
          {isAbsent && (
            <View className="absolute inset-0 bg-red-500/20 rounded-2xl items-center justify-center">
              <MaterialCommunityIcons name="close-thick" size={24} color="#EF4444" />
            </View>
          )}
          {isIn && !isAbsent && (
            <View className="absolute -top-1 -right-1 bg-green-500 rounded-full w-5 h-5 items-center justify-center border-2 border-white dark:border-gray-900">
              <MaterialCommunityIcons name="check" size={12} color="white" />
            </View>
          )}
        </View>

        <View className="flex-1 ml-4 justify-center">
          <Text className={`font-black text-lg ${isAbsent ? 'text-red-500 line-through opacity-70' : colors.text}`} numberOfLines={1}>
            {student.name}
          </Text>
          <View className="flex-row items-center mt-2">
            <View className={`${isAbsent ? (appTheme === 'dark' ? 'bg-red-900/30' : 'bg-red-100') : (isIn ? (appTheme === 'dark' ? 'bg-green-900/30' : 'bg-green-100') : 'bg-brand-pink/10')} px-2 py-0.5 rounded-lg mr-2`}>
              <Text className={`text-[9px] font-black ${isAbsent ? 'text-red-400' : (isIn ? 'text-green-500' : 'text-brand-pink')}`}>
                ID: {student.studentId || student.student_id || 'N/A'}
              </Text>
            </View>
          </View>

          {(isIn || isOut) && !isAbsent && (
            <View className="flex-row flex-wrap mt-3 gap-2">
              {isIn && (
                <View className={`${appTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100/50'} px-3 py-1.5 rounded-xl flex-row items-center border ${appTheme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                  <MaterialCommunityIcons name="login" size={12} color="#10B981" />
                  <Text className={`text-[10px] font-black ${colors.textSecondary} ml-1`}>
                    {record?.droppedByType}: {record?.inTime}
                  </Text>
                </View>
              )}
              {isOut && (
                <View className={`${appTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100/50'} px-3 py-1.5 rounded-xl flex-row items-center border ${appTheme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                  <MaterialCommunityIcons name="logout" size={12} color="#F59E0B" />
                  <Text className={`text-[10px] font-black ${colors.textSecondary} ml-1`}>
                    {record?.pickedByType}: {record?.outTime}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View className="items-end">
          {isIn && (
            <View className="items-end">
              <Text className="text-[10px] font-black text-green-500 uppercase tracking-tighter">In: {record?.inTime}</Text>
              {isOut && <Text className="text-[10px] font-black text-orange-500 uppercase mt-1 tracking-tighter">Out: {record?.outTime}</Text>}
            </View>
          )}
          {isAbsent && (
            <View className="bg-red-500 px-3 py-1 rounded-full">
              <Text className="text-white text-[9px] font-black uppercase">Absent</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}, (prev, next) => {
  return prev.student.id === next.student.id && 
         prev.record?.status === next.record?.status &&
         prev.record?.inTime === next.record?.inTime &&
         prev.record?.outTime === next.record?.outTime &&
         prev.colors.surface === next.colors.surface;
});

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getCurrentTime = () => {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const getTodayDateString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const EmptyList = React.memo(({ colors }: { colors: any }) => (
  <View className="items-center justify-center py-20">
    <MaterialCommunityIcons name="account-search-outline" size={60} color="#F472B6" style={{ opacity: 0.5 }} />
    <Text className={`mt-4 ${colors.textTertiary} font-black text-lg uppercase tracking-widest`}>No students found</Text>
  </View>
));

const MonthlyRecordCard = React.memo(({ record, colors }: { record: any, colors: any }) => {
  const { theme: appTheme } = useTheme();
  return (
  <View className={`${appTheme === 'dark' ? 'bg-[#1e1e1e]' : colors.surface} rounded-[28px] p-5 mb-3 border ${appTheme === 'dark' ? 'border-gray-800' : colors.border}`}>
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center">
        <View className={`${record.status === 'present' ? 'bg-green-500 shadow-sm' : (record.status === 'absent' ? 'bg-red-500 shadow-sm' : (appTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'))} w-10 h-10 rounded-xl items-center justify-center mr-4`}>
          <Text className="text-white font-black">{record.day}</Text>
        </View>
        <View>
          <Text className={`font-black ${colors.text} text-sm mb-1`}>{record.dayName}, {record.date}</Text>
          <View className={`self-start px-2 py-0.5 rounded-lg ${record.status === 'present' ? 'bg-green-500/10' : (record.status === 'absent' ? 'bg-red-500/10' : (appTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-500/10'))}`}>
            <Text className={`text-[8px] font-black uppercase ${record.status === 'present' ? 'text-green-500' : (record.status === 'absent' ? 'text-red-500' : colors.textTertiary)}`}>
                {record.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
      {record.status === 'present' && (
        <View className="items-end">
          <View className="flex-row items-center mb-1">
             <MaterialCommunityIcons name="login-variant" size={10} color="#10B981" />
             <Text className={`text-[9px] font-black text-green-500 ml-1`}>
                {record.clockInBy || 'In'}: {record.clockIn}
             </Text>
          </View>
          {record.clockOut && (
            <View className="flex-row items-center">
                <MaterialCommunityIcons name="logout-variant" size={10} color="#F472B6" />
                <Text className={`text-[9px] font-black text-pink-500 ml-1`}>
                {record.clockOutBy || 'Out'}: {record.clockOut}
                </Text>
            </View>
          )}
        </View>
      )}
    </View>
  </View>
  );
});

const ViewDropdown = React.memo(({ 
  activeTab, 
  onTabChange, 
  colors, 
  isOpen, 
  setIsOpen 
}: { 
  activeTab: 'day' | 'month', 
  onTabChange: (tab: 'day' | 'month') => void, 
  colors: any,
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) => {
  const { theme: appTheme } = useTheme();
  return (
  <View className="px-6 mb-6">
    <TouchableOpacity 
      onPress={() => setIsOpen(true)}
      activeOpacity={0.8}
      className={`${appTheme === 'dark' ? 'bg-[#1e1e1e]' : colors.surface} rounded-[24px] p-4 flex-row items-center justify-between border ${appTheme === 'dark' ? 'border-gray-800' : colors.border} shadow-sm`}
    >
      <View className="flex-row items-center">
        <View className={`${appTheme === 'dark' ? 'bg-pink-500/10' : 'bg-brand-pink/10'} w-10 h-10 rounded-2xl items-center justify-center mr-3`}>
          <MaterialCommunityIcons 
            name={activeTab === 'day' ? "calendar-today" : "calendar-month"} 
            size={20} 
            color="#F472B6" 
          />
        </View>
        <View>
          <Text className={`text-[10px] font-black uppercase tracking-widest ${colors.textTertiary}`}>Current View</Text>
          <Text className={`text-base font-black ${colors.text}`}>
            {activeTab === 'day' ? 'Daily Attendance' : 'Monthly Reports'}
          </Text>
        </View>
      </View>
      <MaterialCommunityIcons name="unfold-more-horizontal" size={24} color={colors.textTertiary} />
    </TouchableOpacity>

    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setIsOpen(false)}
    >
      <View className="flex-1 bg-black/90 justify-end">
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={() => setIsOpen(false)}
          className="absolute inset-0"
        />
        <View 
            style={{ backgroundColor: appTheme === 'dark' ? '#1a1a1a' : '#FFFFFF' }}
            className="rounded-t-[45px] p-6 pb-12 border-t border-white/5 shadow-2xl shadow-black"
        >
          <View className="items-center mb-6">
            <View className={`w-10 h-1.5 ${appTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} rounded-full mb-6`} />
            <Text className={`text-xl font-black ${colors.text}`}>Select Attendance View</Text>
          </View>

          <TouchableOpacity 
            onPress={() => {
              onTabChange('day');
              setIsOpen(false);
            }}
            activeOpacity={0.7}
            className={`flex-row items-center p-4 mb-3 rounded-3xl border-2 ${activeTab === 'day' ? 'border-brand-pink bg-brand-pink/5' : `border-transparent ${appTheme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'}`}`}
          >
            <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${activeTab === 'day' ? 'bg-brand-pink' : (appTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200')}`}>
              <MaterialCommunityIcons name="calendar-today" size={24} color={activeTab === 'day' ? 'white' : colors.textTertiary} />
            </View>
            <View className="flex-1">
              <Text className={`text-lg font-black ${activeTab === 'day' ? 'text-brand-pink' : colors.text}`}>Daily Roll Call</Text>
              <Text className={`text-[10px] ${colors.textTertiary} font-bold uppercase tracking-wider`}>Mark presence for today</Text>
            </View>
            {activeTab === 'day' && <MaterialCommunityIcons name="check-circle" size={22} color="#F472B6" />}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => {
              onTabChange('month');
              setIsOpen(false);
            }}
            activeOpacity={0.7}
            className={`flex-row items-center p-4 rounded-3xl border-2 ${activeTab === 'month' ? 'border-brand-pink bg-brand-pink/5' : `border-transparent ${appTheme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'}`}`}
          >
            <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${activeTab === 'month' ? 'bg-brand-pink' : (appTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200')}`}>
              <MaterialCommunityIcons name="calendar-month" size={24} color={activeTab === 'month' ? 'white' : colors.textTertiary} />
            </View>
            <View className="flex-1">
              <Text className={`text-lg font-black ${activeTab === 'month' ? 'text-brand-pink' : colors.text}`}>Performance Reports</Text>
              <Text className={`text-[10px] ${colors.textTertiary} font-bold uppercase tracking-wider`}>Analyze monthly history</Text>
            </View>
            {activeTab === 'month' && <MaterialCommunityIcons name="check-circle" size={22} color="#F472B6" />}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  </View>
  );
});

export default function TakeAttendanceScreen({ navigation }: TakeAttendanceScreenProps) {
  const { colors, theme: appTheme } = useTheme();
  const { users } = useAuth();
  const [activeTab, setActiveTab] = useState<'day' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [selectedStudentForMonthly, setSelectedStudentForMonthly] = useState<any | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, StudentAttendance>>({});
  const [monthlyRecords, setMonthlyRecords] = useState<any[]>([]);
  const [guardianModalVisible, setGuardianModalVisible] = useState(false);
  const [markingStudentId, setMarkingStudentId] = useState<string | null>(null);
  const [markingType, setMarkingType] = useState<'IN' | 'OUT'>('IN');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [isMonthlyLoading, setIsMonthlyLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Synchronous ref for all state-dependent callbacks to keep them stable
  const stateRef = useRef({ attendanceRecords, users, colors });
  stateRef.current = { attendanceRecords, users, colors };

  // Stabilize students list
  const students = useMemo(() => {
    return users.filter(u => u.role === 'student');
  }, [users]);

  // Attendance summary calculated only when records change
  const attendanceSummary = useMemo(() => {
    const records = Object.values(attendanceRecords || {});
    const totalCount = students?.length || 0;
    return {
      total: totalCount,
      in: records.filter(r => !!r.inTime).length,
      out: records.filter(r => !!r.outTime).length,
      absent: records.filter(r => r.status === 'absent').length
    };
  }, [attendanceRecords, students]);

  // Fetch attendance records for the selected day
  useEffect(() => {
    let isMounted = true;
    const fetchDayAttendance = async () => {
      try {
        setInitialLoading(true);
        const response = await api.get(`/attendance?date=${selectedDate}`);
        if (!isMounted) return;
        
        const data = response.data;
        const records: Record<string, StudentAttendance> = {};
        data.forEach((item: any) => {
          records[item.student_id] = {
            id: item.student_id.toString(),
            status: item.status,
            inTime: item.in_time,
            outTime: item.out_time,
            droppedBy: item.dropped_by_name,
            droppedByType: item.dropped_by_type,
            pickedBy: item.picked_by_name,
            pickedByType: item.picked_by_type
          };
        });
        setAttendanceRecords(records);
      } catch (error) {
        console.error('Error fetching attendance:', error);
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    };

    if (activeTab === 'day') fetchDayAttendance();
    return () => { isMounted = false; };
  }, [selectedDate, activeTab]);

  const markPresent = useCallback((studentId: string, guardianType: 'Mother' | 'Father' | 'Guardian') => {
    const time = getCurrentTime();
    const { users: currentUsers } = stateRef.current;
    const student = currentUsers.find(u => u.id === studentId);
    let guardianName = 'Guardian';
    
    if (guardianType === 'Father') {
      guardianName = (student as any)?.fatherName || (student as any)?.parentName || 'Father';
    } else if (guardianType === 'Mother') {
      guardianName = (student as any)?.motherName || 'Mother';
    } else {
      guardianName = (student as any)?.guardianName || (student as any)?.parentName || 'Guardian';
    }
    
    setAttendanceRecords(prev => {
      const current = prev[studentId];
      if (markingType === 'IN') {
        return {
          ...prev,
          [studentId]: {
            id: studentId,
            status: 'present',
            inTime: time,
            outTime: current?.outTime || null,
            droppedBy: guardianName,
            droppedByType: guardianType
          }
        };
      } else {
        return {
          ...prev,
          [studentId]: {
            ...current,
            outTime: time,
            pickedBy: guardianName,
            pickedByType: guardianType,
            status: 'present'
          }
        };
      }
    });

    setGuardianModalVisible(false);
    setMarkingStudentId(null);
  }, [markingType]); 

  const handleSubmit = useCallback(async () => {
    const rawRecords = attendanceRecords || {};
    const records = Object.values(rawRecords);
    if (records.length === 0) {
      Alert.alert('No Changes', 'No attendance records to submit.');
      return;
    }

    setIsSubmitting(true);
    try {
      const today = getTodayDateString();
      const promises = records.map(record => {
        const payload = {
          student_id: record.id,
          date: today,
          status: record.status,
          in_time: record.inTime,
          out_time: record.outTime,
          dropped_by_type: record.droppedByType,
          picked_by_type: record.pickedByType,
          dropped_by_name: record.droppedBy,
          picked_by_name: record.pickedBy
        };
        return api.post('/attendance', payload);
      });
      await Promise.all(promises);
      Alert.alert('Success', 'Attendance stored! 💾✨');
      navigation.goBack();
    } catch (error) {
       Alert.alert('Error', 'Failed to store attendance.');
    } finally {
      setIsSubmitting(false);
    }
  }, [attendanceRecords, navigation]);

  // Fetch monthly records for the selected student
  useEffect(() => {
    let isMounted = true;
    const fetchMonthlyRecords = async () => {
      if (!selectedStudentForMonthly) return;
      try {
        setIsMonthlyLoading(true);
        const response = await api.get(`/attendance?student_id=${selectedStudentForMonthly.id}`);
        if (!isMounted) return;
        
        const data = response.data;
        const attendanceMap: Record<string, any> = {};
        data.forEach((r: any) => {
          attendanceMap[r.date] = r;
        });

        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const records = [];

        for (let day = 1; day <= daysInMonth; day++) {
          const dayStr = day.toString().padStart(2, '0');
          const monthStr = (selectedMonth + 1).toString().padStart(2, '0');
          const dateStr = `${selectedYear}-${monthStr}-${dayStr}`;
          const dayRecord = attendanceMap[dateStr];
          const dateObj = new Date(selectedYear, selectedMonth, day);

          records.push({
            day,
            dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
            date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            status: dayRecord?.status || 'not_marked',
            clockIn: dayRecord?.in_time,
            clockOut: dayRecord?.out_time,
            clockInBy: dayRecord?.dropped_by_type,
            clockOutBy: dayRecord?.picked_by_type,
            isWeekend: dateObj.getDay() === 0 || dateObj.getDay() === 6
          });
        }
        setMonthlyRecords(records);
      } catch (error) {
        console.error('Error fetching monthly records:', error);
      } finally {
        if (isMounted) setIsMonthlyLoading(false);
      }
    };

    if (activeTab === 'month' && selectedStudentForMonthly) {
      fetchMonthlyRecords();
    }
    return () => { isMounted = false; };
  }, [selectedStudentForMonthly?.id, selectedMonth, selectedYear, activeTab]);

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleTabChange = useCallback((tab: 'day' | 'month') => {
    setActiveTab(tab);
    if (tab === 'day') setSelectedStudentForMonthly(null);
  }, []);

  const changeMonth = useCallback((offset: number) => {
    setSelectedMonth(prev => {
      let nextMonth = prev + offset;
      if (nextMonth > 11) {
        setSelectedYear(y => y + 1);
        return 0;
      }
      if (nextMonth < 0) {
        setSelectedYear(y => y - 1);
        return 11;
      }
      return nextMonth;
    });
  }, []);

  const unmarkAttendance = useCallback((studentId: string) => {
    setAttendanceRecords(prev => {
      const newRecords = { ...prev };
      delete newRecords[studentId];
      return newRecords;
    });
  }, []);

  const markAbsent = useCallback((studentId: string) => {
    const record = stateRef.current.attendanceRecords[studentId];
    if (record?.status === 'present') {
      Alert.alert('Action Denied', 'Student is already marked Present. Please undo the Present marking first.');
      return;
    }

    Alert.alert(
      'Mark Absent',
      'Mark this student as Absent for today?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm Absent', 
          style: 'destructive', 
          onPress: () => {
            setAttendanceRecords(prev => ({
              ...prev,
              [studentId]: {
                id: studentId,
                status: 'absent',
                inTime: null,
                outTime: null
              }
            }));
          }
        }
      ]
    );
  }, []);

  const onDayStudentTap = useCallback((studentId: string) => {
    const record = stateRef.current.attendanceRecords[studentId];
    
    // Case 1: Already marked Absent
    if (record?.status === 'absent') {
      Alert.alert(
        'Student Absent',
        'Would you like to undo the Absent marking?',
        [
          { text: 'No', style: 'cancel' },
          { text: 'Yes, Undo', style: 'destructive', onPress: () => unmarkAttendance(studentId) }
        ]
      );
      return;
    }

    if (!record?.inTime) {
      // Mark IN
      setMarkingStudentId(studentId);
      setMarkingType('IN');
      setGuardianModalVisible(true);
    } else if (!record?.outTime) {
      // Offer Mark OUT or Undo
      Alert.alert(
        'Attendance Options',
        'Student is already marked IN. What next?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Undo In-Marking', style: 'destructive', onPress: () => unmarkAttendance(studentId) },
          { 
            text: 'Mark OUT', 
            onPress: () => {
              setMarkingStudentId(studentId);
              setMarkingType('OUT');
              setGuardianModalVisible(true);
            }
          }
        ]
      );
    } else {
      // Already marked OUT, offer Undo
      Alert.alert(
        'Attendance Complete',
        'Attendance cycle finished for this student. Undo marking?',
        [
          { text: 'No', style: 'cancel' },
          { text: 'Yes, Undo', style: 'destructive', onPress: () => unmarkAttendance(studentId) }
        ]
      );
    }
  }, [unmarkAttendance]); 

  const onMonthlyStudentSelect = useCallback((student: any) => {
    setSelectedStudentForMonthly(student);
  }, []);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <View className="px-6 py-1">
      <StudentCard 
        student={item}
        record={stateRef.current.attendanceRecords[item.id]} 
        colors={stateRef.current.colors}
        onTap={onDayStudentTap}
        onLongPress={markAbsent}
      />
    </View>
  ), [onDayStudentTap, markAbsent]); 

  const renderMonthlyStudentItem = useCallback(({ item }: { item: any }) => (
    <View className="px-6 py-1">
      <StudentCard 
        student={item}
        record={undefined}
        colors={stateRef.current.colors}
        onTap={() => onMonthlyStudentSelect(item)}
      />
    </View>
  ), [onMonthlyStudentSelect]);

  const renderMonthlyRecord = useCallback(({ item }: { item: any }) => (
    <View className="px-6">
      <MonthlyRecordCard record={item} colors={colors} />
    </View>
  ), [colors]);

  const SummaryHeader = useMemo(() => {
    const { total, in: checkedIn, out: checkedOut, absent } = attendanceSummary;
    return (
      <View className="px-6 mb-6">
        <View className={`${appTheme === 'dark' ? 'bg-[#1e1e1e]' : colors.surface} rounded-[32px] p-6 flex-row justify-between border ${appTheme === 'dark' ? 'border-gray-800' : colors.border} shadow-xl`}>
          <View className={`items-center flex-1 border-r ${appTheme === 'dark' ? 'border-gray-800' : 'border-gray-100/50'}`}>
            <Text className="text-2xl font-black text-brand-pink">{total}</Text>
            <Text className={`text-[9px] font-black uppercase tracking-widest ${colors.textTertiary}`}>Total</Text>
          </View>
          <View className={`items-center flex-1 border-r ${appTheme === 'dark' ? 'border-gray-800' : 'border-gray-100/50'}`}>
            <Text className="text-2xl font-black text-green-500">{checkedIn}</Text>
            <Text className={`text-[9px] font-black uppercase tracking-widest ${colors.textTertiary}`}>Present</Text>
          </View>
          <View className="items-center flex-1">
            <Text className="text-2xl font-black text-red-500">{absent}</Text>
            <Text className={`text-[9px] font-black uppercase tracking-widest ${colors.textTertiary}`}>Absent</Text>
          </View>
        </View>
      </View>
    );
  }, [attendanceSummary, colors, appTheme]);

  return (
    <SafeAreaView 
        className={`flex-1 ${colors.background}`}
        style={{ backgroundColor: appTheme === 'dark' ? '#121212' : '#FFFFFF' }}
    >
      {/* Header */}
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <TouchableOpacity 
              onPress={handleGoBack} 
              className={`mb-4 ${appTheme === 'dark' ? 'bg-[#1e1e1e]' : colors.surface} w-12 h-12 rounded-2xl items-center justify-center border ${appTheme === 'dark' ? 'border-gray-800' : colors.border} shadow-sm`}
            >
              <MaterialCommunityIcons name="arrow-left" size={28} color={appTheme === 'dark' ? '#FFF' : '#000'} />
            </TouchableOpacity>
            <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>{activeTab === 'day' ? 'Daily' : 'Monthly'}</Text>
            <Text className="text-2xl font-bold text-brand-pink">Attendance ✓</Text>
          </View>
          <View className="bg-brand-pink w-16 h-16 rounded-3xl items-center justify-center shadow-lg shadow-brand-pink/30">
            <MaterialCommunityIcons name="calendar-check" size={32} color="white" />
          </View>
        </View>
      </View>

      {/* View Selector Dropdown */}
      <ViewDropdown 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        colors={colors}
        isOpen={isDropdownOpen}
        setIsOpen={setIsDropdownOpen}
      />

      {/* Main Content Area */}
      <View className="flex-1">
          {activeTab === 'day' ? (
                <View className="flex-1">
                {initialLoading && (
                    <View className="absolute inset-0 z-50 items-center justify-center bg-black/10">
                    <ActivityIndicator size="large" color="#F472B6" />
                    </View>
                )}
                <FlatList
                    data={students}
                    keyExtractor={(item) => item.id}
                    initialNumToRender={8}
                    maxToRenderPerBatch={5}
                    windowSize={5}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={<EmptyList colors={colors} />}
                    ListHeaderComponent={
                    <>
                        <View className="px-6 mb-6 flex-row items-center justify-between">
                        <TouchableOpacity 
                            onPress={() => {
                            const d = new Date(selectedDate);
                            d.setDate(d.getDate() - 1);
                            setSelectedDate(d.toISOString().split('T')[0]);
                            }}
                            className={`${appTheme === 'dark' ? 'bg-[#1e1e1e]' : colors.surface} w-10 h-10 rounded-full items-center justify-center border ${appTheme === 'dark' ? 'border-gray-800' : colors.border}`}
                        >
                            <MaterialCommunityIcons name="chevron-left" size={24} color={appTheme === 'dark' ? '#F472B6' : colors.text} />
                        </TouchableOpacity>
                        <View className="items-center">
                            <Text className={`text-base font-black ${colors.text}`}>{selectedDate}</Text>
                            <Text className={`text-[10px] font-black uppercase text-brand-pink tracking-widest`}>Change Date</Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => {
                            const d = new Date(selectedDate);
                            d.setDate(d.getDate() + 1);
                            setSelectedDate(d.toISOString().split('T')[0]);
                            }}
                            className={`${appTheme === 'dark' ? 'bg-[#1e1e1e]' : colors.surface} w-10 h-10 rounded-full items-center justify-center border ${appTheme === 'dark' ? 'border-gray-800' : colors.border}`}
                        >
                            <MaterialCommunityIcons name="chevron-right" size={24} color={appTheme === 'dark' ? '#F472B6' : colors.text} />
                        </TouchableOpacity>
                        </View>
    
                        {SummaryHeader}
    
                        <View className="px-6 flex-row items-center justify-between mb-4 mt-2">
                        <Text className={`text-[10px] font-black ${colors.textTertiary} uppercase tracking-[3px]`}>Student Roster</Text>
                        <Text className="text-[9px] text-brand-pink font-black uppercase">Long Press to Mark Absent</Text>
                        </View>
                    </>
                    }
                    renderItem={renderItem}
                    extraData={attendanceRecords}
                    ListFooterComponent={
                    <View className="mt-4 px-6 mb-10">
                        <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                        className={`${isSubmitting ? 'bg-gray-400' : 'bg-brand-pink'} py-5 rounded-[24px] items-center shadow-lg shadow-brand-pink/30 flex-row justify-center`}
                        >
                        {isSubmitting ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <>
                            <MaterialCommunityIcons name="shield-check" size={24} color="white" />
                            <Text className="text-white font-black text-lg ml-2 uppercase tracking-tight">Save & Submit</Text>
                            </>
                        )}
                        </TouchableOpacity>
                    </View>
                    }
                />
                </View>
          ) : (
                <View className="flex-1">
                {selectedStudentForMonthly ? (
                    <FlatList
                    data={monthlyRecords}
                    keyExtractor={(item) => item.day.toString()}
                    renderItem={renderMonthlyRecord}
                    initialNumToRender={15}
                    ListHeaderComponent={
                        <View className="mb-4">
                        <View className="px-6 flex-row items-center justify-between mb-8">
                            <View className="flex-row items-center flex-1">
                            {selectedStudentForMonthly.avatar ? (
                                <Image 
                                source={{ uri: selectedStudentForMonthly.avatar }} 
                                style={{ width: 64, height: 64, borderRadius: 24 }}
                                className="border-4 border-white dark:border-gray-800 shadow-sm"
                                />
                            ) : (
                                <View className={`w-16 h-16 rounded-[24px] items-center justify-center border-4 border-white dark:border-gray-800 ${appTheme === 'dark' ? 'bg-gray-800' : 'bg-brand-pink/10'} shadow-sm`}>
                                <MaterialCommunityIcons name="account-school" size={32} color="#F472B6" />
                                </View>
                            )}
                            <View className="ml-4 flex-1">
                                <Text className={`text-xl font-black ${colors.text} tracking-tight`} numberOfLines={1}>{selectedStudentForMonthly.name}</Text>
                                <View className="flex-row items-center mt-1">
                                <View className="bg-brand-pink/10 px-2 py-0.5 rounded-lg mr-2 border border-brand-pink/20">
                                    <Text className="text-[10px] font-black text-brand-pink uppercase tracking-widest">ID: {selectedStudentForMonthly.studentId || selectedStudentForMonthly.student_id || 'N/A'}</Text>
                                </View>
                                </View>
                            </View>
                            </View>
                            <TouchableOpacity 
                            onPress={() => setSelectedStudentForMonthly(null)}
                            className="bg-brand-pink w-11 h-11 rounded-2xl items-center justify-center shadow-sm"
                            >
                            <MaterialCommunityIcons name="format-list-bulleted" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
    
                        <View className="px-6 mb-6">
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {MONTHS.map((month, index) => (
                                <TouchableOpacity
                                key={index}
                                onPress={() => setSelectedMonth(index)}
                                className={`${selectedMonth === index ? 'bg-brand-pink border-brand-pink' : `${colors.surface} ${colors.border}`} px-6 py-3 rounded-2xl mr-3 border shadow-sm`}
                                >
                                <Text className={`font-black uppercase text-[10px] tracking-widest ${selectedMonth === index ? 'text-white' : colors.textSecondary}`}>{month}</Text>
                                </TouchableOpacity>
                            ))}
                            </ScrollView>
                        </View>
                        {isMonthlyLoading && (
                            <ActivityIndicator color="#F472B6" style={{ marginTop: 10, marginBottom: 10 }} />
                        )}
                        </View>
                    }
                    ListFooterComponent={<View className="h-24" />}
                    />
                ) : (
                    <FlatList
                    data={students}
                    keyExtractor={(item) => `monthly-select-${item.id}`}
                    initialNumToRender={10}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <View className="px-6 mb-6 mt-4">
                            <Text className={`text-[10px] font-black uppercase tracking-[3px] ${colors.textTertiary}`}>Select Student for Report</Text>
                        </View>
                    }
                    renderItem={renderMonthlyStudentItem}
                    />
                )}
                </View>
          )}
      </View>

      {/* Guardian Selection Modal */}
      <Modal visible={guardianModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/90 justify-end">
          <TouchableOpacity 
              activeOpacity={1} 
              onPress={() => setGuardianModalVisible(false)}
              className="absolute inset-0"
          />
          <View 
            style={{ backgroundColor: appTheme === 'dark' ? '#1a1a1a' : '#FFFFFF' }}
            className="rounded-t-[45px] p-6 pb-12 border-t border-white/5 shadow-2xl"
          >
            {/* Handlebar */}
            <View className="items-center mb-6">
              <View className={`w-10 h-1.5 ${appTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} rounded-full`} />
            </View>

            <View className="mb-8 text-left">
              <Text className={`text-3xl font-black ${colors.text} tracking-tighter`}>Who is reporting?</Text>
              <View className="flex-row items-center mt-2">
                <View className={`px-3 py-1 rounded-full ${markingType === 'IN' ? 'bg-green-500/10' : 'bg-brand-pink/10'} border ${markingType === 'IN' ? 'border-green-500/20' : 'border-brand-pink/20'}`}>
                  <Text className={`text-[9px] font-black uppercase tracking-[2px] ${markingType === 'IN' ? 'text-green-500' : 'text-brand-pink'}`}>
                    {markingType === 'IN' ? 'Check-In Mode' : 'Check-Out Mode'}
                  </Text>
                </View>
                <Text className={`ml-3 text-[10px] font-black uppercase tracking-tight ${colors.textTertiary}`}>Select category</Text>
              </View>
            </View>

            <View className="flex-row justify-between mb-2">
              {[
                { type: 'Father', icon: 'account-child', color: '#3B82F6', label: 'Father' },
                { type: 'Mother', icon: 'account-circle', color: '#F472B6', label: 'Mother' },
                { type: 'Guardian', icon: 'account-group', color: '#10B981', label: 'Guardian' }
              ].map((item) => (
                <TouchableOpacity
                  key={item.type}
                  onPress={() => markPresent(markingStudentId!, item.type as any)}
                  activeOpacity={0.7}
                  className="items-center w-[30%]"
                >
                  <View 
                    style={{ 
                      backgroundColor: appTheme === 'dark' ? `${item.color}15` : `${item.color}08`,
                      borderColor: appTheme === 'dark' ? `${item.color}30` : `${item.color}20`
                    }} 
                    className="w-full aspect-square rounded-[24px] items-center justify-center mb-2 border-2 shadow-sm"
                  >
                    <MaterialCommunityIcons name={item.icon as any} size={38} color={item.color} />
                  </View>
                  <Text className={`font-black ${colors.text} text-[10px] uppercase tracking-wider`}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity 
                onPress={() => setGuardianModalVisible(false)}
                activeOpacity={0.8}
                className={`mt-8 py-4 rounded-[22px] border border-transparent ${appTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'} items-center`}
            >
                <Text className={`font-black uppercase tracking-[2px] ${colors.textTertiary} text-[9px]`}>Dismiss Selection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
