import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, Modal, TextInput, ActivityIndicator, FlatList, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const CAMERA_ICONS = ['video', 'camera', 'security', 'shield-search', 'eye', 'home', 'school', 'baby-face-outline'];

interface Camera {
  id: string;
  name: string;
  url: string;
  status: 'online' | 'offline';
  icon?: string;
}

const CameraCard = memo(({ camera, onSelect, onEdit, onDelete, isAdmin, colors, theme }: any) => (
  <TouchableOpacity
    className={`p-6 rounded-[32px] mb-5 flex-row items-center border ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-brand-pink/10'} ${
      camera.status === 'offline' ? 'opacity-40' : 'shadow-sm active:scale-95'
    }`}
    onPress={() => onSelect(camera)}
    disabled={camera.status === 'offline'}
  >
    <View className={`w-14 h-14 rounded-2xl items-center justify-center mr-5 ${
      camera.status === 'online' ? 'bg-brand-pink shadow-lg shadow-pink-200' : 'bg-gray-400'
    }`}>
      <MaterialCommunityIcons
        name={(camera.icon || (camera.status === 'online' ? 'video' : 'video-off')) as any}
        size={28}
        color="white"
      />
    </View>
    <View className="flex-1">
      <Text className={`text-xl font-black ${colors.text}`}>{camera.name}</Text>
      <View className="flex-row items-center mt-1.5">
        <View className={`w-2.5 h-2.5 rounded-full mr-2 ${
          camera.status === 'online' ? 'bg-green-500' : 'bg-red-500'
        }`} />
        <Text className={`text-xs font-black uppercase tracking-widest ${
          camera.status === 'online' ? 'text-green-600 dark:text-green-400' : 'text-red-500'
        }`}>
          {camera.status}
        </Text>
      </View>
    </View>
    
    {isAdmin ? (
      <View className="flex-row">
        <TouchableOpacity 
           onPress={() => onEdit(camera)}
           className={`w-10 h-10 rounded-xl items-center justify-center mr-2 ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'} border ${colors.border}`}
        >
          <MaterialCommunityIcons name="pencil" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity 
           onPress={() => onDelete(camera.id)}
           className={`w-10 h-10 rounded-xl items-center justify-center bg-red-500/10 border border-red-500/20`}
        >
          <MaterialCommunityIcons name="trash-can" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    ) : (
      <View className={`w-12 h-12 rounded-2xl items-center justify-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'} border ${colors.border}`}>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={camera.status === 'online' ? '#F472B6' : (theme === 'dark' ? '#4B5563' : '#9CA3AF')}
        />
      </View>
    )}
  </TouchableOpacity>
));
// Live Monitoring Screen implementation begins here...

export default function LiveCameraScreen({ navigation, route }: any) {
  const { colors, theme } = useTheme();
  const { user } = useAuth();
  
  // Dynamic role-based access control
  const isAdmin = user?.role === 'admin'; 

  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // Modal for CRUD
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCamera, setEditingCamera] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', url: '', status: 'online', icon: 'video' });
  const [rotation, setRotation] = useState(0);
  const [showIconDropdown, setShowIconDropdown] = useState(false);
  const [showControlsDropdown, setShowControlsDropdown] = useState(false);
  const [showCameraSwitch, setShowCameraSwitch] = useState(false);


  const fetchCameras = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/cameras');
      setCameras(response.data);
    } catch (error) {
      console.error('Error fetching cameras:', error);
      Alert.alert('Error', 'Failed to load cameras');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  const handleSaveCamera = useCallback(async () => {
    if (!formData.name || !formData.url) {
      Alert.alert('Required', 'Please fill in all fields');
      return;
    }

    try {
      setIsActionLoading(true);
      if (editingCamera) {
        await api.put(`/cameras/${editingCamera.id}`, formData);
      } else {
        await api.post('/cameras', formData);
      }
      setModalVisible(false);
      fetchCameras();
      Alert.alert('Success', 'Camera saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save camera');
    } finally {
      setIsActionLoading(false);
    }
  }, [formData, editingCamera, fetchCameras]);

  const handleDeleteCamera = useCallback((id: string) => {
    Alert.alert('Delete Camera', 'Are you sure you want to remove this camera feed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          setIsActionLoading(true);
          await api.delete(`/cameras/${id}`);
          fetchCameras();
        } catch (error) {
          Alert.alert('Error', 'Failed to delete camera');
        } finally {
          setIsActionLoading(false);
        }
      }}
    ]);
  }, [fetchCameras]);

  const handleCameraSelect = useCallback((camera: Camera) => {
    if (camera.status === 'offline') {
      Alert.alert('Camera Offline', 'This camera is currently not available.');
      return;
    }
    setSelectedCamera(camera);
    setShowWebView(true);
    setRotation(0);
  }, []);

  const openModal = useCallback((camera: any = null) => {
    if (camera) {
      setEditingCamera(camera);
      setFormData({ name: camera.name, url: camera.url, status: camera.status, icon: camera.icon || 'video' });
    } else {
      setEditingCamera(null);
      setFormData({ name: '', url: '', status: 'online', icon: 'video' });
    }
    setModalVisible(true);
  }, []);

  if (showWebView && selectedCamera) {
    return (
      <View className="flex-1 bg-black">
        <StatusBar hidden={true} />
        {/* Unobstructed WebView with rotation */}
        <View className="flex-1 relative">
          <View 
            style={{ 
              flex: 1, 
              overflow: 'hidden',
              transform: [{ rotate: `${rotation}deg` }]
            }}
          >
            <WebView
              source={{ uri: selectedCamera.url }}
              style={{ flex: 1, backgroundColor: 'black' }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsFullscreenVideo={true}
              mediaPlaybackRequiresUserAction={false}
              startInLoadingState={true}
              renderLoading={() => (
                <View className="absolute inset-0 items-center justify-center bg-black">
                  <ActivityIndicator size="large" color="#F472B6" />
                </View>
              )}
            />
          </View>

          {/* Premium Floating Back Button - More Accessible & Pink */}
          <View className="absolute top-14 left-7 z-50">
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => setShowWebView(false)} 
              className="w-16 h-16 rounded-[24px] bg-white border border-brand-pink/20 items-center justify-center shadow-2xl active:scale-95"
            >
              <MaterialCommunityIcons name="arrow-left" size={32} color="#F472B6" />
            </TouchableOpacity>
          </View>

          {/* Minimal Floating Status/Info (Just icon) */}
          <View className="absolute top-12 right-6 z-50">
             <View className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 items-center justify-center backdrop-blur-md">
                <View className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
             </View>
          </View>

          {/* Minimal Floating Controls (Dropdown Style) */}
          <View className="absolute bottom-10 right-6 items-end z-50">
            {showControlsDropdown && (
              <View className="mb-4 space-y-3">
                {/* Portrait Icon */}
                <TouchableOpacity 
                  activeOpacity={0.8}
                  onPress={() => {
                    setRotation(0);
                    setShowControlsDropdown(false);
                  }}
                  className={`w-14 h-14 rounded-2xl items-center justify-center backdrop-blur-xl border ${rotation === 0 ? 'bg-brand-pink border-brand-pink shadow-lg shadow-pink-500/40' : 'bg-black/40 border-white/10'}`}
                >
                  <MaterialCommunityIcons name="phone-rotate-portrait" size={24} color="white" />
                </TouchableOpacity>

                {/* Landscape Icon */}
                <TouchableOpacity 
                  activeOpacity={0.8}
                  onPress={() => {
                    setRotation(90);
                    setShowControlsDropdown(false);
                  }}
                  className={`w-14 h-14 rounded-2xl items-center justify-center backdrop-blur-xl border ${rotation === 90 ? 'bg-brand-pink border-brand-pink shadow-lg shadow-pink-500/40' : 'bg-black/40 border-white/10'}`}
                >
                  <MaterialCommunityIcons name="phone-rotate-landscape" size={24} color="white" />
                </TouchableOpacity>

                {/* Switch Camera Dropdown Trigger (Optional enhancement) */}
                <TouchableOpacity 
                   onPress={() => setShowCameraSwitch(!showCameraSwitch)}
                   className="w-14 h-14 rounded-2xl bg-black/40 border border-white/10 items-center justify-center backdrop-blur-md"
                >
                  <MaterialCommunityIcons name="video-switch-outline" size={24} color="white" />
                </TouchableOpacity>
              </View>
            )}

            {/* Main Toggle Button */}
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => setShowControlsDropdown(!showControlsDropdown)}
              className={`w-16 h-16 rounded-3xl items-center justify-center backdrop-blur-2xl border ${showControlsDropdown ? 'bg-black/60 border-white/20 rotate-45' : 'bg-brand-pink border-brand-pink shadow-2xl shadow-pink-500/40'}`}
            >
              <MaterialCommunityIcons name={showControlsDropdown ? "close" : "cog-outline"} size={28} color="white" />
            </TouchableOpacity>
          </View>

          {/* Quick Camera Switcher Dropdown (Inside Bottom) */}
          {showCameraSwitch && (
             <View className="absolute bottom-32 right-24 bg-black/80 rounded-3xl p-2 border border-white/10 backdrop-blur-2xl w-48 shadow-2xl z-[60]">
                {cameras.filter(c => c.status === 'online').map((cam) => (
                   <TouchableOpacity
                      key={cam.id}
                      onPress={() => {
                        setSelectedCamera(cam);
                        setRotation(0);
                        setShowCameraSwitch(false);
                        setShowControlsDropdown(false);
                      }}
                      className={`flex-row items-center p-3 rounded-2xl mb-1 ${selectedCamera.id === cam.id ? 'bg-brand-pink' : 'bg-white/5'}`}
                   >
                      <MaterialCommunityIcons name={(cam.icon || "video") as any} size={18} color="white" />
                      <Text className="text-white text-xs font-black ml-3 uppercase tracking-tighter" numberOfLines={1}>{cam.name}</Text>
                   </TouchableOpacity>
                ))}
             </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${colors.background}`}>
      <StatusBar hidden={false} barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      <View className="px-6 pt-4 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              className={`mb-4 ${colors.surface} w-12 h-12 rounded-2xl items-center justify-center border ${colors.border} shadow-sm`}
            >
              <MaterialCommunityIcons name="arrow-left" size={28} color={theme === 'dark' ? '#FFF' : '#000'} />
            </TouchableOpacity>
            <Text className={`text-5xl font-black ${colors.text} tracking-tighter`}>Live</Text>
            <Text className="text-2xl font-bold text-brand-pink tracking-tight">Monitoring 📹</Text>
          </View>
          <View className="bg-brand-yellow w-16 h-16 rounded-3xl items-center justify-center shadow-2xl border-4 border-white -rotate-6">
            <MaterialCommunityIcons name="video" size={32} color="#92400E" />
          </View>
        </View>
      </View>

      <View className="flex-1 px-6">
        <View className="flex-row items-center justify-between mb-6 mt-4">
            <Text className={`text-[10px] font-black uppercase tracking-[3px] ${colors.textTertiary}`}>Camera Infrastructure</Text>
            {isAdmin && (
                <TouchableOpacity 
                    onPress={() => openModal()}
                    className="bg-brand-pink p-3 rounded-2xl shadow-lg shadow-pink-200"
                >
                    <MaterialCommunityIcons name="plus" size={24} color="white" />
                </TouchableOpacity>
            )}
        </View>

        {isLoading ? (
            <ActivityIndicator color="#F472B6" size="large" style={{ marginTop: 40 }} />
        ) : (
            <FlatList
                data={cameras}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <CameraCard 
                        camera={item} 
                        colors={colors} 
                        theme={theme} 
                        isAdmin={isAdmin}
                        onSelect={handleCameraSelect}
                        onEdit={openModal}
                        onDelete={handleDeleteCamera}
                    />
                )}
                ListEmptyComponent={
                    <View className="items-center justify-center py-20">
                        <MaterialCommunityIcons name="video-off-outline" size={60} color={colors.textTertiary} />
                        <Text className={`mt-4 ${colors.textTertiary} font-bold text-lg`}>No cameras configured</Text>
                    </View>
                }
            />
        )}
      </View>

      {/* CRUD MOdal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
            <View className={`${colors.surface} rounded-t-[40px] p-8 pb-12 border-t ${colors.border}`}>
                <View className="flex-row justify-between items-center mb-6">
                    <Text className={`text-2xl font-black ${colors.text}`}>{editingCamera ? 'Edit Feed' : 'Add New Feed'}</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)} className={`w-10 h-10 rounded-xl items-center justify-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                        <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <View className="mb-6">
                    <Text className={`text-[10px] font-black mb-2 uppercase tracking-widest ${colors.textTertiary}`}>Room Name</Text>
                    <TextInput 
                        className={`p-4 rounded-2xl border ${colors.border} ${colors.text} font-bold`}
                        placeholder="e.g. Main Hall"
                        placeholderTextColor="#9CA3AF"
                        value={formData.name}
                        onChangeText={(text) => setFormData({...formData, name: text})}
                    />
                </View>

                <View className="mb-6">
                    <Text className={`text-[10px] font-black mb-2 uppercase tracking-widest ${colors.textTertiary}`}>Streaming URL</Text>
                    <TextInput 
                        className={`p-4 rounded-2xl border ${colors.border} ${colors.text} font-bold`}
                        placeholder="https://ip-camera-url/stream"
                        placeholderTextColor="#9CA3AF"
                        value={formData.url}
                        onChangeText={(text) => setFormData({...formData, url: text})}
                    />
                </View>

                <View className="mb-8">
                    <Text className={`text-[10px] font-black mb-3 uppercase tracking-widest ${colors.textTertiary}`}>Camera Visual Icon</Text>
                    <TouchableOpacity 
                        activeOpacity={0.8}
                        onPress={() => setShowIconDropdown(!showIconDropdown)}
                        className={`p-4 rounded-2xl border ${colors.border} flex-row items-center justify-between ${theme === 'dark' ? 'bg-gray-800/20' : 'bg-gray-50'}`}
                    >
                        <View className="flex-row items-center">
                            <View className="bg-brand-pink w-10 h-10 rounded-xl items-center justify-center mr-4">
                                <MaterialCommunityIcons name={formData.icon as any} size={22} color="white" />
                            </View>
                            <Text className={`${colors.text} font-black uppercase text-xs tracking-widest`}>
                                {formData.icon.replace(/-/g, ' ')}
                            </Text>
                        </View>
                        <MaterialCommunityIcons 
                            name={showIconDropdown ? "chevron-up" : "chevron-down"} 
                            size={24} 
                            color={colors.textTertiary} 
                        />
                    </TouchableOpacity>

                    {showIconDropdown && (
                        <View className={`mt-3 p-4 rounded-3xl border ${colors.border} ${theme === 'dark' ? 'bg-gray-900/80' : 'bg-white shadow-sm'}`}>
                            <View className="flex-row flex-wrap justify-between">
                                {CAMERA_ICONS.map((icon) => (
                                    <TouchableOpacity
                                        key={icon}
                                        onPress={() => {
                                            setFormData(prev => ({...prev, icon}));
                                            setShowIconDropdown(false);
                                        }}
                                        activeOpacity={0.7}
                                        className={`w-[22%] aspect-square rounded-2xl mb-4 items-center justify-center border-2 ${formData.icon === icon ? 'bg-brand-pink border-brand-pink shadow-lg shadow-pink-200' : `${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-transparent'}`}`}
                                    >
                                        <MaterialCommunityIcons 
                                            name={icon as any} 
                                            size={20} 
                                            color={formData.icon === icon ? 'white' : colors.textTertiary} 
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <Text className={`text-center text-[9px] font-black uppercase tracking-[2px] mt-2 ${colors.textTertiary}`}>
                                Select a visual identifier
                            </Text>
                        </View>
                    )}
                </View>

                <View className="mb-10">
                    <Text className={`text-[10px] font-black mb-4 uppercase tracking-widest ${colors.textTertiary}`}>Feed Status</Text>
                    <View className="flex-row bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
                        {['online', 'offline'].map((s) => (
                            <TouchableOpacity
                                key={s}
                                onPress={() => setFormData({...formData, status: s as any})}
                                className={`flex-1 py-3 rounded-xl items-center ${formData.status === s ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                            >
                                <Text className={`font-black uppercase text-[10px] tracking-widest ${formData.status === s ? 'text-brand-pink' : colors.textTertiary}`}>{s}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity 
                    onPress={handleSaveCamera}
                    disabled={isActionLoading}
                    className="bg-brand-pink py-5 rounded-3xl items-center shadow-lg shadow-pink-200"
                >
                    {isActionLoading ? <ActivityIndicator color="white" /> : <Text className="text-white font-black tracking-widest uppercase">Save Configuration</Text>}
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

      {isActionLoading && (
          <View className="absolute inset-0 bg-black/20 items-center justify-center z-[100]">
              <ActivityIndicator size="large" color="#F472B6" />
          </View>
      )}
    </SafeAreaView>
  );
}
