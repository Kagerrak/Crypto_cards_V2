import React from "react";

import styles from "../styles";

const CustomButton = ({ title, handleClick, restStyles, loading }) => (
  <button
    type="button"
    className={`${styles.btn} ${restStyles}`}
    onClick={handleClick}
    disabled={loading}
  >
    {loading ? (
      <span className="animate-spin inline-block h-5 w-5 border-t-2 border-white"></span>
    ) : (
      title
    )}
  </button>
);

export default CustomButton;
