import React, { useRef, useState } from "react";
import { Button, Input, Text } from "@fluentui/react-components"; // Added Spinner for generatingResponse state
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
  type message,
} from "../../types/AppTypes";
import { callConversationApi, historyUpdate } from "../../api/api";
import { ChatAdd24Regular } from "@fluentui/react-icons";
import { generateUUIDv4 } from "../../configs/Utils";

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
  const [selectedConvId, setSelectedConvId] = useState("");
  const [conversationId, setConversationId] = useState<string>(
    generateUUIDv4()
  );

  const questionInputRef = useRef<HTMLInputElement>(null);
  const abortFuncs = useRef([] as AbortController[]);

  const saveToDB = async (messages: message[], convId: string) => {
    if (!convId || !messages.length) {
      return;
    }
    const isNewConversation = !selectedConvId;
    // setIsSavingToDB(true);
    await historyUpdate(messages, convId)
      .then(async (res) => {
        if (!res.ok) {
          let errorMessage = "Answers can't be saved at this time.";
          let errorChatMsg: message = {
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
          setSelectedConvId(metaData?.conversation_id);
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
    const newMessage: message = {
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
      id: selectedConvId || conversationId,
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
      console.log("response>>> ", response);
      if (response?.body) {
        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          let runningText = "";
          if (done) break;
          var text = new TextDecoder("utf-8").decode(value);
          const objects = text.split("\n");
          // console.log("<> objects", objects, objects.length);
          objects.forEach((obj) => {
            // console.log("<> obj", obj);
            try {
              runningText += obj;
              result = JSON.parse(runningText);
              // setShowLoadingMessage(false);
              // console.log("<> objects", result, runningText);
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
          "response>>> final",
          result.choices[0].messages,
          state.chat.messages
        );
        // saveToDB(updatedMessages, selectedConvId || conversationId);
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
      // setAnswers([...answers, userMessage]);
      // since chat API failing checking update history API in fail block with sample response
      // result = {
      //   choices: [
      //     {
      //       messages: [
      //         {
      //           content:
      //             "I am sorry but I am unable to answer this question given the provided data.",
      //           role: "assistant",
      //         },
      //       ],
      //     },
      //   ],
      //   created: 1732022783,
      //   id: "1c5282ac-5cf9-4451-9d91-ab4be3aaaa4e",
      //   model: "graphrag-model",
      //   object: "chat.completion" as ChatCompletionType.ChatCompletion,
      // };
      // const updatedMessages = [
      //   ...state.chat.messages,
      //   newMessage,
      //   ...result.choices[0].messages,
      // ];
      // saveToDB(updatedMessages, selectedConvId || conversationId);
    } finally {
      dispatch({
        type: actionConstants.UPDATE_GENERATING_RESPONSE_FLAG,
        payload: false,
      });
    }

    // try {
    //   // Send the user's message to the backend
    //   const response = await axios.post("/api/chat", {
    //     messages: [{ role: "user", content: userMessage }],
    //   });
    //   console.log("Response:", response.data);
    //   // Define the type for assistantResponse
    //   type AssistantResponse = {
    //     content: string;
    //     chart_image?: string;
    //   };
    //   // Extract assistant's response content from the response data
    //   let responseMessage: message = { content: "", role: Roles.ASSISTANT };
    //   let assistantResponse: AssistantResponse;
    //   try {
    //     // Attempt to parse as JSON if possible
    //     assistantResponse = response.data?.choices?.[0]?.messages?.[0]?.content;
    //   } catch (parseError) {
    //     // If parsing fails, treat it as plain text
    //     assistantResponse = response.data;
    //     console.error(
    //       "Response is not valid JSON. Treating as plain text:",
    //       assistantResponse
    //     );
    //   }
    //   console.log("Assistant Response:", assistantResponse);
    //   // Check if the response contains a chart (base64 string) or regular text
    //   if (assistantResponse.chart_image) {
    //     responseMessage = {
    //       role: Roles.ASSISTANT,
    //       content: (
    //         <img
    //           src={`data:image/png;base64,${assistantResponse.chart_image}`}
    //           alt="Generated Chart"
    //           className="chart-image"
    //         />
    //       ),
    //       contentType: "image",
    //     };
    //   } else if (typeof assistantResponse === "string") {
    //     responseMessage = {
    //       role: Roles.ASSISTANT,
    //       content: assistantResponse,
    //     };
    //   } else {
    //     console.error("Unexpected response format:", assistantResponse);
    //     responseMessage = {
    //       role: Roles.ASSISTANT,
    //       content: "Unexpected response format.",
    //     };
    //   }
    //   dispatch({
    //     type: actionConstants.UPDATE_MESSAGES,
    //     payload: [responseMessage],
    //   });
    // } catch (error) {
    //   console.error("Error sending message:", error);
    //   const errorMessage: message = {
    //     role: Roles.ASSISTANT,
    //     content: "Error while generating response.",
    //   };
    //   dispatch({
    //     type: actionConstants.UPDATE_MESSAGES,
    //     payload: [errorMessage],
    //   });
    // } finally {
    //   dispatch({
    //     type: actionConstants.UPDATE_GENERATING_RESPONSE_FLAG,
    //     payload: false,
    //   });
    // }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
                <Text>{msg.content}</Text>
              </div>
            ) : (
              <div className="assistant-message">
                {typeof msg.content === "string" ? (
                  <span dangerouslySetInnerHTML={{ __html: msg.content }} />
                ) : (
                  msg.content
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
        <div className="chat-input">
          <Input
            value={userMessage}
            onChange={(e, data) => setUserMessage(data.value || "")}
            placeholder="Ask a question..."
            // disabled={generatingResponse}
            onKeyDown={handleKeyDown}
            className="input-field"
            // ref={questionInputRef}
            input={{ ref: questionInputRef }}
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
