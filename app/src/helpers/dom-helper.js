export default class DOMHelper {

    static serializeDOMToString(dom) {
        const serializer = new XMLSerializer();  
        return serializer.serializeToString(dom);
    }

    static parseStrToDOM(str) {
        const parser = new DOMParser();   // create instance of DomParser
        return parser.parseFromString(str, 'text/html');   // invoke DomParser method and pass to it 
    }                                                      // (what we need to parse, format),return html document

    static wrapTextNodes(dom) {
        // console.log(typeof dom.body);   // object
        const body = dom.body;          // reference on an object
        let textNodes = [];

        function recursy(element) {  // find all text on the page
            element.childNodes.forEach(node => {
                
                if(node.nodeName === '#text' && node.nodeValue.replace(/\s+/g, '').length > 0) {
                    textNodes.push(node);
                } else {
                    recursy(node);
                }
            })
        };

        recursy(body);
        
        textNodes.forEach((node, i) => {  // wrapp all textNodes to make them editable then
            const wrapper = dom.createElement('text-editor');
            node.parentNode.replaceChild(wrapper, node);
            wrapper.appendChild(node);
            wrapper.setAttribute('nodeid', i);  // give every node its own Id
        });

        return dom;
    } 

    static unwrapTextNodes(dom) {
        dom.body.querySelectorAll("text-editor").forEach(element => {
            element.parentNode.replaceChild(element.firstChild, element);
        });
    }
}