import React from "react";
import { statusEffects } from "../assets/status_effects/index.js";

const StatusEffect = ({ activeEffectIds, activeEffectDurations }) => (
  <div className="flex flex-wrap h-12">
    {activeEffectIds.map((effectId, index) => {
      const effect = statusEffects.find(
        (effect) => effect.id === effectId.toNumber()
      );
      if (!effect) {
        console.warn(`Effect with ID ${effectId} not found.`);
        return null;
      }
      return (
        <div
          key={index}
          className="relative mr-2 mb-2 flex items-center border-2 border-gray-400 p-2 rounded-lg"
        >
          <img src={effect.image} alt={effect.name} className="h-4 w-4" />
          <p className="absolute bottom-0 right-1 text-xs text-gray-300">
            {activeEffectDurations[index].toNumber()}
          </p>
        </div>
      );
    })}
  </div>
);

export default StatusEffect;
