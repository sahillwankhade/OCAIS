export interface TimeSlot {
  slotId: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isAvailable: boolean;
  isEmergencyOnly?: boolean;
}

export interface ShiftConfig {
  shiftStart: string; // "09:00"
  shiftEnd: string; // "13:00"
  slotDurationMinutes: number; // e.g. 15
}

export interface DoctorSchedule {
  doctorId: string;
  shifts: ShiftConfig[];
  daysOfWeek?: number[];
  holidays?: string[]; // ["2026-11-15"]
  emergencyLockedSlotIds?: string[];
}

/**
 * Generates an array of time slots for a specific doctor on a target date
 */
export function generateDaySlots(
  schedule: DoctorSchedule,
  targetDate: string, // YYYY-MM-DD
  bookedSlotTimes: string[] = [] // ["09:00", "09:15"]
): TimeSlot[] {
  const dayOfWeek = new Date(`${targetDate}T00:00:00`).getDay();
  if (schedule.daysOfWeek?.length && !schedule.daysOfWeek.includes(dayOfWeek)) {
    return [];
  }

  // If target date is in holidays list, return no slots
  if (schedule.holidays?.includes(targetDate)) {
    return [];
  }

  const allSlots: TimeSlot[] = [];

  for (const shift of schedule.shifts) {
    const [startHour, startMin] = shift.shiftStart.split(':').map(Number);
    const [endHour, endMin] = shift.shiftEnd.split(':').map(Number);

    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    while (currentMinutes + shift.slotDurationMinutes <= endMinutes) {
      const slotStartH = Math.floor(currentMinutes / 60)
        .toString()
        .padStart(2, '0');
      const slotStartM = (currentMinutes % 60).toString().padStart(2, '0');
      const startTime = `${slotStartH}:${slotStartM}`;

      const nextMinutes = currentMinutes + shift.slotDurationMinutes;
      const slotEndH = Math.floor(nextMinutes / 60)
        .toString()
        .padStart(2, '0');
      const slotEndM = (nextMinutes % 60).toString().padStart(2, '0');
      const endTime = `${slotEndH}:${slotEndM}`;

      const slotId = `${targetDate}_${startTime}`;
      const isBooked = bookedSlotTimes.includes(startTime);
      const isEmergencyOnly = schedule.emergencyLockedSlotIds?.includes(slotId) ?? false;

      allSlots.push({
        slotId,
        startTime,
        endTime,
        isAvailable: !isBooked && !isEmergencyOnly,
        isEmergencyOnly,
      });

      currentMinutes = nextMinutes;
    }
  }

  return allSlots;
}
