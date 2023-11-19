
export class EntitySheetHelper {

  static getAttributeData(data) {

    // Determine attribute type.
    for ( let attr of Object.values(data.system.attributes) ) {
      if ( attr.dtype ) {
        attr.isCheckbox = attr.dtype === "Boolean";
        attr.isResource = attr.dtype === "Resource";
        attr.isFormula = attr.dtype === "Formula";
      }
    }

    // Initialize ungrouped attributes for later.
    data.system.ungroupedAttributes = {};

    // Build an array of sorted group keys.
    const groups = data.system.groups || {};
    let groupKeys = Object.keys(groups).sort((a, b) => {
      let aSort = groups[a].label ?? a;
      let bSort = groups[b].label ?? b;
      return aSort.localeCompare(bSort);
    });

    // Iterate over the sorted groups to add their attributes.
    for ( let key of groupKeys ) {
      let group = data.system.attributes[key] || {};

      // Initialize the attributes container for this group.
      if ( !data.system.groups[key]['attributes'] ) data.system.groups[key]['attributes'] = {};

      // Sort the attributes within the group, and then iterate over them.
      Object.keys(group).sort((a, b) => a.localeCompare(b)).forEach(attr => {
        // Avoid errors if this is an invalid group.
        if ( typeof group[attr] != "object" || !group[attr]) return;
        // For each attribute, determine whether it's a checkbox or resource, and then add it to the group's attributes list.
        group[attr]['isCheckbox'] = group[attr]['dtype'] === 'Boolean';
        group[attr]['isResource'] = group[attr]['dtype'] === 'Resource';
        group[attr]['isFormula'] = group[attr]['dtype'] === 'Formula';
        data.system.groups[key]['attributes'][attr] = group[attr];
      });
    }

    // Sort the remaining attributes.
    const keys = Object.keys(data.system.attributes).filter(a => !groupKeys.includes(a));
    keys.sort((a, b) => a.localeCompare(b));
    for ( const key of keys ) data.system.ungroupedAttributes[key] = data.system.attributes[key];

    // Modify attributes on items.
    if ( data.items ) {
      data.items.forEach(item => {
        // Iterate over attributes.
        for ( let [k, v] of Object.entries(item.system.attributes) ) {
          // Grouped attributes.
          if ( !v.dtype ) {
            for ( let [gk, gv] of Object.entries(v) ) {
              if ( gv.dtype ) {
                // Add label fallback.
                if ( !gv.label ) gv.label = gk;
                // Add formula bool.
                if ( gv.dtype === "Formula" ) {
                  gv.isFormula = true;
                }
                else {
                  gv.isFormula = false;
                }
              }
            }
          }
          // Ungrouped attributes.
          else {
            // Add label fallback.
            if ( !v.label ) v.label = k;
            // Add formula bool.
            if ( v.dtype === "Formula" ) {
              v.isFormula = true;
            }
            else {
              v.isFormula = false;
            }
          }
        }
      });
    }
  }

  /* -------------------------------------------- */

  /** @override */
  static onSubmit(event) {
    // Closing the form/sheet will also trigger a submit, so only evaluate if this is an event.
    if ( event.currentTarget ) {
      // Exit early if this isn't a named attribute.
      if ( (event.currentTarget.tagName.toLowerCase() === 'input') && !event.currentTarget.hasAttribute('name')) {
        return false;
      }

      let attr = false;
      // If this is the attribute key, we need to make a note of it so that we can restore focus when its recreated.
      const el = event.currentTarget;
      if ( el.classList.contains("attribute-key") ) {
        let val = el.value;
        let oldVal = el.closest(".attribute").dataset.attribute;
        let attrError = false;
        // Prevent attributes that already exist as groups.
        let groups = document.querySelectorAll('.group-key');
        for ( let i = 0; i < groups.length; i++ ) {
          if (groups[i].value === val) {
            ui.notifications.error(game.i18n.localize("SIMPLE.NotifyAttrDuplicate") + ` (${val})`);
            el.value = oldVal;
            attrError = true;
            break;
          }
        }
        // Handle value and name replacement otherwise.
        if ( !attrError ) {
          oldVal = oldVal.includes('.') ? oldVal.split('.')[1] : oldVal;
          attr = $(el).attr('name').replace(oldVal, val);
        }
      }

      // Return the attribute key if set, or true to confirm the submission should be triggered.
      return attr ? attr : true;
    }
  }

  /* -------------------------------------------- */

  /**
   * Listen for click events on an attribute control to modify the composition of attributes in the sheet
   * @param {MouseEvent} event    The originating left click event
   */
  static async onClickAttributeControl(event) {
    event.preventDefault();
    const a = event.currentTarget;
    const action = a.dataset.action;
    switch ( action ) {
      case "create":
        return EntitySheetHelper.createAttribute(event, this);
      case "delete":
        return EntitySheetHelper.deleteAttribute(event, this);
    }
  }

  /* -------------------------------------------- */

  /**
   * Listen for click events and modify attribute groups.
   * @param {MouseEvent} event    The originating left click event
   */
  static async onClickAttributeGroupControl(event) {
    event.preventDefault();
    const a = event.currentTarget;
    const action = a.dataset.action;
    switch ( action ) {
      case "create-group":
        return EntitySheetHelper.createAttributeGroup(event, this);
      case "delete-group":
        return EntitySheetHelper.deleteAttributeGroup(event, this);
    }
  }

  /* -------------------------------------------- */

  /**
   * Listen for the roll button on attributes.
   * @param {MouseEvent} event    The originating left click event
   */
  static onAttributeRoll(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const chatLabel = button?.getAttribute("data-label");
    const shorthand = game.settings.get("stargatecoalition", "macroShorthand");

    // Use the actor for rollData so that formulas are always in reference to the parent actor.
    const rollData = this.actor.getRollData();
    let formula = button?.getAttribute("data-formula");

    // If there's a formula, attempt to roll it.
    if ( formula ) {
      let replacement = null;
      if ( formula.includes('@item.') && this.item ) {
        let itemName = this.item.name.slugify({strict: true}); // Get the machine safe version of the item name.
        replacement = !!shorthand ? `@items.${itemName}.` : `@items.${itemName}.attributes.`;
        formula = formula.replace('@item.', replacement);
      }

      // Create the roll and the corresponding message
      let r = new Roll(formula, rollData);
      return r.toMessage({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `${chatLabel}`
      });
    }
  }

  static damageLevelFunction(level, isSensitive = false){
    switch (level) {
      case 0:
        return "";

      case 1:
        return isSensitive ? "Douleur Intense" : "";
    
      case 2:
        return isSensitive ? "Plaie Ouverte" : "Douleur Intense";

      case 3:
        return isSensitive ? "Hémorragie" : "Plaie Ouverte";

      case 4:
        return isSensitive ? "Hors d'usage" : "Hémorragie";

      case 5:
        return "Hors d'usage";

      case 6:
        return "Séquelle Ultérieures";

      case 7:
        return "Membre Arraché";
    }
  }

  static malusFunction(level, isSensitive){
    switch (level) {
      case 0:
        return 0;

      case 1:
        return isSensitive ? -1 : 0;
    
      case 2:
        return isSensitive ? -2 : -1;

      case 3:
        return isSensitive ? -3 : -2;

      case 4:
        return isSensitive ? -20 : -3;

      case 5:
      case 6:
      case 7:
        return -20;
    }
  }

  static computeHealth(formData, damageLevelFunction, malusFunction) {
    //Status
    formData["system.health.head.status"] = damageLevelFunction(formData["system.health.head.value"], true);
    formData["system.health.guidingHand.status"] = damageLevelFunction(formData["system.health.guidingHand.value"]);
    formData["system.health.rightArm.status"] = damageLevelFunction(formData["system.health.rightArm.value"]);
    formData["system.health.leftHand.status"] = damageLevelFunction(formData["system.health.leftHand.value"]);
    formData["system.health.leftArm.status"] = damageLevelFunction(formData["system.health.leftArm.value"]);
    formData["system.health.rightLeg.status"] = damageLevelFunction(formData["system.health.rightLeg.value"]);
    formData["system.health.leftLeg.status"] = damageLevelFunction(formData["system.health.leftLeg.value"]);
    formData["system.health.leftBelly.status"] = damageLevelFunction(formData["system.health.leftBelly.value"]);
    formData["system.health.rightBelly.status"] = damageLevelFunction(formData["system.health.rightBelly.value"]);
    formData["system.health.rightChest.status"] = damageLevelFunction(formData["system.health.rightChest.value"]);
    formData["system.health.heart.status"] = damageLevelFunction(formData["system.health.heart.value"], true);

    //Malus
    formData["system.health.head.malus"] = malusFunction(formData["system.health.head.value"], true);
    formData["system.health.guidingHand.malus"] = malusFunction(formData["system.health.guidingHand.value"]);
    formData["system.health.rightArm.malus"] = malusFunction(formData["system.health.rightArm.value"]);
    formData["system.health.leftHand.malus"] = malusFunction(formData["system.health.leftHand.value"]);
    formData["system.health.leftArm.malus"] = malusFunction(formData["system.health.leftArm.value"]);
    formData["system.health.rightLeg.malus"] = malusFunction(formData["system.health.rightLeg.value"]);
    formData["system.health.leftLeg.malus"] = malusFunction(formData["system.health.leftLeg.value"]);
    formData["system.health.leftBelly.malus"] = malusFunction(formData["system.health.leftBelly.value"]);
    formData["system.health.rightBelly.malus"] = malusFunction(formData["system.health.rightBelly.value"]);
    formData["system.health.rightChest.malus"] = malusFunction(formData["system.health.rightChest.value"]);
    formData["system.health.heart.malus"] = malusFunction(formData["system.health.heart.value"], true);

    //Global status
    formData["system.health.status"] = "";

    let dying = 0;
    if(formData["system.health.guidingHand.value"] >= 4) dying++;
    if(formData["system.health.rightArm.value"] >= 4) dying++;
    if(formData["system.health.leftHand.value"] >= 4) dying++;
    if(formData["system.health.leftArm.value"] >= 4) dying++;
    if(formData["system.health.rightLeg.value"] >= 4) dying++;
    if(formData["system.health.leftLeg.value"] >= 4) dying++;
    if(formData["system.health.leftBelly.value"] >= 4) dying++;
    if(formData["system.health.rightBelly.value"] >= 4) dying++;
    if(formData["system.health.rightChest.value"] >= 4) dying++;
    if(dying > 5) formData["system.health.status"] = "Mourant";

    if(formData["system.health.head.value"] == 4 || formData["system.health.heart.value"] == 4) formData["system.health.status"] = "Mort";

    //Armor used
    if(formData["system.armorUsedFor.deflect"] === true) {
      formData["system.armorUsedFor.status"] = "Dévier les tirs";
      formData["system.armorUsedFor.DDBonus"] = Math.max(formData["system.physicalArmor"], formData["system.energeticArmor"]);
    }
    else {
      formData["system.armorUsedFor.status"] = "Absorbe les dégâts";
      formData["system.armorUsedFor.DDBonus"] = 0;
    }

    return formData;
  }

  static computeSkills(formData){
    //Total
    formData["system.skills.contactWeapon.total"] = formData["system.skills.contactWeapon.points"] + formData["system.skills.contactWeapon.temp"];
    formData["system.skills.unarmedCombat.total"] = formData["system.skills.unarmedCombat.points"] + formData["system.skills.unarmedCombat.temp"];
    formData["system.skills.swimming.total"] = formData["system.skills.swimming.points"] + formData["system.skills.swimming.temp"];
    formData["system.skills.jumpAndClimb.total"] = formData["system.skills.jumpAndClimb.points"] + formData["system.skills.jumpAndClimb.temp"];

    formData["system.skills.rangedWeapon.total"] = formData["system.skills.rangedWeapon.points"] + formData["system.skills.rangedWeapon.temp"];
    formData["system.skills.dodge.total"] = formData["system.skills.dodge.points"] + formData["system.skills.dodge.temp"];
    formData["system.skills.acrobatics.total"] = formData["system.skills.acrobatics.points"] + formData["system.skills.acrobatics.temp"];
    formData["system.skills.stealth.total"] = formData["system.skills.stealth.points"] + formData["system.skills.stealth.temp"];

    formData["system.skills.vigor.total"] = formData["system.skills.vigor.points"] + formData["system.skills.vigor.temp"];
    formData["system.skills.endurance.total"] = formData["system.skills.endurance.points"] + formData["system.skills.endurance.temp"];
    formData["system.skills.recovery.total"] = formData["system.skills.recovery.points"] + formData["system.skills.recovery.temp"];
    formData["system.skills.immunity.total"] = formData["system.skills.immunity.points"] + formData["system.skills.immunity.temp"];

    formData["system.skills.piloting.total"] = formData["system.skills.piloting.points"] + formData["system.skills.piloting.temp"];
    formData["system.skills.sabotage.total"] = formData["system.skills.sabotage.points"] + formData["system.skills.sabotage.temp"];
    formData["system.skills.strategy.total"] = formData["system.skills.strategy.points"] + formData["system.skills.strategy.temp"];
    formData["system.skills.survival.total"] = formData["system.skills.survival.points"] + formData["system.skills.survival.temp"];

    formData["system.skills.archeology.total"] = formData["system.skills.archeology.points"] + formData["system.skills.archeology.temp"];
    formData["system.skills.science.total"] = formData["system.skills.science.points"] + formData["system.skills.science.temp"];
    formData["system.skills.medical.total"] = formData["system.skills.medical.points"] + formData["system.skills.medical.temp"];
    formData["system.skills.technologie.total"] = formData["system.skills.technologie.points"] + formData["system.skills.technologie.temp"];

    formData["system.skills.smell.total"] = formData["system.skills.smell.points"] + formData["system.skills.smell.temp"];
    formData["system.skills.hearing.total"] = formData["system.skills.hearing.points"] + formData["system.skills.hearing.temp"];
    formData["system.skills.touch.total"] = formData["system.skills.touch.points"] + formData["system.skills.touch.temp"];
    formData["system.skills.view.total"] = formData["system.skills.view.points"] + formData["system.skills.view.temp"];

    formData["system.skills.concentration.total"] = formData["system.skills.concentration.points"] + formData["system.skills.concentration.temp"];
    formData["system.skills.empathy.total"] = formData["system.skills.empathy.points"] + formData["system.skills.empathy.temp"];
    formData["system.skills.strongMinded.total"] = formData["system.skills.strongMinded.points"] + formData["system.skills.strongMinded.temp"];
    formData["system.skills.mentalToughness.total"] = formData["system.skills.mentalToughness.points"] + formData["system.skills.mentalToughness.temp"];

    formData["system.skills.bluff.total"] = formData["system.skills.bluff.points"] + formData["system.skills.bluff.temp"];
    formData["system.skills.intimidation.total"] = formData["system.skills.intimidation.points"] + formData["system.skills.intimidation.temp"];
    formData["system.skills.leadership.total"] = formData["system.skills.leadership.points"] + formData["system.skills.leadership.temp"];
    formData["system.skills.negotiation.total"] = formData["system.skills.negotiation.points"] + formData["system.skills.negotiation.temp"];

    //Actual
    formData["system.skillsLimits.force.actual"] =
      formData["system.skills.contactWeapon.points"] 
      + formData["system.skills.unarmedCombat.points"]
      + formData["system.skills.swimming.points"]
      + formData["system.skills.jumpAndClimb.points"];

    formData["system.skillsLimits.dexterite.actual"] = 
      formData["system.skills.rangedWeapon.points"] 
      + formData["system.skills.dodge.points"]
      + formData["system.skills.acrobatics.points"]
      + formData["system.skills.stealth.points"];

    formData["system.skillsLimits.constitution.actual"] = 
      formData["system.skills.vigor.points"] 
      + formData["system.skills.endurance.points"]
      + formData["system.skills.recovery.points"]
      + formData["system.skills.immunity.points"];

    formData["system.skillsLimits.astuce.actual"] = 
      formData["system.skills.piloting.points"] 
      + formData["system.skills.sabotage.points"]
      + formData["system.skills.strategy.points"]
      + formData["system.skills.survival.points"];

    formData["system.skillsLimits.intelligence.actual"] = 
      formData["system.skills.archeology.points"] 
      + formData["system.skills.science.points"]
      + formData["system.skills.medical.points"]
      + formData["system.skills.technologie.points"];

    formData["system.skillsLimits.perception.actual"] = 
      formData["system.skills.smell.points"] 
      + formData["system.skills.hearing.points"]
      + formData["system.skills.touch.points"]
      + formData["system.skills.view.points"];

    formData["system.skillsLimits.volonte.actual"] = 
      formData["system.skills.concentration.points"] 
      + formData["system.skills.empathy.points"]
      + formData["system.skills.strongMinded.points"]
      + formData["system.skills.mentalToughness.points"];

    formData["system.skillsLimits.charisme.actual"] = 
      formData["system.skills.bluff.points"] 
      + formData["system.skills.intimidation.points"]
      + formData["system.skills.leadership.points"]
      + formData["system.skills.negotiation.points"];

    //max
    formData["system.skillsLimits.force.max"] = Math.floor(formData["system.characteristics.force.modifier"] * 1.5);
    formData["system.skillsLimits.dexterite.max"] = Math.floor(formData["system.characteristics.dexterite.modifier"] * 1.5);
    formData["system.skillsLimits.constitution.max"] = Math.floor(formData["system.characteristics.constitution.modifier"] * 1.5);
    formData["system.skillsLimits.astuce.max"] = Math.floor(formData["system.characteristics.astuce.modifier"] * 1.5);
    formData["system.skillsLimits.intelligence.max"] = Math.floor(formData["system.characteristics.intelligence.modifier"] * 1.5);
    formData["system.skillsLimits.perception.max"] = Math.floor(formData["system.characteristics.perception.modifier"] * 1.5);
    formData["system.skillsLimits.volonte.max"] = Math.floor(formData["system.characteristics.volonte.modifier"] * 1.5);
    formData["system.skillsLimits.charisme.max"] = Math.floor(formData["system.characteristics.charisme.modifier"] * 1.5);

    //maxSet
    formData["system.skillsLimits.force.maxSet"] = formData["system.characteristics.force.modifier"] * 3;
    formData["system.skillsLimits.dexterite.maxSet"] = formData["system.characteristics.dexterite.modifier"] * 3;
    formData["system.skillsLimits.constitution.maxSet"] = formData["system.characteristics.constitution.modifier"] * 3;
    formData["system.skillsLimits.astuce.maxSet"] = formData["system.characteristics.astuce.modifier"] * 3;
    formData["system.skillsLimits.intelligence.maxSet"] = formData["system.characteristics.intelligence.modifier"] * 3;
    formData["system.skillsLimits.perception.maxSet"] = formData["system.characteristics.perception.modifier"] * 3;
    formData["system.skillsLimits.volonte.maxSet"] = formData["system.characteristics.volonte.modifier"] * 3;
    formData["system.skillsLimits.charisme.maxSet"] = formData["system.characteristics.charisme.modifier"] * 3;
    return formData;
  }

  static computeModifiers(formData){
    formData["system.characteristics.force.modifier"] = Math.floor(formData["system.characteristics.force.value"]/2) - 5;
    formData["system.characteristics.dexterite.modifier"] = Math.floor(formData["system.characteristics.dexterite.value"]/2) - 5;
    formData["system.characteristics.constitution.modifier"] = Math.floor(formData["system.characteristics.constitution.value"]/2) - 5;
    formData["system.characteristics.astuce.modifier"] = Math.floor(formData["system.characteristics.astuce.value"]/2) - 5;
    formData["system.characteristics.intelligence.modifier"] = Math.floor(formData["system.characteristics.intelligence.value"]/2) - 5;
    formData["system.characteristics.perception.modifier"] = Math.floor(formData["system.characteristics.perception.value"]/2) - 5;
    formData["system.characteristics.volonte.modifier"] = Math.floor(formData["system.characteristics.volonte.value"]/2) - 5;
    formData["system.characteristics.charisme.modifier"] = Math.floor(formData["system.characteristics.charisme.value"]/2) - 5;
    return formData;
  }

  static onItemEquipped(event) {
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

  static onAttackRoll(event) {
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

  static onItemControl(event) {
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

  static onRessourceRoll(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const chatLabel = button?.getAttribute("data-label");

    const rollData = this.actor.getRollData();
    let formula = button?.getAttribute("data-formula");

    let r = new Roll(formula, rollData);
      return r.toMessage({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `${chatLabel}`
    });
  }

  static onDamageRoll(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const isPhysicalArmor = (button?.getAttribute("isPhysicalArmor") === "true");
    const useArmor = (this.actor.system.armorUsedFor.deflect === false);
    const armor = (isPhysicalArmor) ? this.actor.system.physicalArmor : this.actor.system.energeticArmor;

    const rollData = this.actor.getRollData();
    let formula = "";
    if(armor != 0 && useArmor) formula = armor + "d6 + " + this.actor.system.characteristics.constitution.modifier + "d6";
    else formula = this.actor.system.characteristics.constitution.modifier + "d6";

    let r = new Roll(formula, rollData);
      return r.toMessage({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `Absorption de dégats`
    });
  }

  static async onSurviveRoll(event){
    let r = new Roll("2d10 + @characteristics.constitution.modifier + @characteristics.constitution.tempModifier + @characteristics.constitution.tempValue", this.actor.getRollData());
    await r.evaluate();

    let status = (r.total >= 18) ? "Survie" : "Mort";

    return r.toMessage({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `<h2>${status}</h2>`
    });
  }

  static async onStunRoll(event){
    let r = new Roll("2d6 + @characteristics.volonte.modifier + @characteristics.constitution.modifier", this.actor.getRollData());
    await r.evaluate();

    let stun = this.actor.system.stun.value;
    let status = (r.total >= stun) ? "Reste conscient" : "Tombe inconscient";

    return r.toMessage({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `<h2>${status}</h2>`
    });
  }

  static async onLocationRoll(event) {
    let r = new Roll("2d6", this.actor.getRollData());
    await r.evaluate();

    let localisation = "";
    switch (r.total) {
      case 2:
        localisation = "Tête";
        break;
    
      case 3:
        localisation = "Main directrice";
        break;

      case 4:
        localisation = "Bras droit";
        break;
      
      case 5:
        localisation = "Main gauche";
        break;

      case 6:
        localisation = "Bras gauche";
        break;

      case 7:
        localisation = "Jambe droite";
        break;

      case 8:
        localisation = "Jambe gauche";
        break;

      case 9:
        localisation = "Ventre gauche";
        break;

      case 10:
        localisation = "Ventre droit";
        break;

      case 11:
        localisation = "Torse droit";
        break;

      case 12:
        localisation = "Coeur";
        break;
    }

    return r.toMessage({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `<h2>Localisation</h2><h3>${localisation}</h3>`
    });
  }

  static onSkillRoll(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const chatLabel = button?.getAttribute("data-label");

    const rollData = this.actor.getRollData();
    let formula = button?.getAttribute("data-formula");

    let r = new Roll(formula, rollData);
      return r.toMessage({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `${chatLabel}`
    });
  }
  /* -------------------------------------------- */

  /**
   * Return HTML for a new attribute to be applied to the form for submission.
   *
   * @param {Object} items  Keyed object where each item has a "type" and "value" property.
   * @param {string} index  Numeric index or key of the new attribute.
   * @param {string|boolean} group String key of the group, or false.
   *
   * @returns {string} Html string.
   */
  static getAttributeHtml(items, index, group = false) {
    // Initialize the HTML.
    let result = '<div style="display: none;">';
    // Iterate over the supplied keys and build their inputs (including whether they need a group key).
    for (let [key, item] of Object.entries(items)) {
      result = result + `<input type="${item.type}" name="system.attributes${group ? '.' + group : '' }.attr${index}.${key}" value="${item.value}"/>`;
    }
    // Close the HTML and return.
    return result + '</div>';
  }

  /* -------------------------------------------- */

  /**
   * Validate whether or not a group name can be used.
   * @param {string} groupName    The candidate group name to validate
   * @param {Document} document   The Actor or Item instance within which the group is being defined
   * @returns {boolean}
   */
  static validateGroup(groupName, document) {
    let groups = Object.keys(document.system.groups || {});
    let attributes = Object.keys(document.system.attributes).filter(a => !groups.includes(a));

    // Check for duplicate group keys.
    if ( groups.includes(groupName) ) {
      ui.notifications.error(game.i18n.localize("SIMPLE.NotifyGroupDuplicate") + ` (${groupName})`);
      return false;
    }

    // Check for group keys that match attribute keys.
    if ( attributes.includes(groupName) ) {
      ui.notifications.error(game.i18n.localize("SIMPLE.NotifyGroupAttrDuplicate") + ` (${groupName})`);
      return false;
    }

    // Check for reserved group names.
    if ( ["attr", "attributes"].includes(groupName) ) {
      ui.notifications.error(game.i18n.format("SIMPLE.NotifyGroupReserved", {key: groupName}));
      return false;
    }

    // Check for whitespace or periods.
    if ( groupName.match(/[\s|\.]/i) ) {
      ui.notifications.error(game.i18n.localize("SIMPLE.NotifyGroupAlphanumeric"));
      return false;
    }
    return true;
  }

  /* -------------------------------------------- */

  /**
   * Create new attributes.
   * @param {MouseEvent} event    The originating left click event
   * @param {Object} app          The form application object.
   * @private
   */
  static async createAttribute(event, app) {
    const a = event.currentTarget;
    const group = a.dataset.group;
    let dtype = a.dataset.dtype;
    const attrs = app.object.system.attributes;
    const groups = app.object.system.groups;
    const form = app.form;

    // Determine the new attribute key for ungrouped attributes.
    let objKeys = Object.keys(attrs).filter(k => !Object.keys(groups).includes(k));
    let nk = Object.keys(attrs).length + 1;
    let newValue = `attr${nk}`;
    let newKey = document.createElement("div");
    while ( objKeys.includes(newValue) ) {
      ++nk;
      newValue = `attr${nk}`;
    }

    // Build options for construction HTML inputs.
    let htmlItems = {
      key: {
        type: "text",
        value: newValue
      }
    };

    // Grouped attributes.
    if ( group ) {
      objKeys = attrs[group] ? Object.keys(attrs[group]) : [];
      nk = objKeys.length + 1;
      newValue = `attr${nk}`;
      while ( objKeys.includes(newValue) ) {
        ++nk;
        newValue =  `attr${nk}`;
      }

      // Update the HTML options used to build the new input.
      htmlItems.key.value = newValue;
      htmlItems.group = {
        type: "hidden",
        value: group
      };
      htmlItems.dtype = {
        type: "hidden",
        value: dtype
      };
    }
    // Ungrouped attributes.
    else {
      // Choose a default dtype based on the last attribute, fall back to "String".
      if (!dtype) {
        let lastAttr = document.querySelector('.attributes > .attributes-group .attribute:last-child .attribute-dtype')?.value;
        dtype = lastAttr ? lastAttr : "String";
        htmlItems.dtype = {
          type: "hidden",
          value: dtype
        };
      }
    }

    // Build the form elements used to create the new grouped attribute.
    newKey.innerHTML = EntitySheetHelper.getAttributeHtml(htmlItems, nk, group);

    // Append the form element and submit the form.
    newKey = newKey.children[0];
    form.appendChild(newKey);
    await app._onSubmit(event);
  }

  /**
   * Delete an attribute.
   * @param {MouseEvent} event    The originating left click event
   * @param {Object} app          The form application object.
   * @private
   */
  static async deleteAttribute(event, app) {
    const a = event.currentTarget;
    const li = a.closest(".attribute");
    if ( li ) {
      li.parentElement.removeChild(li);
      await app._onSubmit(event);
    }
  }

  /* -------------------------------------------- */

  /**
   * Create new attribute groups.
   * @param {MouseEvent} event    The originating left click event
   * @param {Object} app          The form application object.
   * @private
   */
  static async createAttributeGroup(event, app) {
    const a = event.currentTarget;
    const form = app.form;
    let newValue = $(a).siblings('.group-prefix').val();
    // Verify the new group key is valid, and use it to create the group.
    if ( newValue.length > 0 && EntitySheetHelper.validateGroup(newValue, app.object) ) {
      let newKey = document.createElement("div");
      newKey.innerHTML = `<input type="text" name="system.groups.${newValue}.key" value="${newValue}"/>`;
      // Append the form element and submit the form.
      newKey = newKey.children[0];
      form.appendChild(newKey);
      await app._onSubmit(event);
    }
  }

  /* -------------------------------------------- */

  /**
   * Delete an attribute group.
   * @param {MouseEvent} event    The originating left click event
   * @param {Object} app          The form application object.
   * @private
   */
  static async deleteAttributeGroup(event, app) {
    const a = event.currentTarget;
    let groupHeader = a.closest(".group-header");
    let groupContainer = groupHeader.closest(".group");
    let group = $(groupHeader).find('.group-key');
    // Create a dialog to confirm group deletion.
    new Dialog({
      title: game.i18n.localize("SIMPLE.DeleteGroup"),
      content: `${game.i18n.localize("SIMPLE.DeleteGroupContent")} <strong>${group.val()}</strong>`,
      buttons: {
        confirm: {
          icon: '<i class="fas fa-trash"></i>',
          label: game.i18n.localize("Yes"),
          callback: async () => {
            groupContainer.parentElement.removeChild(groupContainer);
            await app._onSubmit(event);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("No"),
        }
      }
    }).render(true);
  }

  /* -------------------------------------------- */

  /**
   * Update attributes when updating an actor object.
   * @param {object} formData       The form data object to modify keys and values for.
   * @param {Document} document     The Actor or Item document within which attributes are being updated
   * @returns {object}              The updated formData object.
   */
  static updateAttributes(formData, document) {
    let groupKeys = [];

    // Handle the free-form attributes list
    const formAttrs = foundry.utils.expandObject(formData)?.system?.attributes || {};
    const attributes = Object.values(formAttrs).reduce((obj, v) => {
      let attrs = [];
      let group = null;
      // Handle attribute keys for grouped attributes.
      if ( !v["key"] ) {
        attrs = Object.keys(v);
        attrs.forEach(attrKey => {
          group = v[attrKey]['group'];
          groupKeys.push(group);
          let attr = v[attrKey];
          const k = this.cleanKey(v[attrKey]["key"] ? v[attrKey]["key"].trim() : attrKey.trim());
          delete attr["key"];
          // Add the new attribute if it's grouped, but we need to build the nested structure first.
          if ( !obj[group] ) {
            obj[group] = {};
          }
          obj[group][k] = attr;
        });
      }
      // Handle attribute keys for ungrouped attributes.
      else {
        const k = this.cleanKey(v["key"].trim());
        delete v["key"];
        // Add the new attribute only if it's ungrouped.
        if ( !group ) {
          obj[k] = v;
        }
      }
      return obj;
    }, {});

    // Remove attributes which are no longer used
    for ( let k of Object.keys(document.system.attributes) ) {
      if ( !attributes.hasOwnProperty(k) ) attributes[`-=${k}`] = null;
    }

    // Remove grouped attributes which are no longer used.
    for ( let group of groupKeys) {
      if ( document.system.attributes[group] ) {
        for ( let k of Object.keys(document.system.attributes[group]) ) {
          if ( !attributes[group].hasOwnProperty(k) ) attributes[group][`-=${k}`] = null;
        }
      }
    }

    // Re-combine formData
    formData = Object.entries(formData).filter(e => !e[0].startsWith("system.attributes")).reduce((obj, e) => {
      obj[e[0]] = e[1];
      return obj;
    }, {_id: document.id, "system.attributes": attributes});

    return formData;
  }

  /* -------------------------------------------- */

  /**
   * Update attribute groups when updating an actor object.
   * @param {object} formData       The form data object to modify keys and values for.
   * @param {Document} document     The Actor or Item document within which attributes are being updated
   * @returns {object}              The updated formData object.
   */
  static updateGroups(formData, document) {
    const formGroups = foundry.utils.expandObject(formData).system.groups || {};
    const documentGroups = Object.keys(document.system.groups || {});

    // Identify valid groups submitted on the form
    const groups = Object.entries(formGroups).reduce((obj, [k, v]) => {
      const validGroup = documentGroups.includes(k) || this.validateGroup(k, document);
      if ( validGroup )  obj[k] = v;
      return obj;
    }, {});

    // Remove groups which are no longer used
    for ( let k of Object.keys(document.system.groups)) {
      if ( !groups.hasOwnProperty(k) ) groups[`-=${k}`] = null;
    }

    // Re-combine formData
    formData = Object.entries(formData).filter(e => !e[0].startsWith("system.groups")).reduce((obj, e) => {
      obj[e[0]] = e[1];
      return obj;
    }, {_id: document.id, "system.groups": groups});
    return formData;
  }

  /* -------------------------------------------- */

  /**
   * Ensure the resource values are within the specified min and max.
   * @param {object} attrs  The Document's attributes.
   */
  static clampResourceValues(attrs) {
    const flat = foundry.utils.flattenObject(attrs);
    for ( const [attr, value] of Object.entries(flat) ) {
      const parts = attr.split(".");
      if ( parts.pop() !== "value" ) continue;
      const current = foundry.utils.getProperty(attrs, parts.join("."));
      if ( current?.dtype !== "Resource" ) continue;
      foundry.utils.setProperty(attrs, attr, Math.clamped(value, current.min || 0, current.max || 0));
    }
  }

  /* -------------------------------------------- */

  /**
   * Clean an attribute key, emitting an error if it contained invalid characters.
   * @param {string} key  The key to clean.
   * @returns {string}
   */
  static cleanKey(key) {
    const clean = key.replace(/[\s.]/g, "");
    if ( clean !== key ) ui.notifications.error("SIMPLE.NotifyAttrInvalid", { localize: true });
    return clean;
  }
}
