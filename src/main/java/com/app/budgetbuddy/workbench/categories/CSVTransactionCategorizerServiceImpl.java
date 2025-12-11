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
        csvMerchantMap.put("ROCKYMTN/PACIFIC", CategoryType.ELECTRIC);
        csvMerchantMap.put("APPLE COM", CategoryType.SUBSCRIPTION);
        csvMerchantMap.put("WM SUPERCENTER", CategoryType.GROCERIES);
        csvMerchantMap.put("ITALIAN VILLAGE", CategoryType.ORDER_OUT);
        csvMerchantMap.put("WENDYS", CategoryType.ORDER_OUT);
        csvMerchantMap.put("AMEX PAYMENT", CategoryType.PAYMENT);
        csvMerchantMap.put("SEZZLE", CategoryType.PAYMENT);
        csvMerchantMap.put("AMAZON MKTPL", CategoryType.OTHER);
        csvMerchantMap.put("NOODLES AND COMPANY", CategoryType.ORDER_OUT);
        csvMerchantMap.put("CONSERVICE", CategoryType.UTILITIES);
        csvMerchantMap.put("HEROKU", CategoryType.SUBSCRIPTION);
        csvMerchantMap.put("MICROSOFT", CategoryType.SUBSCRIPTION);
        csvMerchantMap.put("Wal-Mart", CategoryType.GROCERIES);
        csvMerchantMap.put("DUTCH BROS", CategoryType.ORDER_OUT);
        csvMerchantMap.put("WALGREENS", CategoryType.OTHER);
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
        BigDecimal transactionAmount = transaction.getTransactionAmount()
                        .abs()
                        .stripTrailingZeros();
        log.info("tAmountDouble: {}",transactionAmount);
        String merchantName = transaction.getMerchantName();
        String description = transaction.getDescription();
        MerchantPrice key = new MerchantPrice(merchantName, transactionAmount);
        log.info("Merchant Name: {}, Transaction Amount: {}", merchantName, transactionAmount);
        boolean csvMerchantPriceMatch = csvMerchantPriceMap.containsKey(key);
        log.info("CSV Merchant Price Match: {}", csvMerchantPriceMatch);
        if(csvMerchantPriceMap.containsKey(key))
        {
            log.info("Found Merchant Price Map key: {}", key);
            return csvMerchantPriceMap.get(key);
        }
        else if(csvMerchantMap.containsKey(merchantName))
        {
            log.info("Found MerchantMap key: {}", merchantName);
            return csvMerchantMap.get(merchantName);
        }
        return null;
    }

    @Override
    public boolean matches(TransactionCSV transaction, TransactionRule transactionRule) {
        return false;
    }
}
