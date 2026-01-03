
// pick up here, write the prompt for chatgpt tomorrow


// user must manually create entire forward direction, reverse direction only needs to be specified if the user wants to change the label for a value, all values must be unique.

// Forward direction is for listing values, reverse direction is for associating a label with a value.

// reverse directions not specified will automatically use the key as the label, only need to use the reverse direction if you want to change the label

// Cannot use a value for a key in the reverse direction that was not specified in the forward direction. 

// Caveats:
// library does not work for when you want string values, only numerical ones
// Your object cannot use any of the keys reserved for using the final bdir object (i.e. "Labels" or "render")

// Plans.Labels.Pro <-- "Pro"
// Plans.Pro <-- 0

// Plans.render(unknown) // look for label by value "Pro"
// Plans.index(unknown) // look for value by keyPlans.reverseIndex() // look for key by the value
// Plans.indexByLabel() // look for value by the label, NOTE: label uniqueness not enforced so this could return a number or a number[] of all the values that match
// Plans.reverseIndexByLabel() // look for key by the label, NOTE: label uniqueness not enforced so this could return a string or a string[] of all the values that match
// Plans.raw() // the raw generated bidirectional object (has all the forward and reverse direction keys)

// Plans.isKey <- Have all the variants
// Plans.isValue <-- Have all variants
// Plans.isLabel <-- Have all variants like isNullishLabelArray

// BdirValues<> // union of all the values
// BdirLabels<> // union of all labels
// BdirKeys<> // union of all keys

// type PlanValues = Bdir<typeof Plans>
// const values = Plans.values(); // returns array
// const keys = Plans.keys(); // returns array
// const labels = Plans.labels(); // returns array
// const entries = Plans.entries() // [[key, value]]
// const options = Plans.options() // [[label, value]] // useful when rendering html content