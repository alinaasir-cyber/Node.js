const categories = {
  income: ["Salary", "Business", "Investment", "Gift", "Other"],
  expense: [
    "Food",
    "Transport",
    "Housing",
    "Utilities",
    "Health",
    "Education",
    "Shopping",
    "Entertainment",
    "Other"
  ]
};

export function listCategories(req, res) {
  res.json({ success: true, data: { categories } });
}
