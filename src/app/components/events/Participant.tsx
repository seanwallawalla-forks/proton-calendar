import React from 'react';
import { Tooltip } from 'react-components';

interface Props {
    icon: React.ReactNode;
    text: string;
    title: string;
    initials: string;
    tooltip: string;
}

const Participant = ({ icon, text, title, tooltip, initials }: Props) => {
    return (
        <div className="participant flex flex-nowrap flex-align-items-center">
            <Tooltip title={tooltip} className="flex-item-noshrink">
                <div className="participant-display item-icon relative flex flex-align-items-center flex-justify-center bordered-container">
                    <div className="item-abbr">{initials}</div>
                    <span className="participant-status">{icon}</span>
                </div>
            </Tooltip>
            <Tooltip className="max-w100 inline-block text-ellipsis ml1" title={title}>
                <div className="participant-text text-ellipsis">{text}</div>
            </Tooltip>
        </div>
    );
};

export default Participant;