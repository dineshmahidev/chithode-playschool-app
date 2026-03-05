import React, { useState, useCallback, memo, useMemo, useEffect } from 'react';
import { 
  View, Text, ScrollView, Pressable, TextInput, Alert, Modal, 
  ActivityIndicator, FlatList, TouchableOpacity, Image, Platform,
  KeyboardAvoidingView, RefreshControl
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, FeeRecord } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import api from '../../services/api';

// ─── CONSTANTS ───
const FEES_TABS = [
  { id: 'manage', label: 'Monthly' },
  { id: 'admission', label: 'Admission' },
  { id: 'history', label: 'History' }
] as const;

const YEAR_DATA = [
  { name: '2020', code: '2020' },
  { name: '2021', code: '2021' },
  { name: '2022', code: '2022' },
  { name: '2023', code: '2023' },
  { name: '2024', code: '2024' },
  { name: '2025', code: '2025' },
  { name: '2026', code: '2026' },
  { name: '2027', code: '2027' },
  { name: '2028', code: '2028' },
  { name: '2029', code: '2029' },
  { name: '2030', code: '2030' },
];

const MONTH_DATA = [
  { name: 'January', code: '01' },
  { name: 'February', code: '02' },
  { name: 'March', code: '03' },
  { name: 'April', code: '04' },
  { name: 'May', code: '05' },
  { name: 'June', code: '06' },
  { name: 'July', code: '07' },
  { name: 'August', code: '08' },
  { name: 'September', code: '09' },
  { name: 'October', code: '10' },
  { name: 'November', code: '11' },
  { name: 'December', code: '12' },
];

// ─── MEMOIZED SUB-COMPONENTS ───

const MonthDropdown = memo(({ activeMonth, activeYear, onSelectMonth, onSelectYear, colors, theme }: any) => {
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);
  
  return (
    <View className="mb-4">
      <View className="flex-row gap-3 px-6">
        {/* Month Picker */}
        <Pressable 
          onPress={() => setIsMonthOpen(true)}
          className={`flex-1 flex-row items-center justify-between px-5 py-4 rounded-3xl border ${colors.surface} ${colors.border} shadow-sm`}
        >
          <Text className={`font-black uppercase tracking-widest ${colors.text}`}>{activeMonth.name}</Text>
          <MaterialCommunityIcons name="chevron-down" size={22} color="#F472B6" />
        </Pressable>

        {/* Year Picker */}
        <Pressable 
          onPress={() => setIsYearOpen(true)}
          className={`w-[130px] flex-row items-center justify-between px-5 py-4 rounded-3xl border ${colors.surface} ${colors.border} shadow-sm`}
        >
          <Text className={`font-black tracking-widest ${colors.text}`}>{activeYear.code}</Text>
          <MaterialCommunityIcons name="chevron-down" size={22} color="#F472B6" />
        </Pressable>
      </View>

      {/* Month Selection Modal */}
      <Modal visible={isMonthOpen} transparent animationType="fade">
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={() => setIsMonthOpen(false)} 
          className="flex-1 bg-black/60 items-center justify-center px-6"
        >
          <View className={`${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white'} w-full rounded-[40px] p-8 shadow-2xl`}>
            <Text className={`text-xl font-black ${colors.text} mb-6 text-center`}>Select Month 📅</Text>
            <View className="flex-row flex-wrap justify-between">
              {MONTH_DATA.map(m => (
                <Pressable 
                  key={m.code}
                  onPress={() => { onSelectMonth(m); setIsMonthOpen(false); }}
                  className={`w-[31%] py-5 rounded-2xl mb-3 items-center ${activeMonth.code === m.code ? 'bg-brand-pink' : (theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50')}`}
                >
                  <Text className={`text-[11px] font-black uppercase ${activeMonth.code === m.code ? 'text-white' : colors.textTertiary}`}>{m.name.substring(0,3)}</Text>
                </Pressable>
              ))}
            </View>
            <TouchableOpacity 
              onPress={() => setIsMonthOpen(false)}
              className="mt-4 py-4 rounded-3xl bg-gray-100 dark:bg-gray-800 items-center"
            >
              <Text className="font-black text-gray-400 uppercase tracking-widest text-[10px]">Cancel Selection</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Year Selection Modal */}
      <Modal visible={isYearOpen} transparent animationType="fade">
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={() => setIsYearOpen(false)} 
          className="flex-1 bg-black/60 items-center justify-center px-6"
        >
          <View className={`${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white'} w-[300px] rounded-[40px] p-8 shadow-2xl items-center`}>
            <Text className={`text-xl font-black ${colors.text} mb-6 text-center`}>Select Year 🔢</Text>
            <ScrollView className="w-full max-h-[350px] mb-4" showsVerticalScrollIndicator={false}>
              {YEAR_DATA.map(y => (
                <TouchableOpacity 
                  key={y.code}
                  onPress={() => { onSelectYear(y); setIsYearOpen(false); }}
                  className={`w-full py-4 rounded-2xl mb-3 items-center ${activeYear.code === y.code ? 'bg-brand-pink' : (theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50')}`}
                >
                  <Text className={`font-black ${activeYear.code === y.code ? 'text-white' : colors.text}`}>{y.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              onPress={() => setIsYearOpen(false)}
              className="w-full py-4 rounded-3xl bg-gray-100 dark:bg-gray-800 items-center"
            >
              <Text className="font-black text-gray-400 uppercase tracking-widest text-[10px]">Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
});

const SummaryCard = memo(({ label, value, icon, color, colors, theme }: any) => (
  <View 
    style={{ elevation: 12 }}
    className={`p-6 rounded-[32px] border flex-row items-center mr-4 min-w-[200px] shadow-2xl ${theme === 'dark' ? 'bg-[#25251d] border-gray-800' : 'bg-white border-white'}`}
  >
    <View style={{ backgroundColor: color + '20' }} className="w-14 h-14 rounded-[22px] items-center justify-center mr-4">
      <MaterialCommunityIcons name={icon} size={28} color={color} />
    </View>
    <View>
      <Text className={`text-[9px] font-black tracking-widest leading-loose ${colors.textTertiary} uppercase`}>{label}</Text>
      <Text className={`text-2xl font-black ${colors.text} tracking-tighter`}>{value}</Text>
    </View>
  </View>
));

const FeeEditorModal = memo(({ visible, onClose, item, onSave, colors, theme, students, structures }: any) => {
  const [amount,      setAmount]    = useState('');
  const [selectedType,setSelectedType] = useState('');
  const [sName,       setSName]     = useState('');
  const [sid,         setSid]       = useState('');
  const [dueDate,     setDueDate]   = useState(new Date().toISOString().split('T')[0]);
  const [showPicker,  setShowPicker]  = useState(false);
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [showTypePicker,    setShowTypePicker]    = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  useEffect(() => {
    if (item && visible) {
      setAmount(item.amount?.toString() || '0');
      setSelectedType(item.type || '');
      setSName(item.student_name || item.studentName || '');
      setSid(item.student_id || item.studentId || '');
      setDueDate(item.due_date || new Date().toISOString().split('T')[0]);
    }
  }, [item, visible]);

  const filteredStudents = useMemo(() => {
    if (!studentSearch) return students;
    const sq = studentSearch.toLowerCase();
    return students?.filter((s: any) => 
      s.name.toLowerCase().includes(sq) || (s.studentId && s.studentId.toLowerCase().includes(sq))
    );
  }, [students, studentSearch]);

  const handleSave = () => {
    if (!sid || !sName || !selectedType) {
      Alert.alert('Incomplete Record', 'Please complete student and category selection.');
      return;
    }
    onSave({ 
      ...item, 
      amount: parseFloat(amount), 
      type: selectedType,
      student_name: sName,
      student_id: sid,
      due_date: dueDate,
      status: item?.status || 'unpaid',
      date: item?.date || new Date().toISOString().split('T')[0]
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View 
        className={`flex-1 ${theme === 'dark' ? 'bg-[#1c1c14]' : 'bg-white'}`}
        style={{ backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF' }}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* ── Background Gradient & 3D Illustration ── */}

            {/* Header */}
            <View className="px-6 pt-12 pb-6 flex-row items-center justify-between">
              <View className="flex-1">
                <TouchableOpacity onPress={onClose} 
                  className={`${theme === 'dark' ? 'bg-[#25251d] border-gray-800' : 'bg-white border-brand-pink/20'} w-14 h-14 rounded-2xl items-center justify-center shadow-xl border mb-4`}
                >
                  <MaterialCommunityIcons name="close" size={28} color={theme === 'dark' ? '#FFF' : '#F472B6'} />
                </TouchableOpacity>
                <Text className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">
                  {item?.id === 'NEW' ? 'Fee' : 'Update'}
                </Text>
                <Text className="text-2xl font-black text-brand-pink mt-[-4px]">
                  {item?.id === 'NEW' ? 'Entry 🏛️' : 'Record 💎'}
                </Text>
              </View>
              <View className="bg-brand-pink w-24 h-24 rounded-[36px] items-center justify-center shadow-2xl border-4 border-white rotate-3 overflow-hidden">
                  <MaterialCommunityIcons name={item?.id === 'NEW' ? "cash-plus" : "file-edit-outline"} size={48} color="white" />
              </View>
            </View>

            <View className="px-6 pb-20">
              {/* Student Selection */}
              <View className="mb-8">
                <Text className={`text-[10px] font-black mb-4 uppercase tracking-[3px] ${colors.textTertiary} opacity-60`}>Recipient Info</Text>
                <TouchableOpacity 
                  onPress={() => item?.id === 'NEW' && setShowStudentPicker(!showStudentPicker)} 
                  className={`p-6 rounded-[32px] border-2 flex-row justify-between items-center ${theme === 'dark' ? 'bg-black/20 border-gray-800' : 'bg-gray-50 border-gray-100'} ${item?.id !== 'NEW' ? 'opacity-60' : ''}`}
                >
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons name="account-search-outline" size={24} color="#F472B6" style={{ marginRight: 15 }} />
                    <Text className={`font-black text-base ${sName ? colors.text : colors.textTertiary}`}>
                        {sName || 'Select Student Vendor'}
                    </Text>
                  </View>
                  {item?.id === 'NEW' && <MaterialCommunityIcons name="chevron-right" size={24} color="#F472B6" />}
                </TouchableOpacity>

                {showStudentPicker && (
                  <View className={`mt-4 rounded-[32px] border-2 p-4 ${theme === 'dark' ? 'bg-[#25251d] border-gray-800' : 'bg-white border-brand-pink/10'} max-h-[300px] shadow-2xl`}>
                    <TextInput 
                        className={`p-5 font-bold text-base ${colors.text} bg-black/5 dark:bg-white/5 rounded-2xl mb-4`} 
                        placeholder="Search student..." 
                        placeholderTextColor="#9CA3AF"
                        value={studentSearch} 
                        onChangeText={setStudentSearch} 
                    />
                    <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                        {filteredStudents?.map((s: any) => (
                      <TouchableOpacity 
                        key={s.id} 
                        className="p-5 rounded-2xl mb-2 border border-gray-100 dark:border-white/5" 
                        onPress={() => { setSName(s.name); setSid(s.studentId || s.student_id); setShowStudentPicker(false); }}
                      >
                        <Text className={`font-black ${colors.text}`}>{s.name}</Text>
                        <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{s.studentId || s.student_id}</Text>
                      </TouchableOpacity>
                    ))}</ScrollView>
                  </View>
                )}
              </View>

              {/* Category and Date Row */}
              <View className="flex-row gap-5 mb-8">
                <View className="flex-1">
                    <Text className={`text-[10px] font-black mb-4 uppercase tracking-[3px] ${colors.textTertiary} opacity-60`}>Category</Text>
                    <TouchableOpacity 
                      onPress={() => item?.id === 'NEW' && setShowTypePicker(!showTypePicker)} 
                      className={`p-6 rounded-[32px] border-2 flex-row justify-between items-center ${theme === 'dark' ? 'bg-black/20 border-gray-800' : 'bg-gray-50 border-gray-100'} ${item?.id !== 'NEW' ? 'opacity-60' : ''}`}
                    >
                      <Text className={`font-black uppercase text-[10px] tracking-widest ${selectedType ? colors.text : colors.textTertiary}`}>
                        {selectedType || 'Type'}
                      </Text>
                    </TouchableOpacity>
                    {showTypePicker && item?.id === 'NEW' && (
                      <View className="absolute top-24 left-0 right-0 bg-white dark:bg-gray-800 border border-gray-100 dark:border-white/5 rounded-[32px] shadow-2xl z-50 p-3">
                        <ScrollView className="max-h-[200px]" showsVerticalScrollIndicator={false}>
                          {structures.map((s: any) => (
                            <TouchableOpacity 
                                key={s.id} 
                                onPress={() => { setSelectedType(s.name); setAmount(s.amount.toString()); setShowTypePicker(false); }} 
                                className="p-5 rounded-2xl mb-1 dark:bg-white/5"
                            >
                              <Text className="font-black text-[11px] uppercase tracking-widest text-gray-600 dark:text-gray-300">{s.name}</Text>
                              <Text className="text-[10px] font-bold text-brand-pink mt-1">₹{s.amount}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                </View>
                <View className="flex-1">
                   <Text className={`text-[10px] font-black mb-4 uppercase tracking-[3px] ${colors.textTertiary} opacity-60`}>Due Date</Text>
                   <TouchableOpacity onPress={() => setShowPicker(true)} className={`p-6 rounded-[32px] border-2 bg-gray-50 dark:bg-black/20 border-gray-100 dark:border-gray-800 flex-row justify-between items-center`}>
                      <Text className={`font-black text-[10px] tracking-widest ${colors.text}`}>{dueDate}</Text>
                      <MaterialCommunityIcons name="calendar-clock" size={22} color="#F472B6" />
                   </TouchableOpacity>
                   {showPicker && <DateTimePicker value={new Date(dueDate)} mode="date" display="default" onChange={(_: DateTimePickerEvent, d?: Date) => { setShowPicker(false); if(d) setDueDate(d.toISOString().split('T')[0]); }} />}
                </View>
              </View>

              {/* Amount Entry */}
              <View className="mb-12">
                <Text className={`text-[10px] font-black mb-4 uppercase tracking-[3px] ${colors.textTertiary} opacity-60`}>Transaction Value</Text>
                <View className={`flex-row items-center p-4 rounded-[40px] border-2 shadow-sm ${theme === 'dark' ? 'bg-black/20 border-gray-800' : 'bg-white border-brand-pink/10'}`}>
                   <View className="bg-brand-pink w-20 h-20 rounded-[30px] items-center justify-center shadow-lg shadow-brand-pink/30">
                     <Text className="text-4xl font-black text-white">₹</Text>
                   </View>
                   <TextInput 
                        className={`flex-1 ml-6 text-5xl font-black ${colors.text} tracking-tighter`} 
                        value={amount} 
                        onChangeText={setAmount} 
                        keyboardType="numeric" 
                        placeholder="0.00"
                        placeholderTextColor={theme === 'dark' ? '#333' : '#FBCFE8'}
                   />
                </View>
              </View>

              {/* Save Actions */}
              <View className="flex-row gap-5">
                 <TouchableOpacity 
                    onPress={handleSave} 
                    className="flex-1 bg-brand-pink p-8 rounded-[36px] items-center justify-center flex-row shadow-2xl shadow-brand-pink/40"
                    style={{ elevation: 15 }}
                 >
                    <MaterialCommunityIcons name="check-all" size={28} color="white" />
                    <Text className="text-white font-black uppercase tracking-[3px] text-lg ml-3">Authorize</Text>
                 </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
});

const StatusToggleModal = memo(({ visible, onClose, item, onConfirm, colors, theme }: any) => {
  if (!item) return null;
  const targetStatus = item.status === 'paid' ? 'unpaid' : 'paid';
  const color = targetStatus === 'paid' ? '#10B981' : '#EF4444';
  
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={onClose} 
        className="flex-1 bg-black/60 items-center justify-center px-6"
      >
        <View className={`${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white'} w-full rounded-[45px] p-8 shadow-2xl items-center`}>
          {/* Visual Indicator */}
          <View 
            style={{ backgroundColor: color + '15', borderColor: color + '30' }} 
            className="w-24 h-24 rounded-[36px] items-center justify-center mb-6 border-2"
          >
            <MaterialCommunityIcons 
              name={targetStatus === 'paid' ? 'check-decagram' : 'alert-circle-outline'} 
              size={56} 
              color={color} 
            />
          </View>

          <Text className={`text-2xl font-black ${colors.text} text-center tracking-tighter mb-2`}>
            Update Payment Status
          </Text>
          <Text className={`${colors.textTertiary} text-center font-bold px-4 mb-8 leading-5`}>
            Are you sure you want to mark this ₹{item.amount.toLocaleString()} record as <Text style={{ color }}>{targetStatus.toUpperCase()}</Text>?
          </Text>

          {/* Action Buttons */}
          <View className="w-full gap-4">
            <TouchableOpacity 
              onPress={() => onConfirm(item)}
              style={{ backgroundColor: color }}
              className="py-6 rounded-[28px] items-center justify-center shadow-xl flex-row"
            >
              <MaterialCommunityIcons name="shield-check-outline" size={24} color="white" />
              <Text className="text-white font-black uppercase tracking-[3px] ml-3">Yes, Update Now</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={onClose}
              className="py-5 rounded-[28px] bg-gray-100 dark:bg-gray-800 items-center justify-center"
            >
              <Text className="font-black text-gray-400 uppercase tracking-widest text-[10px]">Cancel Transaction</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
});

export default function FeesManagementScreen({ navigation }: any) {
  const { colors, theme } = useTheme();
  const { users, fees, refreshFees, addTransaction, fetchData } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } catch (error) {
      console.error('Refresh Error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

  const [activeTab, setActiveTab] = useState('manage');
  const [editModal, setEditModal] = useState({ visible: false, item: null });
  const [statusModal, setStatusModal] = useState({ visible: false, item: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);

  const generateInvoiceHtml = (item: FeeRecord) => `
    <html>
      <head>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #1F2937; line-height: 1.5; }
          .header { text-align: center; margin-bottom: 50px; }
          .logo { background: #F472B6; color: white; width: 60px; height: 60px; border-radius: 15px; display: inline-flex; align-items: center; justify-content: center; font-weight: 900; font-size: 24px; margin-bottom: 10px; }
          .title { font-size: 28px; font-weight: 900; color: #111827; letter-spacing: -1px; }
          .subtitle { color: #F472B6; font-weight: 700; text-transform: uppercase; font-size: 12px; letter-spacing: 2px; }
          .receipt-box { border: 2px solid #F3F4F6; border-radius: 24px; padding: 30px; margin-top: 30px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
          .row { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px dashed #E5E7EB; padding-bottom: 10px; }
          .label { font-size: 10px; font-weight: 900; color: #9CA3AF; text-transform: uppercase; letter-spacing: 1px; }
          .value { font-size: 14px; font-weight: 700; color: #1F2937; }
          .amount-box { background: #FDF2F8; border: 1px solid #FBCFE8; padding: 20px; border-radius: 20px; text-align: center; margin-top: 40px; }
          .amount-label { font-size: 10px; font-weight: 900; color: #DB2777; text-transform: uppercase; letter-spacing: 2px; }
          .amount-value { font-size: 36px; font-weight: 900; color: #BE185D; margin-top: 5px; }
          .paid-stamp { border: 3px solid #10B981; color: #10B981; display: inline-block; padding: 5px 20px; border-radius: 10px; font-weight: 900; transform: rotate(-10deg); position: absolute; top: 100px; right: 80px; font-size: 24px; opacity: 0.5; }
          .footer { margin-top: 60px; text-align: center; font-size: 10px; color: #9CA3AF; border-top: 1px solid #F3F4F6; padding-top: 20px; }
          .contact-info { font-size: 10px; font-weight: 700; color: #4B5563; margin-top: 5px; }
        </style>
      </head>
      <body>
        <div class="paid-stamp">PAID</div>
        <div class="header">
          <div class="logo">H</div>
          <div class="title">CHITHODE HAPPYKIDS</div>
          <div class="subtitle">Official Fee Receipt</div>
          <div class="contact-info">Chithode, Erode | Phone: +91 97877 51430</div>
        </div>
        
        <div class="receipt-box">
          <div class="row">
            <span class="label">Receipt Number</span>
            <span class="value">HK-${new Date(item.date).getFullYear()}${item.id.padStart(4, '0')}</span>
          </div>
          <div class="row">
            <span class="label">Payment Date</span>
            <span class="value">${item.date}</span>
          </div>
          <div class="row" style="margin-top: 20px;">
            <span class="label">Student Name</span>
            <span class="value" style="font-size: 18px;">${item.student_name}</span>
          </div>
          <div class="row">
            <span class="label">Student ID</span>
            <span class="value">${item.student_id}</span>
          </div>
          <div class="row">
            <span class="label">Fee Category</span>
            <span class="value">${item.type}</span>
          </div>
          <div class="row" style="margin-top: 20px;">
            <span class="label">Name of Payer</span>
            <span class="value">${(item as any).parent_name || (item as any).father_name || '---'}</span>
          </div>
          <div class="row">
            <span class="label">Monthly Due Day</span>
            <span class="value">Day ${(item as any).due_day || '05'} of month</span>
          </div>
          <div class="row">
            <span class="label">Contact Number</span>
            <span class="value">${(item as any).phone || '---'}</span>
          </div>
        </div>

        <div class="amount-box">
            <div class="amount-label">Total Amount Paid</div>
            <div class="amount-value">₹${item.amount.toLocaleString('en-IN')}</div>
        </div>

        <div class="footer">
          Computer Generated Receipt • Valid Without Signature • Issued on ${new Date().toLocaleDateString()}
        </div>
      </body>
    </html>
  `;

  const handleInvoiceAction = async (item: FeeRecord, mode: 'view' | 'download') => {
    try {
      setIsProcessingPdf(true);
      
      const student = users.find(u => u.id?.toString() === item.student_id?.toString() || u.studentId === item.student_id);
      const resolvedItem = {
        ...item,
        student_id: student?.studentId || item.student_id,
        parent_name: student?.parentName || student?.fatherName || '',
        due_day: student?.fee_due_day || '05',
        phone: student?.phone || student?.fatherPhone || student?.motherPhone || ''
      };
      
      const html = generateInvoiceHtml(resolvedItem as any);
      
      if (mode === 'view') {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        
        // Requested format: StudentName_Date.pdf
        const sanitizedName = (item.student_name || 'Student').replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
        const fileName = `${sanitizedName}_${item.date}.pdf`;
        const newUri = `${FileSystem.cacheDirectory}${fileName}`;
        
        try {
          // Idempotent delete avoids need for getInfoAsync check
          await FileSystem.deleteAsync(newUri, { idempotent: true });
          await FileSystem.moveAsync({ from: uri, to: newUri });
        } catch (fileErr) {
          console.error('File operation error:', fileErr);
          // Fallback to original if renaming fails
          await Sharing.shareAsync(uri, { 
            UTI: 'com.adobe.pdf', 
            mimeType: 'application/pdf'
          });
          return;
        }
        
        // Share/Download
        await Sharing.shareAsync(newUri, { 
          UTI: 'com.adobe.pdf', 
          mimeType: 'application/pdf',
          dialogTitle: `Save Receipt: ${sanitizedName}`
        });
      }
    } catch (err: any) {
      console.error('PDF Generation/Sharing Error:', err);
      Alert.alert('PDF Error', `Action could not be completed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const currentMonthIdx = new Date().getMonth();
  const currentYearStr  = new Date().getFullYear().toString();
  const [activeMonth, setActiveMonth] = useState(MONTH_DATA[currentMonthIdx]);
  const [activeYear,  setActiveYear]  = useState(YEAR_DATA.find(y => y.code === currentYearStr) || YEAR_DATA[6]); 

  useEffect(() => {
    api.get('/fee-structures').then(res => setFeeStructures(res.data)).catch(() => {});
    refreshFees();
  }, []);

  const students = useMemo(() => users.filter(u => u.role === 'student' && u.status === 'active'), [users]);

  const filteredFees = useMemo(() => {
    let list = [...fees];
    const sq = searchQuery.toLowerCase();

    // 2. Tab & Month & Year filter
    const yCode = activeYear.code;
    const mCode = activeMonth.code;
    const monthPrefix = `${yCode}-${mCode}-`;

    let baseList: any[] = [];

    if (activeTab === 'manage') {
        const todayStr = new Date().toISOString().split('T')[0];
        
        // Find existing monthly fees
        const existingMonthly = list.filter(f => {
            const types = (f.type || '').toLowerCase();
            const isSelectedMonth = f.date.includes(monthPrefix);
            const isOverdue = f.status === 'unpaid' && f.due_date && f.due_date < todayStr;
            return !types.includes('admission') && (isSelectedMonth || isOverdue);
        });

        // Add "Implicit Fees" for students who don't have a record for this month yet
        const implicitFees: any[] = [];
        students.forEach(student => {
            const studentFeeAmount = parseInt(student.fees || '0');
            if (studentFeeAmount > 0) {
                // Check if this student already has a monthly record for THIS SPECIFIC selected month
                const dbId = student.id?.toString();
                const schoolId = student.studentId?.toString();
                
                const hasRecordThisMonth = list.some(f => 
                    (f.student_id?.toString() === dbId || f.student_id?.toString() === schoolId) && 
                    f.date.includes(monthPrefix) &&
                    !(f.type || '').toLowerCase().includes('admission')
                );

                if (!hasRecordThisMonth) {
                    const dueDay = student.fee_due_day || '5';
                    const dueDate = `${yCode}-${mCode}-${dueDay.padStart(2, '0')}`;
                    
                    implicitFees.push({
                        id: `VIRTUAL_${student.id}_${mCode}_${yCode}`,
                        student_id: student.studentId || student.id, // Prefer directory ID
                        student_name: student.name,
                        type: 'Monthly Fee',
                        amount: studentFeeAmount,
                        status: 'unpaid', // Default to unpaid for the ledger
                        date: `${yCode}-${mCode}-01`,
                        due_date: dueDate,
                        isVirtual: true
                    });
                }
            }
        });

        baseList = [...existingMonthly, ...implicitFees];
    } else if (activeTab === 'admission') {
        baseList = list.filter(f => (f.type || '').split(',').some((t:any) => t.trim().toLowerCase() === 'admission'));
    } else if (activeTab === 'history') {
        // Show all paid records globally for a true "history", or filtered by month if active
        baseList = list.filter(f => 
          (f.status || '').toLowerCase() === 'paid' || 
          f.date.includes(monthPrefix)
        );
    }

    // 3. Search filter at the end
    if (sq) {
        baseList = baseList.filter(f => 
            (f.student_name || '').toLowerCase().includes(sq) || 
            (f.student_id || '').toLowerCase().includes(sq)
        );
    }

    return baseList.filter(f => {
      const student = users.find(u => u.id?.toString() === f.student_id?.toString() || u.studentId === f.student_id);
      // Only show fees for students who exist in the system and are active
      return student && student.status === 'active';
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [fees, activeTab, activeMonth, activeYear, searchQuery, students, users]);

  const stats = useMemo(() => {
    const total = filteredFees.reduce((acc, f) => acc + (f.amount || 0), 0);
    const paid = filteredFees.filter(f => f.status === 'paid').reduce((acc, f) => acc + (f.amount || 0), 0);
    const todayStr = new Date().toISOString().split('T')[0];
    const overdue = filteredFees.filter(f => f.status === 'unpaid' && f.due_date && f.due_date < todayStr).reduce((acc, f) => acc + (f.amount || 0), 0);
    return { 
      total, 
      paid, 
      pending: total - paid, 
      overdue,
      count: filteredFees.length,
      pct: total > 0 ? Math.round((paid/total) * 100) : 0
    };
  }, [filteredFees]);

  const handleUpdateFee = async (updatedItem: any) => {
    try {
      setIsLocalLoading(true);
      const payload = {
          student_id: updatedItem.student_id,
          student_name: updatedItem.student_name,
          type: updatedItem.type,
          amount: updatedItem.amount,
          status: updatedItem.status,
          date: updatedItem.date,
          due_date: updatedItem.due_date
      };
      if (updatedItem.id === 'NEW' || (updatedItem.id?.toString().startsWith('VIRTUAL_'))) {
        await api.post('/fees', payload);
      } else {
        await api.put(`/fees/${updatedItem.id}`, payload);
      }
      
      await refreshFees();
      
      // Automatically post to income ledger if marked as paid
      if (updatedItem.status === 'paid') {
        try {
          await addTransaction({
            id: Date.now().toString(),
            name: `Fee: ${updatedItem.student_name} (${updatedItem.type})`,
            amount: updatedItem.amount,
            category: 'Fees',
            type: 'income',
            date: new Date().toISOString().split('T')[0]
          });
        } catch (txErr) {
          console.error('Failed to auto-post income:', txErr);
        }
      }

      setIsLocalLoading(false);
      setEditModal({ visible: false, item: null });
      // Small timeout to allow state to settle before alert
      setTimeout(() => {
        Alert.alert('Treasury Update ✨', 'The record has been updated and posted to income history.');
      }, 300);
    } catch (err) {
      console.error('Update fee error:', err);
      setIsLocalLoading(false);
      Alert.alert('Error', 'Financial update failed.');
    }
  };

  const toggleStatus = async (item: FeeRecord) => {
    setStatusModal({ visible: true, item: item as any });
  };

  const handleConfirmStatus = async (item: any) => {
    try {
      // Close modal first for snappier UI
      setStatusModal({ visible: false, item: null });
      setIsLocalLoading(true);
      const targetStatus = item.status === 'paid' ? 'unpaid' : 'paid';
      
      if (item.id.toString().startsWith('VIRTUAL_')) {
        // Correct logic for virtual items: create new record
        const payload = {
          student_id: item.student_id,
          student_name: item.student_name,
          type: item.type,
          amount: item.amount,
          status: targetStatus,
          date: item.date, // Preserve the month/year of the virtual item
          due_date: item.due_date
        };
        await api.post('/fees', payload);
      } else {
        await api.post(`/fees/${item.id}/toggle-status`);
      }

      // Automatically post to income ledger if marked as paid
      if (targetStatus === 'paid') {
          try {
            await addTransaction({
              id: Date.now().toString(),
              name: `Payment: ${item.student_name} (${item.type})`,
              amount: item.amount,
              category: 'Fees',
              type: 'income',
              date: new Date().toISOString().split('T')[0]
            });
          } catch (txErr) {
            console.error('Failed to auto-post income:', txErr);
          }
      }

      // Re-load everything to ensure Transactions sync up too
      await Promise.all([refreshFees(), fetchData()]);
      setIsLocalLoading(false);
    } catch (err) {
      console.error('Status toggle error:', err);
      setIsLocalLoading(false);
      Alert.alert('Error', 'Update failed.');
    }
  };

  const renderFeeItem = useCallback(({ item }: any) => {
    const isOverdue = item.status === 'unpaid' && item.due_date && new Date(item.due_date) < new Date(new Date().toISOString().split('T')[0]);
    
    // Find directory ID if the record has database ID
    const student = users.find(u => u.id?.toString() === item.student_id?.toString() || u.studentId === item.student_id);
    const displayId = student?.studentId || item.student_id;

    return (
      <View 
        style={{ elevation: 8 }}
        className={`mx-6 rounded-[40px] border-2 mb-6 overflow-hidden shadow-xl ${theme === 'dark' ? 'bg-[#1a1a18] border-gray-800' : 'bg-white border-brand-pink/5'}`}
      >
         <View className="flex-row items-center justify-between p-6">
            <View className="flex-row items-center flex-1">
               <View className={`w-16 h-16 rounded-[24px] items-center justify-center mr-4 ${isOverdue ? 'bg-red-500' : 'bg-brand-pink'}`}>
                 <MaterialCommunityIcons name="account-school-outline" size={36} color="white" />
               </View>
               <View className="flex-1">
                  <Text className={`font-black text-xl tracking-tighter ${colors.text}`} numberOfLines={1}>{item.student_name}</Text>
                  <View className="flex-row items-center mt-0.5">
                    <Text className={`text-[10px] font-black uppercase tracking-widest ${isOverdue ? "text-red-500" : colors.textTertiary}`}>
                         ID: {displayId} • {item.due_date || 'N/A'}
                    </Text>
                  </View>
                  {item.status === 'paid' && item.paid_at && (
                    <View className="flex-row items-center mt-1">
                       <MaterialCommunityIcons name="clock-check-outline" size={12} color="#10B981" />
                       <Text className="text-[9px] font-bold text-green-600 uppercase tracking-widest ml-1">
                         Paid: {new Date(item.paid_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                       </Text>
                    </View>
                  )}
               </View>
            </View>
            
            <TouchableOpacity 
              onPress={() => toggleStatus(item as any)}
              className={`px-5 py-2.5 rounded-[18px] shadow-sm ${item.status?.toLowerCase() === 'paid' ? 'bg-green-500' : 'bg-red-500'}`}
            >
               <Text className="text-[10px] font-black text-white uppercase tracking-widest">
                  {item.status?.toUpperCase()}
               </Text>
            </TouchableOpacity>
         </View>
         
         <LinearGradient
            colors={theme === 'dark' ? ['#25251d', '#1c1c14'] : ['#FDF2F8', '#F9FAFB']}
            className="p-6 flex-row justify-between items-center border-t border-gray-100 dark:border-gray-800"
         >
            <View>
               <Text className={`text-[9px] font-black uppercase tracking-[3px] ${colors.textTertiary} mb-1 opacity-60`}>{item.type}</Text>
               <Text className={`font-black text-3xl tracking-tighter ${colors.text}`}>₹{item.amount.toLocaleString()}</Text>
            </View>
            
            <View className="flex-row gap-4">
              <TouchableOpacity 
                onPress={() => setEditModal({ visible: true, item: item as any })} 
                className="px-6 py-3 rounded-2xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 flex-row items-center justify-center shadow-sm"
              >
                 <MaterialCommunityIcons name="pencil" size={18} color={theme === 'dark' ? '#9CA3AF' : '#4B5563'} />
                 <Text className={`ml-2 font-black text-[10px] uppercase tracking-widest ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Edit</Text>
              </TouchableOpacity>
              
              {(item.status?.toLowerCase() === 'paid') && (
                <TouchableOpacity 
                  onPress={() => handleInvoiceAction(item as any, 'download')} 
                  className="w-14 h-14 rounded-2xl bg-indigo-500 items-center justify-center shadow-lg shadow-indigo-500/30"
                >
                   <MaterialCommunityIcons name="file-download-outline" size={26} color="white" />
                </TouchableOpacity>
              )}
            </View>
         </LinearGradient>
         
         {isOverdue && (
            <View className="bg-red-500 py-1.5 items-center">
                <Text className="text-[10px] font-black text-white uppercase tracking-[4px]">Delayed Payment</Text>
            </View>
         )}
      </View>
    );
  }, [colors, theme]);

  const ListHeader = useMemo(() => (
    <View className={`${theme === 'dark' ? 'bg-[#1c1c14]' : 'bg-white'}`}>
      {/* ── Background Header Illustration ── */}
      <View className="absolute top-0 left-0 right-0 h-[450px] overflow-hidden">
          <LinearGradient
              colors={[theme === 'dark' ? '#1e1b4b' : '#FDF2F8', theme === 'dark' ? '#1c1c14' : '#FFFFFF']}
              className="absolute inset-0"
          />
          <Image 
              source={require('../../assets/images/playschool_3d.png')} 
              style={{ width: '100%', height: '100%', opacity: theme === 'dark' ? 0.1 : 0.2, transform: [{ scale: 1.5 }, { translateY: -40 }] }}
              resizeMode="cover"
          />
      </View>

      {/* Header */}
      <View className="px-6 pt-12 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <TouchableOpacity onPress={() => navigation.goBack()} 
              className={`${theme === 'dark' ? 'bg-[#25251d] border-gray-800' : 'bg-white border-brand-pink/20'} w-14 h-14 rounded-2xl items-center justify-center shadow-xl border mb-6`}>
              <MaterialCommunityIcons name="arrow-left" size={28} color={theme === 'dark' ? '#FFF' : '#F472B6'} />
            </TouchableOpacity>
            <Text className={`text-5xl font-black ${colors.text} tracking-tighter`}>School</Text>
            <Text className="text-2xl font-black text-brand-pink mt-[-4px]">Treasury ✓</Text>
          </View>
          <View className="bg-brand-pink w-24 h-24 rounded-[36px] items-center justify-center shadow-2xl border-4 border-white rotate-3 relative overflow-hidden">
            <MaterialCommunityIcons name="cash-multiple" size={48} color="white" />
          </View>
        </View>
      </View>

      {/* Summary Area */}
      <View className="px-6 mb-8 mt-2">
        <Text className={`text-[10px] font-black uppercase tracking-[3px] ${colors.textTertiary} mb-5 opacity-70`}>Financial Health</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="overflow-visible">
          <SummaryCard label="COLLECTED" value={`₹${stats.paid.toLocaleString()}`} icon="check-decagram-outline" color="#10B981" colors={colors} theme={theme} />
          <SummaryCard label="OVERDUE" value={`₹${stats.overdue.toLocaleString()}`} icon="clock-alert-outline" color="#EF4444" colors={colors} theme={theme} />
          <SummaryCard label="PENDING" value={`₹${stats.pending.toLocaleString()}`} icon="alert-circle-outline" color="#F59E0B" colors={colors} theme={theme} />
          <SummaryCard label="TOTAL RECORDS" value={stats.count} icon="file-document-outline" color="#3B82F6" colors={colors} theme={theme} />
        </ScrollView>
      </View>


      {/* Category Selection Dropdown */}
      <View className="px-6 mb-8 mt-2">
        <Text className={`text-[10px] font-black uppercase tracking-[3px] ${colors.textTertiary} mb-5 opacity-70`}>Operational Ledger</Text>
        <TouchableOpacity 
          onPress={() => setIsTypeDropdownOpen(true)}
          activeOpacity={0.9}
          className={`${theme === 'dark' ? 'bg-[#25251d] border-gray-800' : 'bg-white border-brand-pink/10'} p-6 rounded-[36px] border shadow-xl flex-row items-center justify-between`}
        >
          <View className="flex-row items-center">
            <View className="bg-brand-pink w-14 h-14 rounded-[22px] items-center justify-center mr-4 shadow-lg shadow-brand-pink/20">
              <MaterialCommunityIcons 
                name={activeTab === 'manage' ? 'calendar-month' : (activeTab === 'admission' ? 'account-plus' : 'history')} 
                size={28} 
                color="white" 
              />
            </View>
            <View>
              <Text className={`text-[10px] font-black uppercase tracking-widest ${colors.textTertiary} opacity-60`}>Current View</Text>
              <Text className={`text-xl font-black ${colors.text} tracking-tighter`}>
                {activeTab === 'manage' ? 'Monthly Dues' : (activeTab === 'admission' ? 'Admissions' : 'Transaction Log')}
              </Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-down" size={28} color={theme === 'dark' ? '#F472B6' : colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Action Line & Month Filter Dropdown */}
      <View className="px-6 mb-6">
        <View className="flex-row justify-between items-center mb-6">
            <Text className={`text-[11px] font-black uppercase tracking-[4px] ${colors.textTertiary} opacity-60`}>{activeTab.toUpperCase()} LEDGER</Text>
            {activeTab === 'admission' && (
              <TouchableOpacity 
                  onPress={() => setEditModal({ visible: true, item: { id: 'NEW', student_id: '', student_name: '', amount: 0, type: activeTab === 'admission' ? 'Admission' : 'Monthly Fee', status: 'unpaid', date: new Date().toISOString().split('T')[0], due_date: new Date().toISOString().split('T')[0] } as any })}
                  className="bg-brand-pink w-14 h-14 rounded-[24px] items-center justify-center shadow-2xl"
                  style={{ elevation: 15 }}
              >
                  <MaterialCommunityIcons name="plus" size={36} color="white" />
              </TouchableOpacity>
            )}
        </View>
        {(activeTab === 'manage' || activeTab === 'history') && (
            <MonthDropdown activeMonth={activeMonth} activeYear={activeYear} onSelectMonth={setActiveMonth} onSelectYear={setActiveYear} colors={colors} theme={theme} />
        )}
      </View>
    </View>
  ), [activeTab, activeMonth, activeYear, colors, theme, stats, searchQuery, isTypeDropdownOpen]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF' }}>
      <FlatList
        data={activeTab === 'list' ? [] : filteredFees}
        keyExtractor={(item) => item.id}
        renderItem={renderFeeItem}
        ListHeaderComponent={ListHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#F472B6"
            colors={["#F472B6"]}
            progressBackgroundColor={theme === 'dark' ? '#1c1c14' : '#FFFFFF'}
          />
        }
        ListEmptyComponent={activeTab === 'list' ? (
            <View className="px-6">
                {feeStructures.map(f => (
                    <View key={f.id} className={`p-6 rounded-[32px] border mb-4 ${colors.surface} ${colors.border}`}>
                        <Text className={`font-black text-lg ${colors.text}`}>{f.name}</Text>
                        <Text className="text-brand-pink font-black text-2xl">₹{f.amount}</Text>
                    </View>
                ))}
            </View>
        ) : (
            <View className="px-6 py-20 items-center">
                <Text className={`${colors.textTertiary} font-bold`}>No records found</Text>
            </View>
        )}
        initialNumToRender={10}
        windowSize={5}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <FeeEditorModal 
        visible={editModal.visible} 
        onClose={() => setEditModal({ visible: false, item: null })}
        item={editModal.item}
        colors={colors}
        theme={theme}
        students={students}
        structures={feeStructures}
        onSave={handleUpdateFee}
      />

      <StatusToggleModal 
        visible={statusModal.visible}
        onClose={() => setStatusModal({ visible: false, item: null })}
        item={statusModal.item}
        colors={colors}
        theme={theme}
        onConfirm={handleConfirmStatus}
      />
      
      {isTypeDropdownOpen && (
        <Modal visible={isTypeDropdownOpen} transparent animationType="fade">
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={() => setIsTypeDropdownOpen(false)} 
            className="flex-1 bg-black/60 items-center justify-center px-6"
          >
            <View className={`${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white'} w-full rounded-[40px] p-8 shadow-2xl`}>
              <Text className={`text-xl font-black ${colors.text} mb-6 text-center`}>Choose Ledger Category</Text>
              
              {[
                { id: 'manage', label: 'Monthly Fees', icon: 'calendar-month' },
                { id: 'admission', label: 'Admission Fees', icon: 'account-plus' },
                { id: 'history', label: 'Transaction History', icon: 'history' }
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => { setActiveTab(opt.id); setIsTypeDropdownOpen(false); }}
                  className={`flex-row items-center p-5 rounded-[24px] mb-3 ${activeTab === opt.id ? 'bg-brand-pink shadow-lg shadow-brand-pink/30' : (theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50')}`}
                >
                  <View className={`w-10 h-10 rounded-xl items-center justify-center mr-4 ${activeTab === opt.id ? 'bg-white/20' : 'bg-brand-pink/10'}`}>
                    <MaterialCommunityIcons name={opt.icon as any} size={22} color={activeTab === opt.id ? 'white' : '#F472B6'} />
                  </View>
                  <Text className={`font-black text-base ${activeTab === opt.id ? 'text-white' : colors.text}`}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity 
                onPress={() => setIsTypeDropdownOpen(false)}
                className="mt-4 py-4 rounded-3xl bg-gray-100 dark:bg-gray-800 items-center"
              >
                <Text className="font-black text-gray-500 uppercase tracking-widest text-[10px]">Cancel Selection</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {(isLocalLoading || isProcessingPdf) && (
          <View className="absolute inset-0 bg-black/40 flex items-center justify-center z-50">
             <ActivityIndicator color="#F472B6" size="large" />
             <Text className="text-white font-black mt-4 uppercase tracking-[3px] text-[10px]">Processing Finance Document...</Text>
          </View>
      )}
    </SafeAreaView>
  );
}
