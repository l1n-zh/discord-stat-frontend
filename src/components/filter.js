function query(messages, filters) {
    return messages.filter(message =>
         filters.every((filter) => !filter || filter(message)),
    )
}

const ChannelIdFilter = channelIds => message => !channelIds.length || channelIds.includes(message.channelId);
const AuthorFilter = authorIds => message => !authorIds.length || authorIds.includes(message.authorId);
const TimeOfDayFilter = timesOfDay => message => !timesOfDay.length || timesOfDay.includes(new Date(message.time).getHours());

export { query, ChannelIdFilter, AuthorFilter, TimeOfDayFilter };
