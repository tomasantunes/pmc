import React from 'react';

const customEvent = (props) => {
    console.log(props);
    return (
        <div className="customEvent">
            <div className="small-text">{props.value}</div>
        </div>
    );
};

export default customEvent;