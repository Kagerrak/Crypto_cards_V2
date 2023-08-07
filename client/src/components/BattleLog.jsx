import React, { useEffect, useState } from "react";
import { useContract, useContractEvents } from "@thirdweb-dev/react";
import { battleContractAddress } from "../contract";
import { useGlobalContext } from "../context";

const BattleLog = ({ battleId }) => {
  const ID = battleId;
  const [battleLog, setBattleLog] = useState([]);
  const { address } = useGlobalContext();

  const { contract: battleTWContract } = useContract(battleContractAddress);
  const {
    data: events,
    isLoading,
    error,
  } = useContractEvents(battleTWContract, null, {
    queryFilter: {
      filters: {
        battleId: ID,
      },
      fromBlock: 37205857,
      order: "asc",
    },
    subscribe: true,
  });
  const endOfLogRef = React.useRef(null);

  const formatEvent = (event) => {
    console.log(event.data);
    const moveMap = {
      0: "attacking",
      1: "defending",
      2: "using skill",
      3: "doing nothing",
    };

    const getPlayerNumber = (player) => {
      if (address && player.toLowerCase() === address.toLowerCase()) {
        return "You are";
      } else {
        return "Opponent is";
      }
    };

    let text = "";
    switch (event.eventName) {
      case "RoundEnded": {
        console.log(event.data);
        const { damagedPlayers, damageDealt, round } = event.data;
        const player1Damage = damageDealt[0].toNumber();
        const player2Damage = damageDealt[1].toNumber();
        text = `Round ${round} ended. ${getPlayerNumber(
          damagedPlayers[0]
        )} dealt ${player1Damage} damage. ${getPlayerNumber(
          damagedPlayers[1]
        )} dealt ${player2Damage} damage.`;
        break;
      }

      case "MoveSubmitted": {
        const { player, move } = event.data;
        const moveAction = moveMap[move] || "unknown action";
        text = `${getPlayerNumber(player)} ${moveAction}...`;
        break;
      }

      case "DiceRolled": {
        const { diceNumber } = event.data;
        const diceMultiplier = diceNumber / 1000;
        text = `Rolled the dice. Attack multiplier: ${diceMultiplier}`;
        break;
      }

      case "StatusEffectApplied": {
        const {
          round: roundSEA,
          character: characterSEA,
          statusEffectId,
          duration,
        } = event.data;
        text = `${getPlayerNumber(
          characterSEA
        )} had status effect ${statusEffectId} applied for ${duration} rounds.`;
        break;
      }

      case "StatusEffectsResolved": {
        const {
          character: characterSER,
          health,
          attack,
          defense,
          isStunned,
          tookDamage,
          round: roundSER,
        } = event.data;
        text = `${getPlayerNumber(
          characterSER
        )} resolved status effects. Health: ${health}, Attack: ${attack}, Defense: ${defense}, Is Stunned: ${isStunned}, Took Damage: ${tookDamage}`;
        break;
      }

      case "SkillExecuted": {
        const { player, skillName, totalDamage } = event.data;
        text = `${getPlayerNumber(
          player
        )} executed skill ${skillName} dealing ${totalDamage} damage.`;
        break;
      }

      default:
        text = `Unknown event: ${event.eventName}`;
    }

    return {
      text,
      eventName: event.eventName,
    };
  };

  useEffect(() => {
    console.log(events);
  }, [events]);

  useEffect(() => {
    if (!events || isLoading || error) {
      return;
    }

    const allEvents = events.filter((event) => event.data.battleId.eq(ID));

    // Sort the events
    allEvents.sort((a, b) => {
      // Sort by blockNumber first
      const blockNumberDiff =
        a.transaction.blockNumber - b.transaction.blockNumber;
      if (blockNumberDiff !== 0) {
        return blockNumberDiff;
      }

      // If blockNumber is the same, sort by logIndex
      return a.transaction.logIndex - b.transaction.logIndex;
    });

    // Format the events and set the battleLog state
    const formattedEvents = allEvents.map(formatEvent);
    setBattleLog(formattedEvents);
  }, [ID, isLoading, error, events]);

  useEffect(() => {
    endOfLogRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [battleLog]);

  function getEventClass(eventName) {
    switch (eventName) {
      case "MoveSubmitted":
        return "text-blue-500";
      case "RoundEnded":
        return "text-red-500";
      case "DiceRolled":
        return "text-green-500";
      case "StatusEffectApplied":
        return "text-yellow-500";
      case "StatusEffectsResolved":
        return "text-purple-500";
      case "SkillExecuted":
        return "text-pink-500";
      default:
        return "";
    }
  }
  return (
    <div className="backdrop-blur-md overflow-auto h-40 w-120 p-4 rounded-lg shadow-lg mb-4">
      {battleLog.map((logEntry, index) => (
        <div key={index} className="mb-2">
          <div
            className={`p-3 rounded-lg shadow-lg  ${getEventClass(
              logEntry.eventName
            )} ${
              logEntry.eventName === "RoundEnded"
                ? "bg-blue-200 bg-opacity-25"
                : " bg-opacity-50"
            }`}
          >
            <p>{logEntry.text}</p>
          </div>
          {logEntry.eventName === "RoundEnded" && <hr />}
        </div>
      ))}
      <div ref={endOfLogRef} />
    </div>
  );
};

export default BattleLog;
