const rules = [
  { name: "Road & Pothole", words: ["pothole", "road", "street", "broken road", "crack"] },
  { name: "Garbage & Waste", words: ["garbage", "waste", "trash", "rubbish", "dustbin"] },
  { name: "Streetlight", words: ["streetlight", "street light", "lamp", "light not working"] },
  { name: "Water & Drainage", words: ["water", "drain", "drainage", "leakage", "sewer"] },
  { name: "Public Safety", words: ["unsafe", "accident", "danger", "crime", "open manhole"] },
  { name: "Other", words: [] }
];

function detectCategory(text) {
  const value = String(text).toLowerCase();

  for (const rule of rules) {
    if (rule.words.some(word => value.includes(word))) {
      return rule.name;
    }
  }

  return "Other";
}

module.exports = { detectCategory, categories: rules.map(rule => rule.name) };
