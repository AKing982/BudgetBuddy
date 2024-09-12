package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.AccountSubType;
import com.app.budgetbuddy.domain.AccountType;
import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.repositories.TransactionRepository;
import jakarta.inject.Inject;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;


@ExtendWith(MockitoExtension.class)
class TransactionServiceImplTest {

    @InjectMocks
    private TransactionServiceImpl transactionService;

    @Mock
    private TransactionRepository transactionRepository;

    @BeforeEach
    void setUp() {
        transactionService = new TransactionServiceImpl(transactionRepository);
    }

    @Test
    void testFindAll(){

        List<TransactionsEntity> expected = new ArrayList<>();
        expected.add(createTransactionsEntity());

        Mockito.when(transactionRepository.findAll()).thenReturn(expected);

        List<TransactionsEntity> actual = transactionService.findAll();
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        assertTrue(actual.containsAll(expected));
        for(int i = 0; i < actual.size(); i++){
            assertEquals(expected.get(i).getId(), actual.get(i).getId());
            assertEquals(expected.get(i).getDescription(), actual.get(i).getDescription());
            assertEquals(expected.get(i).getAmount(), actual.get(i).getAmount());
            assertEquals(expected.get(i).getAuthorizedDate(), actual.get(i).getAuthorizedDate());
            assertEquals(expected.get(i).getAccount().getId(), actual.get(i).getAccount().getId());
        }
    }

    @Test
    void testFindAll_whenExceptionIsThrown(){
        List<TransactionsEntity> expected = new ArrayList<>();
        expected.add(createTransactionsEntity());

        Mockito.when(transactionRepository.findAll()).thenThrow(new RuntimeException());
        assertThrows(RuntimeException.class, () -> transactionService.findAll());
    }

    @Test
    void testSave_whenTransactionsEntityIsNull_thenThrowException(){
        TransactionsEntity transactionsEntity = null;
        assertThrows(NullPointerException.class, () -> transactionService.save(transactionsEntity));
    }

    @Test
    void testSave_whenTransactionEntityIsValid(){
        TransactionsEntity transactionsEntity = createTransactionsEntity();
        transactionService.save(transactionsEntity);

        Mockito.verify(transactionRepository).save(transactionsEntity);
    }

    @Test
    void testDelete_whenTransactionEntityIsNull_thenThrowException(){
        assertThrows(NullPointerException.class, () -> transactionService.delete(null));
    }

    @Test
    void testDelete(){
        TransactionsEntity transactionsEntity = createTransactionsEntity();
        transactionService.delete(transactionsEntity);

        Mockito.verify(transactionRepository).delete(transactionsEntity);
    }


    private UserEntity createUserEntity(){
        UserEntity userEntity = new UserEntity();
        userEntity.setId(1L);
        userEntity.setUsername("username");
        userEntity.setPassword("password");
        return userEntity;
    }

    private AccountEntity createAccountEntity() {
        AccountEntity accountEntity = new AccountEntity();
        accountEntity.setBalance(BigDecimal.valueOf(100));
        accountEntity.setAccountName("testAccountName");
        accountEntity.setAccountReferenceNumber("testAccountReferenceNumber");
        accountEntity.setMask("0000");
        accountEntity.setType(AccountType.DEPOSITORY);
        accountEntity.setUser(createUserEntity());
        accountEntity.setSubtype(AccountSubType.CHECKING);
        return accountEntity;
    }

    private TransactionsEntity createTransactionsEntity(){
        TransactionsEntity transactionsEntity = new TransactionsEntity();
        transactionsEntity.setId(1L);
        transactionsEntity.setLogoUrl("testLogo");
        transactionsEntity.setDescription("description");
        transactionsEntity.setAmount(new BigDecimal("100.00"));
        transactionsEntity.setCreateDate(LocalDate.now());
        transactionsEntity.setTransactionReferenceNumber("e232323232");
        transactionsEntity.setPosted(LocalDate.now());
        transactionsEntity.setCategoryId("522223");
        transactionsEntity.setMerchantName("testMerchantName");
        transactionsEntity.setIsoCurrencyCode("USD");
        transactionsEntity.setPending(false);
        transactionsEntity.setAccount(createAccountEntity());
        return transactionsEntity;
    }

    @AfterEach
    void tearDown() {
    }
}