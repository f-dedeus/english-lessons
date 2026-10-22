// Temporary ids for new items in a form. The database assigns the real ones.
let counter = 0
export const newId = () => Date.now() + counter++