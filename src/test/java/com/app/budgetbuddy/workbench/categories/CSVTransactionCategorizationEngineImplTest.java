package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.CSVAccountEntity;
import com.app.budgetbuddy.entities.SystemCategoryRulesEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.repositories.CSVAccountRepository;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.services.SystemCategoryRulesService;
import com.app.budgetbuddy.services.TransactionRuleService;
import com.app.budgetbuddy.services.UserCategoryService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CSVTransactionCategorizationEngineImplTest
{

    @Mock
    private CSVAccountRepository csvAccountRepository;

    @Mock
    private CategoryService categoryService;

    @Mock
    private UserCategoryService userCategoryService;

    @Mock
    private TransactionRuleService transactionRuleService;

    @Mock
    private SystemCategoryRulesService systemCategoryRulesService;

    private MACUCategorizationStrategy macuStrategy;
    private GenericCSVCategorizationStrategy genericStrategy;
    private CSVTransactionCategorizationEngine csvTransactionCategorizationEngine;

    @BeforeEach
    void setUp() {
        macuStrategy = new MACUCategorizationStrategy(systemCategoryRulesService, categoryService);
        genericStrategy = new GenericCSVCategorizationStrategy(systemCategoryRulesService, categoryService);
        List<CSVCategorizationStrategy> strategies = List.of(macuStrategy, genericStrategy);
        csvTransactionCategorizationEngine = new CSVTransactionCategorizationEngine(
                transactionRuleService,
                csvAccountRepository,
                categoryService,
                userCategoryService,
                systemCategoryRulesService,
                strategies
        );
    }

    @Test
    void testCategorize_whenTransactionCSVIsNull()
    {
        Category result = csvTransactionCategorizationEngine.categorize(null);
        assertEquals(Category.createUncategorized().getCategoryName(), result.getCategoryName());
    }

    // ===== GENERIC STRATEGY TESTS (non-MACU institution) =====

    @Test
    void testCategorize_whenTransactionCSV_hasWINCOTransaction_thenMatchGroceries()
    {
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName("WINCO FOODS");
        transaction.setTransactionAmount(BigDecimal.valueOf(75.00));
        transaction.setUserId(1L);

        SystemCategoryRulesEntity rule = buildMerchantRule("WINCO FOODS", null, null, "Groceries");

        when(transactionRuleService.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(systemCategoryRulesService.findByMerchantOnly("WINCO FOODS"))
                .thenReturn(Optional.of(rule));
        when(categoryService.getCategoryIdByName("Groceries")).thenReturn(1L);

        Category result = csvTransactionCategorizationEngine.categorize(transaction);

        assertEquals("Groceries", result.getCategoryName());
        assertEquals("SYSTEM", result.getCategorizedBy());
        assertEquals(1L, result.getCategoryId());
        assertNotNull(result.getCategorizedDate());
    }

    @Test
    void testCategorize_whenTransactionCSV_hasRentTransaction_thenMatchRent()
    {
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName("FLEX FINANCE");
        transaction.setTransactionAmount(BigDecimal.valueOf(707.0));
        transaction.setUserId(1L);

        SystemCategoryRulesEntity rule = buildMerchantRule("FLEX FINANCE", null, 707.0, "Rent");

        when(transactionRuleService.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(systemCategoryRulesService.findByMerchantAndAmount("FLEX FINANCE", 707.0))
                .thenReturn(Optional.of(rule));
        when(categoryService.getCategoryIdByName("Rent")).thenReturn(2L);

        Category result = csvTransactionCategorizationEngine.categorize(transaction);

        assertEquals("Rent", result.getCategoryName());
        assertEquals("SYSTEM", result.getCategorizedBy());
        assertEquals(2L, result.getCategoryId());
        assertNotNull(result.getCategorizedDate());
    }

    @Test
    void testCategorize_whenTransactionCSV_hasFLEXFinanceSubscription_thenMatchSubscription()
    {
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName("FLEX FINANCE");
        transaction.setTransactionAmount(BigDecimal.valueOf(14.99));
        transaction.setUserId(1L);

        SystemCategoryRulesEntity rule = buildMerchantRule("FLEX FINANCE", null, 14.99, "Subscription");

        when(transactionRuleService.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(systemCategoryRulesService.findByMerchantAndAmount("FLEX FINANCE", 14.99))
                .thenReturn(Optional.of(rule));
        when(categoryService.getCategoryIdByName("Subscription")).thenReturn(3L);

        Category result = csvTransactionCategorizationEngine.categorize(transaction);

        assertEquals("Subscription", result.getCategoryName());
        assertEquals("SYSTEM", result.getCategorizedBy());
        assertEquals(3L, result.getCategoryId());
        assertNotNull(result.getCategorizedDate());
    }

    @Test
    void testCategorize_whenFlexFinanceTransaction_withRentAmount_noUserRules_thenFallbackToSystemRules()
    {
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName("FLEX FINANCE");
        transaction.setTransactionAmount(new BigDecimal("-707.000"));
        transaction.setDescription("Purchase");
        transaction.setExtendedDescription("FLEX FINANCE           GETFLEX.COM  NYUS");
        transaction.setInstitution_id("Granite Credit Union");
        transaction.setTransactionDate(LocalDate.of(2026, 1, 27));
        transaction.setUserId(1L);

        SystemCategoryRulesEntity rule = buildMerchantRule("FLEX FINANCE", null, 707.0, "Rent");

        when(transactionRuleService.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(systemCategoryRulesService.findByMerchantAndAmount("FLEX FINANCE", 707.0))
                .thenReturn(Optional.of(rule));
        when(categoryService.getCategoryIdByName("Rent")).thenReturn(2L);

        Category result = csvTransactionCategorizationEngine.categorize(transaction);

        assertEquals("Rent", result.getCategoryName());
        assertEquals("SYSTEM", result.getCategorizedBy());
        assertNotNull(result.getCategorizedDate());
    }

    // ===== MACU STRATEGY TESTS =====

    @Test
    void testCategorize_whenWinCoFoodsTransaction_withGroceriesCategory_thenReturnGroceries()
    {
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName("WinCo Foods");
        transaction.setTransactionAmount(new BigDecimal("-85.50"));
        transaction.setInstitution_id("Mountain America Credit Union");
        transaction.setCategory("Groceries");
        transaction.setUserId(1L);

        SystemCategoryRulesEntity rule = buildMerchantRule("WINCO FOODS", "Groceries", null, "Groceries");

        when(transactionRuleService.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(systemCategoryRulesService.findByMerchantCategoryAndAmount("WINCO FOODS", "Groceries", 85.50))
                .thenReturn(Optional.empty());
        when(systemCategoryRulesService.findByMerchantAndCategory("WINCO FOODS", "Groceries"))
                .thenReturn(Optional.of(rule));
        when(categoryService.getCategoryIdByName("Groceries")).thenReturn(1L);

        Category result = csvTransactionCategorizationEngine.categorize(transaction);

        assertEquals("Groceries", result.getCategoryName());
        assertEquals("SYSTEM", result.getCategorizedBy());
        assertNotNull(result.getCategorizedDate());
    }

    @Test
    void testCategorize_whenSmithsTransaction_withGroceriesCategory_thenReturnGroceries()
    {
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName("Smiths");
        transaction.setTransactionAmount(new BigDecimal("-62.30"));
        transaction.setCategory("Groceries");
        transaction.setInstitution_id("Mountain America Credit Union");
        transaction.setUserId(1L);

        SystemCategoryRulesEntity rule = buildMerchantRule("SMITHS", "Groceries", null, "Groceries");

        when(transactionRuleService.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(systemCategoryRulesService.findByMerchantCategoryAndAmount("SMITHS", "Groceries", 62.30))
                .thenReturn(Optional.empty());
        when(systemCategoryRulesService.findByMerchantAndCategory("SMITHS", "Groceries"))
                .thenReturn(Optional.of(rule));
        when(categoryService.getCategoryIdByName("Groceries")).thenReturn(1L);

        Category result = csvTransactionCategorizationEngine.categorize(transaction);

        assertEquals("Groceries", result.getCategoryName());
        assertEquals("SYSTEM", result.getCategorizedBy());
        assertNotNull(result.getCategorizedDate());
    }

    @Test
    void testCategorize_whenWithdrawalTransaction_withATMCategory_thenReturnWithdrawal()
    {
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName("Withdrawal");
        transaction.setTransactionAmount(new BigDecimal("-200.00"));
        transaction.setCategory("ATM/Cash Withdrawals");
        transaction.setInstitution_id("Mountain America Credit Union");
        transaction.setUserId(1L);

        SystemCategoryRulesEntity rule = buildMerchantRule("WITHDRAWAL", "ATM/Cash Withdrawals", null, "Withdrawal");

        when(transactionRuleService.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(systemCategoryRulesService.findByMerchantCategoryAndAmount("WITHDRAWAL", "ATM/Cash Withdrawals", 200.0))
                .thenReturn(Optional.empty());
        when(systemCategoryRulesService.findByMerchantAndCategory("WITHDRAWAL", "ATM/Cash Withdrawals"))
                .thenReturn(Optional.of(rule));
        when(categoryService.getCategoryIdByName("Withdrawal")).thenReturn(5L);

        Category result = csvTransactionCategorizationEngine.categorize(transaction);

        assertEquals("Withdrawal", result.getCategoryName());
        assertEquals("SYSTEM", result.getCategorizedBy());
        assertNotNull(result.getCategorizedDate());
    }

    @Test
    void testCategorize_whenConserviceTransaction_withUtilitiesCategory_thenReturnUtilities()
    {
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName("Payment to Conservice");
        transaction.setTransactionAmount(new BigDecimal("-150.00"));
        transaction.setCategory("Utilities");
        transaction.setInstitution_id("Mountain America Credit Union");
        transaction.setUserId(1L);

        SystemCategoryRulesEntity rule = buildMerchantRule("PAYMENT TO CONSERVICE", "Utilities", null, "Utilities");

        when(transactionRuleService.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(systemCategoryRulesService.findByMerchantCategoryAndAmount("PAYMENT TO CONSERVICE", "Utilities", 150.0))
                .thenReturn(Optional.empty());
        when(systemCategoryRulesService.findByMerchantAndCategory("PAYMENT TO CONSERVICE", "Utilities"))
                .thenReturn(Optional.of(rule));
        when(categoryService.getCategoryIdByName("Utilities")).thenReturn(6L);

        Category result = csvTransactionCategorizationEngine.categorize(transaction);

        assertEquals("Utilities", result.getCategoryName());
        assertEquals("SYSTEM", result.getCategorizedBy());
        assertNotNull(result.getCategorizedDate());
    }

    @Test
    void testCategorize_whenPandaExpressTransaction_withDiningCategory_thenReturnOrderOut()
    {
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName("Panda Express");
        transaction.setTransactionAmount(new BigDecimal("-18.75"));
        transaction.setCategory("Restaurants & Dining");
        transaction.setInstitution_id("Mountain America Credit Union");
        transaction.setUserId(1L);

        SystemCategoryRulesEntity rule = buildMerchantRule("PANDA EXPRESS", "Restaurants & Dining", null, "Order Out");

        when(transactionRuleService.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(systemCategoryRulesService.findByMerchantCategoryAndAmount("PANDA EXPRESS", "Restaurants & Dining", 18.75))
                .thenReturn(Optional.empty());
        when(systemCategoryRulesService.findByMerchantAndCategory("PANDA EXPRESS", "Restaurants & Dining"))
                .thenReturn(Optional.of(rule));
        when(categoryService.getCategoryIdByName("Order Out")).thenReturn(7L);

        Category result = csvTransactionCategorizationEngine.categorize(transaction);

        assertEquals("Order Out", result.getCategoryName());
        assertEquals("SYSTEM", result.getCategorizedBy());
        assertNotNull(result.getCategorizedDate());
    }

    @Test
    void testCategorize_whenAffirmTransaction_withLoanPaymentsCategory_thenReturnPayment()
    {
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName("Payment to Affirm.com");
        transaction.setTransactionAmount(new BigDecimal("-75.00"));
        transaction.setCategory("Loan Payments");
        transaction.setInstitution_id("Mountain America Credit Union");
        transaction.setUserId(1L);

        SystemCategoryRulesEntity rule = buildMerchantRule("PAYMENT TO AFFIRM.COM", "Loan Payments", null, "Payment");

        when(transactionRuleService.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(systemCategoryRulesService.findByMerchantCategoryAndAmount("PAYMENT TO AFFIRM.COM", "Loan Payments", 75.0))
                .thenReturn(Optional.empty());
        when(systemCategoryRulesService.findByMerchantAndCategory("PAYMENT TO AFFIRM.COM", "Loan Payments"))
                .thenReturn(Optional.of(rule));
        when(categoryService.getCategoryIdByName("Payment")).thenReturn(8L);

        Category result = csvTransactionCategorizationEngine.categorize(transaction);

        assertEquals("Payment", result.getCategoryName());
        assertEquals("SYSTEM", result.getCategorizedBy());
        assertNotNull(result.getCategorizedDate());
    }

    @Test
    void testCategorize_whenMaverikTransaction_withGasolineCategory_thenReturnGas()
    {
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName("Maverik");
        transaction.setTransactionAmount(new BigDecimal("-55.00"));
        transaction.setCategory("Gasoline/Fuel");
        transaction.setInstitution_id("Mountain America Credit Union");
        transaction.setUserId(1L);

        SystemCategoryRulesEntity rule = buildMerchantRule("MAVERIK", "Gasoline/Fuel", null, "Gas");

        when(transactionRuleService.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(systemCategoryRulesService.findByMerchantCategoryAndAmount("MAVERIK", "Gasoline/Fuel", 55.0))
                .thenReturn(Optional.empty());
        when(systemCategoryRulesService.findByMerchantAndCategory("MAVERIK", "Gasoline/Fuel"))
                .thenReturn(Optional.of(rule));
        when(categoryService.getCategoryIdByName("Gas")).thenReturn(9L);

        Category result = csvTransactionCategorizationEngine.categorize(transaction);

        assertEquals("Gas", result.getCategoryName());
        assertEquals("SYSTEM", result.getCategorizedBy());
        assertNotNull(result.getCategorizedDate());
    }

    @Test
    void testCategorize_whenFlexFinanceTransaction_withRent707Amount_thenReturnRent()
    {
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName("FLEX FINANCE");
        transaction.setTransactionAmount(new BigDecimal("-707.00"));
        transaction.setCategory("Online Services");
        transaction.setInstitution_id("Mountain America Credit Union");
        transaction.setUserId(1L);

        SystemCategoryRulesEntity rule = buildMerchantRule("FLEX FINANCE", "Online Services", 707.0, "Rent");

        when(transactionRuleService.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(systemCategoryRulesService.findByMerchantCategoryAndAmount("FLEX FINANCE", "Online Services", 707.0))
                .thenReturn(Optional.of(rule));
        when(categoryService.getCategoryIdByName("Rent")).thenReturn(2L);

        Category result = csvTransactionCategorizationEngine.categorize(transaction);

        assertEquals("Rent", result.getCategoryName());
        assertEquals("SYSTEM", result.getCategorizedBy());
        assertNotNull(result.getCategorizedDate());
    }

    @Test
    void testCategorize_whenFlexFinanceTransaction_withSubscription1499Amount_thenReturnSubscription()
    {
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName("Flex Finance");
        transaction.setTransactionAmount(new BigDecimal("-14.99"));
        transaction.setCategory("Online Services");
        transaction.setInstitution_id("Mountain America Credit Union");
        transaction.setUserId(1L);

        SystemCategoryRulesEntity rule = buildMerchantRule("FLEX FINANCE", "Online Services", 14.99, "Subscription");

        when(transactionRuleService.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(systemCategoryRulesService.findByMerchantCategoryAndAmount("FLEX FINANCE", "Online Services", 14.99))
                .thenReturn(Optional.of(rule));
        when(categoryService.getCategoryIdByName("Subscription")).thenReturn(3L);

        Category result = csvTransactionCategorizationEngine.categorize(transaction);

        assertEquals("Subscription", result.getCategoryName());
        assertEquals("SYSTEM", result.getCategorizedBy());
        assertNotNull(result.getCategorizedDate());
    }

    @Test
    void testCategorize_whenSpotifyTransaction_withEntertainmentCategory_thenReturnSubscription()
    {
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName("Spotify");
        transaction.setTransactionAmount(new BigDecimal("-9.99"));
        transaction.setCategory("Entertainment");
        transaction.setInstitution_id("Mountain America Credit Union");
        transaction.setUserId(1L);

        SystemCategoryRulesEntity rule = buildMerchantRule("SPOTIFY", "Entertainment", null, "Subscription");

        when(transactionRuleService.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(systemCategoryRulesService.findByMerchantCategoryAndAmount("SPOTIFY", "Entertainment", 9.99))
                .thenReturn(Optional.empty());
        when(systemCategoryRulesService.findByMerchantAndCategory("SPOTIFY", "Entertainment"))
                .thenReturn(Optional.of(rule));
        when(categoryService.getCategoryIdByName("Subscription")).thenReturn(3L);

        Category result = csvTransactionCategorizationEngine.categorize(transaction);

        assertEquals("Subscription", result.getCategoryName());
        assertEquals("SYSTEM", result.getCategorizedBy());
        assertNotNull(result.getCategorizedDate());
    }

    // ===== USER RULE TESTS (unchanged logic, just updated construction) =====

    @Test
    void testCategorize_withUserTransactionRule_thenReturnCategory()
    {
        Long userId = 1L;
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName("WINCO FOODS");
        transaction.setTransactionAmount(BigDecimal.valueOf(40.310));
        transaction.setTransactionDate(LocalDate.of(2025, 10, 3));
        transaction.setDescription("PIN Purchase");
        transaction.setExtendedDescription("WINCO FOODS #15");
        transaction.setSuffix(9);
        transaction.setAccount("002285914");
        transaction.setUserId(userId);

        TransactionRule rule = new TransactionRule();
        rule.setMerchantRule("WINCO FOODS");
        rule.setDescriptionRule("PIN Purchase");
        rule.setExtendedDescriptionRule("WINCO FOODS #15");
        rule.setUserId(userId);
        rule.setActive(true);
        rule.setCategoryName("Shopping");
        rule.setPriority(1);
        rule.setAmountMin(10);
        rule.setAmountMax(80);

        when(transactionRuleService.findByUserId(anyLong())).thenReturn(List.of(rule));
        when(userCategoryService.getCategoryIdByNameAndUser(anyString(), anyLong())).thenReturn(1L);

        Category result = csvTransactionCategorizationEngine.categorize(transaction);

        assertEquals("Shopping", result.getCategoryName());
        assertEquals("USER", result.getCategorizedBy());
        assertEquals(1L, result.getCategoryId());
        assertNotNull(result.getCategorizedDate());
    }

    @Test
    void testCategorize_withUserTransactionRule_MerchantNameShorter_thenReturnCategory()
    {
        Long userId = 1L;
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName("WINCO FOODS");
        transaction.setTransactionAmount(BigDecimal.valueOf(40.310));
        transaction.setTransactionDate(LocalDate.of(2025, 10, 3));
        transaction.setDescription("PIN Purchase");
        transaction.setExtendedDescription("WINCO FOODS #15");
        transaction.setSuffix(9);
        transaction.setAccount("002285914");
        transaction.setUserId(userId);

        TransactionRule rule = new TransactionRule();
        rule.setMerchantRule("WINCO");
        rule.setCategoryName("Shopping");
        rule.setActive(true);
        rule.setPriority(6);

        when(transactionRuleService.findByUserId(anyLong())).thenReturn(List.of(rule));
        when(userCategoryService.getCategoryIdByNameAndUser(anyString(), anyLong())).thenReturn(1L);

        Category result = csvTransactionCategorizationEngine.categorize(transaction);

        assertEquals("Shopping", result.getCategoryName());
        assertEquals("USER", result.getCategorizedBy());
        assertEquals(1L, result.getCategoryId());
        assertNotNull(result.getCategorizedDate());
    }

    @Test
    void testCategorize_whenFlexFinanceTransaction_withPurchaseDescription_andRentAmount_thenReturnRent()
    {
        Long userId = 1L;
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName("Flexible Finance");
        transaction.setTransactionAmount(new BigDecimal("-1220.030"));
        transaction.setDescription("Purchase");
        transaction.setExtendedDescription("Flexible Finance  Inc. New York     NYUS");
        transaction.setTransactionDate(LocalDate.of(2026, 2, 2));
        transaction.setUserId(userId);

        TransactionRule rentRule = new TransactionRule();
        rentRule.setMerchantRule("Flexible Finance");
        rentRule.setDescriptionRule("Purchase");
        rentRule.setAmountMin(-1221.000);
        rentRule.setAmountMax(-1200.000);
        rentRule.setCategoryName("Rent");
        rentRule.setActive(true);
        rentRule.setPriority(1);

        when(transactionRuleService.findByUserId(userId)).thenReturn(List.of(rentRule));
        when(userCategoryService.getCategoryIdByNameAndUser("Rent", userId)).thenReturn(1L);

        Category result = csvTransactionCategorizationEngine.categorize(transaction);

        assertEquals("Rent", result.getCategoryName());
        assertEquals("USER", result.getCategorizedBy());
        assertNotNull(result.getCategorizedDate());
    }

    @Test
    void testCategorize_whenFlexFinanceTransaction_withNoDescription_andRentAmountRange_thenReturnRent()
    {
        Long userId = 1L;
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName("Flexible Finance");
        transaction.setTransactionAmount(new BigDecimal("-1220.030"));
        transaction.setDescription("");
        transaction.setExtendedDescription("Flexible Finance  Inc. New York     NYUS");
        transaction.setTransactionDate(LocalDate.of(2026, 2, 2));
        transaction.setUserId(userId);

        TransactionRule rentRule = new TransactionRule();
        rentRule.setMerchantRule("Flexible Finance");
        rentRule.setDescriptionRule("");
        rentRule.setAmountMin(-1342.033);
        rentRule.setAmountMax(-1098.027);
        rentRule.setCategoryName("Rent");
        rentRule.setActive(true);
        rentRule.setPriority(1);

        when(transactionRuleService.findByUserId(userId)).thenReturn(List.of(rentRule));
        when(userCategoryService.getCategoryIdByNameAndUser("Rent", userId)).thenReturn(1L);

        Category result = csvTransactionCategorizationEngine.categorize(transaction);

        assertEquals("Rent", result.getCategoryName());
        assertEquals("USER", result.getCategorizedBy());
        assertNotNull(result.getCategorizedDate());
    }

    @Test
    void testCategorize_whenFlexFinanceTransaction_withSubscriptionAmount_thenReturnSubscription()
    {
        Long userId = 1L;
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName("Flexible Finance");
        transaction.setTransactionAmount(new BigDecimal("-14.990"));
        transaction.setDescription("Purchase");
        transaction.setExtendedDescription("Flexible Finance  Inc. New York     NYUS");
        transaction.setTransactionDate(LocalDate.of(2026, 1, 15));
        transaction.setUserId(userId);

        TransactionRule subscriptionRule = new TransactionRule();
        subscriptionRule.setMerchantRule("Flexible Finance");
        subscriptionRule.setDescriptionRule("");
        subscriptionRule.setAmountMin(-16.489);
        subscriptionRule.setAmountMax(-13.491);
        subscriptionRule.setCategoryName("Subscription");
        subscriptionRule.setActive(true);
        subscriptionRule.setPriority(1);

        when(transactionRuleService.findByUserId(userId)).thenReturn(List.of(subscriptionRule));
        when(userCategoryService.getCategoryIdByNameAndUser("Subscription", userId)).thenReturn(23L);

        Category result = csvTransactionCategorizationEngine.categorize(transaction);

        assertEquals("Subscription", result.getCategoryName());
        assertEquals("USER", result.getCategorizedBy());
        assertNotNull(result.getCategorizedDate());
    }

    // ===== MATCHES TESTS (unchanged - these test pure logic, no maps involved) =====

    @Test
    void testMatches_whenTransactionIsNull_thenReturnFalse()
    {
        TransactionRule rule = TransactionRule.builder()
                .id(1L).userId(1L).categoryName("Shopping")
                .merchantRule("WINCO").descriptionRule("PIN Purchase")
                .extendedDescriptionRule("WINCO FOODS #15")
                .amountMin(10.0).amountMax(100.0).priority(1).isActive(true)
                .build();
        assertFalse(csvTransactionCategorizationEngine.matches(null, rule));
    }

    @Test
    void testMatches_whenTransactionRuleIsNull_thenReturnFalse()
    {
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName("WINCO FOODS");
        transaction.setTransactionAmount(BigDecimal.valueOf(40.310));
        assertFalse(csvTransactionCategorizationEngine.matches(transaction, null));
    }

    @Test
    void testMatches_whenAllRulesMatch_thenReturnTrue()
    {
        TransactionCSV transaction = buildWincoTransaction();
        TransactionRule rule = new TransactionRule();
        rule.setMerchantRule("WINCO");
        rule.setDescriptionRule("PIN Purchase");
        rule.setActive(true);
        rule.setPriority(1);
        rule.setCategoryName("Shopping");
        rule.setExtendedDescriptionRule("WINCO FOODS #15");
        rule.setUserId(1L);
        rule.setAmountMin(10.0);
        rule.setAmountMax(100.0);
        assertTrue(csvTransactionCategorizationEngine.matches(transaction, rule));
    }

    @Test
    void testMatches_whenMerchantRuleAndAmountMatch_thenReturnTrue()
    {
        TransactionCSV transaction = buildWincoTransaction();
        TransactionRule rule = new TransactionRule();
        rule.setMerchantRule("WINCO");
        rule.setAmountMin(10.0);
        rule.setAmountMax(100.0);
        rule.setCategoryName("Shopping");
        rule.setActive(true);
        rule.setPriority(2);
        assertTrue(csvTransactionCategorizationEngine.matches(transaction, rule));
    }

    @Test
    void testMatches_whenMerchantRuleAndMinAmountMatch_thenReturnTrue()
    {
        TransactionCSV transaction = buildWincoTransaction();
        TransactionRule rule = new TransactionRule();
        rule.setMerchantRule("WINCO");
        rule.setAmountMin(10.0);
        rule.setCategoryName("Shopping");
        rule.setActive(true);
        rule.setPriority(3);
        assertTrue(csvTransactionCategorizationEngine.matches(transaction, rule));
    }

    @Test
    void testMatches_whenMerchantRuleAndMaxAmountMatch_thenReturnTrue()
    {
        TransactionCSV transaction = buildWincoTransaction();
        TransactionRule rule = new TransactionRule();
        rule.setMerchantRule("WINCO");
        rule.setCategoryName("Shopping");
        rule.setAmountMax(80.0);
        rule.setActive(true);
        rule.setPriority(4);
        assertTrue(csvTransactionCategorizationEngine.matches(transaction, rule));
    }

    @Test
    void testMatches_whenDescriptionRuleAndMerchantRuleMatch_thenReturnTrue()
    {
        TransactionCSV transaction = buildWincoTransaction();
        TransactionRule rule = new TransactionRule();
        rule.setMerchantRule("WINCO");
        rule.setCategoryName("Shopping");
        rule.setDescriptionRule("PIN Purchase");
        rule.setActive(true);
        rule.setPriority(5);
        assertTrue(csvTransactionCategorizationEngine.matches(transaction, rule));
    }

    @Test
    void testMatches_whenMerchantRuleMatch_thenReturnTrue()
    {
        TransactionCSV transaction = buildWincoTransaction();
        TransactionRule rule = new TransactionRule();
        rule.setMerchantRule("WINCO");
        rule.setCategoryName("Shopping");
        rule.setActive(true);
        rule.setPriority(6);
        assertTrue(csvTransactionCategorizationEngine.matches(transaction, rule));
    }

    @Test
    void testMatches_whenAllRulesEmpty_thenReturnFalse()
    {
        TransactionCSV transaction = buildWincoTransaction();
        TransactionRule rule = new TransactionRule();
        rule.setMerchantRule("");
        rule.setCategoryName("Shopping");
        rule.setDescriptionRule("");
        rule.setAmountMax(0.0);
        rule.setAmountMin(0.0);
        rule.setActive(true);
        rule.setPriority(0);
        assertFalse(csvTransactionCategorizationEngine.matches(transaction, rule));
    }

    // ===== PARAMETERIZED USER RULES TEST =====

    @ParameterizedTest
    @MethodSource("provideTransactionsWithUserRules")
    @DisplayName("Categorize Transactions with multiple user transaction rules")
    void testCategorize_withMultipleUserTransactionRules(Long userId,
                                                         List<TransactionRule> transactionRules,
                                                         TransactionCSV transactionCSV,
                                                         String expectedCategory)
    {
        when(transactionRuleService.findByUserId(userId)).thenReturn(transactionRules);
        if(!"Uncategorized".equals(expectedCategory))
        {
            when(userCategoryService.getCategoryIdByNameAndUser(eq(expectedCategory), eq(userId)))
                    .thenReturn(1L);
        }

        Category result = csvTransactionCategorizationEngine.categorize(transactionCSV);
        assertEquals(expectedCategory, result.getCategoryName());
    }

    // ===== HELPERS =====

    private TransactionCSV buildWincoTransaction()
    {
        TransactionCSV t = new TransactionCSV();
        t.setMerchantName("WINCO FOODS");
        t.setTransactionAmount(BigDecimal.valueOf(40.310));
        t.setTransactionDate(LocalDate.of(2025, 10, 3));
        t.setDescription("PIN Purchase");
        t.setExtendedDescription("WINCO FOODS #15");
        t.setSuffix(9);
        t.setAccount("002285914");
        return t;
    }

    private SystemCategoryRulesEntity buildMerchantRule(String merchant, String category,
                                                        Double amount, String matchedCategory)
    {
        SystemCategoryRulesEntity rule = new SystemCategoryRulesEntity();
        rule.setMerchant(merchant);
        rule.setCategory(category);
        rule.setAmount(amount);
        rule.setMatchedCategory(matchedCategory);
        return rule;
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

    // Testing min and max amounts
    @Test
    void testMatches_whenMerchantRuleMatches_andAmountAtMinBoundary_thenReturnTrue(){
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName("WINCO FOODS");
        transaction.setTransactionAmount(BigDecimal.valueOf(10.00)); // exactly at min
        transaction.setDescription("PIN Purchase");
        transaction.setExtendedDescription("WINCO FOODS #15");

        TransactionRule rule = new TransactionRule();
        rule.setMerchantRule("WINCO");
        rule.setAmountMin(10.0);
        rule.setAmountMax(100.0);
        rule.setCategoryName("Shopping");
        rule.setActive(true);
        rule.setPriority(2);

        boolean result = csvTransactionCategorizationEngine.matches(transaction, rule);
        assertTrue(result);
    }

    @Test
    void testMatches_whenMerchantRuleMatches_andAmountAtMaxBoundary_thenReturnTrue(){
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName("WINCO FOODS");
        transaction.setTransactionAmount(BigDecimal.valueOf(100.00)); // exactly at max
        transaction.setDescription("PIN Purchase");
        transaction.setExtendedDescription("WINCO FOODS #15");

        TransactionRule rule = new TransactionRule();
        rule.setMerchantRule("WINCO");
        rule.setAmountMin(10.0);
        rule.setAmountMax(100.0);
        rule.setCategoryName("Shopping");
        rule.setActive(true);
        rule.setPriority(2);

        boolean result = csvTransactionCategorizationEngine.matches(transaction, rule);
        assertTrue(result);
    }

    @Test
    void testMatches_whenMerchantRuleMatches_andAmountBelowMin_thenReturnFalse(){
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName("WINCO FOODS");
        transaction.setTransactionAmount(BigDecimal.valueOf(5.00)); // below min
        transaction.setDescription("PIN Purchase");
        transaction.setExtendedDescription("WINCO FOODS #15");

        TransactionRule rule = new TransactionRule();
        rule.setMerchantRule("WINCO");
        rule.setAmountMin(10.0);
        rule.setAmountMax(100.0);
        rule.setCategoryName("Shopping");
        rule.setActive(true);
        rule.setPriority(2);

        boolean result = csvTransactionCategorizationEngine.matches(transaction, rule);
        assertFalse(result);
    }

    @Test
    void testMatches_whenMerchantRuleMatches_andAmountAboveMax_thenReturnFalse(){
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName("WINCO FOODS");
        transaction.setTransactionAmount(BigDecimal.valueOf(200.00)); // above max
        transaction.setDescription("PIN Purchase");
        transaction.setExtendedDescription("WINCO FOODS #15");

        TransactionRule rule = new TransactionRule();
        rule.setMerchantRule("WINCO");
        rule.setAmountMin(10.0);
        rule.setAmountMax(100.0);
        rule.setCategoryName("Shopping");
        rule.setActive(true);
        rule.setPriority(2);

        boolean result = csvTransactionCategorizationEngine.matches(transaction, rule);
        assertFalse(result);
    }

    @Test
    void testMatches_whenMerchantRuleDoesNotMatch_andAmountWithinRange_thenReturnFalse(){
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName("PANDA EXPRESS"); // merchant won't match "WINCO"
        transaction.setTransactionAmount(BigDecimal.valueOf(50.00));
        transaction.setDescription("PIN Purchase");
        transaction.setExtendedDescription("PANDA EXPRESS #123");

        TransactionRule rule = new TransactionRule();
        rule.setMerchantRule("WINCO");
        rule.setAmountMin(10.0);
        rule.setAmountMax(100.0);
        rule.setCategoryName("Shopping");
        rule.setActive(true);
        rule.setPriority(2);

        boolean result = csvTransactionCategorizationEngine.matches(transaction, rule);
        assertFalse(result);
    }

    // Priority 3: Merchant + min amount only
    @Test
    void testMatches_whenMerchantRuleMatches_andAmountExceedsMin_thenReturnTrue(){
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName("WINCO FOODS");
        transaction.setTransactionAmount(BigDecimal.valueOf(999.99)); // way above min, no max constraint
        transaction.setDescription("PIN Purchase");

        TransactionRule rule = new TransactionRule();
        rule.setMerchantRule("WINCO");
        rule.setAmountMin(10.0);
        rule.setCategoryName("Shopping");
        rule.setActive(true);
        rule.setPriority(3);

        boolean result = csvTransactionCategorizationEngine.matches(transaction, rule);
        assertTrue(result);
    }

    @Test
    void testMatches_whenMerchantRuleMatches_andAmountBelowMinOnly_thenReturnFalse(){
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName("WINCO FOODS");
        transaction.setTransactionAmount(BigDecimal.valueOf(5.00)); // below min
        transaction.setDescription("PIN Purchase");

        TransactionRule rule = new TransactionRule();
        rule.setMerchantRule("WINCO");
        rule.setAmountMin(10.0);
        rule.setCategoryName("Shopping");
        rule.setActive(true);
        rule.setPriority(3);

        boolean result = csvTransactionCategorizationEngine.matches(transaction, rule);
        assertFalse(result);
    }

    @Test
    void testMatches_whenMerchantRuleDoesNotMatch_andAmountExceedsMin_thenReturnFalse(){
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName("PANDA EXPRESS");
        transaction.setTransactionAmount(BigDecimal.valueOf(50.00));
        transaction.setDescription("PIN Purchase");

        TransactionRule rule = new TransactionRule();
        rule.setMerchantRule("WINCO");
        rule.setAmountMin(10.0);
        rule.setCategoryName("Shopping");
        rule.setActive(true);
        rule.setPriority(3);

        boolean result = csvTransactionCategorizationEngine.matches(transaction, rule);
        assertFalse(result);
    }

    // Priority 4: Merchant + max amount only
    @Test
    void testMatches_whenMerchantRuleMatches_andAmountBelowMax_thenReturnTrue(){
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName("WINCO FOODS");
        transaction.setTransactionAmount(BigDecimal.valueOf(0.01)); // well below max, no min constraint
        transaction.setDescription("PIN Purchase");

        TransactionRule rule = new TransactionRule();
        rule.setMerchantRule("WINCO");
        rule.setAmountMax(80.0);
        rule.setCategoryName("Shopping");
        rule.setActive(true);
        rule.setPriority(4);

        boolean result = csvTransactionCategorizationEngine.matches(transaction, rule);
        assertTrue(result);
    }

    @Test
    void testMatches_whenMerchantRuleMatches_andAmountExceedsMax_thenReturnFalse(){
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName("WINCO FOODS");
        transaction.setTransactionAmount(BigDecimal.valueOf(100.00)); // above max
        transaction.setDescription("PIN Purchase");

        TransactionRule rule = new TransactionRule();
        rule.setMerchantRule("WINCO");
        rule.setAmountMax(80.0);
        rule.setCategoryName("Shopping");
        rule.setActive(true);
        rule.setPriority(4);

        boolean result = csvTransactionCategorizationEngine.matches(transaction, rule);
        assertFalse(result);
    }

    @Test
    void testMatches_whenMerchantRuleDoesNotMatch_andAmountBelowMax_thenReturnFalse(){
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName("PANDA EXPRESS");
        transaction.setTransactionAmount(BigDecimal.valueOf(50.00));
        transaction.setDescription("PIN Purchase");

        TransactionRule rule = new TransactionRule();
        rule.setMerchantRule("WINCO");
        rule.setAmountMax(80.0);
        rule.setCategoryName("Shopping");
        rule.setActive(true);
        rule.setPriority(4);

        boolean result = csvTransactionCategorizationEngine.matches(transaction, rule);
        assertFalse(result);
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