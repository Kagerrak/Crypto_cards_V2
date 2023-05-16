import React, { useEffect, useState } from "react";

import ItemSlot from "./ItemSlot";
import { useGlobalContext } from "../context";

const ItemSlots = ({ charTWContract, itemTWContract, tokenId }) => {
  const { characterContract } = useGlobalContext();

  const itemTypes = [
    { type: 0, name: "Weapon" },
    { type: 1, name: "Headgear" },
    { type: 2, name: "Body Armor" },
    { type: 3, name: "Pants" },
    { type: 4, name: "Footwear" },
  ];

  const [equippedItems, setEquippedItems] = useState({
    Headgear: null,
    Weapon: null,
    BodyArmor: null,
    Pants: null,
    Footwear: null,
  });

  const handleUnequipItem = async (_itemTokenId) => {
    try {
      const data = await characterContract.unequipItem(tokenId, _itemTokenId);
      console.info("contract call successs", data);
    } catch (err) {
      console.error("contract call failure", err);
    }
  };

  useEffect(() => {
    const fetchEquippedItems = async () => {
      const fetchedItems = await Promise.all(
        itemTypes.map(async ({ type, name }) => {
          const fetchedItemId = await charTWContract.call("getEquippedItem", [
            tokenId,
            type,
          ]);

          if (fetchedItemId !== null && fetchedItemId !== undefined) {
            return { itemType: name, itemId: fetchedItemId.toNumber() };
          }

          return { itemType: name, itemId: null };
        })
      );

      const items = fetchedItems.reduce((acc, { itemType, itemId }) => {
        return { ...acc, [itemType]: itemId };
      }, {});

      setEquippedItems(items);
    };

    fetchEquippedItems();
  }, [charTWContract, tokenId]);

  return (
    <div className="mt-2">
      <p>Item Equips</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
        {itemTypes.map(({ name }) => (
          <ItemSlot
            key={name}
            type={name}
            itemId={equippedItems[name]}
            contract={itemTWContract}
            handleUnequip={handleUnequipItem}
          />
        ))}
      </div>
    </div>
  );
};

export default ItemSlots;
