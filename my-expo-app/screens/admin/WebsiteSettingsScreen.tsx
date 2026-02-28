import React, { useState, useCallback, memo } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert, Switch, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── CONSTANTS ───
const MAIN_TABS = [
  { id: 'builder', label: 'Builder', icon: 'auto-fix' },
  { id: 'gallery', label: 'Gallley', icon: 'image-multiple' },
  { id: 'inquiries', label: 'Inqurys', icon: 'message-text' },
  { id: 'settings', label: 'Setings', icon: 'cog' }
] as const;

const SECTIONS = ['home', 'about', 'programs', 'activities', 'admissions', 'contact'] as const;

// ─── MEMOIZED SUB-COMPONENTS ───

const SectionPill = memo(({ section, isActive, onPress, colors, theme }: any) => (
  <Pressable 
    onPress={() => onPress(section)}
    style={[
      styles.pill,
      { 
        backgroundColor: isActive ? '#F472B6' : (theme === 'dark' ? '#1e1e1c' : '#FFF'),
        borderColor: isActive ? '#F472B6' : (theme === 'dark' ? '#3a3a38' : '#e5e7eb'),
      }
    ]}
  >
    <Text style={[styles.pillText, { color: isActive ? '#FFF' : colors.textTertiary }]}>
      {section}
    </Text>
  </Pressable>
));

const MainTabButton = memo(({ tab, isActive, onPress, colors }: any) => (
  <Pressable 
    onPress={() => onPress(tab.id)}
    style={[styles.mainTab, { backgroundColor: isActive ? '#F472B6' : 'transparent' }]}
  >
    <Text style={[styles.mainTabText, { color: isActive ? '#FFF' : colors.textTertiary }]}>
      {tab.label}
    </Text>
  </Pressable>
));

// ─── PAGE BUILDER TAB ───
const BuilderTabContent = memo(({ colors, theme, onSave, isLoading }: any) => {
  const [activeSection, setActiveSection] = useState<typeof SECTIONS[number]>('home');
  const [homeHeading, setHomeHeading] = useState('A Magical Place to Learn! 🌈');
  const [homeDesc, setHomeDesc] = useState('Nurturing environment for every child to grow and play.');

  const inputStyle = {
    backgroundColor: theme === 'dark' ? '#1e1e1c' : '#f9fafb',
    borderColor: colors.border,
    color: colors.text,
    ...styles.input
  };

  const handleSectionSwitch = useCallback((s: typeof SECTIONS[number]) => {
    setActiveSection(s);
  }, []);

  return (
    <View style={styles.flex}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.label, { color: colors.textTertiary }]}>PAGE BUILDER 🛠️</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillContainer}>
          {SECTIONS.map((sec) => (
            <SectionPill 
              key={sec} 
              section={sec} 
              isActive={activeSection === sec} 
              onPress={handleSectionSwitch} 
              colors={colors} 
              theme={theme} 
            />
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={{ paddingHorizontal: 24 }} keyboardShouldPersistTaps="handled">
        <View key={activeSection} style={{ paddingTop: 8 }}> 
          {activeSection === 'home' ? (
            <View>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>MAIN HEADING</Text>
              <TextInput style={inputStyle} value={homeHeading} onChangeText={setHomeHeading} placeholder="Enter heading..." />
              
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SHORT DESCRIPTION</Text>
              <TextInput 
                style={[inputStyle, styles.textArea]} 
                value={homeDesc} 
                onChangeText={setHomeDesc} 
                placeholder="Enter description..." 
                multiline 
                textAlignVertical="top" 
              />
              
              <Pressable style={[styles.imageUpload, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="image-plus" size={32} color="#F472B6" />
                <Text style={{ color: colors.text, fontWeight: '900', marginTop: 8 }}>CHANGE HERO IMAGE</Text>
              </Pressable>
            </View>
          ) : (
            <View style={[styles.placeholder, { backgroundColor: theme === 'dark' ? '#1e1e1c' : '#f3f4f6' }]}>
              <MaterialCommunityIcons name="pencil-lock" size={48} color="#9CA3AF" />
              <Text style={{ fontWeight: '900', color: '#9CA3AF', marginTop: 12 }}>{activeSection.toUpperCase()} SECTION</Text>
              <Text style={{ color: '#9CA3AF', fontSize: 10, marginTop: 4 }}>Locked for production check</Text>
            </View>
          )}

          <Pressable 
            onPress={onSave} 
            disabled={isLoading}
            style={({ pressed }) => [
              styles.saveButton, 
              { opacity: (isLoading || pressed) ? 0.7 : 1 }
            ]}
          >
            {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>PUBLISH {activeSection.toUpperCase()}</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
});

export default function WebsiteSettingsScreen({ navigation }: any) {
  const { colors, theme } = useTheme();
  const [activeTab, setActiveTab] = useState<typeof MAIN_TABS[number]['id']>('builder');
  const [isLoading, setIsLoading] = useState(false);

  // System States
  const [isSiteLive, setIsSiteLive] = useState(true);
  const [schoolEmail, setSchoolEmail] = useState('hello@chithodehappykids.com');
  const [schoolPhone, setSchoolPhone] = useState('+91 98765 43210');
  const [schoolAddress, setSchoolAddress] = useState('Chithode, Erode, Tamil Nadu');

  const handleTabChange = useCallback((id: typeof MAIN_TABS[number]['id']) => setActiveTab(id), []);
  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleSave = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Live Now ✨', 'Successfully published to your website!');
    }, 1200);
  }, []);

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.flex}>
          <Pressable onPress={handleGoBack} style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme === 'dark' ? '#FFF' : '#000'} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Website</Text>
          <Text style={styles.subtitle}>Manager & Builder 🌐</Text>
        </View>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="rocket-launch" size={28} color="white" />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBarContainer}>
        <View style={[styles.tabBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {MAIN_TABS.map((tab) => (
            <MainTabButton 
              key={tab.id} 
              tab={tab} 
              isActive={activeTab === tab.id} 
              onPress={handleTabChange} 
              colors={colors} 
            />
          ))}
        </View>
      </View>

      {/* Content */}
      <View style={styles.flex}>
        {activeTab === 'builder' && <BuilderTabContent colors={colors} theme={theme} onSave={handleSave} isLoading={isLoading} />}
        {activeTab === 'gallery' && (
          <ScrollView style={styles.flex} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16 }}>
            <Text style={{ color: colors.text, fontWeight: '900', marginBottom: 16, fontSize: 10, letterSpacing: 2 }}>MANAGE GALLERY</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {[1, 2, 3, 4].map(i => (
                <View key={i} style={{ width: '48%', aspectRatio: 1, borderRadius: 24, marginBottom: 16, backgroundColor: theme === 'dark' ? '#1e1e1c' : '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
                   <MaterialCommunityIcons name="image" size={32} color="#9CA3AF" />
                </View>
              ))}
            </View>
          </ScrollView>
        )}
        {activeTab === 'inquiries' && (
           <ScrollView style={styles.flex} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16 }}>
              <View style={{ backgroundColor: colors.surface, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: colors.border, marginBottom: 16 }}>
                <Text style={{ fontWeight: '900', color: colors.text }}>Initial Inquiry Flow</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>Check your inbox for full leads history</Text>
              </View>
           </ScrollView>
        )}
        {activeTab === 'settings' && (
           <ScrollView style={styles.flex} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16 }}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>WEBSITE LOGO</Text>
              <Pressable style={[styles.imageUpload, { height: 140, backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 24 }]}>
                <View style={{ width: 64, height: 64, borderRadius: 24, backgroundColor: theme === 'dark' ? '#121210' : '#f9fafb', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWeight: 1, borderColor: colors.border }}>
                  <MaterialCommunityIcons name="shield-star" size={32} color="#F472B6" />
                </View>
                <Text style={{ color: colors.text, fontWeight: '900', fontSize: 10, letterSpacing: 1 }}>CHANGE BRAND LOGO</Text>
              </Pressable>

              <View style={[styles.placeholder, { height: 'auto', padding: 24, marginBottom: 24, backgroundColor: colors.surface, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                 <View>
                    <Text style={{ color: colors.text, fontWeight: '900', fontSize: 15 }}>Maintenance Mode</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>Hide site during updates</Text>
                 </View>
                 <Switch value={!isSiteLive} onValueChange={(v) => setIsSiteLive(!v)} trackColor={{ false: '#e5e7eb', true: '#F472B6' }} thumbColor="#FFF" />
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>OFFICIAL EMAIL</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme === 'dark' ? '#1e1e1c' : '#f9fafb', color: colors.text, borderColor: colors.border }]} 
                value={schoolEmail} 
                onChangeText={setSchoolEmail} 
                placeholder="school@example.com"
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PRIMARY PHONE</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme === 'dark' ? '#1e1e1c' : '#f9fafb', color: colors.text, borderColor: colors.border }]} 
                value={schoolPhone} 
                onChangeText={setSchoolPhone}
                placeholder="+91 XXXXX XXXXX"
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SCHOOL ADDRESS</Text>
              <TextInput 
                style={[styles.input, styles.textArea, { backgroundColor: theme === 'dark' ? '#1e1e1c' : '#f9fafb', color: colors.text, borderColor: colors.border }]} 
                value={schoolAddress} 
                onChangeText={setSchoolAddress}
                placeholder="Full address..."
                multiline
                textAlignVertical="top"
              />

              <Pressable onPress={handleSave} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>SAVE WEBSITE CONFIG</Text>
              </Pressable>
           </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  subtitle: { fontSize: 18, fontWeight: '700', color: '#F472B6' },
  headerIcon: { width: 56, height: 56, backgroundColor: '#F472B6', borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowRadius: 10, shadowOpacity: 0.3, transform: [{ rotate: '5deg' }] },
  tabBarContainer: { paddingHorizontal: 24, marginBottom: 8 },
  tabBar: { flexDirection: 'row', padding: 6, borderRadius: 20, borderWidth: 1 },
  mainTab: { flex: 1, paddingVertical: 12, borderRadius: 16, alignItems: 'center' },
  mainTabText: { fontSize: 8, fontWeight: '900', textTransform: 'uppercase' },
  sectionHeader: { marginBottom: 16 },
  label: { fontSize: 10, fontWeight: '900', letterSpacing: 2, marginLeft: 32, marginBottom: 12 },
  pillContainer: { paddingHorizontal: 24 },
  pill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, borderWidth: 1, marginRight: 8 },
  pillText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  inputLabel: { fontSize: 10, fontWeight: '900', marginBottom: 8, marginLeft: 16 },
  input: { width: '100%', borderWidth: 1, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 14, fontWeight: '700', marginBottom: 16 },
  textArea: { height: 120, paddingTop: 16 },
  imageUpload: { height: 160, borderWidth: 2, borderStyle: 'dashed', borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  saveButton: { backgroundColor: '#F472B6', paddingVertical: 20, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 40, shadowRadius: 15, shadowOpacity: 0.4 },
  saveButtonText: { color: 'white', fontWeight: '900', fontSize: 16 },
  placeholder: { padding: 40, borderRadius: 32, borderWidth: 2, borderStyle: 'dashed', borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', height: 200 }
});
