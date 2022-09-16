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
import EditorMeta from '../editor-meta';
import EditorImages from '../editor-images';
import Login from '../login';

export default class Editor extends Component {
    constructor() {
        super();
        this.currentPage = "index.html";
        this.state = {
            pageList: [],
            backupsList: [],
            newPageName: '',
            loading: true,
            auth: false,
            loginError: false,
            loginLengthError: false
        };

        this.save = this.save.bind(this);
        this.isLoaded = this.isLoaded.bind(this);
        this.isLoading = this.isLoading.bind(this);
        this.init = this.init.bind(this);
        this.login = this.login.bind(this);
        this.logout = this.logout.bind(this);
        this.restoreBackup = this.restoreBackup.bind(this);
    }

    componentDidMount() {
        this.checkAuth();
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.auth !== prevState.auth) {
            this.init(null, this.currentPage);
        }
    }

    checkAuth() {
        axios
            .get('./api/checkAuth.php')
            .then(res => {
                this.setState({
                    auth: res.data.auth
                })
            })
    }

    login(pass) {
        if (pass.length > 5) {
            axios
                .post('./api/login.php', {'password': pass})
                .then(res => {
                    this.setState({
                        auth: res.data.auth,
                        loginError: !res.data.auth,
                        loginLengthError: false
                    })
                })
        } else {
            this.setState({
                loginError: false,
                loginLengthError: true
            })
        }
    }

    logout() {
        axios
            .get("./api/logout.php")
            .then(() => {
                window.location.replace('/');
            })
    }
    
    init(e, page) {
        if (e) {
            e.preventDefault();
        }
        if (this.state.auth) {
            this.isLoading();
            this.iframe = document.querySelector('iframe');
            this.open(page, this.isLoaded);
            this.loadPageList();
            this.loadBackupsList();
        }
    }

    open(page, cb) {
        this.currentPage = page;

        axios
            .get(`../${page}?rnd=${Math.random().toString().substring(2)}`)   // get html document as a string
            .then(res => DOMHelper.parseStrToDOM(res.data))  // convert str to dom structure
            .then(DOMHelper.wrapTextNodes)  // find all textNodes on the page and wrap them, returns editable document
            .then(DOMHelper.wrapImages)  // find all images on the page and wrap them, returns editable document
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

    async save() {
        this.isLoading();
        const newDom = this.virtualDom.cloneNode(this.virtualDom);
        DOMHelper.unwrapTextNodes(newDom);
        DOMHelper.unwrapImages(newDom);
        const html = DOMHelper.serializeDOMToString(newDom);
        await axios
            .post("./api/savePage.php", {pageName: this.currentPage, html})
            .then(() => this.showNotifications('Saved successfully', 'success'))
            .catch(() => this.showNotifications('Problem Occurred While Saving Your Page', 'danger'))
            .finally(this.isLoaded);

        this.loadBackupsList();
        
    }

    enableEditing() {
        this.iframe.contentDocument.body.querySelectorAll('text-editor').forEach(element => {
            const id = element.getAttribute('nodeid');
            const virtualElement = this.virtualDom.body.querySelector(`[nodeid="${id}"]`)

            new EditorText(element, virtualElement); 
        });

        this.iframe.contentDocument.body.querySelectorAll('[editableimgid]').forEach(element => {
            const id = element.getAttribute('editableimgid');
            const virtualElement = this.virtualDom.body.querySelector(`[editableimgid="${id}"]`)

            new EditorImages(element, virtualElement, this.isLoading, this.isLoaded, this.showNotifications); 
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
            [editableimgid]:hover {
                outline: 3px solid orange;
                outline-offset: 8px;
            }
        `;
        this.iframe.contentDocument.head.appendChild(style);
    }

    showNotifications(message, status) {
        UIkit.notification({message, status})
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
        const {loading, pageList, backupsList, auth, loginError, loginLengthError} = this.state;
        const modal = true;
        let spinner;

        spinner = loading ? <Spinner active/> : null;
        
        if (!auth) {
            return <Login login={this.login} lengthErr={loginLengthError} logErr={loginError}/>
        }
        
        return(
            <>
                <iframe src='' frameBorder="0"></iframe>
                <input id="img-upload" type="file" accept="image/*" style={{display: 'none'}}></input>

                {spinner}

                <Panel />

                <ConfirmModal 
                    modal={modal} 
                    target={'modal-save'} 
                    method={this.save} 
                    text={{
                        title: 'Saving',
                        descr: 'Are you sure you want to save changings?',
                        btn: 'Save'
                    }}/>

                <ConfirmModal 
                    modal={modal} 
                    target={'modal-logout'} 
                    method={this.logout} 
                    text={{
                        title: 'Exit',
                        descr: 'Are you sure you want to exit?',
                        btn: 'Exit'
                    }}/>    
                    
                <ChooseModal data={pageList} modal={modal} target={'modal-open'} redirect={this.init} />
                <ChooseModal data={backupsList} modal={modal} target={'modal-backup'} redirect={this.restoreBackup} />
                {this.virtualDom ? <EditorMeta modal={modal} target={'modal-meta'} virtualDom={this.virtualDom} /> : false}
            </>
        )
    }
}