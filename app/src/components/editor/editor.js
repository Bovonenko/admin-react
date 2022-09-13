import '../../helpers/iframeLoader.js';
import React, {Component} from "react";
import axios from "axios";
import DOMHelper from '../../helpers/dom-helper.js';
import EditorText from '../editor-text';
import UIkit from 'uikit';
import Spinner from '../spinner';

export default class Editor extends Component {
    constructor() {
        super();
        this.currentPage = "index.html";
        this.state = {
            pageList: [],
            newPageName: '',
            loading: true
        }
        this.createNewPage = this.createNewPage.bind(this);
        this.save = this.save.bind(this);
        this.isLoaded = this.isLoaded.bind(this);
        this.isLoading = this.isLoading.bind(this);
    }

    componentDidMount() {
        this.init(this.currentPage);
    }

    init(page) {
        this.iframe = document.querySelector('iframe');
        this.open(page, this.isLoaded);
        this.loadPageList();
    }

    open(page, cb) {
        this.currentPage = page;

        axios
            .get(`../${page}?rnd=${Math.random().toString().substring(2)}`)   // get html document as a string
            .then(res => DOMHelper.parseStrToDOM(res.data))  // convert str to dom structure
            .then(DOMHelper.wrapTextNodes)  // find all textNodes on the page and wrap them, returns editable document
            .then(dom => {                 
                this.virtualDom = dom;      // save clean copy
                return dom;
            })
            .then(DOMHelper.serializeDOMToString)  // converts dom back to string to post it on server
            .then(html => axios.post('./api/saveTempPage.php', {html}))  // creates new page in folder
            .then(() => this.iframe.load('../temp.html'))   // that we can open now in Iframe
            .then(() => this.enableEditing())  // enable editing the page when iframe is ready
            .then(() => this.injectStyles())
            .then(cb)
    }

    save(onSuccess, onError) {
        this.isLoading();
        const newDom = this.virtualDom.cloneNode(this.virtualDom);
        DOMHelper.unwrapTextNodes(newDom);
        const html = DOMHelper.serializeDOMToString(newDom);
        console.log('saved')
        axios
            .post("./api/savePage.php", {pageName: this.currentPage, html})
            .then(onSuccess)
            .catch(onError)
            .finally(this.isLoaded)
    }

    enableEditing() {
        this.iframe.contentDocument.body.querySelectorAll('text-editor').forEach(element => {
            const id = element.getAttribute('nodeid');
            const virtualElement = this.virtualDom.body.querySelector(`[nodeid="${id}"]`)

            new EditorText(element, virtualElement); 
        });
    }

    injectStyles() {
        const style = this.iframe.contentDocument.createElement('style');
        style.innerHTML = `
            text-editor:hover {
                outline: 3px solid orange;
                outline-offset: 8px;
            }
            text-editor:focus {
                outline: 3px solid red;
                outline-offset: 8px;
            }
        `;
        this.iframe.contentDocument.head.appendChild(style);
    }

    loadPageList() {
        axios
            .get('./api')
            .then(res => this.setState({pageList: res.data}))
    }

    createNewPage() {
        axios
            .post('./api/createNewPage.php', {"name": this.state.newPageName})
            .then(this.loadPageList())
            .catch(() => alert('This file alreardy exists'));
    }

    deletePage(page) {
        axios
            .post('./api/deletePage.php', {"name": page})
            .then(this.loadPageList())
            .catch(() => alert('This file wasn\'t found'));
    }

    isLoading() {
        this.setState({
            loading: true
        })
    }

    isLoaded() {
        this.setState({
            loading: false
        })
    }

    render() {
        const {loading} = this.state;
        const modal = true;
        let spinner;

        spinner = loading ? <Spinner active/> : null;
        
        return(
            <>
                <iframe src={this.currentPage} frameBorder="0"></iframe>

                {spinner}

                <div className="panel">
                    <button className="uk-button uk-button-primary" uk-toggle="target: #modal-save">Save</button>
                </div>

                <div id="modal-save" uk-modal={modal.toString()} container='false'>
                    <div className="uk-modal-dialog uk-modal-body">
                        <h2 className="uk-modal-title">Saving</h2>
                        <p>Are you sure you want to save changings?</p>
                        <p className="uk-text-right">
                            <button className="uk-button uk-button-default uk-modal-close" type="button">Cancel</button>
                            <button 
                                className="uk-button uk-button-primary uk-modal-close" 
                                type="button"
                                onClick={() => this.save(() => {
                                    UIkit.notification({message: 'Saved successful', status: 'success'});
                                },
                                () => {
                                    UIkit.notification({message: 'Save Error', status: 'danger'});
                                })
                                }>Save</button>
                        </p>
                    </div>
                </div>
            </>
        )
    }
}