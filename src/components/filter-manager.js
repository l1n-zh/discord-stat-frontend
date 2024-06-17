
export class manager{
    settings = {};
    filters = {}

    addSetting(label, filter, options, optionsMap) {
        const setting = {};
        setting.label = label
        setting.options = options
        setting.setFilter = (selected) => {
            if(selected?.length)
                filters[label] = filter(optionsMap(selected))  
            else
                delete filter[label]
        } 
        settings[label] = setting
    }

    getFilterSettings() {
        return this.settings.values()
    }
    
    getFilters() {
        return this.filters.values()
    }
}