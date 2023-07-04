import { gql } from "@apollo/client";

export const GET_BATTLES = gql`
  query {
    battles {
      id
      players
      status
      totalDamageDealt
      totalDamageTaken
    }
  }
`;

export const GET_PLAYERS = gql`
  query {
    players {
      id
      totalDamageDealt
      totalDamageTaken
      battles {
        id
        name
        status
        winner {
          id
        }
      }
      characters {
        id
        totalDamageDealt
        totalDamageTaken
      }
    }
  }
`;

export const GET_CHARACTERS = gql`
  query {
    players(first: 10) {
      id
    }
    characters(first: 10) {
      id
      statPoints
      stamina
      strength
      totalDamageDealt
      totalDamageTaken
      typeId
      vitality
      wins
      maxMana
      mana
      losses
      level
      lastStaminaUpdateTime
      lastManaUpdateTime
      intelligence
      health
      experience
      dexterity
      defense
      attack
      accuracy
    }
  }
`;

export const GET_MOVE = gql`
  query {
    moves(first: 1) {
      player {
        id
      }
    }
  }
`;
