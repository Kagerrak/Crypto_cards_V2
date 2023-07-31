// backgrounds
import saiman from "./background/saiman.jpg";
import astral from "./background/astral.jpg";
import eoaalien from "./background/eoaalien.jpg";
import panight from "./background/panight.jpg";
import heroImg from "./background/hero-img.jpg";

// cards
import ace from "./Ace.png";
import bakezori from "./Bakezori.png";
import blackSolus from "./Black_Solus.png";
import calligrapher from "./Calligrapher.png";
import chakriAvatar from "./Chakri_Avatar.png";
import coalfist from "./Coalfist.png";
import desolator from "./Desolator.png";
import duskRigger from "./Dusk_Rigger.png";
import flamewreath from "./Flamewreath.png";
import furiosa from "./Furiosa.png";
import geomancer from "./Geomancer.png";
import goreHorn from "./Gore_Horn.png";
import heartseeker from "./Heartseeker.png";
import jadeMonk from "./Jade_Monk.png";
import kaidoExpert from "./Kaido_Expert.png";
import katara from "./Katara.png";
import kiBeholder from "./Ki_Beholder.png";
import kindling from "./Kindling.png";
import lanternFox from "./Lantern_Fox.png";
import mizuchi from "./Mizuchi.png";
import orizuru from "./Orizuru.png";
import scarletViper from "./Scarlet_Viper.png";
import stormKage from "./Storm_Kage.png";
import suzumebachi from "./Suzumebachi.png";
import tuskBoar from "./Tusk_Boar.png";
import twilightFox from "./Twilight_Fox.png";
import voidTalon from "./Void_Talon.png";
import whiplash from "./Whiplash.png";
import widowmaker from "./Widowmaker.png";
import xho from "./Xho.png";

// skills & spells

import Frenzy from "./skills/Frenzy.png";
import Fireball from "./spells/Fireball.png";
import skill from "./skill.png";
import spell from "./spell.png";

// Characters

import Wizard from "./characters/Wizard.png";
import Warrior from "./characters/Warrior.jpg";
import Rogue from "./characters/Rogue.png";

//
import loader from "./loader.svg";
// logo
import logo from "./logo.svg";

// icon
import attack from "./attack.png";
import defense from "./defense.png";
import alertIcon from "./alertIcon.svg";
import AlertIcon from "./AlertIcon.jsx";

// players
import player01 from "./player01.png";
import player02 from "./player02.png";

// sounds
import attackSound from "./sounds/attack.wav";
import defenseSound from "./sounds/defense.mp3";
import explosion from "./sounds/explosion.mp3";

import badge from "./hexagon.png";

export const allCards = [
  ace,
  bakezori,
  blackSolus,
  calligrapher,
  chakriAvatar,
  coalfist,
  desolator,
  duskRigger,
  flamewreath,
  furiosa,
  geomancer,
  goreHorn,
  heartseeker,
  jadeMonk,
  kaidoExpert,
  katara,
  kiBeholder,
  kindling,
  lanternFox,
  mizuchi,
  orizuru,
  scarletViper,
  stormKage,
  suzumebachi,
  tuskBoar,
  twilightFox,
  voidTalon,
  whiplash,
  widowmaker,
  xho,
];

export {
  saiman,
  astral,
  eoaalien,
  panight,
  heroImg,
  ace,
  bakezori,
  blackSolus,
  calligrapher,
  chakriAvatar,
  coalfist,
  desolator,
  duskRigger,
  flamewreath,
  furiosa,
  geomancer,
  goreHorn,
  heartseeker,
  jadeMonk,
  kaidoExpert,
  katara,
  kiBeholder,
  kindling,
  lanternFox,
  mizuchi,
  orizuru,
  scarletViper,
  stormKage,
  suzumebachi,
  tuskBoar,
  twilightFox,
  voidTalon,
  whiplash,
  widowmaker,
  xho,
  logo,
  attack,
  defense,
  alertIcon,
  AlertIcon,
  player01,
  player02,
  attackSound,
  defenseSound,
  explosion,
  loader,
  badge,
};

export const battlegrounds = [
  { id: "bg-saiman", image: saiman, name: "Saiman" },
  { id: "bg-astral", image: astral, name: "Astral" },
  { id: "bg-eoaalien", image: eoaalien, name: "Eoaalien" },
  { id: "bg-panight", image: panight, name: "Panight" },
];

export const gameRules = [
  "Card with the same defense and attack point will cancel each other out.",
  "Attack points from the attacking card will deduct the opposing player’s health points.",
  "If P1 does not defend, their health wil be deducted by P2’s attack.",
  "If P1 defends, P2’s attack is equal to P2’s attack - P1’s defense.",
  "If a player defends, they refill 3 Mana",
  "If a player attacks, they spend 3 Mana",
];

export const inns = [
  {
    name: "Dingy Retreat",
    occupancy: 10,
    image: Wizard,
    time_to_completion: 7200,
    bonuses: "none",
    price: 0.5,
  },
];
export const characters = [
  {
    name: "WARRIOR",
    characterType: 0,
    image: Warrior,
    type: "Skills",
    skillId: 1,
    battle_icon: skill,
    value: "Frenzy",
    icon: Frenzy,
    tooltip:
      "Once this Warrior gets worked into a frenzy nothing can stop him, not even himself",
    mana_cost: "+5 mana cost from regular attack",
    damage: 120,
    effect:
      "Adds 30% to attack damage for 3 turns, but this character will automatically attack",
    attributes: {
      health: 1000,
      mana: 100,
      attack: 100,
      defense: 100,
    },
  },
  {
    name: "WIZARD",
    characterType: 1,
    image: Wizard,
    type: "Spells",
    skillId: 2,
    battle_icon: spell,
    value: "Fireball",
    icon: Fireball,
    tooltip: "A starting level spell, but packs quite a punch.",
    mana_cost: "+50 mana cost from regular attack.",
    damage: 120,
    effect: "Causes Burn for 1 turn",
    attributes: {
      health: 500,
      mana: 200,
      attack: 50,
      defense: 50,
    },
  },
  {
    name: "ROGUE",
    characterType: 2,
    image: Rogue,
    type: "Spells",
    skillId: 1,
    battle_icon: spell,
    value: "Fireball",
    icon: Fireball,
    tooltip: "A starting level spell, but packs quite a punch.",
    mana_cost: "+50 mana cost from regular attack.",
    damage: 120,
    effect: "Causes Burn for 1 turn",
    attributes: {
      health: 500,
      mana: 200,
      attack: 50,
      defense: 50,
    },
  },
];
