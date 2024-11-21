import { useReducer, createContext, type ReactNode } from "react";
import {
  AppConfig,
  ChartConfigItem,
  Conversation,
  FilterMetaData,
  message,
  SelectedFilters,
} from "../types/AppTypes";
import { appReducer } from "./AppReducer";
import { actionConstants } from "./ActionConstants";
import { defaultSelectedFilters, generateUUIDv4 } from "../configs/Utils";

export type AppState = {
  dashboards: {
    filtersMetaFetched: boolean;
    initialChartsDataFetched: boolean;
    filtersMeta: FilterMetaData;
    charts: ChartConfigItem[];
    selectedFilters: SelectedFilters;
  };
  chat: {
    generatingResponse: boolean;
    messages: message[];
    userMessage: string;
  };
  chatHistory: {
    list: Conversation[];
  };
  selectedConversationId: string;
  generatedConversationId: string;
  config: {
    appConfig: AppConfig;
    charts: ChartConfigItem[];
  };
};

const initialState: AppState = {
  dashboards: {
    filtersMetaFetched: false,
    initialChartsDataFetched: false,
    filtersMeta: {
      Sentiment: [],
      Topic: [],
      DateRange: [],
    },
    charts: [],
    selectedFilters: { ...defaultSelectedFilters },
  },
  chat: {
    generatingResponse: false,
    messages: [],
    userMessage: "",
  },
  chatHistory: {
    list: [],
  },
  selectedConversationId: "",
  generatedConversationId: generateUUIDv4(),
  config: {
    appConfig: null,
    charts: [],
  },
};

export type Action =
  | {
      type: typeof actionConstants.SET_FILTERS;
      payload: FilterMetaData;
    }
  | {
      type: typeof actionConstants.UPDATE_FILTERS_FETCHED_FLAG;
      payload: boolean;
    }
  | {
      type: typeof actionConstants.UPDATE_CHARTS_DATA;
      payload: ChartConfigItem[];
    }
  | {
      type: typeof actionConstants.UPDATE_INITIAL_CHARTS_FETCHED_FLAG;
      payload: boolean;
    }
  | {
      type: typeof actionConstants.UPDATE_SELECTED_FILTERS;
      payload: SelectedFilters;
    }
  | {
      type: typeof actionConstants.UPDATE_USER_MESSAGE;
      payload: string;
    }
  | {
      type: typeof actionConstants.UPDATE_GENERATING_RESPONSE_FLAG;
      payload: boolean;
    }
  | {
      type: typeof actionConstants.UPDATE_MESSAGES;
      payload: message[];
    }
  | {
      type: typeof actionConstants.ADD_CONVERSATIONS_TO_LIST;
      payload: Conversation[];
    }
  | {
      type: typeof actionConstants.SAVE_CONFIG;
      payload: AppState["config"];
    }
  | {
      type: typeof actionConstants.UPDATE_SELECTED_CONV_ID;
      payload: string;
    }
  | {
      type: typeof actionConstants.UPDATE_GENERATED_CONV_ID;
      payload: string;
    }
  | {
      type: typeof actionConstants.NEW_CONVERSATION_START;
    };
export const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => {} });

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch: dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
