package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.TransactionRuleEntity;
import com.app.budgetbuddy.exceptions.CategoryNotFoundException;
import com.app.budgetbuddy.repositories.AccountRepository;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.workbench.PlaidCategoryManager;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.util.*;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

@Getter
@Setter
@Slf4j
public abstract class AbstractTransactionMatcher<T extends Transaction, S extends TransactionRule> implements TransactionMatcher<T, S>
{
    protected final TransactionRuleService transactionRuleService;
    private final AccountRepository accountRepository;
    protected final CategoryService categoryService;
    protected List<TransactionRule> systemCategoryRules = new ArrayList<>();
    public List<TransactionRule> userCategoryRules;
    protected final PlaidCategoryManager plaidCategoryManager;
    protected final String UNCATEGORIZED = "Uncategorized";
    protected static final Map<String, String> CATEGORY_NAME_MAPPING = new HashMap<>();
    protected static final Map<String, Map<String, String>> SPECIAL_CASE_CATEGORY_MAPPING = new HashMap<>();
    protected static final Map<String, Map<String, String>> MERCHANT_MAPPING = new HashMap<>();
    protected static final Map<String, Map<String, String>> TRANSACTION_DESCRIPTION_MAPPING = new HashMap<>();
    protected static final Map<String, String> MERCHANT_SUBSCRIPTIONS = new HashMap<>();
    protected static final Map<String, Map<String, CategoryType>> CATEGORY_ID_RULES = new HashMap<>();
    protected static final Map<String, BigDecimal> SPECIAL_AMOUNTS_RULES = new HashMap<>();
    protected static final Map<String, Map<String, CategoryType>> MERCHANT_CATEGORY_RULES = new HashMap<>();
    protected static final Map<String, String> MERCHANT_UTILITIES = new HashMap<>();
    protected static final Map<String, Map<String, CategoryType>> MERCHANT_CATEGORY_DESCRIPTION = new HashMap<>();

    public AbstractTransactionMatcher(TransactionRuleService transactionRuleService, CategoryService categoryService,
                                      PlaidCategoryManager plaidCategoryManager, AccountRepository accountRepository)
    {
        this.transactionRuleService = transactionRuleService;
        this.categoryService = categoryService;
        this.plaidCategoryManager = plaidCategoryManager;
        this.accountRepository = accountRepository;
    }

    static {

        Map<String, CategoryType> conservicePayment = new HashMap<>();
        conservicePayment.put("Service", CategoryType.UTILITIES);

        Map<String, CategoryType> lavazzaSubscription = new HashMap<>();
        lavazzaSubscription.put("Recreation", CategoryType.SUBSCRIPTION);

        MERCHANT_CATEGORY_DESCRIPTION.put("Conservice LLC", conservicePayment);
        MERCHANT_CATEGORY_DESCRIPTION.put("Lavazza", lavazzaSubscription);
    }

    static {
        Map<String, CategoryType> restaurantIdMap = new HashMap<>();
        restaurantIdMap.put("13005032", CategoryType.ORDER_OUT);
        restaurantIdMap.put("13005000", CategoryType.ORDER_OUT);
        restaurantIdMap.put("17042000", CategoryType.ORDER_OUT);
        CATEGORY_ID_RULES.put("Restaurants", restaurantIdMap);

        Map<String, CategoryType> greatClipsRules = new HashMap<>();
        greatClipsRules.put("18045000", CategoryType.HAIRCUT);
        MERCHANT_CATEGORY_RULES.put("Great Clips", greatClipsRules);

        Map<String, CategoryType> pandasExpressRules = new HashMap<>();
        pandasExpressRules.put("13005032", CategoryType.ORDER_OUT);
        Map<String, CategoryType> oliveGardenRules = new HashMap<>();
        oliveGardenRules.put("13005000", CategoryType.ORDER_OUT);

        MERCHANT_CATEGORY_RULES.put("Pandas Express", pandasExpressRules);
        MERCHANT_CATEGORY_RULES.put("Olive Garden", oliveGardenRules);
        SPECIAL_AMOUNTS_RULES.put("Flex Finance", new BigDecimal("14.990"));
    }

    static {
        MERCHANT_UTILITIES.put("Enb Gas Ut", "Utilities");
        MERCHANT_UTILITIES.put("Pacific Power", "Utilities");
        MERCHANT_UTILITIES.put("Conservice LLC", "Utilities");
    }

    static {
        MERCHANT_SUBSCRIPTIONS.put("Affirm", "Subscription");
        MERCHANT_SUBSCRIPTIONS.put("JetBrains Americas Inc", "Subscription");
        MERCHANT_SUBSCRIPTIONS.put("Planet Fitness", "Subscription");
        MERCHANT_SUBSCRIPTIONS.put("YouTube Premium", "Subscription");
        MERCHANT_SUBSCRIPTIONS.put("Lavazza", "Subscription");
        MERCHANT_SUBSCRIPTIONS.put("Claude.ai", "Subscription");
        MERCHANT_SUBSCRIPTIONS.put("Spotify", "Subscription");
    }

    static {
        MERCHANT_SUBSCRIPTIONS.put("American Express", "Payment");
        MERCHANT_SUBSCRIPTIONS.put("Comcast Xfinity", "Utilities");
        MERCHANT_SUBSCRIPTIONS.put("Exxon Mobil", "Gas");
        MERCHANT_SUBSCRIPTIONS.put("Netflix", "Subscription");
        MERCHANT_SUBSCRIPTIONS.put("Kroger", "Groceries");
        MERCHANT_SUBSCRIPTIONS.put("Chiptole Mexican Grill", "Order Out");
        MERCHANT_SUBSCRIPTIONS.put("Target", "Groceries");
        MERCHANT_SUBSCRIPTIONS.put("Macy's", "Other");
        MERCHANT_SUBSCRIPTIONS.put("Whole Foods Market", "Groceries");
        MERCHANT_SUBSCRIPTIONS.put("Buffalo Wild Wings", "Order Out");
        MERCHANT_SUBSCRIPTIONS.put("Chevron", "Gas");
        MERCHANT_SUBSCRIPTIONS.put("First National Bank", "Payment");
        MERCHANT_SUBSCRIPTIONS.put("CVS Pharmacy", "Other");
        MERCHANT_SUBSCRIPTIONS.put("Shell", "Gas");
        MERCHANT_SUBSCRIPTIONS.put("McDonald's", "Order Out");
        MERCHANT_SUBSCRIPTIONS.put("Walmart", "Groceries");
    }

    static {
        CATEGORY_NAME_MAPPING.put("Gas Stations", "Gas");
        CATEGORY_NAME_MAPPING.put("Supermarkets and Groceries", "Groceries");
        CATEGORY_NAME_MAPPING.put("Restaurants", "Order Out");
        CATEGORY_NAME_MAPPING.put("Payroll", "Payroll");
        CATEGORY_NAME_MAPPING.put("Credit Card", "Payment");
        CATEGORY_NAME_MAPPING.put("Insurance", "Insurance");
        CATEGORY_NAME_MAPPING.put("Subscription", "Subscription");
        CATEGORY_NAME_MAPPING.put("Pharmacies", "Other");
        CATEGORY_NAME_MAPPING.put("Gyms and Fitness Centers", "Subscription");
        CATEGORY_NAME_MAPPING.put("Sports Clubs", "Order Out");
        CATEGORY_NAME_MAPPING.put("Financial", "Payment");
        CATEGORY_NAME_MAPPING.put("Digital Purchase", "Other");
        CATEGORY_NAME_MAPPING.put("Computers and Electronics", "Other");
        CATEGORY_NAME_MAPPING.put("Personal Care", "Haircut");
        CATEGORY_NAME_MAPPING.put("Third Party", "Payment");
        CATEGORY_NAME_MAPPING.put("Parking", "Other");
        CATEGORY_NAME_MAPPING.put("Utilities", "Utilities");
        CATEGORY_NAME_MAPPING.put("Payment", "Payment");
        CATEGORY_NAME_MAPPING.put("Golf", "Other");
        CATEGORY_NAME_MAPPING.put("Withdrawal", "Withdrawal");
        CATEGORY_NAME_MAPPING.put("Credit", "Transfer");
        CATEGORY_NAME_MAPPING.put("Food and Drink", "Order Out");
        CATEGORY_NAME_MAPPING.put("Fast Food", "Order Out");
        CATEGORY_NAME_MAPPING.put("Coffee Shop", "Coffee");
        CATEGORY_NAME_MAPPING.put("Travel", "Trip");
        CATEGORY_NAME_MAPPING.put("Airlines and Aviation Services", "Trip");
        CATEGORY_NAME_MAPPING.put("Taxi", "Trip");
        CATEGORY_NAME_MAPPING.put("Transfer", "Transfer");
    }

    static {
        Map<String, String> computersMap = new HashMap<>();
        computersMap.put("19013000", "Subscription");
        SPECIAL_CASE_CATEGORY_MAPPING.put("Computers and Electronics", computersMap);

        Map<String, String> digitalMap = new HashMap<>();
        digitalMap.put("19019000", "Subscription");
        SPECIAL_CASE_CATEGORY_MAPPING.put("Digital Purchase", digitalMap);
    }

    static {
        Map<String, String> jetbrainsMap = new HashMap<>();
        jetbrainsMap.put("19029000", "Subscription");

        Map<String, String> enbridgeGasMap = new HashMap<>();
        enbridgeGasMap.put("22009000", "Utilities");

        MERCHANT_MAPPING.put("Jetbrains Americas Inc", jetbrainsMap);
        MERCHANT_MAPPING.put("Enb Gas Ut", enbridgeGasMap);
    }

    static {
        // Fast food specific mappings
        Map<String, CategoryType> mcDonaldsRules = new HashMap<>();
        mcDonaldsRules.put("13005032", CategoryType.ORDER_OUT);
        MERCHANT_CATEGORY_RULES.put("McDonald's", mcDonaldsRules);

        // Coffee shop specific mappings
        Map<String, CategoryType> starbucksRules = new HashMap<>();
        starbucksRules.put("13005043", CategoryType.COFFEE);
        MERCHANT_CATEGORY_RULES.put("Starbucks", starbucksRules);

        // SparkFun/FUN - looks miscategorized as restaurant in logs
        Map<String, CategoryType> sparkFunRules = new HashMap<>();
        sparkFunRules.put("13005000", CategoryType.OTHER);  // Override Plaid category
        MERCHANT_CATEGORY_RULES.put("SparkFun", sparkFunRules);
        MERCHANT_CATEGORY_RULES.put("FUN", sparkFunRules);

        // Uber mappings
        Map<String, CategoryType> uberRules = new HashMap<>();
        uberRules.put("22016000", CategoryType.TRIP);
        MERCHANT_CATEGORY_RULES.put("Uber", uberRules);
    }

    static {
        // Add new category name mappings
        CATEGORY_NAME_MAPPING.put("Fast Food", "Order Out");
        CATEGORY_NAME_MAPPING.put("Coffee Shop", "Coffee");
        CATEGORY_NAME_MAPPING.put("Taxi", "Transportation");
    }

    static {
        // Add category ID mappings for the specific IDs seen in logs
        Map<String, CategoryType> fastFoodIdMap = new HashMap<>();
        fastFoodIdMap.put("13005032", CategoryType.ORDER_OUT);
        CATEGORY_ID_RULES.put("Fast Food", fastFoodIdMap);

        Map<String, CategoryType> coffeeShopIdMap = new HashMap<>();
        coffeeShopIdMap.put("13005043", CategoryType.COFFEE);
        CATEGORY_ID_RULES.put("Coffee Shop", coffeeShopIdMap);

        Map<String, CategoryType> taxiIdMap = new HashMap<>();
        taxiIdMap.put("22016000", CategoryType.TRIP);
        CATEGORY_ID_RULES.put("Taxi", taxiIdMap);
    }

    static {
        Map<String, String> amazonPrimeMap = new HashMap<>();
        amazonPrimeMap.put("19019000", "Subscription");

        Map<String, String> amazonPurchaseMap = new HashMap<>();
        amazonPurchaseMap.put("19019000", "Other");

        Map<String, String> steamPurchasesMap = new HashMap<>();
        steamPurchasesMap.put("19013001", "Other");

        Map<String, String> paypalPurchaseMap = new HashMap<>();
        paypalPurchaseMap.put("21010004", "Payment");

        Map<String, String> amexPurchaseMap = new HashMap<>();
        amexPurchaseMap.put("16001000", "Payment");

        Map<String, String> depositTransferMap = new HashMap<>();
        depositTransferMap.put("21005000", "Transfer");

        Map<String, String> jetbrainsPurchaseMap = new HashMap<>();
        jetbrainsPurchaseMap.put("12009000", "Subscription");

        TRANSACTION_DESCRIPTION_MAPPING.put("PIN Purchase JETBRAINS AMERI", jetbrainsPurchaseMap);
        TRANSACTION_DESCRIPTION_MAPPING.put("Deposit Transfer", depositTransferMap);
        TRANSACTION_DESCRIPTION_MAPPING.put("Amazon Prime", amazonPrimeMap);
        TRANSACTION_DESCRIPTION_MAPPING.put("Purchase WL *Steam Purchase", steamPurchasesMap);
        TRANSACTION_DESCRIPTION_MAPPING.put("Steam Games", steamPurchasesMap);
        TRANSACTION_DESCRIPTION_MAPPING.put("Purchase AMAZON", amazonPurchaseMap);
        TRANSACTION_DESCRIPTION_MAPPING.put("PAYPAL INST XFER PAYPAL INST XFER", paypalPurchaseMap);
        TRANSACTION_DESCRIPTION_MAPPING.put("AMEX EPAYMENT ACH PMT AMEX PAYMENT", amexPurchaseMap);
    }

    protected List<TransactionRule> loadTransactionRules() {
        return transactionRuleService.getConvertedCategoryRules(
                transactionRuleService.findAllSystemCategoryRules()
        );
    }

    protected boolean hasMatchingUserRule(T transaction, List<UserCategoryRule> userCategoryRules) {
        if (userCategoryRules == null || userCategoryRules.isEmpty()) {
            return false;
        }

        return userCategoryRules.stream()
                .filter(UserCategoryRule::isActive)
                .anyMatch(rule -> matchesUserRule(transaction, rule));
    }

    protected CategoryType matchCategoryIdOnlyRules(T transaction)
    {
        String categoryId = transaction.getCategoryId();
        Map<String, CategoryType> categoryMerchantRules = MERCHANT_CATEGORY_RULES.get(categoryId);
        if(categoryMerchantRules != null && categoryMerchantRules.containsKey(categoryId))
        {
            return categoryMerchantRules.get(categoryId);
        }
        return CategoryType.UNCATEGORIZED;
    }

    protected CategoryType matchWithoutCategoryDescriptionRules(T transaction)
    {
        return null;
    }

    protected CategoryType matchWithoutTransactionDescriptionRules(T transaction)
    {
        String categoryId = transaction.getCategoryId();
        String merchantName = transaction.getMerchantName();
        Optional<CategoryEntity> categoryOptional = getCategoryEntityById(categoryId);
        if(categoryOptional.isEmpty())
        {
            return CategoryType.UNCATEGORIZED;
        }
        CategoryEntity category = categoryOptional.get();

        // First match on categoryId
        Map<String, CategoryType> categoryRules = CATEGORY_ID_RULES.get(categoryId);
        if(categoryRules != null && categoryRules.containsKey(categoryId))
        {
            return categoryRules.get(categoryId);
        }

        // Check by merchant name and category Id
        Map<String, CategoryType> merchantCategoryRules = MERCHANT_CATEGORY_RULES.get(merchantName);
        if(merchantCategoryRules != null && merchantCategoryRules.containsKey(categoryId))
        {
            return merchantCategoryRules.get(categoryId);
        }

        if(MERCHANT_SUBSCRIPTIONS.containsKey(merchantName))
        {
            return CategoryType.SUBSCRIPTION;
        }
        return CategoryType.UNCATEGORIZED;
    }

    protected abstract CategoryType matchRulesByPriority(final T transaction, final int priority);

    protected abstract CategoryType determineCategoryMatchByTransaction(final T transaction, final String categoryId, final String categoryName, final String merchantName, final String transactionDescription);

    protected CategoryType matchCompleteDataRules(final T transaction)
    {
        String categoryId = transaction.getCategoryId();
        String transactionDescription = transaction.getDescription();
        String merchantName = transaction.getMerchantName();
        Optional<CategoryEntity> categoryOptional = getCategoryEntityById(categoryId);
        if(categoryOptional.isEmpty())
        {
            return CategoryType.UNCATEGORIZED;
        }
        CategoryEntity category = categoryOptional.get();
        String categoryName = category.getName();
        return determineCategoryMatchByTransaction(transaction, categoryId, categoryName, merchantName, transactionDescription);
    }

    protected boolean matchesUserRule(T transaction, UserCategoryRule userCategoryRule){
        return (matchesMerchantPattern(transaction, userCategoryRule) ||
                matchesDescriptionPattern(transaction, userCategoryRule) ||
                matchesCategoryPattern(transaction, userCategoryRule));
    }

    protected String getTransactionCategory(T transaction)
    {
        List<String> categories = transaction.getCategories();
        log.info("Categories: {}", categories);
        if(categories == null)
        {
            return UNCATEGORIZED;
        }

        if(!categories.isEmpty())
        {
            for(String category : categories)
            {
                if(category == null)
                {
                    continue;
                }
                return category;
            }
        }
        else
        {
            String categoryId = transaction.getCategoryId();
            log.info("Category Id: {}", categoryId);
            return getCategoryNameById(categoryId);
        }
        return UNCATEGORIZED;
    }

    protected boolean matchesMerchantPattern(T transaction, UserCategoryRule userCategoryRule){
        if(transaction.getMerchantName() == null || userCategoryRule.getMerchantPattern() == null){
            return false;
        }
        try
        {
            return Pattern.compile(userCategoryRule.getMerchantPattern(), Pattern.CASE_INSENSITIVE)
                    .matcher(transaction.getMerchantName())
                    .find();

        }catch(PatternSyntaxException e){
            log.error("Invalid Merchant pattern in rule: {}", userCategoryRule.getMerchantPattern(), e);
            return false;
        }
    }

    protected boolean matchesDescriptionPattern(T transaction, UserCategoryRule userCategoryRule){
        if(transaction.getDescription() == null || userCategoryRule.getDescriptionPattern() == null){
            return false;
        }
        try
        {
            return Pattern.compile(userCategoryRule.getDescriptionPattern(), Pattern.CASE_INSENSITIVE)
                    .matcher(transaction.getDescription())
                    .find();
        }catch(PatternSyntaxException e){
            log.error("Invalid description pattern in rule: {}", userCategoryRule.getDescriptionPattern(), e);
            return false;
        }
    }

    protected boolean matchesCategoryPattern(T transaction, UserCategoryRule userCategoryRule){
        if(transaction.getCategories() == null || userCategoryRule.getCategoryName() == null){
            return false;
        }
        try
        {
//            if(!isValidPlaidCategory(userCategoryRule.getCategoryName())){
//                log.warn("Rule contains invalid Plaid Category: {}", userCategoryRule.getCategoryName());
//                return false;
//            }
            Pattern categoryPattern = Pattern.compile(userCategoryRule.getCategoryName(), Pattern.CASE_INSENSITIVE);
            return transaction.getCategories().stream()
                    .anyMatch(category -> categoryPattern.matcher(category).find());
        }catch(PatternSyntaxException e){
            log.error("Invalid category pattern in rule: {}", userCategoryRule.getCategoryName(), e);
            return false;
        }
    }

    protected Optional<CategoryEntity> getCategoryEntityById(String categoryId)
    {
        if(categoryId == null || categoryId.isEmpty())
        {
            return Optional.empty();
        }
        try
        {
            return categoryService.findCategoryById(categoryId);
        }catch(CategoryNotFoundException e){
            log.error("There was an error retrieving category with id: {}", categoryId, e);
            return Optional.empty();
        }
    }

    protected boolean matchesMerchantPatternRule(S transaction, CategoryRule rule) {
        if (transaction.getMerchantPattern() == null || rule.getMerchantPattern() == null) {
            return false;
        }
        try {
            return Pattern.compile(rule.getMerchantPattern(), Pattern.CASE_INSENSITIVE)
                    .matcher(transaction.getMerchantPattern())
                    .find();
        } catch (PatternSyntaxException e) {
            log.error("Invalid merchant pattern in rule: {}", rule.getMerchantPattern(), e);
            return false;
        }
    }

    protected boolean matchesDescriptionPatternRule(S transaction, CategoryRule rule) {
        if (transaction.getDescriptionPattern() == null || rule.getDescriptionPattern() == null) {
            return false;
        }
        try {
            return Pattern.compile(rule.getDescriptionPattern(), Pattern.CASE_INSENSITIVE)
                    .matcher(transaction.getDescriptionPattern())
                    .find();
        } catch (PatternSyntaxException e) {
            log.error("Invalid description pattern in rule: {}", rule.getDescriptionPattern(), e);
            return false;
        }
    }

    protected boolean matchesCategoryPatternRule(S transaction, CategoryRule rule) {
        if (transaction.getCategories() == null || rule.getCategoryName() == null) {
            return false;
        }
        try {
            Pattern categoryPattern = Pattern.compile(rule.getCategoryName(), Pattern.CASE_INSENSITIVE);
            return transaction.getCategories().stream()
                    .anyMatch(category -> categoryPattern.matcher(category).find());
        } catch (PatternSyntaxException e) {
            log.error("Invalid category pattern in rule: {}", rule.getCategoryName(), e);
            return false;
        }
    }

//    protected int determinePriority(final T transaction, final List<UserCategoryRule> userCategoryRules)
//    {
//        if(transaction == null)
//        {
//            return PriorityLevel.NONE.getValue();
//        }
//
//        if(hasMatchingUserRule(transaction, userCategoryRules)){
//            return PriorityLevel.USER_DEFINED.getValue();
//        }
//
//        return determineSystemPriority(transaction);
//    }

//    protected int determineSystemPriority(final T transaction){
//        // Check data completeness first
//        boolean hasMerchant = (transaction.getMerchantName() != null && !transaction.getMerchantName().isEmpty());
//        boolean hasDescription = (transaction.getDescription() != null && !transaction.getDescription().isEmpty());
//        boolean hasCategories = (transaction.getCategories() != null && !transaction.getCategories().isEmpty());
//        boolean hasCategoryId = (transaction.getCategoryId() != null && !transaction.getCategoryId().isEmpty());
//        boolean hasAmount = (transaction.getAmount() != null);
//        // Determine base priority from data completeness
//        int basePriority;
//
//        if (hasMerchant && hasDescription && hasCategories && hasCategoryId && hasAmount) {
//            basePriority = PriorityLevel.DATA_COMPLETE.getValue();
//        } else if ((hasMerchant && hasCategories) || (hasMerchant && hasDescription) ||
//                (hasDescription && hasCategories)) {
//            basePriority = PriorityLevel.DATA_PARTIAL.getValue();
//        } else if (hasMerchant || hasDescription || hasCategories) {
//            basePriority = PriorityLevel.DATA_MINIMAL.getValue();
//        } else {
//            return PriorityLevel.NONE.getValue();
//        }
//
//        // Now check for specific rule matches to boost priority
//        String merchantName = transaction.getMerchantName();
//        String categoryId = transaction.getCategoryId();
//        String categoryName = null;
//
//        // Try to get category name if we have a category ID
//        if (hasCategoryId) {
//            Optional<CategoryEntity> categoryOpt = getCategoryEntityById(categoryId);
//            if (categoryOpt.isPresent()) {
//                categoryName = categoryOpt.get().getName();
//            }
//        }
//
//        // Check for special case combinations
//        if (hasMerchant && hasCategoryId && hasAmount) {
//            // Check Flex Finance special case
//            if ("Flex Finance".equals(merchantName)) {
//                BigDecimal flexValue = SPECIAL_AMOUNTS_RULES.get("Flex Finance");
//                if (flexValue != null && transaction.getAmount().compareTo(flexValue) == 0) {
//                    return PriorityLevel.MERCHANT_AMOUNT_CATEGORY.getValue();
//                }
//            }
//        }
//
//        // Check merchant + category combinations
//        if (hasMerchant && hasCategoryId) {
//            Map<String, CategoryType> merchantCategories = MERCHANT_CATEGORY_RULES.get(merchantName);
//            if (merchantCategories != null && merchantCategories.containsKey(categoryId)) {
//                return PriorityLevel.MERCHANT_CATEGORY.getValue();
//            }
//        }
//
//        // Check description + category combinations
//        if (hasDescription && hasCategoryId) {
//            for (Map.Entry<String, Map<String, String>> entry : TRANSACTION_DESCRIPTION_MAPPING.entrySet()) {
//                if (transaction.getDescription().contains(entry.getKey())) {
//                    Map<String, String> categoryMapping = entry.getValue();
//                    if (categoryMapping.containsKey(categoryId)) {
//                        return PriorityLevel.TRANSACTION_DESCRIPTION_CATEGORY.getValue();
//                    }
//                }
//            }
//        }
//        // Check merchant-only rules
//        if (hasMerchant) {
//            if (MERCHANT_SUBSCRIPTIONS.containsKey(merchantName) ||
//                    MERCHANT_UTILITIES.containsKey(merchantName)) {
//                return PriorityLevel.MERCHANT_ONLY.getValue();
//            }
//        }
//
//        // Check category ID + name combinations
//        if (hasCategoryId && categoryName != null) {
//            Map<String, CategoryType> categoryRules = CATEGORY_ID_RULES.get(categoryName);
//            if (categoryRules != null && categoryRules.containsKey(categoryId)) {
//                return PriorityLevel.CATEGORY_ID_NAME.getValue();
//            }
//        }
//
//        // Check category name only mappings
//        if (categoryName != null && CATEGORY_NAME_MAPPING.containsKey(categoryName)) {
//            return PriorityLevel.CATEGORY_NAME_ONLY.getValue();
//        }
//
//        // If no specific rule matched, return the base priority
//        return basePriority;
//    }

    protected Long getUserIdByAccountId(final String accountId)
    {
        if(accountId.isEmpty())
        {
            throw new IllegalArgumentException("Account Id cannot be empty");
        }
        Optional<Long> userIdOptional = accountRepository.findUserIdByAccountId(accountId);
        if(userIdOptional.isEmpty())
        {
            throw new IllegalArgumentException("User Id not found with account Id: " + accountId);
        }
        return userIdOptional.get();
    }

    protected List<TransactionRule> loadUserCategoryRules(Long userId)
    {
        List<TransactionRuleEntity> categoryRuleEntities = transactionRuleService.findByUserId(userId);
        if(!categoryRuleEntities.isEmpty()) {
            List<TransactionRule> categoryRulesForUser = transactionRuleService.getConvertedCategoryRules(categoryRuleEntities);
            if(!categoryRulesForUser.isEmpty()) {
                this.userCategoryRules.addAll(categoryRulesForUser);
            }
        }
        return new ArrayList<>();
    }

    protected String getCategoryNameById(String categoryId) {
        if (categoryId == null) {
            return "";
        }
        Optional<CategoryEntity> category = categoryService.findCategoryById(categoryId);
        if(category.isEmpty()){
            throw new CategoryNotFoundException(categoryId);
        }
        log.info("Found Category: " + category);
        return category.get().getName();
    }
}
