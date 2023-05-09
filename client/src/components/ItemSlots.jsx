import React, { useEffect, useState } from "react";
import ItemSlot from "./ItemSlot";

const ItemSlots = ({ charTWContract, itemTWContract, tokenId }) => {
  const itemTypes = [
    { type: 0, name: "Headgear" },
    { type: 1, name: "Weapon" },
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {itemTypes.map(({ name }) => (
        <ItemSlot
          key={name}
          type={name}
          itemId={equippedItems[name]}
          contract={itemTWContract}
        />
      ))}
    </div>
  );
};

export default ItemSlots;
