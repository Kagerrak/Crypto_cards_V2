import React from "react";
import { useNFT } from "@thirdweb-dev/react";

const ItemSlot = ({ type, itemId, contract }) => {
  const { data: nftItem, isLoading: itemNFTLoading } = useNFT(contract, itemId);

  return (
    <div className="bg-gray-200 w-14 h-14 flex items-center justify-center text-center text-[15px] text-gray-700 font-bold rounded-md mb-2">
      {itemNFTLoading || !nftItem || itemId === 999999
        ? type
        : nftItem.metadata.name || nftItem.metadata.title}
    </div>
  );
};

export default ItemSlot;
