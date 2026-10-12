import Header from "../components/Header.jsx";
import HeroSection from "../components/HeroSection.jsx";
import ProductShowcase from "../components/ProductShowcase.jsx";

const LandingPage = () => {
    return (
        <div className="bg-white font-sans text-gray-800">
            <Header />
            <main>
                <HeroSection/>
                <ProductShowcase />
                <section id="about" className="scroll-mt-24 bg-purple-50 py-16 md:py-24">
                    <div className="container mx-auto max-w-4xl px-6 text-center">
                        <p className="text-sm font-semibold uppercase tracking-widest text-purple-700">About BudgetAI</p>
                        <h2 className="mt-3 text-3xl font-bold text-gray-900 md:text-4xl">
                            Make every money decision with confidence
                        </h2>
                        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-gray-600">
                            BudgetAI brings your income, expenses, and categories together in one simple place.
                            See where your money goes, spot trends, and build habits that move you closer to your goals.
                        </p>
                        <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
                            <article className="rounded-2xl bg-white p-6 shadow-sm">
                                <h3 className="font-semibold text-gray-900">See the full picture</h3>
                                <p className="mt-2 text-sm leading-6 text-gray-600">Review your balance, income, and spending from one dashboard.</p>
                            </article>
                            <article className="rounded-2xl bg-white p-6 shadow-sm">
                                <h3 className="font-semibold text-gray-900">Stay organized</h3>
                                <p className="mt-2 text-sm leading-6 text-gray-600">Track transactions by category and find them with flexible filters.</p>
                            </article>
                            <article className="rounded-2xl bg-white p-6 shadow-sm">
                                <h3 className="font-semibold text-gray-900">Build better habits</h3>
                                <p className="mt-2 text-sm leading-6 text-gray-600">Use clear summaries to make steady progress toward your goals.</p>
                            </article>
                        </div>
                    </div>
                </section>
                <section id="contact" className="scroll-mt-24 py-16 md:py-24">
                    <div className="container mx-auto max-w-3xl px-6 text-center">
                        <p className="text-sm font-semibold uppercase tracking-widest text-purple-700">Contact us</p>
                        <h2 className="mt-3 text-3xl font-bold text-gray-900 md:text-4xl">We’d love to hear from you</h2>
                        <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-gray-600">
                            Have a question, suggestion, or idea for BudgetAI? Get started and use the app to keep your
                            financial journey moving—we’re always looking for ways to make it better.
                        </p>
                        <a
                            href="mailto:x07090301@gmail.com?subject=BudgetAI%20feedback"
                            className="mt-8 inline-flex rounded-lg bg-purple-700 px-6 py-3 font-semibold text-white transition hover:bg-purple-800"
                        >
                            Email us
                        </a>
                    </div>
                </section>
            </main>
            <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-500">
                © {new Date().getFullYear()} BudgetAI. Take control of your finances.
            </footer>
        </div>
    )
}

export default LandingPage;