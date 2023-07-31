import React from "react";
import PropTypes from "prop-types";

import { loader } from "../assets";

const Loader = ({ backgroundColor, loaderSize, textSize, message }) => {
  return (
    <div
      className="fixed inset-0 z-50 h-screen flex items-center justify-center flex-col"
      style={{ backgroundColor: backgroundColor }}
    >
      <img
        src={loader}
        alt="loader"
        className={`w-${loaderSize} h-${loaderSize} object-contain`}
      />
      <p
        className={`mt-4 font-epilogue font-bold text-center text-white`}
        style={{ fontSize: textSize }}
      >
        {message}
      </p>
    </div>
  );
};

Loader.propTypes = {
  backgroundColor: PropTypes.string,
  loaderSize: PropTypes.string,
  textSize: PropTypes.string,
  message: PropTypes.string,
};

Loader.defaultProps = {
  backgroundColor: "rgba(0, 0, 0, 0.7)",
  loaderSize: "100px",
  textSize: "20px",
  message: `Transaction is in progress
Please wait...`,
};

export default Loader;
