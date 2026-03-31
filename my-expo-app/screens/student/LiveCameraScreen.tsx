import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, Modal, TextInput, ActivityIndicator, FlatList, StatusBar, Dimensions, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Video, ResizeMode, Audio } from 'expo-av';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const CAMERA_ICONS = ['youtube', 'twitch', 'video', 'eye', 'security'];

interface Camera {
  id: string;
  name: string;
  url: string;
  status: 'online' | 'offline';
  icon?: string;
}

const CameraCard = memo(({ camera, onSelect, onEdit, onDelete, isAdmin, colors, theme }: any) => {
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      className={`mb-6 rounded-[40px] overflow-hidden shadow-2xl ${camera.status === 'offline' ? 'opacity-40' : ''}`}
      style={{ elevation: 20 }}
      onPress={() => onSelect(camera)}
      disabled={camera.status === 'offline'}
    >
      <LinearGradient
        colors={theme === 'dark' ? ['#25251d', '#1c1c14'] : ['#FFFFFF', '#F9FAFB']}
        className="border border-white/5"
      >
        {/* Live Preview / Thumbnail Section */}
        <View className="h-48 w-full bg-black relative overflow-hidden">
          {camera.status === 'online' ? (
            <>
              {camera.url.includes('twitch.tv') ? (
                <View className="flex-1 items-center justify-center bg-[#9146FF]/5">
                  <MaterialCommunityIcons name="twitch" size={64} color="#9146FF" />
                  <Text className="text-[#9146FF] text-[10px] font-black uppercase tracking-[3px] mt-3">Ready to Watch</Text>
                  <Text className="text-[#9146FF]/60 text-[8px] font-bold uppercase tracking-[1px] mt-1">Direct twitch stream</Text>
                </View>
              ) : (camera.url.includes('youtube.com') || camera.url.includes('youtu.be')) ? (
                <View className="flex-1 items-center justify-center bg-[#FF0000]/5">
                  <MaterialCommunityIcons name="youtube" size={64} color="#FF0000" />
                  <Text className="text-[#FF0000] text-[10px] font-black uppercase tracking-[3px] mt-3">Watch Live</Text>
                  <Text className="text-[#FF0000]/60 text-[8px] font-bold uppercase tracking-[1px] mt-1">Direct youtube stream</Text>
                </View>
              ) : (
                <Video
                  key={camera.url}
                  source={{ 
                    uri: camera.url,
                    overrideFileExtension: 'm3u8' // Force HLS parsing
                  }}
                  rate={1.0}
                  volume={0}
                  isMuted={true}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={true}
                  isLooping={true}
                  style={{ flex: 1, backgroundColor: 'black' }}
                  onPlaybackStatusUpdate={(status: any) => {
                    if (status.isLoaded) setIsReady(true);
                    if (status.error) {
                      console.log('Video Load Error:', status.error);
                      setLoadError(status.error);
                    }
                  }}
                  onError={(error) => setLoadError(error)}
                />
              )}
              
              {!isReady && !loadError && (
                <View className="absolute inset-0 items-center justify-center bg-black/60">
                  <ActivityIndicator color="#F472B6" size="small" />
                </View>
              )}

              {loadError && (
                <View className="absolute inset-0 items-center justify-center bg-black/80 p-4">
                  <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#EF4444" />
                  <Text className="text-red-500 text-[10px] mt-2 text-center uppercase font-bold tracking-widest">
                    {loadError.toString().includes('403') ? 'Access Denied' : 'Stream Failed'}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View className="flex-1 items-center justify-center bg-gray-900">
               <MaterialCommunityIcons name="video-off-outline" size={48} color="#4B5563" />
            </View>
          )}
          
          {/* Overlay Label for Live Status */}
          <View className="absolute top-4 left-4 flex-row items-center bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <View className={`w-1.5 h-1.5 rounded-full mr-2 ${camera.status === 'online' ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
            <Text className="text-white text-[9px] font-black uppercase tracking-[1px]">
              {camera.status === 'online' ? 'Live Preview' : 'Offline'}
            </Text>
          </View>

          {/* Play Icon Overlay */}
          {camera.status === 'online' && !loadError && (
            <View className="absolute inset-0 items-center justify-center bg-black/10">
              <View className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm items-center justify-center border border-white/30">
                <MaterialCommunityIcons name="play" size={28} color="white" />
              </View>
            </View>
          )}
        </View>

        <View className="p-6 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className={`text-xl font-black ${colors.text} tracking-tighter`}>{camera.name}</Text>
            <Text className={`text-[10px] font-bold ${colors.textTertiary} uppercase tracking-[1px] mt-1`}>
              {camera.id ? `${camera.id.toString().substring(0, 8)}...` : 'ID Loading...'} • {camera.status === 'online' ? 'Ready to stream' : 'Device unavailable'}
            </Text>
          </View>
          
          {isAdmin ? (
            <View className="flex-row">
              <TouchableOpacity 
                 onPress={() => onEdit(camera)}
                 className={`w-10 h-10 rounded-xl items-center justify-center mr-2 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'} border border-brand-pink/10`}
              >
                <MaterialCommunityIcons name="pencil-outline" size={20} color="#F472B6" />
              </TouchableOpacity>
              <TouchableOpacity 
                 onPress={() => onDelete(camera.id)}
                 className="w-10 h-10 rounded-xl items-center justify-center bg-red-500/10 border border-red-500/10"
              >
                <MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <View className={`w-10 h-10 rounded-xl items-center justify-center ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100 shadow-sm'} border border-brand-pink/10`}>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#F472B6" />
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
});

export default function LiveCameraScreen({ navigation, route }: any) {
  const { colors, theme } = useTheme();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin'; 

  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isAccessible, setIsAccessible] = useState<boolean | null>(null);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCamera, setEditingCamera] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', url: '', status: 'online' as 'online' | 'offline', icon: 'video' });
  const [rotation, setRotation] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [isTwitch, setIsTwitch] = useState(false);
  const [isYoutube, setIsYoutube] = useState(false);
  const [isM3U8, setIsM3U8] = useState(false);
  const controlsTimer = React.useRef<NodeJS.Timeout | null>(null);

  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

  const getYoutubeEmbedUrl = (urlString: string) => {
    let videoId = '';
    try {
      if (urlString.includes('youtu.be/')) {
        videoId = urlString.split('youtu.be/')[1].split(/[?#]/)[0];
      } else if (urlString.includes('youtube.com/live/')) {
        videoId = urlString.split('youtube.com/live/')[1].split(/[?#]/)[0];
      } else if (urlString.includes('v=')) {
        videoId = urlString.split('v=')[1].split(/[&?#]/)[0];
      }
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&showinfo=0&rel=0&modestbranding=1`;
    } catch (e) {
      return urlString;
    }
  };

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
      } catch (e) {
        console.warn(e);
      }
    };
    setupAudio();
    resetTimer();
    return () => {
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
    };
  }, [resetTimer]);

  const resetTimer = useCallback(() => {
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    setControlsVisible(true);
    controlsTimer.current = setTimeout(() => {
      setControlsVisible(false);
      setShowMenu(false);
    }, 3000);
  }, []);

  const getTwitchEmbedUrl = (url: string) => {
    const match = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/i);
    const channel = match ? match[1] : url.split('/').pop();
    return `https://player.twitch.tv/?channel=${channel}&parent=localhost&autoplay=true&muted=false`;
  };

  const checkAccess = useCallback(async () => {
    if (user?.role !== 'student') {
      setIsAccessible(true);
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.get(`/attendance?student_id=${user.id}&user_role=${user.role}`);
      const records = res.data || [];
      const todayRecord = records.find((r: any) => r.date === today);

      if (!todayRecord || (todayRecord.status !== 'present' && todayRecord.status !== 'late')) {
        setIsAccessible(false);
        setAttendanceError("To ensure privacy, camera access is only available when your child is marked as 'Present' at school.");
        return;
      }

      if (todayRecord.out_time && todayRecord.out_time.trim() !== '') {
        setIsAccessible(false);
        setAttendanceError("Your child has clocked out and left the school. Access is restricted for privacy once the child leaves the premises.");
        return;
      }

      const now = new Date();
      const parseTime = (timeStr: string) => {
        if (!timeStr || timeStr.trim() === '') return null;
        const parts = timeStr.split(' ');
        if (parts.length < 2) return null;
        const [time, modifier] = parts;
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        const d = new Date(now);
        d.setHours(hours, minutes, 0, 0);
        return d;
      };

      const inTime = parseTime(todayRecord.in_time);
      if (inTime && now < inTime) {
        setIsAccessible(false);
        setAttendanceError("School has not started for your child yet. Please check back after clock-in.");
        return;
      }

      setIsAccessible(true);
    } catch (error) {
      console.error('Access check error:', error);
      setIsAccessible(true);
    }
  }, [user]);

  const fetchCameras = useCallback(async (showIndicator = true) => {
    try {
      if (showIndicator) setIsLoading(true);
      await checkAccess();
      const response = await api.get('/cameras');
      setCameras(response.data);
    } catch (error) {
      console.error('Error fetching cameras:', error);
      Alert.alert('Error', 'Failed to load cameras');
    } finally {
      if (showIndicator) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [checkAccess]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchCameras(false);
  }, [fetchCameras]);

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
     
     // Detect Twitch
     const isTwitchStream = camera.url.toLowerCase().includes('twitch.tv');
     setIsTwitch(isTwitchStream);
     
     // Detect Youtube
     const isYoutubeStream = camera.url.toLowerCase().includes('youtube.com') || camera.url.toLowerCase().includes('youtu.be');
     setIsYoutube(isYoutubeStream);

     // Detect M3U8
     const isM3U8Stream = camera.url.toLowerCase().includes('.m3u8') || camera.url.toLowerCase().includes('/hls/') || camera.url.toLowerCase().includes(':3000');
     setIsM3U8(isM3U8Stream);
     
     if (!isTwitchStream && !isYoutubeStream && !isM3U8Stream) {
       Alert.alert('Unsupported Source', 'Only Twitch, YouTube, and HLS (.m3u8) streams are currently supported.');
       return;
     }

     setShowWebView(true);
     setRotation(0);
     setIsMuted(true);
     setControlsVisible(true);
     resetTimer();
   }, [resetTimer]);

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
         <TouchableOpacity 
           activeOpacity={1} 
           onPress={resetTimer}
           className="flex-1 relative"
         >
          <View className="flex-1 justify-center items-center bg-black">
            <View 
               style={[
                 rotation === 0 
                  ? { width: '100%', aspectRatio: 16/9 } 
                  : { width: SCREEN_HEIGHT, height: SCREEN_WIDTH },
                 { backgroundColor: '#000', position: 'relative' },
                 { transform: [{ rotate: `${rotation}deg` }] }
               ]}
            >
              {controlsVisible && (
                <View 
                  style={{ 
                    position: 'absolute', 
                    top: 20, 
                    left: 20, 
                    zIndex: 1000,
                  }}
                  className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex-row items-center"
                >
                  <View className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2 animate-pulse" />
                  <Text className="text-white font-black text-[10px] uppercase tracking-[1px]">{selectedCamera.name}</Text>
                </View>
              )}

              {isTwitch ? (
                <WebView
                  source={{ 
                    uri: getTwitchEmbedUrl(selectedCamera.url),
                    headers: { 'Referer': 'https://localhost' }
                  }}
                  style={{ flex: 1, backgroundColor: 'black' }}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  allowsFullscreenVideo={true}
                  mediaPlaybackRequiresUserAction={false}
                />
              ) : isYoutube ? (
                <WebView
                  source={{ 
                    uri: getYoutubeEmbedUrl(selectedCamera.url)
                  }}
                  style={{ flex: 1, backgroundColor: 'black' }}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  allowsFullscreenVideo={true}
                  mediaPlaybackRequiresUserAction={false}
                />
              ) : isM3U8 ? (
                 <Video
                    key={selectedCamera.url}
                    source={{ 
                      uri: selectedCamera.url,
                      overrideFileExtension: 'm3u8'
                    }}
                    rate={1.0}
                    volume={isMuted ? 0.0 : 1.0}
                    isMuted={isMuted}
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay={true}
                    isLooping={true}
                    useNativeControls={true}
                    style={{ flex: 1 }}
                    onPlaybackStatusUpdate={(status: any) => {
                      if (!status.isLoaded && status.error) {
                        Alert.alert('Playback Error', status.error.toString());
                      }
                    }}
                    onError={(err) => Alert.alert('Video Engine Error', err.toString())}
                  />
              ) : (
                <View className="flex-1 items-center justify-center bg-black">
                   <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#EF4444" />
                   <Text className="text-white font-black mt-4">Invalid Stream Source</Text>
                </View>
              )}
            </View>
          </View>

           {controlsVisible && (
             <View 
               style={[
                 { position: 'absolute', zIndex: 2000 },
                 rotation === 0
                   ? { bottom: 48, left: 24, right: 24, flexDirection: 'row', justifyContent: 'space-between' }
                   : { left: 48, top: 24, bottom: 24, flexDirection: 'column', justifyContent: 'space-between' }
               ]}
               className="items-center"
             >
               <View /> 
               <View className={rotation === 0 ? "flex-row gap-4" : "flex-col gap-4"}>
                 <TouchableOpacity 
                   onPress={(e) => {
                      e.stopPropagation();
                      setShowMenu(!showMenu);
                   }}
                   style={{ transform: [{ rotate: `${rotation}deg` }] }}
                   className={`w-16 h-16 rounded-[24px] items-center justify-center border border-white/5 bg-white/10 ${showMenu ? 'bg-white/20' : ''}`}
                 >
                   <MaterialCommunityIcons name="dots-vertical" size={32} color="white" />
                 </TouchableOpacity>

                 <TouchableOpacity 
                   onPress={() => setRotation(rotation === 0 ? 90 : 0)}
                   style={{ transform: [{ rotate: `${rotation}deg` }] }}
                   className="w-16 h-16 rounded-[24px] bg-brand-pink items-center justify-center shadow-xl shadow-pink-500/30 border-2 border-white/20"
                 >
                   <MaterialCommunityIcons 
                     name={rotation === 0 ? "phone-rotate-landscape" : "phone-rotate-portrait"} 
                     size={32} 
                     color="white" 
                   />
                 </TouchableOpacity>
               </View>

               {showMenu && (
                 <View 
                   style={[
                     { position: 'absolute', zIndex: 3000 },
                     rotation === 0 
                      ? { bottom: 80, right: 0 } 
                      : { left: 80, top: '40%' }
                   ]}
                   className="bg-[#1C1C1E] p-4 rounded-3xl border border-white/10 min-w-[160px] shadow-2xl"
                 >
                   <TouchableOpacity 
                      onPress={() => {
                        setIsMuted(!isMuted);
                        setShowMenu(false);
                      }}
                      className="flex-row items-center py-4 border-b border-white/5"
                   >
                     <MaterialCommunityIcons name={isMuted ? "volume-off" : "volume-high"} size={24} color="white" />
                     <Text className="text-white font-bold ml-4">{isMuted ? 'Unmute' : 'Mute'}</Text>
                   </TouchableOpacity>

                    <TouchableOpacity 
                       onPress={() => setShowWebView(false)}
                       className="flex-row items-center py-4"
                    >
                      <MaterialCommunityIcons name="close-circle-outline" size={24} color="white" />
                      <Text className="text-white font-bold ml-4">Exit Fullscreen</Text>
                    </TouchableOpacity>
                 </View>
               )}
             </View>
           )}
         </TouchableOpacity>
       </View>
     );
   }

  const insets = useSafeAreaInsets();

  return (
    <View className={`flex-1 ${colors.background}`}>
      <View style={{ paddingTop: Math.max(insets.top, 20) }} className="px-6 pb-4">
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
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity 
                        onPress={async () => {
                            try {
                                setIsActionLoading(true);
                                await api.post('/cameras/refresh');
                                await fetchCameras();
                                Alert.alert('Success', 'Camera streams refreshed successfully');
                            } catch (error) {
                                console.error('Refresh failed:', error);
                                Alert.alert('Error', 'Failed to refresh camera streams');
                            } finally {
                                setIsActionLoading(false);
                            }
                        }}
                        className={`p-3 rounded-2xl border ${colors.border} ${theme === 'dark' ? 'bg-white/5' : 'bg-white shadow-sm'}`}
                    >
                        <MaterialCommunityIcons name="refresh" size={24} color="#F472B6" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        onPress={() => openModal()}
                        className="bg-brand-pink p-3 rounded-2xl shadow-lg shadow-pink-200"
                    >
                        <MaterialCommunityIcons name="plus" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            )}
        </View>

        {isLoading ? (
            <ActivityIndicator color="#F472B6" size="large" style={{ marginTop: 40 }} />
        ) : !isAccessible ? (
            <ScrollView 
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#F472B6']} />}
                contentContainerStyle={{ flex: 1, justifyContent: 'center' }}
            >
                <View className="items-center justify-center p-8">
                    <View className="w-full bg-white dark:bg-white/5 p-10 rounded-[50px] items-center border border-brand-pink/20 shadow-2xl">
                        <View className="bg-brand-pink/10 w-32 h-32 rounded-full items-center justify-center mb-8 border-4 border-white dark:border-white/5">
                            <MaterialCommunityIcons name="shield-lock-outline" size={64} color="#F472B6" />
                        </View>
                        <Text className={`text-4xl font-black ${colors.text} text-center tracking-tighter mb-4`}>Access Restricted</Text>
                        <Text className={`text-center font-bold leading-7 ${colors.textSecondary} mb-10`}>
                            {attendanceError || "To ensure the safety of all children, camera access is only permitted while your child is actively present inside the school premises."}
                        </Text>
                        
                        <View className="w-full bg-brand-yellow/10 p-6 rounded-3xl border border-brand-yellow/20 flex-row items-center mb-10">
                            <MaterialCommunityIcons name="information-outline" size={24} color="#D97706" />
                            <Text className="flex-1 ml-4 text-[11px] font-black text-brand-yellow-800 uppercase tracking-widest leading-4">
                                Access window: Between Clock-In and Clock-Out protocol execution.
                            </Text>
                        </View>

                        <TouchableOpacity 
                            onPress={() => fetchCameras()}
                            className="bg-brand-pink w-full h-18 rounded-3xl items-center justify-center shadow-lg shadow-pink-200"
                        >
                            <Text className="text-white font-black uppercase tracking-[3px] text-xs">Verify Status Again</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        ) : (
            <FlatList
                data={cameras}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#F472B6']} tintColor="#F472B6" />}
                ListFooterComponent={<View className="h-32" />}
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

      <Modal visible={modalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/70 justify-center px-8">
            <View className={`${colors.surface} rounded-[48px] border ${colors.border} overflow-hidden shadow-2xl shadow-black`}>
                <ScrollView 
                    contentContainerStyle={{ padding: 32 }}
                    showsVerticalScrollIndicator={false}
                >
                    <View className="flex-row justify-between items-center mb-8">
                        <View>
                            <Text className={`text-3xl font-black ${colors.text} tracking-tighter`}>{editingCamera ? 'Update' : 'Register'}</Text>
                            <Text className="text-xl font-bold text-brand-pink mt-[-4px]">Live Feed 🔭</Text>
                        </View>
                        <TouchableOpacity onPress={() => setModalVisible(false)} className={`w-12 h-12 rounded-2xl items-center justify-center ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'} border border-white/5`}>
                            <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View className="mb-6">
                        <Text className={`text-[10px] font-black mb-3 uppercase tracking-[3px] ${colors.textTertiary}`}>Room Name</Text>
                        <TextInput 
                            className={`p-5 rounded-[24px] border ${colors.border} ${colors.text} font-bold bg-gray-50/50 dark:bg-black/20`}
                            placeholder="e.g. Activity Room"
                            placeholderTextColor="#9CA3AF"
                            value={formData.name}
                            onChangeText={(text) => setFormData({...formData, name: text})}
                        />
                    </View>

                    <View className="mb-6">
                        <Text className={`text-[10px] font-black mb-3 uppercase tracking-[3px] ${colors.textTertiary}`}>Streaming URL</Text>
                        <TextInput 
                            className={`p-5 rounded-[24px] border ${colors.border} ${colors.text} font-bold bg-gray-50/50 dark:bg-black/20`}
                            placeholder="M3U8, Twitch or YouTube Live URL"
                            placeholderTextColor="#9CA3AF"
                            value={formData.url}
                            onChangeText={(text) => setFormData({...formData, url: text})}
                        />
                    </View>

                    <View className="mb-10">
                        <Text className={`text-[10px] font-black mb-5 uppercase tracking-[3px] ${colors.textTertiary}`}>Channel State</Text>
                        <View className="flex-row bg-gray-50/50 dark:bg-black/30 p-2 rounded-[28px] border border-gray-100 dark:border-white/10">
                            {['online', 'offline'].map((s) => (
                                <TouchableOpacity
                                    key={s}
                                    onPress={() => setFormData({...formData, status: s as any})}
                                    className={`flex-1 py-4 rounded-[20px] items-center ${formData.status === s ? 'bg-brand-pink' : ''}`}
                                >
                                    <Text className={`font-black uppercase text-[10px] tracking-[2px] ${formData.status === s ? 'text-white' : colors.textTertiary}`}>{s}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <TouchableOpacity 
                        onPress={handleSaveCamera}
                        disabled={isActionLoading}
                        className="h-20 rounded-[32px] items-center justify-center shadow-2xl shadow-pink-500/30 relative overflow-hidden"
                    >
                        <LinearGradient
                            colors={['#F472B6', '#DB2777']}
                            className="absolute inset-0"
                        />
                        {isActionLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <View className="flex-row items-center">
                                <MaterialCommunityIcons name="cloud-upload-outline" size={24} color="white" />
                                <Text className="text-white font-black tracking-[4px] uppercase ml-3 text-sm">Save Config</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </View>
      </Modal>

      {isActionLoading && (
          <View className="absolute inset-0 bg-black/20 items-center justify-center z-[100]">
              <ActivityIndicator size="large" color="#F472B6" />
          </View>
      )}
    </View>
  );
}
