import React from "react";

import styles from "../styles";

const ActionButton = ({ imgUrl, handleClick, restStyles, disabled }) => (
  <div
    className={`${styles.gameMoveBox} ${styles.flexCenter} ${
      styles.glassEffect
    } ${restStyles} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    onClick={!disabled ? handleClick : undefined}
  >
    <img src={imgUrl} alt="action_img" className={styles.gameMoveIcon} />
  </div>
);

export default ActionButton;
