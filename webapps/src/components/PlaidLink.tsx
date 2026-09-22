import {
    PlaidLinkOnExit,
    PlaidLinkOnSuccess,
    PlaidLinkOnSuccessMetadata,
    PlaidLinkOptions,
    usePlaidLink
} from "react-plaid-link";
import {forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState} from "react";

interface PlaidLinkProps {
    linkToken: string;
    onSuccess: (public_token: string, metadata: PlaidLinkOnSuccessMetadata) => Promise<void>;
    onConnect?: () => void;
    onTokenExpired?: () => Promise<void>; // Callback to refresh token
    onExit?: (error: any, metadata: any) => void;
    renderStatus?: boolean; // default true; set false when the parent renders its own status UI
}

export interface PlaidLinkRef {
    open: () => void;
}

const PlaidLink = forwardRef<PlaidLinkRef, PlaidLinkProps>(
    ({ linkToken, onSuccess, onConnect, onTokenExpired, onExit: onExitProp, renderStatus = true }, ref) => {
        const [isLoading, setIsLoading] = useState<boolean>(false);
        const [error, setError] = useState<string | null>(null);
        const [isLinked, setIsLinked] = useState<boolean>(false);

        const onExit: PlaidLinkOnExit = useCallback(async (err, metadata) => {
            if (onExitProp) {
                onExitProp(err, metadata);
            }

            if (err != null) {
                console.error('Plaid Link exited with error:', err.error_code, err.error_message);

                if (err.error_code === 'RATE_LIMIT') {
                    setError('Too many connection attempts. Please wait a moment and try again.');
                    setTimeout(() => {
                        setError('Ready to try again. Click to reconnect.');
                    }, 60000);
                    return;
                }

                if (err.error_code === 'INVALID_LINK_TOKEN' && onTokenExpired) {
                    setError('Link token expired. Refreshing...');
                    try {
                        await onTokenExpired();
                        setError(null);
                    } catch (refreshError) {
                        console.error('Failed to refresh token:', refreshError);
                        setError('Failed to refresh connection. Please try again.');
                    }
                } else if (err.error_code !== 'RATE_LIMIT') {
                    const errorMessage = err.display_message || err.error_message || 'Error linking account';
                    setError(errorMessage);
                }
            }
        }, [onTokenExpired, onExitProp]);

        const handleSuccess: PlaidLinkOnSuccess = useCallback(async (public_token, metadata) => {
            setIsLoading(true);
            try {
                await onSuccess(public_token, metadata);
                setIsLinked(true);
            } catch (err) {
                setError('Failed to exchange public token');
                console.error('There was an error exchanging the public token: ', err);
            }
            setIsLoading(false);
        }, [onSuccess]);

        const config: PlaidLinkOptions = useMemo(() => {
            const base: PlaidLinkOptions = {
                token: linkToken,
                onSuccess: handleSuccess,
                onExit,
            };
            const params = new URLSearchParams(window.location.search);
            if (window.location.pathname === '/oauth-redirect' || params.get('oauth_state_id')) {
                base.receivedRedirectUri = window.location.href;
            }
            return base;
        }, [linkToken, handleSuccess, onExit]);

        const { open, ready } = usePlaidLink(config);
        useEffect(() => {
            console.log('[PlaidLink] ready =', ready, 'token =', linkToken?.slice(0, 15));
        }, [ready, linkToken]);

        useImperativeHandle(ref, () => ({
            open: () => {
                console.log('[PlaidLink] open() called — ready:', ready, 'token present:', !!linkToken);
                if (!linkToken) {
                    console.error('Cannot open Plaid Link: No link token available');
                    setError('No link token available. Please try again.');
                    return;
                }
                if (ready) {
                    setError(null);
                    open();
                } else {
                    console.warn('Plaid Link not ready yet');
                }
            }
        }), [ready, open, linkToken]);

        useEffect(() => {
            if (ready && onConnect) {
                onConnect();
            }
        }, [ready, onConnect]);

        if (!renderStatus) {
            return null;
        }
        if (isLoading) {
            return <div>Loading...</div>;
        }
        if (error) {
            return <div>Error: {error}</div>;
        }
        if (isLinked) {
            return <div>Account linked successfully!</div>;
        }

        return null;
    });

export default PlaidLink;
// import {
//     PlaidLinkOnExit,
//     PlaidLinkOnSuccess,
//     PlaidLinkOnSuccessMetadata,
//     PlaidLinkOptions,
//     usePlaidLink
// } from "react-plaid-link";
// import {forwardRef, RefObject, useCallback, useEffect, useImperativeHandle, useMemo, useState} from "react";
// import {Simulate} from "react-dom/test-utils";
//
//
// interface PlaidLinkProps {
//     linkToken: string;
//     onSuccess: (public_token: string, metadata: PlaidLinkOnSuccessMetadata) => Promise<void>;
//     onConnect?: () => void;
//     onTokenExpired?: () => Promise<void>; // Callback to refresh token
//     onExit?: (error: any, metadata: any) => void;
// }
//
// export interface PlaidLinkRef {
//     open: () => void;
// }
//
// interface Metadata {
//     // Define the structure of metadata if known, otherwise use any
//     [key: string]: any;
// }
//
//
// const PlaidLink = forwardRef<{ open: () => void }, PlaidLinkProps>(({ linkToken, onSuccess, onConnect, onTokenExpired, onExit: onExitProp }, ref) => {
//     const [isLoading, setIsLoading] = useState<boolean>(false);
//     const [error, setError] = useState<string | null>(null);
//     const [isLinked, setIsLinked] = useState<boolean>(false);
//
//
//     const onExit: PlaidLinkOnExit = useCallback(async (err, metadata) => {
//         console.log('Plaid Link exited');
//         console.log('Error:', err);
//         console.log('Metadata:', metadata);
//         if(onExitProp){
//             onExitProp(err, metadata);
//         }
//
//         if (err != null) {
//             console.error('Full error object:', JSON.stringify(err, null, 2));
//             console.error('Error code:', err.error_code);
//             console.error('Error message:', err.error_message);
//             console.error('Display message:', err.display_message);
//
//             // Handle rate limit specifically
//             if (err.error_code === 'RATE_LIMIT') {
//                 console.log('Plaid rate limit hit - waiting before retry');
//                 setError('Too many connection attempts. Please wait a moment and try again.');
//
//                 // Optional: Auto-retry after a delay
//                 setTimeout(() => {
//                     setError('Ready to try again. Click to reconnect.');
//                 }, 60000); // Wait 1 minute
//
//                 return; // Don't show alert for rate limits
//             }
//
//             // Handle expired or invalid token
//             if (err.error_code === 'INVALID_LINK_TOKEN' && onTokenExpired) {
//                 console.log('Link token expired, requesting new token...');
//                 setError('Link token expired. Refreshing...');
//                 try {
//                     await onTokenExpired();
//                     setError(null);
//                 } catch (refreshError) {
//                     console.error('Failed to refresh token:', refreshError);
//                     setError('Failed to refresh connection. Please try again.');
//                 }
//             } else if (err.error_code !== 'RATE_LIMIT') {
//                 // Show error for other cases (but not rate limit)
//                 const errorMessage = err.display_message || err.error_message || 'Error linking account';
//                 setError(errorMessage);
//             }
//         }
//     }, [onTokenExpired]);
//
//     const handleSuccess: PlaidLinkOnSuccess = useCallback(async (public_token, metadata) => {
//         setIsLoading(true);
//         try {
//             await onSuccess(public_token, metadata);
//             setIsLinked(true);
//         } catch (err) {
//             setError('Failed to exchange public token');
//             console.error('There was an error exchanging the public token: ', err);
//         }
//         setIsLoading(false);
//     }, [onSuccess]);
//
//     const config: PlaidLinkOptions = useMemo(() => ({
//         token: linkToken,
//         onSuccess: handleSuccess,
//         onExit,
//         // Note: window.location check inside useMemo ensures stability
//         ...(window.location.pathname === '/oauth-redirect' && {
//             receivedRedirectUri: window.location.href
//         })
//     }), [linkToken, handleSuccess, onExit]); // Only re-run if these change
//
//     if (config) {
//         const params = new URLSearchParams(window.location.search);
//         if (params.get('oauth_state_id')) {
//             config.receivedRedirectUri = window.location.href;
//         }
//
//         console.log('═══ PLAID CONFIG ═══');
//         console.log('window.location.href:', window.location.href);
//         console.log('receivedRedirectUri:', config.receivedRedirectUri);
//         console.log('Has oauth_state_id?', window.location.href.includes('oauth_state_id'));
//         console.log('Full config:', JSON.stringify(config, null, 2));
//     }
//
//     console.log('═══ PLAID CONFIG ═══');
//     console.log('window.location.href:', window.location.href);
//     console.log('receivedRedirectUri:', config.receivedRedirectUri);
//     console.log('Has oauth_state_id?', window.location.href.includes('oauth_state_id'));
//     console.log('Full config:', JSON.stringify(config, null, 2));
//
//     const { open, ready } = usePlaidLink(config);
//
//     useImperativeHandle(ref, () => ({
//         open: () => {
//             if (!linkToken) {
//                 console.error('Cannot open Plaid Link: No link token available');
//                 setError('No link token available. Please try again.');
//                 return;
//             }
//             if (ready) {
//                 setError(null); // Clear any previous errors
//                 open();
//             } else {
//                 console.warn('Plaid Link not ready yet');
//             }
//         }
//     }), [ready, open, linkToken]);
//
//
//     useEffect(() => {
//         if (ready && onConnect) {
//             onConnect();
//         }
//     }, [ready, onConnect]);
//
//     if (isLoading) {
//         return <div>Loading...</div>;
//     }
//     if (error) {
//         return <div>Error: {error}</div>;
//     }
//     if (isLinked) {
//         return <div>Account linked successfully!</div>;
//     }
//
//     return null;
// });
//
//
// export default PlaidLink;