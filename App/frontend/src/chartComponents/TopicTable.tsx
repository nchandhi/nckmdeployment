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
      style={{
        ...tableStyles.container,
        height: "91%",
      }}
    >
      <table style={tableStyles.table} className="topic-table">
        <thead style={tableStyles.thead}>
          <tr>
            {columns.map((column, index) => (
              <th key={index} style={tableStyles.header}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columnKeys.map((columnKey) => (
                <td key={columnKey} style={tableStyles.cell}>
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
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TopicTable;

const tableStyles: { [key: string]: React.CSSProperties } = {
  container: {
    overflowY: "auto",
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0px 1px 5px rgba(0, 0, 0, 0.1)",
  },
  title: {
    color: "#707070",
    fontWeight: "400",
    fontFamily: "Segoe UI",
    fontSize: "16px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as "collapse",
  },
  thead: {
    position: "sticky" as "sticky",
    top: "0",
    zIndex: 1,
  },
  header: {
    backgroundColor: "#f4f4f4",
    fontWeight: "bold" as "bold",
    textAlign: "left" as "left",
  },
  cell: {
    borderBottom: "1px solid #ddd",
    textTransform: "capitalize",
  },
};
