import { fromUuidSynchronous, htmlFindClosingBracket } from "../utils.mjs";

/**
 * Highlight critical success or failure on d20 rolls.
 * @param {ChatMessage} message  Message being prepared.
 * @param {HTMLElement} html     Rendered contents of the message.
 * @param {object} data          Configuration data passed to the message.
 */
export function highlightCriticalSuccessFailure(message, html, data) {
  if (!message.isRoll || !message.isContentVisible || !message.rolls.length) return;

  // Highlight rolls where the first part is a d20 roll
  let d20Roll = message.rolls.find(r => {
    const d0 = r.dice[0];
    return d0?.faces === 20 && d0?.values.length === 1;
  });
  if (!d20Roll) return;
  d20Roll = sw5e.dice.D20Roll.fromRoll(d20Roll);
  const d = d20Roll.dice[0];

  const isModifiedRoll = "success" in d.results[0] || d.options.marginSuccess || d.options.marginFailure;
  if (isModifiedRoll) return;

  // Highlight successes and failures
  if (d20Roll.isCritical) html.find(".dice-total").addClass("critical");
  else if (d20Roll.isFumble) html.find(".dice-total").addClass("fumble");
  else if (d.options.target) {
    if (d20Roll.total >= d.options.target) html.find(".dice-total").addClass("success");
    else html.find(".dice-total").addClass("failure");
  }
}

/* -------------------------------------------- */

/**
 * Optionally hide the display of chat card action buttons which cannot be performed by the user
 * @param {ChatMessage} message  Message being prepared.
 * @param {HTMLElement} html     Rendered contents of the message.
 * @param {object} data          Configuration data passed to the message.
 */
export function displayChatActionButtons(message, html, data) {
  const chatCard = html.find(".sw5e.chat-card");
  if (chatCard.length > 0) {
    const flavor = html.find(".flavor-text");
    if (flavor.text() === html.find(".item-name").text()) flavor.remove();

    // If the user is the message author or the actor owner, proceed
    let actor = game.actors.get(data.message.speaker.actor);
    if (actor && actor.isOwner) return;
    else if (game.user.isGM || data.author.id === game.user.id) return;

    // Otherwise conceal action buttons except for saving throw
    const buttons = chatCard.find("button[data-action]");
    buttons.each((i, btn) => {
      if (btn.dataset.action === "save") return;
      btn.style.display = "none";
    });
  }
}

/* -------------------------------------------- */

/**
 * This function is used to hook into the Chat Log context menu to add additional options to each message
 * These options make it easy to conveniently apply damage to controlled tokens based on the value of a Roll
 *
 * @param {HTMLElement} html    The Chat Message being rendered
 * @param {object[]} options    The Array of Context Menu options
 *
 * @returns {object[]}          The extended options Array including new context choices
 */
export function addChatMessageContextOptions(html, options) {
  let canApplyDamage = li => {
    const message = game.messages.get(li.data("messageId"));
    return message?.isRoll && message?.isContentVisible && canvas.tokens?.controlled.length;
  };
  let secretsShown = li => {
    const message = game.messages.get(li.data("messageId"));
    if (!message?.isContentVisible) return null;
    const actorId = message.content.match(/data-actor-id="(?<id>\w+?)"/)?.[1];
    const itemId = message.content.match(/data-item-id="(?<id>\w+?)"/)?.[1];
    if (!(actorId && itemId)) return null;
    const item = fromUuidSynchronous(`Actor.${actorId}.Item.${itemId}`);
    if (item?.system?.description?.value?.search(/class=('|")secret('|")/) === -1) return null;
    return message.getFlag("sw5e", "secretsShown") || false;
  };
  options.push(
    {
      name: game.i18n.localize("SW5E.ChatContextDamageWithResist"),
      icon: '<i class="fas fa-user-minus"></i>',
      condition: canApplyDamage,
      callback: li => applyChatCardDamage(li, null)
    },
    {
      name: game.i18n.localize("SW5E.ChatContextDamage"),
      icon: '<i class="fas fa-user-minus"></i>',
      condition: canApplyDamage,
      callback: li => applyChatCardDamage(li, 1)
    },
    {
      name: game.i18n.localize("SW5E.ChatContextHealing"),
      icon: '<i class="fas fa-user-plus"></i>',
      condition: canApplyDamage,
      callback: li => applyChatCardDamage(li, -1)
    },
    {
      name: game.i18n.localize("SW5E.ChatContextTempHP"),
      icon: '<i class="fas fa-user-clock"></i>',
      condition: canApplyDamage,
      callback: li => applyChatCardTemp(li)
    },
    {
      name: game.i18n.localize("SW5E.ChatContextDoubleDamage"),
      icon: '<i class="fas fa-user-injured"></i>',
      condition: canApplyDamage,
      callback: li => applyChatCardDamage(li, 2)
    },
    {
      name: game.i18n.localize("SW5E.ChatContextHalfDamage"),
      icon: '<i class="fas fa-user-shield"></i>',
      condition: canApplyDamage,
      callback: li => applyChatCardDamage(li, 0.5)
    },
    {
      name: game.i18n.localize("SW5E.ChatContextShowSecret"),
      icon: '<i class="fas fa-user-secret"></i>',
      condition: li => {
        return secretsShown(li) === false;
      },
      callback: li => toggleSecrets(li)
    },
    {
      name: game.i18n.localize("SW5E.ChatContextHideSecret"),
      icon: '<i class="fas fa-user-secret"></i>',
      condition: li => {
        return secretsShown(li) === true;
      },
      callback: li => toggleSecrets(li)
    }
  );
  return options;
}

/* -------------------------------------------- */

/**
 * Apply rolled dice damage to the token or tokens which are currently controlled.
 * This allows for damage to be scaled by a multiplier to account for healing, critical hits, or resistance
 *
 * @param {HTMLElement} li      The chat entry which contains the roll data
 * @param {number} multiplier   A damage multiplier to apply to the rolled damage.
 * @returns {Promise}
 */
function applyChatCardDamage(li, multiplier) {
  const message = game.messages.get(li.data("messageId"));
  const roll = message.rolls[0];

  // If no multiplier is received, pass extra data to automatically calculate it based on resistances
  const extraData = message.flags.sw5e.roll;
  if (multiplier === null) {
    multiplier = 1;
    // Get damage type from the roll flavor
    const damageTypes = extraData.damageTypes?.split(", ") ?? [];
    if (damageTypes.length) extraData.damageType = damageTypes[0];
    // MRE rolls each damage type separately
    if (message.flags["mre-dnd5e"]) {
      const damages = [];
      const rolls = message.flags["mre-dnd5e"].rolls;
      for (let i = 0; i < rolls.length; i++) {
        damages.push({
          amount: rolls[i].total,
          type: damageTypes[i]
        });
      }
      return Promise.all(
        canvas.tokens.controlled.map(t => {
          const a = t.actor;
          return a.applyDamages(damages, extraData.itemUuid);
        })
      );
    }
  }

  return Promise.all(
    canvas.tokens.controlled.map(t => {
      const a = t.actor;
      return a.applyDamage(roll.total, multiplier, extraData);
    })
  );
}

/* -------------------------------------------- */

/**
 * Apply rolled dice as temporary hit points to the controlled token(s).
 * @param {HTMLElement} li  The chat entry which contains the roll data
 * @returns {Promise}
 */
function applyChatCardTemp(li) {
  const message = game.messages.get(li.data("messageId"));
  const roll = message.rolls[0];
  return Promise.all(
    canvas.tokens.controlled.map(t => {
      const a = t.actor;
      return a.applyTempHP(roll.total);
    })
  );
}

/* -------------------------------------------- */

/**
 * Handle rendering of a chat message to the log
 * @param {ChatLog} app     The ChatLog instance
 * @param {jQuery} html     Rendered chat message HTML
 * @param {object} data     Data passed to the render context
 */
export function onRenderChatMessage(app, html, data) {
  displayChatActionButtons(app, html, data);
  highlightCriticalSuccessFailure(app, html, data);
  if (game.settings.get("sw5e", "autoCollapseItemCards")) html.find(".card-content").hide();
}

/* -------------------------------------------- */

/**
 * Reveal or Hide secret block in a message
 *
 * @param {HTMLElement} li      The chat entry
 * @returns {Promise|void}
 */
function toggleSecrets(li) {
  const message = game.messages.get(li.data("messageId"));
  const secretsShown = message.getFlag("sw5e", "secretsShown");

  const actorId = message.content.match(/data-actor-id="(?<id>\w+?)"/)[1];
  const itemId = message.content.match(/data-item-id="(?<id>\w+?)"/)[1];
  const item = fromUuidSynchronous(`Actor.${actorId || "invalid"}.Item.${itemId || "invalid"}`);

  let desc = item?.system?.description?.value;
  if (!desc) return;
  let start = desc?.search(/<section class=('|")secret('|")>/);
  if (start === -1) return;
  let [blockStart, blockEnd, contentStart, contentEnd] = htmlFindClosingBracket(desc, start);
  if (secretsShown) {
    if (blockStart === 0) desc = desc.substring(blockEnd);
    else desc = desc.substring(0, blockStart) + desc.substring(blockEnd);
  } else if (blockStart === 0) desc = desc.substring(contentStart, contentEnd) + desc.substring(blockEnd);
  else desc = desc.substring(0, blockStart) + desc.substring(contentStart, contentEnd) + desc.substring(blockEnd);

  let cont = message?.content;
  if (!cont) return;
  start = cont?.search(/<div class=('|")card-content('|")>/);
  if (start === -1) return;
  [blockStart, blockEnd, contentStart, contentEnd] = htmlFindClosingBracket(cont, start);
  cont = cont.substring(0, contentStart) + desc + cont.substring(contentEnd);
  message.update({ content: cont });
  message.setFlag("sw5e", "secretsShown", !secretsShown);
}
