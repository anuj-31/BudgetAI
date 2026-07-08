import moment from "moment";
import {Download, Mail} from "lucide-react";
import TransactionInfoCard from "./TransactionInfoCard.jsx";

const ExpenseList = ({ transactions, onDelete, onDownload, onEmail }) => {
    return (
        <div className="card">
            <div className="flex items-center justify-between">
                <h5 className="text-lg">All Expanses</h5>
                <div className="flex items-center justify-end gap-2">
                    <button className="card-btn" onClick={onEmail}>
                        <Mail size={15} className="text-base" /> Email
                    </button>
                    <button className="card-btn" onClick={onDownload}>
                        <Download size={15} className="text-base" /> Download
                    </button>
                </div>
            </div>

            <div className="min-h-[200px] flex items-center">
                {transactions && transactions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 w-full gap-4">
                        {transactions.map((expense) => (
                            <TransactionInfoCard
                                key={expense.id || expense._id}
                                title={expense.name}
                                icon={expense.icon}
                                date={moment(expense.date).format("Do MMM YYYY")}
                                amount={expense.amount}
                                type="expense"
                                onDelete={() => onDelete(expense.id || expense._id)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center w-full">
                        <p className="text-gray-400">No expense records found. Add your first expense to get started!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExpenseList;
