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

export { generate24HourArray }