import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, Image, Dimensions, Modal, ActivityIndicator, FlatList, ScrollView, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';
import StatusModal from '../../components/StatusModal';
import ChoiceModal from '../../components/ChoiceModal';
import PremiumPopup from '../../components/PremiumPopup';

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
      <View className="flex-1 bg-black/90 justify-center items-center px-6">
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={() => setIsOpen(false)}
          className="absolute inset-0"
        />
        <View 
            style={{ backgroundColor: appTheme === 'dark' ? '#1c1c14' : '#FFFFFF' }}
            className="w-full rounded-[48px] p-8 border-4 border-brand-pink shadow-2xl relative overflow-hidden"
        >
          {/* Decorative Header Area */}
          <View className="items-center mb-8">
            <View className={`w-20 h-20 rounded-[28px] bg-brand-pink items-center justify-center mb-4 shadow-xl rotate-3 border-4 border-white`}>
              <MaterialCommunityIcons name="calendar-multiselect" size={42} color="white" />
            </View>
            <Text className={`text-2xl font-black ${colors.text} tracking-tighter text-center`}>Select View Mode</Text>
            <Text className={`text-[10px] ${colors.textTertiary} font-black uppercase tracking-[2px] mt-1`}>Attendance Dashboard</Text>
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

          <TouchableOpacity 
            onPress={() => setIsOpen(false)}
            activeOpacity={0.8}
            className={`mt-6 py-4 rounded-[22px] border-2 border-dashed ${appTheme === 'dark' ? 'border-white/10' : 'border-gray-200'} items-center`}
          >
            <Text className={`font-black uppercase tracking-[2px] ${colors.textTertiary} text-[9px]`}>Cancel Selection</Text>
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
  const [markingStudentId, setMarkingStudentId] = useState<string | null>(null);
  const [markingType, setMarkingType] = useState<'IN' | 'OUT'>('IN');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [isMonthlyLoading, setIsMonthlyLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [statusModal, setStatusModal] = useState({ visible: false, title: '', message: '', type: 'error' as any });
  const [choiceModal, setChoiceModal] = useState({ visible: false, title: '', message: '', options: [] as any[], iconName: '', accentColor: '' });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (activeTab === 'day') {
         await fetchData();
      } else if (activeTab === 'month' && typeof (selectedDate as any).fetchMonthlyRecords === 'function') {
         // This is complex due to internal scoping, focus on primary data for now
         await fetchData();
      } else {
         await fetchData();
      }
    } catch (error) {
      console.error('Refresh Error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchData, activeTab]);

  // Synchronous ref for all state-dependent callbacks to keep them stable
  const stateRef = useRef({ attendanceRecords, users, colors });
  stateRef.current = { attendanceRecords, users, colors };

  // Stabilize students list
  const students = useMemo(() => {
    return users.filter(u => u.role === 'student' && u.status === 'active');
  }, [users]);

  const markingStudent = useMemo(() => {
    return students.find(s => s.id === markingStudentId);
  }, [markingStudentId, students]);

  // Attendance summary calculated only when records change
  const attendanceSummary = useMemo(() => {
    const rawRecords = attendanceRecords || {};
    const studentIds = students.map(s => s.id.toString());
    
    // Only count records for students currently in our list
    const activeRecords = Object.entries(rawRecords)
      .filter(([id]) => studentIds.includes(id))
      .map(([_, r]) => r);

    const totalCount = students?.length || 0;
    return {
      total: totalCount,
      in: activeRecords.filter(r => !!r.inTime).length,
      out: activeRecords.filter(r => !!r.outTime).length,
      absent: activeRecords.filter(r => r.status === 'absent').length
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

  const markPresent = useCallback(async (studentId: string, guardianType: 'Mother' | 'Father' | 'Guardian') => {
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
    
    const current = attendanceRecords[studentId];
    const newRecord: StudentAttendance = markingType === 'IN' ? {
      id: studentId,
      status: 'present',
      inTime: time,
      outTime: current?.outTime || null,
      droppedBy: guardianName,
      droppedByType: guardianType
    } : {
      ...current,
      outTime: time,
      pickedBy: guardianName,
      pickedByType: guardianType,
      status: 'present'
    };

    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: newRecord
    }));

    setMarkingStudentId(null);

    // Auto-submit change
    try {
      const today = getTodayDateString();
      await api.post('/attendance', {
        student_id: studentId,
        date: today,
        status: newRecord.status,
        in_time: newRecord.inTime,
        out_time: newRecord.outTime,
        dropped_by_type: newRecord.droppedByType,
        picked_by_type: newRecord.pickedByType,
        dropped_by_name: newRecord.droppedBy,
        picked_by_name: newRecord.pickedBy
      });
    } catch (error) {
      console.error('Error auto-submitting attendance present:', error);
      setStatusModal({ visible: true, title: 'Error', message: 'Failed to save attendance change.', type: 'error' });
    }
  }, [markingType, attendanceRecords]); 

  const handleSubmit = useCallback(async () => {
    const rawRecords = attendanceRecords || {};
    const records = Object.values(rawRecords);
    if (records.length === 0) {
      setStatusModal({ visible: true, title: 'No Changes', message: 'No attendance records to submit.', type: 'warning' });
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
      setStatusModal({ 
        visible: true, 
        title: 'Success!', 
        message: 'Attendance stored safely in the vault! 💾✨', 
        type: 'success' 
      });
      setTimeout(() => {
        setStatusModal(prev => ({ ...prev, visible: false }));
        navigation.goBack();
      }, 1500);
    } catch (error) {
       setStatusModal({ visible: true, title: 'Error', message: 'Failed to store attendance.', type: 'error' });
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
      setStatusModal({ visible: true, title: 'Action Denied', message: 'Student is already marked Present. Please undo the Present marking first.', type: 'warning' });
      return;
    }

    setChoiceModal({
      visible: true,
      title: 'Mark Absent',
      message: 'Mark this student as Absent for today?',
      iconName: 'account-remove-outline',
      accentColor: '#EF4444',
      options: [
        { 
          label: 'Confirm Absent', 
          type: 'destructive',
          onPress: async () => {
            const newRecord: StudentAttendance = {
              id: studentId,
              status: 'absent',
              inTime: null,
              outTime: null
            };
            
            setAttendanceRecords(prev => ({
              ...prev,
              [studentId]: newRecord
            }));

            // Auto-submit change
            try {
              const today = getTodayDateString();
              await api.post('/attendance', {
                student_id: studentId,
                date: today,
                status: 'absent',
                in_time: null,
                out_time: null
              });
            } catch (error) {
              console.error('Error auto-submitting attendance absent:', error);
              setStatusModal({ visible: true, title: 'Error', message: 'Failed to save attendance change.', type: 'error' });
            }
          }
        }
      ]
    });
  }, []);

  const onDayStudentTap = useCallback((studentId: string) => {
    const record = stateRef.current.attendanceRecords[studentId];
    
    // Case 1: Already marked Absent
    if (record?.status === 'absent') {
      setChoiceModal({
        visible: true,
        title: 'Student Absent',
        message: 'Would you like to undo the Absent marking?',
        iconName: 'account-question',
        accentColor: '#EF4444',
        options: [
          { label: 'Yes, Undo', type: 'destructive', onPress: () => unmarkAttendance(studentId) }
        ]
      });
      return;
    }

    if (!record?.inTime) {
      // Mark IN
      setMarkingStudentId(studentId);
      setMarkingType('IN');
    } else if (!record?.outTime) {
      // Offer Mark OUT or Undo
      setChoiceModal({
        visible: true,
        title: 'Attendance Options',
        message: 'Student is already marked IN. What next?',
        iconName: 'account-clock',
        accentColor: '#10B981',
        options: [
          { 
            label: 'Mark OUT', 
            type: 'primary',
            onPress: () => {
              setMarkingStudentId(studentId);
              setMarkingType('OUT');
            }
          },
          { label: 'Undo In-Marking', type: 'destructive', onPress: () => unmarkAttendance(studentId) },
        ]
      });
    } else {
      // Already marked OUT, offer Undo
      setChoiceModal({
        visible: true,
        title: 'Attendance Complete',
        message: 'Attendance cycle finished for this student. Undo marking?',
        iconName: 'check-all',
        accentColor: '#F472B6',
        options: [
          { label: 'Yes, Undo', type: 'destructive', onPress: () => unmarkAttendance(studentId) }
        ]
      });
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

  const markAttendanceSync = useCallback((guardianLabel: string) => {
    let guardianType: 'Mother' | 'Father' | 'Guardian';
    if (guardianLabel === 'Father') {
      guardianType = 'Father';
    } else if (guardianLabel === 'Mother') {
      guardianType = 'Mother';
    } else {
      guardianType = 'Guardian';
    }
    if (markingStudentId) {
      markPresent(markingStudentId, guardianType);
    }
  }, [markingStudentId, markPresent]);

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
                    ListFooterComponent={<View className="mb-10" />}
                    refreshControl={
                      <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#F472B6"
                        colors={["#F472B6"]}
                        progressBackgroundColor={appTheme === 'dark' ? '#1c1c14' : '#FFFFFF'}
                      />
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

      {/* Full Screen Marking Dashboard */}
      <Modal 
        visible={!!markingStudentId} 
        animationType="slide" 
        transparent={false}
        onRequestClose={() => setMarkingStudentId(null)}
      >
        <SafeAreaView className={`flex-1 ${colors.background}`}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Immersive Header Background */}
            <View className="h-64 absolute top-0 left-0 right-0 overflow-hidden">
                <LinearGradient
                  colors={markingType === 'IN' ? ['#10B98120', 'transparent'] : ['#F472B620', 'transparent']}
                  className="flex-1"
                />
            </View>

            {/* Top Bar */}
            <View className="px-6 pt-6 flex-row items-center justify-between z-10">
               <View>
                  <Text className={`text-[10px] font-black uppercase tracking-[4px] ${colors.textTertiary}`}>Attendance Mode</Text>
                  <Text className={`text-2xl font-black ${colors.text}`}>Report Entry</Text>
               </View>
               <TouchableOpacity 
                 onPress={() => setMarkingStudentId(null)}
                 className={`${appTheme === 'dark' ? 'bg-[#25251d]' : 'bg-gray-100'} w-12 h-12 rounded-2xl items-center justify-center border ${appTheme === 'dark' ? 'border-white/10' : 'border-gray-200'} shadow-sm`}
               >
                 <MaterialCommunityIcons name="close" size={28} color={colors.text} />
               </TouchableOpacity>
            </View>

            {/* Primary Content Container */}
            <View className="flex-1 px-6 mt-10">
                {/* Cyber-Premium ID Badge Redesign - Compact Version */}
                {markingStudent && (
                <View className="items-center mb-10 w-full">
                    <View 
                        style={{ elevation: 20 }}
                        className={`${appTheme === 'dark' ? 'bg-[#111111] border-white/10' : 'bg-white border-gray-100'} w-full rounded-[40px] border-b-[6px] border-gray-200/50 dark:border-white/5 shadow-2xl overflow-hidden`}
                    >
                    {/* Immersive Header Strip - Compact */}
                    <View className={`h-16 w-full flex-row items-center px-6 ${markingType === 'IN' ? 'bg-green-500' : 'bg-brand-pink'} relative`}>
                        <View className="absolute top-[-10] right-[-10] opacity-20">
                            <MaterialCommunityIcons name="face-recognition" size={100} color="white" />
                        </View>
                        <MaterialCommunityIcons name="shield-check-outline" size={20} color="white" />
                        <Text className="text-white font-black text-[9px] uppercase tracking-[3px] ml-2">Verified Profile</Text>
                    </View>

                    {/* Main Content Area - Compact */}
                    <View className="p-6 items-center bg-transparent mt-[-40]">
                        {/* Halo Portrait Frame - Compact */}
                        <View className="relative mb-4">
                            <View className={`w-28 h-28 rounded-full p-1.5 bg-white dark:bg-[#111111] shadow-xl border-[3px] ${markingType === 'IN' ? 'border-green-500' : 'border-brand-pink'}`}>
                                <View className="w-full h-full rounded-full overflow-hidden border-2 border-gray-50 dark:border-white/5">
                                    {markingStudent.avatar ? (
                                        <Image source={{ uri: markingStudent.avatar }} className="w-full h-full" resizeMode="cover" />
                                    ) : (
                                        <View className="w-full h-full items-center justify-center bg-gray-100 dark:bg-gray-800">
                                            <MaterialCommunityIcons name="account" size={48} color={colors.textTertiary} />
                                        </View>
                                    )}
                                </View>
                            </View>
                            {/* Technical Badge Overlay - Compact */}
                            <View className={`absolute bottom-0 right-0 w-10 h-10 rounded-xl ${markingType === 'IN' ? 'bg-green-500' : 'bg-brand-pink'} items-center justify-center border-4 ${appTheme === 'dark' ? 'border-[#111111]' : 'border-white'} shadow-lg`}>
                                <MaterialCommunityIcons name={markingType === 'IN' ? "login" : "logout"} size={18} color="white" />
                            </View>
                        </View>

                        <View className="items-center">
                            <Text className={`text-3xl font-black ${colors.text} tracking-tighter text-center`}>{markingStudent.name}</Text>
                            
                            <View className="flex-row items-center mt-2.5 bg-gray-50 dark:bg-white/5 px-4 py-1.5 rounded-xl border border-gray-100 dark:border-white/10">
                                <MaterialCommunityIcons name="fingerprint" size={12} color="#F472B6" />
                                <Text className="text-brand-pink text-[10px] font-black uppercase tracking-[2px] ml-2">
                                    ID • {markingStudent.studentId || 'N/A'}
                                </Text>
                            </View>

                            {/* SCAN-READY Status Indicator - Compact */}
                            <View className="flex-row items-center mt-6 gap-3">
                                <View className="items-center px-3">
                                    <Text className={`text-[8px] font-black uppercase tracking-widest ${colors.textTertiary}`}>Status</Text>
                                    <Text className={`text-[10px] font-black ${markingType === 'IN' ? 'text-green-500' : 'text-brand-pink'} mt-0.5`}>ACTIVE</Text>
                                </View>
                                <View className="w-[1px] h-8 bg-gray-100 dark:bg-white/10" />
                                <View className="items-center px-3">
                                    <Text className={`text-[8px] font-black uppercase tracking-widest ${colors.textTertiary}`}>Mode</Text>
                                    <Text className="text-[10px] font-black text-brand-pink mt-0.5 uppercase">{markingType}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                    </View>
                </View>
                )}

                {/* Question Prompt */}
                <View className="mb-8 px-2">
                    <Text className={`text-xl font-black ${colors.text} tracking-tight`}>Who is reporting?</Text>
                    <Text className={`text-[11px] font-black uppercase tracking-widest ${colors.textTertiary} mt-1 opacity-60`}>Select the guardian present</Text>
                </View>

                {/* Guardian Options Grid */}
                <View className="flex-row flex-wrap justify-between mb-20 px-1">
                    {[
                        { label: 'Father', icon: 'face-man', color: '#3B82F6', desc: 'Primary Guardian' },
                        { label: 'Mother', icon: 'face-woman', color: '#F472B6', desc: 'Primary Guardian' },
                        { label: 'Guardian', icon: 'account-child', color: '#10B981', desc: 'Relative / Other' },
                    ].map((item, idx) => (
                        <TouchableOpacity
                        key={idx}
                        activeOpacity={0.8}
                        onPress={() => markAttendanceSync(item.label)}
                        className="w-full mb-4"
                        >
                        <View className={`${appTheme === 'dark' ? 'bg-[#1a1a18] border-white/5' : 'bg-white border-gray-100'} p-6 rounded-[36px] flex-row items-center border shadow-xl`}>
                            <View 
                                style={{ backgroundColor: item.color + '15' }}
                                className="w-16 h-16 rounded-3xl items-center justify-center mr-6 border border-white/10"
                            >
                                <MaterialCommunityIcons name={item.icon as any} size={36} color={item.color} />
                            </View>
                            <View className="flex-1">
                                <Text className={`text-lg font-black ${colors.text}`}>{item.label}</Text>
                                <Text className={`text-[10px] font-bold uppercase tracking-widest ${colors.textTertiary} mt-1 opacity-50`}>{item.desc}</Text>
                            </View>
                            <View className={`${appTheme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} w-10 h-10 rounded-2xl items-center justify-center`}>
                                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textTertiary} />
                            </View>
                        </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <StatusModal
        visible={statusModal.visible}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
        onClose={() => setStatusModal({ ...statusModal, visible: false })}
      />

      <ChoiceModal
        visible={choiceModal.visible}
        title={choiceModal.title}
        message={choiceModal.message}
        options={choiceModal.options}
        iconName={choiceModal.iconName}
        accentColor={choiceModal.accentColor}
        onClose={() => setChoiceModal({ ...choiceModal, visible: false })}
      />
    </SafeAreaView>
  );
}
