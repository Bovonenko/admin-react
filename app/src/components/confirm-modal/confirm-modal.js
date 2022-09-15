import React from "react";

const ConfirmModal = ({modal, target, method}) => {
    return (
        <div id={target} uk-modal={modal.toString()} container='false'>
            <div className="uk-modal-dialog uk-modal-body">
                <h2 className="uk-modal-title">Saving</h2>
                <p>Are you sure you want to save changings?</p>
                <p className="uk-text-right">
                    <button className="uk-button uk-margin-small-right uk-button-default uk-modal-close" type="button">Cancel</button>
                    <button 
                        className="uk-button uk-button-primary uk-modal-close" 
                        type="button"
                        onClick={() => method()}>Save</button>
                </p>
            </div>
        </div>
    )
}

export default ConfirmModal;