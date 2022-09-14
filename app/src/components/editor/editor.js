import '../../helpers/iframeLoader.js';
import React, {Component} from "react";
import axios from "axios";
import DOMHelper from '../../helpers/dom-helper.js';
import EditorText from '../editor-text';
import UIkit from 'uikit';
import Spinner from '../spinner';
import ConfirmModal from '../confirm-modal';
import ChooseModal from '../choose-modal';
import Panel from '../panel';

export default class Editor extends Component {
    constructor() {
        super();
        this.currentPage = "index.html";
        this.state = {
            pageList: [],
            backupsList: [],
            newPageName: '',
            loading: true
        };

        this.save = this.save.bind(this);
        this.isLoaded = this.isLoaded.bind(this);
        this.isLoading = this.isLoading.bind(this);
        this.init = this.init.bind(this);
        this.restoreBackup = this.restoreBackup.bind(this);
    }

    componentDidMount() {
        this.init(null, this.currentPage);
    }

    init(e, page) {
        if (e) {
            e.preventDefault();
        }
        this.isLoading();
        this.iframe = document.querySelector('iframe');
        this.open(page, this.isLoaded);
        this.loadPageList();
        this.loadBackupsList();
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
            .then(() => this.iframe.load('../asdfhiuyhxcv12432_asdf.html'))   // that we can open now in Iframe
            .then(() => axios.post('./api/deleteTempPage.php'))
            .then(() => this.enableEditing())  // enable editing the page when iframe is ready
            .then(() => this.injectStyles())
            .then(cb);

        this.loadBackupsList();

    }

    async save(onSuccess, onError) {
        this.isLoading();
        const newDom = this.virtualDom.cloneNode(this.virtualDom);
        DOMHelper.unwrapTextNodes(newDom);
        const html = DOMHelper.serializeDOMToString(newDom);
        console.log('saved')
        await axios
            .post("./api/savePage.php", {pageName: this.currentPage, html})
            .then(onSuccess)
            .catch(onError)
            .finally(this.isLoaded);

        this.loadBackupsList();
        
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
            .get('./api/pageList.php')
            .then(res => this.setState({pageList: res.data}))
    }

    loadBackupsList() {
        axios  
            .get('./backups/backups.json')
            .then(res => this.setState({backupsList: res.data.filter(backup => {
                return backup.page === this.currentPage;
            })}))
    }

    restoreBackup(e, backup) {
        if (e) {
            e.preventDefault();
        }
        UIkit.modal.confirm('Are you sure you want to restore the page from this backup? All unsaved changes will be lost!', {labels: {ok: 'Restore', cancel: "Cancel"}})
        .then(() => {
            this.isLoading();
            return axios
                .post('./api/restoreBackup.php', {"page": this.currentPage, 'file': backup})
        })
        .then(() => {
            this.open(this.currentPage, this.isLoaded);
        })
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
        const {loading, pageList, backupsList} = this.state;
        const modal = true;
        let spinner;

        console.log(backupsList)

        spinner = loading ? <Spinner active/> : null;
        
        return(
            <>
                <iframe src='' frameBorder="0"></iframe>

                {spinner}

                <Panel />

                <ConfirmModal modal={modal} target={'modal-save'} method={this.save} />
                <ChooseModal data={pageList} modal={modal} target={'modal-open'} redirect={this.init} />
                <ChooseModal data={backupsList} modal={modal} target={'modal-backup'} redirect={this.restoreBackup} />
            </>
        )
    }
}