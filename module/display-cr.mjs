export default function DisplayCR(html, compendium) {

let findActors = html.find(".directory-item.document.actor");
let actors = findActors;

if(typeof compendium == "undefined") {

    for(let i of actors) {
        let id = i.getAttribute('data-document-id');
        if(!id) return
        let actor = game.actors.get(id);
        let cr = actor.system.details.cr;
        if (typeof cr !== "undefined") {
            let p = document.createElement("h4");
            p.classList.add("document-name");
            p.style.textAlign = "right";
            p.style.marginRight = "10px";
            p.textContent = "CR: " + cr;
            i.appendChild(p);
        }
    }
}

else if (compendium.collection.title == "Monsters") {
    
    for(let i of actors) {
        let id = i.getAttribute('data-document-id');
        if(!id) return
        let pack = compendium.collection;

        async function getActor() {
            let actor = await pack.getDocument(id);
            let cr = actor.system.details.cr;
            if (typeof cr !== "undefined") {
                let p = document.createElement("h4");
                p.classList.add("document-name");
                p.style.textAlign = "right";
                p.style.marginRight = "10px";
                p.style.maxWidth = "85px";
                p.textContent = "CR: " + cr;
                i.appendChild(p);
            }
        }
        getActor();
}

}

}
