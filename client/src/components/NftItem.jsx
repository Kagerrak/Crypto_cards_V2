import React from "react";
import { ThirdwebNftMedia } from "@thirdweb-dev/react";

const NftItem = ({ metadata, isSelected, onSelect }) => (
  <div
    className={`border-2 border-gray-400 rounded-lg overflow-hidden hover:border-blue-400 
        ${
          isSelected ? "border-red-400 hover:border-red-400 animate-pulse " : ""
        }`}
    onClick={() => onSelect(isSelected ? null : metadata.id)}
  >
    <div className="relative">
      <ThirdwebNftMedia
        metadata={metadata}
        height={200}
        width={200}
        className="drop-shadow-lg"
      />
    </div>
  </div>
);

export default NftItem;
