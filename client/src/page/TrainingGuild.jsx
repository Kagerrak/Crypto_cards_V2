import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dice } from "../utils/diceBox";

import styles from "../styles";
import { Alert } from "../components";
import { battlegrounds } from "../assets";
import { useGlobalContext } from "../context";

Dice.init().then(() => {
  document.addEventListener("mousedown", () => {
    const diceBoxCanvas = document.getElementById("dice-canvas");
    if (window.getComputedStyle(diceBoxCanvas).display !== "none") {
      Dice.hide().clear();
    }
  });
});

const TrainingGuild = () => {
  const navigate = useNavigate();
  const { setBattleGround, setShowAlert, showAlert } = useGlobalContext();
  const [desiredResult, setDesiredResult] = useState(1);

  const handleBattleChoice = (ground) => {
    setBattleGround(ground.id);

    localStorage.setItem("battleground", ground.id);

    setShowAlert({
      status: true,
      type: "info",
      message: `${ground.name} is battle ready!`,
    });

    setTimeout(() => {
      navigate(-1);
    }, 1000);
  };

  const handleDesiredResultChange = (e) => {
    setDesiredResult(e.target.value);
  };

  const rollDiceWithDesiredResult = (e) => {
    e.preventDefault();
    Dice.show().roll("1d20", [{ set: "d20", value: parseInt(desiredResult) }]);
    console.log("dice rolled");
  };

  return (
    <div className={`${styles.flexCenter} ${styles.battlegroundContainer}`}>
      {showAlert.status && (
        <Alert type={showAlert.type} message={showAlert.message} />
      )}

      <h1 className={`${styles.headText} text-center`}>Training Guild</h1>

      <div>
        <label htmlFor="desired-result">Desired Result (1-20): </label>
        <input
          id="desired-result"
          type="number"
          inputMode="numeric"
          min={1}
          max={20}
          value={desiredResult}
          onChange={handleDesiredResultChange}
        />
      </div>
      <button onClick={rollDiceWithDesiredResult}>Roll Dice</button>

      <div className={`${styles.flexCenter} ${styles.battleGroundsWrapper}`}>
        {battlegrounds.map((ground) => (
          <div
            key={ground.id}
            className={`${styles.flexCenter} ${styles.battleGroundCard}`}
            onClick={() => handleBattleChoice(ground)}
          >
            <img
              src={ground.image}
              alt="saiman"
              className={styles.battleGroundCardImg}
            />

            <div className="info absolute">
              <p className={styles.battleGroundCardText}>{ground.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrainingGuild;
