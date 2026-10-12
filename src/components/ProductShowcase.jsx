import {assets} from "../assets/assets.js";

const ProductShowcase = () => {
    return (
        <section className="pb-20 md:pb-32">
            <div className="container mx-auto box-border w-full px-8 sm:px-16 md:px-24 lg:px-32">
                <img
                    src={assets.landing}
                    className="box-border block h-auto w-full max-w-full rounded-lg border border-gray-200 object-contain shadow-xl"
                    alt="BudgetAI dashboard showing balances, recent transactions, and financial overview"
                    loading="lazy"
                    decoding="async"
                />
            </div>
        </section>
    );
};

export default ProductShowcase;