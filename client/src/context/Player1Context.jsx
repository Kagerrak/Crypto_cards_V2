import { useRef, useContext, createContext } from "react";

export const Player1Context = createContext();

export const PlayerContextProvider = ({ children }) => {
  const player1Ref = useRef(null);

  return (
    <Player1Context.Provider
      value={{
        player1Ref,
      }}
    >
      {children}
    </Player1Context.Provider>
  );
};

export const usePlayerContext = () => useContext(Player1Context);
