package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.CategoryType;
import com.app.budgetbuddy.domain.MerchantPrice;
import com.app.budgetbuddy.domain.TransactionCSV;
import com.app.budgetbuddy.domain.TransactionRule;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
@Qualifier("CSVTransactionCategorizerServiceImpl")
public class CSVTransactionCategorizerServiceImpl implements CategorizerService<TransactionCSV>
{
    private final TransactionRuleService transactionRuleService;
    private static Map<String, CategoryType> csvMerchantMap = new HashMap<>();
    private static Map<MerchantPrice, CategoryType> csvMerchantPriceMap = new HashMap<>();

    @Autowired
    public CSVTransactionCategorizerServiceImpl(TransactionRuleService transactionRuleService)
    {
        this.transactionRuleService = transactionRuleService;
    }

    // Level 0 Merchant Static Matching
    static {
        csvMerchantMap.put("WINCO FOODS", CategoryType.GROCERIES);
        csvMerchantMap.put("PAYPAL", CategoryType.PAYMENT);
        csvMerchantMap.put("AMAZON PRIME", CategoryType.SUBSCRIPTION);
        csvMerchantMap.put("OLIVE GARDEN", CategoryType.ORDER_OUT);
        csvMerchantMap.put("GREAT CLIPS", CategoryType.HAIRCUT);
        csvMerchantMap.put("SLACKWATER", CategoryType.ORDER_OUT);
        csvMerchantMap.put("AFFIRM", CategoryType.PAYMENT);
        csvMerchantMap.put("STEAMGAMES.COM", CategoryType.OTHER);
        csvMerchantMap.put("HARMONS", CategoryType.GROCERIES);
        csvMerchantMap.put("SPI", CategoryType.GAS_UTILITIES);
        csvMerchantMap.put("JETBRAINS", CategoryType.SUBSCRIPTION);
        csvMerchantMap.put("SPOTIFY", CategoryType.SUBSCRIPTION);
        csvMerchantMap.put("FLEX FINANCE", CategoryType.SUBSCRIPTION);
        csvMerchantMap.put("STATE FARM", CategoryType.INSURANCE);
        csvMerchantMap.put("SMITHS", CategoryType.GROCERIES);
        csvMerchantMap.put("PANDA EXPRESS", CategoryType.ORDER_OUT);
        csvMerchantMap.put("MAVERIK", CategoryType.GAS);
        csvMerchantMap.put("TACO BELL", CategoryType.ORDER_OUT);
        csvMerchantMap.put("THE UPS STORE", CategoryType.OTHER);
        csvMerchantMap.put("THE BREAK SPORTS", CategoryType.GROCERIES);
    }

    // Level 0 Merchant Transaction Amount Static Matching
    static {
        csvMerchantPriceMap.put(new MerchantPrice("FLEX FINANCE", BigDecimal.valueOf(14.99).stripTrailingZeros()), CategoryType.SUBSCRIPTION);
        csvMerchantPriceMap.put(new MerchantPrice("FLEX FINANCE", BigDecimal.valueOf(707.0).stripTrailingZeros()), CategoryType.RENT);
        csvMerchantPriceMap.put(new MerchantPrice("FLEX FINANCE", BigDecimal.valueOf(1220.0).stripTrailingZeros()), CategoryType.RENT);
    }

    @Override
    public CategoryType categorize(TransactionCSV transaction)
    {
        if(transaction == null)
        {
            return CategoryType.UNCATEGORIZED;
        }
        String tAmountStr = transaction.getTransactionAmount().toString().replace("-", "");
        double tAmountDouble = Double.parseDouble(tAmountStr);
        BigDecimal transactionAmount = new BigDecimal(tAmountDouble);
        log.info("tAmountDouble: {}",transactionAmount);
        String merchantName = transaction.getMerchantName();
        String description = transaction.getDescription();
        MerchantPrice key = new MerchantPrice(merchantName, transactionAmount);
        if(csvMerchantPriceMap.containsKey(key))
        {
            return csvMerchantPriceMap.get(key);
        }
        else if(csvMerchantMap.containsKey(merchantName))
        {
            return csvMerchantMap.get(merchantName);
        }
        return null;
    }

    @Override
    public boolean matches(TransactionCSV transaction, TransactionRule transactionRule) {
        return false;
    }
}
