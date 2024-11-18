import { ReactNode } from "react";

export type FilterObject = {
  key: string;
  displayValue: string;
};
export type FilterMetaData = Record<string, FilterObject[]>;
export type SelectedFilters = Record<string, string | string[]>;

export enum Roles {
  ASSISTANT = "assistant",
  USER = "user",
}

export type message = {
  role: Roles;
  content: string | ReactNode;
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
