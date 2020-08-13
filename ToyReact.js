export let ToyReact={
    createElement(type,attributes,...children){
        let element=document.createElement(type)
        for (const key in attributes) {
            element.setAttribute(key,attributes[key])
        }
        for (const child of children) {
            element.append(child)
        }
        console.log(element);
        return element
    }
}

