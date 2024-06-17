function query(data, channelFilters, messageFilters) {
    const result = [];
    for (let [channelId, channelData] of Object.entries(data)) {
        if (channelFilters.every((filter) => !filter || filter(channelId)))
            for (let message of channelData.messages) {
                if (messageFilters.every((filter) => !filter || filter(message)))
                    result.push(message);
            }
    }
    return result;
}

const ChannelIdFilter = channelIds => channelId => !channelIds.length || channelIds.includes(channelId); // TODO
const AuthorFilter = authorIds => message => !authorIds.length || authorIds.includes(message.authorId);
const TimeOfDayFilter = timesOfDay => message => !timesOfDay.length || timesOfDay.includes(message.time.getHours());

export { query, ChannelIdFilter, AuthorFilter, TimeOfDayFilter };
