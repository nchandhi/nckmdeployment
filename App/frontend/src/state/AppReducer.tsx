import { actionConstants } from "./ActionConstants";
import { Action, type AppState } from "./AppProvider";

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case actionConstants.SET_FILTERS:
      return {
        ...state,
        dashboards: { ...state.dashboards, filtersMeta: action.payload },
      };
    case actionConstants.UPDATE_FILTERS_FETCHED_FLAG:
      return {
        ...state,
        dashboards: { ...state.dashboards, filtersMetaFetched: action.payload },
      };
    case actionConstants.UPDATE_CHARTS_DATA:
      return {
        ...state,
        dashboards: { ...state.dashboards, charts: action.payload },
      };
    case actionConstants.UPDATE_INITIAL_CHARTS_FETCHED_FLAG:
      return {
        ...state,
        dashboards: {
          ...state.dashboards,
          initialChartsDataFetched: action.payload,
        },
      };
    case actionConstants.UPDATE_SELECTED_FILTERS:
      return {
        ...state,
        dashboards: {
          ...state.dashboards,
          selectedFilters: action.payload,
        },
      };
    case actionConstants.UPDATE_USER_MESSAGE:
      return {
        ...state,
        chat: {
          ...state.chat,
          userMessage: action.payload,
        },
      };
    case actionConstants.UPDATE_GENERATING_RESPONSE_FLAG:
      return {
        ...state,
        chat: {
          ...state.chat,
          generatingResponse: action.payload,
        },
      };
    case actionConstants.UPDATE_MESSAGES:
      return {
        ...state,
        chat: {
          ...state.chat,
          messages: [...state.chat.messages, ...action.payload],
        },
      };
    case actionConstants.ADD_CONVERSATIONS_TO_LIST:
      return {
        ...state,
        chatHistory: {
          ...state.chatHistory,
          list: [...state.chatHistory.list, ...action.payload],
        },
      };
    default:
      return state;
  }
};

export { appReducer };
