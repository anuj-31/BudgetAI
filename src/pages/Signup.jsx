import {useState} from "react";
import {Link} from "react-router-dom";
import {assets} from "../assets/assets.js";
import Input from "../components/Input.jsx";
import {validateEmail} from "../util/validation.js";
import axiosConfig from "../util/axiosConfig.jsx";
import {API_ENDPOINTS} from "../util/apiEndpoints.js";
import {CheckCircle2, LoaderCircle, X} from "lucide-react";
import Header from "../components/Header.jsx";

const Signup = () => {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(null);
    const [resendAvailable, setResendAvailable] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const normalizedEmail = email.trim().toLowerCase();

        //basic validation
        if (!fullName.trim()) {
            setError("Please enter your fullname");
            setIsLoading(false);
            return;
        }

        if (!validateEmail(normalizedEmail)) {
            setError("Please enter valid email address");
            setIsLoading(false);
            return;
        }

        if (!password.trim()) {
            setError("Please enter your password");
            setIsLoading(false);
            return;
        }

        setError(null);

        //signup api call
        try {
            const response = await axiosConfig.post(API_ENDPOINTS.REGISTER, {
                fullName,
                email: normalizedEmail,
                password
            })
            if (response.status === 201) {
                setRegistrationSuccess({email: normalizedEmail});
            }
        } catch(err) {
            const message = err.response?.data?.message || err.message || "Unable to create your account.";
            console.error("Signup failed:", message);
            setResendAvailable(err.response?.status === 503);
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }

    const handleResendActivation = async () => {
        setResendLoading(true);
        try {
            const response = await axiosConfig.post(API_ENDPOINTS.RESEND_ACTIVATION, {
                email: email.trim().toLowerCase(),
            });
            setResendSuccess(response.status === 200);
            setError(response.data?.message || "Activation email sent. Please check your inbox.");
            setResendAvailable(false);
        } catch (err) {
            setResendSuccess(false);
            setResendAvailable(true);
            setError(err.response?.data?.message || "Unable to resend the activation email. Please try again later.");
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="h-screen w-full flex flex-col">
            <Header />
            <div className="flex-grow w-full relative flex items-center justify-center overflow-hidden">
                {/* Background image with blur*/}
                <img src={assets.login_bg} alt="Background" className="absolute inset-0 w-full h-full object-cover filter blur-sm" />

                <div className="relative z-10 w-full max-w-lg px-6">

                    {registrationSuccess ? (
                        <section
                            aria-labelledby="registration-success-title"
                            className="relative rounded-lg bg-white bg-opacity-95 p-8 text-center shadow-2xl backdrop-blur-sm"
                            role="status"
                        >
                            <button
                                type="button"
                                onClick={() => setRegistrationSuccess(null)}
                                aria-label="Dismiss success message"
                                className="absolute right-4 top-4 rounded-full p-2 text-slate-500 transition hover:bg-purple-50 hover:text-purple-700"
                            >
                                <X className="h-5 w-5" />
                            </button>
                            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
                                <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
                            </div>
                            <h1 id="registration-success-title" className="text-2xl font-semibold text-slate-900">
                                Account Created Successfully!
                            </h1>
                            <p className="mt-4 text-sm leading-6 text-slate-700 sm:text-base">
                                Account created! Check your inbox to activate your account before logging in.
                            </p>
                            <p className="mt-3 break-all font-semibold text-purple-800">
                                {registrationSuccess.email}
                            </p>
                            <Link
                                to="/login"
                                className="btn-primary mt-6 inline-flex w-full items-center justify-center px-5 py-3 text-base no-underline sm:w-auto"
                            >
                                Go to Login
                            </Link>
                        </section>
                    ) : (
                    <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-semibold text-black text-center mb-2">
                            Create An Account
                        </h3>
                        <p className="text-sm text-slate-700 text-center mb-8">
                            Start tracking your spendings by joining with us.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                                <Input
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    label="Full Name"
                                    placeholder="Jhon Doe"
                                    type="text"
                                />

                                <Input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    label="Email Address"
                                    placeholder="name@example.com"
                                    type="email"
                                />

                                <div className="col-span-2">
                                    <Input
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        label="Password"
                                        placeholder="*********"
                                        type="password"
                                    />
                                </div>
                            </div>
                            {error && (
                                <p className={`text-sm text-center p-2 rounded ${
                                    resendSuccess ? "text-green-800 bg-green-50" : "text-red-800 bg-red-50"
                                }`}>
                                    {error}
                                </p>
                            )}
                            {resendAvailable && (
                                <button
                                    type="button"
                                    onClick={handleResendActivation}
                                    disabled={resendLoading || !validateEmail(email.trim().toLowerCase())}
                                    className="w-full text-sm font-medium text-primary underline disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {resendLoading ? "Resending activation email..." : "Resend activation email"}
                                </button>
                            )}

                            <button disabled={isLoading} className={`btn-primary w-full py-3 text-lg font-medium flex items-center justify-center gap-2 ${isLoading ? 'opacity-60 cursor-not-allowed': ''}`} type="submit">
                                {isLoading ? (
                                    <>
                                        <LoaderCircle className="animate-spin w-5 h-5" />
                                        Signing Up...
                                    </>
                                ): (
                                    "SIGN UP"
                                )}
                            </button>

                            <p className="text-sm text-slate-800 text-center mt-6">
                                Already have an account?
                                <Link to="/login" className="font-medium text-primary underline hover:text-primary-dark transition-colors">Login</Link>
                            </p>
                        </form>
                    </div>
                    )}

                </div>


            </div>
        </div>
    )
}

export default Signup;
