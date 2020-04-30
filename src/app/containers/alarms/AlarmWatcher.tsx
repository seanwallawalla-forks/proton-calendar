import { useEffect, useRef } from 'react';
import { c } from 'ttag';
import { useApi } from 'react-components';
import { fromUnixTime, differenceInMilliseconds } from 'date-fns';
import { getEvent as getEventRoute } from 'proton-shared/lib/api/calendars';
import { create, isEnabled, request } from 'proton-shared/lib/helpers/desktopNotification';
import { dateLocale } from 'proton-shared/lib/i18n';
import { getMillisecondsFromTriggerString } from 'proton-shared/lib/calendar/vcal';
import { CalendarAlarm, CalendarEvent } from 'proton-shared/lib/interfaces/calendar';

import notificationIcon from '../../../assets/notification.gif';
import useGetCalendarEventRaw from '../../containers/calendar/useGetCalendarEventRaw';
import { getAlarmMessage } from '../../helpers/alarms';
import { MINUTE } from '../../constants';

const MIN_CUTOFF = -MINUTE * 1000;

export const displayNotification = ({ title = c('Title').t`Calendar alarm`, text = '', ...rest }) => {
    return create(title, {
        body: text,
        icon: notificationIcon,
        onClick() {
            window.focus();
        },
        ...rest
    });
};

const getFirstUnseenAlarm = (alarms: CalendarAlarm[] = [], set: Set<string>) => {
    return alarms.find(({ ID }) => {
        return !set.has(ID);
    });
};

interface Props {
    alarms: CalendarAlarm[];
    tzid: string;
    getCachedEvent: (calendarID: string, eventID: string) => Promise<CalendarEvent>;
}
const AlarmWatcher = ({ alarms = [], tzid, getCachedEvent }: Props) => {
    const api = useApi();
    const getEventRaw = useGetCalendarEventRaw();
    const cacheRef = useRef<Set<string>>();

    // temporary code for standalone app
    useEffect(() => {
        if (!isEnabled()) {
            request();
        }
    }, []);

    useEffect(() => {
        let timeoutHandle = 0;
        let unmounted = false;

        const run = () => {
            if (unmounted) {
                return;
            }
            if (!cacheRef.current) {
                cacheRef.current = new Set();
            }

            const firstUnseenAlarm = getFirstUnseenAlarm(alarms, cacheRef.current);
            if (!firstUnseenAlarm) {
                return;
            }

            const { ID, Occurrence, Trigger, CalendarID, EventID } = firstUnseenAlarm;

            const nextAlarmTime = fromUnixTime(Occurrence);
            const nextEventTime = Trigger ? Occurrence * 1000 - getMillisecondsFromTriggerString(Trigger) : undefined;
            const now = Date.now();
            const diff = differenceInMilliseconds(nextAlarmTime, now);
            const delay = Math.max(diff, 0);

            const getEvent = () => {
                const cachedEvent = getCachedEvent(CalendarID, EventID);
                if (cachedEvent) {
                    return Promise.resolve(cachedEvent);
                }
                return api<{ Event: CalendarEvent }>({ ...getEventRoute(CalendarID, EventID), silence: true }).then(
                    ({ Event }) => Event
                );
            };

            timeoutHandle = window.setTimeout(() => {
                if (unmounted || !cacheRef.current) {
                    return;
                }
                // Eagerly add the event to seen, ignore if it would fail
                cacheRef.current.add(ID);

                // Ignore the event if it's in the past after the cutoff
                if (diff < MIN_CUTOFF) {
                    window.setTimeout(run, 0);
                    return;
                }

                getEvent()
                    .then((Event) => getEventRaw(Event))
                    .then((eventRaw) => {
                        if (unmounted) {
                            return;
                        }
                        const component = eventRaw;
                        const start = nextEventTime ? new Date(nextEventTime) : undefined;
                        const now = new Date();
                        const formatOptions = { locale: dateLocale };
                        const text = getAlarmMessage({ component, start, now, tzid, formatOptions });
                        displayNotification({ text, tag: ID });
                    });

                window.setTimeout(run, 0);
            }, delay);
        };

        run();

        return () => {
            unmounted = true;
            if (timeoutHandle) {
                window.clearTimeout(timeoutHandle);
            }
        };
    }, [alarms, tzid, getEventRaw]);

    return null;
};

export default AlarmWatcher;