import { EntitySheetHelper } from "./helper.js";
import {ATTRIBUTE_TYPES} from "./constants.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class NPCSheet extends ActorSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["stargatecoalition", "sheet", "PNJ"],
      template: "systems/stargatecoalition/templates/npc-sheet.html",
      width: 700,
      height: 750,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}],
      scrollY: [".biographie", ".items", ".attributes"],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async getData(options) {
    const context = await super.getData(options);
    context.shorthand = !!game.settings.get("stargatecoalition", "macroShorthand");
    context.systemData = context.data.system;
    context.dtypes = ATTRIBUTE_TYPES;
    context.biographyHTML = await TextEditor.enrichHTML(context.systemData.biographie, {
      secrets: this.document.isOwner,
      async: true
    });
    context.notesHTML = await TextEditor.enrichHTML(context.systemData.notes, {
      secrets: this.document.isOwner,
      async: true
    });
    context.racialSpecificityHTML = await TextEditor.enrichHTML(context.systemData.racialSpecificity, {
      secrets: this.document.isOwner,
      async: true
    });
    return context;
  }

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if ( !this.isEditable ) return;

    // Attribute Management
    html.find(".attributes").on("click", "a.caracteristics-roll", EntitySheetHelper.onAttributeRoll.bind(this));
    html.find(".resource").on("click", "a.resource-roll", EntitySheetHelper.onRessourceRoll.bind(this));
    html.find(".skills").on("click", "a.skill-roll", EntitySheetHelper.onSkillRoll.bind(this));
    html.find(".resource").on("click", "a.resource-takeDamage", EntitySheetHelper.onDamageRoll.bind(this));
    html.find(".resource").on("click", "a.resource-globalStatus", EntitySheetHelper.onSurviveRoll.bind(this));

    // Item Controls
    html.find(".item-control").click(EntitySheetHelper.onItemControl.bind(this));
    html.find(".items .rollable").on("click", EntitySheetHelper.onAttackRoll.bind(this));
    html.find(".items .equipped").on("click", EntitySheetHelper.onItemEquipped.bind(this));
    html.find(".items .location").on("click", EntitySheetHelper.onLocationRoll.bind(this));
  }

  /** @inheritdoc */
  _getSubmitData(updateData) {
    let formData = super._getSubmitData(updateData);
    formData = EntitySheetHelper.computeModifiers(formData);
    formData = EntitySheetHelper.computeSkills(formData);
    formData = EntitySheetHelper.computeHealth(formData, EntitySheetHelper.damageLevelFunction, EntitySheetHelper.malusFunction);
    formData = EntitySheetHelper.updateAttributes(formData, this.object);
    formData = EntitySheetHelper.updateGroups(formData, this.object);
    return formData;
  }
}
