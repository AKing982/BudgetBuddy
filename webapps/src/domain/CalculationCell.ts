class CalculationCell {
    private readonly id: string;
    private value: string | number;
    private formula: string;
    private editable: boolean;
    private format?: CellFormat;
    private cellReferences: string[] = [];
    private calculationType: {
        mode: 'basic' | 'budget' | 'forecasting' | 'period' | 'allocation';
        operation: string;
    };
    private autoUpdate: boolean;
    private calculationResult: {
        value: number;
        lastCalculated: Date;
        isValid: boolean;
    };
    private metadata?: {
        description?: string;
        category?: string;
        period?: string;
    };

    constructor(
        id: string,
        formula: string,
        calculationType: {
            mode: 'basic' | 'budget' | 'forecasting' | 'period' | 'allocation';
            operation: string;
        },
        options: {
            editable?: boolean;
            format?: CellFormat;
            autoUpdate?: boolean;
            metadata?: {
                description?: string;
                category?: string;
                period?: string;
                requiresUpdate?: boolean;
            };
        } = {}
    ) {
        this.id = id;
        this.formula = formula;
        this.value = 0; // Initial value before calculation
        this.editable = options.editable ?? true;
        this.format = options.format;
        this.calculationType = calculationType;
        this.autoUpdate = options.autoUpdate ?? true;
        this.metadata = options.metadata;
        this.calculationResult = {
            value: 0,
            lastCalculated: new Date(),
            isValid: false
        };
        this.cellReferences = this.extractCellReferences();
    }

    private extractCellReferences() : string[] {
        return [];
    }

    public calculate(getCellValue: (id: string) => number | null) : void {

    }


    public getFormattedValue() : string {
        if(!this.calculationResult.isValid){
            return '#Error';
        }
        if(this.format){
            return this.calculationResult.value.toString();
        }
        return this.value.toString();
    }

    public clone() : CalculationCell {
        return new CalculationCell(
            this.id,
            this.formula,
            {...this.calculationType},
            {
                editable: this.editable,
                format: this.format ? {...this.format} : undefined,
                autoUpdate: this.autoUpdate,
                metadata: this.metadata ? {...this.metadata} : undefined
            }
        );
    }


}