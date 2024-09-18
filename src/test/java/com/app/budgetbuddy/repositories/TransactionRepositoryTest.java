package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.config.JpaConfig;
import com.app.budgetbuddy.domain.AccountSubType;
import com.app.budgetbuddy.domain.AccountType;
import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.entities.UserEntity;

import com.plaid.client.model.AccountSubtype;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace= AutoConfigureTestDatabase.Replace.NONE)
@Import(JpaConfig.class)
class TransactionRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private TransactionRepository transactionRepository;

    private TransactionsEntity transaction1;
    private TransactionsEntity transaction2;

    private CategoryEntity category1;
    private CategoryEntity category2;
    private AccountEntity account1;
    private AccountEntity account2;
    private UserEntity user;


    @BeforeEach
    void setUp() {
        // Create test user
        user = new UserEntity();
        user.setUsername("testUser");
        user.setPassword("testPassword");
        user.setEmail("test@test.com");
        user.setFirstName("first");
        user.setLastName("last");
        entityManager.persist(user);

        // Create test accounts
        account1 = new AccountEntity();
        account1.setId("ACC001");
        account1.setUser(user);
        account1.setAccountName("Checking Account");
        account1.setOfficialName("Test Checking Account");
        account1.setType(AccountType.DEPOSITORY);
        account1.setSubtype(AccountSubType.CHECKING);
        account1.setMask("1234");
        account1.setBalance(new BigDecimal("1000.00"));

        account2 = new AccountEntity();
        account2.setId("ACC002");
        account2.setUser(user);
        account2.setAccountName("Savings Account");
        account2.setOfficialName("Test Savings Account");
        account2.setType(AccountType.DEPOSITORY);
        account2.setSubtype(AccountSubType.SAVINGS);
        account2.setMask("5678");
        account2.setBalance(new BigDecimal("5000.00"));

        entityManager.persist(account1);
        entityManager.persist(account2);

        // Create test categories
        category1 = new CategoryEntity("e223232", "Food and household items", "Food and household items");
        category2 = new CategoryEntity("e55555","Entertainment","Entertainment");

        Set<CategoryEntity> categoriesSet1 = new HashSet<>();
        categoriesSet1.add(category1);

        Set<CategoryEntity> categoriesSet2 = new HashSet<>();
        categoriesSet2.add(category2);

        transaction1 = TransactionsEntity.builder()
                .account(account1)
                .id("TRX001")
                .amount(new BigDecimal("100.00"))
                .description("Test Transaction 1")
                .posted(LocalDate.now())
                .isoCurrencyCode("USD")
//                .categoryId("category1")
                .merchantName("Test Merchant 1")
                .pending(false)
                .authorizedDate(LocalDate.now().minusDays(1))
//                .categories(categoriesSet1)
                .build();

        transaction2 = TransactionsEntity.builder()
                .account(account2)
                .id("TRX002")
                .amount(new BigDecimal("200.00"))
                .description("Test Transaction 2")
                .posted(LocalDate.now().plusDays(1))
                .isoCurrencyCode("USD")
//                .categoryId("category2")
                .merchantName("Test Merchant 2")
                .pending(true)
                .authorizedDate(LocalDate.of(2024, 6, 29))
//                .categories(categoriesSet2)
                .build();
        entityManager.persist(transaction1);
        entityManager.persist(transaction2);
        entityManager.flush();
    }

    @Test
    void findByAmountBetween() {
        Collection<TransactionsEntity> transactions = transactionRepository.findByAmountBetween(
                new BigDecimal("50.00"), new BigDecimal("150.00"));
        assertThat(transactions).hasSize(1);
        assertThat(transactions).contains(transaction1);
    }

    @Test
    void findByPendingTrue(){
        Collection<TransactionsEntity> transactions = transactionRepository.findByPendingTrue();
        assertThat(transactions).hasSize(1);
        assertThat(transactions).contains(transaction2);
    }

    @Test
    void findByAuthorizedDate(){
        Collection<TransactionsEntity> transactions = transactionRepository.findByAuthorizedDate(LocalDate.of(2024, 6, 29));
        assertThat(transactions).hasSize(1);
        assertThat(transactions).contains(transaction2);
    }


    @Test
    void findTransactionByTransactionId() {
        Optional<TransactionsEntity> transaction = transactionRepository.findTransactionByTransactionId("TRX001");
        assertThat(transaction).isPresent();
        assertThat(transaction.get()).isEqualTo(transaction1);
    }

    @Test
    void findTransactionsByMerchant() {
        Collection<TransactionsEntity> transactions = transactionRepository.findTransactionsByMerchant("Test Merchant 1");
        assertThat(transactions).hasSize(1);
        assertThat(transactions).contains(transaction1);
    }

    @Test
    void sumAmountByDateRange() {
        BigDecimal sum = transactionRepository.sumAmountByDateRange(LocalDate.now().minusDays(1), LocalDate.now().plusDays(1));
        assertThat(sum).isEqualByComparingTo(new BigDecimal("300.00"));
    }

    @Test
    void sumAmountByCategoryAndDateRange() {
        BigDecimal sum = transactionRepository.sumAmountByCategoryAndDateRange(
                category1, LocalDate.now().minusDays(1), LocalDate.now().plusDays(1));
        assertThat(sum).isEqualByComparingTo(new BigDecimal("100.00"));
    }

    @Test
    void findAverageSpendingByCategoryAndDateRange() {
        BigDecimal avg = transactionRepository.findAverageSpendingByCategoryAndDateRange(
                category1, LocalDate.now().minusDays(1), LocalDate.now().plusDays(1));
        assertThat(avg).isEqualByComparingTo(new BigDecimal("100.00"));
    }


    @Test
    void getDailySpendingBreakdown() {
        List<Object[]> breakdown = transactionRepository.getDailySpendingBreakdown(LocalDate.now());
        assertThat(breakdown).hasSize(1);
        Object[] result = breakdown.get(0);
        assertThat(result[0]).isEqualTo(LocalDate.now());
        assertThat(result[1]).isEqualToComparingFieldByField(category1);
        assertThat((BigDecimal) result[2]).isEqualByComparingTo(new BigDecimal("100.00"));
    }

    @Test
    void getSpendingBreakdownOverDateRange() {
        List<Object[]> breakdown = transactionRepository.getSpendingBreakdownOverDateRange(
                LocalDate.now().minusDays(1), LocalDate.now().plusDays(1));
        assertThat(breakdown).hasSize(2);
        // Add more specific assertions based on your expected results
    }

    @Test
    void getSpendingCategoriesByPeriod() {
        List<Object[]> categories = transactionRepository.getSpendingCategoriesByPeriod(
                LocalDate.now().minusDays(1), LocalDate.now().plusDays(1));
        assertThat(categories).hasSize(2);
        // Add more specific assertions based on your expected results
    }

    @Test
    void getTotalSpendingByCategory() {
        BigDecimal total = transactionRepository.getTotalSpendingByCategory(category1);
        assertThat(total).isEqualByComparingTo(new BigDecimal("100.00"));
    }




    @AfterEach
    void tearDown() {
    }
}