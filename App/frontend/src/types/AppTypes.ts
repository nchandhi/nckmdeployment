import { ReactNode } from "react";

export type FilterObject = {
  key: string;
  displayValue: string;
};
export type FilterMetaData = Record<string, FilterObject[]>;
export type SelectedFilters = Record<string, string | string[]>;

type Roles = "assistant" | "user" | "error"

export enum Feedback {
  Neutral = "neutral",
  Positive = "positive",
  Negative = "negative",
  MissingCitation = "missing_citation",
  WrongCitation = "wrong_citation",
  OutOfScope = "out_of_scope",
  InaccurateOrIrrelevant = "inaccurate_or_irrelevant",
  OtherUnhelpful = "other_unhelpful",
  HateSpeech = "hate_speech",
  Violent = "violent",
  Sexual = "sexual",
  Manipulative = "manipulative",
  OtherHarmful = "other_harmlful",
}

export type message = {
  role: Roles;
  content: string | ReactNode;
  // role: string;
  // content: string;
  end_turn?: boolean;
  id?: string;
  date?: string;
  feedback?: Feedback;
  context?: string;
  contentType?: "text" | "image"
};

export type ConversationRequest = {
  id?: string;
  messages: message[];
};

export type Conversation = {
  id: string;
  title: string;
  messages: message[];
  date: string;
  updatedAt?: string;
};

export type AppConfig = Record<
  string,
  Record<string, number> | Record<string, Record<string, number>>
> | null;

export interface ChartLayout {
  row: number;
  col: number;
  width?: string;
}
export interface ChartDataItem {
  [x: string]: any;
  name: string;
  count: number;
  value: string;
  text: string;
  size: number;
  color?: string;
  percentage?: number;
  description?: string;
  unit_of_measurement?: string;
  average_sentiment: "positive" | "negative" | "neutral";
}
export interface ChartConfigItem {
  type: string;
  title: string;
  data: ChartDataItem[];
  layout: ChartLayout;
  id: string;
}

export enum ChatCompletionType {
  ChatCompletion = "chat.completion",
  ChatCompletionChunk = "chat.completion.chunk",
}

export type ChatResponseChoice = {
    messages: message[];
}

export type ChatResponse = {
  id: string;
  model: string;
  created: number;
  object: ChatCompletionType;
  choices: ChatResponseChoice[];
  error?: string;
}
 