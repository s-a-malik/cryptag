import { createContext, useMemo, useState, useEffect } from "react";
import { getAddress } from "./metamask";

export const UserContext = createContext({});

export function UserContextProvider({ children }) {

  const [user, setUser] = useState({});
  const value = useMemo(() => ({ user, setUser }), [user, setUser]);

  useEffect(() => {
    const setAddress = async () => {
      setUser({ address: await getAddress() })
    }
    setAddress();
    console.log("User was fetched")
}, []);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}