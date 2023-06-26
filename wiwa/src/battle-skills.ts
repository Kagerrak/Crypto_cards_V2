import {
  NewSkill as NewSkillEvent,
  NewStatusEffect as NewStatusEffectEvent,
} from "../generated/BattleSkills/BattleSkills";
import { Skill, StatusEffect } from "../generated/schema";

export function handleNewSkill(event: NewSkillEvent): void {
  let entity = new Skill(event.params.skillId.toString());
  entity.name = event.params.name;
  entity.damage = event.params.damage;
  entity.manaCost = event.params.manaCost;

  // set the statusEffect field of the skill to the statusEffectId from the event
  let statusEffect = StatusEffect.load(event.params.statusEffectId.toString());
  if (statusEffect == null) {
    // handle the case where the StatusEffect does not exist
  } else {
    entity.statusEffect = statusEffect.id;
    // save the skill entity
    entity.save();
  }
}

export function handleNewStatusEffect(event: NewStatusEffectEvent): void {
  let entity = new StatusEffect(event.params.effectId.toString());
  entity.name = event.params.name;
  entity.isPositive = event.params.isPositive;
  entity.duration = event.params.duration;
  entity.attackBoost = event.params.attackBoost;
  entity.attackReduction = event.params.attackReduction;
  entity.defenseBoost = event.params.defenseBoost;
  entity.defenseReduction = event.params.defenseReduction;
  entity.healPerTurn = event.params.healPerTurn;
  entity.damagePerTurn = event.params.damagePerTurn;
  entity.isStun = event.params.isStun;

  // save the status effect entity
  entity.save();
}
