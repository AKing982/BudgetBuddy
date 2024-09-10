package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.config.JpaConfig;
import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.plaid.client.model.AccountSubtype;
import com.plaid.client.model.AccountType;
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
import java.util.Collection;

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

    private Category category1;
    private Category category2;
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
        account1.setAccountReferenceNumber("ACC001");
        account1.setUser(user);
        account1.setAccountName("Checking Account");
        account1.setOfficialName("Test Checking Account");
        account1.setType(AccountType.DEPOSITORY);
        account1.setSubtype(AccountSubtype.CHECKING);
        account1.setMask("1234");
        account1.setBalance(new BigDecimal("1000.00"));

        account2 = new AccountEntity();
        account2.setAccountReferenceNumber("ACC002");
        account2.setUser(user);
        account2.setAccountName("Savings Account");
        account2.setOfficialName("Test Savings Account");
        account2.setType(AccountType.DEPOSITORY);
        account2.setSubtype(AccountSubtype.SAVINGS);
        account2.setMask("5678");
        account2.setBalance(new BigDecimal("5000.00"));

        entityManager.persist(account1);
        entityManager.persist(account2);

        // Create test categories
        category1 = new Category("Groceries", "Food and household items");
        category2 = new Category("Entertainment", "Movies, games, etc.");

        transaction1 = TransactionsEntity.builder()
                .account(account1)
                .transactionReferenceNumber("TRX001")
                .amount(new BigDecimal("100.00"))
                .description("Test Transaction 1")
                .posted(LocalDate.now())
                .isoCurrencyCode("USD")
                .categoryId("category1")
                .merchantName("Test Merchant 1")
                .pending(false)
                .authorizedDate(LocalDate.now().minusDays(1))
//                .category(new Category("Groceries", "Food and household items"))
                .build();

        transaction2 = TransactionsEntity.builder()
                .account(account2)
                .transactionReferenceNumber("TRX002")
                .amount(new BigDecimal("200.00"))
                .description("Test Transaction 2")
                .posted(LocalDate.now().plusDays(1))
                .isoCurrencyCode("USD")
                .categoryId("category2")
                .merchantName("Test Merchant 2")
                .pending(true)
                .authorizedDate(LocalDate.now())
//                .category(new Category("Entertainment", "Movies, games, etc."))
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



    @AfterEach
    void tearDown() {
    }
}