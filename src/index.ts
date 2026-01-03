
// pick up here, write the prompt for chatgpt tomorrow




// BdirValues<> // union of all the values
// BdirLabels<> // union of all labels
// BdirKeys<> // union of all keys

// type PlanValues = Bdir<typeof Plans>
// const values = Plans.values(); // returns array
// const keys = Plans.keys(); // returns array
// const labels = Plans.labels(); // returns array
// const entries = Plans.entries() // [[key, value]]
// const options = Plans.options() // [[label, value]] // useful when rendering html content


// Give me a factory function in typescript which accepts a bi-directional object. All forward direction properties must be specified, reverse direction properties are only required if the user wants a label different from the string value of the key. Only numbers can be used as values, only strings can be used for keys and labels. If a value is not specified in the reverse direction, it will be automatically created using the value as the key and the string value of the key as the label. The .raw function returns the fully generated bi-directional object. If every value is specified in the reverse direction, no new properties will be created.

