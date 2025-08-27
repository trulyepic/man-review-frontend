export const stripMdHeading = (s: string) =>
  s.replace(/^\s{0,3}#{1,6}\s+/, "").trim();
