export const validateEmail = (email) => {
    const normalizedEmail = email.trim();
    if (normalizedEmail) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(normalizedEmail);
    }
    return false;
}
