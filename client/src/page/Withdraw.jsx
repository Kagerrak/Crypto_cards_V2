import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";

import styles from "../styles";
import { CustomButton } from "../components";
import { useGlobalContext } from "../context";

const Withdraw = () => {
  const navigate = useNavigate();
  const { contract } = useGlobalContext();
  const [balanceInEth, setBalanceInEth] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);
      const tx = await contract.withdrawFee();
      await tx.wait(2);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const getBalance = async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const balance = await provider.getBalance(contract.address);
      setBalanceInEth(ethers.utils.formatEther(balance));
      console.log(balanceInEth);
    };
    getBalance();
    return () => {};
  }, [balanceInEth]);

  return (
    <div className={`${styles.flexCenter} ${styles.battlegroundContainer}`}>
      <h1 className={`${styles.headText} text-center`}>
        Withdraw Collected Fees
        {/* <span className="text-siteViolet"> (All Battles)</span> */}
      </h1>

      <div className="flex flex-col justify-center items-center mt-6 bg-slate-400 bg-opacity-5 h-[420px] w-[400px] pt-0 rounded-xl">
        <div className="mt-3 mb-5 ">
          <p className={styles.normalText}>{balanceInEth} Eth</p>
        </div>
        <div>
          <CustomButton
            title={loading ? "Collecting Fees" : "Withdraw"}
            handleClick={handleClick}
            restStyles="mt-6"
          />
        </div>
      </div>
    </div>
  );
};

export default Withdraw;
