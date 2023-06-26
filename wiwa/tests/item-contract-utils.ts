import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  ApprovalForAll,
  ContractURIUpdated,
  DefaultRoyalty,
  NewItem,
  OperatorRestriction,
  OwnerUpdated,
  RoyaltyForToken,
  TransferBatch,
  TransferSingle,
  URI,
  UpdatedItem
} from "../generated/ItemContract/ItemContract"

export function createApprovalForAllEvent(
  _owner: Address,
  _operator: Address,
  _approved: boolean
): ApprovalForAll {
  let approvalForAllEvent = changetype<ApprovalForAll>(newMockEvent())

  approvalForAllEvent.parameters = new Array()

  approvalForAllEvent.parameters.push(
    new ethereum.EventParam("_owner", ethereum.Value.fromAddress(_owner))
  )
  approvalForAllEvent.parameters.push(
    new ethereum.EventParam("_operator", ethereum.Value.fromAddress(_operator))
  )
  approvalForAllEvent.parameters.push(
    new ethereum.EventParam("_approved", ethereum.Value.fromBoolean(_approved))
  )

  return approvalForAllEvent
}

export function createContractURIUpdatedEvent(
  prevURI: string,
  newURI: string
): ContractURIUpdated {
  let contractUriUpdatedEvent = changetype<ContractURIUpdated>(newMockEvent())

  contractUriUpdatedEvent.parameters = new Array()

  contractUriUpdatedEvent.parameters.push(
    new ethereum.EventParam("prevURI", ethereum.Value.fromString(prevURI))
  )
  contractUriUpdatedEvent.parameters.push(
    new ethereum.EventParam("newURI", ethereum.Value.fromString(newURI))
  )

  return contractUriUpdatedEvent
}

export function createDefaultRoyaltyEvent(
  newRoyaltyRecipient: Address,
  newRoyaltyBps: BigInt
): DefaultRoyalty {
  let defaultRoyaltyEvent = changetype<DefaultRoyalty>(newMockEvent())

  defaultRoyaltyEvent.parameters = new Array()

  defaultRoyaltyEvent.parameters.push(
    new ethereum.EventParam(
      "newRoyaltyRecipient",
      ethereum.Value.fromAddress(newRoyaltyRecipient)
    )
  )
  defaultRoyaltyEvent.parameters.push(
    new ethereum.EventParam(
      "newRoyaltyBps",
      ethereum.Value.fromUnsignedBigInt(newRoyaltyBps)
    )
  )

  return defaultRoyaltyEvent
}

export function createNewItemEvent(
  itemId: BigInt,
  name: string,
  attack: BigInt,
  defense: BigInt,
  health: BigInt,
  mana: BigInt,
  skill: BigInt,
  itemType: i32
): NewItem {
  let newItemEvent = changetype<NewItem>(newMockEvent())

  newItemEvent.parameters = new Array()

  newItemEvent.parameters.push(
    new ethereum.EventParam("itemId", ethereum.Value.fromUnsignedBigInt(itemId))
  )
  newItemEvent.parameters.push(
    new ethereum.EventParam("name", ethereum.Value.fromString(name))
  )
  newItemEvent.parameters.push(
    new ethereum.EventParam("attack", ethereum.Value.fromUnsignedBigInt(attack))
  )
  newItemEvent.parameters.push(
    new ethereum.EventParam(
      "defense",
      ethereum.Value.fromUnsignedBigInt(defense)
    )
  )
  newItemEvent.parameters.push(
    new ethereum.EventParam("health", ethereum.Value.fromUnsignedBigInt(health))
  )
  newItemEvent.parameters.push(
    new ethereum.EventParam("mana", ethereum.Value.fromUnsignedBigInt(mana))
  )
  newItemEvent.parameters.push(
    new ethereum.EventParam("skill", ethereum.Value.fromUnsignedBigInt(skill))
  )
  newItemEvent.parameters.push(
    new ethereum.EventParam(
      "itemType",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(itemType))
    )
  )

  return newItemEvent
}

export function createOperatorRestrictionEvent(
  restriction: boolean
): OperatorRestriction {
  let operatorRestrictionEvent = changetype<OperatorRestriction>(newMockEvent())

  operatorRestrictionEvent.parameters = new Array()

  operatorRestrictionEvent.parameters.push(
    new ethereum.EventParam(
      "restriction",
      ethereum.Value.fromBoolean(restriction)
    )
  )

  return operatorRestrictionEvent
}

export function createOwnerUpdatedEvent(
  prevOwner: Address,
  newOwner: Address
): OwnerUpdated {
  let ownerUpdatedEvent = changetype<OwnerUpdated>(newMockEvent())

  ownerUpdatedEvent.parameters = new Array()

  ownerUpdatedEvent.parameters.push(
    new ethereum.EventParam("prevOwner", ethereum.Value.fromAddress(prevOwner))
  )
  ownerUpdatedEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownerUpdatedEvent
}

export function createRoyaltyForTokenEvent(
  tokenId: BigInt,
  royaltyRecipient: Address,
  royaltyBps: BigInt
): RoyaltyForToken {
  let royaltyForTokenEvent = changetype<RoyaltyForToken>(newMockEvent())

  royaltyForTokenEvent.parameters = new Array()

  royaltyForTokenEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  royaltyForTokenEvent.parameters.push(
    new ethereum.EventParam(
      "royaltyRecipient",
      ethereum.Value.fromAddress(royaltyRecipient)
    )
  )
  royaltyForTokenEvent.parameters.push(
    new ethereum.EventParam(
      "royaltyBps",
      ethereum.Value.fromUnsignedBigInt(royaltyBps)
    )
  )

  return royaltyForTokenEvent
}

export function createTransferBatchEvent(
  _operator: Address,
  _from: Address,
  _to: Address,
  _ids: Array<BigInt>,
  _values: Array<BigInt>
): TransferBatch {
  let transferBatchEvent = changetype<TransferBatch>(newMockEvent())

  transferBatchEvent.parameters = new Array()

  transferBatchEvent.parameters.push(
    new ethereum.EventParam("_operator", ethereum.Value.fromAddress(_operator))
  )
  transferBatchEvent.parameters.push(
    new ethereum.EventParam("_from", ethereum.Value.fromAddress(_from))
  )
  transferBatchEvent.parameters.push(
    new ethereum.EventParam("_to", ethereum.Value.fromAddress(_to))
  )
  transferBatchEvent.parameters.push(
    new ethereum.EventParam(
      "_ids",
      ethereum.Value.fromUnsignedBigIntArray(_ids)
    )
  )
  transferBatchEvent.parameters.push(
    new ethereum.EventParam(
      "_values",
      ethereum.Value.fromUnsignedBigIntArray(_values)
    )
  )

  return transferBatchEvent
}

export function createTransferSingleEvent(
  _operator: Address,
  _from: Address,
  _to: Address,
  _id: BigInt,
  _value: BigInt
): TransferSingle {
  let transferSingleEvent = changetype<TransferSingle>(newMockEvent())

  transferSingleEvent.parameters = new Array()

  transferSingleEvent.parameters.push(
    new ethereum.EventParam("_operator", ethereum.Value.fromAddress(_operator))
  )
  transferSingleEvent.parameters.push(
    new ethereum.EventParam("_from", ethereum.Value.fromAddress(_from))
  )
  transferSingleEvent.parameters.push(
    new ethereum.EventParam("_to", ethereum.Value.fromAddress(_to))
  )
  transferSingleEvent.parameters.push(
    new ethereum.EventParam("_id", ethereum.Value.fromUnsignedBigInt(_id))
  )
  transferSingleEvent.parameters.push(
    new ethereum.EventParam("_value", ethereum.Value.fromUnsignedBigInt(_value))
  )

  return transferSingleEvent
}

export function createURIEvent(_value: string, _id: BigInt): URI {
  let uriEvent = changetype<URI>(newMockEvent())

  uriEvent.parameters = new Array()

  uriEvent.parameters.push(
    new ethereum.EventParam("_value", ethereum.Value.fromString(_value))
  )
  uriEvent.parameters.push(
    new ethereum.EventParam("_id", ethereum.Value.fromUnsignedBigInt(_id))
  )

  return uriEvent
}

export function createUpdatedItemEvent(
  itemId: BigInt,
  name: string,
  attack: BigInt,
  defense: BigInt,
  health: BigInt,
  mana: BigInt,
  skill: BigInt
): UpdatedItem {
  let updatedItemEvent = changetype<UpdatedItem>(newMockEvent())

  updatedItemEvent.parameters = new Array()

  updatedItemEvent.parameters.push(
    new ethereum.EventParam("itemId", ethereum.Value.fromUnsignedBigInt(itemId))
  )
  updatedItemEvent.parameters.push(
    new ethereum.EventParam("name", ethereum.Value.fromString(name))
  )
  updatedItemEvent.parameters.push(
    new ethereum.EventParam("attack", ethereum.Value.fromUnsignedBigInt(attack))
  )
  updatedItemEvent.parameters.push(
    new ethereum.EventParam(
      "defense",
      ethereum.Value.fromUnsignedBigInt(defense)
    )
  )
  updatedItemEvent.parameters.push(
    new ethereum.EventParam("health", ethereum.Value.fromUnsignedBigInt(health))
  )
  updatedItemEvent.parameters.push(
    new ethereum.EventParam("mana", ethereum.Value.fromUnsignedBigInt(mana))
  )
  updatedItemEvent.parameters.push(
    new ethereum.EventParam("skill", ethereum.Value.fromUnsignedBigInt(skill))
  )

  return updatedItemEvent
}
