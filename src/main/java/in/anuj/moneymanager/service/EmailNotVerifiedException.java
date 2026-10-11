package in.anuj.moneymanager.service;

public class EmailNotVerifiedException extends RuntimeException {
    public static final String MESSAGE =
            "Your account is not activated. Please click the activation link sent to your email before logging in.";

    public EmailNotVerifiedException() {
        super(MESSAGE);
    }
}
