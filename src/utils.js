import { toZonedTime } from "date-fns-tz";


function generate24HourArray() {
    const hoursArray = [];

    for (let i = 0; i < 24; i++) {
        const hour = {
            title: i <= 12 ? `${i} AM` : `${i - 12} PM`,
            subtitle: `${i < 9 ? "0" : ""}${i}:00 ~ ${i < 9 ? "0" : ""}${i}:59`,
            value: i,
        };
        hoursArray.push(hour);
    }

    return hoursArray;
}

function snowflakeToDate(snowflake, timeZone) {
    const dateBits = Number(BigInt.asUintN(64, snowflake) >> 22n);
    return toZonedTime(dateBits + 1420070400000, timeZone);
}


export { generate24HourArray, snowflakeToDate };
