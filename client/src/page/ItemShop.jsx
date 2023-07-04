import React from "react";
import { useNavigate } from "react-router-dom";

import styles from "../styles";
import { Alert } from "../components";
import { useGlobalContext } from "../context";

const ItemShop = () => {
  const navigate = useNavigate();
  const { setBattleGround, setShowAlert, showAlert } = useGlobalContext();

  return (
    <div className={`${styles.flexCenter} ${styles.battlegroundContainer}`}>
      {showAlert.status && (
        <Alert type={showAlert.type} message={showAlert.message} />
      )}

      <h1 className={`${styles.headText} text-center`}>
        Item
        {<span className="text-siteViolet"> shop</span>}
      </h1>
    </div>
  );
};

export default ItemShop;
