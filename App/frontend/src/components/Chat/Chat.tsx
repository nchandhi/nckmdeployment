import React, { useRef } from "react";
import { Input, Text } from "@fluentui/react-components"; // Added Spinner for generatingResponse state
import axios from "axios";
import "./Chat.css";
import SparkleIcon from "../../Assets/Sparkle.svg";
import { DefaultButton } from "@fluentui/react";
import { useAppContext } from "../../state/useAppContext";
import { actionConstants } from "../../state/ActionConstants";
import { Roles, type message } from "../../types/AppTypes";

const Chat: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { userMessage, generatingResponse } = state?.chat;
  const questionInputRef = useRef<HTMLInputElement>(null);
  const handleSendMessage = async () => {
    if (!userMessage.trim()) return;
    const newMessage: message = { role: Roles.USER, content: userMessage };
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
    try {
      // Send the user's message to the backend
      const response = await axios.post("/api/chat", {
        messages: [{ role: "user", content: userMessage }],
      });
      console.log("Response:", response.data);
      // Define the type for assistantResponse
      type AssistantResponse = {
        content: string;
        chart_image?: string;
      };
      // Extract assistant's response content from the response data
      let responseMessage: message = { content: "", role: Roles.ASSISTANT };
      let assistantResponse: AssistantResponse;
      try {
        // Attempt to parse as JSON if possible
        assistantResponse = response.data?.choices?.[0]?.messages?.[0]?.content;
      } catch (parseError) {
        // If parsing fails, treat it as plain text
        assistantResponse = response.data;
        console.error(
          "Response is not valid JSON. Treating as plain text:",
          assistantResponse
        );
      }
      console.log("Assistant Response:", assistantResponse);
      // Check if the response contains a chart (base64 string) or regular text
      if (assistantResponse.chart_image) {
        responseMessage = {
          role: Roles.ASSISTANT,
          content: (
            <img
              src={`data:image/png;base64,${assistantResponse.chart_image}`}
              alt="Generated Chart"
              className="chart-image"
            />
          ),
        };
      } else if (typeof assistantResponse === "string") {
        responseMessage = {
          role: Roles.ASSISTANT,
          content: assistantResponse,
        };
      } else {
        console.error("Unexpected response format:", assistantResponse);
        responseMessage = {
          role: Roles.ASSISTANT,
          content: "Unexpected response format.",
        };
      }
      dispatch({
        type: actionConstants.UPDATE_MESSAGES,
        payload: [responseMessage],
      });
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: message = {
        role: Roles.ASSISTANT,
        content: "Error while generating response.",
      };
      dispatch({
        type: actionConstants.UPDATE_MESSAGES,
        payload: [errorMessage],
      });
    } finally {
      dispatch({
        type: actionConstants.UPDATE_GENERATING_RESPONSE_FLAG,
        payload: false,
      });
    }
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
  const { messages } = state.chat;
  return (
    <div className="chat-container">
      <div className="chat-header">Chat</div>
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
      <div className="chat-input">
        <Input
          value={userMessage}
          onChange={(e, data) => setUserMessage(data.value || "")}
          placeholder="Ask a question..."
          disabled={generatingResponse}
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
  );
};

export default Chat;
