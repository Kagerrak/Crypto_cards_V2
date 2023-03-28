import React, { useState } from "react";
import styles from "../styles";
import { logo } from "../assets";
import CustomButton from "./CustomButton";
import { useNavigate, useLocation } from "react-router-dom";
import { useGlobalContext } from "../context";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const showNav = location.pathname.includes("battle/") ? false : true;
  const [showLinks, setShowLinks] = useState(false);
  const { walletAddress, updateCurrentWalletAddress, owner } =
    useGlobalContext();

  const lOwner = owner.toLowerCase();
  const lWalletAddress = walletAddress.toLowerCase();

  return (
    <>
      {showNav && (
        <nav
          style={{ backgroundColor: "rgb(19 21 25)" }}
          className="border-gray-200 px-2 sm:px-4 py-2.5 "
        >
          <div className="flex flex-wrap items-center justify-between mx-auto">
            <a
              onClick={() => navigate("/")}
              href={undefined}
              className="flex items-center"
            >
              <img
                src={logo}
                alt="logo"
                className={styles.hocLogo}
                onClick={() => navigate("/")}
              />
            </a>

            <div className="flex md:order-2">
              {!walletAddress && (
                <CustomButton
                  title="Connect Wallet"
                  handleClick={updateCurrentWalletAddress}
                />
              )}

              <button
                onClick={() => setShowLinks(!showLinks)}
                data-collapse-toggle="navbar-default"
                data-target="#navbar-default"
                type="button"
                className="inline-flex items-center p-2 ml-3 text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
                aria-controls="navbar-default"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                <svg
                  className="w-6 h-6"
                  aria-hidden="true"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </button>
            </div>

            <div
              className="hidden w-full md:block md:w-auto"
              id="navbar-default"
            >
              <ul
                style={{ backgroundColor: "rgb(19 21 25)" }}
                className="flex flex-col p-4 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 md:mt-0 md:text-sm md:font-medium md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700"
              >
                <li>
                  <a
                    onClick={() => navigate("/")}
                    href={undefined}
                    className={
                      location.pathname == "/" ||
                      location.pathname.includes("create-battle")
                        ? styles.linkActive
                        : styles.linkText
                    }
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    onClick={() => navigate("/colosseum")}
                    href={undefined}
                    className={
                      location.pathname.includes("colosseum")
                        ? styles.linkActive
                        : styles.linkText
                    }
                  >
                    Colosseum (All Battles)
                  </a>
                </li>
                <li>
                  <a
                    onClick={() => navigate("/recruitment-guild")}
                    href={undefined}
                    className={
                      location.pathname.includes("recruitment-guild") ||
                      location.pathname.includes("my-champions")
                        ? styles.linkActive
                        : styles.linkText
                    }
                  >
                    Recruitment Guild
                  </a>
                </li>
                <li>
                  <a
                    onClick={() => navigate("/training-guild")}
                    href={undefined}
                    className={
                      location.pathname.includes("training-guild")
                        ? styles.linkActive
                        : styles.linkText
                    }
                  >
                    Training Guild
                  </a>
                </li>

                <li>
                  <a
                    onClick={() => navigate("/inn")}
                    href={undefined}
                    className={
                      location.pathname.includes("inn")
                        ? styles.linkActive
                        : styles.linkText
                    }
                  >
                    Inn
                  </a>
                </li>
                <li>
                  <a
                    id="shop-menu"
                    style={{ display: "flex" }}
                    href={undefined}
                    className={
                      location.pathname.includes("shop")
                        ? styles.linkDropdownActive
                        : styles.linkDropdown
                    }
                  >
                    Shop{" "}
                    <svg
                      className="w-5 h-5 ml-1 mt-1"
                      aria-hidden="true"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </a>

                  <div className={`${styles.dropdown}`}>
                    <ul
                      className="py-1 text-sm text-gray-700 dark:text-gray-200"
                      aria-labelledby="dropdownDefaultButton"
                    >
                      <li>
                        <a
                          onClick={() => navigate("/weapon-armor-shop")}
                          href={undefined}
                          className={
                            location.pathname.includes("weapon-armor-shop")
                              ? styles.linkActive
                              : styles.linkText
                          }
                        >
                          Weapon/Armor shop
                        </a>
                      </li>
                      <li>
                        <a
                          onClick={() => navigate("/item-shop")}
                          href={undefined}
                          className={
                            location.pathname.includes("item-shop")
                              ? styles.linkActive
                              : styles.linkText
                          }
                        >
                          Item shop
                        </a>
                      </li>
                      <li>
                        <a
                          onClick={() => navigate("/magic-trinket-shop")}
                          href={undefined}
                          className={
                            location.pathname.includes("magic-trinket-shop")
                              ? styles.linkActive
                              : styles.linkText
                          }
                        >
                          Magic/Trinket shop
                        </a>
                      </li>
                    </ul>
                  </div>
                </li>
                {lOwner === lWalletAddress ? (
                  <li>
                    <a
                      onClick={() => navigate("/withdraw")}
                      href={undefined}
                      className={
                        location.pathname.includes("withdraw")
                          ? styles.linkActive
                          : styles.linkText
                      }
                    >
                      Withdraw
                    </a>
                  </li>
                ) : null}
              </ul>
            </div>
          </div>

          <>
            {showLinks && (
              <div id="dropdown" className={styles.mobileMenu}>
                <ul
                  className="py-1 text-sm text-gray-700 dark:text-gray-200"
                  aria-labelledby="dropdownDefaultButton"
                >
                  <li>
                    <a
                      onClick={() => navigate("/")}
                      href={undefined}
                      className={
                        location.pathname == "/" ||
                        location.pathname.includes("create-battle")
                          ? styles.linkActive
                          : styles.linkText
                      }
                    >
                      Home
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() => navigate("/colosseum")}
                      href={undefined}
                      className={
                        location.pathname.includes("colosseum")
                          ? styles.linkActive
                          : styles.linkText
                      }
                    >
                      Colosseum (All Battles)
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() => navigate("/recruitment-guild")}
                      href={undefined}
                      className={
                        location.pathname.includes("recruitment-guild") ||
                        location.pathname.includes("my-champions")
                          ? styles.linkActive
                          : styles.linkText
                      }
                    >
                      Recruitment Guild
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() => navigate("/training-guild")}
                      href={undefined}
                      className={
                        location.pathname.includes("training-guild")
                          ? styles.linkActive
                          : styles.linkText
                      }
                    >
                      Training Guild
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() => navigate("/shop")}
                      href={undefined}
                      className={
                        location.pathname.includes("shop")
                          ? styles.linkActive
                          : styles.linkText
                      }
                    >
                      Shop
                    </a>
                  </li>
                  {lWalletAddress === lOwner ? (
                    <li>
                      <a
                        onClick={() => navigate("/withdraw")}
                        href={undefined}
                        className={
                          location.pathname.includes("withdraw")
                            ? styles.linkActive
                            : styles.linkText
                        }
                      >
                        Withdraw
                      </a>
                    </li>
                  ) : null}
                </ul>
              </div>
            )}
          </>
        </nav>
      )}
    </>
  );
};

export default Navbar;
