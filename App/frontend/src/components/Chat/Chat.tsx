import React, { useRef, useState } from "react";
import { Button, Input, Text, Textarea } from "@fluentui/react-components"; // Added Spinner for generatingResponse state
import axios from "axios";
import "./Chat.css";
import SparkleIcon from "../../Assets/Sparkle.svg";
import { DefaultButton } from "@fluentui/react";
import { useAppContext } from "../../state/useAppContext";
import { actionConstants } from "../../state/ActionConstants";
import {
  ChatCompletionType,
  ChatResponse,
  ConversationRequest,
  type ChatMessage,
} from "../../types/AppTypes";
import {
  callConversationApi,
  historyGenerate,
  historyUpdate,
} from "../../api/api";
import { ChatAdd24Regular } from "@fluentui/react-icons";
import { generateUUIDv4, parseErrorMessage } from "../../configs/Utils";

type ChatProps = {
  onHandlePanelStates: (name: string) => void;
  panels: Record<string, string>;
  panelShowStates: Record<string, boolean>;
};

const [ASSISTANT, TOOL, ERROR, USER] = ["assistant", "tool", "error", "user"];
const NO_CONTENT_ERROR = "No content in messages object.";

const Chat: React.FC<ChatProps> = ({
  onHandlePanelStates,
  panelShowStates,
  panels,
}) => {
  const { state, dispatch } = useAppContext();
  const { userMessage, generatingResponse } = state?.chat;
  const questionInputRef = useRef<HTMLTextAreaElement>(null);
  const abortFuncs = useRef([] as AbortController[]);

  const saveToDB = async (messages: ChatMessage[], convId: string) => {
    if (!convId || !messages.length) {
      return;
    }
    const isNewConversation = !state.selectedConversationId;
    // setIsSavingToDB(true);
    await historyUpdate(messages, convId)
      .then(async (res) => {
        if (!res.ok) {
          let errorMessage = "Answers can't be saved at this time.";
          let errorChatMsg: ChatMessage = {
            id: generateUUIDv4(),
            role: "error",
            content: errorMessage,
            date: new Date().toISOString(),
          };
          if (!messages) {
            // setAnswers([...messages, errorChatMsg]);
            let err: Error = {
              ...new Error(),
              message: "Failure fetching current chat state.",
            };
            throw err;
          }
        }
        let responseJson = await res.json();
        if (isNewConversation && responseJson?.success) {
          const metaData = responseJson?.data;
          const newConversation = {
            id: metaData?.conversation_id,
            title: metaData?.title,
            messages: messages,
            date: metaData?.date,
          };
          // setChatHistory((prevHistory) => [newConversation, ...prevHistory]);
          dispatch({
            type: actionConstants.UPDATE_SELECTED_CONV_ID,
            payload: metaData?.conversation_id,
          });
        } else if (responseJson?.success) {
          // setMessagesByConvId(convId, messages);
        }
        // setIsSavingToDB(false);
        return res as Response;
      })
      .catch((err) => {
        console.error("Error: while saving data", err);
        // setIsSavingToDB(false);
      })
      .finally(() => {
        dispatch({
          type: actionConstants.UPDATE_GENERATING_RESPONSE_FLAG,
          payload: false,
        });
      });
  };

  const handleSendMessage = async () => {
    if (generatingResponse) {
      return;
    }
    if (!userMessage.trim()) return;
    const abortController = new AbortController();
    abortFuncs.current.unshift(abortController);
    const newMessage: ChatMessage = {
      role: "user",
      content: userMessage,
      id: generateUUIDv4(),
      date: new Date().toISOString(),
    };
    dispatch({
      type: actionConstants.UPDATE_GENERATING_RESPONSE_FLAG,
      payload: true,
    });
    dispatch({
      type: actionConstants.UPDATE_MESSAGES,
      payload: [newMessage],
    });
    dispatch({
      type: actionConstants.UPDATE_USER_MESSAGE,
      payload: "",
    });

    const request: ConversationRequest = {
      id: state.selectedConversationId || state.generatedConversationId,
      messages: [...state.chat.messages, newMessage].filter(
        (messageObj) => messageObj.role !== ERROR
      ),
    };
    let result = {} as ChatResponse;

    try {
      const response = await callConversationApi(
        request,
        abortController.signal
      );
      if (response?.body) {
        console.log(">>> response?.body", response);
        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          console.log(">>> response?.body value", done, value);
          let runningText = "";
          if (done) break;
          var text = new TextDecoder("utf-8").decode(value);
          const objects = text.split("\n");
          console.log(">>> objects", objects, objects.length);
          objects.forEach((obj) => {
            console.log(">>>> ", obj);
            try {
              runningText += obj;
              result = JSON.parse(runningText);
              // setShowLoadingMessage(false);
              console.log(">>>> ", result, runningText);
              if (result.error) {
                // setAnswers([
                //   ...answers,
                //   newMessage,
                //   {
                //     role: "error",
                //     content: result.error,
                //     id: "",
                //     date: "",
                //   },
                // ]);
              } else {
                // setAnswers([
                //   ...answers,
                //   newMessage,
                //   ...result.choices[0].messages,
                // ]);
              }
              runningText = "";
            } catch {}
          });
        }
        if (Array.isArray(result.choices[0].messages)) {
          result.choices[0].messages = result.choices[0].messages.map(
            (msgObj) => {
              if (!msgObj?.date) {
                msgObj.date = new Date().toISOString();
              }
              if (!msgObj?.id) {
                msgObj.id = generateUUIDv4();
              }
              return msgObj;
            }
          );
        }
        const updatedMessages = [
          ...state.chat.messages,
          newMessage,
          ...result.choices[0].messages,
        ];
        dispatch({
          type: actionConstants.UPDATE_MESSAGES,
          payload: [...result.choices[0].messages],
        });
        // setAnswers(updatedMessages);
        console.log(
          ">>> response final",
          result.choices[0].messages,
          state.chat.messages
        );
        saveToDB(
          updatedMessages,
          state.selectedConversationId || state.generatedConversationId
        );
      }
    } catch (e) {
      if (!abortController.signal.aborted) {
        if (e instanceof Error) {
          alert(e.message);
        } else {
          alert(
            "An error occurred. Please try again. If the problem persists, please contact the site administrator."
          );
        }
      }
    } finally {
      dispatch({
        type: actionConstants.UPDATE_GENERATING_RESPONSE_FLAG,
        payload: false,
      });
    }
  };

  // let assistantMessage = {} as ChatMessage
  // let toolMessage = {} as ChatMessage
  // let assistantContent = ''

  // const processResultMessage = (resultMessage: ChatMessage, userMessage: ChatMessage, conversationId?: string) => {
  //   if (resultMessage.role === ASSISTANT) {
  //     assistantContent += resultMessage.content
  //     assistantMessage = resultMessage
  //     assistantMessage.content = assistantContent

  //     if (resultMessage.context) {
  //       toolMessage = {
  //         id: uuid(),
  //         role: TOOL,
  //         content: resultMessage.context,
  //         date: new Date().toISOString()
  //       }
  //     }
  //   }

  //   if (resultMessage.role === TOOL) toolMessage = resultMessage

  //   if (!conversationId) {
  //     isEmpty(toolMessage)
  //       ? setMessages([...messages, userMessage, assistantMessage])
  //       : setMessages([...messages, userMessage, toolMessage, assistantMessage])
  //   } else {
  //     isEmpty(toolMessage)
  //       ? setMessages([...messages, assistantMessage])
  //       : setMessages([...messages, toolMessage, assistantMessage])
  //   }
  // }

  const makeApiRequestWithCosmosDB = async (
    question: string,
    conversationId?: string
  ) => {
    if (generatingResponse || !question.trim()) {
      return;
    }
    
    const newMessage: ChatMessage = {
      id: generateUUIDv4(),
      role: "user",
      content: question,
      date: new Date().toISOString(),
    };
    dispatch({
      type: actionConstants.UPDATE_GENERATING_RESPONSE_FLAG,
      payload: true,
    });
    dispatch({
      type: actionConstants.UPDATE_MESSAGES,
      payload: [newMessage],
    });
    dispatch({
      type: actionConstants.UPDATE_USER_MESSAGE,
      payload: "",
    });

    const abortController = new AbortController();
    abortFuncs.current.unshift(abortController);

    const request: ConversationRequest = {
      id: state.selectedConversationId || state.generatedConversationId,
      messages: [...state.chat.messages, newMessage].filter(
        (messageObj) => messageObj.role !== ERROR
      ),
    };
    let result = {} as ChatResponse;

    try {
      const response = await callConversationApi(
        request,
        abortController.signal
      );
      if (response?.body) {
        console.log(">>> response?.body", response);
        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          console.log(">>> response?.body value", done, value);
          let runningText = "";
          if (done) break;
          var text = new TextDecoder("utf-8").decode(value);
          const objects = text.split("\n");
          console.log(">>> objects", objects, objects.length);
          objects.forEach((obj) => {
            console.log(">>>> ", obj);
            try {
              runningText += obj;
              result = JSON.parse(runningText);
              // setShowLoadingMessage(false);
              console.log(">>>> ", result, runningText);
              if (result.error) {
                // setAnswers([
                //   ...answers,
                //   newMessage,
                //   {
                //     role: "error",
                //     content: result.error,
                //     id: "",
                //     date: "",
                //   },
                // ]);
              } else {
                // setAnswers([
                //   ...answers,
                //   newMessage,
                //   ...result.choices[0].messages,
                // ]);
              }
              runningText = "";
            } catch {}
          });
        }
        if (Array.isArray(result.choices[0].messages)) {
          result.choices[0].messages = result.choices[0].messages.map(
            (msgObj) => {
              if (!msgObj?.date) {
                msgObj.date = new Date().toISOString();
              }
              if (!msgObj?.id) {
                msgObj.id = generateUUIDv4();
              }
              return msgObj;
            }
          );
        }
        const updatedMessages = [
          ...state.chat.messages,
          newMessage,
          ...result.choices[0].messages,
        ];
        dispatch({
          type: actionConstants.UPDATE_MESSAGES,
          payload: [...result.choices[0].messages],
        });
        // setAnswers(updatedMessages);
        console.log(
          ">>> response final",
          result.choices[0].messages,
          state.chat.messages
        );
        saveToDB(
          updatedMessages,
          state.selectedConversationId || state.generatedConversationId
        );
      }
    } catch (e) {
      if (!abortController.signal.aborted) {
        if (e instanceof Error) {
          alert(e.message);
        } else {
          alert(
            "An error occurred. Please try again. If the problem persists, please contact the site administrator."
          );
        }
      }
    } finally {
      dispatch({
        type: actionConstants.UPDATE_GENERATING_RESPONSE_FLAG,
        payload: false,
      });
    }
    return abortController.abort();
  };

  const makeApiRequestWithoutCosmosDB = (
    question: string,
    conversationId?: string
  ) => {};

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // handleSendMessage();
      const conversationId = state?.selectedConversationId;
      if (userMessage) {
        state.cosmosInfo?.cosmosDB
          ? makeApiRequestWithCosmosDB(userMessage, conversationId)
          : makeApiRequestWithoutCosmosDB(userMessage, conversationId);
      }
      if (questionInputRef?.current) {
        questionInputRef?.current.focus();
      }
    }
  };

  const setUserMessage = (value: string) => {
    dispatch({ type: actionConstants.UPDATE_USER_MESSAGE, payload: value });
  };

  const onNewConversation = () => {
    dispatch({ type: actionConstants.NEW_CONVERSATION_START });
  };
  const { messages } = state.chat;
  return (
    <div className="chat-container">
      <div className="chat-header">
        <span>Chat</span>
        <span>
          <Button
            // icon={<SparkleRegular />}
            appearance="outline"
            onClick={() => onHandlePanelStates(panels.CHATHISTORY)}
            // disabled={!panelShowStates?.[panels.CHAT]}
            className="hide-chat-history"
          >
            {`${
              panelShowStates?.[panels.CHATHISTORY] ? "Hide" : "Show"
            } Chat History`}
          </Button>
        </span>
      </div>
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="initial-msg">
            <img src={SparkleIcon} alt="Sparkle" />
            <span>Start Chatting</span>
            <span>
              You can ask questions around agent performance, issue resolution,
              or something else.
            </span>
          </div>
        )}
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.role}`}>
            {msg.role === "user" ? (
              <div className="user-message">
                <span>{msg.content}</span>
              </div>
            ) : (
              <div className="assistant-message">
                {msg.contentType === "image" ? (
                  <img
                    src={`data:image/png;base64,${msg.content}`}
                    alt="Generated Chart"
                    className="chart-image"
                  />
                ) : (
                  typeof msg.content === "string" && (
                    <>
                      <span dangerouslySetInnerHTML={{ __html: msg.content }} />
                    </>
                  )
                )}
                <div className="answerDisclaimerContainer">
                  <span className="answerDisclaimer">
                    AI-generated content may be incorrect
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator for assistant response */}
        {generatingResponse && (
          <div className="assistant-message loading-indicator">
            <div className="typing-indicator">
              {/* <span className="dot">Generating message</span> */}
              <span className="generating-text">Generating answer</span>
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}
      </div>
      <div className="chat-footer">
        <Button
          className="btn-create-conv"
          shape="circular"
          appearance="primary"
          icon={<ChatAdd24Regular />}
          onClick={onNewConversation}
          title="Create new Conversation"
          disabled={generatingResponse}
        />
        <div className="text-area-container">
          <Textarea
            className="textarea-field"
            value={userMessage}
            onChange={(e, data) => setUserMessage(data.value || "")}
            placeholder="Ask a question..."
            // disabled={generatingResponse}
            onKeyDown={handleKeyDown}
            ref={questionInputRef}
            rows={2}
            style={{ resize: "none" }}
            appearance="outline"
          />
          <DefaultButton
            iconProps={{ iconName: "Send" }}
            role="button"
            onClick={handleSendMessage}
            disabled={generatingResponse || !userMessage.trim()}
            className="send-button"
            aria-disabled={generatingResponse || !userMessage}
            title="Send Question"
          />
        </div>
      </div>
    </div>
  );
};

export default Chat;
