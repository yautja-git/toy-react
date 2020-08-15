
import { createElement,render,Component } from './ToyReact'

class MyComponent extends Component {
    render(){
        return <div>
            <h1>my component</h1>
            {this.children}
        </div>
    }
 }

// let a = <div name='a' id='ida'>
//             <span>aaa</span>
//             <span>22</span>
//             <span>33</span>
//         </div>

let a = <MyComponent name='a' id='ida'>
            <span>aaa</span>
            <span>22</span>
            <span>33</span>
        </MyComponent>

render(a,document.body)