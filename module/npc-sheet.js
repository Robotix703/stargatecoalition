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
    html.find(".item-control").click(this._onItemControl.bind(this));
    html.find(".items .rollable").on("click", this._onAttackRoll.bind(this));
    html.find(".items .equipped").on("click", this._onItemEquipped.bind(this));
    html.find(".items .location").on("click", EntitySheetHelper.onLocationRoll.bind(this));
  }
  /* -------------------------------------------- */

  /**
   * Handle click events for Item control buttons within the Actor Sheet
   * @param event
   * @private
   */
  _onItemControl(event) {
    event.preventDefault();

    // Obtain event data
    const button = event.currentTarget;
    const li = button.closest(".item");
    const item = this.actor.items.get(li?.dataset.itemId);

    // Handle different actions
    switch ( button.dataset.action ) {
      case "create":
        const cls = getDocumentClass("Item");
        return cls.create({name: game.i18n.localize("SIMPLE.ItemNew"), type: "item"}, {parent: this.actor});
      case "edit":
        return item.sheet.render(true);
      case "delete":
        return item.delete();
    }
  }

  /* -------------------------------------------- */

  _onAttackRoll(event) {
    let button = $(event.currentTarget);
    const li = button.parents(".item");
    const item = this.actor.items.get(li.data("itemId"));
    const damage = item.system.weapon.damage + (item.system.weapon.isImproved ? 1 : 0);
    let r = new Roll(button[0].getAttribute('data-roll'), this.actor.getRollData());
    return r.toMessage({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `<h2>${item.name}</h2><h3>${button.text()}</h3><h3>Dégats : ${damage}</h3>`
    });
  }

  _onItemEquipped(event) {
    let button = $(event.currentTarget);
    const li = button.parents(".item");
    const item = this.actor.items.get(li.data("itemId"));

    //Update armor
    if(item.system.armor.isPhysicalArmor) {
      if(button[0].checked) {
        let newArmorValue = this.actor.system.physicalArmor + item.system.armor.protection;
        this.actor.update({"system.physicalArmor": newArmorValue});
      } else {
        let newArmorValue = this.actor.system.physicalArmor - item.system.armor.protection;
        this.actor.update({"system.physicalArmor": (newArmorValue >= 0) ? newArmorValue : 0});
      }
    }
    if(item.system.armor.isEnergetic) {
      if(button[0].checked) {
        let newArmorValue = this.actor.system.energeticArmor + item.system.armor.protection;
        this.actor.update({"system.energeticArmor": newArmorValue});
      } else {
        let newArmorValue = this.actor.system.energeticArmor - item.system.armor.protection;
        this.actor.update({"system.energeticArmor": (newArmorValue >= 0) ? newArmorValue : 0});
      }
    }

    //Update Item
    this.actor.items.getName(item.name).update({"system.armor.isEquip": button[0].checked});
  }

  /* -------------------------------------------- */

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
