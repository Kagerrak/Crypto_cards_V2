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
  } = useGlobalContext();
  if (!battleSummary) {
    return null;
  }

  const isWinner =
    battleSummary.winner.toLowerCase() === walletAddress.toLowerCase();

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
                <th className="px-4 py-2"></th>
                <th className="px-4 py-2">Player 1</th>
                <th className="px-4 py-2">Player 2</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Damage Taken</td>
                <td>{battleSummary.damageTaken[0].toNumber()}</td>
                <td>{battleSummary.damageTaken[1].toNumber()}</td>
              </tr>
              <tr>
                <td>Damage Dealt</td>
                <td>{battleSummary.damageDealt[0].toNumber()}</td>
                <td>{battleSummary.damageDealt[1].toNumber()}</td>
              </tr>
              <tr>
                <td>Mana Consumed</td>
                <td>{battleSummary.manaConsumed[0].toNumber()}</td>
                <td>{battleSummary.manaConsumed[1].toNumber()}</td>
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
                  {isWinner ? "Loser" : "Winner"}
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
