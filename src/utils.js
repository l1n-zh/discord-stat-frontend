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


function snowflakeToDate(snowflake) {
    const dateBits = Number(BigInt.asUintN(64, snowflake) >> 22n);
    return dateBits + 1420070400000;
}

function truncateString(str, maxLength) {
     let len = 0;
     let truncated = "";

     for (let char of str) {
         len += char.match(/[^\x00-\xff]/) ? 2:1
         if (len <= maxLength) {
             truncated += char;
         } else {
             truncated += "...";
             break;
         }
     }

     return truncated;
}

export { generate24HourArray, snowflakeToDate, truncateString };
