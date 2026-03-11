const fs = require('fs');
const taskPath = '/Users/escamillatourbuses/.gemini/antigravity/brain/d51a5a2a-85d6-4d4d-b60a-ca27cc651318/task.md';
let md = fs.readFileSync(taskPath, 'utf-8');

md = md.replace(
`- [ ] Typography & Colors: Update labels to sentence case and muted gray color.
- [ ] Inputs & Selects: Apply flat dark background, consistent height, and subtle borders.
- [ ] Button Clusters: Apply Carbon Ghost/Secondary styles to top buttons. Keep 2-col grid, reduce height.
- [ ] Requirements Section: Convert icon boxes to a vertical list of left-aligned labels with right-aligned toggle switches.
- [ ] Status Dropdowns: Group status dropdowns and match the 2x2 grid spacing.
- [ ] Action Buttons: Standardize Clear, Delete (danger ghost), and Save (primary).
- [ ] Spacing & Dividers: Add 1px dark gray horizontal dividers between Main Info, Actions, Statuses, and Requirements.`,
`- [x] Typography & Colors: Update labels to sentence case and muted gray color.
- [x] Inputs & Selects: Apply flat dark background, consistent height, and subtle borders.
- [x] Button Clusters: Apply Carbon Ghost/Secondary styles to top buttons. Keep 2-col grid, reduce height.
- [x] Requirements Section: Convert icon boxes to a vertical list of left-aligned labels with right-aligned toggle switches.
- [x] Status Dropdowns: Group status dropdowns and match the 2x2 grid spacing.
- [x] Action Buttons: Standardize Clear, Delete (danger ghost), and Save (primary).
- [x] Spacing & Dividers: Add 1px dark gray horizontal dividers between Main Info, Actions, Statuses, and Requirements.`
);

fs.writeFileSync(taskPath, md);
console.log("task.md updated");
