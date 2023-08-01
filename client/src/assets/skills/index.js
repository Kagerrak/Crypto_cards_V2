import Fireball from "./Fireball.png";
import Frenzy from "./Frenzy.png";
import Healing from "./healing_spell.png";
import Stun from "./stun_spell.png";
import weakenAttack from "./weaken_attack.png";
import weakenDefense from "./weaken_defense.png";
import defensiveStance from "./defensive_stance.png";

import { statusEffects } from "../status_effects";

// Creating an array of objects where each object contains the skill ID, name, description, and status effect
export const skills = [
  {
    id: 1,
    name: "Stun Attack",
    description: "Deals 10 damage and applies stun for 5 turns",
    statusEffect: statusEffects.find((effect) => effect.id === 1),
    image: Stun,
  },
  {
    id: 2,
    name: "Fireball",
    description: "Deals 20 damage and applies burn for 10 turns",
    statusEffect: statusEffects.find((effect) => effect.id === 2),
    image: Fireball,
  },
  {
    id: 3,
    name: "Weaken Attack",
    description: "Deals 15 damage and reduces attack for 5 turns",
    statusEffect: statusEffects.find((effect) => effect.id === 3),
    image: weakenAttack,
  },
  {
    id: 4,
    name: "Weaken Defense",
    description: "Deals 15 damage and reduces defense for 5 turns",
    statusEffect: statusEffects.find((effect) => effect.id === 4),
    image: weakenDefense,
  },
  {
    id: 5,
    name: "Power Strike",
    description: "Deals 25 damage and boosts attack for 10 turns",
    statusEffect: statusEffects.find((effect) => effect.id === 5),
    image: Frenzy,
  },
  {
    id: 6,
    name: "Healing Spell",
    description: "Restores 10 health over 10 turns",
    statusEffect: statusEffects.find((effect) => effect.id === 6),
    image: Healing,
  },
  {
    id: 7,
    name: "Defensive Stance",
    description: "Increases defense by 10 for 5 turns",
    statusEffect: statusEffects.find((effect) => effect.id === 7),
    image: defensiveStance,
  },
  {
    id: 10001,
    name: "Fireball",
    description: "Deals 20 damage and applies burn for 10 turns",
    statusEffect: statusEffects.find((effect) => effect.id === 2),
    image: Fireball,
  },
];
