import { createContext, useMemo, useState } from "react";

export const UserContext = createContext({});

export function UserContextProvider({ children }) {

  const [user, setUser] = useState({});
  const value = useMemo(() => ({ user, setUser }), [user, setUser]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}