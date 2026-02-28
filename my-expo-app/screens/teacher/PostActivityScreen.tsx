import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface PostActivityScreenProps {
  navigation: NavigationProps;
}

export default function PostActivityScreen({ navigation }: PostActivityScreenProps) {
  const { colors, theme } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  const handlePost = () => {
    if (!title || !description) {
      Alert.alert('Missing Fields', 'Please fill all fields');
      return;
    }
    Alert.alert('Success', 'Activity posted successfully!');
    setTitle('');
    setDescription('');
    setImage('');
  };

  return (
    <SafeAreaView className={`flex-1 ${colors.background}`}>
      <View className="px-6 pt-4 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              className={`mb-4 ${colors.surface} w-12 h-12 rounded-2xl items-center justify-center border ${colors.border}`}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={28} color={theme === 'dark' ? '#FFF' : '#000'} />
            </TouchableOpacity>
            <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>Post</Text>
            <Text className="text-2xl font-bold text-brand-pink">Activity 📸</Text>
          </View>
          <View className="bg-yellow-600 w-16 h-16 rounded-3xl items-center justify-center">
            <MaterialCommunityIcons name="camera-plus" size={32} color="white" />
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always">
        <View className={`${colors.surface} rounded-[32px] p-6 border ${colors.border}`}>
          <View className="mb-4">
            <Text className={`${colors.textSecondary} font-bold text-xs mb-2 uppercase`}>Title *</Text>
            <TextInput
              className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-100 text-gray-900'} border rounded-2xl px-4 py-3 font-bold`}
              placeholder="Activity title..."
              placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View className="mb-4">
            <Text className={`${colors.textSecondary} font-bold text-xs mb-2 uppercase`}>Description *</Text>
            <TextInput
              className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-100 text-gray-900'} border rounded-2xl px-4 py-3 font-bold`}
              placeholder="Describe the activity..."
              placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View className="mb-6">
            <Text className={`${colors.textSecondary} font-bold text-xs mb-2 uppercase`}>Photo</Text>
            <TouchableOpacity
              onPress={pickImage}
              className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-100'} border rounded-2xl px-4 py-3 flex-row items-center justify-center`}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="image-plus" size={24} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              <Text className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} font-bold ml-3`}>
                {image ? 'Change Photo' : 'Select Photo'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handlePost}
            className="bg-yellow-600 py-4 rounded-2xl items-center"
            activeOpacity={0.7}
          >
            <Text className="text-white font-black text-base">Post Activity</Text>
          </TouchableOpacity>
        </View>
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
