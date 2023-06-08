import React from "react";
import { useQuery } from "@apollo/client";
import { GET_BATTLES } from "../constants";

const BattleHistory = () => {
  const { loading, error, data } = useQuery(GET_BATTLES);
  console.log(data);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error :(</p>;

  return (
    <div>
      <h1>Completed Battles</h1>
      {data.battles
        .filter((battle) => battle.status === "completed")
        .map((battle) => (
          <div key={battle.id}>
            <h2>Battle ID: {battle.id}</h2>
            <p>Total Damage Dealt: {battle.totalDamageDealt}</p>
            <p>Total Damage Taken: {battle.totalDamageTaken}</p>
            <p>
              Players: {battle.players.map((player) => player.id).join(", ")}
            </p>
          </div>
        ))}
    </div>
  );
};

export default BattleHistory;
