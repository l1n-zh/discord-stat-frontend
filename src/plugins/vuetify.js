import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import '@mdi/font/css/materialdesignicons.css' // Ensure you are using css-loader

export const vuetify = createVuetify({
    components,
    directives,
});
