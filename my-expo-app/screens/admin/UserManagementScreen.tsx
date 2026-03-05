import React, { useState, memo, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Alert, TextInput, Modal,
  ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard,
  FlatList, ListRenderItem, ScrollView, Image, Animated, Easing, RefreshControl
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth, User } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import StatusModal from '../../components/StatusModal';
import ChoiceModal from '../../components/ChoiceModal';

interface NavigationProps { navigate: (screen: string) => void; goBack: () => void; }
interface UserManagementScreenProps { navigation: NavigationProps; }

const STUDENT_CATEGORIES = ['Playschool', 'PreKG', 'Daycare'] as const;
type CategoryType = typeof STUDENT_CATEGORIES[number];

// ─── Shared field label ────────────────────────────────────────────────────────
function FieldRow({ icon, label, required = false, theme, children }: {
  icon: string; label: string; required?: boolean; theme: string; children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 7 }}>
        <View style={{
          width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
          backgroundColor: theme === 'dark' ? '#2a2a28' : '#F3F4F6', marginRight: 8,
        }}>
          <MaterialCommunityIcons name={icon as any} size={14} color="#F472B6" />
        </View>
        <Text style={{
          fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase',
          color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
        }}>
          {label}{required ? <Text style={{ color: '#F472B6' }}> *</Text> : ' (opt)'}
        </Text>
      </View>
      {children}
    </View>
  );
}

// ─── Mini DOB picker ───────────────────────────────────────────────────────────
function MiniDatePicker({ value, onChange, theme }: { value: string; onChange: (v: string) => void; theme: string }) {
  const parts = value ? value.split('-') : ['', '', ''];
  const [day,   setDay]   = useState(parts[2] || '');
  const [month, setMonth] = useState(parts[1] || '');
  const [year,  setYear]  = useState(parts[0] || '');

  const commit = (d: string, m: string, y: string) => {
    if (d && m && y) onChange(`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`);
  };

  const s: any = {
    borderWidth: 1.5, borderRadius: 12, paddingVertical: 12,
    textAlign: 'center', fontSize: 14, fontWeight: '700',
    color: theme === 'dark' ? '#fff' : '#111',
    backgroundColor: theme === 'dark' ? '#1e1e1c' : '#F9FAFB',
    borderColor: theme === 'dark' ? '#3a3a38' : '#E5E7EB',
  };
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <TextInput style={{ ...s, flex: 1 }} placeholder="DD" placeholderTextColor="#9CA3AF"
        keyboardType="numeric" maxLength={2} value={day}
        onChangeText={v => { setDay(v); commit(v, month, year); }} />
      <TextInput style={{ ...s, flex: 1.2 }} placeholder="MM" placeholderTextColor="#9CA3AF"
        keyboardType="numeric" maxLength={2} value={month}
        onChangeText={v => { setMonth(v); commit(day, v, year); }} />
      <TextInput style={{ ...s, flex: 2 }} placeholder="YYYY" placeholderTextColor="#9CA3AF"
        keyboardType="numeric" maxLength={4} value={year}
        onChangeText={v => { setYear(v); commit(day, month, v); }} />
    </View>
  );
}

// ─── Shared User Form (used for both Add and Edit) ─────────────────────────────
const UserForm = memo(({ theme, onSubmit, isSubmitting, initialData, isEdit }: {
  theme: string; onSubmit: (data: any) => void;
  isSubmitting: boolean; initialData?: Partial<User>; isEdit?: boolean;
}) => {
  const [formData, setFormData] = useState({
    name:        initialData?.name        || '',
    username:    (initialData as any)?.username    || '',
    dateOfBirth: (initialData as any)?.date_of_birth || '',
    fatherName:  initialData?.fatherName || '',
    motherName:  initialData?.motherName || '',
    fatherPhone: initialData?.fatherPhone || '',
    motherPhone: initialData?.motherPhone || '',
    category:    (initialData?.category as CategoryType) || 'Playschool',
    email:       initialData?.email       || '',
    phone:       initialData?.phone       || '',
    password:    '',
    role:        initialData?.role === 'teacher' ? 'teacher' : 'student' as 'student' | 'teacher',
    gender:      (initialData?.gender as 'Male' | 'Female') || 'Male',
    fees:        initialData?.fees || '',
    fee_due_day: (initialData as any)?.fee_due_day || '5',
  });

  // Sync state if initialData changes (important for switching between edits)
  useEffect(() => {
    setFormData({
      name:        initialData?.name        || '',
      username:    (initialData as any)?.username    || '',
      dateOfBirth: (initialData as any)?.date_of_birth || '',
      fatherName:  initialData?.fatherName || '',
      motherName:  initialData?.motherName || '',
      fatherPhone: initialData?.fatherPhone || '',
      motherPhone: initialData?.motherPhone || '',
      category:    (initialData?.category as CategoryType) || 'Playschool',
      email:       initialData?.email       || '',
      phone:       initialData?.phone       || '',
      password:    '',
      role:        initialData?.role === 'teacher' ? 'teacher' : 'student' as 'student' | 'teacher',
      gender:      (initialData?.gender as 'Male' | 'Female') || 'Male',
      fees:        initialData?.fees || '',
      fee_due_day: (initialData as any)?.fee_due_day || '5',
    });
  }, [initialData]);

  const set = useCallback((field: string, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value })), []);

  const missing = useMemo(() => {
    const m: string[] = [];
    if (!formData.name.trim())     m.push('Full Name');
    if (!formData.username.trim()) m.push('Username');
    if (!formData.phone.trim())    m.push('Phone');
    if (!isEdit && !formData.password.trim()) m.push('Password');
    // Father and Mother name are now optional as per request
    return m;
  }, [formData, isEdit]);

  const isValid = missing.length === 0;

  const inp: any = {
    borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 14, fontWeight: '700',
    color: theme === 'dark' ? '#fff' : '#111',
    backgroundColor: theme === 'dark' ? '#1e1e1c' : '#F9FAFB',
    borderColor: theme === 'dark' ? '#3a3a38' : '#E5E7EB',
  };

  const chip = (active: boolean, accent = '#F472B6') => ({
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' as const,
    borderWidth: 1.5,
    backgroundColor: active ? accent : (theme === 'dark' ? '#1e1e1c' : '#fff'),
    borderColor: active ? accent : (theme === 'dark' ? '#3a3a38' : '#E5E7EB'),
  });

  return (
    <View style={{ paddingBottom: 40 }}>

      {/* Role — disabled in edit mode */}
      <FieldRow icon="badge-account-horizontal" label="Role" required theme={theme}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['student', 'teacher'] as const).map(r => (
            <TouchableOpacity key={r} activeOpacity={isEdit ? 1 : 0.7}
              style={{ ...chip(formData.role === r, '#F472B6'), opacity: isEdit ? 0.5 : 1 }}
              onPress={() => { if (!isEdit) { Keyboard.dismiss(); set('role', r); } }}>
              <Text style={{ fontWeight: '900', textTransform: 'capitalize', fontSize: 13,
                color: formData.role === r ? 'white' : (theme === 'dark' ? '#6B7280' : '#9CA3AF') }}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </FieldRow>

      {/* Gender */}
      <FieldRow icon="gender-male-female" label="Gender" required theme={theme}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['Male', 'Female'] as const).map(g => (
            <TouchableOpacity key={g} activeOpacity={0.7}
              style={chip(formData.gender === g)}
              onPress={() => { Keyboard.dismiss(); set('gender', g); }}>
              <Text style={{ fontSize: 12, fontWeight: '900',
                color: formData.gender === g ? 'white' : (theme === 'dark' ? '#9CA3AF' : '#6B7280') }}>
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </FieldRow>

      <FieldRow icon="account" label="Full Name" required theme={theme}>
        <TextInput style={inp} placeholder="e.g. Rahul Sharma" placeholderTextColor="#9CA3AF"
          value={formData.name} onChangeText={v => set('name', v)} />
      </FieldRow>

      <FieldRow icon="at" label="Username" required theme={theme}>
        <TextInput style={inp} placeholder="e.g. rahul_s" placeholderTextColor="#9CA3AF"
          autoCapitalize="none" value={formData.username} onChangeText={v => set('username', v)} />
        <Text style={{ fontSize: 9, color: '#F472B6', marginTop: 4, fontWeight: '700' }}>
          * MUST BE UNIQUE FOR LOGIN
        </Text>
      </FieldRow>

      {/* Student-only */}
      {formData.role === 'student' && (
        <>
          <FieldRow icon="cake-variant" label="Date of Birth" theme={theme}>
            <MiniDatePicker value={formData.dateOfBirth} onChange={v => set('dateOfBirth', v)} theme={theme} />
            {formData.dateOfBirth ? (
              <Text style={{ fontSize: 11, color: '#F472B6', fontWeight: '700', marginTop: 4 }}>
                📅 {formData.dateOfBirth}
              </Text>
            ) : null}
          </FieldRow>

          <FieldRow icon="account-tie" label="Father Details" theme={theme}>
            <TextInput style={{ ...inp, marginBottom: 8 }} placeholder="Father's Name" placeholderTextColor="#9CA3AF"
              value={formData.fatherName} onChangeText={v => set('fatherName', v)} />
            <TextInput style={inp} placeholder="Father's Phone" placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad" value={formData.fatherPhone} onChangeText={v => set('fatherPhone', v)} />
          </FieldRow>

          <FieldRow icon="account-heart" label="Mother Details" theme={theme}>
            <TextInput style={{ ...inp, marginBottom: 8 }} placeholder="Mother's Name" placeholderTextColor="#9CA3AF"
              value={formData.motherName} onChangeText={v => set('motherName', v)} />
            <TextInput style={inp} placeholder="Mother's Phone" placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad" value={formData.motherPhone} onChangeText={v => set('motherPhone', v)} />
          </FieldRow>

          <FieldRow icon="shape" label="Category" required theme={theme}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {STUDENT_CATEGORIES.map(cat => (
                <TouchableOpacity key={cat} activeOpacity={0.7}
                  style={chip(formData.category === cat, '#EAB308')}
                  onPress={() => { Keyboard.dismiss(); set('category', cat); }}>
                  <Text style={{ fontSize: 10, fontWeight: '900',
                    color: formData.category === cat ? '#78350F' : (theme === 'dark' ? '#9CA3AF' : '#6B7280') }}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </FieldRow>

          <FieldRow icon="currency-inr" label="Monthly Fee Settings" theme={theme}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
               {/* Amount */}
               <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center' }}>
                  <View className="bg-brand-pink w-12 h-[52px] rounded-l-xl items-center justify-center">
                     <Text className="text-white font-black text-lg">₹</Text>
                  </View>
                  <TextInput 
                     style={{ ...inp, flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }} 
                     placeholder="Fee" 
                     placeholderTextColor="#9CA3AF"
                     keyboardType="numeric"
                     value={formData.fees ? formData.fees.toString() : ''} 
                     onChangeText={v => set('fees', v)} 
                  />
               </View>

               {/* Due Day */}
               <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  <View className="bg-brand-yellow w-12 h-[52px] rounded-l-xl items-center justify-center">
                     <MaterialCommunityIcons name="calendar-clock" size={20} color="#92400E" />
                  </View>
                  <TextInput 
                     style={{ ...inp, flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }} 
                     placeholder="Day" 
                     placeholderTextColor="#9CA3AF"
                     keyboardType="numeric"
                     maxLength={2}
                     value={formData.fee_due_day ? formData.fee_due_day.toString() : ''} 
                     onChangeText={v => set('fee_due_day', v)} 
                  />
               </View>
            </View>
            <View className="flex-row justify-between mt-2">
               <Text style={{ fontSize: 9, color: '#F472B6', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                 * Monthly Amount
               </Text>
               <Text style={{ fontSize: 9, color: '#FBBF24', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                 Due Day of Month (1-31)
               </Text>
            </View>
          </FieldRow>
        </>
      )}

      <FieldRow icon="email-outline" label="Email ID" theme={theme}>
        <TextInput style={inp} placeholder="email@example.com" placeholderTextColor="#9CA3AF"
          keyboardType="email-address" autoCapitalize="none"
          value={formData.email} onChangeText={v => set('email', v)} />
      </FieldRow>

      <FieldRow icon="phone" label="Phone Number" required theme={theme}>
        <TextInput style={inp} placeholder="+91 98765 43210" placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad" value={formData.phone} onChangeText={v => set('phone', v)} />
      </FieldRow>

      <FieldRow icon="lock-outline" label={isEdit ? 'New Password' : 'Initial Password'} required={!isEdit} theme={theme}>
        <TextInput style={inp} placeholder={isEdit ? 'Leave blank to keep current' : '••••••••'}
          placeholderTextColor="#9CA3AF" secureTextEntry
          value={formData.password} onChangeText={v => set('password', v)} />
      </FieldRow>

      {missing.length > 0 && (
        <View style={{
          backgroundColor: '#FEF2F2', borderRadius: 14, borderWidth: 1, borderColor: '#FECACA',
          padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center',
        }}>
          <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#EF4444" />
          <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700', marginLeft: 8 }}>
            {missing.join(' · ')}
          </Text>
        </View>
      )}

      <TouchableOpacity
        disabled={!isValid || isSubmitting}
        activeOpacity={0.85}
        onPress={() => { if (isValid && !isSubmitting) onSubmit(formData); }}
        style={{
          backgroundColor: (!isValid || isSubmitting) ? '#D1D5DB' : '#F472B6',
          paddingVertical: 18, borderRadius: 22, alignItems: 'center',
          flexDirection: 'row', justifyContent: 'center',
          shadowColor: '#F472B6', shadowOpacity: isValid ? 0.35 : 0,
          shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 8,
        }}
      >
        {isSubmitting ? <ActivityIndicator color="white" /> : (
          <>
            <MaterialCommunityIcons name={isEdit ? 'content-save' : 'account-plus'} size={20}
              color={(!isValid || isSubmitting) ? '#9CA3AF' : 'white'} />
            <Text style={{ fontWeight: '900', fontSize: 16, marginLeft: 8,
              color: (!isValid || isSubmitting) ? '#9CA3AF' : 'white' }}>
              {isEdit ? 'Save Changes' : (isValid ? 'Register Member' : 'Fill Required Fields')}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
});

// ─── Shared modal shell (used for both Add & Edit) ────────────────────────────
const UserFormModal = memo(({ visible, onClose, onSubmit, isSubmitting, theme, initialData, isEdit }: any) => (
  <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
    <View 
        className={`flex-1 ${theme === 'dark' ? 'bg-[#1c1c14]' : 'bg-white'}`}
        style={{ backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF' }}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* ── Background Gradient & 3D Illustration ── */}
          <View className="absolute top-0 left-0 right-0 h-[350px] overflow-hidden">
            <LinearGradient
                colors={[theme === 'dark' ? '#1e1b4b' : '#FDF2F8', theme === 'dark' ? '#1c1c14' : '#FFFFFF']}
                className="absolute inset-0"
            />
            <Image 
                source={require('../../assets/images/playschool_actions.png')} 
                style={{ width: '100%', height: '100%', opacity: theme === 'dark' ? 0.08 : 0.15, transform: [{ scale: 1.2 }, { translateY: -20 }] }}
                resizeMode="cover"
            />
          </View>

          {/* Header */}
          <View className="px-6 pt-12 pb-6 flex-row items-center justify-between">
            <View className="flex-1">
              <TouchableOpacity onPress={onClose} 
                className={`${theme === 'dark' ? 'bg-[#25251d] border-gray-800' : 'bg-white border-brand-pink/20'} w-14 h-14 rounded-2xl items-center justify-center shadow-xl border mb-4`}
              >
                <MaterialCommunityIcons name="close" size={28} color={theme === 'dark' ? '#FFF' : '#F472B6'} />
              </TouchableOpacity>
              <Text className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">
                {isEdit ? 'Update' : 'Register'}
              </Text>
              <Text className="text-2xl font-black text-brand-pink mt-[-4px]">
                {isEdit ? 'Profile ✏️' : 'New Member ✨'}
              </Text>
            </View>
            <View className="bg-brand-pink w-24 h-24 rounded-[36px] items-center justify-center shadow-2xl border-4 border-white rotate-3 overflow-hidden">
                <MaterialCommunityIcons name={isEdit ? "account-edit-outline" : "account-plus-outline"} size={48} color="white" />
            </View>
          </View>

          <View className="px-6 pb-20">
            <UserForm
              key={initialData?.id || 'new-form'}
              theme={theme}
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
              initialData={initialData}
              isEdit={isEdit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  </Modal>
));

// ─── User Card ────────────────────────────────────────────────────────────────
const UserItem = memo(({ user, colors, theme, isMenuOpen, onMenuToggle, getRoleIcon, onStatusToggle, onDelete, onEdit }: any) => (
  <View 
    style={{ elevation: 8 }}
    className={`mb-6 rounded-[36px] overflow-hidden border-2 shadow-xl ${theme === 'dark' ? 'bg-[#1a1a18] border-gray-800' : 'bg-white border-white'}`}
  >
    {user.status === 'inactive' && (
        <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/5 z-10 pointer-events-none" />
    )}
    
    <View className="flex-row items-center p-5">
        <View className={`w-16 h-16 rounded-2xl items-center justify-center border-4 border-white shadow-sm overflow-hidden ${user.role === 'admin' ? 'bg-brand-yellow' : user.role === 'teacher' ? 'bg-brand-pink' : 'bg-blue-500'}`}>
            {user.avatar ? (
                <Image source={{ uri: user.avatar }} className="w-full h-full" resizeMode="cover" />
            ) : (
                <MaterialCommunityIcons name={getRoleIcon(user.role) as any} size={32} color="white" />
            )}
        </View>

        <View className="ml-5 flex-1">
            <View className="flex-row items-center justify-between">
                <Text className="text-lg font-black text-gray-900 dark:text-white tracking-tighter" numberOfLines={1}>{user.name}</Text>
                <View className={`px-2.5 py-1 rounded-full ${user.status === 'active' ? 'bg-green-100 dark:bg-green-500/20' : 'bg-red-100 dark:bg-red-500/20'}`}>
                    <Text className={`text-[9px] font-black uppercase tracking-widest ${user.status === 'active' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                        {user.status}
                    </Text>
                </View>
            </View>
            
            <View className="flex-row items-center mt-1">
                <MaterialCommunityIcons name="at" size={12} color={theme === 'dark' ? '#F472B6' : '#F472B6'} />
                <Text className="text-[11px] font-bold text-brand-pink ml-1 lowercase tracking-wider">
                    {user.username}
                </Text>
                <View className="mx-2 w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                <MaterialCommunityIcons name="card-account-details-outline" size={12} color={theme === 'dark' ? '#6B7280' : '#9CA3AF'} />
                <Text className="text-[11px] font-bold text-gray-400 dark:text-gray-500 ml-1 uppercase tracking-widest">
                    {user.studentId || user.teacherId || 'ADMIN-UID'}
                </Text>
            </View>

            <View className="flex-row items-center mt-3 gap-2">
                {user.role === 'teacher' && (
                     <View className="bg-brand-pink/10 px-3 py-1 rounded-lg border border-brand-pink/20">
                        <Text className="text-brand-pink text-[9px] font-black uppercase">Faculty</Text>
                     </View>
                )}
                {user.role === 'student' && user.category && (
                     <View className="bg-amber-100 dark:bg-amber-500/20 px-3 py-1 rounded-lg border border-amber-200 dark:border-amber-500/30">
                        <Text className="text-amber-800 dark:text-amber-400 text-[9px] font-black uppercase">{user.category}</Text>
                     </View>
                )}
                <View className="bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-lg">
                    <Text className="text-gray-500 dark:text-gray-400 text-[9px] font-black uppercase">{user.gender}</Text>
                </View>
            </View>
        </View>

        <TouchableOpacity onPress={onMenuToggle} className="p-2 ml-2">
            <MaterialCommunityIcons name={isMenuOpen ? "dots-horizontal" : "dots-vertical"} size={26} color={isMenuOpen ? '#F472B6' : '#D1D5DB'} />
        </TouchableOpacity>
    </View>

    {isMenuOpen && (
        <LinearGradient
            colors={theme === 'dark' ? ['#25251d', '#1c1c14'] : ['#F9FAFB', '#F3F4F6']}
            className="flex-row justify-around p-5 border-t border-gray-100 dark:border-gray-800"
        >
            <TouchableOpacity onPress={() => { onMenuToggle(); onEdit(user); }} className="items-center">
                <View className="w-12 h-12 bg-white dark:bg-white/10 rounded-2xl items-center justify-center shadow-sm border border-gray-100 dark:border-white/10">
                    <MaterialCommunityIcons name="pencil-outline" size={20} color="#F59E0B" />
                </View>
                <Text className={`text-[10px] font-black mt-2 uppercase tracking-widest ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                disabled={user.role === 'admin'}
                onPress={() => { onMenuToggle(); onStatusToggle(user.id); }} 
                className={`items-center ${user.role === 'admin' ? 'opacity-30' : 'opacity-100'}`}
            >
                <View className={`w-12 h-12 rounded-2xl items-center justify-center shadow-sm border ${user.status === 'active' ? 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20' : 'bg-green-50 dark:bg-green-500/10 border-green-100 dark:border-green-500/20'}`}>
                    <MaterialCommunityIcons 
                        name={user.status === 'active' ? "account-cancel-outline" : "account-check-outline"} 
                        size={20} 
                        color={user.status === 'active' ? "#EF4444" : "#10B981"} 
                    />
                </View>
                <Text className={`text-[10px] font-black mt-2 uppercase tracking-widest ${user.status === 'active' ? 'text-red-500/70' : 'text-green-600/70'}`}>
                    {user.status === 'active' ? 'Halt' : 'Live'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity 
                disabled={user.role === 'admin'}
                onPress={() => { onMenuToggle(); onDelete(user.id, user.name); }} 
                className={`items-center ${user.role === 'admin' ? 'opacity-30' : 'opacity-100'}`}
            >
                <View className="w-12 h-12 bg-red-500 rounded-2xl items-center justify-center shadow-lg">
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="white" />
                </View>
                <Text className="text-[10px] font-black text-red-500 mt-2 uppercase tracking-widest">Delete</Text>
            </TouchableOpacity>
        </LinearGradient>
    )}
  </View>
));

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function UserManagementScreen({ navigation }: UserManagementScreenProps) {
  const { users, addUser, updateUser, deleteUser, toggleUserStatus, fetchData } = useAuth();
  const { theme, colors } = useTheme();

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

  const [showAddForm,   setShowAddForm]   = useState(false);
  const [editingUser,   setEditingUser]   = useState<User | null>(null);
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [activeMenuId,  setActiveMenuId]  = useState<string | null>(null);
  const [filter,        setFilter]        = useState<'all' | 'student' | 'teacher'>('all');
  const [search,        setSearch]        = useState('');
  const [statusModal, setStatusModal] = useState({ visible: false, title: '', message: '', type: 'error' as any });
  const [choiceModal, setChoiceModal] = useState({ visible: false, title: '', message: '', options: [] as any[], iconName: '', accentColor: '' });

  // ── Shake Animation Logic ──
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shake = () => {
      // Create a sequence: slight left, slight right, back to center
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true, easing: Easing.linear }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true, easing: Easing.linear }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true, easing: Easing.linear }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true, easing: Easing.linear }),
        Animated.timing(shakeAnim, { toValue: 5, duration: 60, useNativeDriver: true, easing: Easing.linear }),
        Animated.timing(shakeAnim, { toValue: -5, duration: 60, useNativeDriver: true, easing: Easing.linear }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true, easing: Easing.linear }),
      ]).start();
    };

    const interval = setInterval(shake, 3000);
    return () => clearInterval(interval);
  }, [shakeAnim]);

  const closeAdd  = useCallback(() => setShowAddForm(false), []);
  const closeEdit = useCallback(() => setEditingUser(null), []);

  const toggleFilter = useCallback((role: 'student' | 'teacher') => {
    setFilter(prev => prev === role ? 'all' : role);
    setActiveMenuId(null);
  }, []);

  const getRoleIcon = useCallback((role: string) => {
    switch (role) {
      case 'admin':   return 'shield-account';
      case 'teacher': return 'account-tie';
      case 'student': return 'school';
      default:        return 'account';
    }
  }, []);

  // ── Add ──
  const handleAddSubmit = useCallback(async (formData: any) => {
    setIsSubmitting(true);
    try {
      const studentCount = users.filter(u => u.role === 'student').length + 1;
      const teacherCount = users.filter(u => u.role === 'teacher').length + 1;
      await addUser({
        name:          formData.name,
        username:      formData.username   || undefined,
        date_of_birth: formData.dateOfBirth && formData.role === 'student' ? formData.dateOfBirth : undefined,
        email:         formData.email      || undefined,
        phone:         formData.phone,
        role:          formData.role,
        gender:        formData.gender,
        password:      formData.password,
        status:        'active',
        father_name:   formData.role === 'student' ? formData.fatherName : undefined,
        mother_name:   formData.role === 'student' ? formData.motherName : undefined,
        father_phone:  formData.role === 'student' ? formData.fatherPhone : undefined,
        mother_phone:  formData.role === 'student' ? formData.motherPhone : undefined,
        category:      formData.role === 'student' ? formData.category   : undefined,
        fees:          formData.role === 'student' ? formData.fees       : undefined,
        fee_due_day:   formData.role === 'student' ? formData.fee_due_day : undefined,
        student_id:    formData.role === 'student' ? `chk${studentCount.toString().padStart(3,'0')}` : undefined,
        teacher_id:    formData.role === 'teacher' ? `chkt${teacherCount.toString().padStart(3,'0')}`  : undefined,
      } as any);
      setShowAddForm(false);
      setStatusModal({
        visible: true,
        title: 'User Added! 🎉',
        message: `${formData.name} has been successfully registered in the system.`,
        type: 'success'
      });
    } catch {
      setStatusModal({
        visible: true,
        title: 'System Error ⚠️',
        message: 'Something went wrong while adding the user. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [users, addUser]);

  // ── Edit ──
  const handleEditSubmit = useCallback(async (formData: any) => {
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      const payload: any = {
        name:          formData.name,
        username:      formData.username   || undefined,
        email:         formData.email      || undefined,
        phone:         formData.phone,
        gender:        formData.gender,
        father_name:   formData.role === 'student' ? formData.fatherName : undefined,
        mother_name:   formData.role === 'student' ? formData.motherName : undefined,
        father_phone:  formData.role === 'student' ? formData.fatherPhone : undefined,
        mother_phone:  formData.role === 'student' ? formData.motherPhone : undefined,
        category:      formData.role === 'student' ? formData.category   : undefined,
        fees:          formData.role === 'student' ? formData.fees       : undefined,
        fee_due_day:   formData.role === 'student' ? formData.fee_due_day : undefined,
        date_of_birth: formData.role === 'student' && formData.dateOfBirth ? formData.dateOfBirth : undefined,
      };
      if (formData.password) payload.password = formData.password;
      await updateUser(editingUser.id, payload);
      setEditingUser(null);
      setStatusModal({
        visible: true,
        title: 'Changes Saved! ✅',
        message: 'The user profile has been updated successfully.',
        type: 'success'
      });
    } catch {
      setStatusModal({
        visible: true,
        title: 'Update Failed ⚠️',
        message: 'Could not update user details. Please check your connection.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [editingUser, updateUser]);

  const handleDeleteUserPress = useCallback((userId: string, userName: string) => {
    const target = users.find(u => u.id === userId);
    if (target?.role === 'admin') {
        setStatusModal({
            visible: true,
            title: 'Protected Account 🛡️',
            message: 'The Master Administrator account is protected and cannot be deleted for security reasons.',
            type: 'info'
        });
        return;
    }

    setChoiceModal({
        visible: true,
        title: 'Delete User? 🔒',
        message: `Are you sure you want to permanently remove ${userName}? All associated data will be lost.`,
        iconName: 'account-remove',
        accentColor: '#EF4444',
        options: [
            { 
              label: 'Yes, Delete User', 
              type: 'destructive', 
              onPress: async () => {
                try {
                  await deleteUser(userId);
                  setStatusModal({
                    visible: true,
                    title: 'Deleted! ✅',
                    message: `User ${userName} has been successfully removed.`,
                    type: 'success'
                  });
                } catch (e) {
                  setStatusModal({
                    visible: true,
                    title: 'Error ⚠️',
                    message: 'Failed to delete user. Please try again.',
                    type: 'error'
                  });
                }
              }
            }
        ]
    });
  }, [deleteUser, users]);

  const stats = useMemo(() => ({
    students: users.filter(u => u.role === 'student' && u.status === 'active').length,
    teachers: users.filter(u => u.role === 'teacher' && u.status === 'active').length,
  }), [users]);

  // ── Search + Filter ──
  const displayedUsers = useMemo(() => {
    let list = filter === 'all' ? users : users.filter(u => u.role === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(u =>
        u.name.toLowerCase().includes(q) ||
        (u.studentId && u.studentId.toLowerCase().includes(q)) ||
        (u.teacherId && u.teacherId.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return 0;
    });
  }, [users, filter, search]);

  const ListHeader = useMemo(() => (
    <View className={`${theme === 'dark' ? 'bg-[#1c1c14]' : 'bg-white'}`}>
      {/* ── Background Header Illustration ── */}
      <View className="absolute top-0 left-0 right-0 h-[450px] overflow-hidden">
        <LinearGradient
            colors={[theme === 'dark' ? '#4c1d95' : '#FEF2F2', theme === 'dark' ? '#1c1c14' : '#FFFFFF']}
            className="absolute inset-0"
        />
        <Image 
            source={require('../../assets/images/playschool_actions.png')} 
            style={{ width: '100%', height: '100%', opacity: theme === 'dark' ? 0.08 : 0.1, transform: [{ scale: 1.5 }, { translateY: -40 }] }}
            resizeMode="cover"
        />
      </View>

      <View className="px-6 pt-12 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className={`${theme === 'dark' ? 'bg-[#25251d] border-gray-800' : 'bg-white border-brand-pink/20'} w-14 h-14 rounded-2xl items-center justify-center shadow-xl border mb-6`}>
              <MaterialCommunityIcons name="arrow-left" size={28} color={theme === 'dark' ? '#FFF' : '#F472B6'} />
            </TouchableOpacity>
            <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>Members</Text>
            <Text className="text-2xl font-black text-brand-pink mt-[-4px]">Directory 📁</Text>
          </View>
          <View className="bg-brand-yellow w-24 h-24 rounded-[36px] items-center justify-center shadow-2xl border-4 border-white rotate-3 relative overflow-hidden">
             <MaterialCommunityIcons name="account-group-outline" size={48} color="#92400E" />
             <View className="absolute -bottom-2 -right-2 opacity-10">
                <MaterialCommunityIcons name="database-settings" size={60} color="#92400E" />
             </View>
          </View>
        </View>
      </View>

      {/* Search bar */}
      <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
        <View className={`${theme === 'dark' ? 'bg-black/20 border-gray-800' : 'bg-white border-brand-pink/10'} flex-row items-center border-2 rounded-[24px] px-6 py-4 shadow-sm`}>
          <MaterialCommunityIcons name="account-search-outline" size={22} color={theme === 'dark' ? '#F472B6' : '#F472B6'} />
          <TextInput
            style={{
              flex: 1, marginLeft: 12, fontSize: 16, fontWeight: '700',
              color: theme === 'dark' ? '#fff' : '#111',
            }}
            placeholder="Search by name, ID or email..."
            placeholderTextColor={theme === 'dark' ? '#4B5563' : '#9CA3AF'}
            value={search}
            onChangeText={setSearch}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')} className="bg-gray-100 dark:bg-white/10 p-1 rounded-full">
              <MaterialCommunityIcons name="close" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter stat cards */}
      <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', gap: 15 }}>
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => toggleFilter('student')}
            className="flex-1 rounded-[32px] overflow-hidden shadow-xl"
            style={{ elevation: 12 }}
          >
            <LinearGradient
                colors={filter === 'student' ? ['#FBBF24', '#D97706'] : (theme === 'dark' ? ['#25251d', '#1c1c14'] : ['#FFFFFF', '#F9FAFB'])}
                className="p-5"
            >
                <View className="flex-row items-center justify-between mb-4">
                    <View className={`${filter === 'student' ? 'bg-white/20' : 'bg-amber-100 dark:bg-amber-500/10'} p-3 rounded-2xl`}>
                        <MaterialCommunityIcons name="school-outline" size={22} color={filter === 'student' ? 'white' : '#B45309'} />
                    </View>
                    <Text className={`${filter === 'student' ? 'text-white/40' : 'text-amber-200'} font-black text-[20px] tracking-widest uppercase`}>St</Text>
                </View>
                <Text className={`${filter === 'student' ? 'text-white' : colors.text} text-3xl font-black tracking-tighter`}>{stats.students}</Text>
                <Text className={`${filter === 'student' ? 'text-white/60' : 'text-amber-600'} text-[9px] font-black uppercase tracking-widest mt-1`}>Total Registered</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => toggleFilter('teacher')}
            className="flex-1 rounded-[32px] overflow-hidden shadow-xl"
            style={{ elevation: 12 }}
          >
            <LinearGradient
                colors={filter === 'teacher' ? ['#F472B6', '#BE185D'] : (theme === 'dark' ? ['#25251d', '#1c1c14'] : ['#FFFFFF', '#F9FAFB'])}
                className="p-5"
            >
                <View className="flex-row items-center justify-between mb-4">
                    <View className={`${filter === 'teacher' ? 'bg-white/20' : 'bg-pink-100 dark:bg-pink-500/10'} p-3 rounded-2xl`}>
                        <MaterialCommunityIcons name="account-tie-outline" size={22} color={filter === 'teacher' ? 'white' : '#F472B6'} />
                    </View>
                    <Text className={`${filter === 'teacher' ? 'text-white/40' : 'text-pink-200'} font-black text-[20px] tracking-widest uppercase`}>Te</Text>
                </View>
                <Text className={`${filter === 'teacher' ? 'text-white' : colors.text} text-3xl font-black tracking-tighter`}>{stats.teachers}</Text>
                <Text className={`${filter === 'teacher' ? 'text-white/60' : 'text-pink-600'} text-[9px] font-black uppercase tracking-widest mt-1`}>Staff Members</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Section label */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
        <Text className={`text-xl font-black ${colors.text} tracking-tighter flex-1`}>
          {search ? `Results for "${search}"` : filter === 'all' ? 'Registered Members' : filter === 'student' ? 'Students' : 'Faculty Staff'}
          <Text className="text-brand-pink text-sm ml-2"> ({displayedUsers.length})</Text>
        </Text>
        {(filter !== 'all' || search !== '') && (
          <TouchableOpacity onPress={() => { setFilter('all'); setSearch(''); }}
            className="bg-brand-pink/10 px-4 py-1.5 rounded-full border border-brand-pink/20">
            <Text className="text-brand-pink text-[9px] font-black uppercase tracking-widest">CLEAR ALL</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [stats.students, stats.teachers, theme, colors, filter, search, displayedUsers.length]);

  const renderItem: ListRenderItem<User> = useCallback(({ item }) => (
    <View style={{ paddingHorizontal: 24 }}>
      <UserItem
        user={item} colors={colors} theme={theme}
        isMenuOpen={activeMenuId === item.id}
        onMenuToggle={() => setActiveMenuId(prev => prev === item.id ? null : item.id)}
        getRoleIcon={getRoleIcon}
        onStatusToggle={toggleUserStatus}
        onDelete={handleDeleteUserPress}
        onEdit={(u: User) => setEditingUser(u)}
      />
    </View>
  ), [colors, theme, activeMenuId, getRoleIcon, toggleUserStatus, handleDeleteUserPress]);

  return (
    <View className={`flex-1 ${colors.background}`}>
      <SafeAreaView className="flex-1">
        <FlatList
          data={displayedUsers}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={{ paddingBottom: 130 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#F472B6"
                colors={["#F472B6"]}
                progressBackgroundColor={theme === 'dark' ? '#1c1c14' : '#FFFFFF'}
            />
          }
          keyboardShouldPersistTaps="handled"
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={5}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60, opacity: 0.3 }}>
              <MaterialCommunityIcons name="account-search-outline" size={64} color="#9CA3AF" />
              <Text style={{ fontWeight: '900', marginTop: 12, fontSize: 13,
                color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
                No users found
              </Text>
            </View>
          }
        />

        {/* FAB with Shake Animation */}
        <Animated.View
          className="absolute bottom-10 right-8"
          style={{
            transform: [{ translateX: shakeAnim }],
            zIndex: 99
          }}
        >
          <TouchableOpacity
            className="w-20 h-20 rounded-[30px] items-center justify-center overflow-hidden"
            style={{ 
              elevation: 20,
              shadowColor: '#FBBF24',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.5,
              shadowRadius: 15,
            }}
            onPress={() => setShowAddForm(true)}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#FBBF24', '#D97706']}
              className="w-full h-full items-center justify-center"
            >
              <MaterialCommunityIcons name="account-plus-outline" size={36} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>

      {/* Add Modal */}
      <UserFormModal
        visible={showAddForm}
        onClose={closeAdd}
        onSubmit={handleAddSubmit}
        isSubmitting={isSubmitting}
        theme={theme}
        isEdit={false}
      />

      {/* Edit Modal */}
      <UserFormModal
        visible={!!editingUser}
        onClose={closeEdit}
        onSubmit={handleEditSubmit}
        isSubmitting={isSubmitting}
        theme={theme}
        initialData={editingUser}
        isEdit={true}
      />

      <ChoiceModal
        visible={choiceModal.visible}
        title={choiceModal.title}
        message={choiceModal.message}
        options={choiceModal.options}
        onClose={() => setChoiceModal(prev => ({ ...prev, visible: false }))}
        iconName={choiceModal.iconName}
        accentColor={choiceModal.accentColor}
      />

      <StatusModal
        visible={statusModal.visible}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
        onClose={() => setStatusModal(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}
