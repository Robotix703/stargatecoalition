import { EntitySheetHelper } from "./helper.js";
import {ATTRIBUTE_TYPES} from "./constants.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class SimpleActorSheet extends ActorSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["stargatecoalition", "sheet", "actor"],
      template: "systems/stargatecoalition/templates/actor-sheet.html",
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
    this.computeModifiers(context.data.system);
    this.computeSkills(context.data.system);
    return context;
  }

  /* -------------------------------------------- */

  computeModifiers(data){
    data.characteristics.force.modifier = this.valueToModifier(data.characteristics.force.value);
    data.characteristics.dexterite.modifier = this.valueToModifier(data.characteristics.dexterite.value);
    data.characteristics.constitution.modifier = this.valueToModifier(data.characteristics.constitution.value);
    data.characteristics.astuce.modifier = this.valueToModifier(data.characteristics.astuce.value);
    data.characteristics.intelligence.modifier = this.valueToModifier(data.characteristics.intelligence.value);
    data.characteristics.perception.modifier = this.valueToModifier(data.characteristics.perception.value);
    data.characteristics.volonte.modifier = this.valueToModifier(data.characteristics.volonte.value);
    data.characteristics.charisme.modifier = this.valueToModifier(data.characteristics.charisme.value);
  }

  computeSkills(data){
    //Total
    data.skills.contactWeapon.total = data.skills.contactWeapon.points + data.skills.contactWeapon.temp;
    data.skills.unarmedCombat.total = data.skills.unarmedCombat.points + data.skills.unarmedCombat.temp;
    data.skills.swimming.total = data.skills.swimming.points + data.skills.swimming.temp;
    data.skills.jumpAndClimb.total = data.skills.jumpAndClimb.points + data.skills.jumpAndClimb.temp;

    data.skills.rangedWeapon.total = data.skills.rangedWeapon.points + data.skills.rangedWeapon.temp;
    data.skills.dodge.total = data.skills.dodge.points + data.skills.dodge.temp;
    data.skills.acrobatics.total = data.skills.acrobatics.points + data.skills.acrobatics.temp;
    data.skills.stealth.total = data.skills.stealth.points + data.skills.stealth.temp;

    data.skills.vigor.total = data.skills.vigor.points + data.skills.vigor.temp;
    data.skills.endurance.total = data.skills.endurance.points + data.skills.endurance.temp;
    data.skills.recovery.total = data.skills.recovery.points + data.skills.recovery.temp;
    data.skills.immunity.total = data.skills.immunity.points + data.skills.immunity.temp;

    data.skills.piloting.total = data.skills.piloting.points + data.skills.piloting.temp;
    data.skills.sabotage.total = data.skills.sabotage.points + data.skills.sabotage.temp;
    data.skills.strategy.total = data.skills.strategy.points + data.skills.strategy.temp;
    data.skills.survival.total = data.skills.survival.points + data.skills.survival.temp;

    data.skills.archeology.total = data.skills.archeology.points + data.skills.archeology.temp;
    data.skills.science.total = data.skills.science.points + data.skills.science.temp;
    data.skills.medical.total = data.skills.medical.points + data.skills.medical.temp;
    data.skills.technologie.total = data.skills.technologie.points + data.skills.technologie.temp;

    data.skills.smell.total = data.skills.smell.points + data.skills.smell.temp;
    data.skills.hearing.total = data.skills.hearing.points + data.skills.hearing.temp;
    data.skills.touch.total = data.skills.touch.points + data.skills.touch.temp;
    data.skills.view.total = data.skills.view.points + data.skills.view.temp;

    data.skills.concentration.total = data.skills.concentration.points + data.skills.concentration.temp;
    data.skills.empathy.total = data.skills.empathy.points + data.skills.empathy.temp;
    data.skills.strongMinded.total = data.skills.strongMinded.points + data.skills.strongMinded.temp;
    data.skills.mentalToughness.total = data.skills.mentalToughness.points + data.skills.mentalToughness.temp;

    data.skills.bluff.total = data.skills.bluff.points + data.skills.bluff.temp;
    data.skills.intimidation.total = data.skills.intimidation.points + data.skills.intimidation.temp;
    data.skills.leadership.total = data.skills.leadership.points + data.skills.leadership.temp;
    data.skills.negotiation.total = data.skills.negotiation.points + data.skills.negotiation.temp;

    //Actual
    data.skillsLimits.force.actual = 
      data.skills.contactWeapon.points 
      + data.skills.unarmedCombat.total
      + data.skills.swimming.total
      + data.skills.jumpAndClimb.total;

    data.skillsLimits.dexterite.actual = 
      data.skills.rangedWeapon.points 
      + data.skills.dodge.total
      + data.skills.acrobatics.total
      + data.skills.stealth.total;

    data.skillsLimits.constitution.actual = 
      data.skills.vigor.points 
      + data.skills.endurance.total
      + data.skills.recovery.total
      + data.skills.immunity.total;

    data.skillsLimits.astuce.actual = 
      data.skills.piloting.points 
      + data.skills.sabotage.total
      + data.skills.strategy.total
      + data.skills.survival.total;

    data.skillsLimits.intelligence.actual = 
      data.skills.archeology.points 
      + data.skills.science.total
      + data.skills.medical.total
      + data.skills.technologie.total;

    data.skillsLimits.perception.actual = 
      data.skills.smell.points 
      + data.skills.hearing.total
      + data.skills.touch.total
      + data.skills.view.total;

    data.skillsLimits.volonte.actual = 
      data.skills.concentration.points 
      + data.skills.empathy.total
      + data.skills.strongMinded.total
      + data.skills.mentalToughness.total;

    data.skillsLimits.charisme.actual = 
      data.skills.bluff.points 
      + data.skills.intimidation.total
      + data.skills.leadership.total
      + data.skills.negotiation.total;

    //max
    data.skillsLimits.force.max = data.characteristics.force.modifier * 1.5;
    data.skillsLimits.dexterite.max = data.characteristics.dexterite.modifier * 1.5;
    data.skillsLimits.constitution.max = data.characteristics.constitution.modifier * 1.5;
    data.skillsLimits.astuce.max = data.characteristics.astuce.modifier * 1.5;
    data.skillsLimits.intelligence.max = data.characteristics.intelligence.modifier * 1.5;
    data.skillsLimits.perception.max = data.characteristics.perception.modifier * 1.5;
    data.skillsLimits.volonte.max = data.characteristics.volonte.modifier * 1.5;
    data.skillsLimits.charisme.max = data.characteristics.charisme.modifier * 1.5;

    //maxSet
    data.skillsLimits.force.maxSet = data.characteristics.force.modifier * 3;
    data.skillsLimits.dexterite.maxSet = data.characteristics.dexterite.modifier * 3;
    data.skillsLimits.constitution.maxSet = data.characteristics.constitution.modifier * 3;
    data.skillsLimits.astuce.maxSet = data.characteristics.astuce.modifier * 3;
    data.skillsLimits.intelligence.maxSet = data.characteristics.intelligence.modifier * 3;
    data.skillsLimits.perception.maxSet = data.characteristics.perception.modifier * 3;
    data.skillsLimits.volonte.maxSet = data.characteristics.volonte.modifier * 3;
    data.skillsLimits.charisme.maxSet = data.characteristics.charisme.modifier * 3;
  }

  valueToModifier(value) {
    return Math.floor(value/2) - 5
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

    // Item Controls
    html.find(".item-control").click(this._onItemControl.bind(this));
    html.find(".items .rollable").on("click", this._onItemRoll.bind(this));
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

  /**
   * Listen for roll buttons on items.
   * @param {MouseEvent} event    The originating left click event
   */
  _onItemRoll(event) {
    let button = $(event.currentTarget);
    const li = button.parents(".item");
    const item = this.actor.items.get(li.data("itemId"));
    let r = new Roll(button.data('roll'), this.actor.getRollData());
    return r.toMessage({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `<h2>${item.name}</h2><h3>${button.text()}</h3>`
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _getSubmitData(updateData) {
    let formData = super._getSubmitData(updateData);
    formData = EntitySheetHelper.updateAttributes(formData, this.object);
    formData = EntitySheetHelper.updateGroups(formData, this.object);
    return formData;
  }
}
