function sumUp(data, targets, validator) {
    const result = {};
    for (let target of targets){
        result[target] = 0;
    }

    for (let [channelId, channelData] of Object.entries(data)) {
        for (let message of channelData.messages) {
            for(let target of targets)
                if(validator(message, target))
                    result[target] += 1
    }
    }
    return result;
}


export { sumUp };
