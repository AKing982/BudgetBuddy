package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.CSVAccountEntity;
import com.app.budgetbuddy.repositories.CSVAccountRepository;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.services.UserCategoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
@Qualifier("csvCategorizer")
public class CSVTransactionCategorizerServiceImpl implements CategorizerService<TransactionCSV>
{
    private final TransactionRuleService transactionRuleService;
    private final CSVAccountRepository csvAccountRepository;
    private Map<String, CategoryType> csvMerchantMap = new HashMap<>();
    private Map<MerchantPrice, CategoryType> csvMerchantPriceMap = new HashMap<>();
    private final CategoryService categoryService;
    private final UserCategoryService userCategoryService;
    private final String SYSTEM_CATEGORIZED = "SYSTEM";
    private final String USER_CATEGORIZED = "USER";

    @Autowired
    public CSVTransactionCategorizerServiceImpl(TransactionRuleService transactionRuleService,
                                                CSVAccountRepository csvAccountRepository,
                                                CategoryService categoryService,
                                                UserCategoryService userCategoryService)
    {
        this.transactionRuleService = transactionRuleService;
        this.csvAccountRepository = csvAccountRepository;
        this.categoryService = categoryService;
        this.userCategoryService = userCategoryService;
        initializeCSVMerchantMap();
        initializeCSVMerchantPriceMap();
    }

    // Level 0 Merchant Static Matching
    void initializeCSVMerchantMap()
    {
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
        csvMerchantMap.put("THE BREAK SPORTS GRILL", CategoryType.GROCERIES);
        csvMerchantMap.put("WHOLE FOODS", CategoryType.GROCERIES);
        csvMerchantMap.put("PLANET FITNESS", CategoryType.SUBSCRIPTION);
        csvMerchantMap.put("CVS PHARMACY", CategoryType.OTHER);
        csvMerchantMap.put("SCRIBD", CategoryType.SUBSCRIPTION);
        csvMerchantMap.put("AMAZON.COM", CategoryType.SUBSCRIPTION);
        csvMerchantMap.put("APPLE.COM", CategoryType.SUBSCRIPTION);
        csvMerchantMap.put("AFTERPAY",  CategoryType.PAYMENT);
        csvMerchantMap.put("ROXBERRY JUICE", CategoryType.ORDER_OUT);
        csvMerchantMap.put("AMEX", CategoryType.PAYMENT);
        csvMerchantMap.put("HBOMAX.COM",CategoryType.SUBSCRIPTION);
        csvMerchantMap.put("ROCKET MONEY", CategoryType.SUBSCRIPTION);
        csvMerchantMap.put("CLAUDE.AI", CategoryType.SUBSCRIPTION);
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
        csvMerchantMap.put("L3 TECHNOLOGIES", CategoryType.INCOME);
        csvMerchantMap.put("RAISING CANES", CategoryType.ORDER_OUT);
        csvMerchantMap.put("COLDSTONE", CategoryType.ORDER_OUT);
        csvMerchantMap.put("BUCKLE", CategoryType.OTHER);
        csvMerchantMap.put("SP Strom Holdings LLC", CategoryType.OTHER);
    }


    // Level 0 Merchant Transaction Amount Static Matching
    void initializeCSVMerchantPriceMap()
    {
        csvMerchantPriceMap.put(new MerchantPrice("FLEX FINANCE", BigDecimal.valueOf(14.99).stripTrailingZeros()), CategoryType.SUBSCRIPTION);
        csvMerchantPriceMap.put(new MerchantPrice("Flexible Finance", BigDecimal.valueOf(14.990).stripTrailingZeros()), CategoryType.SUBSCRIPTION);
        csvMerchantPriceMap.put(new MerchantPrice("FLEX FINANCE", BigDecimal.valueOf(707.0).stripTrailingZeros()), CategoryType.RENT);
        csvMerchantPriceMap.put(new MerchantPrice("FLEX FINANCE", BigDecimal.valueOf(1220.0).stripTrailingZeros()), CategoryType.RENT);
        csvMerchantPriceMap.put(new MerchantPrice("Flexible Finance", BigDecimal.valueOf(1220.03).stripTrailingZeros()), CategoryType.RENT);
        csvMerchantPriceMap.put(new MerchantPrice("Flexible Finance", BigDecimal.valueOf(707.00).stripTrailingZeros()), CategoryType.RENT);
    }

    private Long getUserIdByAcctNumberSuffix(int suffix, String acctNumber)
    {
        Optional<CSVAccountEntity> csvAccountEntityOptional = csvAccountRepository.findByAcctNumAndSuffix(acctNumber, suffix);
        if(csvAccountEntityOptional.isEmpty())
        {
            return 0L;
        }
        CSVAccountEntity csvAccountEntity = csvAccountEntityOptional.get();
        return csvAccountEntity.getUser().getId();
    }

    @Override
    public Category categorize(TransactionCSV transaction)
    {
        if(transaction == null)
        {
            return Category.createUncategorized();
        }
        BigDecimal transactionAmount = transaction.getTransactionAmount()
                        .abs()
                        .stripTrailingZeros();
        log.info("tAmountDouble: {}",transactionAmount);
        String merchantName = transaction.getMerchantName();
        int suffix = transaction.getSuffix();
        String acct = transaction.getAccount();
        Long userId = getUserIdByAcctNumberSuffix(suffix, acct);
        List<TransactionRule> transactionRules = transactionRuleService.findByUserId(userId);
        Long categoryId = 0L;
        String matchedCategoryName = "";
        Category category = null;
        if(transactionRules.isEmpty())
        {
            MerchantPrice key = new MerchantPrice(merchantName, transactionAmount);
            log.info("Merchant Name: {}, Transaction Amount: {}", merchantName, transactionAmount);
            boolean csvMerchantPriceMatch = csvMerchantPriceMap.containsKey(key);
            String merchantNameUpper = merchantName.toUpperCase();
            log.info("CSV Merchant Price Match: {}", csvMerchantPriceMatch);
            if(csvMerchantPriceMap.containsKey(key))
            {
                log.info("Found Merchant Price Map key: {}", key);
                CategoryType categoryType = csvMerchantPriceMap.get(key);
                String categoryName = categoryType.getType();
                categoryId = categoryService.getCategoryIdByName(categoryName);
                matchedCategoryName = categoryName;
                category = Category.createCategory(categoryId, matchedCategoryName, SYSTEM_CATEGORIZED, LocalDate.now());
                return category;
            }
            else if(csvMerchantMap.containsKey(merchantNameUpper))
            {
                log.info("Found MerchantMap key: {}", merchantName);
                CategoryType categoryType = csvMerchantMap.get(merchantNameUpper);
                categoryId = categoryService.getCategoryIdByName(categoryType.getType());
                matchedCategoryName = categoryType.getType();
                category = Category.createCategory(categoryId, matchedCategoryName, SYSTEM_CATEGORIZED, LocalDate.now());
                log.info("Found CategoryType: {}", categoryType);
                return category;
            }
        }
        else
        {
            Map<Integer, List<TransactionRule>> transactionRulesByPriority = transactionRules.stream()
                    .filter(rule -> rule != null && rule.isActive())
                    .collect(Collectors.groupingBy(TransactionRule::getPriority));
            List<Integer> sortedPriorities = transactionRulesByPriority.keySet().stream()
                    .sorted().toList();
            long startTime = System.currentTimeMillis();
            for(Integer sortedPriority : sortedPriorities)
            {
                log.info("Found Priority: {}", sortedPriority);
                List<TransactionRule> rules = transactionRulesByPriority.get(sortedPriority);
                for(TransactionRule rule : rules)
                {
                    int match_counter = 0;
                    Long ruleId = rule.getId();
                    log.info("Found Rule: {}", rule);
                    if(matches(transaction, rule))
                    {
                        match_counter++;
                        rule.setMatchCount(match_counter);
                        // Update the rule match counter
                        transactionRuleService.updateMatchCount(ruleId, rule.getMatchCount());
                        matchedCategoryName = rule.getCategoryName();
                        log.info("Rule matches: {}", rule);
                        long endTime = System.currentTimeMillis();
                        log.info("Rules found in {} ms", endTime - startTime);
                        Long userCategoryId = userCategoryService.getCategoryIdByNameAndUser(matchedCategoryName, userId);
                        return Category.createCategory(userCategoryId, matchedCategoryName, USER_CATEGORIZED, LocalDate.now());
                    }
                }
            }

        }
        return Category.createUncategorized();
    }

    @Override
    public boolean matches(TransactionCSV transaction, TransactionRule transactionRule)
    {
        if(transaction == null || transactionRule == null)
        {
            return false;
        }
        BigDecimal transactionAmount = transaction.getTransactionAmount()
                .abs()
                .stripTrailingZeros();
        String merchantName = transaction.getMerchantName();
        String description = transaction.getDescription();
        String extendedDescription = transaction.getExtendedDescription();
        String merchantRule = transactionRule.getMerchantRule();
        String descriptionRule = transactionRule.getDescriptionRule();
        String extendedDescriptionRule = transactionRule.getExtendedDescriptionRule();
        double minAmount = transactionRule.getAmountMin();
        double maxAmount = transactionRule.getAmountMax();
        int priority = transactionRule.getPriority();

        // Check individual field matches
        boolean merchantRuleMatch = merchantRule != null && !merchantRule.isEmpty()
                && merchantRule.equalsIgnoreCase(merchantName) || merchantName.contains(merchantRule);
        boolean descriptionRuleMatch = descriptionRule != null && !descriptionRule.isEmpty()
                && descriptionRule.equalsIgnoreCase(description);
        boolean extendedDescriptionRuleMatch = extendedDescriptionRule != null && !extendedDescriptionRule.isEmpty()
                && extendedDescriptionRule.equalsIgnoreCase(extendedDescription);
        boolean amountMatch = transactionAmount.compareTo(BigDecimal.valueOf(minAmount)) >= 0
                && transactionAmount.compareTo(BigDecimal.valueOf(maxAmount)) <= 0;
        boolean minAmountMatch = transactionAmount.compareTo(BigDecimal.valueOf(minAmount)) >= 0;
        boolean maxAmountMatch = transactionAmount.compareTo(BigDecimal.valueOf(maxAmount)) <= 0;

        // Match based on priority level
        return switch (priority) {
            case 1 -> merchantRuleMatch && descriptionRuleMatch && extendedDescriptionRuleMatch && amountMatch;
            case 2 -> merchantRuleMatch && amountMatch;
            case 3 -> merchantRuleMatch && minAmountMatch;
            case 4 -> merchantRuleMatch && maxAmountMatch;
            case 5 -> descriptionRuleMatch && merchantRuleMatch;
            case 6 -> merchantRuleMatch;
            default -> false;
        };
    }
}
