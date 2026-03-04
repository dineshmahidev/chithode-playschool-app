import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Image, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuth, Activity } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import PremiumPopup from '../../components/PremiumPopup';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface PostActivityScreenProps {
  navigation: NavigationProps;
}

export default function PostActivityScreen({ navigation }: PostActivityScreenProps) {
  const { users, user, addActivity } = useAuth();
  const { colors, theme } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [image, setImage] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const students = users.filter(u => u.role === 'student');

  const toggleStudentSelection = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) 
        ? prev.filter(sid => sid !== id) 
        : [...prev, id]
    );
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // Enable free crop and zoom
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!title || !description || selectedStudentIds.length === 0) {
      Alert.alert('Missing Fields', 'Please fill all fields and tag at least one student');
      return;
    }
    
    setIsPosting(true);
    
    try {
      const newActivity: Activity = {
        id: Date.now().toString(),
        title,
        description,
        mediaType: 'image',
        mediaUrl: image || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=800&auto=format&fit=crop',
        studentIds: selectedStudentIds,
        date: new Date().toISOString().split('T')[0],
        author: user?.name || 'Teacher',
        likesCount: 0,
        comments: [],
      };

      await addActivity(newActivity);
      setIsPosting(false);
      setShowSuccessModal(true);
      setTitle('');
      setDescription('');
      setImage('');
      setSelectedStudentIds([]);
    } catch (error) {
      setIsPosting(false);
      Alert.alert('Error', 'Failed to post activity. Please try again.');
    }
  };

  return (
    <View 
        className={`flex-1 ${theme === 'dark' ? 'bg-[#1c1c14]' : 'bg-white'}`}
        style={{ backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF' }}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* ── Background Gradient & 3D Illustration ── */}
          <View className="absolute top-0 left-0 right-0 h-[400px] overflow-hidden">
            <LinearGradient
                colors={[theme === 'dark' ? '#1e1b4b' : '#FDF2F8', theme === 'dark' ? '#1c1c14' : '#FFFFFF']}
                className="absolute inset-0"
            />
            <Image 
                source={require('../../assets/images/playschool_actions.png')} 
                style={{ width: '100%', height: '100%', opacity: theme === 'dark' ? 0.1 : 0.2, transform: [{ scale: 1.4 }, { translateY: -40 }] }}
                resizeMode="cover"
            />
            <View className="absolute -top-20 -left-20 w-80 h-80 bg-brand-pink/10 rounded-full blur-3xl" />
            
            <LinearGradient
                colors={['transparent', theme === 'dark' ? '#1c1c14' : '#FFFFFF']}
                className="absolute bottom-0 left-0 right-0 h-40"
            />
          </View>

          {/* Header */}
          <View className="px-6 pt-12 pb-6 flex-row items-center justify-between">
            <View className="flex-1">
              <TouchableOpacity 
                onPress={() => navigation.goBack()} 
                className={`${theme === 'dark' ? 'bg-[#2d2d24] border-gray-800' : 'bg-white border-brand-pink/20'} w-14 h-14 rounded-2xl items-center justify-center shadow-xl border mb-4`}
              >
                <MaterialCommunityIcons name="arrow-left" size={28} color={theme === 'dark' ? '#FFF' : '#F472B6'} />
              </TouchableOpacity>
              <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>Teacher</Text>
              <Text className="text-2xl font-black text-brand-pink mt-[-4px]">Activity Portal 📸</Text>
            </View>
            <View className="bg-brand-yellow w-24 h-24 rounded-[36px] items-center justify-center shadow-2xl border-4 border-white rotate-3 relative overflow-hidden">
                <MaterialCommunityIcons name="camera-iris" size={48} color="#92400E" />
                <View className="absolute -bottom-2 -right-2 opacity-20">
                    <MaterialCommunityIcons name="star-outline" size={60} color="#92400E" />
                </View>
            </View>
          </View>

          <View className="px-6 pb-20">
            <View className={`${theme === 'dark' ? 'bg-[#25251d]' : 'bg-white'} rounded-[40px] p-8 shadow-2xl border ${theme === 'dark' ? 'border-gray-800' : 'border-gray-50'}`}>
                {/* Title Input */}
                <View className="mb-6">
                    <Text className={`text-[10px] font-black uppercase tracking-[3px] ${colors.textSecondary} mb-4 opacity-70`}>Activity Title ✨</Text>
                    <View className={`flex-row items-center ${theme === 'dark' ? 'bg-black/20' : 'bg-gray-50'} rounded-2xl px-5 border ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
                        <TextInput
                            className={`flex-1 h-16 font-bold text-lg ${colors.text}`}
                            placeholder="e.g. Garden Exploration"
                            placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>
                </View>

                {/* Student Selector Section */}
                <View className="mb-8">
                    <View className="flex-row items-center justify-between mb-5">
                        <Text className={`text-[10px] font-black uppercase tracking-[3px] ${colors.textSecondary} opacity-70`}>Tag Students 👥</Text>
                        <View className="bg-brand-pink/10 px-3 py-1 rounded-full border border-brand-pink/20">
                            <Text className="text-brand-pink text-[8px] font-black uppercase tracking-widest">{selectedStudentIds.length} Tagged</Text>
                        </View>
                    </View>
                    
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2">
                        <TouchableOpacity 
                            onPress={() => {
                                if (selectedStudentIds.length === students.length) {
                                    setSelectedStudentIds([]);
                                } else {
                                    setSelectedStudentIds(students.map(s => s.id));
                                }
                            }}
                            className="items-center mr-5"
                        >
                            <View className={`w-20 h-20 rounded-[28px] items-center justify-center border-2 border-dashed ${selectedStudentIds.length === students.length ? 'border-brand-pink bg-brand-pink/10' : (theme === 'dark' ? 'border-gray-800 bg-black/20' : 'border-gray-200 bg-gray-50')}`}>
                                <MaterialCommunityIcons 
                                    name={selectedStudentIds.length === students.length ? "minus-circle-outline" : "plus-circle-outline"} 
                                    size={32} 
                                    color={selectedStudentIds.length === students.length ? '#F472B6' : colors.textTertiary} 
                                />
                            </View>
                            <Text className={`text-[9px] font-black mt-3 uppercase tracking-widest ${selectedStudentIds.length === students.length ? 'text-brand-pink' : colors.textTertiary}`}>
                                {selectedStudentIds.length === students.length ? 'Deselect' : 'All'}
                            </Text>
                        </TouchableOpacity>

                        {students.map((student) => {
                            const isSelected = selectedStudentIds.includes(student.id);
                            return (
                                <TouchableOpacity 
                                    key={student.id} 
                                    onPress={() => toggleStudentSelection(student.id)}
                                    className="items-center mr-6"
                                >
                                    <View className={`w-24 h-24 rounded-[32px] overflow-hidden border-2 shadow-sm ${isSelected ? 'border-brand-pink bg-brand-pink/10' : (theme === 'dark' ? 'border-gray-800 bg-[#2d2d24]' : 'border-white bg-white')}`}>
                                        {student.avatar ? (
                                            <Image source={{ uri: student.avatar }} className="w-full h-full" />
                                        ) : (
                                            <View className="flex-1 items-center justify-center">
                                                <MaterialCommunityIcons 
                                                    name="account-child-circle" 
                                                    size={48} 
                                                    color={isSelected ? '#F472B6' : (theme === 'dark' ? '#3d3d2b' : '#FDF2F8')} 
                                                />
                                            </View>
                                        )}
                                        {isSelected && (
                                            <View className="absolute inset-0 bg-brand-pink/40 items-center justify-center">
                                                <View className="bg-white p-2 rounded-full shadow-2xl">
                                                    <MaterialCommunityIcons name="check-bold" size={16} color="#F472B6" />
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                    <Text className={`text-[10px] font-black mt-3 uppercase tracking-tighter text-center w-24 ${isSelected ? 'text-brand-pink' : colors.text}`} numberOfLines={1}>
                                        {student.name}
                                    </Text>
                                    <Text className={`text-[8px] font-bold ${isSelected ? 'text-brand-pink/60' : colors.textTertiary} uppercase tracking-widest mt-0.5`}>
                                        {isSelected ? 'TAGGED' : (student.studentId || 'ID#---')}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Description Input */}
                <View className="mb-8">
                    <Text className={`text-[10px] font-black uppercase tracking-[3px] ${colors.textSecondary} mb-4 opacity-70`}>Story Details 📝</Text>
                    <TextInput
                        className={`w-full h-40 font-bold ${colors.text} text-xl leading-7`}
                        placeholder="Write something wonderful about this activity..."
                        placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                {/* Photo Upload */}
                <View className="mb-10">
                    <Text className={`text-[10px] font-black uppercase tracking-[3px] ${colors.textSecondary} mb-4 opacity-70`}>Visual Content 🎨</Text>
                    <TouchableOpacity
                        onPress={pickImage}
                        activeOpacity={0.8}
                        className={`${theme === 'dark' ? 'bg-black/20 border-gray-800' : 'bg-gray-50 border-gray-100'} border-2 border-dashed rounded-[32px] p-8 items-center justify-center`}
                    >
                        {image ? (
                            <View className="w-full">
                                <Image source={{ uri: image }} className="w-full h-48 rounded-2xl" resizeMode="cover" />
                                <View className="mt-4 flex-row items-center justify-center">
                                    <View className="bg-brand-pink/10 px-4 py-2 rounded-full border border-brand-pink/20">
                                        <Text className="text-brand-pink font-black text-[10px] uppercase tracking-widest">Change Photo</Text>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <View className="items-center">
                                <View className="bg-brand-pink/10 w-20 h-20 rounded-full items-center justify-center mb-4">
                                    <MaterialCommunityIcons name="image-plus" size={36} color="#F472B6" />
                                </View>
                                <Text className={`text-lg font-black ${colors.text}`}>Add Activity Photo</Text>
                                <Text className={`${colors.textTertiary} text-[10px] font-bold uppercase tracking-widest mt-2`}>Max 5MB • JPG or PNG</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    onPress={handlePost}
                    activeOpacity={0.9}
                    disabled={isPosting}
                    className="rounded-[28px] overflow-hidden shadow-xl"
                    style={{ elevation: 12 }}
                >
                    <LinearGradient
                        colors={['#EF4444', '#B91C1C']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="py-6 flex-row items-center justify-center"
                    >
                        {isPosting ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="send-circle-outline" size={28} color="white" />
                                <Text className="text-white font-black text-xl ml-3 uppercase tracking-tighter">Publish to School</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <PremiumPopup
        visible={showSuccessModal}
        type="success"
        title="Post Live! 🌟"
        message="Your school activity has been published. Parents and kids will be thrilled to see today's updates! ✨"
        buttonText="Return to Feed"
        onClose={() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }}
      />
    </View>
  );
}
