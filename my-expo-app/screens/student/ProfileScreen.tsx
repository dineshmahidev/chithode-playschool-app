import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform, Image, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, User } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface ProfileScreenProps {
  navigation: NavigationProps;
  route?: { params?: { studentId?: string } };
}

// ─── Custom Date Picker Modal ──────────────────────────────────────────────────
function DatePickerModal({ visible, initialValue, onConfirm, onClose, theme, colors, title }: any) {
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');

  useEffect(() => {
    if (visible) {
      const parts = initialValue ? initialValue.split('-') : ['', '', ''];
      setYear(parts[0] || '');
      setMonth(parts[1] || '');
      setDay(parts[2] || '');
    }
  }, [visible, initialValue]);

  const save = () => {
    if (day && month && year) {
      onConfirm(`${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`);
      onClose();
    } else {
      Alert.alert('Oops!', 'Please fill Day, Month, and Year! 🎈');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/60 items-center justify-center p-6">
        <View className={`${theme === 'dark' ? 'bg-[#1a1a18]' : 'bg-white'} w-full rounded-[40px] p-8 shadow-2xl border ${colors.border}`}>
          <Text className={`text-2xl font-black ${colors.text} mb-2 tracking-tighter`}>{title} 📅</Text>
          <Text className={`text-xs ${colors.textTertiary} mb-8 font-bold`}>Enter details below to update date</Text>
          
          <View className="flex-row gap-3 mb-8">
            <View className="flex-1">
              <Text className={`text-[10px] font-black uppercase ${colors.textTertiary} mb-2 ml-2`}>Day</Text>
              <TextInput style={{ height: 64, borderRadius: 18, borderWidth: 1, textAlign: 'center', fontSize: 20, fontWeight: '700', color: theme === 'dark' ? '#fff' : '#111', backgroundColor: theme === 'dark' ? '#3e3e34' : '#F9FAFB', borderColor: theme === 'dark' ? '#4e4e44' : '#E5E7EB' }}
                placeholder="DD" keyboardType="numeric" maxLength={2} value={day} onChangeText={setDay} />
            </View>
            <View className="flex-1">
              <Text className={`text-[10px] font-black uppercase ${colors.textTertiary} mb-2 ml-2`}>Month</Text>
              <TextInput style={{ height: 64, borderRadius: 18, borderWidth: 1, textAlign: 'center', fontSize: 20, fontWeight: '700', color: theme === 'dark' ? '#fff' : '#111', backgroundColor: theme === 'dark' ? '#3e3e34' : '#F9FAFB', borderColor: theme === 'dark' ? '#4e4e44' : '#E5E7EB' }}
                placeholder="MM" keyboardType="numeric" maxLength={2} value={month} onChangeText={setMonth} />
            </View>
            <View className="flex-[1.5]">
              <Text className={`text-[10px] font-black uppercase ${colors.textTertiary} mb-2 ml-2`}>Year</Text>
              <TextInput style={{ height: 64, borderRadius: 18, borderWidth: 1, textAlign: 'center', fontSize: 20, fontWeight: '700', color: theme === 'dark' ? '#fff' : '#111', backgroundColor: theme === 'dark' ? '#3e3e34' : '#F9FAFB', borderColor: theme === 'dark' ? '#4e4e44' : '#E5E7EB' }}
                placeholder="YYYY" keyboardType="numeric" maxLength={4} value={year} onChangeText={setYear} />
            </View>
          </View>

          <TouchableOpacity onPress={save} className="bg-brand-pink py-5 rounded-[28px] items-center shadow-lg active:scale-95">
            <Text className="text-white font-black text-lg">Save Selection</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} className="mt-4 py-3 items-center">
            <Text className={`${colors.textTertiary} font-black uppercase tracking-widest text-[11px]`}>Nevermind, Keep Old</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function ProfileScreen({ navigation, route }: ProfileScreenProps) {
  const { user, users, updateProfile, updateUser } = useAuth();
  const { colors, theme } = useTheme();
  const scrollRef = React.useRef<ScrollView>(null);

  const studentId = route?.params?.studentId;
  const targetUser = studentId ? users.find(u => u.id === studentId) : user;

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [showBloodGroupPicker, setShowBloodGroupPicker] = useState(false);

  const bloodGroups = ['A+ve', 'A-ve', 'B+ve', 'B-ve', 'O+ve', 'O-ve', 'AB+ve', 'AB-ve'];

  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [fatherPhone, setFatherPhone] = useState('');
  const [motherName, setMotherName] = useState('');
  const [motherPhone, setMotherPhone] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [address, setAddress] = useState('');
  const [fees, setFees] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [admissionDate, setAdmissionDate] = useState('');
  const [avatar, setAvatar] = useState('');
  const [fatherPhoto, setFatherPhoto] = useState('');
  const [motherPhoto, setMotherPhoto] = useState('');
  const [guardianPhoto, setGuardianPhoto] = useState('');
  
  const [newPassword, setNewPassword] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // Date Picker Modal State
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState<'dob' | 'admission'>('dob');

  // Sync state when targetUser changes
  useEffect(() => {
    if (targetUser) {
      setName(targetUser.name || '');
      setFatherName(targetUser.fatherName || '');
      setFatherPhone(targetUser.fatherPhone || '');
      setMotherName(targetUser.motherName || '');
      setMotherPhone(targetUser.motherPhone || '');
      setGuardianName(targetUser.parentName || '');
      setGuardianPhone(targetUser.guardianPhone || '');
      setBloodGroup(targetUser.bloodGroup || '');
      setAddress(targetUser.address || '');
      setFees(targetUser.fees || '');
      setAdmissionDate(targetUser.admissionDate || '');
      setDateOfBirth(targetUser.date_of_birth || '');
      setAvatar(targetUser.avatar || '');
      setFatherPhoto(targetUser.fatherPhoto || '');
      setMotherPhoto(targetUser.motherPhoto || '');
      setGuardianPhoto(targetUser.guardianPhoto || '');
    }
  }, [targetUser]);

  // If redirected for specific student, start in edit mode
  useEffect(() => {
    if (studentId) {
      setIsEditing(true);
    }
  }, [studentId]);

  const handleUpdate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    const updatedData: Partial<User> = {
      name,
      fatherName,
      fatherPhone,
      motherName,
      motherPhone,
      parentName: guardianName,
      guardianPhone,
      bloodGroup,
      address,
      fees,
      admissionDate: admissionDate || null,
      date_of_birth: dateOfBirth || null,
      avatar,
      fatherPhoto,
      motherPhoto,
      guardianPhoto,
    };

    const success = studentId 
      ? await updateUser(studentId, updatedData) 
      : await updateProfile(updatedData);
    
    if (success) {
      Alert.alert('Success', studentId ? 'Student record updated! ✨' : 'Profile updated! ✨');
      setIsEditing(false);
      setCurrentStep(1);
      if (studentId) {
        navigation.goBack();
      }
    }
  };

  const renderInputField = (label: string, value: string, setValue: (val: string) => void, icon: string, placeholder: string, multiline: boolean = false) => (
    <View className="mb-6">
      <Text className={`text-xs font-black uppercase tracking-widest ${colors.textTertiary} mb-2 ml-1`}>{label}</Text>
      <View className={`flex-row items-center ${theme === 'dark' ? 'bg-[#3e3e34]' : 'bg-gray-50'} rounded-2xl px-5 border ${colors.border} ${multiline ? 'items-start py-4' : ''}`}>
        <MaterialCommunityIcons name={icon as any} size={20} color={colors.textTertiary} style={multiline ? { marginTop: 4 } : {}} />
        <TextInput
          className={`flex-1 ${multiline ? 'h-24 pt-1' : 'h-14'} ml-3 font-bold ${colors.text}`}
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
          editable={isEditing}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
    </View>
  );

  const pickImage = async (setter: (uri: string) => void) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload photos! 📸');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setter(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const renderPhotoCard = (title: string, photoUri?: string, setter?: (uri: string) => void) => (
    <View className="items-center mr-6">
      <Text className={`text-[10px] font-black uppercase ${colors.textTertiary} mb-3 ml-1 tracking-widest`}>{title}</Text>
      <TouchableOpacity 
        activeOpacity={0.9}
        className="relative"
        onPress={() => isEditing && setter && pickImage(setter)}
      >
        <View 
          style={{
            width: 112,
            height: 112,
            borderRadius: 36,
            backgroundColor: theme === 'dark' ? '#3e3e34' : '#fff',
            borderWidth: 2,
            borderColor: theme === 'dark' ? '#4e4e44' : '#F3F4F6',
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          {photoUri ? (
            <Image 
              source={{ uri: photoUri }} 
              style={{ width: '100%', height: '100%' }} 
              resizeMode="cover" 
            />
          ) : (
            <LinearGradient
              colors={theme === 'dark' ? ['#3e3e34', '#2d2d24'] : ['#FFF5F7', '#FFE4E8']}
              style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
            >
              <MaterialCommunityIcons 
                name="account-circle-outline" 
                size={44} 
                color={theme === 'dark' ? '#6B7280' : '#FDA4AF'} 
              />
              <Text className={`text-[9px] font-black uppercase mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-rose-300'}`}>
                Upload
              </Text>
            </LinearGradient>
          )}
        </View>
        
        {isEditing && (
          <View className="absolute -bottom-2 -right-2 bg-brand-pink w-10 h-10 rounded-2xl items-center justify-center border-4 border-white shadow-xl">
            <MaterialCommunityIcons name="camera-flip-outline" size={18} color="white" />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderProgressBar = () => (
    <View className="flex-row items-center justify-center mb-10 px-6">
      {[1, 2, 3].map((step) => (
        <React.Fragment key={step}>
          <View className={`w-10 h-10 rounded-full items-center justify-center ${
            currentStep === step ? 'bg-brand-pink shadow-lg' : 
            currentStep > step ? 'bg-green-500' : (theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200') + ' shadow-sm'
          }`}>
            {currentStep > step ? (
              <MaterialCommunityIcons name="check" size={20} color="white" />
            ) : (
              <Text className={`font-black ${currentStep === step ? 'text-white' : 'text-gray-400'}`}>{step}</Text>
            )}
          </View>
          {step < 3 && (
            <View className={`w-12 h-1 mx-2 rounded-full ${
              currentStep > step ? 'bg-green-500' : (theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200')
            }`} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  const renderDetailItem = (label: string, value: string | undefined, icon: string) => (
    <View className="flex-row items-center mb-5 bg-gray-50/50 dark:bg-black/20 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
      <View className="bg-brand-pink/10 p-2 rounded-xl mr-4">
        <MaterialCommunityIcons name={icon as any} size={20} color="#F472B6" />
      </View>
      <View className="flex-1">
        <Text className={`text-[10px] font-black uppercase ${colors.textTertiary} mb-0.5 tracking-wider`}>{label}</Text>
        <Text className={`text-sm font-black ${colors.text}`}>{value || 'Not provided'}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className={`flex-1 ${colors.background}`}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView ref={scrollRef} className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="px-6 pt-4 pb-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <TouchableOpacity 
                  onPress={() => navigation.goBack()} 
                  className={`mb-4 ${colors.surface} w-12 h-12 rounded-2xl items-center justify-center border ${colors.border} shadow-sm`}
                >
                  <MaterialCommunityIcons name="arrow-left" size={28} color={theme === 'dark' ? '#FFF' : '#000'} />
                </TouchableOpacity>
                <Text className={`text-5xl font-black ${colors.text} tracking-tighter`}>{studentId ? 'Edit' : 'My'}</Text>
                <Text className="text-2xl font-bold text-brand-pink tracking-tight">{studentId ? 'Record 📝' : 'Profile 👤'}</Text>
              </View>
              <View className={`${theme === 'dark' ? 'bg-[#3e3e34]' : 'bg-brand-yellow'} w-16 h-16 rounded-3xl items-center justify-center shadow-2xl border-4 ${theme === 'dark' ? 'border-gray-700' : 'border-white'} rotate-6`}>
                <MaterialCommunityIcons name={studentId ? "account-edit-outline" : "card-account-details-outline"} size={32} color={theme === 'dark' ? '#F472B6' : '#92400E'} />
              </View>
            </View>
          </View>

          {/* Form Step Section */}
          <View className="px-6 pb-20 mt-4">
            {isEditing && renderProgressBar()}

            <View className={`${colors.surface} rounded-[40px] p-8 shadow-2xl border ${colors.border}`}>
              
              {!isEditing ? (
                // View Mode
                <View>
                   <View className="items-center mb-8">
                      {renderPhotoCard('Student Account', avatar)}
                      <Text className={`text-2xl font-black ${colors.text} mt-4`}>{targetUser?.name}</Text>
                      <Text className="text-brand-pink font-bold">Student Record Verified ✅</Text>
                   </View>

                   <View className="mb-8">
                     <Text className={`text-xs font-black uppercase ${colors.textTertiary} mb-5 tracking-widest`}>Identity Records</Text>
                     {renderDetailItem('Date of Birth', targetUser?.date_of_birth, 'calendar-heart')}
                     {renderDetailItem('Blood Group', targetUser?.bloodGroup, 'water')}
                     {renderDetailItem('Contact Number', targetUser?.phone, 'phone')}
                     {renderDetailItem('Home Address', targetUser?.address, 'map-marker')}
                   </View>

                   <View className="mb-0">
                     <Text className={`text-xs font-black uppercase ${colors.textTertiary} mb-5 tracking-widest`}>Family & Guardian</Text>
                     {renderDetailItem("Father's Name", targetUser?.fatherName, 'account-tie')}
                     {renderDetailItem("Father's Contact", targetUser?.fatherPhone, 'phone')}
                     {renderDetailItem("Mother's Name", targetUser?.motherName, 'face-woman')}
                     {renderDetailItem("Mother's Contact", targetUser?.motherPhone, 'phone')}
                     {renderDetailItem("Guardian Name", targetUser?.parentName, 'account-group')}
                     {renderDetailItem("Guardian Contact", targetUser?.guardianPhone, 'phone-check')}
                   </View>

                   <TouchableOpacity 
                    onPress={() => setIsEditing(true)}
                    className={`${theme === 'dark' ? 'bg-[#3e3e34] border-gray-700' : 'bg-brand-yellow border-amber-600'} py-5 rounded-[32px] items-center shadow-lg active:scale-95 mt-6 border-b-4`}
                  >
                    <View className="flex-row items-center">
                      <MaterialCommunityIcons name="pencil-box-multiple-outline" size={20} color={theme === 'dark' ? '#F472B6' : '#92400E'} />
                      <Text className={`${theme === 'dark' ? 'text-cream' : 'text-amber-900'} font-black text-lg ml-2`}>Edit Full Student Profile</Text>
                    </View>
                   </TouchableOpacity>
                </View>
              ) : (
                // Edit Mode with Steps
                <View>
                   {currentStep === 1 && (
                     <View>
                       <Text className="text-brand-pink font-black text-lg mb-6 uppercase tracking-wider">Step 1: Personal Info</Text>
                       <View className="items-center mb-8">
                         {renderPhotoCard('Account Profile', avatar, setAvatar)}
                       </View>
                       {renderInputField('Student Name', name, setName, 'account', 'Full Name')}
                       
                       <View className="mb-6">
                         <Text className={`text-xs font-black uppercase tracking-widest ${colors.textTertiary} mb-2 ml-1`}>Date of Birth</Text>
                         <TouchableOpacity 
                           disabled={!isEditing}
                           onPress={() => { setPickerType('dob'); setPickerVisible(true); }}
                           className={`flex-row items-center ${theme === 'dark' ? 'bg-[#3e3e34]' : 'bg-gray-50'} rounded-2xl px-5 h-14 border ${colors.border}`}
                         >
                           <MaterialCommunityIcons name="cake" size={20} color={colors.textTertiary} />
                           <Text className={`flex-1 ml-3 font-bold ${dateOfBirth ? colors.text : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}`}>
                             {dateOfBirth || 'Select Birthday'}
                           </Text>
                           <MaterialCommunityIcons name="calendar-edit" size={20} color={colors.textTertiary} />
                         </TouchableOpacity>
                       </View>
                       
                       <View className="mb-6">
                         <Text className={`text-xs font-black uppercase tracking-widest ${colors.textTertiary} mb-2 ml-1`}>Blood Group</Text>
                         <TouchableOpacity 
                           onPress={() => setShowBloodGroupPicker(true)}
                           className={`flex-row items-center ${theme === 'dark' ? 'bg-[#3e3e34]' : 'bg-gray-50'} rounded-2xl px-5 h-14 border ${colors.border}`}
                         >
                           <MaterialCommunityIcons name="water" size={20} color="#EF4444" />
                           <Text className={`flex-1 ml-3 font-bold ${bloodGroup ? colors.text : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}`}>
                             {bloodGroup || 'Select Blood Group'}
                           </Text>
                           <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textTertiary} />
                         </TouchableOpacity>
                       </View>

                       {/* Admin specific fields */}
                       {user?.role === 'admin' && (
                         <View className={`pt-4 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'} mt-4`}>
                           <Text className={`${colors.textTertiary} font-black text-[10px] uppercase mb-6 tracking-widest`}>Admin Controls</Text>
                            <View className="mb-6">
                              <Text className={`text-xs font-black uppercase tracking-widest ${colors.textTertiary} mb-2 ml-1`}>Admission Date</Text>
                              <TouchableOpacity 
                                disabled={!isEditing}
                                onPress={() => { setPickerType('admission'); setPickerVisible(true); }}
                                className={`flex-row items-center ${theme === 'dark' ? 'bg-[#3e3e34]' : 'bg-gray-50'} rounded-2xl px-5 h-14 border ${colors.border}`}
                              >
                                <MaterialCommunityIcons name="calendar" size={20} color={colors.textTertiary} />
                                <Text className={`flex-1 ml-3 font-bold ${admissionDate ? colors.text : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}`}>
                                  {admissionDate || 'Select Date'}
                                </Text>
                                <MaterialCommunityIcons name="calendar-edit" size={20} color={colors.textTertiary} />
                              </TouchableOpacity>
                            </View>
                           {renderInputField('Monthly Fees', fees, setFees, 'cash', 'e.g. ₹15,000')}
                         </View>
                       )}
                     </View>
                   )}

                   {currentStep === 2 && (
                     <View>
                       <Text className="text-brand-pink font-black text-lg mb-8 uppercase tracking-wider">Step 2: Family Info</Text>

                       {/* Father Category */}
                       <View className="mb-12 pt-4 border-t border-gray-100 dark:border-gray-800">
                         <Text className={`${colors.textTertiary} font-black text-[10px] uppercase mb-6 tracking-widest`}>Father Information</Text>
                         <View className="mb-8 items-center flex-row bg-gray-50/50 dark:bg-gray-800/30 p-4 rounded-[32px] border border-gray-100 dark:border-gray-800">
                           {renderPhotoCard('Father Photo', fatherPhoto, setFatherPhoto)}
                           <View className="flex-1 ml-4 pr-2">
                             <Text className={`text-[10px] font-bold ${colors.textTertiary} mb-1 uppercase tracking-tighter`}>Verification Required</Text>
                             <Text className={`text-xs ${colors.text} font-black leading-tight`}>Please upload a clear portrait for the student's records.</Text>
                           </View>
                         </View>
                         {renderInputField("Father's Name", fatherName, setFatherName, 'account-tie', 'Father Name')}
                         {renderInputField("Father's Phone", fatherPhone, setFatherPhone, 'phone', 'Father Number')}
                       </View>

                       {/* Mother Category */}
                       <View className="mb-12 pt-4 border-t border-gray-100 dark:border-gray-800">
                         <Text className={`${colors.textTertiary} font-black text-[10px] uppercase mb-6 tracking-widest`}>Mother Information</Text>
                         <View className="mb-8 items-center flex-row bg-gray-50/50 dark:bg-gray-800/30 p-4 rounded-[32px] border border-gray-100 dark:border-gray-800">
                           {renderPhotoCard('Mother Photo', motherPhoto, setMotherPhoto)}
                           <View className="flex-1 ml-4 pr-2">
                             <Text className={`text-[10px] font-bold ${colors.textTertiary} mb-1 uppercase tracking-tighter`}>Identity Photo</Text>
                             <Text className={`text-xs ${colors.text} font-black leading-tight`}>Clear facial photo preferred for security verification.</Text>
                           </View>
                         </View>
                         {renderInputField("Mother's Name", motherName, setMotherName, 'face-woman', 'Mother Name')}
                         {renderInputField("Mother's Phone", motherPhone, setMotherPhone, 'phone', 'Mother Number')}
                       </View>

                       {/* Guardian Category */}
                       <View className="mb-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                         <Text className={`${colors.textTertiary} font-black text-[10px] uppercase mb-6 tracking-widest`}>Guardian Information</Text>
                         <View className="mb-8 items-center flex-row bg-gray-50/50 dark:bg-gray-800/30 p-4 rounded-[32px] border border-gray-100 dark:border-gray-800">
                           {renderPhotoCard('Guardian Photo', guardianPhoto, setGuardianPhoto)}
                           <View className="flex-1 ml-4 pr-2">
                             <Text className={`text-[10px] font-bold ${colors.textTertiary} mb-1 uppercase tracking-tighter`}>Optional Record</Text>
                             <Text className={`text-xs ${colors.text} font-black leading-tight`}>Required if primary parents are not reachable.</Text>
                           </View>
                         </View>
                         {renderInputField('Guardian Name', guardianName, setGuardianName, 'account-group', 'Guardian Name')}
                         {renderInputField('Guardian Phone', guardianPhone, setGuardianPhone, 'phone', 'Guardian Number')}
                       </View>
                     </View>
                   )}

                   {currentStep === 3 && (
                     <View>
                       <Text className="text-brand-pink font-black text-lg mb-6 uppercase tracking-wider">Step 3: Contact & Security</Text>
                       {renderInputField('Residential Address', address, setAddress, 'map-marker', 'Full Address', true)}
                       {!studentId && (
                         <View className="mt-4">
                           <Text className="text-brand-pink font-black text-lg mb-6 uppercase tracking-wider">Account Security</Text>
                           {renderInputField('New Password', newPassword, setNewPassword, 'key-outline', 'Enter new password')}
                         </View>
                       )}
                       {studentId && (
                          <View className={`mt-4 py-8 items-center ${theme === 'dark' ? 'bg-amber-500/10' : 'bg-brand-yellow/10'} rounded-3xl border ${theme === 'dark' ? 'border-amber-500/20' : 'border-brand-yellow/30'}`}>
                            <MaterialCommunityIcons name="shield-check" size={48} color="#92400E" />
                            <Text className={`text-amber-900 font-black text-center mt-4`}>Professional Record Management</Text>
                            <Text className={`text-amber-800 text-xs text-center px-6 mt-1`}>Changes are synced with the central student database instantly.</Text>
                          </View>
                       )}
                     </View>
                   )}

                   {/* Step Navigation Buttons */}
                   <View className="flex-row gap-4 mt-8">
                     {currentStep > 1 ? (
                       <TouchableOpacity 
                         onPress={() => setCurrentStep(prev => prev - 1)}
                         className={`flex-1 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} py-5 rounded-[28px] items-center`}
                       >
                         <Text className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} font-black text-lg`}>Back</Text>
                       </TouchableOpacity>
                     ) : (
                       <TouchableOpacity 
                        onPress={() => {
                          if (studentId) {
                            navigation.goBack();
                          } else {
                            setIsEditing(false);
                            setCurrentStep(1);
                          }
                        }}
                        className={`flex-1 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} py-5 rounded-[28px] items-center`}
                      >
                        <Text className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} font-black text-lg`}>Cancel</Text>
                      </TouchableOpacity>
                     )}

                     {currentStep < totalSteps ? (
                       <TouchableOpacity 
                         onPress={() => {
                           setCurrentStep(prev => prev + 1);
                           scrollRef.current?.scrollTo({ y: 0, animated: true });
                         }}
                         className="flex-1 bg-brand-pink py-5 rounded-[28px] items-center shadow-lg active:scale-95"
                       >
                         <Text className="text-white font-black text-lg">Next</Text>
                       </TouchableOpacity>
                     ) : (
                       <TouchableOpacity 
                         onPress={handleUpdate}
                         className="flex-1 bg-green-500 py-5 rounded-[28px] items-center shadow-lg active:scale-95"
                       >
                         <Text className="text-white font-black text-lg">Finish</Text>
                       </TouchableOpacity>
                     )}
                   </View>
                </View>
              )}
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <DatePickerModal 
        visible={pickerVisible}
        title={pickerType === 'dob' ? 'Student Birthday' : 'Admission Date'}
        initialValue={pickerType === 'dob' ? dateOfBirth : admissionDate}
        onConfirm={pickerType === 'dob' ? setDateOfBirth : setAdmissionDate}
        onClose={() => setPickerVisible(false)}
        theme={theme}
        colors={colors}
      />

      {/* Blood Group Picker Modal - Root Level */}
      {showBloodGroupPicker && (
         <View className="absolute inset-0 z-[999] items-center justify-center p-6 bg-black/60">
            <View className={`${colors.surface} w-full rounded-[40px] p-8 shadow-2xl border ${colors.border}`}>
              <Text className={`text-2xl font-black ${colors.text} mb-6`}>Select Blood Group</Text>
              <View className="flex-row flex-wrap justify-between">
                {bloodGroups.map((group) => (
                  <TouchableOpacity
                    key={group}
                    onPress={() => {
                      setBloodGroup(group);
                      setShowBloodGroupPicker(false);
                    }}
                    className={`w-[48%] py-4 rounded-2xl mb-4 items-center border ${
                      bloodGroup === group ? 'bg-brand-pink border-brand-pink' : colors.border
                    }`}
                  >
                    <Text className={`font-black ${bloodGroup === group ? 'text-white' : colors.text}`}>{group}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity 
                onPress={() => setShowBloodGroupPicker(false)}
                className={`mt-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} py-4 rounded-2xl items-center`}
              >
                <Text className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} font-black`}>Close</Text>
              </TouchableOpacity>
            </View>
         </View>
      )}
    </SafeAreaView>
  );
}
