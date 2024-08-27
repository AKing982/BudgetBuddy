import {
    PlaidLinkOnExit,
    PlaidLinkOnSuccess,
    PlaidLinkOnSuccessMetadata,
    PlaidLinkOptions,
    usePlaidLink
} from "react-plaid-link";
import {forwardRef, RefObject, useCallback, useEffect, useImperativeHandle, useState} from "react";
import {Simulate} from "react-dom/test-utils";


interface PlaidLinkProps {
    linkToken: string;
    onSuccess: (public_token: string, metadata: PlaidLinkOnSuccessMetadata) => Promise<void>;
    onConnect?: () => void;
    ref: RefObject<PlaidLinkRef>;
}

export interface PlaidLinkRef {
    open: () => void;
}

interface Metadata {
    // Define the structure of metadata if known, otherwise use any
    [key: string]: any;
}


const PlaidLink = forwardRef<{ open: () => void }, PlaidLinkProps>(({ linkToken, onSuccess, onConnect }, ref) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isLinked, setIsLinked] = useState<boolean>(false);

    const onExit: PlaidLinkOnExit = useCallback((err, metadata) => {
        if (err != null) {
            setError(err.display_message || 'Error linking account');
        }
    }, []);

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

    const config: PlaidLinkOptions = {
        token: linkToken,
        onSuccess: handleSuccess,
        onExit,
    };

    const { open, ready } = usePlaidLink(config);

    useImperativeHandle(ref, () => ({
        open: () => {
            if (ready) {
                open();
            }
        }
    }));

    useEffect(() => {
        if (ready && onConnect) {
            onConnect();
        }
    }, [ready, onConnect]);

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