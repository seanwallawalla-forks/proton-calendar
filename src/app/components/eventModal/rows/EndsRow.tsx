import React from 'react';
import { c, msgid } from 'ttag';
import { Radio, DateInput, IntegerInput } from 'react-components';
import { isValid } from 'date-fns';

import { END_TYPE, FREQUENCY_COUNT_MAX, MAXIMUM_DATE } from '../../../constants';

import { DateTimeModel, EventModelErrors, FrequencyModel } from '../../../interfaces/EventModel';
import { WeekStartsOn } from '../../../containers/calendar/interface';

const { NEVER, UNTIL, AFTER_N_TIMES } = END_TYPE;

export const UNTIL_ID = 'event-occurrence-until';
export const COUNT_ID = 'event-occurrence-count';

interface Props {
    frequencyModel: FrequencyModel;
    start: DateTimeModel;
    displayWeekNumbers?: boolean;
    weekStartsOn: WeekStartsOn;
    errors: EventModelErrors;
    isSubmitted: boolean;
    onChange: (value: FrequencyModel) => void;
}
const EndsRow = ({ frequencyModel, start, displayWeekNumbers, weekStartsOn, errors, isSubmitted, onChange }: Props) => {
    const handleChangeEndType = (type: END_TYPE) => {
        onChange({ ...frequencyModel, ends: { ...frequencyModel.ends, type } });
    };
    const handleChangeEndCount = (count: number | undefined) => {
        if (count !== undefined && (count > FREQUENCY_COUNT_MAX || count < 1)) {
            return;
        }
        onChange({ ...frequencyModel, ends: { ...frequencyModel.ends, count } });
    };
    const handleChangeEndUntil = (until: Date | undefined) => {
        if (!until || !isValid(until)) {
            return;
        }
        onChange({ ...frequencyModel, ends: { ...frequencyModel.ends, until } });
    };

    const safeCountPlural = frequencyModel.ends.count || 1; // Can get undefined through the input

    return (
        <div className="flex flex-column flex-items-start w100">
            <label htmlFor="event-ends-radio">{c('Label').t`Ends`}</label>

            <div className="calendar-recurringFrequencyEnd-grid mt0-5">
                <div className="flex flex-nowrap flex-item-fluid calendar-recurringFrequencyEnd-grid-fullLine">
                    <span className="flex flex-item-noshrink">
                        <Radio
                            id="event-ends-radio-never"
                            checked={frequencyModel.ends.type === NEVER}
                            onChange={() => handleChangeEndType(NEVER)}
                        >
                            {c('Custom frequency option').t`Never`}
                        </Radio>
                    </span>
                </div>

                <span className="flex flex-item-noshrink">
                    <Radio
                        id="event-ends-radio-until"
                        className="mr1 flex-nowrap mtauto mbauto"
                        checked={frequencyModel.ends.type === UNTIL}
                        onChange={() => handleChangeEndType(UNTIL)}
                    >
                        {c('Custom frequency option').t`On`}
                    </Radio>
                </span>
                <span>
                    <DateInput
                        id={UNTIL_ID}
                        value={frequencyModel.ends.until}
                        min={start.date}
                        defaultDate={start.date}
                        onChange={handleChangeEndUntil}
                        onFocus={() => handleChangeEndType(UNTIL)}
                        displayWeekNumbers={displayWeekNumbers}
                        weekStartsOn={weekStartsOn}
                        aria-invalid={isSubmitted && !!errors.until}
                        isSubmitted={isSubmitted}
                        max={MAXIMUM_DATE}
                    />
                </span>
                <span />

                <span className="flex flex-item-noshrink">
                    <Radio
                        id="event-ends-radio-count"
                        className="mr1 flex-nowrap mtauto mbauto"
                        checked={frequencyModel.ends.type === AFTER_N_TIMES}
                        onChange={() => handleChangeEndType(AFTER_N_TIMES)}
                    >
                        {c('Custom frequency option').t`After`}
                    </Radio>
                </span>
                <span>
                    <IntegerInput
                        id={COUNT_ID}
                        value={frequencyModel.ends.count}
                        min={1}
                        onChange={handleChangeEndCount}
                        onFocus={() => handleChangeEndType(AFTER_N_TIMES)}
                        onBlur={() => {
                            if (!frequencyModel.ends.count) {
                                handleChangeEndCount(1);
                            }
                        }}
                        aria-invalid={isSubmitted && !!errors.count}
                        isSubmitted={isSubmitted}
                    />
                </span>
                <span className="mtauto mbauto">
                    {c('Custom frequency option').ngettext(msgid`Occurrence`, `Occurrences`, safeCountPlural)}
                </span>
            </div>
        </div>
    );
};

export default EndsRow;
