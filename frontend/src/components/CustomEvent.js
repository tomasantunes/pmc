import React, {useEffect} from 'react';
import $ from 'jquery';

window.jQuery = $;
window.$ = $;
global.jQuery = $;
window.bootstrap = require('bootstrap');

const CustomEvent = (props) => {
    var start_m = Number(props.start.format("m"));
    var end_m = Number(props.end.format("m"));
    var marginTop = 50 * start_m / 60;
    var marginBottom = 50 * (60 - end_m) / 60;
    var start_t = props.start.format("HH:mm");
    var end_t = props.end.format("HH:mm");

    useEffect(() => {
        $('[data-toggle="tooltip"]').tooltip()
    }, []);
    return (
        <div className="customEvent" data-toggle="tooltip" data-placement="bottom" title={start_t + " - " + end_t + props.value} style={{marginTop: marginTop, height: "calc(100% - " + marginBottom + "px)"}}>
        </div>
    );
};

export default CustomEvent;