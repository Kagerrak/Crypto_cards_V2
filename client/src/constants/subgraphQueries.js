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
    characters {
      id
      totalDamageDealt
      totalDamageTaken
      owner {
        id
      }
      battles {
        id
        name
        status
        winner {
          id
        }
      }
    }
  }
`;
