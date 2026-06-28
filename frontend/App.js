import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Mic, HelpCircle, BookOpen, AlertCircle } from 'lucide-react-native';

export default function App() {
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState("Idle - Ready to Recite");
  const [aiFeedback, setAiFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  // Simulates contacting your running Python backend evaluation endpoint
  const handleRecitationCheck = async () => {
    setLoading(true);
    setStatus("AI is analyzing your Arabic pronunciation...");
    
    setTimeout(() => {
      setAiFeedback({
        status: "Correction Needed",
        details: "You mispronounced the vowel formatting in Surah Al-Fatiha Ayah 1. Ensure you pull the lengthening clear."
      });
      setStatus("Evaluation Complete");
      setLoading(false);
    }, 2000);
  };

  // Simulates triggering the 5-minute memory fallback tool you built on your server
  const handleStuckTrigger = async () => {
    setStatus("Fetching verse memory anchor snippet...");
    try {
      const response = await fetch("http://localhost:8000/api/v1/stuck-hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surah_ayah: "1:1", silence_duration_seconds: 300 })
      });
      const data = await response.json();
      setAiFeedback({ status: "Memory Assist Unlocked", details: data.message });
      setStatus("Hint Provided");
    } catch (err) {
      setAiFeedback({ status: "Offline Link Demo", details: "The Ayah you are trying to remember begins with: 'بِسْمِ اللَّهِ'" });
      setStatus("Hint Loaded via Local Cache");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <BookOpen size={36} color="#059669" />
        <Text style={styles.title}>Hifz AI Assistant</Text>
        <Text style={styles.subtitle}>Complete Quran Memorization Pipeline</Text>
      </View>

      {/* Target Surah Focus */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>Active Practice target:</Text>
        <Text style={styles.quranText}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
        <Text style={styles.metaText}>Surah Al-Fatiha [1:1]</Text>
      </View>

      {/* Primary Interaction Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[styles.btn, recording ? styles.btnActive : styles.btnMic]} 
          onPress={() => { setRecording(!recording); if(!recording) handleRecitationCheck(); }}
        >
          <Mic size={24} color="#FFF" />
          <Text style={styles.btnText}>{recording ? "Listening..." : "Start Reciting"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.btnHelp]} onPress={handleStuckTrigger}>
          <HelpCircle size={24} color="#FFF" />
          <Text style={styles.btnText}>I'm Stuck</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.statusLabel}>System Status: {status}</Text>

      {/* Evaluation Log Panel */}
      {loading && <ActivityIndicator size="large" color="#059669" style={{ marginTop: 20 }} />}
      
      {aiFeedback && (
        <View style={styles.feedbackCard}>
          <View style={styles.feedbackHeaderRow}>
            <AlertCircle size={20} color="#DC2626" />
            <Text style={styles.feedbackTitle}>{aiFeedback.status}</Text>
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
  feedbackCard: { backgroundColor: '#FFF', padding: 18, borderRadius: 10, borderWidth: 1, borderColor: '#FCA5A5', marginTop: 20, marginBottom: 40 },
  feedbackHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  feedbackTitle: { fontWeight: 'bold', fontSize: 15, color: '#111827', marginLeft: 8 },
  feedbackBody: { fontSize: 14, color: '#4B5563', lineHeight: 22, paddingLeft: 28 }
});
