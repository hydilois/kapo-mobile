// Mode « économie de données » : réduit la taille/qualité des images chargées.
// Persisté dans AsyncStorage. Pensé pour les connexions à faible débit.
import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "kapo:dataSaver";
const DataSaverContext = createContext({ dataSaver: false, setDataSaver: () => {} });

export function DataSaverProvider({ children }) {
  const [dataSaver, setDataSaverState] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => { if (v === "1") setDataSaverState(true); }).catch(() => {});
  }, []);

  function setDataSaver(on) {
    setDataSaverState(on);
    AsyncStorage.setItem(KEY, on ? "1" : "0").catch(() => {});
  }

  return (
    <DataSaverContext.Provider value={{ dataSaver, setDataSaver }}>
      {children}
    </DataSaverContext.Provider>
  );
}

export const useDataSaver = () => useContext(DataSaverContext);
