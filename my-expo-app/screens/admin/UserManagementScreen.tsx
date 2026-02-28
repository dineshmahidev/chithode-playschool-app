import React, { useState, memo, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, Alert, TextInput, Modal,
  ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard,
  FlatList, ListRenderItem, ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth, User } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  });

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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme === 'dark' ? '#111' : '#F9FAFB' }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 24, paddingVertical: 16,
          borderBottomWidth: 1, borderBottomColor: theme === 'dark' ? '#2a2a28' : '#F3F4F6',
        }}>
          <TouchableOpacity onPress={onClose} style={{
            width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
            backgroundColor: theme === 'dark' ? '#1e1e1c' : '#fff',
            borderWidth: 1.5, borderColor: theme === 'dark' ? '#3a3a38' : '#E5E7EB',
          }}>
            <MaterialCommunityIcons name="close" size={22} color={theme === 'dark' ? 'white' : 'black'} />
          </TouchableOpacity>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: theme === 'dark' ? '#fff' : '#111' }}>
              {isEdit ? 'Edit User' : 'Add User'}
            </Text>
            <Text style={{ color: '#F472B6', fontWeight: '700', fontSize: 13 }}>
              {isEdit ? '✏️ Update Profile' : 'Registration ✨'}
            </Text>
          </View>
        </View>
        <ScrollView style={{ flex: 1, paddingHorizontal: 24 }}
          keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 20 }}>
          <UserForm
            theme={theme}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            initialData={initialData}
            isEdit={isEdit}
          />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  </Modal>
));

// ─── User Card ────────────────────────────────────────────────────────────────
const UserItem = memo(({ user, colors, theme, isMenuOpen, onMenuToggle, getRoleIcon, onStatusToggle, onDelete, onEdit }: any) => (
  <View style={{
    marginBottom: 14, borderRadius: 28,
    backgroundColor: theme === 'dark' ? '#1a1a18' : '#fff',
    borderWidth: 1.5,
    borderColor: user.status === 'inactive'
      ? (theme === 'dark' ? '#3a1010' : '#FEE2E2')
      : (theme === 'dark' ? '#2a2a28' : '#FEF9C3'),
    overflow: 'hidden',
  }}>
    {/* Status bar on left */}
    <View style={{
      position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
      backgroundColor: user.status === 'active' ? '#4ADE80' : '#FCA5A5',
    }} />

    <View style={{ padding: 18, paddingLeft: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
          width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
          backgroundColor: user.role === 'admin' ? '#FEF3C7' : user.role === 'teacher' ? '#FCE7F3' : '#F3F4F6',
        }}>
          <MaterialCommunityIcons name={getRoleIcon(user.role) as any} size={28}
            color={user.role === 'admin' ? '#92400E' : user.role === 'teacher' ? '#F472B6' : '#6B7280'} />
        </View>

        <View style={{ marginLeft: 14, flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: theme === 'dark' ? '#fff' : '#111' }}>
              {user.name}
            </Text>
            <View style={{
              paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
              backgroundColor: user.status === 'active' ? '#DCFCE7' : '#FEE2E2',
            }}>
              <Text style={{
                fontSize: 9, fontWeight: '900', textTransform: 'uppercase',
                color: user.status === 'active' ? '#15803D' : '#B91C1C',
              }}>{user.status}</Text>
            </View>
          </View>

          <Text style={{ fontSize: 11, color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontWeight: '600', marginTop: 2 }}>
            {user.email || user.phone || '—'}
          </Text>

          <View className="flex-row items-center mt-6 flex-wrap gap-1">
            <View style={{
              backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
            }}>
              <Text style={{ fontSize: 9, fontWeight: '900', color: '#92400E' }}>
                {user.studentId || user.teacherId || 'ADMIN'}
              </Text>
            </View>
            {user.role === 'student' && user.parentName && (
              <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                <Text style={{ fontSize: 9, fontWeight: '900', color: '#1D4ED8' }}>👤 {user.parentName}</Text>
              </View>
            )}
            {user.category && (
              <View style={{ backgroundColor: '#FDF4FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                <Text style={{ fontSize: 9, fontWeight: '900', color: '#7E22CE' }}>{user.category}</Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity onPress={onMenuToggle} style={{ padding: 8 }}>
          <MaterialCommunityIcons name="dots-vertical" size={22}
            color={isMenuOpen ? '#F472B6' : '#9CA3AF'} />
        </TouchableOpacity>
      </View>

      {isMenuOpen && (
        <View style={{
          flexDirection: 'row', justifyContent: 'space-around',
          marginTop: 14, paddingTop: 14,
          borderTopWidth: 1, borderTopColor: theme === 'dark' ? '#2a2a28' : '#F3F4F6',
        }}>
          {/* Edit */}
          <TouchableOpacity style={{ alignItems: 'center' }}
            onPress={() => { onMenuToggle(); onEdit(user); }}>
            <View style={{ backgroundColor: '#FFF7ED', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#FED7AA' }}>
              <MaterialCommunityIcons name="pencil-outline" size={20} color="#C2410C" />
            </View>
            <Text style={{ fontSize: 10, fontWeight: '900', color: '#C2410C', marginTop: 6 }}>EDIT</Text>
          </TouchableOpacity>

          {/* Halt / Live */}
          <TouchableOpacity style={{ alignItems: 'center' }}
            onPress={() => { onMenuToggle(); onStatusToggle(user.id); }}>
            <View style={{
              padding: 12, borderRadius: 16, borderWidth: 1,
              backgroundColor: user.status === 'active' ? '#FFF7ED' : '#F0FDF4',
              borderColor: user.status === 'active' ? '#FED7AA' : '#BBF7D0',
            }}>
              <MaterialCommunityIcons
                name={user.status === 'active' ? 'account-off-outline' : 'account-check-outline'}
                size={20} color={user.status === 'active' ? '#B45309' : '#15803D'} />
            </View>
            <Text style={{
              fontSize: 10, fontWeight: '900', marginTop: 6,
              color: user.status === 'active' ? '#B45309' : '#15803D',
            }}>
              {user.status === 'active' ? 'HALT' : 'ACTIVATE'}
            </Text>
          </TouchableOpacity>

          {/* Delete */}
          <TouchableOpacity style={{ alignItems: 'center' }}
            onPress={() => { onMenuToggle(); onDelete(user.id, user.name); }}>
            <View style={{ backgroundColor: '#FEF2F2', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#FECACA' }}>
              <MaterialCommunityIcons name="trash-can-outline" size={20} color="#B91C1C" />
            </View>
            <Text style={{ fontSize: 10, fontWeight: '900', color: '#B91C1C', marginTop: 6 }}>DELETE</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  </View>
));

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function UserManagementScreen({ navigation }: UserManagementScreenProps) {
  const { users, addUser, updateUser, deleteUser, toggleUserStatus } = useAuth();
  const { theme, colors } = useTheme();

  const [showAddForm,   setShowAddForm]   = useState(false);
  const [editingUser,   setEditingUser]   = useState<User | null>(null);
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [activeMenuId,  setActiveMenuId]  = useState<string | null>(null);
  const [filter,        setFilter]        = useState<'all' | 'student' | 'teacher'>('all');
  const [search,        setSearch]        = useState('');

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
        student_id:    formData.role === 'student' ? `chk${studentCount.toString().padStart(3,'0')}` : undefined,
        teacher_id:    formData.role === 'teacher' ? `chkt${teacherCount.toString().padStart(3,'0')}`  : undefined,
      } as any);
      setShowAddForm(false);
      Alert.alert('Added! 🎉', 'User registered successfully.');
    } catch {
      Alert.alert('Error', 'Failed to add user.');
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
        date_of_birth: formData.role === 'student' && formData.dateOfBirth ? formData.dateOfBirth : undefined,
      };
      if (formData.password) payload.password = formData.password;
      await updateUser(editingUser.id, payload);
      setEditingUser(null);
      Alert.alert('Saved! ✅', 'User updated successfully.');
    } catch {
      Alert.alert('Error', 'Failed to update user.');
    } finally {
      setIsSubmitting(false);
    }
  }, [editingUser, updateUser]);

  const handleDeleteUserPress = useCallback((userId: string, userName: string) => {
    Alert.alert('Delete User', `Remove ${userName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteUser(userId) },
    ]);
  }, [deleteUser]);

  const stats = useMemo(() => ({
    students: users.filter(u => u.role === 'student').length,
    teachers: users.filter(u => u.role === 'teacher').length,
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
    return list;
  }, [users, filter, search]);

  const ListHeader = useMemo(() => (
    <>
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                marginBottom: 16, width: 46, height: 46, borderRadius: 16,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: theme === 'dark' ? '#1e1e1c' : '#fff',
                borderWidth: 1.5, borderColor: theme === 'dark' ? '#3a3a38' : '#E5E7EB',
              }}>
              <MaterialCommunityIcons name="arrow-left" size={26} color={theme === 'dark' ? 'white' : 'black'} />
            </TouchableOpacity>
            <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>User</Text>
            <Text className="text-2xl font-bold text-brand-pink">Directory 📁</Text>
          </View>
          <View style={{ backgroundColor: '#FCE7F3', padding: 20, borderRadius: 28 }}>
            <MaterialCommunityIcons name="account-group" size={40} color="#F472B6" />
          </View>
        </View>
      </View>

      {/* Search bar */}
      <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: theme === 'dark' ? '#1e1e1c' : '#fff',
          borderWidth: 1.5, borderColor: theme === 'dark' ? '#3a3a38' : '#E5E7EB',
          borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12,
        }}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
          <TextInput
            style={{
              flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '600',
              color: theme === 'dark' ? '#fff' : '#111',
            }}
            placeholder="Search by name, ID or email..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter stat cards */}
      <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity activeOpacity={0.75} onPress={() => toggleFilter('student')}
            style={{
              flex: 1, padding: 18, borderRadius: 24,
              backgroundColor: filter === 'student' ? (theme === 'dark' ? '#3a2e0a' : '#FEF3C7') : (theme === 'dark' ? '#1e1e1c' : '#fff'),
              borderWidth: 2, borderColor: filter === 'student' ? '#B45309' : (theme === 'dark' ? '#2a2a28' : '#FDE68A'),
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontSize: 32, fontWeight: '900', color: '#B45309' }}>{stats.students}</Text>
              <MaterialCommunityIcons name="school" size={26} color="#B45309" />
            </View>
            <Text style={{ fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase',
              color: filter === 'student' ? '#B45309' : '#9CA3AF' }}>Students</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.75} onPress={() => toggleFilter('teacher')}
            style={{
              flex: 1, padding: 18, borderRadius: 24,
              backgroundColor: filter === 'teacher' ? (theme === 'dark' ? '#2d0f1e' : '#FDF2F8') : (theme === 'dark' ? '#1e1e1c' : '#fff'),
              borderWidth: 2, borderColor: filter === 'teacher' ? '#F472B6' : (theme === 'dark' ? '#2a2a28' : '#FBCFE8'),
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontSize: 32, fontWeight: '900', color: '#F472B6' }}>{stats.teachers}</Text>
              <MaterialCommunityIcons name="account-tie" size={26} color="#F472B6" />
            </View>
            <Text style={{ fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase',
              color: filter === 'teacher' ? '#F472B6' : '#9CA3AF' }}>Teachers</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Section label */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 12, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase',
          color: theme === 'dark' ? '#6B7280' : '#9CA3AF', flex: 1 }}>
          {search ? `Results for "${search}"` : filter === 'all' ? 'All Members' : filter === 'student' ? 'Students' : 'Teachers'}
          {'  '}({displayedUsers.length})
        </Text>
        {(filter !== 'all' || search !== '') && (
          <TouchableOpacity onPress={() => { setFilter('all'); setSearch(''); }}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme === 'dark' ? '#2a2a28' : '#F3F4F6',
              paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 }}>
            <MaterialCommunityIcons name="close" size={12} color="#9CA3AF" />
            <Text style={{ fontSize: 9, fontWeight: '900', color: '#9CA3AF', marginLeft: 3 }}>CLEAR</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
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

        {/* FAB */}
        <TouchableOpacity
          style={{
            position: 'absolute', bottom: 32, right: 28,
            backgroundColor: '#F472B6', width: 72, height: 72,
            borderRadius: 24, alignItems: 'center', justifyContent: 'center',
            shadowColor: '#F472B6', shadowOpacity: 0.45,
            shadowOffset: { width: 0, height: 6 }, shadowRadius: 16, elevation: 10,
          }}
          onPress={() => setShowAddForm(true)}
          activeOpacity={0.9}>
          <MaterialCommunityIcons name="account-plus" size={36} color="white" />
        </TouchableOpacity>
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
    </View>
  );
}
