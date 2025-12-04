import { Instance } from "cs_script/point_script";

export interface IDebuggable {
    /**
     * The title for the entire column.
     */
    debugColumnTitle(): string;

    /**
     * The name for the specific entity/row.
     */
    debugEntityName(): string;
    
    /**
     * The current value to display for the entity/row.
     */
    debugCurrentValue(): string;
}

/**
 * Interface for objects that can provide a debug column.
 */
export interface IDebugColumn {
    /**
     * Returns the title for this column.
     */
    getDebugColumnTitle(): string;
    
    /**
     * Returns an array of IDebuggable items to display as rows.
     */
    getDebugItems(): IDebuggable[];
}

export class CDebugMenu {
    private columns: (IDebuggable[] | IDebugColumn)[] = [];

    constructor() {
    }

    public displayGameTime() {
        Instance.DebugScreenText({
            text: `Game Time: ${Instance.GetGameTime().toFixed(3)}`,
            x: 0.15, // Changed from 0.02
            y: 0.13, // Changed to position it above the main table
            duration: 0.125, 
            color: { r: 255, g: 255, b: 128 }
        });
    }

    /**
     * Formats and displays all added columns as an ASCII table on the screen.
     */
    public displayColumns() {
        if (this.columns.length === 0) {
            return;
        }

        const columnWidths: number[] = [];
        const columnTitles: string[] = [];
        let maxRows = 0;

        // 1. First Pass: Calculate the maximum width needed for each column
        for (const column of this.columns) {
            // Check if this is an IDebugColumn or an array
            let items: IDebuggable[];
            let title: string;
            
            if (Array.isArray(column)) {
                items = column;
                if (items.length === 0) {
                    columnTitles.push("");
                    columnWidths.push(0);
                    continue;
                }
                title = items[0].debugColumnTitle();
            } else {
                // It's an IDebugColumn
                items = column.getDebugItems();
                title = column.getDebugColumnTitle();
            }

            columnTitles.push(title);
            maxRows = Math.max(maxRows, items.length);

            // The width must be at least the length of the title
            let maxWidth = title.length;

            // Check the length of each cell's content
            for (const item of items) {
                const cellContent = `${item.debugEntityName()}: ${item.debugCurrentValue()}`;
                maxWidth = Math.max(maxWidth, cellContent.length);
            }
            columnWidths.push(maxWidth);
        }

        // Helper function to pad strings for alignment
        const pad = (text: string, width: number) => ` ${text.padEnd(width)} `;
        
        // 2. Build the table string
        const outputLines: string[] = [];
        let border = "+";
        let header = "|";

        // Create the top border and header row simultaneously
        for (let i = 0; i < this.columns.length; i++) {
            border += `${'-'.repeat(columnWidths[i] + 2)}+`;
            header += `${pad(columnTitles[i], columnWidths[i])}|`;
        }

        outputLines.push(border);
        outputLines.push(header);
        outputLines.push(border);

        // Create the data rows
        for (let r = 0; r < maxRows; r++) {
            let rowLine = "|";
            for (let c = 0; c < this.columns.length; c++) {
                let cellContent = "";
                const column = this.columns[c];
                
                // Get items from either array or IDebugColumn
                let items: IDebuggable[];
                if (Array.isArray(column)) {
                    items = column;
                } else {
                    items = column.getDebugItems();
                }
                
                // Check if a cell exists at this row/column
                if (items && items[r]) {
                    const item = items[r];
                    cellContent = `${item.debugEntityName()}: ${item.debugCurrentValue()}`;
                }
                rowLine += `${pad(cellContent, columnWidths[c])}|`;
            }
            outputLines.push(rowLine);
        }

        // Add the bottom border
        outputLines.push(border);

        // 3. Display the final formatted string on the screen
        Instance.DebugScreenText({
            text: outputLines.join('\n'),
            x: 0.15, // Changed from 0.02
            y: 0.15, // Changed from 0.05
            duration: 0.125,
            color: { r: 200, g: 200, b: 200 }
        });
    }

    /**
     * Adds a new column to be displayed in the debug menu.
     * @param debugColumn An array of IDebuggable objects or a single IDebugColumn object.
     */
    public addColumn(debugColumn: IDebuggable[] | IDebugColumn) {
        this.columns.push(debugColumn);
    }

    /**
     * Clears all columns from the debug menu.
     */
    public clearColumns() {
        this.columns = [];
    }
}
