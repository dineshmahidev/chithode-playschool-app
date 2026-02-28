import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import api, { setAuthToken } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

export type UserRole = 'admin' | 'student' | 'teacher';

export interface User {
  id: string;
  email?: string;
  name: string;
  username: string;
  role: UserRole;
  avatar?: string;
  status: 'active' | 'inactive';
  studentId?: string;
  teacherId?: string;
  fatherName?: string;
  motherName?: string;
  fatherPhone?: string;
  motherPhone?: string;
  parentName?: string; 
  guardianPhone?: string;
  bloodGroup?: string;
  address?: string;
  category?: string;
  phone?: string;
  gender?: string;
  date_of_birth?: string;
  studentPhoto?: string;
  fatherPhoto?: string;
  motherPhoto?: string;
  guardianPhoto?: string;
  fees?: string;
  admissionDate?: string;
}

export interface FeeRecord {
    id: string;
    student_id: string;
    student_name: string;
    type: string;
    amount: number;
    status: 'paid' | 'unpaid';
    date: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  image?: string;
  date: string;
  target: 'all' | 'student' | 'teacher';
  author: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
  date: string;
  author: string;
  studentIds: string[];
}

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  date: string;
}

interface AuthContextType {
  user: User | null;
  users: User[];
  announcements: Announcement[];
  activities: Activity[];
  transactions: Transaction[];
  fees: FeeRecord[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  testLogin: (role: UserRole) => void;
  logout: () => void;
  addUser: (newUser: any) => Promise<void>;
  updateUser: (userId: string, updatedData: Partial<User>) => void;
  updateProfile: (updatedData: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  toggleUserStatus: (userId: string) => void;
  addAnnouncement: (announcement: Announcement) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  addActivity: (activity: Activity) => Promise<void>;
  deleteActivity: (id: string) => Promise<boolean>;
  addTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateAvatar: () => Promise<void>;
  refreshFees: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) return;
      
      const [usersRes, announcementsRes, activitiesRes, transactionsRes, feesRes] = await Promise.all([
        api.get('/users'),
        api.get('/announcements'),
        api.get('/activities'),
        api.get('/transactions'),
        api.get('/fees').catch(() => ({ data: [] })) // Fallback if endpoint not ready
      ]);

      setUsers(usersRes.data.map((u: any) => mapUser(u)));

      setAnnouncements(announcementsRes.data.map((a: any) => ({
        id: a.id.toString(),
        title: a.title,
        content: a.content,
        image: a.image_url || undefined,
        date: a.date,
        target: a.target || 'all',
        author: a.author || '',
      })));

      setActivities(activitiesRes.data.map((a: any) => ({
        id: a.id.toString(),
        title: a.title,
        description: a.description,
        mediaType: a.media_type,
        mediaUrl: a.media_url,
        thumbnailUrl: a.thumbnail_url,
        date: a.date,
        author: a.author,
        studentIds: a.students ? a.students.map((s: any) => s.id.toString()) : []
      })));

      setTransactions(transactionsRes.data.map((t: any) => ({
        id:       t.id.toString(),
        name:     t.name,
        amount:   parseFloat(t.amount) || 0,
        category: t.category,
        type:     t.type,
        date:     t.date,
      })));

      setFees(feesRes.data.map((f: any) => ({
          id: f.id.toString(),
          student_id: f.student_id,
          student_name: f.student_name,
          type: f.type,
          amount: parseFloat(f.amount) || 0,
          status: f.status,
          date: f.date
      })));

    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  }, []);

  const refreshFees = useCallback(async () => {
      try {
          const res = await api.get('/fees');
          setFees(res.data.map((f: any) => ({
            id: f.id.toString(),
            student_id: f.student_id,
            student_name: f.student_name,
            type: f.type,
            amount: parseFloat(f.amount) || 0,
            status: f.status,
            date: f.date
        })));
      } catch (e) {}
  }, []);

  const mapUser = (u: any): User => ({
    id:            u.id.toString(),
    name:          u.name,
    username:      u.username,
    email:         u.email,
    role:          u.role,
    avatar:        u.avatar,
    status:        u.status,
    studentId:     u.student_id,
    teacherId:     u.teacher_id,
    fatherName:    u.father_name,
    motherName:    u.mother_name,
    fatherPhone:   u.father_phone,
    motherPhone:   u.mother_phone,
    parentName:    u.parent_name,
    guardianPhone: u.guardian_phone,
    bloodGroup:    u.blood_group,
    address:       u.address,
    category:      u.category,
    phone:         u.phone,
    gender:        u.gender,
    date_of_birth: u.date_of_birth,
    studentPhoto:  u.student_photo,
    fatherPhoto:   u.father_photo,
    motherPhoto:   u.mother_photo,
    guardianPhoto: u.guardian_photo,
    fees:          u.fees,
    admissionDate: u.admission_date,
  });

  const mapToBackend = (data: any) => {
    const mapped: any = { ...data };
    
    // Mapping camelCase to snake_case for Laravel backend
    if (data.studentId !== undefined) mapped.student_id = data.studentId;
    if (data.teacherId !== undefined) mapped.teacher_id = data.teacherId;
    if (data.fatherName !== undefined) mapped.father_name = data.fatherName;
    if (data.fatherPhone !== undefined) mapped.father_phone = data.fatherPhone;
    if (data.motherName !== undefined) mapped.mother_name = data.motherName;
    if (data.motherPhone !== undefined) mapped.mother_phone = data.motherPhone;
    if (data.parentName !== undefined) mapped.parent_name = data.parentName;
    if (data.guardianPhone !== undefined) mapped.guardian_phone = data.guardianPhone;
    if (data.bloodGroup !== undefined) mapped.blood_group = data.bloodGroup;
    if (data.studentPhoto !== undefined) {
      mapped.student_photo = data.studentPhoto;
      mapped.avatar = data.studentPhoto;
    }
    if (data.fatherPhoto !== undefined) mapped.father_photo = data.fatherPhoto;
    if (data.motherPhoto !== undefined) mapped.mother_photo = data.motherPhoto;
    if (data.guardianPhoto !== undefined) mapped.guardian_photo = data.guardianPhoto;
    if (data.admissionDate !== undefined) mapped.admission_date = data.admissionDate;

    // Remove camelCase keys to avoid confusion or validation issues
    const camelKeys = [
      'studentId', 'teacherId', 'fatherName', 'fatherPhone', 
      'motherName', 'motherPhone', 'parentName', 'guardianPhone', 
      'bloodGroup', 'studentPhoto', 'fatherPhoto', 'motherPhoto', 
      'guardianPhoto', 'admissionDate'
    ];
    camelKeys.forEach(key => delete mapped[key]);

    return mapped;
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        const userDataString = await AsyncStorage.getItem('user_data');
        if (token && userDataString) {
          setAuthToken(token);
          const userData = JSON.parse(userDataString);
          setUser(userData); // Already mapped when stored
          await fetchData();
        }
      } catch (e) {
        console.error('Auth check failed:', e);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [fetchData]);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post('/login', { username, password });
      const { access_token, user: rawUser } = response.data;
      const userData = mapUser(rawUser);
      
      await AsyncStorage.setItem('auth_token', access_token);
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      
      setAuthToken(access_token);
      setUser(userData);
      
      await fetchData();
      return true;
    } catch (error) {
      console.error('Login Error:', error);
      return false;
    }
  }, [fetchData]);

  const testLogin = useCallback(async (role: UserRole) => {
    const emailMap = {
      admin: 'admin@school.com',
      teacher: 'sarah@teacher.com',
      student: 'arjun@student.com'
    };
    await login(emailMap[role], 'password');
  }, [login]);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
      setAuthToken(null);
      setUser(null);
    } catch (e) {
      console.error('Failed to logout:', e);
    }
  }, []);

  const addUser = useCallback(async (newUser: User & { password?: string }) => {
    try {
      const backendData = mapToBackend(newUser);
      await api.post('/users', { 
        ...backendData, 
        password: newUser.password || 'password' 
      }); 
      await fetchData(); 
    } catch (error) {
      Alert.alert('Error', 'Failed to add user');
    }
  }, [fetchData]);

  const updateUser = useCallback(async (userId: string, updatedData: Partial<User> & { password?: string }) => {
    try {
      const backendData = mapToBackend(updatedData);
      await api.put(`/users/${userId}`, backendData);
      await fetchData();
      return true;
    } catch (error) {
      Alert.alert('Error', 'Failed to update user');
      return false;
    }
  }, [fetchData]);

  const updateProfile = useCallback(async (updatedData: Partial<User>) => {
    if (!user) return false;
    try {
      const backendData = mapToBackend(updatedData);
      const response = await api.put(`/users/${user.id}`, backendData);
      const mappedUser = mapUser(response.data);
      setUser(mappedUser);
      await AsyncStorage.setItem('user_data', JSON.stringify(mappedUser));
      await fetchData();
      return true;
    } catch (error: any) {
      console.error('Update Profile Error:', error.response?.data || error.message);
      Alert.alert('Update Failed', 'An error occurred.');
      return false;
    }
  }, [user, fetchData]);

  const updateAvatar = useCallback(async () => {
    if (!user) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.2,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        const success = await updateProfile({ avatar: base64Image });
        if (success) {
          Alert.alert('Success ✨', 'Profile picture updated.');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Unexpected error occurred.');
    }
  }, [user, updateProfile]);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      await api.delete(`/users/${userId}`);
      await fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete user');
    }
  }, [fetchData]);

  const toggleUserStatus = useCallback(async (userId: string) => {
    try {
      const u = users.find(u => u.id === userId);
      if (!u) return;
      await api.put(`/users/${userId}`, {
        status: u.status === 'active' ? 'inactive' : 'active'
      });
      await fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  }, [users, fetchData]);

  const addAnnouncement = useCallback(async (announcement: Announcement) => {
    try {
      await api.post('/announcements', {
        title:     announcement.title,
        content:   announcement.content,
        image_url: announcement.image || null,
        date:      announcement.date,
        target:    announcement.target,
        author:    announcement.author,
      });
      await fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to post announcement');
    }
  }, [fetchData]);

  const deleteAnnouncement = useCallback(async (id: string) => {
    try {
      await api.delete(`/announcements/${id}`);
      await fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete announcement');
    }
  }, [fetchData]);

  const addActivity = useCallback(async (activity: Activity) => {
    try {
      await api.post('/activities', {
        title: activity.title,
        description: activity.description,
        media_type: activity.mediaType,
        media_url: activity.mediaUrl,
        thumbnail_url: activity.thumbnailUrl,
        date: activity.date,
        author: activity.author,
        student_ids: activity.studentIds
      });
      await fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to post activity');
    }
  }, [fetchData]);

  const deleteActivity = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/activities/${id}`);
      await fetchData();
      return true;
    } catch (error) {
      Alert.alert('Error', 'Failed to delete activity');
      return false;
    }
  }, [fetchData]);

  const addTransaction = useCallback(async (transaction: Transaction) => {
    try {
      await api.post('/transactions', transaction);
      await fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to record transaction');
    }
  }, [fetchData]);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      await api.delete(`/transactions/${id}`);
      await fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete transaction');
    }
  }, [fetchData]);

  const value = useMemo(() => ({
    user,
    users,
    announcements,
    isAuthenticated: !!user,
    login,
    testLogin,
    logout,
    addUser,
    updateProfile,
    updateUser,
    deleteUser,
    toggleUserStatus,
    addAnnouncement,
    deleteAnnouncement,
    activities,
    addActivity,
    deleteActivity,
    transactions,
    addTransaction,
    deleteTransaction,
    updateAvatar,
    fees,
    refreshFees,
    isLoading
  }), [
    user, users, announcements, activities, transactions, isLoading, fees,
    login, testLogin, logout, addUser, updateProfile, updateUser, 
    deleteUser, toggleUserStatus, addAnnouncement, deleteAnnouncement, 
    addActivity, deleteActivity, addTransaction, deleteTransaction, updateAvatar, refreshFees
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
