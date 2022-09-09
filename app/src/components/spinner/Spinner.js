import React from "react";

const Spinner = ({active}) => {

    return (
        <div className="spinner-wrapper">
            <div className={active ? 'spinner-border' : 'd-none'} role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    )
};

export default Spinner;