import { createContext, useContext, useState } from "react";

type WorkoutContextType = {
  refreshWorkMode: () => void;
  triggerRefresh: () => void;
};

const WorkoutContext = createContext<WorkoutContextType>({
  refreshWorkMode: () => {},
  triggerRefresh: () => {},
});

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <WorkoutContext.Provider
      value={{
        refreshWorkMode: () => setRefreshKey((prev) => prev + 1),
        triggerRefresh,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export const useWorkout = () => useContext(WorkoutContext);
