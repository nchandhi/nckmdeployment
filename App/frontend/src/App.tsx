import React, { useEffect, useState } from "react";
import Chart from "./components/Chart/Chart";
import Chat from "./components/Chat/Chat";
import {
  Button,
  FluentProvider,
  webLightTheme,
} from "@fluentui/react-components";
import { SparkleRegular } from "@fluentui/react-icons";
import "./App.css";
import { ChatHistoryPanel } from "./components/ChatHistoryPanel/ChatHistoryPanel";
import {
  getLayoutConfig,
  historyDelete,
  historyDeleteAll,
  historyList,
  historyRead,
} from "./api/api";
import { useAppContext } from "./state/useAppContext";
import { actionConstants } from "./state/ActionConstants";
import { Conversation } from "./types/AppTypes";
import { AppLogo } from "./components/Svg/Svg";

const panels = {
  DASHBOARD: "DASHBOARD",
  CHAT: "CHAT",
  CHATHISTORY: "CHATHISTORY",
};

const defaultThreeColumnConfig: Record<string, number> = {
  [panels.DASHBOARD]: 60,
  [panels.CHAT]: 40,
  [panels.CHATHISTORY]: 20,
};
const defaultSingleColumnConfig: Record<string, number> = {
  [panels.DASHBOARD]: 100,
  [panels.CHAT]: 100,
  [panels.CHATHISTORY]: 100,
};

const defaultPanelShowStates = {
  [panels.DASHBOARD]: true,
  [panels.CHAT]: true,
  [panels.CHATHISTORY]: false,
};

const Dashboard: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { appConfig } = state.config;
  const [panelShowStates, setPanelShowStates] = useState<
    Record<string, boolean>
  >({ ...defaultPanelShowStates });
  const [panelWidths, setPanelWidths] = useState<Record<string, number>>({
    ...defaultThreeColumnConfig,
  });
  const [layoutWidthUpdated, setLayoutWidthUpdated] = useState<boolean>(false);
  const [showClearAllConfirmationDialog, setChowClearAllConfirmationDialog] =
    useState(false);
  const [clearing, setClearing] = React.useState(false);
  const [clearingError, setClearingError] = React.useState(false);
  console.log("state", { ...state });

  useEffect(() => {
    try {
      const fetchConfig = async () => {
        const configData = await getLayoutConfig();
        console.log("configData", configData);
        dispatch({ type: actionConstants.SAVE_CONFIG, payload: configData });
      };
      fetchConfig();
    } catch (error) {
      console.error("Failed to fetch chart configuration:", error);
    }
  }, []);

  const updateLayoutWidths = (newState: Record<string, boolean>) => {
    const noOfWidgetsOpen = Object.values(newState).filter((val) => val).length;
    if (appConfig === null) {
      return;
    }

    if (
      noOfWidgetsOpen === 1 ||
      (noOfWidgetsOpen === 2 && !newState[panels.CHAT])
    ) {
      setPanelWidths(defaultSingleColumnConfig);
    } else if (noOfWidgetsOpen === 2 && newState[panels.CHAT]) {
      const panelsInOpenState = Object.keys(newState).filter(
        (key) => newState[key]
      );
      const twoColLayouts = Object.keys(appConfig.TWO_COLUMN) as string[];
      for (let i = 0; i < twoColLayouts.length; i++) {
        const key = twoColLayouts[i] as string;
        const panelNames = key.split("_");
        const isMatched = panelsInOpenState.every((val) =>
          panelNames.includes(val)
        );
        const TWO_COLUMN = appConfig.TWO_COLUMN as Record<
          string,
          Record<string, number>
        >;
        if (isMatched) {
          setPanelWidths({ ...TWO_COLUMN[key] });
          break;
        }
      }
    } else {
      const threeColumn = appConfig.THREE_COLUMN as Record<string, number>;
      threeColumn.DASHBOARD =
        threeColumn.DASHBOARD > 55 ? threeColumn.DASHBOARD : 55;
      setPanelWidths({ ...threeColumn });
    }
  };

  useEffect(() => {
    updateLayoutWidths(panelShowStates);
  }, [state.config.appConfig]);

  const onHandlePanelStates = (panelName: string) => {
    setLayoutWidthUpdated((prevFlag) => !prevFlag);
    const newState = {
      ...panelShowStates,
      [panelName]: !panelShowStates[panelName],
    };
    updateLayoutWidths(newState);
    setPanelShowStates(newState);
  };

  const getHistoryListData = async () => {
    dispatch({
      type: actionConstants.UPDATE_CONVERSATIONS_FETCHING_FLAG,
      payload: true,
    });
    const convs = await historyList();
    if (convs !== null) {
      dispatch({
        type: actionConstants.ADD_CONVERSATIONS_TO_LIST,
        payload: convs,
      });
    }
    dispatch({
      type: actionConstants.UPDATE_CONVERSATIONS_FETCHING_FLAG,
      payload: false,
    });
  };

  useEffect(() => {
    getHistoryListData();
  }, []);

  const onClearAllChatHistory = async () => {
    // toggleToggleSpinner(true);
    setClearing(true);
    const response = await historyDeleteAll();
    if (!response.ok) {
      setClearingError(true);
    } else {
      setChowClearAllConfirmationDialog(false);
      dispatch({ type: actionConstants.UPDATE_ON_CLEAR_ALL_CONVERSATIONS });
    }
    setClearing(false);
    // toggleToggleSpinner(false);
  };

  // const getMessagesByConvId = (id: string) => {
  //   const conv = chatHistory.find((obj) => String(obj.id) === String(id));
  //   if (conv) {
  //     return conv?.messages || [];
  //   }
  //   return [];
  // };

  // const setMessagesByConvId = (id: string, messagesList: ChatMessage[]) => {
  //   const tempHistory = [...chatHistory];
  //   const matchedIndex = tempHistory.findIndex(
  //     (obj) => String(obj.id) === String(id)
  //   );
  //   if (matchedIndex > -1) {
  //     tempHistory[matchedIndex].messages = messagesList;
  //   }
  // };

  const onSelectConversation = async (id: string) => {
    console.log("onSelectConversation::id:>> ", id); 
    if (!id) {
      console.error("No conversation ID found");
      return;
    }
    dispatch({
      type: actionConstants.UPDATE_CHATHISTORY_CONVERSATION_FLAG,
      payload: true,
    });
    try {
      const responseMessages = await historyRead(id);
      console.log("responseMessages::id:>> ", id, responseMessages);

      if (responseMessages) {
        dispatch({
          type: actionConstants.SHOW_CHATHISTORY_CONVERSATION,
          payload: {
            id,
            messages: responseMessages,
          },
        });
      }
    } catch (error) {
      console.error("Error fetching conversation messages:", error);
    } finally {
      dispatch({
        type: actionConstants.UPDATE_CHATHISTORY_CONVERSATION_FLAG,
        payload: false,
      });
    }
  };

  const onClickClearAllOption = () => {
    setChowClearAllConfirmationDialog((prevFlag) => !prevFlag);
  };

  const onHideClearAllDialog = () => {
    setChowClearAllConfirmationDialog((prevFlag) => !prevFlag);
    setTimeout(() => {
      setClearingError(false);
    }, 1000);
  };

  // console.log("panelsInOpenState", panelShowStates, panelWidths);

  return (
    <FluentProvider
      theme={webLightTheme}
      style={{ height: "100%", backgroundColor: "#F5F5F5" }}
    >
      <div className="header">
        <div className="header-left-section">
          <AppLogo />
          <h2 className="header-title">
            Woodgrove <span className="analysis">| Call Analysis</span>
          </h2>
        </div>
        <div className="header-right-section">
          <Button
            // icon={<SparkleRegular />}
            appearance="subtle"
            onClick={() => onHandlePanelStates(panels.DASHBOARD)}
          >
            {`${
              panelShowStates?.[panels.DASHBOARD] ? "Hide" : "Show"
            } Dashboard`}
          </Button>
          <Button
            icon={<SparkleRegular />}
            appearance="subtle"
            onClick={() => onHandlePanelStates(panels.CHAT)}
          >
            {`${panelShowStates?.[panels.CHAT] ? "Hide" : "Show"} Chat`}
          </Button>
          {/* <Button 
            appearance="outline"
            onClick={() => onHandlePanelStates(panels.CHATHISTORY)}
            disabled={!panelShowStates?.[panels.CHAT]}
          >
            {`${
              panelShowStates?.[panels.CHATHISTORY] ? "Hide" : "Show"
            } Chat History`}
          </Button> */}
        </div>
      </div>
      <div className="main-container">
        {/* LEFT PANEL: DASHBOARD */}
        {panelShowStates?.[panels.DASHBOARD] && (
          <div
            className="left-section"
            style={{ width: `${panelWidths[panels.DASHBOARD]}%` }}
          >
            <Chart layoutWidthUpdated={layoutWidthUpdated} />
          </div>
        )}
        {/* MIDDLE PANEL: CHAT */}
        {panelShowStates?.[panels.CHAT] && (
          <div
            style={{
              width: `${panelWidths[panels.CHAT]}%`,
            }}
          >
            <Chat
              onHandlePanelStates={onHandlePanelStates}
              panels={panels}
              panelShowStates={panelShowStates}
            />
          </div>
        )}
        {/* RIGHT PANEL: CHAT HISTORY */}
        {panelShowStates?.[panels.CHAT] &&
          panelShowStates?.[panels.CHATHISTORY] && (
            <div
              style={{
                width: `${panelWidths[panels.CHATHISTORY]}%`,
              }}
            >
              {/* <ChatHistory />*/}
              <ChatHistoryPanel
                clearing={clearing}
                clearingError={clearingError}
                fetchingConvMessages={false}
                handleFetchHistory={() => {
                  return new Promise(() => {});
                }}
                onClearAllChatHistory={onClearAllChatHistory}
                onClickClearAllOption={onClickClearAllOption}
                onHideClearAllDialog={onHideClearAllDialog}
                // onHistoryDelete={onHistoryDelete}
                onSelectConversation={onSelectConversation}
                showClearAllConfirmationDialog={showClearAllConfirmationDialog}
                toggleToggleSpinner={() => {}}
              />
            </div>
          )}
      </div>
    </FluentProvider>
  );
};

export default Dashboard;
