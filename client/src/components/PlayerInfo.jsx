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

const PlayerInfo = ({ player, playerIcon, character, mt, health }) => (
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
        {player.mana === 0 ? (
          <img src={emptyMana} alt="Logo" />
        ) : (
          <img src={fullMana} alt="Logo" />
        )}
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

export default PlayerInfo;
