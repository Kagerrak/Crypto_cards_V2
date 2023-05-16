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
    id: 0,
    name: "Stun",
    description: "Miss a turn",
    image: stun,
  },
  {
    id: 1,
    name: "Damage Over Time",
    description: "Take damage each turn",
    image: burn,
  },
  {
    id: 2,
    name: "Reduce Attack",
    description: "Reduces attack power",
    image: reduceAttack,
  },
  {
    id: 3,
    name: "Reduce Defense",
    description: "Reduces defense power",
    image: reduceDefense,
  },
  {
    id: 4,
    name: "Boost Attack",
    description: "Increases attack power",
    image: boostAttack,
  },
  {
    id: 5,
    name: "Heal Over Time",
    description: "Regain health each turn",
    image: regen,
  },
  {
    id: 6,
    name: "Defense Boost",
    description: "Increases defense power",
    image: boostDefense,
  },
];
