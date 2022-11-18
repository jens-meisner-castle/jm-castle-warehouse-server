import { home } from "./Home.mjs";

export const AllExamples = {
  home,
};

export type ExampleName = keyof typeof AllExamples;

export const isExampleName = (s: string): s is ExampleName =>
  !!AllExamples[s as ExampleName];
