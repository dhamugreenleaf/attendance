const otpStore = new Map();

export const generateMockOtp = async (phoneNumber, pendingUserData) => {
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store it with a 10 minute expiration
    const expiration = Date.now() + 10 * 60 * 1000;
    
    otpStore.set(phoneNumber, {
        otp,
        expiration,
        userData: pendingUserData
    });
    
    // In a real app, integrate Twilio or SNS here.
    // For this mock implementation, we log it to the console.
    console.log(`\n=========================================`);
    console.log(`🔒 MOCK SMS SENT TO ${phoneNumber}`);
    console.log(`🔑 Your verification code is: ${otp}`);
    console.log(`=========================================\n`);
    
    return otp;
};

export const verifyMockOtp = async (phoneNumber, submittedOtp) => {
    const record = otpStore.get(phoneNumber);
    
    if (!record) {
        return null;
    }
    
    if (Date.now() > record.expiration) {
        otpStore.delete(phoneNumber);
        return null;
    }
    
    if (record.otp === submittedOtp) {
        // Clear OTP after successful use
        otpStore.delete(phoneNumber);
        return record.userData;
    }
    
    return null;
};
