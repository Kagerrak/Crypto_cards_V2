// Importing status effects icons
import stun from "./stun.png";
import burn from "./burn.png";
import reduceAttack from "./reduce_attack.png";
import reduceDefense from "./reduce_defense.png";
import boostAttack from "./boost_attack.png";
import regen from "./regen.png";
import boostDefense from "./boost_defense.png";

// Creating an array of objects where each object contains the status effect ID, name, description and image
export const statusEffects = [
  {
    id: 1,
    name: "Stun",
    description: "Miss a turn",
    image: stun,
  },
  {
    id: 2,
    name: "Damage Over Time",
    description: "Take damage each turn",
    image: burn,
  },
  {
    id: 3,
    name: "Reduce Attack",
    description: "Reduces attack power",
    image: reduceAttack,
  },
  {
    id: 4,
    name: "Reduce Defense",
    description: "Reduces defense power",
    image: reduceDefense,
  },
  {
    id: 5,
    name: "Boost Attack",
    description: "Increases attack power",
    image: boostAttack,
  },
  {
    id: 6,
    name: "Heal Over Time",
    description: "Regain health each turn",
    image: regen,
  },
  {
    id: 7,
    name: "Defense Boost",
    description: "Increases defense power",
    image: boostDefense,
  },
];
