/**
 * Estimate IRT difficulty from question text analysis.
 * Lightweight utility kept separate from scraper dependencies so review APIs
 * can import it without pulling in heavy parsing packages.
 */
export function estimateQuestionDifficulty(questionText: string, gradeLevel?: number): number {
  let difficulty = 0;

  if (gradeLevel) {
    difficulty = (gradeLevel - 6) * 0.3;
  }

  const wordCount = questionText.split(/\s+/).length;
  if (wordCount > 50) difficulty += 0.5;
  if (wordCount > 100) difficulty += 0.5;

  if (questionText.match(/\d+\s*[\+\-\*\/\^]\s*\d+/)) {
    const operators = questionText.match(/[\+\-\*\/\^]/g) || [];
    difficulty += operators.length * 0.2;
  }

  const advancedWords = ['analyze', 'synthesize', 'evaluate', 'compare', 'contrast'];
  advancedWords.forEach((word) => {
    if (questionText.toLowerCase().includes(word)) difficulty += 0.3;
  });

  return Math.max(-3, Math.min(3, difficulty));
}

export function mapIrtToDifficultyBand(irtDifficulty: number): 'EASY' | 'MEDIUM' | 'HARD' {
  if (irtDifficulty <= -1) return 'EASY';
  if (irtDifficulty >= 1) return 'HARD';
  return 'MEDIUM';
}