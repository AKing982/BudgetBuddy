package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.exceptions.AccountNotFoundException;
import com.app.budgetbuddy.exceptions.CategoryException;
import com.app.budgetbuddy.services.AccountService;
import com.app.budgetbuddy.services.UserCategoryService;
import com.app.budgetbuddy.workbench.MerchantMatcherService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
public class TransactionCategorizationEngine implements CategorizationEngine<Transaction>
{
    private Map<String, CategoryType> primaryCategoryMap = new HashMap<>();
    private Map<String, CategoryType> secondaryCategoryMap = new HashMap<>();
    private Map<PlaidCategory, CategoryType> plaidCategoryMap = new HashMap<>();
    private Map<String, CategoryType> categoryIdMap = new HashMap<>();
    private AccountService accountService;
    private MerchantMatcherService merchantMatcherService;
    private UserCategoryService userCategoryService;
    private TransactionRuleService transactionRuleService;
    private final String SYSTEM_CATEGORIZED = "SYSTEM";
    private final String USER_CATEGORIZED = "USER";

    @Autowired
    public TransactionCategorizationEngine(UserCategoryService userCategoryService,
                                           AccountService accountService,
                                           TransactionRuleService transactionRuleService,
                                           MerchantMatcherService merchantMatcherService)
    {
        this.userCategoryService = userCategoryService;
        this.accountService = accountService;
        this.transactionRuleService = transactionRuleService;
        this.merchantMatcherService = merchantMatcherService;
        initializePrimaryCategoryMap();
        initializeSecondaryMap();
        initializePlaidCategoryMap();
        initializeCategoryIdMap();
    }

    void initializePlaidCategoryMap()
    {
        plaidCategoryMap.put(PlaidCategory.builder().categoryId("19047000").secondaryCategory("Supermarkets and Groceries").build(), CategoryType.GROCERIES);
        plaidCategoryMap.put(PlaidCategory.createPlaidCategoryWithIdAndPrimary("16000000", "Payment"), CategoryType.PAYMENT);
        plaidCategoryMap.put(PlaidCategory.createPlaidCategoryWithPrimaryAndSecondary("Shops", "Supermarkets and Groceries"), CategoryType.GROCERIES);
    }

    void initializeCategoryIdMap()
    {

        // Transfer matches
        categoryIdMap.put("21001000", CategoryType.TRANSFER);
        categoryIdMap.put("21002000", CategoryType.TRANSFER);
        categoryIdMap.put("21004000", CategoryType.TRANSFER);
        categoryIdMap.put("21005000", CategoryType.TRANSFER);
        categoryIdMap.put("21006000", CategoryType.TRANSFER);
        categoryIdMap.put("21007000", CategoryType.TRANSFER);
        categoryIdMap.put("21009000",  CategoryType.TRANSFER);

        categoryIdMap.put("22002000", CategoryType.TRIP);
        categoryIdMap.put("22001000", CategoryType.TRIP);
        categoryIdMap.put("13001000", CategoryType.ORDER_OUT);
        categoryIdMap.put("13000000", CategoryType.ORDER_OUT);
        categoryIdMap.put("13002000", CategoryType.ORDER_OUT);
        categoryIdMap.put("13003000", CategoryType.ORDER_OUT);
        categoryIdMap.put("13004000", CategoryType.ORDER_OUT);
        categoryIdMap.put("13005000", CategoryType.ORDER_OUT);
    }

    void initializeSecondaryMap()
    {
        // Groceries & Food Stores
        secondaryCategoryMap.put("Supermarkets and Groceries", CategoryType.GROCERIES);
        secondaryCategoryMap.put("Food and Beverage Store", CategoryType.GROCERIES);
        secondaryCategoryMap.put("Convenience Stores", CategoryType.GROCERIES);

        // Restaurants & Dining
        secondaryCategoryMap.put("Restaurants", CategoryType.RESTAURANTS);
        secondaryCategoryMap.put("Bar", CategoryType.ORDER_OUT);
        secondaryCategoryMap.put("Breweries", CategoryType.ORDER_OUT);
        secondaryCategoryMap.put("Internet Cafes", CategoryType.COFFEE);
        secondaryCategoryMap.put("Nightlife", CategoryType.ORDER_OUT);

        // Gas & Automotive
        secondaryCategoryMap.put("Gas Stations", CategoryType.GAS);
        secondaryCategoryMap.put("Automotive", CategoryType.OTHER);

        // Utilities
        secondaryCategoryMap.put("Utilities", CategoryType.UTILITIES);
        secondaryCategoryMap.put("Electric", CategoryType.ELECTRIC);
        secondaryCategoryMap.put("Cable", CategoryType.UTILITIES);
        secondaryCategoryMap.put("Internet Services", CategoryType.UTILITIES);
        secondaryCategoryMap.put("Telecommunication Services", CategoryType.UTILITIES);

        // Subscriptions
        secondaryCategoryMap.put("Subscription", CategoryType.SUBSCRIPTION);

        // Insurance
        secondaryCategoryMap.put("Insurance", CategoryType.INSURANCE);

        // Personal Care & Health
        secondaryCategoryMap.put("Personal Care", CategoryType.HAIRCUT);
        secondaryCategoryMap.put("Glasses and Optometrist", CategoryType.OTHER);
        secondaryCategoryMap.put("Pharmacies", CategoryType.OTHER);
        secondaryCategoryMap.put("Healthcare Services", CategoryType.OTHER);
        secondaryCategoryMap.put("Physicians", CategoryType.OTHER);

        // Housing
        secondaryCategoryMap.put("Rent", CategoryType.RENT);
        secondaryCategoryMap.put("Loan", CategoryType.PAYMENT);

        // Payments
        secondaryCategoryMap.put("Credit Card", CategoryType.PAYMENT);

        // Travel
        secondaryCategoryMap.put("Airlines and Aviation Services", CategoryType.TRIP);
        secondaryCategoryMap.put("Airports", CategoryType.TRIP);
        secondaryCategoryMap.put("Lodging", CategoryType.TRIP);
        secondaryCategoryMap.put("Car and Truck Rentals", CategoryType.TRIP);
        secondaryCategoryMap.put("Taxi", CategoryType.TRIP);
        secondaryCategoryMap.put("Car Service", CategoryType.TRIP);
        secondaryCategoryMap.put("Parking", CategoryType.TRIP);
        secondaryCategoryMap.put("Tolls and Fees", CategoryType.TRIP);
        secondaryCategoryMap.put("Public Transportation Services", CategoryType.TRIP);
        secondaryCategoryMap.put("Rail", CategoryType.TRIP);
        secondaryCategoryMap.put("Boat", CategoryType.TRIP);
        secondaryCategoryMap.put("Cruises", CategoryType.TRIP);
        secondaryCategoryMap.put("Charter Buses", CategoryType.TRIP);
        secondaryCategoryMap.put("Limos and Chauffeurs", CategoryType.TRIP);

        // Income & Transfers
        secondaryCategoryMap.put("Deposit", CategoryType.DEPOSIT);
        secondaryCategoryMap.put("Payroll", CategoryType.INCOME);
        secondaryCategoryMap.put("Interest Earned", CategoryType.INCOME);
        secondaryCategoryMap.put("Refund", CategoryType.REFUND);

        // Transfers & Withdrawals
        secondaryCategoryMap.put("Withdrawal", CategoryType.WITHDRAWAL);
        secondaryCategoryMap.put("Internal Account Transfer", CategoryType.TRANSFER);
        secondaryCategoryMap.put("ACH", CategoryType.TRANSFER);
        secondaryCategoryMap.put("Wire", CategoryType.TRANSFER);
        secondaryCategoryMap.put("Third Party", CategoryType.TRANSFER);
        secondaryCategoryMap.put("Check", CategoryType.TRANSFER);
        secondaryCategoryMap.put("Credit", CategoryType.TRANSFER);
        secondaryCategoryMap.put("Debit", CategoryType.TRANSFER);

        // Pets
        secondaryCategoryMap.put("Pets", CategoryType.PET);
        secondaryCategoryMap.put("Veterinarians", CategoryType.PET);
        secondaryCategoryMap.put("Animal Shelter", CategoryType.PET);

        // Shopping & Retail
        secondaryCategoryMap.put("Digital Purchase", CategoryType.OTHER);
        secondaryCategoryMap.put("Sporting Goods", CategoryType.OTHER);
        secondaryCategoryMap.put("Office Supplies", CategoryType.OTHER);
        secondaryCategoryMap.put("Department Stores", CategoryType.OTHER);
        secondaryCategoryMap.put("Discount Stores", CategoryType.OTHER);
        secondaryCategoryMap.put("Clothing and Accessories", CategoryType.OTHER);
        secondaryCategoryMap.put("Computers and Electronics", CategoryType.OTHER);
        secondaryCategoryMap.put("Furniture and Home Decor", CategoryType.OTHER);
        secondaryCategoryMap.put("Hardware Store", CategoryType.OTHER);
        secondaryCategoryMap.put("Bookstores", CategoryType.OTHER);
        secondaryCategoryMap.put("Toys", CategoryType.OTHER);
        secondaryCategoryMap.put("Jewelry and Watches", CategoryType.OTHER);

        // Recreation & Entertainment
        secondaryCategoryMap.put("Entertainment", CategoryType.OTHER);
        secondaryCategoryMap.put("Gyms and Fitness Centers", CategoryType.OTHER);
        secondaryCategoryMap.put("Sports Clubs", CategoryType.OTHER);
        secondaryCategoryMap.put("Arts and Entertainment", CategoryType.OTHER);
        secondaryCategoryMap.put("Parks", CategoryType.OTHER);
        secondaryCategoryMap.put("Zoo", CategoryType.OTHER);

        // Services
        secondaryCategoryMap.put("Home Improvement", CategoryType.OTHER);
        secondaryCategoryMap.put("Cleaning", CategoryType.OTHER);
        secondaryCategoryMap.put("Legal", CategoryType.OTHER);
        secondaryCategoryMap.put("Financial", CategoryType.OTHER);
        secondaryCategoryMap.put("Real Estate", CategoryType.OTHER);
    }

    void initializePrimaryCategoryMap()
    {
        primaryCategoryMap.put("Shops", CategoryType.OTHER);
        primaryCategoryMap.put("Travel", CategoryType.TRIP);
        primaryCategoryMap.put("Transfer", CategoryType.TRANSFER);
        primaryCategoryMap.put("Food and Drink", CategoryType.ORDER_OUT);
        primaryCategoryMap.put("Payment", CategoryType.PAYMENT);
        primaryCategoryMap.put("Recreation", CategoryType.OTHER);
        primaryCategoryMap.put("Healthcare", CategoryType.OTHER);
        primaryCategoryMap.put("Community",  CategoryType.OTHER);
        primaryCategoryMap.put("Service", CategoryType.OTHER);
        primaryCategoryMap.put("Tax", CategoryType.OTHER);
    }

    @Override
    public Category categorize(Transaction transaction)
    {
        if(transaction == null)
        {
            throw new CategoryException("Transaction was found null... Terminating categorization");
        }
        String categoryId = transaction.getCategoryId();
        String primaryCategory = transaction.getPrimaryCategory();
        String secondaryCategory = transaction.getSecondaryCategory();
        int transactionPriority = assignPriorityToTransaction(transaction);
        log.info("Transaction Priority: " + transactionPriority);
        if(transactionPriority == 0)
        {
            return Category.createUncategorized();
        }
        String acctId = transaction.getAccountId();
        Optional<AccountEntity> accountEntityOptional = accountService.findByAccountId(acctId);
        if(accountEntityOptional.isEmpty())
        {
            throw new AccountNotFoundException("Account with id " + acctId + " not found");
        }
        AccountEntity accountEntity = accountEntityOptional.get();
        Long userId = accountEntity.getUser().getId();
        List<TransactionRule> transactionRules = transactionRuleService.findByUserId(userId);
        String plaidCategoryID = PlaidCategories.findCategoryIdByPrimaryAndSecondaryCategory(primaryCategory, secondaryCategory);
        if(transactionRules.isEmpty())
        {
            CategoryType categoryType = null;
            String catId = plaidCategoryID;
            switch(transactionPriority)
            {
                case 1:
                    categoryType = secondaryCategoryMap.get(secondaryCategory);
                    break;
                case 2:
                    PlaidCategory pCategoryWithPrimaryAndSec = PlaidCategory.createPlaidCategoryWithPrimaryAndSecondary(primaryCategory, secondaryCategory);
                    log.info("Plaid Category: " + pCategoryWithPrimaryAndSec.toString());
                    categoryType = plaidCategoryMap.get(pCategoryWithPrimaryAndSec);
                    log.info("Category Type: " + categoryType);
                    catId = "";
                    break;
                case 5:
                    PlaidCategory plaidCategory = PlaidCategory.builder()
                            .categoryId(categoryId)
                            .secondaryCategory(secondaryCategory)
                            .build();
                    categoryType = plaidCategoryMap.get(plaidCategory);
                    log.info("Plaid Category map contains key {}", plaidCategory);
                    catId = PlaidCategories.findCategoryIdBySecondaryCategory(secondaryCategory);
                    break;
                case 6:
                    PlaidCategory pCategoryWithPrimary = PlaidCategory.createPlaidCategoryWithIdAndPrimary(categoryId, primaryCategory);
                    categoryType = plaidCategoryMap.get(pCategoryWithPrimary);
                    catId = categoryId;
                    break;
                case 7:
                    categoryType = primaryCategoryMap.get(primaryCategory);
                    break;
                case 9:
                    PlaidCategories plaidCategories = PlaidCategories.findByCategoryId(categoryId);
                    log.info("Found Plaid Category {}", plaidCategories);
                    if(plaidCategories != null)
                    {
                        String pCategory = plaidCategories.getPrimaryCategory();
                        log.info("Primary Category: {}", pCategory);
                        categoryType = primaryCategoryMap.get(pCategory);
                        if (categoryType != null) {
                            log.info("Found match in secondary category map");
                            catId = categoryId;
                        }
                    }
                    break;
                default:
                    return Category.createUncategorized();
            }
            if(categoryType != null)
            {
                return Category.createCategory(catId, categoryType.getType(), SYSTEM_CATEGORIZED, LocalDate.now());
            }
        }
        else
        {
            for(TransactionRule rule : transactionRules)
            {
                int match_count = 0;
                Long ruleId = 1L;
                if(matches(transaction, rule))
                {
                    match_count++;
                    rule.setMatchCount(match_count);

                }
            }
        }
        return Category.createUncategorized();
    }

    private int assignPriorityToTransaction(Transaction transaction)
    {
        boolean hasPrimary = transaction.getPrimaryCategory() != null;
        boolean hasSecondary = transaction.getSecondaryCategory() != null;
        boolean hasCategoryId = transaction.getCategoryId() != null;
        boolean hasMerchant = transaction.getMerchantName() != null;
        // Check combinations in priority order
        if (hasPrimary && hasSecondary && hasCategoryId) return 1;
        if (hasPrimary && hasSecondary) return 2;
        if (hasPrimary && hasMerchant) return 3;
        if (hasSecondary && hasMerchant) return 4;
        if (hasSecondary && hasCategoryId) return 5;
        if (hasPrimary && hasCategoryId) return 6;
        if (hasPrimary) return 7;
        if (hasSecondary) return 8;
        if (hasCategoryId) return 9;
        return 0;
    }

    @Override
    public boolean matches(Transaction transaction, TransactionRule transactionRule)
    {
        if(transaction == null || transactionRule == null)
        {
            return false;
        }
//        BigDecimal amount = transaction.getAmount();
//        String description = transaction.getDescription();
//        String primaryCategory = transaction.getPrimaryCategory();
//        String secondaryCategory = transaction.getSecondaryCategory();
//        String categoryId = transaction.getCategoryId();
//        String merchantName = transaction.getMerchantName();
//        boolean merchantMatch = transactionRule.getMerchantRule().equalsIgnoreCase(merchantName);
//        boolean descriptionMatch = transactionRule.getDescriptionRule().equalsIgnoreCase(description);
//        if(transactionRule.getMerchantRule().equalsIgnoreCase(merchantName))
//        {
//            return true;
//        }
//
//        return false;
        return true;
    }
}
