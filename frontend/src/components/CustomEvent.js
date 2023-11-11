import React from 'react';

const customEvent = (props) => {
    console.log(props);
    var start_m = Number(props.start.format("m"));
    var end_m = Number(props.end.format("m"));
    var marginTop = 50 * start_m / 60;
    var marginBottom = 50 * (60 - end_m) / 60;
    
    return (
        <div className="customEvent" style={{marginTop: marginTop, height: "calc(100% - " + marginBottom + "px)"}}>
            <div className="small-text">{props.value}</div>
        </div>
    );
};

export default customEvent;