const POSITION_CANONICAL_MAP = [
  { canonical: "Goleiro", aliases: ["goleiro", "goalkeeper", "keeper", "gk"] },
  { canonical: "Zagueiro", aliases: ["zagueiro", "cb", "center back", "centre back", "defender"] },
  { canonical: "Lateral", aliases: ["lateral", "rb", "lb", "wing back", "fullback", "right back", "left back"] },
  { canonical: "Volante", aliases: ["volante", "dm", "cdm", "defensive midfielder", "first midfielder"] },
  { canonical: "Meio-campo", aliases: ["meia", "mc", "midfielder", "cm", "meio campo", "half", "central midfielder"] },
  { canonical: "Meia ofensivo", aliases: ["cam", "attacking midfielder", "meia ofensivo", "armador", "playmaker"] },
  { canonical: "Ponta", aliases: ["winger", "rw", "lw", "extremo", "ponta"] },
  { canonical: "Atacante", aliases: ["striker", "forward", "cf", "st", "atacante", "centre forward"] },
];

const normalizeKey = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const toTitleCase = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join(" ");

export const athleteNormalizationService = {
  normalizeName(fullName: string) {
    const normalizedFullName = toTitleCase(fullName);

    return {
      original: fullName,
      normalized: normalizedFullName,
      changed: normalizedFullName !== fullName,
    };
  },

  normalizePosition(position: string) {
    const normalizedKey = normalizeKey(position);
    const matched = POSITION_CANONICAL_MAP.find((item) => item.aliases.some((alias) => normalizeKey(alias) === normalizedKey));
    const canonical = matched?.canonical ?? toTitleCase(position);

    return {
      original: position,
      normalized: canonical,
      changed: canonical !== position,
      confidence: matched ? 0.94 : 0.66,
      matchedAlias: matched ? position : null,
    };
  },

  normalizeAthlete(input: {
    fullName?: string | null;
    position?: string | null;
    birthDate?: string | Date | null;
    currentTeam?: string | null;
  }) {
    const nameResult = input.fullName ? this.normalizeName(input.fullName) : null;
    const positionResult = input.position ? this.normalizePosition(input.position) : null;
    const factors = [
      nameResult?.changed ? "Nome ajustado para capitalização consistente." : "Nome já estava padronizado.",
      positionResult?.changed
        ? `Posição convertida para taxonomia interna: ${positionResult.normalized}.`
        : "Posição mantida conforme cadastro informado.",
      input.birthDate ? "Data de nascimento disponível para enriquecer deduplicação." : "Sem data de nascimento, deduplicação com menor precisão.",
    ];

    return {
      fullName: nameResult?.normalized ?? null,
      position: positionResult?.normalized ?? null,
      birthDate:
        input.birthDate instanceof Date
          ? input.birthDate.toISOString()
          : typeof input.birthDate === "string"
            ? input.birthDate
            : null,
      explainability: {
        title: "Padronização do cadastro",
        summary: "Os dados foram normalizados para reduzir variações de nomenclatura e melhorar buscas internas.",
        factors,
      },
    };
  },
};
