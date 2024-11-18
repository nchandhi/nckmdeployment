import { historyListResponse } from "../configs/StaticData";
import { Conversation, message } from "../types/AppTypes";

export const fetchChartData = async () => {
  try {
    const response = await fetch(
      "https://chartsfunckm.azurewebsites.net/api/GetMetrics?data_type=charts"
    );
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch chart data:", error);
    throw error; // Rethrow the error so the calling function can handle it
  }
};

export const fetchChartDataWithFilters = async (bodyData: any) => {
  try {
    const response = await fetch(
      "https://chartsfunckm.azurewebsites.net/api/GetMetrics?data_type=charts",
      {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(bodyData),
      }
    );
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch chart data:", error);
    throw error; // Rethrow the error so the calling function can handle it
  }
};

export const fetchFilterData = async () => {
  try {
    const response = await fetch(
      "https://chartsfunckm.azurewebsites.net/api/GetMetrics?data_type=filters"
    );
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch filter data:", error);
    throw error;
  }
};


export const historyRead = async (convId: string): Promise<message[]> => {
  const response = await fetch("/api/history/read", {
    method: "POST",
    body: JSON.stringify({
      conversation_id: convId,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then(async (res) => {
      if (!res) {
        return [];
      }
      const payload = await res.json();
      const messages: message[] = [];
      if (payload?.messages) {
        payload.messages.forEach((msg: any) => {
          const message = {
            id: msg.id,
            role: msg.role,
            date: msg.createdAt,
            content: msg.content,
            feedback: msg.feedback ?? undefined,
          };
          messages.push(message);
        });
      }
      return messages;
    })
    .catch((_err) => {
      console.error("There was an issue fetching your data.");
      return [];
    });
  return response;
};

export const historyList = async (
  offset = 0
): Promise<Conversation[] | null> => {
  let response = await fetch(`/api/history/list?offset=${offset}`, {
    method: "GET",
  })
    .then(async (res) => {
      let payload = await res.json();
      if (!Array.isArray(payload)) {
        console.error("There was an issue fetching your data.");
        return null;
      }
      const conversations: Conversation[] = payload.map((conv: any) => {
        const conversation: Conversation = {
          id: conv.id,
          title: conv.title,
          date: conv.createdAt,
          updatedAt: conv?.updatedAt,
          messages: [],
        };
        return conversation;
      });
      return conversations;
    })
    .catch((_err) => {
      console.error("There was an issue fetching your data.", _err);
      const conversations: Conversation[] = historyListResponse.map((conv: any) => {
        const conversation: Conversation = {
          id: conv.id,
          title: conv.title,
          date: conv.createdAt,
          updatedAt: conv?.updatedAt,
          messages: [],
        };
        return conversation;
      });
      return conversations;
      // return null;
    });
  return response;
};

export const historyUpdate = async (
  messages: message[],
  convId: string
): Promise<Response> => {
  const response = await fetch("/api/history/update", {
    method: "POST",
    body: JSON.stringify({
      conversation_id: convId,
      messages: messages,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then(async (res) => {
      return res;
    })
    .catch((_err) => {
      console.error("There was an issue fetching your data.");
      const errRes: Response = {
        ...new Response(),
        ok: false,
        status: 500,
      };
      return errRes;
    });
  return response;
};

export const historyRename = async (
  convId: string,
  title: string
): Promise<Response> => {
  const response = await fetch("/api/history/rename", {
    method: "POST",
    body: JSON.stringify({
      conversation_id: convId,
      title: title,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => {
      return res;
    })
    .catch((_err) => {
      console.error("There was an issue fetching your data.");
      const errRes: Response = {
        ...new Response(),
        ok: false,
        status: 500,
      };
      return errRes;
    });
  return response;
};

export const historyDelete = async (convId: string): Promise<Response> => {
  const response = await fetch("/api/history/delete", {
    method: "DELETE",
    body: JSON.stringify({
      conversation_id: convId,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => {
      return res;
    })
    .catch((_err) => {
      console.error("There was an issue fetching your data.");
      const errRes: Response = {
        ...new Response(),
        ok: false,
        status: 500,
      };
      return errRes;
    });
  return response;
};

export const historyDeleteAll = async (): Promise<Response> => {
  const response = await fetch("api/history/delete_all", {
    method: "DELETE",
    body: JSON.stringify({}),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => {
      return res;
    })
    .catch((_err) => {
      console.error("There was an issue fetching your data.");
      const errRes: Response = {
        ...new Response(),
        ok: false,
        status: 500,
      };
      return errRes;
    });
  return response;
};