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
import { AppLogo } from "./components/Svg/Svg";
import chartConfigs from "./configs/chartConfig.json";
import { ChatHistoryPanel } from "./components/ChatHistoryPanel/ChatHistoryPanel";
import { historyList } from "./api/api";
import { Conversation } from "./types/AppTypes";
import { useAppContext } from "./state/useAppContext";
import { actionConstants } from "./state/ActionConstants";

const chartConfig: {
  appConfig: Record<
    string,
    Record<string, number> | Record<string, Record<string, number>>
  >;
} = { ...chartConfigs };

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
  const { appConfig } = chartConfig;
  const [panelShowStates, setPanelShowStates] = useState<
    Record<string, boolean>
  >({ ...defaultPanelShowStates });
  const [panelWidths, setPanelWidths] = useState<Record<string, number>>({
    ...defaultThreeColumnConfig,
  });
  const [layoutWidthUpdated, setLayoutWidthUpdated] = useState<boolean>(false);
  const { state, dispatch } = useAppContext();

  const updateLayoutWidths = (newState: Record<string, boolean>) => {
    const noOfWidgetsOpen = Object.values(newState).filter((val) => val).length;

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
  }, []);

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
    const convs = await historyList();
    if (convs !== null) {
      dispatch({
        type: actionConstants.ADD_CONVERSATIONS_TO_LIST,
        payload: convs,
      });
    }
  };

  useEffect(() => {
    getHistoryListData();
  }, []);

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
            appearance="outline"
            onClick={() => onHandlePanelStates(panels.DASHBOARD)}
          >
            {`${
              panelShowStates?.[panels.DASHBOARD] ? "Hide" : "Show"
            } Dashboard`}
          </Button>
          <Button
            icon={<SparkleRegular />}
            appearance="outline"
            onClick={() => onHandlePanelStates(panels.CHAT)}
          >
            {`${panelShowStates?.[panels.CHAT] ? "Hide" : "Show"} Chat`}
          </Button>
          <Button
            // icon={<SparkleRegular />}
            appearance="outline"
            onClick={() => onHandlePanelStates(panels.CHATHISTORY)}
            disabled={!panelShowStates?.[panels.CHAT]}
          >
            {`${
              panelShowStates?.[panels.CHATHISTORY] ? "Hide" : "Show"
            } Chat History`}
          </Button>
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
            <Chat />
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
                clearing={false}
                clearingError={false}
                fetchingChatHistory={false}
                fetchingConvMessages={false}
                handleFetchHistory={() => {
                  return new Promise(() => {});
                }}
                hideClearAllDialog={true}
                onClearAllChatHistory={() => {
                  return new Promise(() => {});
                }}
                onHideClearAllDialog={() => {}}
                onHistoryDelete={() => {}}
                onHistoryTitleChange={() => {}}
                onSelectConversation={() => {
                  return new Promise(() => {});
                }}
                selectedConvId={""}
                showContextualPopup={false}
                showLoadingMessage={false}
                toggleClearAllDialog={() => {}}
                toggleToggleSpinner={() => {}}
              />
            </div>
          )}
      </div>
    </FluentProvider>
  );
};

export default Dashboard;
