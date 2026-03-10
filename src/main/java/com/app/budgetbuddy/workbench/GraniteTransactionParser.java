package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.TransactionCSV;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class GraniteTransactionParser implements TransactionParser
{
    private final MerchantNameBuilder merchantNameBuilder;

    @Autowired
    public GraniteTransactionParser(MerchantNameBuilder merchantNameBuilder)
    {
        this.merchantNameBuilder = merchantNameBuilder;
    }

    @Override
    public boolean supports(String institution) {
        return "Granite Credit Union".equalsIgnoreCase(institution);
    }

    @Override
    public TransactionCSV parseRow(String[] row, Long userId) {
        TransactionCSV tx = new TransactionCSV();
        tx.setAccount(row[0]);
        tx.setSuffix(Integer.parseInt(row[1]));
        tx.setSequenceNo(ParserUtils.removeLeadingZeros(row[2]));
        tx.setTransactionDate(ParserUtils.toLocalDate(row[3]));
        tx.setTransactionAmount(ParserUtils.toBigDecimal(row[4]));
        tx.setDescription(row[5]);
        tx.setExtendedDescription(row[6]);
        tx.setBalance(ParserUtils.toBigDecimal(row[9]));
        tx.setElectronicTransactionDate(ParserUtils.toLocalDate(row[7]));
        tx.setMerchantName(merchantNameBuilder.build("Granite Credit Union", row[5], row[6]));
        tx.setInstitution_id("Granite Credit Union");
        tx.setUserId(userId);
        return tx;
    }

    @Override
    public char getDelimiter() { return ','; }
}
