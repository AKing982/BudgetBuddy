package com.app.budgetbuddy.workbench;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class MerchantNameBuilderTest {

    @InjectMocks
    private MerchantNameBuilder merchantNameBuilder;

    @BeforeEach
    void setUp() {
    }

    @Test
    void getMountainAmericaMerchantName_whenCleanDescription_thenReturnDescriptionDirectly() {
        assertEquals("Flex Finance", merchantNameBuilder.getMountainAmericaMerchantName(
                "Flex Finance", "Withdrawal Debit FLEX FINANCE GETFLEX.COM NY    Date 02/24/26 04 4829"));
    }

    @Test
    void getMountainAmericaMerchantName_whenMaverik_thenReturnMaverik() {
        assertEquals("Maverik", merchantNameBuilder.getMountainAmericaMerchantName(
                "Maverik", "Withdrawal Debit MAVERIK #413 SOUTH JORDAN UT    Date 02/28/26 66 5542"));
    }

    @Test
    void getMountainAmericaMerchantName_whenSpotify_thenReturnSpotify() {
        assertEquals("Spotify", merchantNameBuilder.getMountainAmericaMerchantName(
                "Spotify", "Withdrawal Debit SPOTIFY 877-778-1161 NY    Date 02/15/26 02 4899"));
    }

    @Test
    void getMountainAmericaMerchantName_whenPandaExpress_thenReturnPandaExpress() {
        assertEquals("Panda Express", merchantNameBuilder.getMountainAmericaMerchantName(
                "Panda Express", "Withdrawal Debit PANDA EXPRESS #3088 SOUTH JORDAN UT    Date 02/24/26 24 5814"));
    }

    @Test
    void getMountainAmericaMerchantName_whenWinCoFoods_thenReturnWinCoFoods() {
        assertEquals("WinCo Foods", merchantNameBuilder.getMountainAmericaMerchantName(
                "WinCo Foods", "Withdrawal POS # WINCO FOODS #159 WINCO1 HERRIMAN UT"));
    }

    @Test
    void getMountainAmericaMerchantName_whenWalmart_thenReturnWalmart() {
        assertEquals("Walmart", merchantNameBuilder.getMountainAmericaMerchantName(
                "Walmart", "Withdrawal POS # WAL-MART #5763 3590 W. SOUTH JORDAN PK    SOUTH JORDAN UT"));
    }

    @Test
    void getMountainAmericaMerchantName_whenHboMax_thenReturnHboMax() {
        assertEquals("Hbo Max", merchantNameBuilder.getMountainAmericaMerchantName(
                "Hbo Max", "Withdrawal Debit HELP.HBOMAX.COM HBOMAX.COM NY    Date 02/12/26 96 4899"));
    }

    // Polluted description rows — must be resolved
    @Test
    void getMountainAmericaMerchantName_whenPollutedDescriptionWithAffirmAlias_thenReturnAffirm() {
        assertEquals("Affirm", merchantNameBuilder.getMountainAmericaMerchantName(
                "Withdrawal Debit Affirm * Pay Fsq3U3R9 XX-3729 CA Date 02/28/26 XX 6012 Card 7534",
                "Withdrawal Debit AFFIRM * PAY FSQ3U3R9 855-423-3729 CA    Date 02/28/26 77 6012"));
    }

    @Test
    void getMountainAmericaMerchantName_whenPollutedDescriptionWithSpAffAlias_thenReturnAffirm() {
        assertEquals("Affirm", merchantNameBuilder.getMountainAmericaMerchantName(
                "Withdrawal Debit Sp+Aff * Tyk Llc Chica XX-3729 CA Date 02/12/26 XX 6012 Card 7534",
                "Withdrawal Debit SP+AFF * TYK LLC CHICA 855-423-3729 CA    Date 02/12/26 26 6012"));
    }

    @Test
    void getMountainAmericaMerchantName_whenPollutedDescriptionWithTstAlias_thenReturnBreakSportsGrill() {
        assertEquals("The Break Sports Grill", merchantNameBuilder.getMountainAmericaMerchantName(
                "Withdrawal Debit Tst* The Break Sports G South Jordan UT Date XX 5813 Card 7534",
                "Withdrawal Debit TST* THE BREAK SPORTS G SOUTH JORDAN UT    Date 02/14/26 86 5813"));
    }

    @Test
    void getMountainAmericaMerchantName_whenPollutedDescriptionWithHarmons_thenReturnHarmons() {
        assertEquals("Harmons", merchantNameBuilder.getMountainAmericaMerchantName(
                "Withdrawal # Harmons - District 86 South Jordan UT",
                "Withdrawal POS # HARMONS - DISTRICT 86 SOUTH JORDAN UT"));
    }

    @Test
    void getMountainAmericaMerchantName_whenAchStateFarm_thenReturnStateFarm() {
        assertEquals("State Farm Billg", merchantNameBuilder.getMountainAmericaMerchantName(
                "Withdrawal Ach S Type: Payments CO: State Farm Billg Name: King Alexander Entry Class Code: Web Ach Trace Number: 1",
                "Withdrawal ACH S TYPE: PAYMENTS CO: STATE FARM BILLG"));
    }

    // Edge cases
    @Test
    void getMountainAmericaMerchantName_whenNullDescription_thenReturnExtendedDescription() {
        assertEquals("Withdrawal Debit MAVERIK #413 SOUTH JORDAN UT", merchantNameBuilder.getMountainAmericaMerchantName(
                null, "Withdrawal Debit MAVERIK #413 SOUTH JORDAN UT"));
    }

    @Test
    void getMountainAmericaMerchantName_whenBothNull_thenReturnBlank() {
        assertEquals(" ", merchantNameBuilder.getMountainAmericaMerchantName(null, null));
    }

    @Test
    void getMountainAmericaMerchantName_whenDepositDescription_thenReturnDeposit() {
        assertEquals("Deposit", merchantNameBuilder.getMountainAmericaMerchantName("Deposit", "Deposit"));
    }


    @AfterEach
    void tearDown() {
    }
}