import { View, StyleSheet } from "react-native";
import { Button, Text, TextInput, Switch } from "react-native-paper";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { supabase } from "../../../lib/supabase";

export default function WorkSchedule() {
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [workDays, setWorkDays] = useState({
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: false,
    sun: false,
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { session, setHasCompletedProfile } = useAuth();

  const handleSaveProfile = async () => {
    if (!session?.user) return;

    try {
      setLoading(true);

      const workSchedule = {
        start: startTime,
        end: endTime,
        days: Object.entries(workDays)
          .filter(([_, isWorking]) => isWorking)
          .map(([day]) => day),
      };

      const { error } = await supabase
        .from("users")
        .update({
          work_schedule: workSchedule,
        })
        .eq("id", session.user.id);

      if (error) throw error;

      setHasCompletedProfile(true);
      router.replace("/(app)/");
    } catch (error) {
      console.error("Error saving schedule:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: keyof typeof workDays) => {
    setWorkDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }));
  };

  return (
    <View style={styles.container}>
      <Text variant="titleLarge" style={styles.title}>
        Work Schedule
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        When do you usually work?
      </Text>

      <View style={styles.timeInputs}>
        <View style={styles.timeField}>
          <Text variant="bodyMedium">Start Time</Text>
          <TextInput
            value={startTime}
            onChangeText={setStartTime}
            style={styles.input}
            placeholder="09:00"
          />
        </View>
        <View style={styles.timeField}>
          <Text variant="bodyMedium">End Time</Text>
          <TextInput
            value={endTime}
            onChangeText={setEndTime}
            style={styles.input}
            placeholder="17:00"
          />
        </View>
      </View>

      <View style={styles.daysContainer}>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Working Days
        </Text>
        {Object.entries(workDays).map(([day, isEnabled]) => (
          <View key={day} style={styles.dayRow}>
            <Text variant="bodyMedium" style={styles.dayText}>
              {day.toUpperCase()}
            </Text>
            <Switch
              value={isEnabled}
              onValueChange={() => toggleDay(day as keyof typeof workDays)}
            />
          </View>
        ))}
      </View>

      <Button
        mode="contained"
        onPress={handleSaveProfile}
        loading={loading}
        style={styles.button}
      >
        Complete Setup
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 20,
    opacity: 0.7,
  },
  timeInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  timeField: {
    flex: 1,
    marginHorizontal: 10,
  },
  input: {
    marginTop: 5,
  },
  daysContainer: {
    marginBottom: 30,
  },
  dayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dayText: {
    textTransform: "capitalize",
  },
  button: {
    marginTop: 20,
  },
});
