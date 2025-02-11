import { View, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { Button, Text, Card } from "react-native-paper";
import { useRouter } from "expo-router";

export default function Workouts() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Card style={styles.card}>
          <Card.Title title="Create New Workout" />
          <Card.Content>
            <Button
              mode="contained"
              onPress={() => router.push("/(app)/workout/create")}
              icon="plus"
            >
              Create Workout
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
  },
  card: {
    margin: 15,
    marginTop: 10,
  },
});
