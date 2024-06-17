function query(data, channelFilters, messageFilters) {
    const result = [];
    for (let [channelId, channelData] of Object.entries(data)) {
        if (channelFilters.every((filter) => !filter || filter(channelId)))
            for (let message of channelData.messages) {
                if (messageFilters.every((filter) => !filter || filter(message)))
                    result.push({
                        time: convertTimeZone(snowflakeToDate(message.id), "Asia/Taipei"),
                        channelId: channelId,
                        authorId: message.authorId,
                        charCount: message.charCount,
                    });
            }
    }
    return result;
}

const ChannelIdFilter = channelIds => channelId => !channelIds.length || channelIds.includes(channelId); // TODO
const AuthorFilter = authorIds => message => !authorIds.length || authorIds.includes(message.authorId);
const TimeOfDayFilter = timesOfDay => message =>
    !timesOfDay.length ||
    timesOfDay.includes(
        convertTimeZone(snowflakeToDate(message.id), "Asia/Taipei").getHours()
    );

function snowflakeToDate(snowflake) {
    const dateBits = Number(BigInt.asUintN(64, snowflake) >> 22n);
    return new Date(dateBits + 1420070400000);
}

function convertTimeZone(date, timeZone) {
    return new Date(date.toLocaleString("en-US", { timeZone: timeZone }));
}

export { query, ChannelIdFilter, AuthorFilter, TimeOfDayFilter };
