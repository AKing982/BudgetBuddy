package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.CSVAccountEntity;
import com.app.budgetbuddy.exceptions.CategoryException;
import com.app.budgetbuddy.repositories.CSVAccountRepository;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.services.SystemCategoryRulesService;
import com.app.budgetbuddy.services.TransactionRuleService;
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
public class CSVTransactionCategorizationEngine implements CategorizationEngine<TransactionCSV>
{
    private final TransactionRuleService transactionRuleService;
    private final CSVAccountRepository csvAccountRepository;
    private final CategoryService categoryService;
    private final UserCategoryService userCategoryService;
    private final List<CSVCategorizationStrategy> strategies;
    private final SystemCategoryRulesService systemCategoryRulesService;
    private final String SYSTEM_CATEGORIZED = "SYSTEM";
    private final String USER_CATEGORIZED = "USER";

    @Autowired
    public CSVTransactionCategorizationEngine(TransactionRuleService transactionRuleService,
                                              CSVAccountRepository csvAccountRepository,
                                              CategoryService categoryService,
                                              UserCategoryService userCategoryService,
                                              SystemCategoryRulesService systemCategoryRulesService,
                                              List<CSVCategorizationStrategy> strategies)
    {
        this.transactionRuleService = transactionRuleService;
        this.csvAccountRepository = csvAccountRepository;
        this.categoryService = categoryService;
        this.userCategoryService = userCategoryService;
        this.systemCategoryRulesService = systemCategoryRulesService;
        this.strategies = strategies;
    }

    @Override
    public Category categorize(TransactionCSV transaction)
    {
        if(transaction == null)
        {
            return Category.createUncategorized();
        }
        double absAmount = transaction.getTransactionAmount()
                .stripTrailingZeros().abs()
                .setScale(2, BigDecimal.ROUND_HALF_UP)
                .doubleValue();

        String merchantNameUpper = transaction.getMerchantName().toUpperCase();
        String institutionId = transaction.getInstitution_id();
        String transactionCategory = transaction.getCategory();
        Long userId = transaction.getUserId();
        try
        {
            // User rules always take priority
            List<TransactionRule> userRules = transactionRuleService.findByUserId(userId);
            if(!userRules.isEmpty())
            {
                Category userMatch = applyUserRules(transaction, userRules, userId);
                return userMatch != null ? userMatch : Category.createUncategorized();
            }

            // Pick the right strategy and categorize
            return strategies.stream()
                    .filter(s -> s.supports(institutionId))
                    .findFirst()
                    .map(s -> s.categorize(merchantNameUpper, transactionCategory,
                            absAmount))
                    .orElseGet(Category::createUncategorized);
        }
        catch(CategoryException e)
        {
            log.error("Error categorizing csv transaction {}: {}", transaction, e.getMessage());
            throw e;
        }
    }

    private Category applyUserRules(TransactionCSV transaction, List<TransactionRule> userRules, Long userId)
    {
        Map<Integer, List<TransactionRule>> rulesByPriority = userRules.stream()
                .filter(rule -> rule != null && rule.isActive())
                .collect(Collectors.groupingBy(TransactionRule::getPriority));

        long startTime = System.currentTimeMillis();
        for(Integer priority : rulesByPriority.keySet().stream().sorted().toList())
        {
            for(TransactionRule rule : rulesByPriority.get(priority))
            {
                if(matches(transaction, rule))
                {
                    rule.setMatchCount(rule.getMatchCount() + 1);
                    transactionRuleService.updateMatchCount(rule.getId(), rule.getMatchCount());
                    String matchedCategoryName = rule.getCategoryName();
                    log.info("User rule matched: {} in {} ms", rule, System.currentTimeMillis() - startTime);
                    Long userCategoryId = userCategoryService.getCategoryIdByNameAndUser(matchedCategoryName, userId);
                    return Category.createCategory(userCategoryId, matchedCategoryName, USER_CATEGORIZED, LocalDate.now());
                }
            }
        }
        return null;
    }

//    void initializeMerchantCategoryMap(){
//
//        // Formerly in csvMerchantPriceMap - merchant + category + amount
//        csvMerchantCategoryMap.put(new MerchantCategory("FLEX FINANCE", null, 14.99), CategoryType.SUBSCRIPTION);
//        csvMerchantCategoryMap.put(new MerchantCategory("FLEX FINANCE", null, 707.0), CategoryType.RENT);
//        csvMerchantCategoryMap.put(new MerchantCategory("FLEX FINANCE", null, 1220.0), CategoryType.RENT);
//        csvMerchantCategoryMap.put(new MerchantCategory("FLEXIBLE FINANCE", null, 14.99), CategoryType.SUBSCRIPTION);
//        csvMerchantCategoryMap.put(new MerchantCategory("FLEXIBLE FINANCE", null, 1220.03), CategoryType.RENT);
//        csvMerchantCategoryMap.put(new MerchantCategory("FLEXIBLE FINANCE", null, 707.0), CategoryType.RENT);
//
//        csvMerchantCategoryMap.put(new MerchantCategory("FLEX FINANCE", "Online Services", 707.0), CategoryType.RENT);
//        csvMerchantCategoryMap.put(new MerchantCategory("FLEX FINANCE", "Online Services", 1220.0), CategoryType.RENT);
//        csvMerchantCategoryMap.put(new MerchantCategory("FLEX FINANCE", "Online Services", 14.99), CategoryType.SUBSCRIPTION);
//        csvMerchantCategoryMap.put(new MerchantCategory("WinCo Foods", "Groceries"), CategoryType.GROCERIES);
//        csvMerchantCategoryMap.put(new MerchantCategory("Smiths", "Groceries"), CategoryType.GROCERIES);
//        csvMerchantCategoryMap.put(new MerchantCategory("Withdrawal", "ATM/Cash Withdrawals"), CategoryType.WITHDRAWAL);
//        csvMerchantCategoryMap.put(new MerchantCategory("Payment to Conservice", "Utilities"), CategoryType.UTILITIES);
//        csvMerchantCategoryMap.put(new MerchantCategory("Panda Express", "Restaurants & Dining"), CategoryType.ORDER_OUT);
//        csvMerchantCategoryMap.put(new MerchantCategory("The Break Sports Grill", "Restaurants & Dining"), CategoryType.ORDER_OUT);
//        csvMerchantCategoryMap.put(new MerchantCategory("Payment to Affirm.com", "Loan Payments"), CategoryType.PAYMENT);
//        csvMerchantCategoryMap.put(new MerchantCategory("Maverik", "Gasoline/Fuel"), CategoryType.GAS);
//        csvMerchantCategoryMap.put(new MerchantCategory("Walmart", "Shopping"), CategoryType.GROCERIES);
//        csvMerchantCategoryMap.put(new MerchantCategory("Spotify", "Entertainment"), CategoryType.SUBSCRIPTION);
//        csvMerchantCategoryMap.put(new MerchantCategory("Hbo Max", "Entertainment"), CategoryType.SUBSCRIPTION);
//    }
//
//    void initializeTransactionCategoryMap(){
//        transactionCategoryMap.put("Gasoline/Fuel", CategoryType.GAS);
//        transactionCategoryMap.put("Loan Payments", CategoryType.PAYMENT);
//        transactionCategoryMap.put("Online Services", CategoryType.PAYMENT);
//        transactionCategoryMap.put("Groceries", CategoryType.GROCERIES);
//        transactionCategoryMap.put("Utilities", CategoryType.UTILITIES);
//        transactionCategoryMap.put("Restaurants & Dining", CategoryType.ORDER_OUT);
//        transactionCategoryMap.put("Shopping", CategoryType.GROCERIES);
//        transactionCategoryMap.put("Insurance", CategoryType.INSURANCE);
//        transactionCategoryMap.put("Payment", CategoryType.PAYMENT);
//        transactionCategoryMap.put("ATM/Cash Withdrawals", CategoryType.WITHDRAWAL);
//        transactionCategoryMap.put("Entertainment", CategoryType.SUBSCRIPTION);
//        transactionCategoryMap.put("Paychecks/Salary", CategoryType.INCOME);
//        transactionCategoryMap.put("Personal Care & Fitness", CategoryType.OTHER);
//        transactionCategoryMap.put("Deposits", CategoryType.DEPOSIT);
//    }
//
//    // Level 0 Merchant Static Matching
//    void initializeCSVMerchantMap()
//    {
//        csvMerchantMap.put("WINCO FOODS", CategoryType.GROCERIES);
//        csvMerchantMap.put("PAYPAL", CategoryType.PAYMENT);
//        csvMerchantMap.put("AMAZON PRIME", CategoryType.SUBSCRIPTION);
//        csvMerchantMap.put("OLIVE GARDEN", CategoryType.ORDER_OUT);
//        csvMerchantMap.put("GREAT CLIPS", CategoryType.HAIRCUT);
//        csvMerchantMap.put("SLACKWATER", CategoryType.ORDER_OUT);
//        csvMerchantMap.put("AFFIRM", CategoryType.PAYMENT);
//        csvMerchantMap.put("STEAMGAMES.COM", CategoryType.OTHER);
//        csvMerchantMap.put("HARMONS", CategoryType.GROCERIES);
//        csvMerchantMap.put("SPI", CategoryType.GAS_UTILITIES);
//        csvMerchantMap.put("JETBRAINS", CategoryType.SUBSCRIPTION);
//        csvMerchantMap.put("SPOTIFY", CategoryType.SUBSCRIPTION);
//        csvMerchantMap.put("FLEX FINANCE", CategoryType.SUBSCRIPTION);
//        csvMerchantMap.put("STATE FARM", CategoryType.INSURANCE);
//        csvMerchantMap.put("SMITHS", CategoryType.GROCERIES);
//        csvMerchantMap.put("PANDA EXPRESS", CategoryType.ORDER_OUT);
//        csvMerchantMap.put("MAVERIK", CategoryType.GAS);
//        csvMerchantMap.put("TACO BELL", CategoryType.ORDER_OUT);
//        csvMerchantMap.put("THE UPS STORE", CategoryType.OTHER);
//        csvMerchantMap.put("THE BREAK SPORTS GRILL", CategoryType.GROCERIES);
//        csvMerchantMap.put("WHOLE FOODS", CategoryType.GROCERIES);
//        csvMerchantMap.put("PLANET FITNESS", CategoryType.SUBSCRIPTION);
//        csvMerchantMap.put("CVS PHARMACY", CategoryType.OTHER);
//        csvMerchantMap.put("SCRIBD", CategoryType.SUBSCRIPTION);
//        csvMerchantMap.put("AMAZON.COM", CategoryType.SUBSCRIPTION);
//        csvMerchantMap.put("APPLE.COM", CategoryType.SUBSCRIPTION);
//        csvMerchantMap.put("AFTERPAY",  CategoryType.PAYMENT);
//        csvMerchantMap.put("ROXBERRY JUICE", CategoryType.ORDER_OUT);
//        csvMerchantMap.put("AMEX", CategoryType.PAYMENT);
//        csvMerchantMap.put("HBOMAX.COM",CategoryType.SUBSCRIPTION);
//        csvMerchantMap.put("ROCKET MONEY", CategoryType.SUBSCRIPTION);
//        csvMerchantMap.put("CLAUDE.AI", CategoryType.SUBSCRIPTION);
//        csvMerchantMap.put("ROCKYMTN/PACIFIC", CategoryType.ELECTRIC);
//        csvMerchantMap.put("APPLE COM", CategoryType.SUBSCRIPTION);
//        csvMerchantMap.put("WM SUPERCENTER", CategoryType.GROCERIES);
//        csvMerchantMap.put("ITALIAN VILLAGE", CategoryType.ORDER_OUT);
//        csvMerchantMap.put("WENDYS", CategoryType.ORDER_OUT);
//        csvMerchantMap.put("AMEX PAYMENT", CategoryType.PAYMENT);
//        csvMerchantMap.put("SEZZLE", CategoryType.PAYMENT);
//        csvMerchantMap.put("AMAZON MKTPL", CategoryType.OTHER);
//        csvMerchantMap.put("NOODLES AND COMPANY", CategoryType.ORDER_OUT);
//        csvMerchantMap.put("CONSERVICE", CategoryType.UTILITIES);
//        csvMerchantMap.put("HEROKU", CategoryType.SUBSCRIPTION);
//        csvMerchantMap.put("MICROSOFT", CategoryType.SUBSCRIPTION);
//        csvMerchantMap.put("Wal-Mart", CategoryType.GROCERIES);
//        csvMerchantMap.put("DUTCH BROS", CategoryType.ORDER_OUT);
//        csvMerchantMap.put("WALGREENS", CategoryType.OTHER);
//        csvMerchantMap.put("L3 TECHNOLOGIES", CategoryType.INCOME);
//        csvMerchantMap.put("RAISING CANES", CategoryType.ORDER_OUT);
//        csvMerchantMap.put("COLDSTONE", CategoryType.ORDER_OUT);
//        csvMerchantMap.put("BUCKLE", CategoryType.OTHER);
//        csvMerchantMap.put("SP Strom Holdings LLC", CategoryType.OTHER);
//    }
//
//
//    // Level 0 Merchant Transaction Amount Static Matching
//    void initializeCSVMerchantPriceMap()
//    {
//        csvMerchantPriceMap.put(new MerchantPrice("FLEX FINANCE", BigDecimal.valueOf(14.99).stripTrailingZeros()), CategoryType.SUBSCRIPTION);
//        csvMerchantPriceMap.put(new MerchantPrice("Flexible Finance", BigDecimal.valueOf(14.990).stripTrailingZeros()), CategoryType.SUBSCRIPTION);
//        csvMerchantPriceMap.put(new MerchantPrice("FLEX FINANCE", BigDecimal.valueOf(707.0).stripTrailingZeros()), CategoryType.RENT);
//        csvMerchantPriceMap.put(new MerchantPrice("FLEX FINANCE", BigDecimal.valueOf(1220.0).stripTrailingZeros()), CategoryType.RENT);
//        csvMerchantPriceMap.put(new MerchantPrice("Flexible Finance", BigDecimal.valueOf(1220.03).stripTrailingZeros()), CategoryType.RENT);
//        csvMerchantPriceMap.put(new MerchantPrice("Flexible Finance", BigDecimal.valueOf(707.00).stripTrailingZeros()), CategoryType.RENT);
//    }

    @Override
    public boolean matches(TransactionCSV transaction, TransactionRule transactionRule)
    {
        if(transaction == null || transactionRule == null)
        {
            return false;
        }
        BigDecimal transactionAmount = transaction.getTransactionAmount()
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
        boolean descriptionRuleMatch = descriptionRule == null || descriptionRule.isEmpty()
                || descriptionRule.equalsIgnoreCase(description);

        boolean extendedDescriptionRuleMatch = extendedDescriptionRule == null || extendedDescriptionRule.isEmpty()
                || extendedDescriptionRule.equalsIgnoreCase(extendedDescription);
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
