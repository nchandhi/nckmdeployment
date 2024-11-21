import React, { useState } from "react";
import {
  CommandBarButton,
  ContextualMenu,
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  ICommandBarStyles,
  IContextualMenuItem,
  PrimaryButton,
  Stack,
  StackItem,
  Text,
} from "@fluentui/react";

import styles from "./ChatHistoryPanel.module.css";
import { type Conversation } from "../../types/AppTypes";
import { ChatHistoryListItemGroups } from "../ChatHistoryListItemGroups/ChatHistoryListItemGroups";
import { useAppContext } from "../../state/useAppContext";

const commandBarStyle: ICommandBarStyles = {
  root: {
    padding: "0",
    display: "flex",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
};

export type ChatHistoryPanelProps = {  
  clearingError: boolean;
  clearing: boolean;
  onHideClearAllDialog?: () => void;
  onClearAllChatHistory?: () => Promise<void>;
  hideClearAllDialog: boolean;
  toggleToggleSpinner: (toggler: boolean) => void;
  toggleClearAllDialog: () => void; 
  fetchingChatHistory: boolean;
  handleFetchHistory: () => Promise<void>;
  onSelectConversation: (id: string) => Promise<void>;
  selectedConvId: string;
  onHistoryTitleChange: (id: string, newTitle: string) => void;
  onHistoryDelete: (id: string) => void;
  showLoadingMessage: boolean;
  showContextualPopup: boolean;
  fetchingConvMessages: boolean;
};

const modalProps = {
  titleAriaId: "labelId",
  subtitleAriaId: "subTextId",
  isBlocking: true,
  styles: { main: { maxWidth: 450 } },
};

export const ChatHistoryPanel: React.FC<ChatHistoryPanelProps> = (props) => {
  const {  
    clearingError,
    clearing,
    onHideClearAllDialog,
    onClearAllChatHistory,
    hideClearAllDialog,
    toggleToggleSpinner,
    toggleClearAllDialog, 
    fetchingChatHistory,
    handleFetchHistory,
    onSelectConversation,
    selectedConvId,
    onHistoryTitleChange,
    onHistoryDelete,
    showLoadingMessage,
    showContextualPopup,
    fetchingConvMessages,
  } = props;
  const { state, dispatch } = useAppContext();
  const { chatHistory } = state;
  const [showClearAllContextMenu, setShowClearAllContextMenu] =
    useState<boolean>(false);

  const { generatingResponse } = state?.chat;
  const clearAllDialogContentProps = {
    type: DialogType.close,
    title: !clearingError
      ? "Are you sure you want to clear all chat history?"
      : "Error deleting all of chat history",
    closeButtonAriaLabel: "Close",
    subText: !clearingError
      ? "All chat history will be permanently removed."
      : "Please try again. If the problem persists, please contact the site administrator.",
  };

  const disableClearAllChatHistory =
    !chatHistory.list.length ||
    generatingResponse ||
    fetchingConvMessages ||
    fetchingChatHistory;
  const menuItems: IContextualMenuItem[] = [
    {
      key: "clearAll",
      text: "Clear all chat history",
      disabled: disableClearAllChatHistory,
      iconProps: { iconName: "Delete" },
    },
  ];

  const handleClearAllContextualMenu = () => {
    setShowClearAllContextMenu((prev) => !prev);
  };

  return (
    <section
      className={styles.historyContainer}
      data-is-scrollable
      aria-label={"chat history panel"}
    >
      <Stack
        horizontal
        horizontalAlign="space-between"
        verticalAlign="center"
        wrap
        aria-label="chat history header"
        className="mt-8"
      >
        <StackItem>
          <Text
            role="heading"
            aria-level={2}
            style={{
              alignSelf: "center",
              fontWeight: "600",
              fontSize: "18px",
              marginRight: "auto",
              paddingLeft: "20px",
            }}
          >
            Chat history
          </Text>
        </StackItem>
        <Stack horizontal className={styles.historyPanelTopRightButtons}>
          <Stack horizontal>
            <CommandBarButton
              iconProps={{ iconName: "More" }}
              title={"Clear all chat history"}
              onClick={handleClearAllContextualMenu}
              aria-label={"clear all chat history"}
              styles={commandBarStyle}
              role="button"
              id="moreButton"
            />
            <ContextualMenu
              items={menuItems}
              hidden={!showClearAllContextMenu}
              target={"#moreButton"}
              onItemClick={toggleClearAllDialog}
              onDismiss={handleClearAllContextualMenu}
            />
          </Stack>

          {/* <Stack horizontal>
            <CommandBarButton
              iconProps={{ iconName: "Cancel" }}
              title={"Hide"}
              aria-label={"hide button"}
              role="button"
              // onClick={() => setShowHistoryPanel(false)}
            />
          </Stack> */}
        </Stack>
      </Stack>
      <Stack
        aria-label="chat history panel content"
        style={{
          display: "flex",
          height: "calc(100% - 3rem)",
          padding: "1px",
        }}
      >
        <Stack className={styles.chatHistoryListContainer}>
          <ChatHistoryListItemGroups
            fetchingChatHistory={fetchingChatHistory}
            handleFetchHistory={handleFetchHistory}
            onSelectConversation={onSelectConversation}
            selectedConvId={selectedConvId}
            onHistoryTitleChange={onHistoryTitleChange}
            onHistoryDelete={onHistoryDelete}
            isGenerating={showLoadingMessage}
            toggleToggleSpinner={toggleToggleSpinner}
          />
        </Stack>
      </Stack>
      {showContextualPopup && (
        <Dialog
          hidden={hideClearAllDialog}
          onDismiss={clearing ? () => {} : onHideClearAllDialog}
          dialogContentProps={clearAllDialogContentProps}
          modalProps={modalProps}
        >
          <DialogFooter>
            {!clearingError && (
              <PrimaryButton
                onClick={onClearAllChatHistory}
                disabled={clearing}
                text="Clear All"
              />
            )}
            <DefaultButton
              onClick={onHideClearAllDialog}
              disabled={clearing}
              text={!clearingError ? "Cancel" : "Close"}
            />
          </DialogFooter>
        </Dialog>
      )}
    </section>
  );
};
