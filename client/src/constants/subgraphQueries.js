import { gql } from "@apollo/client";

const GET_BATTLES = gql`
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

export default GET_BATTLES;
