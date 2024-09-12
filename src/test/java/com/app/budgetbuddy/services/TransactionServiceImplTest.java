package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.AccountSubType;
import com.app.budgetbuddy.domain.AccountType;
import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.exceptions.InvalidDataException;
import com.app.budgetbuddy.repositories.TransactionRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

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

    @Test
    void testFindById(){
        TransactionsEntity transactionsEntity = createTransactionsEntity();
        Optional<TransactionsEntity> transactionsEntityOptional = Optional.of(transactionsEntity);
        Mockito.when(transactionRepository.findById(transactionsEntity.getId())).thenReturn(transactionsEntityOptional);
        Optional<TransactionsEntity> actual = transactionService.findById(transactionsEntity.getId());
        assertNotNull(actual);
        assertTrue(actual.isPresent());
        assertEquals(transactionsEntity.getId(), actual.get().getId());
        assertEquals(transactionsEntity.getDescription(), actual.get().getDescription());
        assertEquals(transactionsEntity.getAmount(), actual.get().getAmount());
        assertEquals(transactionsEntity.getAuthorizedDate(), actual.get().getAuthorizedDate());
        assertEquals(transactionsEntity.getAccount().getId(), actual.get().getAccount().getId());
    }

    @Test
    void testGetTransactionsByAmountBetween_whenStartAmountIsNull_thenThrowException(){
        BigDecimal endAmount = BigDecimal.valueOf(120);
        assertThrows(IllegalArgumentException.class, () -> {
            transactionService.getTransactionsByAmountBetween(null, endAmount);
        });
    }

    @Test
    void testGetTransactionsByAmountBetween_whenEndAmountIsNull_thenThrowException(){
        BigDecimal startAmount = BigDecimal.valueOf(120);
        assertThrows(IllegalArgumentException.class, () -> {
            transactionService.getTransactionsByAmountBetween(startAmount, null);
        });
    }

    @Test
    void testGetTransactionsByAmountBetween_whenStartAmountEqualsEndAmount_thenThrowException(){
        BigDecimal startAmount = BigDecimal.valueOf(120);
        BigDecimal endAmount = BigDecimal.valueOf(120);
        assertThrows(InvalidDataException.class, () -> {
            transactionService.getTransactionsByAmountBetween(startAmount, endAmount);
        });
    }

    @Test
    void testGetTransactionsByAmountBetween(){
        BigDecimal startAmount = BigDecimal.valueOf(120);
        BigDecimal endAmount = BigDecimal.valueOf(200);
        List<TransactionsEntity> expected = new ArrayList<>();
        expected.add(createTransactionsEntityWithAmount(BigDecimal.valueOf(120)));
        expected.add(createTransactionsEntityWithAmount(BigDecimal.valueOf(200)));

        Mockito.when(transactionRepository.findByAmountBetween(startAmount, endAmount)).thenReturn(expected);
        List<TransactionsEntity> actual = transactionService.getTransactionsByAmountBetween(startAmount, endAmount);
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
   void testGetTransactionsByAmount_whenAmountNull_thenThrowException(){
        assertThrows(NullPointerException.class, () -> {
            transactionService.getTransactionsByAmount(null);
        });
   }

   @Test
   void testGetTransactionsByAmount(){
        BigDecimal startAmount = BigDecimal.valueOf(120);
        TransactionsEntity transactionsEntity = createTransactionsEntityWithAmount(startAmount);
        List<TransactionsEntity> expected = new ArrayList<>();
        expected.add(transactionsEntity);

        Mockito.when(transactionRepository.findByAmount(startAmount)).thenReturn(expected);
        List<TransactionsEntity> actual = transactionService.getTransactionsByAmount(startAmount);
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
   void testGetTransactionsByAmountGreaterThan_AmountIsNull_thenThrowException(){
        BigDecimal amount = null;
        assertThrows(NullPointerException.class, () -> {
            transactionService.getTransactionsByAmountGreaterThan(amount);
        });
   }

   @Test
   void testGetTransactionsByAmountGreaterThan(){
        BigDecimal amount = BigDecimal.valueOf(120);
        List<TransactionsEntity> expected = new ArrayList<>();
        expected.add(createTransactionsEntityWithAmount(BigDecimal.valueOf(135)));
        expected.add(createTransactionsEntityWithAmount(BigDecimal.valueOf(200)));
        Mockito.when(transactionRepository.findByAmountGreaterThan(amount)).thenReturn(expected);

        List<TransactionsEntity> actual = transactionService.getTransactionsByAmountGreaterThan(amount);
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
   void testGetTransactionsByAmountLessThan_AmountIsNull_thenThrowException(){
        assertThrows(NullPointerException.class, () -> {
            transactionService.getTransactionsByAmountLessThan(null);
        });
   }

   @Test
   void testGetTransactionsByAmountLessThan(){

        BigDecimal amount = BigDecimal.valueOf(120);
        List<TransactionsEntity> expected = new ArrayList<>();
        expected.add(createTransactionsEntityWithAmount(BigDecimal.valueOf(75)));
        expected.add(createTransactionsEntityWithAmount(BigDecimal.valueOf(50)));
        Mockito.when(transactionRepository.findByAmountLessThan(amount)).thenReturn(expected);

        List<TransactionsEntity> actual = transactionService.getTransactionsByAmountLessThan(amount);
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
   void testGetTransactionsByPendingTrue(){
        BigDecimal amount = BigDecimal.valueOf(120);
        List<TransactionsEntity> expected = new ArrayList<>();
        expected.add(createTransactionsEntityWithPendingTrue());
        Mockito.when(transactionRepository.findByPendingTrue()).thenReturn(expected);
        List<TransactionsEntity> actual = transactionService.getTransactionsByPendingTrue();
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
   void testGetTransactionsByAuthorizedDate_whenDateNull_thenThrowException(){
        assertThrows(NullPointerException.class, () -> {
            transactionService.getTransactionsByAuthorizedDate(null);
        });
   }

   @Test
   void testGetTransactionsByAuthorizedDate(){
        LocalDate authorizedDate = LocalDate.of(2024, 6, 1);
        List<TransactionsEntity> expected = new ArrayList<>();
        TransactionsEntity transaction = createTransactionsEntity();
        transaction.setAuthorizedDate(authorizedDate);
        expected.add(transaction);

        Mockito.when(transactionRepository.findByAuthorizedDate(authorizedDate)).thenReturn(expected);
        List<TransactionsEntity> actual = transactionService.getTransactionsByAuthorizedDate(authorizedDate);
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
   void testGetTransactionByAccountId_whenAccountIdIsEmpty(){
        String accountId = "";
        assertThrows(IllegalArgumentException.class, () -> {
            transactionService.getTransactionsByAccountId(accountId);
        });

   }

   @Test
   void testGetTransactionsByAccountId_whenAccountIdIsValid(){
        List<TransactionsEntity> expected = new ArrayList<>();
        TransactionsEntity transaction = createTransactionsEntity();
        expected.add(transaction);

        List<TransactionsEntity> transactionsEntities = new ArrayList<>();
        transactionsEntities.add(transaction);
        Mockito.when(transactionRepository.findByAccountReferenceNumber("343232")).thenReturn(transactionsEntities);
        List<TransactionsEntity> actual = transactionService.getTransactionsByAccountId("343232");
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
   void testGetTransactionsByDescription_whenDescriptionIsNull_thenThrowException(){
        assertThrows(NullPointerException.class, () -> {
            transactionService.getTransactionsByDescription(null);
        });
   }

   @Test
   void testGetTransactionsByDescription(){
       List<TransactionsEntity> expected = new ArrayList<>();
       TransactionsEntity transaction = createTransactionsEntity();
       expected.add(transaction);

       List<TransactionsEntity> transactionsEntities = new ArrayList<>();
       transactionsEntities.add(transaction);
       Mockito.when(transactionRepository.findTransactionByDescription("description")).thenReturn(transactionsEntities);
       List<TransactionsEntity> actual = transactionService.getTransactionsByDescription("description");
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
        accountEntity.setAccountReferenceNumber("343232");
        accountEntity.setMask("0000");
        accountEntity.setType(AccountType.DEPOSITORY);
        accountEntity.setUser(createUserEntity());
        accountEntity.setSubtype(AccountSubType.CHECKING);
        return accountEntity;
    }



    private TransactionsEntity createTransactionsEntityWithAmount(BigDecimal amount){
        TransactionsEntity transactionsEntity = new TransactionsEntity();
        transactionsEntity.setId(1L);
        transactionsEntity.setLogoUrl("testLogo");
        transactionsEntity.setDescription("description");
        transactionsEntity.setAmount(amount);
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

    private TransactionsEntity createTransactionsEntityWithPendingTrue(){
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
        transactionsEntity.setPending(true);
        transactionsEntity.setAccount(createAccountEntity());
        return transactionsEntity;
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
        transactionsEntity.setAuthorizedDate(LocalDate.of(2024, 6, 1));
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