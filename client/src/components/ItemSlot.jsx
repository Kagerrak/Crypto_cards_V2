import React, { useEffect } from "react";
import { useNFT, ThirdwebNftMedia } from "@thirdweb-dev/react";
import { useGlobalContext } from "../context";

const ItemSlot = ({
  type,
  itemId,
  contract,
  compositeTWContract,
  handleUnequip,
}) => {
  // Determine which contract to use based on the item ID
  const contractToUse = itemId > 10000 ? compositeTWContract : contract;

  const { data: nftItem, isLoading: itemNFTLoading } = useNFT(
    contractToUse,
    itemId
  );
  const { setAllOwnedItems } = useGlobalContext();

  useEffect(() => {
    if (nftItem) {
      setAllOwnedItems((prevItems) => {
        const itemExists = prevItems.some(
          (item) => item.metadata.id === nftItem.metadata.id
        );
        if (!itemExists) {
          return [...prevItems, nftItem];
        }
        return prevItems;
      });
    }
  }, [nftItem, setAllOwnedItems]);

  return (
    <div className="bg-gray-200 w-14 h-14 flex items-center justify-center text-center text-[15px] text-gray-700 font-bold rounded-md mb-2">
      {itemNFTLoading || !nftItem || itemId === 0 || itemId === null ? (
        type
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
            metadata={nftItem.metadata}
            width={80}
            height={80}
            className="rounded-xl"
          />
          <button
            className="hidden absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-400 bg-opacity-5 text-white px-3 py-2 rounded-md z-10 hover-button text-xs"
            onClick={() => handleUnequip(itemId)}
          >
            Unequip
          </button>
        </div>
      )}
    </div>
  );
};

export default ItemSlot;
