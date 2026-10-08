export type TagDistribution = {
  key: string;
  // events that carry this tag
  total: number;
  distinct: number;
  // top values, most frequent first
  values: { value: string; count: number }[];
};

export type ErrorSummary = {
  // distinct users across all events of the error
  users: number;
  firstRelease: string | null;
  lastRelease: string | null;
  tags: TagDistribution[];
};
