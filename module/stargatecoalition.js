/**
 * A simple and flexible system for world-building using an arbitrary collection of character and item attributes
 * Author: Atropos
 */

// Import Modules
import { SimpleActor } from "./actor.js";
import { SimpleItem } from "./item.js";

import { WeaponSheet } from "./weapon-sheet.js";
import { ArmorSheet } from "./armor-sheet.js";
import { EquipmentSheet } from "./equipment-sheet.js";

import { PlayerSheet } from "./player-sheet.js";
import { NPCSheet } from "./npc-sheet.js";
import { ShipSheet } from "./ship-sheet.js";

import { createstargatecoalitionMacro } from "./macro.js";
import { SimpleToken, SimpleTokenDocument } from "./token.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

/**
 * Init hook.
 */
Hooks.once("init", async function() {
  console.log(`Initializing Simple stargatecoalition System`);

  /**
   * Set an initiative formula for the system. This will be updated later.
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "2d10 + @characteristics.dexterite.modifier + @characteristics.perception.modifier",
    decimals: 2
  };

  game.stargatecoalition = {
    SimpleActor,
    createstargatecoalitionMacro
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = SimpleActor;
  CONFIG.Item.documentClass = SimpleItem;
  CONFIG.Token.documentClass = SimpleTokenDocument;
  CONFIG.Token.objectClass = SimpleToken;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("stargatecoalition", PlayerSheet, { types: ["Joueur"], label: "Joueur", makeDefault: true });
  Actors.registerSheet("stargatecoalition", NPCSheet, { types: ["PNJ"], label: "PNJ", makeDefault: true });
  Actors.registerSheet("stargatecoalition", ShipSheet, { types: ["Vaisseau"], label: "Vaisseau", makeDefault: true });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("stargatecoalition", EquipmentSheet, { types: ["Equipement"], label: "Equipement", makeDefault: true });
  Items.registerSheet("stargatecoalition", WeaponSheet, { types: ["Arme"], label: "Arme", makeDefault: true });
  Items.registerSheet("stargatecoalition", ArmorSheet, { types: ["Armure"], label: "Armure", makeDefault: true });

  // Register system settings
  game.settings.register("stargatecoalition", "macroShorthand", {
    name: "SETTINGS.SimpleMacroShorthandN",
    hint: "SETTINGS.SimpleMacroShorthandL",
    scope: "world",
    type: Boolean,
    default: true,
    config: true
  });

  // Register initiative setting.
  game.settings.register("stargatecoalition", "initFormula", {
    name: "SETTINGS.SimpleInitFormulaN",
    hint: "SETTINGS.SimpleInitFormulaL",
    scope: "world",
    type: String,
    default: "2d10 + @characteristics.dexterite.modifier + @characteristics.perception.modifier",
    config: true,
    onChange: formula => _simpleUpdateInit(formula, true)
  });

  // Retrieve and assign the initiative formula setting.
  const initFormula = game.settings.get("stargatecoalition", "initFormula");
  _simpleUpdateInit(initFormula);

  /**
   * Update the initiative formula.
   * @param {string} formula - Dice formula to evaluate.
   * @param {boolean} notify - Whether or not to post nofications.
   */
  function _simpleUpdateInit(formula, notify = false) {
    const isValid = Roll.validate(formula);
    if ( !isValid ) {
      if ( notify ) ui.notifications.error(`${game.i18n.localize("SIMPLE.NotifyInitFormulaInvalid")}: ${formula}`);
      return;
    }
    CONFIG.Combat.initiative.formula = formula;
  }

  /**
   * Slugify a string.
   */
  Handlebars.registerHelper('slugify', function(value) {
    return value.slugify({strict: true});
  });
});

/**
 * Macrobar hook.
 */
Hooks.on("hotbarDrop", (bar, data, slot) => createstargatecoalitionMacro(data, slot));
