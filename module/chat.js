import {fromUuidSynchronous, htmlFindClosingBracket} from "./utils.js";
import {SW5E} from "./config.js";

/**
 * Highlight critical success or failure on d20 rolls.
 * @param {ChatMessage} message  Message being prepared.
 * @param {HTMLElement} html     Rendered contents of the message.
 * @param {object} data          Configuration data passed to the message.
 */
export const highlightCriticalSuccessFailure = function (message, html, data) {
    if (!message.isRoll || !message.isContentVisible) return;

    // Highlight rolls where the first part is a d20 roll
    const roll = message.roll;
    if (!roll.dice.length) return;
    const d = roll.dice[0];

    // Ensure it is an un-modified d20 roll
    const isD20 = d.faces === 20 && d.values.length === 1;
    if (!isD20) return;
    const isModifiedRoll = "success" in d.results[0] || d.options.marginSuccess || d.options.marginFailure;
    if (isModifiedRoll) return;

    // Highlight successes and failures
    const critical = d.options.critical || 20;
    const fumble = d.options.fumble || 1;
    if (d.total >= critical) html.find(".dice-total").addClass("critical");
    else if (d.total <= fumble) html.find(".dice-total").addClass("fumble");
    else if (d.options.target) {
        if (roll.total >= d.options.target) html.find(".dice-total").addClass("success");
        else html.find(".dice-total").addClass("failure");
    }
};

/* -------------------------------------------- */

/**
 * Optionally hide the display of chat card action buttons which cannot be performed by the user
 * @param {ChatMessage} message  Message being prepared.
 * @param {HTMLElement} html     Rendered contents of the message.
 * @param {object} data          Configuration data passed to the message.
 */
export const displayChatActionButtons = function (message, html, data) {
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
};

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
export const addChatMessageContextOptions = function (html, options) {
    let canApplyDamage = (li) => {
        const message = game.messages.get(li.data("messageId"));
        return message?.isRoll && message?.isContentVisible && canvas.tokens?.controlled.length;
    };
    let secretsShown = (li) => {
        const message = game.messages.get(li.data("messageId"));
        if (!message?.isContentVisible) return null;
        const actorId = message.data.content.match(/data-actor-id="(?<id>\w+?)"/)[1];
        const itemId = message.data.content.match(/data-item-id="(?<id>\w+?)"/)[1];
        if (!(actorId && itemId)) return null;
        const item = fromUuidSynchronous(`Actor.${actorId}.Item.${itemId}`);
        if (item?.data?.description?.value?.search(/class=('|")secret('|")/) === -1) return null;
        return message.getFlag("sw5e", "secretsShown") || false;
    };
    options.push(
        {
            name: game.i18n.localize("SW5E.ChatContextDamageWithResist"),
            icon: '<i class="fas fa-user-minus"></i>',
            condition: canApplyDamage,
            callback: (li) => applyChatCardDamage(li, null)
        },
        {
            name: game.i18n.localize("SW5E.ChatContextDamage"),
            icon: '<i class="fas fa-user-minus"></i>',
            condition: canApplyDamage,
            callback: (li) => applyChatCardDamage(li, 1)
        },
        {
            name: game.i18n.localize("SW5E.ChatContextHealing"),
            icon: '<i class="fas fa-user-plus"></i>',
            condition: canApplyDamage,
            callback: (li) => applyChatCardDamage(li, -1)
        },
        {
            name: game.i18n.localize("SW5E.ChatContextDoubleDamage"),
            icon: '<i class="fas fa-user-injured"></i>',
            condition: canApplyDamage,
            callback: (li) => applyChatCardDamage(li, 2)
        },
        {
            name: game.i18n.localize("SW5E.ChatContextHalfDamage"),
            icon: '<i class="fas fa-user-shield"></i>',
            condition: canApplyDamage,
            callback: (li) => applyChatCardDamage(li, 0.5)
        },
        {
            name: game.i18n.localize("SW5E.ChatContextShowSecret"),
            icon: '<i class="fas fa-user-secret"></i>',
            condition: (li) => { return secretsShown(li) === false },
            callback: (li) => toggleSecrets(li)
        },
        {
            name: game.i18n.localize("SW5E.ChatContextHideSecret"),
            icon: '<i class="fas fa-user-secret"></i>',
            condition: (li) => { return secretsShown(li) === true },
            callback: (li) => toggleSecrets(li)
        }
    );
    return options;
};

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
    const roll = message.roll;

    // If no multiplier is received, pass extra data to automatically calculate it based on resistances
    const extraData = {};
    if (multiplier === null) {
        multiplier = 1;
        // Get damage type from the roll flavor
        const flavor = message.roll.options.flavor;
        const regexp = /[(]([^()]*)[)]/g;
        const types = [...flavor.matchAll(regexp)].map(i => i[1].split(', ')).flat(1);
        const damageTypes = types.filter(d => Object.keys(SW5E.damageTypes).includes(d.toLowerCase()));
        if (damageTypes.length) extraData.damageType = damageTypes[0];
        // Get item uuid from the message data
        const actorId = message.data.speaker.actor;
        const actor = fromUuidSynchronous(`Actor.${actorId}`);
        if (actor) {
            const itemId = message.data.flags.sw5e.roll.itemId;
            const item = actor.data.items.get(itemId);
            if (item) extraData.itemUuid = item.uuid;
        }
        // MRE rolls each damage type separately
        if (message.data.flags['mre-dnd5e']) {
            const damages = [];
            const rolls = message.data.flags['mre-dnd5e'].rolls;
            for (let i = 0; i < rolls.length; i++) {
                damages.push({
                    ammount: rolls[i].total,
                    type: damageTypes[i]
                });
            }
            return Promise.all(
                canvas.tokens.controlled.map((t) => {
                    const a = t.actor;
                    return a.applyDamages(damages, extraData.itemUuid);
                })
            );
        }
    }

    return Promise.all(
        canvas.tokens.controlled.map((t) => {
            const a = t.actor;
            return a.applyDamage(roll.total, multiplier, extraData);
        })
    );
}

/* -------------------------------------------- */

/**
 * Reveal or Hide secret block in a message
 *
 * @param {HTMLElement} li      The chat entry
 * @returns {Promise}
 */
function toggleSecrets(li) {
    const message = game.messages.get(li.data("messageId"));
    const secretsShown = message.getFlag("sw5e", "secretsShown");

    const actorId = message.data.content.match(/data-actor-id="(?<id>\w+?)"/)[1];
    const itemId = message.data.content.match(/data-item-id="(?<id>\w+?)"/)[1];
    const item = fromUuidSynchronous(`Actor.${actorId || 'invalid'}.Item.${itemId || 'invalid'}`);

    let desc = item?.data?.data?.description?.value;
    if (!desc) return;
    let start = desc?.search(/<section class=('|")secret('|")>/);
    if (start === -1) return;
    let [blockStart, blockEnd, contentStart, contentEnd] = htmlFindClosingBracket(desc, start);
    if (secretsShown) {
        if (blockStart === 0) desc = desc.substring(blockEnd);
        else desc = desc.substring(0, blockStart) + desc.substring(blockEnd);
    } else {
        if (blockStart === 0) desc = desc.substring(contentStart, contentEnd) + desc.substring(blockEnd);
        else desc = desc.substring(0, blockStart) + desc.substring(contentStart, contentEnd) + desc.substring(blockEnd);
    }


    let cont = message?.data?.content;
    if (!cont) return;
    start = cont?.search(/<div class=('|")card-content('|")>/);
    if (start === -1) return;
    [blockStart, blockEnd, contentStart, contentEnd] = htmlFindClosingBracket(cont, start);
    cont = cont.substring(0, contentStart) + desc + cont.substring(contentEnd);
    message.update({content: cont});
    message.setFlag("sw5e", "secretsShown", !secretsShown);
}

/* -------------------------------------------- */
