import ForgotPassword from "../components/ForgotPassword";

class ForgotPasswordService
{
    private static instance: ForgotPasswordService;
    private baseUrl: string = 'http://localhost:8080/api/forgot-password';

    private constructor(){
    }

    public static getInstance(): ForgotPasswordService
    {
        if (!ForgotPasswordService.instance) {
            ForgotPasswordService.instance = new ForgotPasswordService();
        }
        return ForgotPasswordService.instance;
    }

    /**
     * Sends a password reset request to the server
     * @param email The user's email address
     * @returns Promise with the validation code or error
     */
    public async requestValidationCode(email: string): Promise<string>
    {
        try {
            const response = await fetch(`${this.baseUrl}/generate-code?email=${encodeURIComponent(email)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            return await response.text();
        } catch (error) {
            console.error('Failed to request validation code for password reset:', error);
            throw error;
        }
    }

    public async requestPasswordReset(email: string, newPassword: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/password?email=${encodeURIComponent(email)}&newPassword=${encodeURIComponent(newPassword)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to reset password: ${response.status} ${errorText}`);
            }

        } catch (error) {
            console.error("Failed to reset the user password: ", error);
            throw error;
        }
    }

    /**
     * Validates the reset code and updates the password
     * @param email User's email
     * @param code Validation code received via email
     * @param newPassword New password to set
     * @returns Promise indicating success or failure
     */
    public async validateAndResetPassword(email: string, code: string, newPassword: string): Promise<boolean>
    {
        try {
            const response = await fetch(`${this.baseUrl}/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    validationCode: code,
                    newPassword
                })
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            return true;
        } catch (error) {
            console.error('Failed to validate and reset password:', error);
            throw error;
        }
    }
}
export default ForgotPasswordService;

