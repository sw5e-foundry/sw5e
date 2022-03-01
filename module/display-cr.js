export default function DisplayCR(html) {
    console.log("Rendering Actor Directory");
    let findActors = html.find(".directory-item.document.actor");
    let actors = findActors;

    for(let i of actors) {
        console.log(i);
        let id = i.getAttribute('data-document-id');
        if(!id) return
        let actor = game.actors.get(id);
        let cr = actor.data.data.details.cr;
        console.log(cr);
        if (typeof cr !== "undefined") {
            let p = document.createElement("h4");
            p.classList.add("document-name");
            p.style.textAlign = "right";
            p.style.marginRight = "10px";
            p.textContent = "CR: " + cr;
            console.log(p);
            i.appendChild(p);
        }
    }

}
