/**
 * Timezone Utility Functions for Veda AI MCP
 */

/**
 * Get the system's IANA timezone
 * @returns {string} IANA timezone identifier (e.g., "Asia/Kolkata")
 */
function getSystemTimezone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Validate if a string is a valid IANA timezone
 * @param {string} tz - Timezone string to validate
 * @returns {boolean} True if valid timezone
 */
function isValidTimezone(tz) {
    if (!tz || typeof tz !== "string") return false;
    try {
        Intl.DateTimeFormat(undefined, { timeZone: tz });
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Format a date object for a specific timezone
 * @param {Date} date - Date object to format
 * @param {string} timezone - IANA timezone (defaults to system timezone)
 * @returns {object} Formatted time components
 */
function formatTimeForTimezone(date, timezone) {
    const tz = isValidTimezone(timezone) ? timezone : getSystemTimezone();

    const options = {
        timeZone: tz,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    };

    const formatter = new Intl.DateTimeFormat("en-US", options);
    const parts = formatter.formatToParts(date);

    const partMap = {};
    parts.forEach(part => {
        partMap[part.type] = part.value;
    });

    // Get ISO string in the target timezone
    const isoFormatter = new Intl.DateTimeFormat("sv-SE", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
    const isoParts = isoFormatter.formatToParts(date);
    const isoPartMap = {};
    isoParts.forEach(part => {
        isoPartMap[part.type] = part.value;
    });

    const localISOString = `${isoPartMap.year}-${isoPartMap.month}-${isoPartMap.day}T${isoPartMap.hour}:${isoPartMap.minute}:${isoPartMap.second}`;

    return {
        localTime: localISOString,
        formattedTime: `${partMap.hour}:${partMap.minute}:${partMap.second} ${partMap.dayPeriod}`,
        formattedDate: `${partMap.weekday}, ${partMap.month} ${partMap.day}, ${partMap.year}`,
        dayOfWeek: partMap.weekday,
        timezone: tz,
        utcOffset: getUTCOffset(date, tz),
    };
}

/**
 * Get UTC offset for a timezone
 * @param {Date} date - Date to check offset for
 * @param {string} timezone - IANA timezone
 * @returns {string} UTC offset string (e.g., "+05:30")
 */
function getUTCOffset(date, timezone) {
    const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
    const tzDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
    const diffMinutes = (tzDate - utcDate) / 60000;

    const hours = Math.floor(Math.abs(diffMinutes) / 60);
    const minutes = Math.abs(diffMinutes) % 60;
    const sign = diffMinutes >= 0 ? "+" : "-";

    return `${sign}${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

/**
 * Map hour to time period
 * @param {number} hour - Hour (0-23)
 * @returns {string} Time period identifier
 */
function getTimeOfDay(hour) {
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 18) return "workHours";
    if (hour >= 18 && hour < 22) return "evening";
    return "lateNight";
}

module.exports = {
    getSystemTimezone,
    isValidTimezone,
    formatTimeForTimezone,
    getUTCOffset,
    getTimeOfDay,
};
