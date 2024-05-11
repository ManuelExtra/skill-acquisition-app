let results = [
  { name: 'Jack', score: 80 },
  { name: 'Kent', score: 70 },
  { name: 'Jude', score: 70 },
  { name: 'Clark', score: 67 },
  { name: 'Bill', score: 60 },
  { name: 'Paul', score: 50 },
  { name: 'Sam', score: 50 },
  { name: 'James', score: 45 },
];

let results_with_positions = [];

let scoreIndex = 0;
let previousScoreRecord = null;

for (let index = 0; index < results.length; index++) {
  const result = results[index];

  // Get previous index after passing the first index
  if (index > 0) {
    scoreIndex = index - 1;
  }

  // Get position based on score
  // Get the previous score record
  previousScoreRecord =
    results_with_positions.length > 0 ? results[scoreIndex] : null;

  let position = null;
  console.log(Boolean(previousScoreRecord));
  if (Boolean(previousScoreRecord)) {
    console.log(previousScoreRecord);
    //See if previous record score is the same as the current index score
    if (previousScoreRecord.score === result.score) {
      console.log(123);
      console.log(results_with_positions[index]);
      position = results_with_positions[index].position;
    }
  } else {
    position = 1;
  }

  // Assign result record to results_with_positions array
  results_with_positions.push({ ...result, position: position });
}

console.log(results_with_positions);
