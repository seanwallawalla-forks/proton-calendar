import { Label, Row } from 'react-components';
import CalendarSelect, { Props as CalendarSelectProps } from '../inputs/CalendarSelect';
import React from 'react';

interface Props extends CalendarSelectProps {
    label: React.ReactNode;
    collapseOnMobile?: boolean;
}

const CalendarSelectRow = ({ label, collapseOnMobile, ...rest }: Props) => {
    return (
        <Row collapseOnMobile={collapseOnMobile}>
            <Label htmlFor="event-calendar-select">{label}</Label>
            <div className="flex flex-nowrap flex-item-fluid flex-items-center">
                <CalendarSelect id="event-calendar-select" {...rest} />
            </div>
        </Row>
    );
};

export default CalendarSelectRow;