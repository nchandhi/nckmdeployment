import React from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableBody,
  TableCell,
  TableHeaderCell,
} from "@fluentui/react-components";
import { colors } from "../configs/Utils";

interface TopicTableProps {
  columns: string[];
  columnKeys: string[];
  rows: { [key: string]: string | number }[];
  containerHeight: number;
}

const TopicTable: React.FC<TopicTableProps> = ({
  columns,
  rows,
  columnKeys,
}) => {
  return (
    <div
      tabIndex={0}
      style={{
        ...tableStyles.container,
        height: "91%",
      }}
    >
      <Table>
        {/* Header */}
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHeaderCell key={index} style={tableStyles.header}>
                {column}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHeader>

        {/* Body */}
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index}>
              {columnKeys.map((columnKey) => (
                <TableCell key={columnKey} style={tableStyles.cell}>
                  {columnKey === "average_sentiment" ? (
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div
                        style={{
                          backgroundColor:
                            colors[row[columnKey] as string] || colors.default,
                          width: "20px",
                          height: "20px",
                          marginRight: "10px",
                          borderRadius: "4px",
                        }}
                      ></div>
                      <span>{row[columnKey]}</span>
                    </div>
                  ) : (
                    row[columnKey]
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TopicTable;

const tableStyles: { [key: string]: React.CSSProperties } = {
  container: {
    overflowY: "auto",
    backgroundColor: "#fff",
    borderRadius: "2px",
    boxShadow: "0px 1px 5px rgba(0, 0, 0, 0.1)",
  },
  header: {
    backgroundColor: "#f4f4f4",
    fontWeight: "bold",
    textAlign: "left",
    padding: "2px",
    fontSize: "calc(0.6rem + 0.5vw)", // Responsive font size for header
  },
  cell: {
    borderBottom: "1px solid #ddd",
    padding: "2px",
    textTransform: "capitalize",
    fontSize: "calc(0.5rem + 0.4vw)", // Responsive font size for body cells
  },
};
