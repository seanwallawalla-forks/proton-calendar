import { omit } from 'proton-shared/lib/helpers/object';
import isDeepEqual from 'proton-shared/lib/helpers/isDeepEqual';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { CalendarEventRecurring } from '../../../interfaces/CalendarEvents';
import { getSafeRruleCount, getSafeRruleUntil } from './helper';

const getRecurrenceOffsetID = (date: Date) => {
    const dateString = [date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()]
        .map((n) => ('' + n).padStart(2, '0'))
        .join('');
    const timeString = [date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()]
        .map((n) => ('' + n).padStart(2, '0'))
        .join('');
    return `R${dateString}T${timeString}`;
};

const getComponentWithUpdatedRrule = (
    component: VcalVeventComponent,
    originalComponent: VcalVeventComponent,
    recurrence: CalendarEventRecurring
): VcalVeventComponent => {
    const { rrule: originalRrule } = originalComponent;
    const { rrule: newRrule } = component;

    if (!originalRrule) {
        throw new Error('Original RRULE undefined');
    }

    // If the user has edited the RRULE, we'll use that.
    if (!newRrule || !isDeepEqual(newRrule, originalRrule)) {
        if (!newRrule) {
            return omit(component, ['rrule']);
        }
        return {
            ...component,
            rrule: newRrule
        };
    }

    // Otherwise, we'll update the original RRULE based on this occurrence
    if (originalRrule.value.count) {
        const newCount = originalRrule.value.count - (recurrence.occurrenceNumber - 1);
        const safeRrule = getSafeRruleCount(originalRrule, newCount);
        if (!safeRrule) {
            return omit(component, ['rrule']);
        }
        return { ...component, rrule: safeRrule };
    }

    if (originalRrule.value.until) {
        return {
            ...component,
            rrule: getSafeRruleUntil(originalRrule, component)
        };
    }

    return {
        ...component,
        rrule: originalRrule
    };
};

export const getFutureRecurrenceUID = (oldUID: string, localStart: Date) => {
    const offset = getRecurrenceOffsetID(localStart);
    const endIdx = oldUID.lastIndexOf('@');
    if (endIdx === -1) {
        return `${oldUID}_${offset}`;
    }
    const pre = oldUID.slice(0, endIdx);
    const post = oldUID.slice(endIdx);
    return `${pre}_${offset}${post}`;
};

const createFutureRecurrence = (
    component: VcalVeventComponent,
    originalComponent: VcalVeventComponent,
    recurrence: CalendarEventRecurring
) => {
    const veventWithNewUID = {
        ...component,
        uid: { value: getFutureRecurrenceUID(originalComponent.uid.value, recurrence.localStart) }
    } as VcalVeventComponent;

    const veventStripped = omit(veventWithNewUID, ['recurrence-id', 'exdate']);

    return getComponentWithUpdatedRrule(veventStripped, originalComponent, recurrence);
};

export default createFutureRecurrence;