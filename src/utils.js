import { getTimezoneOffset } from "date-fns-tz";


function generate24HourArray() {
    const hoursArray = [];

    for (let i = 0; i < 24; i++) {
        const hour = {
            title: i < 12 ? `${i} AM` : `${i > 12 ? i-12 : 12} PM`,
            subtitle: `${i < 9 ? "0" : ""}${i}:00 ~ ${i < 9 ? "0" : ""}${i}:59`,
            value: i,
        };
        hoursArray.push(hour);
    }

    return hoursArray;
}


function SnowflakeConverter(timeZone) {
    const timeZoneOffset = getTimezoneOffset(timeZone);
    return (snowflake) => {
        const dateBits = Number(BigInt.asUintN(64, snowflake) >> 22n);
        return new Date(dateBits + 1420070400000 + timeZoneOffset);
    }
}

export { generate24HourArray, SnowflakeConverter };
