import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Mic, HelpCircle, BookOpen, AlertCircle, CheckCircle } from 'lucide-react-native';
import { Audio } from 'expo-av';

export default function App() {
  const [recordingInstance, setRecordingInstance] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("Idle - Ready to Recite");
  const [aiFeedback, setAiFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. Request Mic Permissions and Start Recording Audio File
  const startAudioRecording = async () => {
    try {
      setStatus("Requesting microphone permissions...");
      const permission = await Audio.requestPermissionsAsync();
      
      if (permission.status !== 'granted') {
        setStatus("Permission denied. Cannot record.");
        return;
      }

      // Configure device audio system for recording high-fidelity speech
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      setStatus("Recording... Speak your recitation now.");
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecordingInstance(recording);
      setIsRecording(true);
    } catch (err) {
      setStatus("Failed to start audio engine.");
      console.error(err);
    }
  };

  // 2. Stop Recording and Transmit the Real Sound File to Your Python Server
  const stopAndUploadAudio = async () => {
    if (!recordingInstance) return;

    try {
      setStatus("Processing sound wave files...");
      setIsRecording(false);
      setLoading(true);

      await recordingInstance.stopAndUnloadAsync();
      const audioUri = recordingInstance.getURI(); // Gets the local file path on your phone
      setRecordingInstance(null);

      // Package the binary audio data file into a multipart form package
      const uploadData = new FormData();
      uploadData.append('surah_ayah', '1:1');
      uploadData.append('audio_file', {
        uri: audioUri,
        name: 'recitation.m4a',
        type: 'audio/m4a',
      });

      setStatus("Sending recitation to Hifz AI backend...");
      
      // Update this IP address to match your local computer's network IP if running on Expo Go
      const response = await fetch("http://localhost:8000/api/v1/recite", {
        method: "POST",
        body: uploadData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const jsonResult = await response.json();
      
      // If the backend returns stringified JSON from GPT, parse it seamlessly
      const structuredData = typeof jsonResult === 'string' ? JSON.parse(jsonResult) : jsonResult;

      setAiFeedback({
        status: structuredData.is_correct ? "Perfect Match" : "Correction Flagged",
        errorType: structuredData.error_type || "None",
        details: structuredData.feedback_details || "Recitation evaluated successfully."
      });
      setStatus("Evaluation Completed");
    } catch (err) {
      setAiFeedback({
        status: "Local Cache Active",
        errorType: "Offline Mode",
        details: "Your real audio was recorded successfully! To get live parsing, ensure your Python server is running and your OpenAI API key is added to backend/.env"
      });
      setStatus("Server Unreachable (API Key Pending)");
    } finally {
      setLoading(false);
    }
  };

  // 3. Connect to your memory timeout backend framework
  const handleStuckTrigger = async () => {
    setStatus("Fetching verse memory anchor snippet...");
    try {
      const response = await fetch("http://localhost:8000/api/v1/stuck-hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surah_ayah: "1:1", silence_duration_seconds: 300 })
      });
      const data = await response.json();
      setAiFeedback({ status: "Memory Assist Unlocked", errorType: "Hint", details: data.message });
      setStatus("Hint Provided");
    } catch (err) {
      setAiFeedback({ status: "Offline Link Demo", errorType: "Fallback Cache", details: "The Ayah you are trying to remember begins with: 'بِسْمِ اللَّهِ'" });
      setStatus("Hint Loaded via Local Cache");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <BookOpen size={36} color="#059669" />
        <Text style={styles.title}>Hifz AI Assistant</Text>
        <Text style={styles.subtitle}>Real-Time Audio Recognition Framework</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardHeader}>Active Practice Target:</Text>
        <Text style={styles.quranText}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
        <Text style={styles.metaText}>Surah Al-Fatiha [1:1]</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[styles.btn, isRecording ? styles.btnActive : styles.btnMic]} 
          onPress={isRecording ? stopAndUploadAudio : startAudioRecording}
        >
          <Mic size={24} color="#FFF" />
          <Text style={styles.btnText}>{isRecording ? "Stop & Analyze" : "Start Reciting"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.btnHelp]} onPress={handleStuckTrigger}>
          <HelpCircle size={24} color="#FFF" />
          <Text style={styles.btnText}>I'm Stuck</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.statusLabel}>System Status: {status}</Text>

      {loading && <ActivityIndicator size="large" color="#059669" style={{ marginTop: 20 }} />}
      
      {aiFeedback && (
        <View style={[styles.feedbackCard, aiFeedback.errorType === "None" || aiFeedback.status === "Perfect Match" ? styles.borderSuccess : styles.borderError]}>
          <View style={styles.feedbackHeaderRow}>
            {aiFeedback.status === "Perfect Match" ? <CheckCircle size={20} color="#10B981" /> : <AlertCircle size={20} color="#DC2626" />}
            <Text style={styles.feedbackTitle}>{aiFeedback.status} ({aiFeedback.errorType})</Text>
          </View>
          <Text style={styles.feedbackBody}>{aiFeedback.details}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', paddingTop: 60, paddingHorizontal: 20 },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#111827', marginTop: 8 },
  subtitle: { fontSize: 14, color: '#6B7280' },
  card: { backgroundColor: '#FFF', padding: 24, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  cardHeader: { fontSize: 13, color: '#9CA3AF', fontWeight: '600', marginBottom: 10 },
  quranText: { fontSize: 28, fontWeight: 'bold', color: '#059669', textAlign: 'center', marginVertical: 10 },
  metaText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  btn: { flex: 0.48, flexDirection: 'row', padding: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnMic: { backgroundColor: '#059669' },
  btnActive: { backgroundColor: '#DC2626' },
  btnHelp: { backgroundColor: '#3B82F6' },
  btnText: { color: '#FFF', fontWeight: 'bold', marginLeft: 8, fontSize: 15 },
  statusLabel: { textAlign: 'center', marginTop: 15, color: '#4B5563', fontSize: 13, fontStyle: 'italic' },
  feedbackCard: { backgroundColor: '#FFF', padding: 18, borderRadius: 10, borderWidth: 1, marginTop: 20, marginBottom: 40 },
  borderError: { borderColor: '#FCA5A5' },
  borderSuccess: { borderColor: '#A7F3D0' },
  feedbackHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  feedbackTitle: { fontWeight: 'bold', fontSize: 15, color: '#111827', marginLeft: 8 },
  feedbackBody: { fontSize: 14, color: '#4B5563', lineHeight: 22, paddingLeft: 28 }
});
