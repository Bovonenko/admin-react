import React from "react";

const Panel = () => {
    return (
        <div className="panel">
            <button className="uk-button uk-button-primary uk-margin-small-right" uk-toggle="target: #modal-open">Open</button>
            <button className="uk-button uk-button-primary uk-margin-small-right" uk-toggle="target: #modal-save">Save</button>
            <button className="uk-button uk-button-primary uk-margin-small-right" uk-toggle="target: #modal-meta">Edit META</button>
            <button className="uk-button uk-button-default" uk-toggle="target: #modal-backup">Backups</button>
        </div>
    )
};

export default Panel;
