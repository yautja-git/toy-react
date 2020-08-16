const RENDER_TO_DOM = Symbol("render to dom")

export class Component {
    constructor() {
        this.props = Object.create(null);
        this.children = [];
        this._root = null;
        this._range = null;
    }
    setAttribute(name, value) {
        this.props[name] = value
    }
    appendChild(component) {
        this.children.push(component)
    }
    get vdom() {
        return this.render().vdom
    }
    
    [RENDER_TO_DOM](range) {
        this._range = range
        this._vdom=this.vdom
        this._vdom[RENDER_TO_DOM](range)
    }
    update(){
        let isSameNode=(oldNode,newNode)=>{
            if(oldNode.type!==newNode.type){
                return false
            }
            for (let name in newNode.props){
                if(newNode.props[name]!==oldNode.props[name]){
                    return false
                }
            }
            if(Object.keys(oldNode.props).length>Object.keys(newNode.props).length){
                return false
            }

            if(newNode.type==='#text'){
                if(newNode.content!==oldNode.content){
                    return false
                }
            }

            return true
        }
        let update=(oldNode,newNode)=>{
            //type,props,children
            //#text content
            if(!isSameNode(oldNode,newNode)){
                newNode[RENDER_TO_DOM](oldNode._range)
                return
            }

            newNode._range=oldNode._range

            let newchildren=newNode.vchildren
            let oldchildren=oldNode.vchildren

            if(!newchildren||!newchildren.length){
                return
            }

            let tailRange=oldchildren[oldchildren.length-1]._range


            for(let i=0;i<newchildren.length;i++){
                let newChild=newchildren[i]
                let oldChild=oldchildren[i]
                if(i<oldchildren.length){
                    update(oldChild,newChild)
                }else{
                    let range=document.createRange()
                    range.setStart(tailRange.endContainer,tailRange.endOffset)
                    range.setEnd(tailRange.endContainer,tailRange.endOffset)
                    newChild[RENDER_TO_DOM](range)
                    tailRange=range
                }
            }
        }
        let vdom=this.vdom
        update(this._vdom,vdom)
        this._vdom=vdom
    }
    
    setState(newState) {
        if (this.state === null || typeof (this.state) !== 'object') {
            this.state = newState
            this.rerender()
            return
        }
        let merge = (oldState, newState) => {
            for (const key in newState) {
                if (oldState[key] === null || typeof (oldState[key]) !== 'object') {
                    oldState[key] = newState[key]
                } else {
                    merge(oldState[key], newState[key])
                }
            }
        }
        merge(this.state, newState)
        this.update()
    }
}
class ElementWrapper extends Component {
    constructor(type) {
        super(type)
        this.type = type;
        this.root = document.createElement(type)
    }

    get vdom() {
        this.vchildren=this.children.map(child=>child.vdom)
        return this
    }
    [RENDER_TO_DOM](range) {
        this._range=range
        let root = document.createElement(this.type)
        for (const name in this.props) {
            let value = this.props[name]
            if (name.match(/^on([\s\S]+)/)) {
                root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
            } else {
                if (name === 'className') {
                    root.setAttribute('class', value)
                }
                root.setAttribute(name, value)
            }
        }

        if(!this.vchildren){
          this.vchildren=this.children.map(child=>child.vdom)  
        }
        

        for (const child of this.vchildren) {
            let childRange = document.createRange()
            childRange.setStart(root, root.childNodes.length);
            childRange.setEnd(root, root.childNodes.length)
            child[RENDER_TO_DOM](childRange)
        }
        replaceContent(range,root)
    }
}

class TextWrapper extends Component {
    constructor(content) {
        super(content)
        this.content = content
        this.type = '#text'
    }
    get vdom() {
        return this
    }
    [RENDER_TO_DOM](range) {
        this._range=range
        let root = document.createTextNode(this.content)

        replaceContent(range,root)
    }
}

function replaceContent(range,node){
    range.insertNode(node)
    range.setStartAfter(node);
    range.deleteContents()

    range.setStartBefore(node)
    range.setEndAfter(node)
}


export function createElement(type, attributes, ...children) {
    let element
    if (typeof (type) === 'string') {
        element = new ElementWrapper(type)
    } else {
        element = new type
    }

    for (const key in attributes) {
        element.setAttribute(key, attributes[key])
    }
    let insertChildren = (children) => {
        for (const child of children) {
            if (child === null) {
                continue
            }
            if (typeof (child) === 'string') {
                child = new TextWrapper(child)
            }
            if ((typeof (child) === 'object') && (child instanceof Array)) {
                insertChildren(child)
            } else {
                element.appendChild(child)
            }
        }
    }
    insertChildren(children)

    console.log(element);
    return element
}

export function render(component, parentElement) {
    let range = document.createRange()
    range.setStart(parentElement, 0);
    range.setEnd(parentElement, parentElement.childNodes.length)
    range.deleteContents()
    component[RENDER_TO_DOM](range)
}

