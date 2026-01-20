package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.CSVAccountEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.repositories.CSVAccountRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

import static org.junit.Assert.assertEquals;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyLong;

@SpringBootTest
class CSVTransactionCategorizerServiceImplTest
{

    @Autowired
    @Qualifier("CSVTransactionCategorizerServiceImpl")
    private CategorizerService<TransactionCSV> transactionCSVCategorizerService;

    @MockBean
    private CSVAccountRepository csvAccountRepository;

    @MockBean
    private TransactionRuleService transactionRuleService;

    @BeforeEach
    void setUp() {
    }

    @Test
    void testCategorize_whenTransactionCSVIsNull(){
        String categoryType = transactionCSVCategorizerService.categorize(null);
        Assertions.assertEquals(CategoryType.UNCATEGORIZED.getType(), categoryType);
    }

    @Test
    void testCategorize_whenTransactionCSV_hasWINCOTransaction_thenMatchGroceries(){
        TransactionCSV wincoTransactionCSV = new TransactionCSV();
        wincoTransactionCSV.setMerchantName("WINCO FOODS");
        wincoTransactionCSV.setTransactionAmount(BigDecimal.valueOf(75.00));
        String categoryType = transactionCSVCategorizerService.categorize(wincoTransactionCSV);
        assertEquals(CategoryType.GROCERIES.getType(), categoryType);
    }

    @Test
    void testCategorize_whenTransactionCSV_hasRentTransaction_thenMatchRent(){
        TransactionCSV rentTransactionCSV = new TransactionCSV();
        rentTransactionCSV.setMerchantName("FLEX FINANCE");
        rentTransactionCSV.setTransactionAmount(BigDecimal.valueOf(707.0));
        String categoryType = transactionCSVCategorizerService.categorize(rentTransactionCSV);
        assertEquals(CategoryType.RENT.getType(), categoryType);
    }

    @Test
    void testCategorize_whenTransactionCSV_hasFLEXFinanceSubscription_thenMatchSubscription(){
        TransactionCSV rentTransactionCSV = new TransactionCSV();
        rentTransactionCSV.setMerchantName("FLEX FINANCE");
        rentTransactionCSV.setTransactionAmount(BigDecimal.valueOf(14.99));
        String categoryType = transactionCSVCategorizerService.categorize(rentTransactionCSV);
        assertEquals(CategoryType.SUBSCRIPTION.getType(), categoryType);
    }

    @ParameterizedTest
    @MethodSource("provideTransactionsForCategorization")
    @DisplayName("Categorize various CSV transactions correctly")
    void testCategorize_withMultipleTransactions(TransactionCSV transactionCSV, CategoryType expectedCategoryType){
        String categoryType = transactionCSVCategorizerService.categorize(transactionCSV);
        assertEquals(expectedCategoryType.getType(), categoryType);
    }


    private static Stream<Arguments> provideTransactionsForCategorization() {
        return Stream.of(
                Arguments.of(
                        createTransaction("FLEX FINANCE", BigDecimal.valueOf(707.0), "Rent payment"),
                        CategoryType.RENT,
                        "Flex Finance with rent amount should categorize as RENT"
                ),
                Arguments.of(createTransaction("FLEX FINANCE", BigDecimal.valueOf(1220), "Rent payment"), CategoryType.RENT, "Flex Finance with rent amount should categorize as RENT"),
                Arguments.of(
                        createTransaction("FLEX FINANCE", BigDecimal.valueOf(14.99), "Subscription fee"),
                        CategoryType.SUBSCRIPTION,
                        "Flex Finance with subscription amount should categorize as SUBSCRIPTION"
                ),
                Arguments.of(
                        createTransaction("OLIVE GARDEN", BigDecimal.valueOf(45.50), "Dinner"),
                        CategoryType.ORDER_OUT,
                        "Olive Garden should categorize as ORDER_OUT"
                ),
                Arguments.of(
                        createTransaction("WINCO FOODS", BigDecimal.valueOf(125.75), "Groceries"),
                        CategoryType.GROCERIES,
                        "WinCo Foods should categorize as GROCERIES"
                ),
                Arguments.of(
                        createTransaction("GREAT CLIPS", BigDecimal.valueOf(18.00), "Haircut"),
                        CategoryType.HAIRCUT,
                        "Great Clips should categorize as HAIRCUT"
                ),
                Arguments.of(
                        createTransaction("STATE FARM", BigDecimal.valueOf(150.00), "Auto insurance"),
                        CategoryType.INSURANCE,
                        "State Farm should categorize as INSURANCE"
                )
        );
    }

    @Test
    void testCategorize_withUserTransactionRule_thenReturnCategory(){
        Long userId = 1L;
        TransactionCSV winco_transaction = new TransactionCSV();
        winco_transaction.setMerchantName("WINCO FOODS");
        winco_transaction.setTransactionAmount(BigDecimal.valueOf(40.310));
        winco_transaction.setTransactionDate(LocalDate.of(2025, 10, 3));
        winco_transaction.setDescription("PIN Purchase");
        winco_transaction.setExtendedDescription("WINCO FOODS #15");
        winco_transaction.setSuffix(9);
        winco_transaction.setAccount("002285914");

        TransactionRule wincoShoppingRule = new TransactionRule();
        wincoShoppingRule.setMerchantRule("WINCO FOODS");
        wincoShoppingRule.setDescriptionRule("PIN Purchase");
        wincoShoppingRule.setExtendedDescriptionRule("WINCO FOODS #15");
        wincoShoppingRule.setUserId(userId);
        wincoShoppingRule.setActive(true);
        wincoShoppingRule.setCategoryName("Shopping");
        wincoShoppingRule.setPriority(1);
        wincoShoppingRule.setAmountMin(10);
        wincoShoppingRule.setAmountMax(80);

        TransactionRule wincoShoppingRule2 = new TransactionRule();
        wincoShoppingRule2.setMerchantRule("WINCO FOODS");
        wincoShoppingRule2.setUserId(userId);
        wincoShoppingRule2.setActive(true);
        wincoShoppingRule2.setCategoryName("Shopping");
        wincoShoppingRule2.setPriority(4);

        List<TransactionRule> wincoShoppingRules = new ArrayList<>();
        wincoShoppingRules.add(wincoShoppingRule);
        wincoShoppingRules.add(wincoShoppingRule2);

        CSVAccountEntity csvAccountEntity = new CSVAccountEntity();
        csvAccountEntity.setUser(UserEntity.builder().id(1L).build());
        csvAccountEntity.setSuffix(9);
        Mockito.when(csvAccountRepository.findBySuffixAndUserId(9, userId))
                        .thenReturn(Optional.of(csvAccountEntity));

        Mockito.when(transactionRuleService.findByUserId(anyLong())).thenReturn(wincoShoppingRules);

        String categoryType = transactionCSVCategorizerService.categorize(winco_transaction);
        assertEquals("Shopping", categoryType);
    }

    @Test
    void testCategorize_withUserTransactionRule_MerchantNameShorter_thenReturnCategory(){
        Long userId = 1L;
        TransactionCSV winco_transaction = new TransactionCSV();
        winco_transaction.setMerchantName("WINCO FOODS");
        winco_transaction.setTransactionAmount(BigDecimal.valueOf(40.310));
        winco_transaction.setTransactionDate(LocalDate.of(2025, 10, 3));
        winco_transaction.setDescription("PIN Purchase");
        winco_transaction.setExtendedDescription("WINCO FOODS #15");
        winco_transaction.setSuffix(9);
        winco_transaction.setAccount("002285914");

        TransactionRule wincoShoppingRule = new TransactionRule();
        wincoShoppingRule.setMerchantRule("WINCO");
        wincoShoppingRule.setDescriptionRule("PIN Purchase");
        wincoShoppingRule.setCategoryName("Shopping");
        wincoShoppingRule.setActive(true);
        wincoShoppingRule.setPriority(5);

        TransactionRule wincoShoppingRule2 = new TransactionRule();
        wincoShoppingRule2.setMerchantRule("WINCO");
        wincoShoppingRule2.setCategoryName("Shopping");
        wincoShoppingRule2.setActive(true);
        wincoShoppingRule2.setPriority(6);

        List<TransactionRule> wincoShoppingRules = new ArrayList<>();
        wincoShoppingRules.add(wincoShoppingRule2);

        CSVAccountEntity csvAccountEntity = new CSVAccountEntity();
        csvAccountEntity.setUser(UserEntity.builder().id(1L).build());
        csvAccountEntity.setSuffix(9);
        Mockito.when(csvAccountRepository.findBySuffixAndUserId(9, userId))
                .thenReturn(Optional.of(csvAccountEntity));

        Mockito.when(transactionRuleService.findByUserId(anyLong())).thenReturn(wincoShoppingRules);
        String categoryType = transactionCSVCategorizerService.categorize(winco_transaction);
        assertEquals("Shopping", categoryType);

    }

    @ParameterizedTest
    @MethodSource("provideTransactionsWithUserRules")
    @DisplayName("Categorize Transactions with multiple user transaction rules")
    void testCategorize_withMultipleUserTransactionRules(Long userId,
                                                         List<TransactionRule> transactionRules,
                                                         TransactionCSV transactionCSV,
                                                         String expectedCategory){
        // Setup user and account
        UserEntity userEntity = new UserEntity();
        userEntity.setId(userId);

        CSVAccountEntity accountEntity = new CSVAccountEntity();
        accountEntity.setUser(userEntity);
        accountEntity.setSuffix(transactionCSV.getSuffix());

        // Mock the repositories
        Mockito.when(csvAccountRepository.findByAcctNumAndSuffix(
                        transactionCSV.getAccount(), transactionCSV.getSuffix()))
                .thenReturn(Optional.of(accountEntity));

        Mockito.when(transactionRuleService.findByUserId(userId))
                .thenReturn(transactionRules);

        // Execute
        String result = transactionCSVCategorizerService.categorize(transactionCSV);

        // Assert
        assertEquals(expectedCategory, result);
    }

    @Test
    void testMatches_whenTransactionIsNull_thenReturnFalse(){
        TransactionRule rule = TransactionRule.builder()
                .id(1L)
                .userId(1L)
                .categoryName("Shopping")
                .merchantRule("WINCO")
                .descriptionRule("PIN Purchase")
                .extendedDescriptionRule("WINCO FOODS #15")
                .amountMin(10.0)
                .amountMax(100.0)
                .priority(1)
                .isActive(true)
                .build();

        boolean result = transactionCSVCategorizerService.matches(null,rule);
        assertFalse(result);
    }

    @Test
    void testMatches_whenTransactionRuleIsNull_thenReturnFalse(){
        TransactionCSV winco_transaction = new TransactionCSV();
        winco_transaction.setMerchantName("WINCO FOODS");
        winco_transaction.setTransactionAmount(BigDecimal.valueOf(40.310));
        winco_transaction.setTransactionDate(LocalDate.of(2025, 10, 3));
        winco_transaction.setDescription("PIN Purchase");
        winco_transaction.setExtendedDescription("WINCO FOODS #15");
        winco_transaction.setSuffix(9);
        winco_transaction.setAccount("002285914");

        boolean result = transactionCSVCategorizerService.matches(winco_transaction,null);
        assertFalse(result);
    }

    @Test
    void testMatches_whenAllRulesMatch_thenReturnTrue(){
        TransactionCSV winco_transaction = new TransactionCSV();
        winco_transaction.setMerchantName("WINCO FOODS");
        winco_transaction.setTransactionAmount(BigDecimal.valueOf(40.310));
        winco_transaction.setTransactionDate(LocalDate.of(2025, 10, 3));
        winco_transaction.setDescription("PIN Purchase");
        winco_transaction.setExtendedDescription("WINCO FOODS #15");
        winco_transaction.setSuffix(9);
        winco_transaction.setAccount("002285914");

        TransactionRule wincoRule = new TransactionRule();
        wincoRule.setMerchantRule("WINCO");
        wincoRule.setDescriptionRule("PIN Purchase");
        wincoRule.setActive(true);
        wincoRule.setPriority(1);
        wincoRule.setCategoryName("Shopping");
        wincoRule.setExtendedDescriptionRule("WINCO FOODS #15");
        wincoRule.setUserId(1L);
        wincoRule.setAmountMin(10.0);
        wincoRule.setAmountMax(100.0);

        boolean result = transactionCSVCategorizerService.matches(winco_transaction,wincoRule);
        assertTrue(result);
    }

    @Test
    void testMatches_whenMerchantRuleAndAmountMatch_thenReturnTrue(){
        TransactionCSV winco_transaction = new TransactionCSV();
        winco_transaction.setMerchantName("WINCO FOODS");
        winco_transaction.setTransactionAmount(BigDecimal.valueOf(40.310));
        winco_transaction.setTransactionDate(LocalDate.of(2025, 10, 3));
        winco_transaction.setDescription("PIN Purchase");
        winco_transaction.setExtendedDescription("WINCO FOODS #15");
        winco_transaction.setSuffix(9);
        winco_transaction.setAccount("002285914");

        TransactionRule wincoRule = new TransactionRule();
        wincoRule.setMerchantRule("WINCO");
        wincoRule.setAmountMin(10.0);
        wincoRule.setAmountMax(100.0);
        wincoRule.setCategoryName("Shopping");
        wincoRule.setActive(true);
        wincoRule.setPriority(2);
        wincoRule.setUserId(1L);

        boolean result = transactionCSVCategorizerService.matches(winco_transaction,wincoRule);
        assertTrue(result);
    }

    @Test
    void testMatches_whenMerchantRuleAndMinAmountMatch_thenReturnTrue(){
        TransactionCSV winco_transaction = new TransactionCSV();
        winco_transaction.setMerchantName("WINCO FOODS");
        winco_transaction.setTransactionAmount(BigDecimal.valueOf(40.310));
        winco_transaction.setTransactionDate(LocalDate.of(2025, 10, 3));
        winco_transaction.setDescription("PIN Purchase");
        winco_transaction.setExtendedDescription("WINCO FOODS #15");
        winco_transaction.setSuffix(9);
        winco_transaction.setAccount("002285914");

        TransactionRule wincoRule = new TransactionRule();
        wincoRule.setMerchantRule("WINCO");
        wincoRule.setAmountMin(10.0);
        wincoRule.setCategoryName("Shopping");
        wincoRule.setActive(true);
        wincoRule.setPriority(3);
        wincoRule.setUserId(1L);

        boolean result = transactionCSVCategorizerService.matches(winco_transaction,wincoRule);
        assertTrue(result);
    }

    @Test
    void testMatches_whenMerchantRuleAndMaxAmountMatch_thenReturnTrue(){
        TransactionCSV winco_transaction = new TransactionCSV();
        winco_transaction.setMerchantName("WINCO FOODS");
        winco_transaction.setTransactionAmount(BigDecimal.valueOf(40.310));
        winco_transaction.setTransactionDate(LocalDate.of(2025, 10, 3));
        winco_transaction.setDescription("PIN Purchase");
        winco_transaction.setExtendedDescription("WINCO FOODS #15");
        winco_transaction.setSuffix(9);
        winco_transaction.setAccount("002285914");

        TransactionRule wincoRule = new TransactionRule();
        wincoRule.setMerchantRule("WINCO");
        wincoRule.setCategoryName("Shopping");
        wincoRule.setAmountMax(80.0);
        wincoRule.setActive(true);
        wincoRule.setPriority(4);
        wincoRule.setUserId(1L);

        boolean result = transactionCSVCategorizerService.matches(winco_transaction,wincoRule);
        assertTrue(result);
    }

    @Test
    void testMatches_whenDescriptionRuleAndMerchantRuleMatch_thenReturnTrue(){
        TransactionCSV winco_transaction = new TransactionCSV();
        winco_transaction.setMerchantName("WINCO FOODS");
        winco_transaction.setTransactionAmount(BigDecimal.valueOf(40.310));
        winco_transaction.setTransactionDate(LocalDate.of(2025, 10, 3));
        winco_transaction.setDescription("PIN Purchase");
        winco_transaction.setExtendedDescription("WINCO FOODS #15");
        winco_transaction.setSuffix(9);
        winco_transaction.setAccount("002285914");

        TransactionRule wincoRule = new TransactionRule();
        wincoRule.setMerchantRule("WINCO");
        wincoRule.setCategoryName("Shopping");
        wincoRule.setDescriptionRule("PIN Purchase");
        wincoRule.setActive(true);
        wincoRule.setPriority(5);
        wincoRule.setUserId(1L);

        boolean result = transactionCSVCategorizerService.matches(winco_transaction,wincoRule);
        assertTrue(result);
    }

    @Test
    void testMatches_whenMerchantRuleMatch_thenReturnTrue(){
        TransactionCSV winco_transaction = new TransactionCSV();
        winco_transaction.setMerchantName("WINCO FOODS");
        winco_transaction.setTransactionAmount(BigDecimal.valueOf(40.310));
        winco_transaction.setTransactionDate(LocalDate.of(2025, 10, 3));
        winco_transaction.setDescription("PIN Purchase");
        winco_transaction.setExtendedDescription("WINCO FOODS #15");
        winco_transaction.setSuffix(9);
        winco_transaction.setAccount("002285914");

        TransactionRule wincoRule = new TransactionRule();
        wincoRule.setMerchantRule("WINCO");
        wincoRule.setCategoryName("Shopping");
        wincoRule.setActive(true);
        wincoRule.setPriority(6);
        wincoRule.setUserId(1L);

        boolean result = transactionCSVCategorizerService.matches(winco_transaction,wincoRule);
        assertTrue(result);
    }

    @Test
    void testMatches_whenAllRulesEmpty_thenReturnFalse(){
        TransactionCSV winco_transaction = new TransactionCSV();
        winco_transaction.setMerchantName("WINCO FOODS");
        winco_transaction.setTransactionAmount(BigDecimal.valueOf(40.310));
        winco_transaction.setTransactionDate(LocalDate.of(2025, 10, 3));
        winco_transaction.setDescription("PIN Purchase");
        winco_transaction.setExtendedDescription("WINCO FOODS #15");
        winco_transaction.setSuffix(9);
        winco_transaction.setAccount("002285914");

        TransactionRule wincoRule = new TransactionRule();
        wincoRule.setMerchantRule("");
        wincoRule.setCategoryName("Shopping");
        wincoRule.setDescriptionRule("");
        wincoRule.setAmountMax(0.0);
        wincoRule.setAmountMin(0.0);
        wincoRule.setActive(true);
        wincoRule.setPriority(0);
        wincoRule.setUserId(1L);

        boolean result = transactionCSVCategorizerService.matches(winco_transaction,wincoRule);
        assertFalse(result);
    }


    private static Stream<Arguments> provideTransactionsWithUserRules() {
        Long userId = 100L;

        // Define multiple transaction rules with different priorities
        TransactionRule priority1AllFields = TransactionRule.builder()
                .id(1L)
                .userId(userId)
                .categoryName("Shopping")
                .merchantRule("WINCO")
                .descriptionRule("PIN Purchase")
                .extendedDescriptionRule("WINCO FOODS #15")
                .amountMin(10.0)
                .amountMax(100.0)
                .priority(1)
                .isActive(true)
                .build();

        TransactionRule priority2MerchantAmount = TransactionRule.builder()
                .id(2L)
                .userId(userId)
                .categoryName("Ordering Out")
                .merchantRule("Panda Express")
                .descriptionRule("")
                .extendedDescriptionRule("")
                .amountMin(0.0)
                .amountMax(11)
                .priority(2)
                .isActive(true)
                .build();

        TransactionRule priority3MerchantMinAmount = TransactionRule.builder()
                .id(3L)
                .userId(userId)
                .categoryName("Electronics")
                .merchantRule("Amazon")
                .descriptionRule("")
                .extendedDescriptionRule("")
                .amountMin(50.0)
                .amountMax(78.0)
                .priority(3)
                .isActive(true)
                .build();

        TransactionRule priority4MerchantDescription = TransactionRule.builder()
                .id(4L)
                .userId(userId)
                .categoryName("Gym")
                .merchantRule("PLANET FITNESS")
                .descriptionRule("Purchase")
                .extendedDescriptionRule("")
                .amountMin(0.0)
                .amountMax(25.0)
                .priority(4)
                .isActive(true)
                .build();

        TransactionRule priority5DescriptionMerchant = TransactionRule.builder()
                .id(5L)
                .userId(userId)
                .categoryName("Shopping")
                .merchantRule("AMAZON")
                .descriptionRule("PIN Purchase")
                .extendedDescriptionRule("")
                .amountMin(0.0)
                .amountMax(78.90)
                .priority(5)
                .isActive(true)
                .build();

        TransactionRule priority6MerchantOnly = TransactionRule.builder()
                .id(6L)
                .userId(userId)
                .categoryName("Shopping")
                .merchantRule("Smiths")
                .descriptionRule("")
                .extendedDescriptionRule("")
                .amountMin(0.0)
                .amountMax(0.0)
                .priority(6)
                .isActive(true)
                .build();

        TransactionRule priority6AnotherMerchant = TransactionRule.builder()
                .id(7L)
                .userId(userId)
                .categoryName("Streaming")
                .merchantRule("Spotify")
                .descriptionRule("")
                .extendedDescriptionRule("")
                .amountMin(0.0)
                .amountMax(10000.0)
                .priority(6)
                .isActive(true)
                .build();

        TransactionRule inactiveRule = TransactionRule.builder()
                .id(8L)
                .userId(userId)
                .categoryName("SHOULD_NOT_MATCH")
                .merchantRule("TARGET")
                .descriptionRule("")
                .extendedDescriptionRule("")
                .amountMin(0.0)
                .amountMax(10000.0)
                .priority(1)
                .isActive(false)
                .build();

        // All rules combined
        List<TransactionRule> allRules = List.of(
                priority1AllFields,
                priority2MerchantAmount,
                priority3MerchantMinAmount,
                priority4MerchantDescription,
                priority5DescriptionMerchant,
                priority6MerchantOnly,
                priority6AnotherMerchant,
                inactiveRule
        );

        return Stream.of(
                // Test Case 1: Priority 1 - All fields match
                Arguments.of(
                        userId,
                        allRules,
                        createTransactionWithDetails("WINCO FOODS", "PIN Purchase", "WINCO FOODS #15",
                                BigDecimal.valueOf(50.00), "1234567890", 1),
                        "Shopping",
                        "Priority 1: Should match when all fields (merchant, description, extended description, amount) match"
                ),

                // Test Case 2: Priority 2 - Merchant and amount match, but not all fields
                Arguments.of(
                        userId,
                        allRules,
                        createTransactionWithDetails("PANDA EXPRESS", "Purchase", "PANDA EXPRESS #3088",
                                BigDecimal.valueOf(9.22), "1234567890", 1),
                        "Ordering Out",
                        "Priority 2: Should match when merchant and amount match but description/extended description don't"
                ),

                // Test Case 3: Priority 3 - Merchant and min amount match
                Arguments.of(
                        userId,
                        allRules,
                        createTransactionWithDetails("AMAZON", "PIN Purchase", "AMAZON.COM*BT09 AMAZON.COM",
                                BigDecimal.valueOf(59.9), "1234567890", 1),
                        "Electronics",
                        "Priority 3: Should match when merchant and amount >= minAmount"
                ),

                // Test Case 4: Priority 4 - Merchant and description match
                Arguments.of(
                        userId,
                        allRules,
                        createTransactionWithDetails("PLANET FITNESS", "Purchase", "8069 PLANET FITNESS   SOUTH JORDAN UTUS",
                                BigDecimal.valueOf(17.69), "1234567890", 1),
                        "Gym",
                        "Priority 4: Should match when merchant and description match"
                ),

                // Test Case 5: Priority 5 - Description and merchant match
                Arguments.of(
                        userId,
                        allRules,
                        createTransactionWithDetails("AMAZON", "PIN Purchase", "AMAZON.COM*BT09 AMAZON.COM",
                                BigDecimal.valueOf(17.50), "1234567890", 1),
                        "Shopping",
                        "Priority 5: Should match when description and merchant match"
                ),

                // Test Case 6: Priority 6 - Merchant only match
                Arguments.of(
                        userId,
                        allRules,
                        createTransactionWithDetails("SMITHS", "PIN Purchase", "SMITHS #4276 5448 DAYBREAK PARK",
                                BigDecimal.valueOf(45.00), "1234567890", 1),
                        "Shopping",
                        "Priority 6: Should match when only merchant matches"
                ),

                // Test Case 7: Different Priority 6 merchant
                Arguments.of(
                        userId,
                        allRules,
                        createTransactionWithDetails("SPOTIFY", "Purchase", "SPOTIFY             877-778-1161",
                                BigDecimal.valueOf(125.50), "1234567890", 1),
                        "Streaming",
                        "Priority 6: Should match different merchant-only rule"
                ),

                // Test Case 8: No match - should return UNCATEGORIZED
                Arguments.of(
                        userId,
                        allRules,
                        createTransactionWithDetails("UNKNOWN MERCHANT", "UNKNOWN ITEM", "UNKNOWN",
                                BigDecimal.valueOf(25.00), "1234567890", 1),
                        "Uncategorized",
                        "No match: Should return UNCATEGORIZED when no rules match"
                ),

                // Test Case 9: Inactive rule should not match
                Arguments.of(
                        userId,
                        allRules,
                        createTransactionWithDetails("TARGET", "ANYTHING", "ANYTHING",
                                BigDecimal.valueOf(5.00), "1234567890", 1),
                        "Uncategorized",
                        "Inactive rule: Should skip inactive rule and match next priority"
                ),

                // Test Case 10: Priority precedence - higher priority should win
                Arguments.of(
                        userId,
                        allRules,
                        createTransactionWithDetails("AMAZON.COM", "Purchase", "AMAZON.COM",
                                BigDecimal.valueOf(59.99), "1234567890", 1),
                        "Electronics",
                        "Priority precedence: Priority 4 should match before Priority 5 or 6"
                ),

                // Test Case 11: Amount outside range - should not match priority 1
//                Arguments.of(
//                        userId,
//                        allRules,
//                        createTransactionWithDetails("TARGET", "GROCERY PURCHASE", "FOOD SECTION",
//                                BigDecimal.valueOf(150.00), "1234567890", 1),
//                        CategoryType.SHOPPING,
//                        "Amount out of range: Priority 1 fails, should fall back to Priority 2"
//                ),

                // Test Case 12: Empty user rules - should fall back to static rules
                Arguments.of(
                        userId,
                        List.of(),
                        createTransactionWithDetails("WINCO FOODS", "GROCERIES", "FOOD",
                                BigDecimal.valueOf(75.00), "1234567890", 1),
                        CategoryType.GROCERIES,
                        "Empty rules: Should use static merchant map when no user rules exist"
                )
        );
    }

    private static TransactionCSV createTransactionWithDetails(String merchantName, String description,
                                                               String extendedDescription, BigDecimal amount,
                                                               String account, int suffix) {
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName(merchantName);
        transaction.setDescription(description);
        transaction.setExtendedDescription(extendedDescription);
        transaction.setTransactionAmount(amount);
        transaction.setAccount(account);
        transaction.setSuffix(suffix);
        return transaction;
    }


    private static TransactionCSV createTransaction(String merchantName, BigDecimal amount, String description) {
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName(merchantName);
        transaction.setTransactionAmount(amount);
        transaction.setDescription(description);
        return transaction;
    }
    

    @AfterEach
    void tearDown() {
    }
}