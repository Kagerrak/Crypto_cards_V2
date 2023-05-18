import React, { useEffect } from "react";
import ItemSlot from "./ItemSlot";
import { useGlobalContext } from "../context";

const ItemSlots = ({ charTWContract, itemTWContract, tokenId }) => {
  const {
    characterContract,
    equippedItems,
    setEquippedItems,
    equippedItemLoading,
    setEquippedItemLoading,
    setLocalOwnedItems,
    allOwnedItems,
  } = useGlobalContext();

  const itemTypes = [
    { type: 0, name: "Weapon" },
    { type: 1, name: "Headgear" },
    { type: 2, name: "Body Armor" },
    { type: 3, name: "Pants" },
    { type: 4, name: "Footwear" },
  ];

  const handleUnequipItem = async (_itemTokenId) => {
    setEquippedItemLoading(true);
    try {
      const unequipTx = await characterContract.unequipItem(
        tokenId,
        _itemTokenId
      );
      await unequipTx.wait();

      setEquippedItems((prevItems) => {
        // Step 1: Replace the unequipped item with 999999 (as per your previous logic)
        const newItems = { ...prevItems };
        for (let itemType in newItems) {
          if (newItems[itemType] === _itemTokenId) {
            newItems[itemType] = 999999;
          }
        }
        return newItems;
      });

      // Step 2: Add the unequipped item to the localOwnedItems
      const unequippedItem = allOwnedItems.find(
        (item) => item.metadata.id === _itemTokenId
      );
      if (unequippedItem) {
        setLocalOwnedItems((prevItems) => [...prevItems, unequippedItem]);
      }

      setEquippedItemLoading(false);
    } catch (err) {
      console.error("contract call failure", err);
    }
  };

  useEffect(() => {
    const fetchEquippedItems = async () => {
      if (
        !equippedItemLoading &&
        Object.values(equippedItems).every((itemId) => itemId === null)
      ) {
        setEquippedItemLoading(true);

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

        setEquippedItemLoading(false);
      }
    };

    fetchEquippedItems();
  }, [charTWContract, tokenId, equippedItems, equippedItemLoading]);

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
