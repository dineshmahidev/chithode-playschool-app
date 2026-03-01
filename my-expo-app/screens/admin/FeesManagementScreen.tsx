import React, { useState, useCallback, memo, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert, Modal, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, FeeRecord } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
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

const SummaryCard = memo(({ label, value, icon, color, colors }: any) => (
  <View className={`p-4 rounded-[24px] border flex-row items-center mr-3 min-w-[140px] ${colors.surface} ${colors.border}`}>
    <View style={{ backgroundColor: color + '20' }} className="w-10 h-10 rounded-xl items-center justify-center mr-3">
      <MaterialCommunityIcons name={icon} size={20} color={color} />
    </View>
    <View>
      <Text className={`text-[8px] font-black tracking-widest ${colors.textTertiary}`}>{label}</Text>
      <Text className={`text-lg font-black ${colors.text}`}>{value}</Text>
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
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/80 justify-center px-6">
        <View className={`rounded-[40px] p-8 border ${theme === 'dark' ? 'bg-[#1c1c14]' : 'bg-white'} ${colors.border} shadow-2xl`}>
          <Text className={`text-2xl font-black tracking-tighter ${colors.text} mb-8`}>
            {item?.id === 'NEW' ? 'Institutional Entry 🏛️' : 'Modify Record 💎'}
          </Text>

          <View className="mb-6">
            <Text className={`text-[10px] font-black mb-2 uppercase tracking-widest ${colors.textTertiary}`}>Student Identity</Text>
            <Pressable 
              onPress={() => item?.id === 'NEW' && setShowStudentPicker(!showStudentPicker)} 
              className={`p-5 rounded-3xl border ${colors.surface} ${colors.border} flex-row justify-between ${item?.id !== 'NEW' ? 'opacity-60 bg-gray-50' : ''}`}
            >
              <Text className={`font-black ${sName ? colors.text : colors.textTertiary}`}>{sName || 'Select Student Vendor'}</Text>
              {item?.id === 'NEW' && <MaterialCommunityIcons name="account-search" size={20} color="#F472B6" />}
            </Pressable>
            {showStudentPicker && (
              <View className={`mt-3 rounded-3xl border border-gray-100 p-3 ${colors.surface} max-h-[200px]`}>
                <TextInput className={`p-4 font-bold text-xs ${colors.text} bg-black/5 rounded-2xl mb-3`} placeholder="Search by name/id..." value={studentSearch} onChangeText={setStudentSearch} />
                <ScrollView nestedScrollEnabled>{filteredStudents?.map((s: any) => (
                  <Pressable key={s.id} className="p-4 rounded-2xl mb-1 border-b border-gray-50" onPress={() => { setSName(s.name); setSid(s.studentId || s.student_id); setShowStudentPicker(false); }}>
                    <Text className={`font-black ${colors.text}`}>{s.name} ({s.studentId || s.student_id})</Text>
                  </Pressable>
                ))}</ScrollView>
              </View>
            )}
          </View>
          
          <View className="flex-row gap-4 mb-6">
            <View className="flex-1">
                <Text className={`text-[10px] font-black mb-2 uppercase tracking-widest ${colors.textTertiary}`}>Category Dropdown</Text>
                <Pressable 
                  onPress={() => item?.id === 'NEW' && setShowTypePicker(!showTypePicker)} 
                  className={`p-5 rounded-3xl border ${colors.surface} ${colors.border} flex-row justify-between ${item?.id !== 'NEW' ? 'opacity-60 bg-gray-50' : ''}`}
                >
                  <Text className={`font-black uppercase text-[10px] ${selectedType ? colors.text : colors.textTertiary}`}>{selectedType || 'Pick Type'}</Text>
                  {item?.id === 'NEW' && <MaterialCommunityIcons name="chevron-down" size={20} color="#F472B6" />}
                </Pressable>
                {showTypePicker && item?.id === 'NEW' && (
                  <View className="absolute top-16 left-0 right-0 bg-white border border-gray-100 rounded-3xl shadow-xl z-50 p-2">
                    <ScrollView className="max-h-[150px]">
                      {structures.map((s: any) => (
                        <Pressable key={s.id} onPress={() => { setSelectedType(s.name); setAmount(s.amount.toString()); setShowTypePicker(false); }} className="p-4 rounded-2xl">
                          <Text className="font-black text-[10px] uppercase text-gray-600">{s.name}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
            </View>
            <View className="flex-1">
               <Text className={`text-[10px] font-black mb-2 uppercase tracking-widest ${colors.textTertiary}`}>Fee Due Date</Text>
               <Pressable onPress={() => setShowPicker(true)} className={`p-5 rounded-3xl border ${colors.surface} ${colors.border} flex-row justify-between`}>
                  <Text className={`font-black text-[10px] ${colors.text}`}>{dueDate}</Text>
                  <MaterialCommunityIcons name="calendar-clock" size={20} color="#F472B6" />
               </Pressable>
               {showPicker && <DateTimePicker value={new Date(dueDate)} mode="date" display="default" onChange={(_: DateTimePickerEvent, d?: Date) => { setShowPicker(false); if(d) setDueDate(d.toISOString().split('T')[0]); }} />}
            </View>
          </View>

          <View className="mb-10">
            <Text className={`text-[10px] font-black mb-2 uppercase tracking-widest ${colors.textTertiary}`}>Secure Transaction Amount</Text>
            <View className={`flex-row items-center p-6 rounded-[35px] border ${colors.surface} ${colors.border} bg-brand-pink/5`}>
               <Text className="text-3xl font-black text-brand-pink mr-3">₹</Text>
               <TextInput className={`flex-1 text-3xl font-black ${colors.text}`} value={amount} onChangeText={setAmount} keyboardType="numeric" />
            </View>
          </View>

          <View className="flex-row gap-4">
             <TouchableOpacity onPress={onClose} className={`flex-1 p-5 rounded-[28px] border ${colors.border} items-center justify-center flex-row bg-gray-50`}>
                <MaterialCommunityIcons name="close-circle-outline" size={18} color="#9CA3AF" />
                <Text className="font-black uppercase tracking-widest text-[#9CA3AF] text-[10px] ml-2">Close Action</Text>
             </TouchableOpacity>
             <TouchableOpacity onPress={handleSave} className="flex-[2] bg-brand-pink p-5 rounded-[28px] items-center justify-center flex-row shadow-lg shadow-brand-pink/30">
                <MaterialCommunityIcons name="check-circle-outline" size={20} color="white" />
                <Text className="text-white font-black uppercase tracking-[2px] text-[12px] ml-2">Confirm Save</Text>
             </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

export default function FeesManagementScreen({ navigation }: any) {
  const { colors, theme } = useTheme();
  const { users, fees, refreshFees } = useAuth();
  const [activeTab, setActiveTab] = useState('manage');
  const [editModal, setEditModal] = useState({ visible: false, item: null });
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
          .footer { margin-top: 80px; text-align: center; font-size: 10px; color: #9CA3AF; border-top: 1px solid #F3F4F6; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="paid-stamp">PAID</div>
        <div class="header">
          <div class="logo">H</div>
          <div class="title">CHITHODE HAPPYKIDS</div>
          <div class="subtitle">Official Fee Receipt</div>
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
      const html = generateInvoiceHtml(item);
      
      if (mode === 'view') {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      }
    } catch (err) {
      Alert.alert('PDF Error', 'Action could not be completed.');
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const currentMonthIdx = new Date().getMonth();
  const [activeMonth, setActiveMonth] = useState(MONTH_DATA[currentMonthIdx]);
  const [activeYear,  setActiveYear]  = useState(YEAR_DATA[2]); // Default 2026

  useEffect(() => {
    api.get('/fee-structures').then(res => setFeeStructures(res.data)).catch(() => {});
    refreshFees();
  }, []);

  const students = useMemo(() => users.filter(u => u.role === 'student'), [users]);

  // Memoize filtered data to prevent re-calculations during render
  const filteredFees = useMemo(() => {
    let list = fees;
    const sq = searchQuery.toLowerCase();

    // 1. Search filter
    if (sq) {
        list = list.filter(f => 
            (f.student_name || '').toLowerCase().includes(sq) || 
            (f.student_id || '').toLowerCase().includes(sq)
        );
    }

    // 2. Tab & Month & Year filter
    const yCode = activeYear.code;
    const mCode = activeMonth.code;

    if (activeTab === 'manage') {
        const todayStr = new Date().toISOString().split('T')[0];
        return list.filter(f => {
            const types = (f.type || '').toLowerCase();
            const isSelectedMonth = f.date.includes(`${yCode}-${mCode}-`);
            const isOverdue = f.status === 'unpaid' && f.due_date && f.due_date < todayStr;
            return !types.includes('admission') && (isSelectedMonth || isOverdue);
        });
    } else if (activeTab === 'admission') {
        return list.filter(f => (f.type || '').split(',').some((t:any) => t.trim().toLowerCase() === 'admission'));
    } else if (activeTab === 'history') {
        return list.filter(f => f.date.includes(`${yCode}-${mCode}-`));
    }
    return [];
  }, [fees, activeTab, activeMonth, activeYear, searchQuery]);

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
      if (updatedItem.id === 'NEW') await api.post('/fees', payload);
      else await api.put(`/fees/${updatedItem.id}`, payload);
      
      await refreshFees();
      setEditModal({ visible: false, item: null });
      Alert.alert('Treasury Update ✨', 'The record has been updated in the cloud.');
    } catch (err) {
      Alert.alert('Error', 'Financial update failed.');
    } finally {
      setIsLocalLoading(false);
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      await api.post(`/fees/${id}/toggle-status`);
      refreshFees();
    } catch {}
  };

  const renderFeeItem = useCallback(({ item }: any) => {
    const isOverdue = item.status === 'unpaid' && item.due_date && new Date(item.due_date) < new Date(new Date().toISOString().split('T')[0]);
    
    return (
      <View className={`mx-6 p-6 rounded-[35px] border-2 mb-6 ${colors.surface} shadow-lg shadow-black/5 ${isOverdue ? 'border-red-400' : colors.border}`}>
         <View className="flex-row items-center justify-between mb-5">
            <View className="flex-row items-center flex-1">
               <View className={`w-14 h-14 rounded-[22px] items-center justify-center mr-4 ${theme === 'dark' ? 'bg-brand-pink/10' : 'bg-brand-pink/5'}`}>
                 <MaterialCommunityIcons name="account-school-outline" size={32} color={isOverdue ? "#EF4444" : "#F472B6"} />
               </View>
               <View className="flex-1">
                  <Text className={`font-black text-lg ${colors.text}`}>{item.student_name}</Text>
                  <View className="flex-row items-center">
                    <Text className={`text-[10px] font-black uppercase tracking-widest ${isOverdue ? "text-red-500" : colors.textTertiary}`}>
                        {item.student_id} • DUE: {item.due_date || 'N/A'}
                    </Text>
                    {isOverdue && (
                      <View className="ml-2 bg-red-100 px-2 py-0.5 rounded-md">
                        <Text className="text-[8px] font-black text-red-600">OVERDUE</Text>
                      </View>
                    )}
                  </View>
               </View>
            </View>
            <Pressable 
              onPress={() => toggleStatus(item.id)}
              className={`px-5 py-2.5 rounded-[18px] border shadow-sm ${item.status === 'paid' ? 'bg-green-500 border-green-500' : 'bg-white border-red-400'}`}
            >
               <Text className={`text-[9px] font-black ${item.status === 'paid' ? 'text-white' : 'text-red-500'}`}>{item.status.toUpperCase()}</Text>
            </Pressable>
         </View>
         
         <View className={`p-5 rounded-[28px] flex-row justify-between items-center ${theme === 'dark' ? 'bg-black/10' : 'bg-gray-50'}`}>
            <View>
               <Text className={`text-[9px] font-black uppercase tracking-[3px] ${colors.textTertiary} mb-1`}>{item.type}</Text>
               <Text className={`font-black text-2xl ${colors.text}`}>₹{item.amount.toLocaleString()}</Text>
            </View>
            <View className="flex-row gap-3">
              <Pressable onPress={() => setEditModal({ visible: true, item: item as any })} className="w-10 h-10 rounded-xl bg-gray-200 border border-gray-300 items-center justify-center">
                 <MaterialCommunityIcons name="pencil-outline" size={18} color="#4B5563" />
              </Pressable>
              {item.status === 'paid' && (
                <>
                  <Pressable 
                    onPress={() => handleInvoiceAction(item as any, 'view')} 
                    className="w-10 h-10 rounded-xl bg-indigo-500 items-center justify-center shadow-md shadow-indigo-500/20"
                  >
                     <MaterialCommunityIcons name="eye-outline" size={18} color="white" />
                  </Pressable>
                  <Pressable 
                    onPress={() => handleInvoiceAction(item as any, 'download')} 
                    className="w-10 h-10 rounded-xl bg-brand-pink items-center justify-center shadow-md shadow-brand-pink/20"
                  >
                     <MaterialCommunityIcons name="tray-arrow-down" size={18} color="white" />
                  </Pressable>
                </>
              )}
            </View>
         </View>
      </View>
    );
  }, [colors, theme]);

  const ListHeader = useMemo(() => (
    <View>
      {/* Header */}
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Pressable onPress={() => navigation.goBack()} className={`mb-4 w-12 h-12 rounded-2xl items-center justify-center border ${colors.surface} ${colors.border}`}>
              <MaterialCommunityIcons name="arrow-left" size={28} color={theme === 'dark' ? '#FFF' : '#000'} />
            </Pressable>
            <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>School</Text>
            <Text className="text-2xl font-bold text-brand-pink">Treasury ✓</Text>
          </View>
          <View className="bg-brand-pink w-16 h-16 rounded-3xl items-center justify-center shadow-lg shadow-brand-pink/30">
            <MaterialCommunityIcons name="cash-multiple" size={32} color="white" />
          </View>
        </View>
      </View>

      {/* Summary Area */}
      <View className="px-6 mb-8 mt-2">
        <Text className={`text-[10px] font-black uppercase tracking-widest ${colors.textTertiary} mb-3`}>Collection Stats</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <SummaryCard label="COLLECTED" value={`₹${stats.paid}`} icon="check-decagram" color="#10B981" colors={colors} />
          <SummaryCard label="OVERDUE" value={`₹${stats.overdue}`} icon="clock-alert-outline" color="#EF4444" colors={colors} />
          <SummaryCard label="PENDING" value={`₹${stats.pending}`} icon="alert-circle" color="#F59E0B" colors={colors} />
          <SummaryCard label="RECORDS" value={stats.count} icon="file-document-outline" color="#3B82F6" colors={colors} />
        </ScrollView>
      </View>

      {/* Search Bar */}
      <View className="px-6 mb-6">
        <View className={`flex-row items-center px-4 py-3 rounded-2xl border ${colors.surface} ${colors.border}`}>
          <MaterialCommunityIcons name="magnify" size={22} color="#9CA3AF" />
          <TextInput 
            className={`flex-1 ml-3 font-bold text-sm ${colors.text}`}
            placeholder="Search student..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Category Selection Dropdown */}
      <View className="px-6 mb-6 mt-4">
        <Text className={`text-[10px] font-black uppercase tracking-widest ${colors.textTertiary} mb-3 ml-1`}>Selection Ledger</Text>
        <TouchableOpacity 
          onPress={() => setIsTypeDropdownOpen(true)}
          activeOpacity={0.8}
          className={`${colors.surface} p-5 rounded-[30px] border ${colors.border} flex-row items-center justify-between shadow-sm`}
        >
          <View className="flex-row items-center">
            <View className="bg-brand-pink/10 w-10 h-10 rounded-2xl items-center justify-center mr-3">
              <MaterialCommunityIcons 
                name={activeTab === 'manage' ? 'calendar-month' : (activeTab === 'admission' ? 'account-plus' : 'history')} 
                size={22} 
                color="#F472B6" 
              />
            </View>
            <View>
              <Text className={`text-[10px] font-black uppercase tracking-widest ${colors.textTertiary}`}>Current Ledger</Text>
              <Text className={`text-base font-black ${colors.text}`}>
                {activeTab === 'manage' ? 'Monthly Fees' : (activeTab === 'admission' ? 'Admission Fees' : 'Transaction History')}
              </Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-down" size={24} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Action Line & Month Filter Dropdown */}
      <View className="px-6 mb-6">
        <View className="flex-row justify-between items-center mb-6">
            <Text className={`text-[11px] font-black uppercase tracking-[3px] ${colors.textTertiary}`}>{activeTab.toUpperCase()} LEDGER</Text>
            {activeTab !== 'history' && (
              <Pressable 
                  onPress={() => setEditModal({ visible: true, item: { id: 'NEW', student_id: '', student_name: '', amount: 0, type: activeTab === 'admission' ? 'Admission' : 'Monthly Fee', status: 'unpaid', date: new Date().toISOString().split('T')[0], due_date: new Date().toISOString().split('T')[0] } as any })}
                  className="bg-brand-pink w-14 h-14 rounded-[22px] items-center justify-center shadow-lg shadow-brand-pink/40"
              >
                  <MaterialCommunityIcons name="plus" size={32} color="white" />
              </Pressable>
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
