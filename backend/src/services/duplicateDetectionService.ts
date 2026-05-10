import { athleteRepository } from "../repositories/athleteRepository.js";

const normalizeValue = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const levenshtein = (left: string, right: string) => {
  const matrix = Array.from({ length: right.length + 1 }, () => Array<number>(left.length + 1).fill(0));

  for (let row = 0; row <= right.length; row += 1) matrix[row][0] = row;
  for (let col = 0; col <= left.length; col += 1) matrix[0][col] = col;

  for (let row = 1; row <= right.length; row += 1) {
    for (let col = 1; col <= left.length; col += 1) {
      const cost = right[row - 1] === left[col - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + cost,
      );
    }
  }

  return matrix[right.length][left.length];
};

const similarity = (left: string, right: string) => {
  const normalizedLeft = normalizeValue(left);
  const normalizedRight = normalizeValue(right);

  if (!normalizedLeft || !normalizedRight) {
    return 0;
  }

  if (normalizedLeft === normalizedRight) {
    return 1;
  }

  const distance = levenshtein(normalizedLeft, normalizedRight);
  return 1 - distance / Math.max(normalizedLeft.length, normalizedRight.length, 1);
};

export const duplicateDetectionService = {
  async detect(clubId: string, input: {
    fullName?: string | null;
    birthDate?: string | Date | null;
    currentTeam?: string | null;
  }) {
    const athletes = await athleteRepository.list(clubId, { includeInactive: true });
    const birthDateValue =
      input.birthDate instanceof Date
        ? input.birthDate.toISOString().slice(0, 10)
        : typeof input.birthDate === "string"
          ? input.birthDate.slice(0, 10)
          : null;

    const matches = athletes
      .map((athlete) => {
        const nameScore = input.fullName ? similarity(input.fullName, athlete.fullName) : 0;
        const birthDateScore =
          birthDateValue && athlete.birthDate ? (athlete.birthDate.toISOString().slice(0, 10) === birthDateValue ? 1 : 0) : 0;
        const teamScore = input.currentTeam ? 1 : 0.8;
        const score = nameScore * 0.65 + birthDateScore * 0.25 + teamScore * 0.1;

        return {
          athleteId: athlete.id,
          athlete,
          score: Number(score.toFixed(3)),
          confidence: score >= 0.9 ? "HIGH" : score >= 0.76 ? "MEDIUM" : "LOW",
          reasons: [
            nameScore >= 0.76 ? `Nome muito parecido (${Math.round(nameScore * 100)}%).` : null,
            birthDateScore === 1 ? "Data de nascimento coincide." : null,
            "Mesmo clube atual considerado na análise.",
          ].filter(Boolean),
        };
      })
      .filter((item) => item.score >= 0.58)
      .sort((left, right) => right.score - left.score)
      .slice(0, 5);

    return {
      hasStrongDuplicate: matches.some((item) => item.score >= 0.9),
      matches,
      explainability: {
        title: "Detecção de duplicidade",
        summary: "A análise combina similaridade textual do nome, nascimento e contexto do clube para encontrar possíveis cadastros repetidos.",
        factors: [
          "Similaridade de nome por fuzzy matching.",
          birthDateValue ? "Data de nascimento incluída na pontuação." : "Sem data de nascimento; resultado depende mais do nome.",
          "Todos os candidatos são filtrados no contexto do mesmo clube.",
        ],
      },
    };
  },
};
