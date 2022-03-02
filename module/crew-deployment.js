export default function CrewDeployment(doc, ship) {


//Get the list of deployed party members.

const deployedParty = [];
if (doc.coord.uuid != null) {
    deployedParty.push(doc.coord.uuid);
}

if (doc.uuid != null) {
    deployedParty.push(doc.gunner.uuid);
}

if (doc.gunner.items != null) {
    for (let g of doc.gunner.items) {
        deployedParty.push(g.uuid);
    }
}

if (doc.mechanic.uuid != null) {
    deployedParty.push(doc.mechanic.uuid);
}

if (doc.operator.uuid != null) {
    deployedParty.push(doc.operator.uuid);
}

if (doc.pilot.uuid != null) {
    deployedParty.push(doc.pilot.uuid);
}

if (doc.technician.uuid != null) {
    deployedParty.push(doc.technician.uuid);
}   

//Filter for only unique actors.
function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

let deployments = deployedParty.filter(onlyUnique);

// Get the list of deployment features for each deployed actor.
// Add the deployment features to the Starship actor.

async function addItems() {
    const values = Array.from(ship.data.items.values());
    for (let p of deployments) {
        if (typeof p !== "undefined") {        
            let actorid = p.split('.');
            let actor = game.actors.get(actorid[1]);
            let itemsFromActor = actor.data.items.filter(t => t.data.type == "deploymentfeature");
            console.log(itemsFromActor);
            for(let i of itemsFromActor) {
                if (values.some(n => n.data.name === i.data.name)) {
                    continue;
                }
                else {
                    let newItem = [];
                    newItem.push(i);
                    console.log(newItem)
                    await ship.createEmbeddedDocuments("Item", newItem.map(m => m.toObject()));
                }
            }
        }
    }
}
    addItems();        

}
