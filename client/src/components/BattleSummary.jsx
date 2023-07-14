import React from "react";
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";
import { useGlobalContext } from "../context";

Modal.setAppElement("#root"); // replace '#root' with the id of your root element if it's different

const BattleSummaryModal = ({ isOpen, onRequestClose, battleSummary }) => {
  const navigate = useNavigate();
  const {
    walletAddress,
    setShouldPoll,
    setShouldPollPlayerData,
    fetchGameData,
    setDamagedPlayers,
  } = useGlobalContext();
  if (!battleSummary) {
    return null;
  }

  const isWinner =
    walletAddress.toLowerCase() === battleSummary.winner.toLowerCase();
  const isLoser =
    walletAddress.toLowerCase() === battleSummary.loser.toLowerCase();

  const isPlayerOne =
    walletAddress.toLowerCase() === battleSummary.players[0].toLowerCase();

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Battle Summary"
      className="flex items-center justify-center fixed inset-0 outline-none focus:outline-none"
      overlayClassName="fixed inset-0"
    >
      <div className="relative w-1/2 h-1/2 my-6 mx-auto max-w-3xl">
        <div className="border-2 border-gold-500 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
          <h2 className="text-center text-3xl font-semibold text-purple-500 p-5">
            Battle Summary
          </h2>
          <table className="table-auto w-full text-center z-100 text-lg whitespace-no-wrap opacity-100">
            <thead>
              <tr>
                <th className="px-4 py-2">Metric</th>
                <th className="px-4 py-2">You</th>
                <th className="px-4 py-2">Opponent</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Battle Ended @ Round</td>
                <td colSpan={2}>{battleSummary.round}</td>
              </tr>
              <tr>
                <td>Damage Dealt</td>
                <td>
                  {isPlayerOne
                    ? battleSummary.damageDealt[0]
                    : battleSummary.damageDealt[1]}
                </td>
                <td>
                  {isPlayerOne
                    ? battleSummary.damageDealt[1]
                    : battleSummary.damageDealt[0]}
                </td>
              </tr>
              <tr>
                <td>Damage Taken</td>
                <td>
                  {isPlayerOne
                    ? battleSummary.damageTaken[0]
                    : battleSummary.damageTaken[1]}
                </td>
                <td>
                  {isPlayerOne
                    ? battleSummary.damageTaken[1]
                    : battleSummary.damageTaken[0]}
                </td>
              </tr>
              <tr>
                <td>Damage Reduced</td>
                <td>
                  {isPlayerOne
                    ? battleSummary.damageReduced[0]
                    : battleSummary.damageReduced[1]}
                </td>
                <td>
                  {isPlayerOne
                    ? battleSummary.damageReduced[1]
                    : battleSummary.damageReduced[0]}
                </td>
              </tr>
              <tr>
                <td>Health Regenerated</td>
                <td>
                  {isPlayerOne
                    ? battleSummary.healthRegenerated[0]
                    : battleSummary.healthRegenerated[1]}
                </td>
                <td>
                  {isPlayerOne
                    ? battleSummary.healthRegenerated[1]
                    : battleSummary.healthRegenerated[0]}
                </td>
              </tr>
              <tr>
                <td>Mana Regenerated</td>
                <td>
                  {isPlayerOne
                    ? battleSummary.manaRegenerated[0]
                    : battleSummary.manaRegenerated[1]}
                </td>
                <td>
                  {isPlayerOne
                    ? battleSummary.manaRegenerated[1]
                    : battleSummary.manaRegenerated[0]}
                </td>
              </tr>
              <tr>
                <td>EXP Received</td>
                <td>
                  {isPlayerOne
                    ? battleSummary.expReceived[0]
                    : battleSummary.expReceived[1]}
                </td>
                <td>
                  {isPlayerOne
                    ? battleSummary.expReceived[1]
                    : battleSummary.expReceived[0]}
                </td>
              </tr>
              <tr>
                <td>League Battle Points Earned</td>
                <td>
                  {isPlayerOne
                    ? battleSummary.leaguePointsEarned[0]
                    : battleSummary.leaguePointsEarned[1]}
                </td>
                <td>
                  {isPlayerOne
                    ? battleSummary.leaguePointsEarned[1]
                    : battleSummary.leaguePointsEarned[0]}
                </td>
              </tr>
              <tr>
                <td className="border px-4 py-2">Result</td>
                <td
                  className={`border px-4 py-2 ${
                    isWinner ? "text-green-500 font-bold" : "text-red-500"
                  }`}
                >
                  {isWinner ? "Winner" : "Loser"}
                </td>
                <td
                  className={`border px-4 py-2 ${
                    isWinner ? "text-red-500" : "text-green-500 font-bold"
                  }`}
                >
                  {isLoser ? "Winner" : "Loser"}
                </td>
              </tr>
            </tbody>
          </table>

          <button
            className={`text-white text-xl ${
              isWinner
                ? "bg-green-500 hover:bg-green-600"
                : "bg-red-500 hover:bg-red-600"
            } border-0 py-3 px-6 focus:outline-none rounded text-lg mt-4 mb-2`}
            onClick={async () => {
              onRequestClose();
              setShouldPoll(false);
              setShouldPollPlayerData(false);
              setDamagedPlayers([]);
              await fetchGameData();
              navigate("/create-battle");
            }}
          >
            {isWinner ? "You Win!" : "You Lose"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BattleSummaryModal;
