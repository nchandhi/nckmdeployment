import { Conversation } from "../types/AppTypes";

export const colors: { [key: string]: string } = {
  positive: "#6576F9",
  neutral: "#B2BBFC",
  negative: "#FF749B",
  default: "#ccc", // Fallback color for any undefined sentiment
};

export const sentimentIcons: { [key: string]: string } = {
  satisfied: "Emoji2",
  neutral: "EmojiNeutral",
  dissatisfied: "Sad",
};

export const defaultSelectedFilters = {
  Topic: [],
  Sentiment: ["all"],
  DateRange: "yearToDate",
};

export const widgetsContainerMaxHeight = 82.5; // in vh
export const ACCEPT_FILTERS = ["Topic", "Sentiment", "DateRange"];
export const getEqualWidgetsWidth = (
  noOfWidgets: number,
  gapInPercentage: number
): number => {
  return (100 - (noOfWidgets - 1) * gapInPercentage) / noOfWidgets;
};

export const getCustomWidgetsWidth = (
  noOfWidgets: number,
  gapInPercentage: number,
  spaceToOccupyInPercentage: number = 50
): number => {
  const availableWidth = 100 - (noOfWidgets - 1) * gapInPercentage;
  return (spaceToOccupyInPercentage * availableWidth) / 100;
};

export const getNormalizedHeight = (height: number) => {
  return (height * widgetsContainerMaxHeight) / 100;
};

export const getGridStyles = (
  chartsList: any,
  widgetsGapInPercentage: number
) => {
  const styles: {
    gridTemplateColumns: string;
    gridTemplateRows: string;
  } = { gridTemplateColumns: "auto", gridTemplateRows: "auto" };
  try {
    if (Array.isArray(chartsList)) {
      const isWidthExists = chartsList.some(
        (chartObj) => chartObj?.layout?.width
      );
      // Equal distribution of available space calculate
      if (!isWidthExists) {
        const widgetWidth = getEqualWidgetsWidth(
          chartsList.length,
          widgetsGapInPercentage
        );
        styles.gridTemplateColumns = String(widgetWidth + "% ")
          .repeat(chartsList.length)
          .trim();
      }
      if (isWidthExists) {
        chartsList.sort((a, b) => a?.layout?.column - b?.layout?.column);
        const value = chartsList.reduce(
          (acc, current) =>
            acc +
            " " +
            getCustomWidgetsWidth(
              chartsList.length,
              widgetsGapInPercentage,
              current?.layout?.width
            ) +
            "% ",
          ""
        );
        styles.gridTemplateColumns = value.trim();
      }
      const heightValObj = chartsList.find(
        (chartObj) => chartObj?.layout?.height
      );
      if (heightValObj) {
        styles.gridTemplateRows =
          getNormalizedHeight(heightValObj?.layout?.height) + "vh";
      }
      return styles;
    }
    return styles;
  } catch (e) {
    return styles;
  }
};

export function isLastSevenDaysRange(dateToCheck: any) {
  // Get the current date
  const currentDate = new Date();
  // Calculate the date 2 days ago
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(currentDate.getDate() - 2);
  // Calculate the date 8 days ago
  const eightDaysAgo = new Date();
  eightDaysAgo.setDate(currentDate.getDate() - 8);
  // Ensure the comparison dates are in the correct order
  // We need eightDaysAgo to be earlier than twoDaysAgo
  return dateToCheck >= eightDaysAgo && dateToCheck <= twoDaysAgo;
}

export const segregateItems = (items: Conversation[]) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  // Sort items by updatedAt in descending order
  items.sort(
    (a, b) =>
      new Date(b.updatedAt ? b.updatedAt : new Date()).getTime() -
      new Date(a.updatedAt ? a.updatedAt : new Date()).getTime()
  );
  const groupedItems: {
    Today: Conversation[];
    Yesterday: Conversation[];
    Last7Days: Conversation[];
    Older: Conversation[];
    Past: { [key: string]: Conversation[] };
  } = {
    Today: [],
    Yesterday: [],
    Last7Days: [],
    Older: [],
    Past: {},
  };

  items.forEach((item) => {
    const itemDate = new Date(item.updatedAt ? item.updatedAt : new Date());
    const itemDateOnly = itemDate.toDateString();
    if (itemDateOnly === today.toDateString()) {
      groupedItems.Today.push(item);
    } else if (itemDateOnly === yesterday.toDateString()) {
      groupedItems.Yesterday.push(item);
    } else if (isLastSevenDaysRange(itemDate)) {
      groupedItems.Last7Days.push(item);
    } else {
      groupedItems.Older.push(item);
    }
  });

  const finalResult = [
    { title: `Today`, entries: groupedItems.Today },
    {
      title: `Yesterday`,
      entries: groupedItems.Yesterday,
    },
    {
      title: `Last 7 days`,
      entries: groupedItems.Last7Days,
    },
    {
      title: `Older`,
      entries: groupedItems.Older,
    },
  ];

  return finalResult;
};
