import { generateUUIDv4 } from "../configs/Utils";
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
    case actionConstants.SAVE_CONFIG:
      return {
        ...state,
        config: {
          ...state.config,
          ...action.payload,
        },
      };
    case actionConstants.UPDATE_SELECTED_CONV_ID:
      return {
        ...state,
        selectedConversationId: action.payload,
      };
    case actionConstants.UPDATE_GENERATED_CONV_ID:
      return {
        ...state,
        generatedConversationId: generateUUIDv4(),
      };
    case actionConstants.NEW_CONVERSATION_START:
      return {
        ...state,
        chat: { ...state.chat, messages: [] },
        selectedConversationId: "",
        generatedConversationId: generateUUIDv4(),
      };
    case actionConstants.UPDATE_CONVERSATIONS_FETCHING_FLAG:
      return {
        ...state,
        chatHistory: {
          ...state.chatHistory,
          fetchingConversations: action.payload,
        },
      };
    case actionConstants.UPDATE_CONVERSATION_TITLE:
      const tempConvsList = [...state.chatHistory.list];
      const index = tempConvsList.findIndex(
        (obj) => obj.id === action.payload.id
      );
      if (index > -1) {
        tempConvsList[index].title = action.payload.newTitle;
      }
      return {
        ...state,
        chatHistory: {
          ...state.chatHistory,
          list: [...tempConvsList],
        },
      };
    case actionConstants.UPDATE_ON_CLEAR_ALL_CONVERSATIONS:
      return {
        ...state,
        chatHistory: {
          ...state.chatHistory,
          list: [],
        },
        chat: { ...state.chat, messages: [] },
        selectedConversationId: "",
        generatedConversationId: generateUUIDv4(),
      };
    case actionConstants.SHOW_CHATHISTORY_CONVERSATION:
      const tempConvList = [...state.chatHistory.list];
      const matchedIndex = tempConvList.findIndex(
        (obj) => obj.id === action.payload.id
      );
      if (matchedIndex > -1) {
        // Update the messages of the matched conversation
        tempConvList[matchedIndex].messages = action.payload.messages;
      }
      console.log("tempConvList::", tempConvList);
      return {
        ...state,
        chat: { ...state.chat, messages: action.payload.messages },
        chatHistory: {
          ...state.chatHistory,
          list: tempConvList,
        },
      };
    case actionConstants.UPDATE_CHATHISTORY_CONVERSATION_FLAG:
      return {
        ...state,
        chatHistory: {
          ...state.chatHistory,
          fetchingConversations: action.payload,
        },
      };
    case actionConstants.DELETE_CONVERSATION_FROM_LIST:
      const updatedChatHistoryList = state.chatHistory.list.filter(
        (conversation) => conversation.id !== action.payload
      );
      return {
        ...state,
        chatHistory: {
          ...state.chatHistory,
          list: updatedChatHistoryList, // Use the temp variable here
        },
      };
    case actionConstants.STORE_COSMOS_INFO:
      return {
        ...state,
        cosmosInfo: action.payload
      };
    default:
      return state;
  }
};

export { appReducer };
