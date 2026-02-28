import React, { useState, useCallback, memo, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert, Modal, ActivityIndicator, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';

// ─── CONSTANTS ───
const FEES_TABS = [
  { id: 'manage', label: 'Monthly' },
  { id: 'admission', label: 'Admission' },
  { id: 'history', label: 'History' },
  { id: 'list', label: 'Config' }
] as const;

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

const MonthPill = memo(({ month, isActive, onPress, colors }: any) => (
  <Pressable 
    onPress={() => onPress(month)}
    className={`px-4 py-2 rounded-xl mx-1 border ${isActive ? 'bg-brand-pink border-brand-pink' : `${colors.surface} ${colors.border}`}`}
  >
    <Text className={`text-[10px] font-black ${isActive ? 'text-white' : colors.textSecondary}`}>
      {month.name.substring(0, 3).toUpperCase()}
    </Text>
  </Pressable>
));

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
  const [amount, setAmount] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sName, setSName] = useState('');
  const [sid, setSid] = useState('');
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  useEffect(() => {
    if (item && visible) {
      setAmount(item.amount?.toString() || '0');
      const types = item.type ? item.type.split(',').map((t: string) => t.trim()) : [];
      setSelectedTypes(types);
      setSName(item.student_name || item.studentName || '');
      setSid(item.student_id || item.studentId || '');
    } else if (visible) {
      setAmount('0');
      setSelectedTypes([]);
      setSName('');
      setSid('');
    }
  }, [item, visible]);

  const filteredStudents = useMemo(() => {
    if (!studentSearch) return students;
    return students?.filter((s: any) => 
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
      (s.studentId && s.studentId.toLowerCase().includes(studentSearch.toLowerCase()))
    );
  }, [students, studentSearch]);

  const toggleType = (typeName: string) => {
    let nextTypes = [...selectedTypes];
    if (nextTypes.includes(typeName)) {
      nextTypes = nextTypes.filter(t => t !== typeName);
    } else {
      nextTypes.push(typeName);
    }
    
    let total = 0;
    nextTypes.forEach(t => {
      const struct = structures.find((s: any) => s.name === t);
      if (struct) total += parseFloat(struct.amount);
    });

    setSelectedTypes(nextTypes);
    setAmount(total.toString());
  };

  const handleSave = () => {
    if (!sid || !sName) {
      Alert.alert('Selection Required', 'Please select a student.');
      return;
    }
    if (selectedTypes.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one fee category.');
      return;
    }
    onSave({ 
      ...item, 
      amount: parseFloat(amount), 
      type: selectedTypes.join(', '),
      student_name: sName,
      student_id: sid,
      status: item?.status || 'unpaid',
      date: item?.date || new Date().toISOString().split('T')[0]
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/60 justify-end">
        <View className={`rounded-t-[40px] p-8 pb-12 border-t ${theme === 'dark' ? 'bg-[#1c1c14]' : 'bg-[#FEFBEA]'} ${colors.border}`}>
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className={`text-2xl font-black tracking-tighter ${colors.text}`}>
                {item?.id === 'NEW' ? 'New Transaction' : 'Edit Transaction'}
              </Text>
            </View>
            <Pressable onPress={onClose} className={`w-10 h-10 rounded-xl items-center justify-center ${colors.surface}`}>
               <MaterialCommunityIcons name="close" size={24} color={theme === 'dark' ? '#FFF' : '#000'} />
            </Pressable>
          </View>

          <View className="mb-6">
            <Text className={`text-[10px] font-black mb-2 uppercase tracking-widest ${colors.textTertiary}`}>Student</Text>
            <Pressable 
              onPress={() => setShowStudentPicker(!showStudentPicker)}
              className={`flex-row items-center justify-between p-4 rounded-2xl border ${colors.surface} ${colors.border}`}
            >
              <Text className={`font-bold ${sName ? colors.text : colors.textTertiary}`}>
                {sName ? `${sName} (${sid})` : 'Select Student...'}
              </Text>
              <MaterialCommunityIcons name={showStudentPicker ? "chevron-up" : "chevron-down"} size={20} color="#F472B6" />
            </Pressable>

            {showStudentPicker && (
              <View className={`mt-2 rounded-2xl border p-2 ${colors.surface} ${colors.border} max-h-[180px]`}>
                <TextInput 
                  className={`px-4 py-2 font-bold text-xs ${colors.text} ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} rounded-xl mb-2`}
                  placeholder="Search..."
                  placeholderTextColor="#9CA3AF"
                  value={studentSearch}
                  onChangeText={setStudentSearch}
                />
                <ScrollView nestedScrollEnabled>
                  {filteredStudents?.map((s: any) => (
                    <Pressable 
                      key={s.id} 
                      className="p-3 rounded-xl border-b border-gray-100/5"
                      onPress={() => {
                        setSName(s.name);
                        setSid(s.studentId || s.student_id);
                        setShowStudentPicker(false);
                      }}
                    >
                      <Text className={`font-bold ${colors.text}`}>{s.name} ({s.studentId || s.student_id})</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
          
          <View className="mb-6">
            <Text className={`text-[10px] font-black mb-3 uppercase tracking-widest ${colors.textTertiary}`}>Fee Categories</Text>
            <View className="flex-row flex-wrap">
                {structures.map((s: any) => (
                  <Pressable 
                    key={s.id} 
                    onPress={() => toggleType(s.name)}
                    className={`px-4 py-2 rounded-xl mr-2 mb-2 border flex-row items-center ${selectedTypes.includes(s.name) ? 'bg-brand-pink border-brand-pink' : `${colors.surface} ${colors.border}`}`}
                  >
                    <Text className={`text-[10px] font-black ${selectedTypes.includes(s.name) ? 'text-white' : colors.textSecondary}`}>
                      {s.name.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
            </View>
          </View>

          <View className="mb-10">
            <Text className={`text-[10px] font-black mb-2 uppercase tracking-widest ${colors.textTertiary}`}>Total Fee Amount</Text>
            <View className={`flex-row items-center p-5 rounded-3xl border ${colors.surface} ${colors.border} bg-brand-pink/5`}>
              <Text className="mr-3 text-2xl font-black text-brand-pink">₹</Text>
              <TextInput 
                className={`flex-1 text-3xl font-black ${colors.text}`}
                value={amount} 
                onChangeText={setAmount} 
                keyboardType="numeric"
              />
            </View>
          </View>

          <View className="flex-row space-x-4">
            <Pressable className={`flex-1 py-5 rounded-3xl items-center ${colors.surface}`} onPress={onClose}>
              <Text className={`font-black tracking-widest ${colors.textSecondary}`}>CANCEL</Text>
            </Pressable>
            <Pressable className="flex-[2] bg-brand-pink py-5 rounded-3xl items-center shadow-lg" onPress={handleSave}>
              <Text className="text-white font-black tracking-widest">SAVE</Text>
            </Pressable>
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
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);

  const currentMonthIdx = new Date().getMonth();
  const [activeMonth, setActiveMonth] = useState(MONTH_DATA[currentMonthIdx]);

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

    // 2. Tab & Month filter
    if (activeTab === 'manage') {
        return list.filter(f => {
            const types = (f.type || '').toLowerCase();
            return !types.includes('admission') && f.date.includes(`-${activeMonth.code}-`);
        });
    } else if (activeTab === 'admission') {
        return list.filter(f => (f.type || '').split(',').some((t:any) => t.trim().toLowerCase() === 'admission'));
    } else if (activeTab === 'history') {
        return list.filter(f => f.status === 'paid' && f.date.includes(`-${activeMonth.code}-`));
    }
    return [];
  }, [fees, activeTab, activeMonth, searchQuery]);

  const stats = useMemo(() => {
    const total = filteredFees.reduce((acc, f) => acc + (f.amount || 0), 0);
    const paid = filteredFees.filter(f => f.status === 'paid').reduce((acc, f) => acc + (f.amount || 0), 0);
    return { 
      total, 
      paid, 
      pending: total - paid, 
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
          date: updatedItem.date
      };
      if (updatedItem.id === 'NEW') await api.post('/fees', payload);
      else await api.put(`/fees/${updatedItem.id}`, payload);
      
      await refreshFees();
      setEditModal({ visible: false, item: null });
      Alert.alert('Success ✨', 'Fee record updated.');
    } catch (err) {
      Alert.alert('Error', 'Save failed.');
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

  const renderFeeItem = useCallback(({ item }: any) => (
    <View className={`mx-6 p-6 rounded-[32px] border mb-4 ${colors.surface} ${colors.border} shadow-sm`}>
       <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center flex-1">
             <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${theme === 'dark' ? 'bg-brand-pink/10' : 'bg-brand-pink/5'}`}>
               <MaterialCommunityIcons name="account-school" size={28} color="#F472B6" />
             </View>
             <View className="flex-1">
                <Text className={`font-black text-lg ${colors.text}`}>{item.student_name}</Text>
                <Text className={`text-[10px] font-bold ${colors.textTertiary}`}>{item.student_id} • {item.date}</Text>
             </View>
          </View>
          <Pressable 
            onPress={() => toggleStatus(item.id)}
            className={`px-4 py-2 rounded-xl border ${item.status === 'paid' ? 'bg-green-500 border-green-500' : 'border-red-500'}`}
          >
             <Text className={`text-[10px] font-black ${item.status === 'paid' ? 'text-white' : 'text-red-500'}`}>{item.status.toUpperCase()}</Text>
          </Pressable>
       </View>
       <View className={`p-4 rounded-2xl flex-row justify-between items-center mb-4 ${theme === 'dark' ? 'bg-black/20' : 'bg-gray-50'}`}>
          <View>
             <Text className={`text-[8px] font-black uppercase tracking-widest ${colors.textTertiary}`}>{item.type}</Text>
             <Text className={`font-black text-xl ${colors.text}`}>₹{item.amount}</Text>
          </View>
          <Pressable onPress={() => setEditModal({ visible: true, item: item as any })} className="bg-brand-pink/10 px-4 py-2 rounded-xl">
             <Text className="text-brand-pink font-black text-[10px]">EDIT</Text>
          </Pressable>
       </View>
    </View>
  ), [colors, theme]);

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
          <SummaryCard label="PENDING" value={`₹${stats.pending}`} icon="alert-circle" color="#EF4444" colors={colors} />
          <SummaryCard label="RECORDS" value={stats.count} icon="file-document-outline" color="#3B82F6" colors={colors} />
          <SummaryCard label="COLLECTED %" value={`${stats.pct}%`} icon="trending-up" color="#F472B6" colors={colors} />
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

      {/* Tab Selector */}
      <View className="px-6 mb-8">
        <View className={`flex-row p-1.5 rounded-[28px] border ${colors.surface} ${colors.border} bg-black/5 dark:bg-white/5`}>
          {FEES_TABS.map((tab) => (
            <Pressable 
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 rounded-[24px] items-center ${activeTab === tab.id ? 'bg-brand-pink' : 'bg-transparent'}`}
            >
              <Text className={`text-[10px] font-black uppercase ${activeTab === tab.id ? 'text-white' : colors.textTertiary}`}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Action Line & Month Filter */}
      {activeTab !== 'list' && (
        <View className="px-6 mb-4">
            <View className="flex-row justify-between items-center mb-4">
                <Text className={`text-[10px] font-black uppercase tracking-widest ${colors.textTertiary}`}>{activeTab.toUpperCase()} RECORDS</Text>
                <Pressable 
                    onPress={() => setEditModal({ visible: true, item: { id: 'NEW', student_id: '', student_name: '', amount: 0, type: activeTab === 'admission' ? 'Admission' : 'Monthly', status: 'unpaid', date: new Date().toISOString().split('T')[0] } as any })}
                    className="bg-brand-pink w-10 h-10 rounded-xl items-center justify-center"
                >
                    <MaterialCommunityIcons name="plus" size={24} color="white" />
                </Pressable>
            </View>
            {(activeTab === 'manage' || activeTab === 'history') && (
                <View className="mb-4">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {MONTH_DATA.map(m => (
                            <MonthPill key={m.code} month={m} isActive={activeMonth.code === m.code} onPress={setActiveMonth} colors={colors} />
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
      )}
    </View>
  ), [activeTab, activeMonth, colors, theme, stats, searchQuery]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme === 'dark' ? '#1c1c14' : '#FEFBEA' }}>
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
      
      {isLocalLoading && (
          <View className="absolute inset-0 bg-black/40 flex items-center justify-center z-50">
             <ActivityIndicator color="#F472B6" size="large" />
          </View>
      )}
    </SafeAreaView>
  );
}
