<template>
    <v-select v-model="selected" :items="displayedItems" :label="label" :item-props="itemProps" multiple clearable
        density="comfortable" variant="outlined">
        <template v-slot:prepend-item>
            <v-text-field v-model="search" label="Search" prepend-inner-icon="mdi-magnify" variant="outlined"
                @blur="() => { search = '' }" class="mx-3" hide-details single-line clearable></v-text-field>

            <v-list-item title="Select All" @click="toggle" v-if="displayedItems.length" class="mt-2" clearable>
                <template v-slot:prepend>
                    <v-checkbox-btn color="grey-darken-1" :indeterminate="haveSelected && !selectAll"
                        :model-value="selectAll"></v-checkbox-btn>
                </template>
            </v-list-item>
            <v-divider class="mb-2"></v-divider>
        </template>

        <template v-slot:selection="{ item, index }">
            <v-chip v-if="index < 5">
                <span>{{ item.title }}</span>
            </v-chip>
            <span v-if="index === 5" class="text-grey text-caption align-self-center">
                (+{{ selected.length - 5 }} others)
            </span>
        </template>

    </v-select>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const { label, items, filter, callback } = defineProps(['label', 'items', 'filter', 'callback'])

const search = ref('')
const selected = ref([])

watch(selected, (selectedItems) => {
    return callback(filter(selectedItems));
});

const displayedItems = computed(() => {
    return items.filter(
        item =>
            !search.value ||
            item.title.toLocaleLowerCase().includes(search.value.toLocaleLowerCase()) ||
            item.subtitle?.toLocaleLowerCase().includes(search.value.toLocaleLowerCase()))
})

const selectAll = computed(() => {
    return selected.value.length === displayedItems.value.length
})

const haveSelected = computed(() => {
    return selected.value.length > 0
})

function toggle() {
    if (selectAll.value) {
        selected.value = []
    } else {
        selected.value = displayedItems.value.map(item=>item.value);
    }
}

function itemProps(item) {
    return {
        title: item.title,
        subtitle: item.subtitle,
    }
}
</script>
