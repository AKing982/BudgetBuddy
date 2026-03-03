package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.TransactionCSV;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class MountainAmericaTransactionParser implements TransactionParser
{
    private final MerchantNameBuilder merchantNameBuilder;

    @Autowired
    public MountainAmericaTransactionParser(MerchantNameBuilder merchantNameBuilder)
    {
        this.merchantNameBuilder = merchantNameBuilder;
    }

    @Override
    public boolean supports(String institution) {
        return "Mountain America Credit Union".equalsIgnoreCase(institution);
    }

    @Override
    public TransactionCSV parseRow(String[] row, Long userId) {
        TransactionCSV tx = new TransactionCSV();

        // MACU Specific Mapping
        tx.setTransactionId(row[0]);
        tx.setTransactionDate(ParserUtils.toLocalDate(row[1], "MM/dd/yyyy"));
        tx.setEffectiveDate(ParserUtils.toLocalDate(row[2], "MM/dd/yyyy"));
        tx.setType(row[3]);
        tx.setTransactionAmount(ParserUtils.toBigDecimal(row[4]));
        tx.setDescription(row[7]);
        tx.setCategory(row[8]);
        tx.setBalance(ParserUtils.toBigDecimal(row[10]));
        tx.setExtendedDescription(row[12]);

        // Delegate naming logic to the builder we refactored earlier
        tx.setMerchantName(merchantNameBuilder.build(
                "Mountain America Credit Union",
                row[7],
                row[12]
        ));

        tx.setInstitution_id("Mountain America Credit Union");
        tx.setUserId(userId);

        return tx;
    }

    @Override
    public char getDelimiter() {
        return ',';
    }
}
