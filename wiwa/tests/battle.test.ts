import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt, Address } from "@graphprotocol/graph-ts"
import { BattleCancelled } from "../generated/schema"
import { BattleCancelled as BattleCancelledEvent } from "../generated/Battle/Battle"
import { handleBattleCancelled } from "../src/battle"
import { createBattleCancelledEvent } from "./battle-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let battleId = BigInt.fromI32(234)
    let player = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let newBattleCancelledEvent = createBattleCancelledEvent(battleId, player)
    handleBattleCancelled(newBattleCancelledEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("BattleCancelled created and stored", () => {
    assert.entityCount("BattleCancelled", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "BattleCancelled",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "battleId",
      "234"
    )
    assert.fieldEquals(
      "BattleCancelled",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "player",
      "0x0000000000000000000000000000000000000001"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
