import React from "react";
import { Box, TableCell, TableCellProps } from "@mui/material";
import { CELL_BORDER_WIDTH, CELL_HEIGHT } from "../../config";

export type GreyCellProps = React.PropsWithChildren & {
  sx?: TableCellProps["sx"];
  onClick?: TableCellProps["onClick"];
};

function GreyCell({ children, sx, onClick }: GreyCellProps) {
  return (
    <TableCell
      variant="head"
      onClick={onClick}
      sx={{
        height: `${CELL_HEIGHT - 2 * CELL_BORDER_WIDTH}px`,
        border: `${CELL_BORDER_WIDTH}px solid black`,
        boxShadow: "inset -5px -5px 3px #DCE3ED, inset 5px 5px 3px #949EAC",
        background: "#C6D2E4",
        padding: 0,
        borderCollapse: "collapse",
        ...sx,
      }}
    >
      <Box
        className="content"
        sx={{
          height: "100%",
          padding: "0 10px",
          fontFamily: "'Press Start 2P', cursive",
          fontSize: "14px",
          lineHeight: "20px",
          display: "flex",
          alignItems: "center",
          flex: 1,
        }}
      >
        {children}
      </Box>
    </TableCell>
  );
}

export default GreyCell;
