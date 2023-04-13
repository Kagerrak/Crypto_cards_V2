import ReactTooltip from "react-tooltip";
import styles from "../styles";
import fullMana from "../assets/full_mana.png";
import emptyMana from "../assets/empty_mana.png";
import fullHealthbar from "../assets/full_healthbar.png";
import emptyHealthbar from "../assets/empty_healthbar.png";

// const healthPoints = 25;

// const healthLevel = (points) =>
//   points >= 12
//     ? `${emptyHealthbar}`
//     : points >= 6
//     ? `${fullHealthbar}`
//     : `${fullHealthbar}`;
// const marginIndexing = (index) =>
//   index !== healthPoints - 1 ? "mr-1" : "mr-0";

const PlayerInfo = ({ player, playerIcon, character, mt, health }) => {
  function getManaPercentage(mana, maxMana) {
    const percent = (mana / maxMana) * 100;
    const circumference = 2 * Math.PI * 50;
    const offset = circumference - (percent / 100) * circumference;
    return { dasharray: circumference, dashoffset: offset };
  }
  return (
    <div className={`${styles.flexCenter} ${mt ? "mt-auto" : "mb-auto"}`}>
      <img
        data-for={`Player-${mt ? "1" : "2"}`}
        data-tip
        src={playerIcon}
        alt="player02"
        className="w-14 h-14 object-contain rounded-full"
      />

      <div
        data-for={`Health-${mt ? "1" : "2"}`}
        data-tip={`Health: ${player.health}`}
        className={styles.playerHealth}
      >
        <div
          style={{
            width: "200%",
            height: "100%",
            position: "relative",
            marginBottom: "30px",
          }}
        >
          <img
            src={`${emptyHealthbar}`}
            style={{ width: "100%", height: "140%", position: "absolute" }}
            className="rounded-[10px]"
          />
          <img
            src={`${fullHealthbar}`}
            style={{
              width: `${(player.health / health) * 100}%`,
              height: "115%",
              position: "absolute",
              paddingLeft: "8px",
              paddingTop: "2px",
            }}
            className="rounded-l-[10px]"
          />
        </div>
      </div>

      <div
        data-for={`Mana-${mt ? "1" : "2"}`}
        data-tip="Mana"
        className={`${styles.flexCenter} ${styles.glassEffect} ${styles.playerMana}`}
      >
        <div className={styles.playerManaContainer}>
          <div className={styles.circularProgress}>
            <svg width="100" height="100" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="white"
                strokeWidth="20"
                fill="none"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="blue"
                strokeWidth="20"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={getManaPercentage(player.mana, 100).dasharray}
                strokeDashoffset={
                  getManaPercentage(player.mana, 100).dashoffset
                }
                transform="rotate(-90 60 60)"
              />
            </svg>
            <img src={emptyMana} alt="Logo" style={{ position: "absolute" }} />
          </div>
          <h1 className={styles.playerManaText}> {player.mana || 0}</h1>
        </div>
      </div>

      <ReactTooltip
        id={`Player-${mt ? "1" : "2"}`}
        effect="solid"
        backgroundColor="#7f46f0"
      >
        <p className={styles.playerInfo}>
          <span className={styles.playerInfoSpan}>Name:</span>{" "}
          {player?.playerName}
        </p>
        <p className={styles.playerInfo}>
          <span className={styles.playerInfoSpan}>Address:</span>{" "}
          {player?.playerAddress?.slice(0, 10)}
        </p>
      </ReactTooltip>
      <ReactTooltip
        id={`Health-${mt ? "1" : "2"}`}
        effect="solid"
        backgroundColor="#7f46f0"
      />
      <ReactTooltip
        id={`Mana-${mt ? "1" : "2"}`}
        effect="solid"
        backgroundColor="#7f46f0"
      />
    </div>
  );
};

export default PlayerInfo;
