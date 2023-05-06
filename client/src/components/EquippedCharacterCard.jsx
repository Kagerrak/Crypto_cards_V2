import React from "react";
import { ThirdwebNftMedia } from "@thirdweb-dev/react";

const EquippedCharacterCard = ({
  itemType,
  equippedItem,
  loading,
  nftData,
  nftLoading,
  onUnequip,
}) => {
  const handleUnequip = () => {
    onUnequip();
  };

  return (
    <div className="h-auto w-full border-stone-200 border-2 text-center">
      <p>Equipped {itemType}</p>
      {/* {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="flex flex-col justify-center items-center">
          {equippedItem.toNumber() === 9999 ? (
            <div>No {itemType} equipped</div>
          ) : nftLoading ? (
            <div>Loading...</div>
          ) : (
            <div
              className="relative"
              onMouseEnter={(e) => {
                e.currentTarget
                  .querySelector(".hover-button")
                  .classList.remove("hidden");
              }}
              onMouseLeave={(e) => {
                e.currentTarget
                  .querySelector(".hover-button")
                  .classList.add("hidden");
              }}
            >
              <ThirdwebNftMedia
                metadata={nftData.metadata}
                width={80}
                height={80}
                className="rounded-xl"
              />
              <button
                className="hidden absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-400 bg-opacity-5 text-white px-3 py-2 rounded-md z-10 hover-button text-xs"
                onClick={() => handleUnequip()}
              >
                Unequip
              </button>
            </div>
          )}
        </div>
      )} */}
    </div>
  );
};

export default EquippedCharacterCard;
