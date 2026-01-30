import {useEffect, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import PlaidService from "../services/PlaidService";
import PlaidLink, {PlaidLinkRef} from "./PlaidLink";
import {PlaidLinkOnSuccessMetadata} from "react-plaid-link";

function OAuthRedirect(){
    const navigate = useNavigate();
    const plaidLinkRef = useRef<PlaidLinkRef>(null);
    const plaidService = PlaidService.getInstance();
    const [linkToken, setLinkToken] = useState<string | null>(null);

    useEffect(() => {
        console.log('═══ OAUTH REDIRECT PAGE LOADED ═══');
        console.log('Full URL:', window.location.href);

        // ✅ Restore link token immediately
        const savedLinkToken = sessionStorage.getItem('plaidLinkToken');

        if (savedLinkToken) {
            console.log('✅ Found saved link token');
            setLinkToken(savedLinkToken);
        } else {
            console.error('❌ No saved link token - redirecting to login');
            navigate('/login');
        }
    }, []); // ✅ Empty dependency array - only run once

    // ✅ Separate useEffect to open Plaid after linkToken is set
    useEffect(() => {
        if (linkToken && plaidLinkRef.current) {
            console.log('✅ Opening Plaid Link on oauth-redirect page');
            setTimeout(() => {
                plaidLinkRef.current?.open();
            }, 500);
        }
    }, [linkToken]);

    const handleSuccess = async (publicToken: string, metadata: PlaidLinkOnSuccessMetadata) => {
        console.log('✅ OAuth Plaid success!', publicToken);

        try {
            const userId = Number(sessionStorage.getItem('userId'));
            const response = await plaidService.exchangePublicToken(publicToken, userId);

            // Save plaid link
            await plaidService.savePlaidLinkToDatabase(
                response.accessToken,
                response.itemID,
                response.userID
            );

            // Link accounts
            await plaidService.fetchAndLinkPlaidAccounts(userId);

            // Import transactions
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth();
            const startDate = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
            const endDate = new Date().toISOString().split('T')[0];
            // await plaidTransactionImport.importPlaidTransactions(userId, startDate, endDate);

            sessionStorage.removeItem('plaidLinkToken');
            navigate('/dashboard');
        } catch (error) {
            console.error('❌ Error in OAuth success handler:', error);
            navigate('/login');
        }
    };

    return (
        <div style={{ padding: '50px', textAlign: 'center' }}>
            <h2>Completing your bank connection...</h2>
            <p>Please wait...</p>

            {linkToken ? (
                <PlaidLink
                    ref={plaidLinkRef}
                    linkToken={linkToken}
                    onSuccess={handleSuccess}
                />
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
}

export default OAuthRedirect;