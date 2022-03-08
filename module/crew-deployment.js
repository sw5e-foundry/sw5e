import {fromUuidSynchronous} from "./helpers.js";

export default function CrewDeployment(doc, ship) {

    //Get the list of deployed party members.
    const deployedParty = new Set();
    if (doc.crew.items !== null)
        for (let c of doc.crew.items)
            deployedParty.add(c.uuid);
    if (doc.pilot.uuid !== null)
        deployedParty.add(doc.pilot.uuid);

    // Get the list of deployment features for each deployed actor.
    // Add the deployment features to the Starship actor.

    const values = Array.from(ship.data.items.values());
    for (const uuid of deployedParty.values()) {
        const actor = fromUuidSynchronous(uuid);
        const itemsFromActor = actor.data.items.filter(t => t.data.type == "deploymentfeature");
        for(const item of itemsFromActor) {
            if (values.some(n => n.data.name === item.data.name)) continue;
            else {
                let newItem = [];
                newItem.push(item);
                await ship.createEmbeddedDocuments("Item", newItem.map(m => m.toObject()));
            }
        }
    }
}
