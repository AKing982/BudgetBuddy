import React, {useState} from "react";

interface EmergencyFundData {
    fundAmount: number;
    currentBalance: number;
    monthlyContribution: number;
    fundingPeriod: number;
    useAutoAllocation: boolean;
    incomePercentage: number;
    accountType: string;
}

interface EmergencyFundQuestionProps {
   onDataChange: (data: EmergencyFundData) => void;
   monthlyIncome: number;
}

const EmergencyFundQuestions: React.FC<EmergencyFundQuestionProps> = ({ onDataChange, monthlyIncome }) => {
    const [fundData, setFundData] = useState<EmergencyFundData>({
        fundAmount: 0,
        currentBalance: 0,
        monthlyContribution: 0,
        fundingPeriod: 6,
        useAutoAllocation: false,
        incomePercentage: 0,
        accountType: ''
    });

    return null;
}